
import EventEmitter from "events";

/**
 * ============================================================================
 *                       PROTOCOL NEXUS - EVENT BUS
 * ============================================================================
 * The central nervous system of the NEØ Protocol.
 * routes events between Sovereign Nodes (FlowPay, Factory, Fluxx, MIO).
 */

// --- 1. Event Definitions ---

export enum ProtocolEvent {
    // FlowPay Events
    PAYMENT_RECEIVED = "FLOWPAY:PAYMENT_RECEIVED",
    PAYMENT_FAILED = "FLOWPAY:PAYMENT_FAILED",

    // Smart Factory Events
    MINT_REQUESTED = "FACTORY:MINT_REQUESTED",
    MINT_CONFIRMED = "FACTORY:MINT_CONFIRMED", // On-Chain Success
    CONTRACT_DEPLOYED = "FACTORY:CONTRACT_DEPLOYED",

    // Fluxx Governance Events
    PROPOSAL_CREATED = "FLUXX:PROPOSAL_CREATED",
    VOTE_CAST = "FLUXX:VOTE_CAST",

    // MIO Identity Events
    IDENTITY_VERIFIED = "MIO:IDENTITY_VERIFIED",

    // System Events
    NEXUS_START = "NEXUS:START",
}

// --- 2. Payload Types ---

export interface PaymentPayload {
    transactionId: string;
    amount: number;
    currency: "BRL" | "USDC" | "NEOFLW";
    payerId: string; // MIO ID
    metadata: Record<string, any>;
}

export interface MintPayload {
    targetAddress: string;
    tokenId: string;
    amount: string;
    reason: "purchase" | "reward" | "genesis";
    refTransactionId?: string; // Link to FlowPay
}

export interface GovernancePayload {
    proposalId: string;
    voterId: string;
    decision: "for" | "against";
}

// --- 3. The Nexus Class ---

class ProtocolNexus extends EventEmitter {
    private static instance: ProtocolNexus;

    private constructor() {
        super();
        this.setupLogger();
    }

    public static getInstance(): ProtocolNexus {
        if (!ProtocolNexus.instance) {
            ProtocolNexus.instance = new ProtocolNexus();
        }
        return ProtocolNexus.instance;
    }

    private setupLogger() {
        this.on("newListener", (event) => {
            // console.log(`[NEXUS] Listener attached for: ${event}`);
        });
    }

    /**
     * Dispatch an event to the ecosystem.
     * @param event The ProtocolEvent type
     * @param payload Data associated with the event
     */
    public dispatch(event: ProtocolEvent, payload: any) {
        console.log(`[NEXUS] ⚡ Dispatching ${event}`, JSON.stringify(payload, null, 0));
        this.emit(event, payload);
    }

    /**
     * Register a reactor (handler) for a specific event.
     */
    public onEvent(event: ProtocolEvent, handler: (payload: any) => void) {
        this.on(event, handler);
    }
}

// Export Singleton
export const Nexus = ProtocolNexus.getInstance();

// --- 4. The Reactor (Logic Wiring) ---
// This is where we define the "If This Then That" logic of the protocol.

export function setupNexusReactors() {
    console.log("[NEXUS] 🔗 Wiring Protocol Reactors...");

    // REACTOR: Payment -> Mint
    // When FlowPay confirms payment, ask Smart Factory to mint tokens/receipt.
    Nexus.onEvent(ProtocolEvent.PAYMENT_RECEIVED, (payload: PaymentPayload) => {
        console.log(`[REACTOR] 💰 Payment confirmed for ${payload.payerId}. Requesting Mint...`);

        // Logic to calculate mint amount based on payment
        // In a real scenario, this would call the Smart Factory API
        const mintRequest: MintPayload = {
            targetAddress: payload.payerId, // Assuming MIO ID maps to wallet
            tokenId: "NEOFLW",
            amount: payload.amount.toString(),
            reason: "purchase",
            refTransactionId: payload.transactionId
        };

        // Dispatch the Mint Request (Smart Factory Node would listen to this)
        Nexus.dispatch(ProtocolEvent.MINT_REQUESTED, mintRequest);
    });

    // REACTOR: Mint -> Notification
    // When Mint is confirmed on-chain, notify the user via FlowCloser.
    Nexus.onEvent(ProtocolEvent.MINT_CONFIRMED, (payload: any) => {
        console.log(`[REACTOR] ✅ Mint Confirmed! Triggering FlowCloser notification...`);
        // Here we would call the WhatsApp/Telegram sender
    });

    Nexus.dispatch(ProtocolEvent.NEXUS_START, { timestamp: Date.now() });
}
