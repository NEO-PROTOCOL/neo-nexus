
import { Nexus, ProtocolEvent } from '../core/nexus.js';
import { signPayload } from '../utils/crypto.js';
import { Discovery } from '../core/discovery.js';

/**
 * ============================================================================
 *                    MINT → NOTIFY REACTOR
 * ============================================================================
 * When Smart Factory confirms a mint, this reactor:
 * 1. Notifies FlowPay to settle the order
 * 2. Notifies Neobot to send WhatsApp/Telegram messages
 */

export function setup() {
    console.log('[REACTOR] 🔗 Setting up Mint → Notify reactor');

    // Handle MINT_CONFIRMED
    Nexus.onEvent(ProtocolEvent.MINT_CONFIRMED, async (payload: any) => {
        const { orderId } = payload;
        console.log(`[REACTOR] ✅ Mint confirmed for Order: ${orderId}. Propagating notifications...`);

        // 1. Notify FlowPay (Settle)
        await notifyNode('flowpay', ProtocolEvent.MINT_CONFIRMED, payload);

        // 2. Notify Neobot (WhatsApp Notification)
        await notifyNode('smart-core', ProtocolEvent.MINT_CONFIRMED, payload); // Just logging
        await notifyNode('neobot', ProtocolEvent.MINT_CONFIRMED, payload);
    });

    // Handle MINT_FAILED
    Nexus.onEvent(ProtocolEvent.MINT_FAILED, async (payload: any) => {
        const { orderId } = payload;
        console.warn(`[REACTOR] ❌ Mint failed for Order: ${orderId}. Notifying FlowPay...`);

        // Notify FlowPay about the failure
        await notifyNode('flowpay', ProtocolEvent.MINT_FAILED, payload);
    });
}

/**
 * Helper to notify a specific node via Webhook
 */
async function notifyNode(nodeId: string, event: ProtocolEvent, payload: any) {
    const NEXUS_SECRET = process.env.NEXUS_SECRET;
    if (!NEXUS_SECRET) {
        console.error('[REACTOR] ❌ NEXUS_SECRET not configured. Cannot sign outbound webhooks.');
        return;
    }

    // Resolve URL dynamically from Neobot Ecosystem API
    const baseUri = await Discovery.resolveUrl(nodeId);

    if (!baseUri) {
        console.warn(`[REACTOR] ⚠️ No URL found for node: ${nodeId}. skipping notification.`);
        return;
    }

    // Append webhook path
    const nodeUrl = `${baseUri.replace(/\/$/, '')}/api/webhook/nexus`;

    const signedPayload = {
        event,
        payload,
        timestamp: new Date().toISOString()
    };

    const signature = signPayload(signedPayload, NEXUS_SECRET);

    try {
        console.log(`[REACTOR] 📤 Notifying ${nodeId} (${nodeUrl}) about ${event}`);

        const response = await fetch(nodeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Nexus-Signature': signature
            },
            body: JSON.stringify({
                event,
                payload,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[REACTOR] ❌ Failed to notify ${nodeId}: ${response.status}`, errorText);
        } else {
            console.log(`[REACTOR] ✅ ${nodeId} notified successfully`);
        }
    } catch (err: any) {
        console.error(`[REACTOR] ❌ Error notifying ${nodeId}:`, err.message);
    }
}
