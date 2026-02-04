import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import eventsRouter from './routes/events.js';
import { loadReactors } from './reactors/index.js';
import { setupWebSocketServer } from './websocket/server.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

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
server.listen(PORT, () => {
    console.log(`[NEXUS] 🚀 Server running on port ${PORT}`);
    console.log(`[NEXUS] 🔗 Event ingress: http://localhost:${PORT}/api/events`);
    console.log(`[NEXUS] 📊 Event log: http://localhost:${PORT}/api/events/log`);
    console.log(`[NEXUS] 🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`[NEXUS] ❤️  Health check: http://localhost:${PORT}/health`);
});
