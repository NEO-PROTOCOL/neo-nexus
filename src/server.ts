import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import eventsRouter from './routes/events.js';
import webhooksRouter from './routes/webhooks.js';
import { loadReactors } from './reactors/index.js';
import { setupWebSocketServer } from './websocket/server.js';

dotenv.config();

// Security Check in Production
if (process.env.NODE_ENV === 'production' && !process.env.NEXUS_SECRET) {
    console.error('❌ [FATAL] NEXUS_SECRET is required in production! Exiting...');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

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
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Nexus-Signature');
    }

    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }

    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

// Event routes
app.use('/api', eventsRouter);
app.use('/api/webhooks', webhooksRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    console.log(`[NEXUS] 🔌 WebSocket: ws://0.0.0.0:${PORT}`);
    console.log(`[NEXUS] ❤️  Health check: http://0.0.0.0:${PORT}/health`);
});
