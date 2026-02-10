# NEOBOT ↔ NEO-NEXUS COMPATIBILITY GUIDE

> **Last Updated:** 2026-02-09
> **Compatibility Status:** ✅ **100% Compatible**

---

## 📋 **OVERVIEW**

Este documento descreve a compatibilidade entre o protótipo Nexus em `neobot/src/nexus/` e a implementação em produção em `neo-nexus/`.

---

## 🔄 **EVOLUTION PATH**

```text
┌─────────────────────────────────────────────────┐
│  FASE 1: Protótipo (neobot/src/nexus/)          │
│  • EventEmitter básico                          │
│  • Reactors inline (console.log)                │
│  • Sem persistência                             │
│  • Proof of Concept                             │
└──────────────────┬──────────────────────────────┘
                   │ Evolution
                   ▼
┌─────────────────────────────────────────────────┐
│  FASE 2: Produção (neo-nexus/)                  │
│  • EventEmitter + SQLite                        │
│  • Reactors HTTP reais                          │
│  • Service Discovery                            │
│  • HMAC Webhooks                                │
│  • Deployed on Railway                          │
└─────────────────────────────────────────────────┘
```

---

## ✅ **COMPATIBILITY MATRIX**

| Component | Neobot Prototype | Neo-Nexus Production | Compatible? |
|-----------|-----------------|---------------------|-------------|
| **ProtocolEvent enum** | ✅ 10 events | ✅ 10 events (identical) | ✅ 100% |
| **PaymentPayload** | ✅ Interface | ✅ Interface (more flexible) | ✅ 100% |
| **MintPayload** | ✅ Interface | ✅ Interface (identical) | ✅ 100% |
| **GovernancePayload** | ✅ Interface | ✅ Interface (identical) | ✅ 100% |
| **Nexus.dispatch()** | ✅ Method | ✅ Method (+ logging) | ✅ 100% |
| **Nexus.onEvent()** | ✅ Method | ✅ Method (identical) | ✅ 100% |
| **Event persistence** | ❌ Not implemented | ✅ SQLite | 🔄 Enhanced |
| **HTTP Reactors** | ❌ console.log only | ✅ Real API calls | 🔄 Enhanced |

---

## 📦 **TYPE COMPATIBILITY**

### **ProtocolEvent Enum**

Both versions use **identical** event definitions:

```typescript
// ✅ IDENTICAL in both versions
export enum ProtocolEvent {
    PAYMENT_RECEIVED = "FLOWPAY:PAYMENT_RECEIVED",
    PAYMENT_FAILED = "FLOWPAY:PAYMENT_FAILED",
    MINT_REQUESTED = "FACTORY:MINT_REQUESTED",
    MINT_CONFIRMED = "FACTORY:MINT_CONFIRMED",
    MINT_FAILED = "FACTORY:MINT_FAILED",
    CONTRACT_DEPLOYED = "FACTORY:CONTRACT_DEPLOYED",
    PROPOSAL_CREATED = "FLUXX:PROPOSAL_CREATED",
    VOTE_CAST = "FLUXX:VOTE_CAST",
    IDENTITY_VERIFIED = "MIO:IDENTITY_VERIFIED",
    NEXUS_START = "NEXUS:START",
}
```

### **PaymentPayload**

**Neobot (Prototype):**
```typescript
export interface PaymentPayload {
    orderId: string;
    amount: number;
    currency: "BRL" | "USDC" | "NEOFLW";
    payerId: string; // MIO ID
    metadata: Record<string, any>;
}
```

**Neo-Nexus (Production):**
```typescript
export interface PaymentPayload {
    orderId: string;
    amount: string | number;  // ← More flexible
    currency: string;         // ← More flexible
    payerId: string;
    metadata?: Record<string, any>; // ← Optional
}
```

**Migration:** Neo-Nexus is **backward compatible**. Accepts both formats.

---

## 🔌 **INTEGRATION PATTERNS**

### **Pattern 1: Direct Import (Not Recommended)**

```typescript
// ❌ DON'T: Import from neobot
import { Nexus, ProtocolEvent } from '../neobot/src/nexus/index.js';

// ✅ DO: Import from neo-nexus
import { Nexus, ProtocolEvent } from '@neo-protocol/nexus';
```

### **Pattern 2: HTTP Webhooks (Recommended)**

```typescript
// FlowPay → Neo-Nexus
await fetch('https://nexus.neoprotocol.space/api/webhooks/flowpay', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Nexus-Signature': signature
    },
    body: JSON.stringify({
        event: 'PAYMENT_RECEIVED',
        payload: {
            orderId: '123',
            amount: 100,
            currency: 'BRL',
            payerId: 'mio-001',
            metadata: {}
        }
    })
});
```

