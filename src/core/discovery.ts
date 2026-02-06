
/**
 * ============================================================================
 *                    NEXUS SERVICE DISCOVERY
 * ============================================================================
 * Dynamically resolves service URLs from Neobot Ecosystem API.
 * This implements FASE 2: Desacoplamento de Configuração.
 */

interface EcosystemNode {
    id: string;
    hosting?: {
        productionUrl?: string;
    };
}

export class Discovery {
    private static cache: Map<string, string> = new Map();
    private static lastUpdate: number = 0;
    private static CACHE_TTL = 10 * 60 * 1000; // 10 minutes

    /**
     * Resolve a service URL dynamically
     * @param nodeId Service ID (e.g., 'flowpay', 'smart-core')
     * @returns The resolved URL or null
     */
    public static async resolveUrl(nodeId: string): Promise<string | null> {
        // 1. Check Cache
        if (this.cache.has(nodeId) && (Date.now() - this.lastUpdate < this.CACHE_TTL)) {
            return this.cache.get(nodeId) || null;
        }

        // 2. Fetch from Neobot Ecosystem API
        const neobotUrl = process.env.NEOBOT_API_URL || 'https://core.neoprotocol.space';
        const neobotKey = process.env.NEOBOT_API_KEY;

        try {
            console.log(`[DISCOVERY] 🔍 Resolving ${nodeId} via Neobot...`);
            const response = await fetch(`${neobotUrl}/api/ecosystem?id=${nodeId}`, {
                headers: {
                    'Authorization': neobotKey ? `Bearer ${neobotKey}` : ''
                },
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const node = Array.isArray(data) ? data[0] : data;

            if (node && node.hosting?.productionUrl) {
                const url = node.hosting.productionUrl;
                this.cache.set(nodeId, url);
                this.lastUpdate = Date.now();
                console.log(`[DISCOVERY] ✅ Resolved ${nodeId} -> ${url}`);
                return url;
            }
        } catch (err: any) {
            console.warn(`[DISCOVERY] ⚠️ Failed to resolve ${nodeId} via API: ${err.message}. Falling back to ENV.`);
        }

        // 3. Fallback to Environment Variables
        const envKey = `${nodeId.toUpperCase().replace(/-/g, '_')}_API_URL`;
        const fallbackUrl = process.env[envKey];

        if (fallbackUrl) {
            console.log(`[DISCOVERY] ℹ️ Using ENV fallback for ${nodeId} -> ${fallbackUrl}`);
            return fallbackUrl;
        }

        return null;
    }
}
