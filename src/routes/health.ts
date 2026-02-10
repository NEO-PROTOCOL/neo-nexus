/**
 * ============================================================================
 *                       HEALTH CHECK ROUTES
 * ============================================================================
 * Detailed health check for monitoring and alerting
 */

import express from 'express';
import { retryQueue } from '../utils/retry-queue.js';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

const router = express.Router();

/**
 * GET /health
 * Basic health check (fast, minimal)
 */
router.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

/**
 * GET /health/detailed
 * Detailed health check with all subsystems
 */
router.get('/detailed', (_req, res) => {
    try {
        const stats = retryQueue.getStats();

        // Check database
        const dataDir = process.env.DATA_DIR || './data';
        const dbPath = join(dataDir, 'nexus.db');
        const dbExists = existsSync(dbPath);
        const dbSize = dbExists ? statSync(dbPath).size : 0;

        // Memory usage
        const memUsage = process.memoryUsage();

        // Check environment variables
        const envCheck = {
            NEXUS_SECRET: !!process.env.NEXUS_SECRET,
            ALLOWED_ORIGINS: !!process.env.ALLOWED_ORIGINS,
            FACTORY_API_KEY: !!process.env.FACTORY_API_KEY,
            NEOBOT_API_KEY: !!process.env.NEOBOT_API_KEY
        };

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: {
                seconds: Math.floor(process.uptime()),
                formatted: formatUptime(process.uptime())
            },
            database: {
                connected: dbExists,
                size: dbSize,
                sizeFormatted: formatBytes(dbSize)
            },
            retryQueue: {
                pending: stats.pending,
                deadLetters: stats.deadLetters,
                oldestRetry: stats.oldestRetry ? new Date(stats.oldestRetry).toISOString() : null,
                health: stats.pending < 100 ? 'healthy' : stats.pending < 500 ? 'warning' : 'critical'
            },
            memory: {
                rss: formatBytes(memUsage.rss),
                heapTotal: formatBytes(memUsage.heapTotal),
                heapUsed: formatBytes(memUsage.heapUsed),
                external: formatBytes(memUsage.external)
            },
            environment: {
                nodeEnv: process.env.NODE_ENV || 'development',
                nodeVersion: process.version,
                configuredVars: envCheck,
                allConfigured: Object.values(envCheck).every(Boolean)
            }
        };

        // Determine overall status
        const hasIssues = !health.database.connected ||
                         stats.pending > 500 ||
                         !health.environment.allConfigured;

        if (hasIssues) {
            health.status = 'degraded';
        }

        res.json(health);
    } catch (error: any) {
        console.error('[HEALTH] Error generating detailed health check:', error);
        res.status(500).json({
            status: 'error',
            error: 'Failed to generate health check',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /health/ready
 * Kubernetes-style readiness probe
 */
router.get('/ready', (_req, res) => {
    try {
        const stats = retryQueue.getStats();

        // Check if system is ready to serve traffic
        const isReady = stats.pending < 1000 && !!process.env.NEXUS_SECRET;

        if (isReady) {
            res.status(200).json({ ready: true });
        } else {
            res.status(503).json({
                ready: false,
                reason: stats.pending >= 1000 ? 'retry_queue_overloaded' : 'missing_config'
            });
        }
    } catch (error) {
        res.status(503).json({ ready: false, reason: 'internal_error' });
    }
});

/**
 * GET /health/live
 * Kubernetes-style liveness probe
 */
router.get('/live', (_req, res) => {
    // Simple liveness check - if we can respond, we're alive
    res.status(200).json({ live: true });
});

// Helper functions
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default router;
