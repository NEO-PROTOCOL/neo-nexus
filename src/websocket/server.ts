import { WebSocketServer, WebSocket } from 'ws';
import { Server, IncomingMessage } from 'http';
import { URL } from 'url';
import { timingSafeEqual } from 'crypto';
import { Nexus, ProtocolEvent } from '../core/nexus.js';

interface WSClient extends WebSocket {
    isAlive: boolean;
    subscriptions: Set<ProtocolEvent>;
    clientId: string;
}

/**
 * Validates the authentication token against NEXUS_SECRET.
 * Supports token passed via:
 * 1. Query param: ws://host?token=SECRET
 * 2. Protocol header: Sec-WebSocket-Protocol: SECRET
 */
function isAuthenticated(req: IncomingMessage): boolean {
    // In dev mode without secret, allow everything (warn log)
    if (!process.env.NEXUS_SECRET) {
        return true;
    }

    const { NEXUS_SECRET } = process.env;
    let token = '';

    // 1. Check Query Param
    // We need a base for URL constructor, localhost is fine as we only need searchParams
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    if (url.searchParams.has('token')) {
        token = url.searchParams.get('token') || '';
    }

    // 2. Check Protocol Header (common workaround for browser WS)
    // The header might be "json, SECRET" or just "SECRET"
    if (!token && req.headers['sec-websocket-protocol']) {
        const protocols = req.headers['sec-websocket-protocol'].split(',').map(p => p.trim());
        // Simple logic: if any protocol matches the secret, we consume it
        // In reality, we should negotiate the subprotocol, but for auth we just check validity
        const match = protocols.find(p => p === NEXUS_SECRET);
        if (match) token = match;
    }

    if (!token) return false;

    // Constant-time comparison
    try {
        const tokenBuf = Buffer.from(token);
        const secretBuf = Buffer.from(NEXUS_SECRET);

        if (tokenBuf.length !== secretBuf.length) return false;
        return timingSafeEqual(tokenBuf, secretBuf);
    } catch {
        return false;
    }
}

export function setupWebSocketServer(server: Server) {
    // 1. Create WSS with noServer mode so we can handle upgrade manually
    const wss = new WebSocketServer({ noServer: true });

    console.log('[WEBSOCKET] 🔌 WebSocket Server initialized (Secure Mode)');

    // 2. Handle HTTP Upgrade
    server.on('upgrade', (request, socket, head) => {
        // Authenticate BEFORE upgrading
        if (!isAuthenticated(request)) {
            console.warn(`[WEBSOCKET] 🛑 Blocked unauthorized connection from ${request.socket.remoteAddress}`);
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });

    // 3. Connection Handler
    wss.on('connection', (ws: WSClient, req: IncomingMessage) => {
        ws.isAlive = true;
        ws.subscriptions = new Set();
        ws.clientId = req.socket.remoteAddress || 'unknown';

        console.log(`[WEBSOCKET] 🔐 Authenticated client connected from ${ws.clientId}`);

        // Pong handler for heartbeat
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());

                if (message.action === 'subscribe' && Array.isArray(message.events)) {
                    message.events.forEach((event: string) => {
                        if (Object.values(ProtocolEvent).includes(event as ProtocolEvent)) {
                            ws.subscriptions.add(event as ProtocolEvent);
                            console.log(`[WEBSOCKET] Client ${ws.clientId} subscribed to ${event}`);
                        }
                    });

                    ws.send(JSON.stringify({
                        status: 'subscribed',
                        events: Array.from(ws.subscriptions)
                    }));
                }
            } catch (error) {
                console.error('[WEBSOCKET] Error parsing message:', error);
                ws.send(JSON.stringify({ error: 'Invalid message format' }));
            }
        });

        ws.on('close', () => {
            console.log(`[WEBSOCKET] Client ${ws.clientId} disconnected`);
        });
    });

    // Heartbeat interval (30s)
    const interval = setInterval(() => {
        wss.clients.forEach((client) => {
            const ws = client as WSClient;
            if (ws.isAlive === false) return ws.terminate();

            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(interval);
    });

    // Wire up Nexus Event Bus to WebSockets
    // We listen to ALL events on the bus and broadcast to interested clients
    Object.values(ProtocolEvent).forEach((eventType) => {
        Nexus.onEvent(eventType, (payload) => {
            broadcast(wss, eventType, payload);
        });
    });
}

function broadcast(wss: WebSocketServer, event: ProtocolEvent, payload: any) {
    const message = JSON.stringify({
        event,
        payload,
        timestamp: Date.now()
    });

    wss.clients.forEach((client) => {
        const ws = client as WSClient;
        if (ws.readyState === WebSocket.OPEN && ws.subscriptions.has(event)) {
            ws.send(message);
        }
    });
}