### **Pattern 3: WebSocket (Real-time)**

```typescript
// Client (Neobot, FlowPay, etc.)
const ws = new WebSocket('wss://nexus.neoprotocol.space');

ws.on('message', (data) => {
    const { event, payload } = JSON.parse(data);

    if (event === 'MINT_CONFIRMED') {
        console.log('Token minted!', payload);
    }
});
```

---

## 🔄 **MIGRATION GUIDE**

### **From Neobot Prototype to Neo-Nexus**

If you have code using the prototype:

**Before (Prototype):**
```typescript
import { Nexus, ProtocolEvent } from './neobot/src/nexus/index.js';
import { setupNexusReactors } from './neobot/src/nexus/index.js';

setupNexusReactors();

Nexus.onEvent(ProtocolEvent.PAYMENT_RECEIVED, (payload) => {
    console.log('Payment received!', payload);
});
```

**After (Production):**
```typescript
// Option A: Use HTTP Webhook
await fetch('https://nexus.neoprotocol.space/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        event: 'PAYMENT_RECEIVED',
        payload: { orderId: '123', ... }
    })
});

// Option B: Use WebSocket
const ws = new WebSocket('wss://nexus.neoprotocol.space');
ws.on('message', handleEvent);
```

---

## 📊 **REACTOR DIFFERENCES**

### **Neobot Prototype Reactors**

```typescript
// Inline, simple, console.log only
Nexus.onEvent(ProtocolEvent.PAYMENT_RECEIVED, (payload) => {
    console.log(`[REACTOR] 💰 Payment confirmed for ${payload.payerId}`);
    Nexus.dispatch(ProtocolEvent.MINT_REQUESTED, mintRequest);
});
```

### **Neo-Nexus Production Reactors**

```typescript
// Modular, HTTP calls, error handling, retry logic
export function setup() {
    Nexus.onEvent(ProtocolEvent.PAYMENT_RECEIVED, async (payload) => {
        // 1. Resolve Factory URL via Discovery
        const factoryUrl = await Discovery.resolveUrl('smart-core');

        // 2. Call Factory API with timeout
        const response = await fetch(`${factoryUrl}/api/mint`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}` },
            body: JSON.stringify(mintRequest),
            signal: AbortSignal.timeout(30000)
        });

        // 3. Persist event to database
        await Nexus.persistEvent(ProtocolEvent.MINT_REQUESTED, mintRequest);

        // 4. Dispatch to ecosystem
        Nexus.dispatch(ProtocolEvent.MINT_REQUESTED, mintRequest);
    });
}
```

---

## 🎯 **BEST PRACTICES**

### **1. Use Neo-Nexus for Production**

```typescript
// ✅ Production: Use deployed Neo-Nexus
const NEXUS_URL = 'https://nexus.neoprotocol.space';

// ❌ Development: Don't import prototype in production code
// import { Nexus } from '../neobot/src/nexus/index.js';
```

### **2. Keep Types in Sync**

If you add a new event type:

1. ✅ Add to `neo-nexus/src/core/nexus.ts`
2. ✅ Update `neobot/src/nexus/index.ts` (docs)
3. ✅ Document in Neobot ecosystem docs

### **3. Test Against Both**

```bash
# Development: Test with local Neobot prototype
cd neobot
pnpm dev

# Staging: Test against deployed Neo-Nexus
export NEXUS_URL=https://neo-nexus-production.up.railway.app

# Production: Use custom domain
export NEXUS_URL=https://nexus.neoprotocol.space
```

---

## 🔐 **SECURITY DIFFERENCES**

| Feature | Neobot Prototype | Neo-Nexus Production |
|---------|-----------------|---------------------|
| **HMAC Signatures** | ❌ Not implemented | ✅ Required |
| **Rate Limiting** | ❌ Not implemented | ✅ 100 req/15min |
| **CORS** | ❌ Not implemented | ✅ Configured |
| **Helmet Headers** | ❌ Not implemented | ✅ Enabled |
| **Input Validation** | ❌ Basic | ✅ Enhanced |

---

## 📚 **RELATED DOCUMENTATION**

- [Neobot Nexus Operations Manual](../../neobot/docs/neo-protocol/NEXUS_OPERATIONS_MANUAL.md)
- [Neo-Nexus Architecture](./ARCHITECTURE.md)
- [Neo-Nexus Setup Guide](../SETUP.md)

---

**Maintained by:** NEO Protocol Team
**Questions?** Open an issue on GitHub or contact neo@neoprotocol.space
