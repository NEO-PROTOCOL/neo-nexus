/**
 * ============================================================================
 *                       NEXUS REACTORS LOADER
 * ============================================================================
 * Loads and initializes all reactors.
 * Each reactor defines the "If This Then That" logic of the protocol.
 */

import * as paymentToMint from './payment-to-mint.js';
import * as mintToNotify from './mint-to-notify.js';

export function loadReactors() {
    console.log('[REACTORS] 🔗 Loading protocol reactors...');

    // Load all reactors
    paymentToMint.setup();
    mintToNotify.setup();

    console.log('[REACTORS] ✅ All reactors loaded');
}
