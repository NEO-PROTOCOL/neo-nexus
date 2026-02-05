import { Router, Request, Response } from 'express';
import { Nexus, ProtocolEvent } from '../core/nexus.js';
import { validateSignature } from '../middleware/auth.js';

const router = Router();

/**
 * ============================================================================
 *                       EVENT INGRESS ENDPOINT
 * ============================================================================
 * Receives events from external nodes (FlowPay, Smart Factory, etc.)
 * and dispatches them to the Nexus Event Bus.
 */

/**
 * POST /events
 * 
 * Receives an event from an external source and dispatches it to the Nexus.
 * 
 * Request Body:
 * {
 *   "event": "FLOWPAY:PAYMENT_RECEIVED",
 *   "payload": { ... }
 * }
 * 
 * Headers:
 * - X-Nexus-Signature: HMAC-SHA256 signature of request body
 */
router.post('/events', validateSignature, async (req: Request, res: Response) => {
    try {
        const { event, payload } = req.body;

        // Validate event type
        if (!event || typeof event !== 'string') {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Missing or invalid "event" field'
            });
            return;
        }

        if (!Object.values(ProtocolEvent).includes(event as ProtocolEvent)) {
            res.status(400).json({
                error: 'Bad Request',
                message: `Invalid event type: ${event}`,
                validEvents: Object.values(ProtocolEvent)
            });
            return;
        }

        if (!payload) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Missing "payload" field'
            });
            return;
        }

        // Validate payload is an object
        if (typeof payload !== 'object' || Array.isArray(payload)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Payload must be an object'
            });
            return;
        }

        // Validate payload size (max 50KB serialized)
        const payloadSize = JSON.stringify(payload).length;
        if (payloadSize > 50 * 1024) {
            res.status(413).json({
                error: 'Payload Too Large',
                message: 'Payload exceeds 50KB limit',
                size: payloadSize
            });
            return;
        }

        // Dispatch to Event Bus
        Nexus.dispatch(event as ProtocolEvent, payload);

        // Persist to database for audit trail
        const eventId = await Nexus.persistEvent(
            event as ProtocolEvent,
            payload,
            req.ip
        );

        res.status(200).json({
            status: 'dispatched',
            event,
            eventId,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('[EVENTS] Error processing event:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to process event'
        });
    }
});

/**
 * GET /events/log
 *
 * Retrieves event log from database.
 *
 * Query Parameters:
 * - limit: Maximum number of events to retrieve (default: 100, max: 1000)
 * - event: Filter by event type (optional)
 *
 * Security: Requires HMAC signature validation
 */
router.get('/events/log', validateSignature, async (req: Request, res: Response) => {
    try {
        const limit = Math.min(
            parseInt(req.query.limit as string) || 100,
            1000
        );
        const eventType = req.query.event as ProtocolEvent | undefined;

        const events = Nexus.getEventLog(limit, eventType);

        res.status(200).json({
            count: events.length,
            limit,
            events: events.map(e => ({
                ...e,
                payload: JSON.parse(e.payload)
            }))
        });
    } catch (error) {
        console.error('[EVENTS] Error retrieving event log:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve event log'
        });
    }
});

export default router;
