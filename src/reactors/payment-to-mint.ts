import { Nexus, ProtocolEvent, PaymentPayload, MintPayload } from '../core/nexus.js';

/**
 * ============================================================================
 *                    PAYMENT → MINT REACTOR
 * ============================================================================
 * When FlowPay confirms a payment, this reactor triggers a mint request
 * to the Smart Factory.
 */

export function setup() {
    console.log('[REACTOR] 🔗 Setting up Payment → Mint reactor');

    Nexus.onEvent(ProtocolEvent.PAYMENT_RECEIVED, async (payload: PaymentPayload) => {
        console.log(`[REACTOR] 💰 Payment received: ${payload.transactionId}`);
        console.log(`[REACTOR] 💰 Amount: ${payload.amount} ${payload.currency}`);
        console.log(`[REACTOR] 💰 Payer: ${payload.payerId}`);

        try {
            // Prepare mint request
            const mintRequest: MintPayload = {
                targetAddress: payload.payerId,
                tokenId: 'NEOFLW',
                amount: payload.amount.toString(),
                reason: 'purchase',
                refTransactionId: payload.transactionId
            };

            // Check if Smart Factory API is configured
            const factoryUrl = process.env.FACTORY_API_URL;
            const factoryKey = process.env.FACTORY_API_KEY;

            if (!factoryUrl || !factoryKey) {
                console.warn('[REACTOR] ⚠️  Smart Factory not configured. Dispatching MINT_REQUESTED event only.');
                Nexus.dispatch(ProtocolEvent.MINT_REQUESTED, mintRequest);
                await Nexus.persistEvent(ProtocolEvent.MINT_REQUESTED, mintRequest, 'reactor:payment-to-mint');
                return;
            }

            // Call Smart Factory API
            console.log(`[REACTOR] 📡 Calling Smart Factory: ${factoryUrl}/api/mint`);

            const response = await fetch(`${factoryUrl}/api/mint`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${factoryKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mintRequest)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[REACTOR] ❌ Smart Factory API error:', errorText);

                // TODO: Add to retry queue
                // For now, just log and continue
                return;
            }

            const result = await response.json();
            console.log('[REACTOR] ✅ Mint request accepted by Smart Factory:', result);

            // Dispatch MINT_REQUESTED event
            Nexus.dispatch(ProtocolEvent.MINT_REQUESTED, {
                ...mintRequest,
                factoryResponse: result
            });

            // Persist event
            await Nexus.persistEvent(
                ProtocolEvent.MINT_REQUESTED,
                { ...mintRequest, factoryResponse: result },
                'reactor:payment-to-mint'
            );

        } catch (error) {
            console.error('[REACTOR] ❌ Error processing payment:', error);
            // TODO: Add to retry queue
        }
    });
}
