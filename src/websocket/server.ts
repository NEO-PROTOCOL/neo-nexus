import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Nexus, ProtocolEvent } from '../core/nexus.js';

interface SubscriptionMessage {
    action: 'subscribe';
    events: ProtocolEvent[];
}

interface WSClient extends WebSocket {
    isAlive: boolean;
    subscriptions: Set<ProtocolEvent>;
}

export function setupWebSocketServer(server: Server) {
    const wss = new WebSocketServer({ server });

    console.log('[WEBSOCKET] 🔌 WebSocket Server initialized');

    wss.on('connection', (ws: WSClient) => {
        ws.isAlive = true;
        ws.subscriptions = new Set();

        console.log('[WEBSOCKET] New client connected');

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
                            console.log(`[WEBSOCKET] Client subscribed to ${event}`);
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
            console.log('[WEBSOCKET] Client disconnected');
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
