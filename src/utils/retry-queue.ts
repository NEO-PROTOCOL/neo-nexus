/**
 * ============================================================================
 *                       RETRY QUEUE SYSTEM
 * ============================================================================
 * Handles automatic retry of failed operations with exponential backoff.
 *
 * Features:
 * - Exponential backoff (1s, 2s, 4s, 8s, 16s)
 * - Max 5 retries before moving to Dead Letter Queue
 * - Persistent queue in SQLite
 * - Background processing
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface RetryTask {
    id?: number;
    taskId: string;           // Unique ID (e.g., orderId)
    type: 'MINT_REQUEST' | 'WEBHOOK_CALL';
    targetUrl: string;
    payload: any;
    headers?: Record<string, string>;
    attempts: number;
    maxRetries: number;
    nextRetry: number;        // Unix timestamp
    lastError?: string;
    createdAt: number;
    updatedAt: number;
}

export class RetryQueue {
    private static instance: RetryQueue;
    private db: Database.Database;
    private processingInterval?: NodeJS.Timeout;
    private isProcessing = false;

    private constructor() {
        this.db = this.initDatabase();
        this.startBackgroundProcessor();
    }

    public static getInstance(): RetryQueue {
        if (!RetryQueue.instance) {
            RetryQueue.instance = new RetryQueue();
        }
        return RetryQueue.instance;
    }

    private initDatabase(): Database.Database {
        const dataDir = process.env.DATA_DIR || './data';
        if (!existsSync(dataDir)) {
            mkdirSync(dataDir, { recursive: true });
        }

        const dbPath = join(dataDir, 'nexus.db');
        const db = new Database(dbPath);

        // Create retry_queue table
        db.exec(`
            CREATE TABLE IF NOT EXISTS retry_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT UNIQUE NOT NULL,
                type TEXT NOT NULL,
                target_url TEXT NOT NULL,
                payload TEXT NOT NULL,
                headers TEXT,
                attempts INTEGER DEFAULT 0,
                max_retries INTEGER DEFAULT 5,
                next_retry INTEGER NOT NULL,
                last_error TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_next_retry ON retry_queue(next_retry);
            CREATE INDEX IF NOT EXISTS idx_type ON retry_queue(type);
        `);

        // Create dead_letter_queue table
        db.exec(`
            CREATE TABLE IF NOT EXISTS dead_letter_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                type TEXT NOT NULL,
                target_url TEXT NOT NULL,
                payload TEXT NOT NULL,
                headers TEXT,
                attempts INTEGER NOT NULL,
                final_error TEXT,
                created_at INTEGER NOT NULL,
                failed_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_dlq_type ON dead_letter_queue(type);
            CREATE INDEX IF NOT EXISTS idx_dlq_failed_at ON dead_letter_queue(failed_at);
        `);

        console.log('[RETRY_QUEUE] 💾 Database initialized');
        return db;
    }

    /**
     * Add a task to the retry queue
     */
    public async add(task: Omit<RetryTask, 'id' | 'attempts' | 'createdAt' | 'updatedAt'>): Promise<void> {
        const now = Date.now();
        const nextRetry = task.nextRetry || now + 1000; // Default 1s delay

        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO retry_queue
                (task_id, type, target_url, payload, headers, attempts, max_retries, next_retry, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
            `);

            stmt.run(
                task.taskId,
                task.type,
                task.targetUrl,
                JSON.stringify(task.payload),
                task.headers ? JSON.stringify(task.headers) : null,
                task.maxRetries || 5,
                nextRetry,
                now,
                now
            );

            console.log(`[RETRY_QUEUE] ➕ Added task: ${task.taskId} (type: ${task.type})`);
        } catch (error: any) {
            console.error('[RETRY_QUEUE] ❌ Error adding task:', error.message);
            throw error;
        }
    }

    /**
     * Process pending retry tasks
     */
    private async processPendingTasks(): Promise<void> {
        if (this.isProcessing) {
            return; // Avoid concurrent processing
        }

        this.isProcessing = true;
        const now = Date.now();

        try {
            // Get tasks ready for retry
            const stmt = this.db.prepare(`
                SELECT * FROM retry_queue
                WHERE next_retry <= ?
                ORDER BY next_retry ASC
                LIMIT 10
            `);

            const tasks = stmt.all(now) as any[];

            for (const taskRow of tasks) {
                const task: RetryTask = {
                    id: taskRow.id,
                    taskId: taskRow.task_id,
                    type: taskRow.type,
                    targetUrl: taskRow.target_url,
                    payload: JSON.parse(taskRow.payload),
                    headers: taskRow.headers ? JSON.parse(taskRow.headers) : undefined,
                    attempts: taskRow.attempts,
                    maxRetries: taskRow.max_retries,
                    nextRetry: taskRow.next_retry,
                    lastError: taskRow.last_error,
                    createdAt: taskRow.created_at,
                    updatedAt: taskRow.updated_at
                };

                await this.processTask(task);
            }
        } catch (error: any) {
            console.error('[RETRY_QUEUE] ❌ Error processing tasks:', error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process a single retry task
     */
    private async processTask(task: RetryTask): Promise<void> {
        console.log(`[RETRY_QUEUE] 🔄 Processing task: ${task.taskId} (attempt ${task.attempts + 1}/${task.maxRetries})`);

        try {
            // Execute the HTTP request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(task.targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...task.headers
                },
                body: JSON.stringify(task.payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
            }

            // Success! Remove from retry queue
            this.removeTask(task.taskId);
            console.log(`[RETRY_QUEUE] ✅ Task completed: ${task.taskId}`);

        } catch (error: any) {
            const newAttempts = task.attempts + 1;
            const errorMessage = error.message || 'Unknown error';

            if (newAttempts >= task.maxRetries) {
                // Move to Dead Letter Queue
                this.moveToDeadLetterQueue(task, errorMessage);
                console.error(`[RETRY_QUEUE] 💀 Task failed permanently: ${task.taskId} - ${errorMessage}`);
            } else {
                // Schedule retry with exponential backoff
                const backoffSeconds = Math.pow(2, newAttempts); // 2^1=2s, 2^2=4s, 2^3=8s, 2^4=16s
                const nextRetry = Date.now() + (backoffSeconds * 1000);

                this.updateTask(task.taskId, {
                    attempts: newAttempts,
                    nextRetry,
                    lastError: errorMessage
                });

                console.log(`[RETRY_QUEUE] ⏰ Retry scheduled: ${task.taskId} in ${backoffSeconds}s`);
            }
        }
    }

    /**
     * Update task retry info
     */
    private updateTask(taskId: string, updates: { attempts: number; nextRetry: number; lastError: string }): void {
        const stmt = this.db.prepare(`
            UPDATE retry_queue
            SET attempts = ?, next_retry = ?, last_error = ?, updated_at = ?
            WHERE task_id = ?
        `);

        stmt.run(
            updates.attempts,
            updates.nextRetry,
            updates.lastError,
            Date.now(),
            taskId
        );
    }

    /**
     * Remove task from retry queue
     */
    private removeTask(taskId: string): void {
        const stmt = this.db.prepare('DELETE FROM retry_queue WHERE task_id = ?');
        stmt.run(taskId);
    }

    /**
     * Move task to Dead Letter Queue
     */
    private moveToDeadLetterQueue(task: RetryTask, finalError: string): void {
        try {
            // Insert into DLQ
            const insertStmt = this.db.prepare(`
                INSERT INTO dead_letter_queue
                (task_id, type, target_url, payload, headers, attempts, final_error, created_at, failed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            insertStmt.run(
                task.taskId,
                task.type,
                task.targetUrl,
                JSON.stringify(task.payload),
                task.headers ? JSON.stringify(task.headers) : null,
                task.attempts,
                finalError,
                task.createdAt,
                Date.now()
            );

            // Remove from retry queue
            this.removeTask(task.taskId);

        } catch (error: any) {
            console.error('[RETRY_QUEUE] ❌ Error moving to DLQ:', error.message);
        }
    }

    /**
     * Start background processor
     */
    private startBackgroundProcessor(): void {
        // Process every 5 seconds
        this.processingInterval = setInterval(() => {
            this.processPendingTasks().catch((error) => {
                console.error('[RETRY_QUEUE] ❌ Background processor error:', error);
            });
        }, 5000);

        console.log('[RETRY_QUEUE] 🔄 Background processor started (interval: 5s)');
    }

    /**
     * Stop background processor (for graceful shutdown)
     */
    public stop(): void {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            console.log('[RETRY_QUEUE] 🛑 Background processor stopped');
        }
    }

    /**
     * Get retry queue stats
     */
    public getStats(): {
        pending: number;
        deadLetters: number;
        oldestRetry?: number;
    } {
        const pendingStmt = this.db.prepare('SELECT COUNT(*) as count FROM retry_queue');
        const dlqStmt = this.db.prepare('SELECT COUNT(*) as count FROM dead_letter_queue');
        const oldestStmt = this.db.prepare('SELECT MIN(next_retry) as oldest FROM retry_queue');

        const pending = (pendingStmt.get() as any).count;
        const deadLetters = (dlqStmt.get() as any).count;
        const oldest = (oldestStmt.get() as any).oldest;

        return { pending, deadLetters, oldestRetry: oldest };
    }

    /**
     * Get Dead Letter Queue entries
     */
    public getDeadLetters(limit: number = 50): any[] {
        const stmt = this.db.prepare(`
            SELECT * FROM dead_letter_queue
            ORDER BY failed_at DESC
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    }
}

// Export singleton
export const retryQueue = RetryQueue.getInstance();
