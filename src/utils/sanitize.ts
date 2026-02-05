/**
 * ============================================================================
 *                       LOG SANITIZATION UTILITIES
 * ============================================================================
 * Prevents sensitive data from being logged.
 */

const SENSITIVE_KEYS = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'privateKey',
    'private_key',
    'authorization',
    'auth',
    'bearer',
    'cookie',
    'session',
    'ssn',
    'creditCard',
    'credit_card',
    'cvv',
    'pin'
];

/**
 * Sanitizes an object by redacting sensitive keys.
 * @param obj - Object to sanitize
 * @returns Sanitized object safe for logging
 */
export function sanitizeForLog(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForLog(item));
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        // Check if key contains sensitive information
        const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
            lowerKey.includes(sensitiveKey.toLowerCase())
        );

        if (isSensitive) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeForLog(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Truncates a string to a maximum length for logging.
 * @param str - String to truncate
 * @param maxLength - Maximum length (default: 200)
 * @returns Truncated string
 */
export function truncateForLog(str: string, maxLength: number = 200): string {
    if (str.length <= maxLength) {
        return str;
    }
    return str.substring(0, maxLength) + '... [truncated]';
}
