/**
 * ============================================================================
 *                       NEXUS REACTORS LOADER
 * ============================================================================
 * Loads and initializes all reactors.
 * Each reactor defines the "If This Then That" logic of the protocol.
 */

import * as paymentToMint from './payment-to-mint.js';

export function loadReactors() {
    console.log('[REACTORS] 🔗 Loading protocol reactors...');

    // Load all reactors
    paymentToMint.setup();

    console.log('[REACTORS] ✅ All reactors loaded');
}
