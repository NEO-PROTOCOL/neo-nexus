/**
 * ============================================================================
 *                       METRICS ROUTE
 * ============================================================================
 * Prometheus metrics endpoint
 */

import express from 'express';
import { getMetricsRegistry, updateRetryQueueMetrics } from '../utils/metrics.js';
import { retryQueue } from '../utils/retry-queue.js';

const router = express.Router();

/**
 * GET /metrics
 * Prometheus metrics endpoint (compatible with Prometheus scraping)
 */
router.get('/', async (_req, res) => {
    try {
        // Update retry queue metrics before exposing
        const stats = retryQueue.getStats();
        updateRetryQueueMetrics(stats);

        // Get metrics in Prometheus format
        const registry = getMetricsRegistry();
        res.set('Content-Type', registry.contentType);
        res.end(await registry.metrics());
    } catch (error: any) {
        console.error('[METRICS] Error generating metrics:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
