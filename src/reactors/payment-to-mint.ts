import { Nexus, ProtocolEvent, PaymentPayload, MintPayload } from '../core/nexus.js';
import { Discovery } from '../core/discovery.js';
import { retryQueue } from '../utils/retry-queue.js';
import { reactorExecutions, reactorDuration, httpCallsTotal, httpCallDuration, retryQueueAdditions } from '../utils/metrics.js';

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
        const endReactor = reactorDuration.startTimer({ reactor: 'payment-to-mint' });
        console.log(`[REACTOR] 💰 Payment confirmed for Order: ${payload.orderId}`);

        // Resolve Smart Factory URL and key outside try block for scope access
        let factoryUrl: string | null = null;
        let factoryKey: string | undefined = undefined;

        try {
            // Resolve Smart Factory URL dynamically
            factoryUrl = await Discovery.resolveUrl('smart-core');
            factoryKey = process.env.FACTORY_API_KEY;

            // Prepare mint request
            const mintRequest: MintPayload = {
                targetAddress: payload.payerId,
                tokenId: 'NEOFLW',
                amount: payload.amount.toString(),
                reason: 'purchase',
                refTransactionId: payload.orderId
            };

            if (!factoryUrl || !factoryKey) {
                console.warn('[REACTOR] ⚠️  Smart Factory not configured (Discovery failed or missing Key). Dispatching MINT_REQUESTED event only.');
                Nexus.dispatch(ProtocolEvent.MINT_REQUESTED, mintRequest);
                await Nexus.persistEvent(ProtocolEvent.MINT_REQUESTED, mintRequest, 'reactor:payment-to-mint');
                reactorExecutions.inc({ reactor: 'payment-to-mint', status: 'skipped' });
                endReactor(); // Stop timer
                return;
            }

            // Call Smart Factory API with timeout
            const targetEndpoint = `${factoryUrl.replace(/\/$/, '')}/api/mint`;
            console.log(`[REACTOR] 📡 Calling Smart Factory: ${targetEndpoint}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            let response;
            const endHttp = httpCallDuration.startTimer({ target: 'smart-factory' });
            try {
                response = await fetch(targetEndpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${factoryKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(mintRequest),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                endHttp(); // Stop HTTP timer
                httpCallsTotal.inc({ target: 'smart-factory', method: 'POST', status_code: response.status.toString() });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('[REACTOR] ❌ Smart Factory API error:', response.status, errorText);

                    // Persist error event for monitoring
                    await Nexus.persistEvent(
                        ProtocolEvent.MINT_REQUESTED,
                        {
                            ...mintRequest,
                            error: {
                                status: response.status,
                                message: errorText.substring(0, 500) // Limit error message size
                            }
                        },
                        'reactor:payment-to-mint:error'
                    );

                    // Add to retry queue
                    await retryQueue.add({
                        taskId: payload.orderId,
                        type: 'MINT_REQUEST',
                        targetUrl: targetEndpoint,
                        payload: mintRequest,
                        headers: {
                            'Authorization': `Bearer ${factoryKey}`,
                            'Content-Type': 'application/json'
                        },
                        maxRetries: 5,
                        nextRetry: Date.now() + 2000 // Retry in 2s
                    });

                    retryQueueAdditions.inc({ type: 'MINT_REQUEST', reason: 'http_error' });
                    reactorExecutions.inc({ reactor: 'payment-to-mint', status: 'retry_queued' });
                    endReactor(); // Stop timer
                    return;
                }
            } catch (fetchError: any) {
                clearTimeout(timeoutId);
                endHttp(); // Stop HTTP timer
                httpCallsTotal.inc({ target: 'smart-factory', method: 'POST', status_code: 'error' });

                const errorType = fetchError.name === 'AbortError' ? 'timeout' : 'network-error';
                const errorMessage = fetchError.name === 'AbortError' ? 'Request timeout' : fetchError.message;
                const retryReason = fetchError.name === 'AbortError' ? 'timeout' : 'network_error';

                console.error(`[REACTOR] ❌ Smart Factory API ${errorType}:`, errorMessage);
                await Nexus.persistEvent(
                    ProtocolEvent.MINT_REQUESTED,
                    { ...mintRequest, error: { message: errorMessage } },
                    `reactor:payment-to-mint:${errorType}`
                );

                // Add to retry queue
                await retryQueue.add({
                    taskId: payload.orderId,
                    type: 'MINT_REQUEST',
                    targetUrl: targetEndpoint,
                    payload: mintRequest,
                    headers: {
                        'Authorization': `Bearer ${factoryKey}`,
                        'Content-Type': 'application/json'
                    },
                    maxRetries: 5,
                    nextRetry: Date.now() + 2000 // Retry in 2s
                });

                retryQueueAdditions.inc({ type: 'MINT_REQUEST', reason: retryReason });
                reactorExecutions.inc({ reactor: 'payment-to-mint', status: 'retry_queued' });
                endReactor(); // Stop timer
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

            reactorExecutions.inc({ reactor: 'payment-to-mint', status: 'success' });
            endReactor(); // Stop timer

        } catch (error: any) {
            console.error('[REACTOR] ❌ Error processing payment:', error);
            reactorExecutions.inc({ reactor: 'payment-to-mint', status: 'error' });
            endReactor(); // Stop timer

            // For unexpected errors, also add to retry queue
            if (factoryUrl && factoryKey) {
                await retryQueue.add({
                    taskId: payload.orderId,
                    type: 'MINT_REQUEST',
                    targetUrl: `${factoryUrl}/api/mint`,
                    payload: {
                        targetAddress: payload.payerId,
                        tokenId: 'NEOFLW',
                        amount: payload.amount.toString(),
                        reason: 'purchase',
                        refTransactionId: payload.orderId
                    },
                    headers: {
                        'Authorization': `Bearer ${factoryKey}`,
                        'Content-Type': 'application/json'
                    },
                    maxRetries: 5,
                    nextRetry: Date.now() + 2000
                });
            }
        }
    });
}
