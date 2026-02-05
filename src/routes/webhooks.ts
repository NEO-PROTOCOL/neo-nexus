import { Router, Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { Nexus, ProtocolEvent } from '../core/nexus.js';

const router = Router();

/**
 * Middleware para validar assinaturas específicas do FlowPay
 */
const validateFlowPaySignature = (req: Request, res: Response, next: any) => {
    // Ajustado para ser compatível com o header enviado pelo agente FlowPay
    const signature = (req.headers['x-nexus-signature'] || req.headers['x-flowpay-signature']) as string;
    const secret = process.env.NEXUS_SECRET; // Usando a chave mestra para facilitação na Phase 1

    if (!secret) {
        console.warn('[WEBHOOK] ⚠️ FLOWPAY_WEBHOOK_SECRET not set. Skipping validation (UNSAFE).');
        return next();
    }

    if (!signature) {
        return res.status(401).json({ error: 'Missing X-FlowPay-Signature' });
    }

    const hmac = createHmac('sha256', secret);
    const bodyStr = JSON.stringify(req.body);
    const expectedSignature = hmac.update(bodyStr).digest('hex');

    try {
        const isValid = timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );

        if (!isValid) {
            console.error('[WEBHOOK] ❌ Invalid FlowPay signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }
    } catch {
        return res.status(401).json({ error: 'Auth failed' });
    }

    next();
};

/**
 * Endpoint: POST /api/webhooks/flowpay
 * Recebe notificações de pagamento e dispara eventos no Nexus
 */
router.post('/flowpay', validateFlowPaySignature, (req: Request, res: Response) => {
    const { orderId, amount, currency, payerId, status, metadata } = req.body;

    console.log(`[WEBHOOK] 💰 FlowPay notification for Order ${orderId}: ${status}`);

    if (status === 'confirmed' || status === 'completed') {
        const payload = {
            orderId,
            amount,
            currency,
            payerId,
            txHash: metadata?.txHash,
            timestamp: Date.now()
        };

        // Dispara o evento central no barramento do Nexus
        Nexus.dispatch(ProtocolEvent.PAYMENT_RECEIVED, payload);

        return res.status(200).json({ status: 'processed', event: 'PAYMENT_RECEIVED' });
    }

    if (status === 'failed') {
        Nexus.dispatch(ProtocolEvent.PAYMENT_FAILED, { orderId, reason: metadata?.reason });
        return res.status(200).json({ status: 'processed', event: 'PAYMENT_FAILED' });
    }

    res.status(200).json({ status: 'ignored', reason: 'unhandled_status' });
});

/**
 * Endpoint: POST /api/webhooks/factory
 * Recebe confirmação de deploy/mint da Smart Factory
 */
router.post('/factory', validateFlowPaySignature, (req: Request, res: Response) => {
    const { contractAddress, status, metadata } = req.body;

    console.log(`[WEBHOOK] 🏗️ Factory notification: ${status} for ${contractAddress || 'new_contract'}`);

    if (status === 'deployed' || status === 'confirmed') {
        const payload = {
            contractAddress,
            txHash: metadata?.txHash,
            timestamp: Date.now()
        };

        // Dispara MINT_CONFIRMED no Nexus
        Nexus.dispatch(ProtocolEvent.MINT_CONFIRMED, payload);

        return res.status(200).json({ status: 'processed', event: 'MINT_CONFIRMED' });
    }

    res.status(200).json({ status: 'ignored', reason: 'unhandled_status' });
});

export default router;
