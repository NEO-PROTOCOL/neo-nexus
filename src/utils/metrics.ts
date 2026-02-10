/**
 * ============================================================================
 *                       PROMETHEUS METRICS
 * ============================================================================
 * Observability metrics for monitoring Nexus performance and health
 */

import { register, Counter, Histogram, Gauge } from 'prom-client';

// ============================================================================
// COUNTERS (Monotonically increasing)
// ============================================================================

/**
 * Total number of events received by type
 */
export const eventsTotal = new Counter({
    name: 'nexus_events_total',
    help: 'Total number of events received',
    labelNames: ['event_type', 'source']
});

/**
 * Total number of reactor executions
 */
export const reactorExecutions = new Counter({
    name: 'nexus_reactor_executions_total',
    help: 'Total number of reactor executions',
    labelNames: ['reactor', 'status'] // status: success | error
});

/**
 * Total number of HTTP calls made by reactors
 */
export const httpCallsTotal = new Counter({
    name: 'nexus_http_calls_total',
    help: 'Total number of HTTP calls made',
    labelNames: ['target', 'method', 'status_code']
});

/**
 * Total number of retry queue additions
 */
export const retryQueueAdditions = new Counter({
    name: 'nexus_retry_queue_additions_total',
    help: 'Total number of tasks added to retry queue',
    labelNames: ['type', 'reason'] // reason: http_error | timeout | network_error
});

/**
 * Total number of dead letter queue additions
 */
export const deadLetterQueueAdditions = new Counter({
    name: 'nexus_dead_letter_queue_additions_total',
    help: 'Total number of tasks moved to dead letter queue',
    labelNames: ['type']
});

// ============================================================================
// HISTOGRAMS (Response times, durations)
// ============================================================================

/**
 * Reactor execution duration
 */
export const reactorDuration = new Histogram({
    name: 'nexus_reactor_duration_seconds',
    help: 'Reactor execution duration in seconds',
    labelNames: ['reactor'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30] // 100ms, 500ms, 1s, 2s, 5s, 10s, 30s
});

/**
 * HTTP call duration
 */
export const httpCallDuration = new Histogram({
    name: 'nexus_http_call_duration_seconds',
    help: 'HTTP call duration in seconds',
    labelNames: ['target'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

/**
 * Event persistence duration
 */
export const eventPersistDuration = new Histogram({
    name: 'nexus_event_persist_duration_seconds',
    help: 'Event persistence duration in seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5] // 1ms, 5ms, 10ms, 50ms, 100ms, 500ms
});

// ============================================================================
// GAUGES (Current values that can go up or down)
// ============================================================================

/**
 * Current number of tasks in retry queue
 */
export const retryQueueSize = new Gauge({
    name: 'nexus_retry_queue_size',
    help: 'Current number of tasks in retry queue'
});

/**
 * Current number of tasks in dead letter queue
 */
export const deadLetterQueueSize = new Gauge({
    name: 'nexus_dead_letter_queue_size',
    help: 'Current number of tasks in dead letter queue'
});

/**
 * Current number of WebSocket connections
 */
export const websocketConnections = new Gauge({
    name: 'nexus_websocket_connections',
    help: 'Current number of active WebSocket connections'
});

/**
 * Database size in bytes
 */
export const databaseSize = new Gauge({
    name: 'nexus_database_size_bytes',
    help: 'Database size in bytes'
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Update retry queue gauges
 */
export function updateRetryQueueMetrics(stats: { pending: number; deadLetters: number }) {
    retryQueueSize.set(stats.pending);
    deadLetterQueueSize.set(stats.deadLetters);
}

/**
 * Get metrics registry
 */
export function getMetricsRegistry() {
    return register;
}

/**
 * Clear all metrics (useful for testing)
 */
export function clearMetrics() {
    register.clear();
}
