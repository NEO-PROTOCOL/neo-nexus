
import { createHmac } from 'crypto';

/**
 * Sign a payload using HMAC-SHA256
 * @param payload The data to sign
 * @param secret The secret key
 * @returns hex signature
 */
export function signPayload(payload: any, secret: string): string {
    const bodyStr = JSON.stringify(payload);
    return createHmac('sha256', secret)
        .update(bodyStr)
        .digest('hex');
}
