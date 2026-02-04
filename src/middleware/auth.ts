import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * ============================================================================
 *                       NEXUS HMAC AUTHENTICATION
 * ============================================================================
 * Validates webhook signatures to ensure requests come from trusted sources.
 * 
 * Required Header: X-Nexus-Signature
 * Algorithm: HMAC-SHA256
 * Secret: NEXUS_SECRET environment variable
 */

const NEXUS_SECRET = process.env.NEXUS_SECRET;

if (!NEXUS_SECRET) {
    console.warn('[AUTH] WARNING: NEXUS_SECRET not set. Authentication disabled!');
}

/**
 * Middleware to validate HMAC signature on incoming requests.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function validateSignature(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Skip validation if NEXUS_SECRET is not configured (dev mode)
    if (!NEXUS_SECRET) {
        console.warn('[AUTH] Skipping signature validation (NEXUS_SECRET not set)');
        return next();
    }

    const signature = req.headers['x-nexus-signature'] as string;

    if (!signature) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing X-Nexus-Signature header'
        });
        return;
    }

    // Compute expected signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = createHmac('sha256', NEXUS_SECRET)
        .update(payload)
        .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid signature'
        });
        return;
    }

    const isValid = timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
        console.error('[AUTH] Invalid signature from:', req.ip);
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid signature'
        });
        return;
    }

    console.log('[AUTH] ✓ Valid signature from:', req.ip);
    next();
}

/**
 * Helper function to generate HMAC signature for outbound requests.
 * Use this when Nexus needs to call other services.
 * 
 * @param payload - Object to sign
 * @param secret - HMAC secret (defaults to NEXUS_SECRET)
 * @returns Hex-encoded HMAC-SHA256 signature
 */
export function generateSignature(
    payload: object,
    secret: string = NEXUS_SECRET || ''
): string {
    const payloadString = JSON.stringify(payload);
    return createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex');
}
