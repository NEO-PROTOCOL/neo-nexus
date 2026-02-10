/**
 * ============================================================================
 *                       RETRY QUEUE ROUTES
 * ============================================================================
 * API endpoints for monitoring and managing retry queue
 */

import express from 'express';
import { retryQueue } from '../utils/retry-queue.js';

const router = express.Router();

/**
 * GET /api/retry/stats
 * Get retry queue statistics
 */
router.get('/stats', (_req, res) => {
    try {
        const stats = retryQueue.getStats();
        res.json({
            success: true,
            stats: {
                pending: stats.pending,
                deadLetters: stats.deadLetters,
                oldestRetry: stats.oldestRetry ? new Date(stats.oldestRetry).toISOString() : null
            }
        });
    } catch (error: any) {
        console.error('[RETRY_API] Error getting stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/retry/dead-letters
 * Get Dead Letter Queue entries
 */
router.get('/dead-letters', (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const entries = retryQueue.getDeadLetters(limit);

        res.json({
            success: true,
            count: entries.length,
            deadLetters: entries.map((entry) => ({
                id: entry.id,
                taskId: entry.task_id,
                type: entry.type,
                targetUrl: entry.target_url,
                payload: JSON.parse(entry.payload),
                attempts: entry.attempts,
                finalError: entry.final_error,
                createdAt: new Date(entry.created_at).toISOString(),
                failedAt: new Date(entry.failed_at).toISOString()
            }))
        });
    } catch (error: any) {
        console.error('[RETRY_API] Error getting dead letters:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;
