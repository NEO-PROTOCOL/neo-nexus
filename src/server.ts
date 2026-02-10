import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import eventsRouter from './routes/events.js';
import webhooksRouter from './routes/webhooks.js';
import retryRouter from './routes/retry.js';
import metricsRouter from './routes/metrics.js';
import healthRouter from './routes/health.js';
import { loadReactors } from './reactors/index.js';
import { setupWebSocketServer } from './websocket/server.js';
import { retryQueue } from './utils/retry-queue.js';

dotenv.config();

// Security Check in Production
if (process.env.NODE_ENV === 'production') {
    const requiredEnvVars = ['NEXUS_SECRET', 'ALLOWED_ORIGINS'];
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        console.error(`❌ [FATAL] Missing required environment variables in production: ${missing.join(', ')}`);
        process.exit(1);
    }

    // Validate NEXUS_SECRET strength (minimum 32 chars)
    if (process.env.NEXUS_SECRET && process.env.NEXUS_SECRET.length < 32) {
        console.error('❌ [FATAL] NEXUS_SECRET must be at least 32 characters in production!');
        process.exit(1);
    }

    console.log('✅ [SECURITY] Production environment validated');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware - Enhanced Helmet Configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny'
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    }
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to all requests
app.use(limiter);

// Middleware
app.use(express.json({ limit: '100kb' })); // Limit body size

// CORS - Restrict to known origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

// Warn if CORS is too permissive in production
if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    console.warn('[SECURITY] ⚠️  ALLOWED_ORIGINS not set in production! CORS will be restrictive by default.');
}

app.use((req, res, next) => {
    const origin = req.headers.origin;

    // In production, only allow explicitly listed origins
    // In development, allow localhost if no origins configured
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isOriginAllowed = origin && (
        allowedOrigins.includes(origin) ||
        (isDevelopment && allowedOrigins.length === 0)
    );

    if (isOriginAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Nexus-Signature');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') {
        res.sendStatus(isOriginAllowed ? 204 : 403);
        return;
    }

    next();
});

// Health routes
app.use('/health', healthRouter);

// Event routes
app.use('/api', eventsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/retry', retryRouter);

// Metrics endpoint (Prometheus compatible)
app.use('/metrics', metricsRouter);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[SERVER] Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
});

// Initialize Nexus Reactors
loadReactors();



const server = createServer(app);

// Initialize WebSocket Server
setupWebSocketServer(server);

// Start server
server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[NEXUS] 🚀 Server running on port ${PORT}`);
    console.log(`[NEXUS] 🔗 Event ingress: http://0.0.0.0:${PORT}/api/events`);
    console.log(`[NEXUS] 📊 Event log: http://0.0.0.0:${PORT}/api/events/log`);
    console.log(`[NEXUS] 🔄 Retry stats: http://0.0.0.0:${PORT}/api/retry/stats`);
    console.log(`[NEXUS] 💀 Dead letters: http://0.0.0.0:${PORT}/api/retry/dead-letters`);
    console.log(`[NEXUS] 🔌 WebSocket: ws://0.0.0.0:${PORT}`);
    console.log(`[NEXUS] ❤️  Health: http://0.0.0.0:${PORT}/health`);
    console.log(`[NEXUS] 🏥 Health (detailed): http://0.0.0.0:${PORT}/health/detailed`);
    console.log(`[NEXUS] 📈 Metrics (Prometheus): http://0.0.0.0:${PORT}/metrics`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[NEXUS] 🛑 SIGTERM received, shutting down gracefully...');
    retryQueue.stop();
    server.close(() => {
        console.log('[NEXUS] ✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('[NEXUS] 🛑 SIGINT received, shutting down gracefully...');
    retryQueue.stop();
    server.close(() => {
        console.log('[NEXUS] ✅ Server closed');
        process.exit(0);
    });
});
