<!-- markdownlint-disable MD003 MD034 -->
# NΞØ NEXUS - EXTERNAL AGENT CONTEXT
> **Use this file to instruct AI Agents in other nodes (FlowPay, Neobot, Smart Factory) about how to connect to Nexus.**

---

## 1. System Overview
The **Nexus** is the central event bus.
- **Base URL (HTTP):** `http://localhost:3000/api` (or `https://nexus.neoprotocol.space/api` in prod)
- **Base URL (WS):** `ws://localhost:3000` (or `wss://nexus.neoprotocol.space` in prod)

## 2. Integration Contract (By Node)

### 🔵 FOR FLOWPAY AGENT
**Role:** Producer (sends payment events).
**Authentication:** `X-Nexus-Signature` header (HMAC-SHA256 of body + `NEXUS_SECRET`).

**Required Action:**
Implement a Webhook that posts to Nexus when a PIX is received.
```typescript
POST /events
Header: X-Nexus-Signature: <hmac_hex>
Body: {
  "event": "PAYMENT_RECEIVED",
  "payload": {
    "transactionId": "uuid",
    "amount": 100.00,
    "currency": "BRL",
    "payer": "user_id"
  }
}
```

### 🔴 FOR SMART FACTORY AGENT
**Role:** Consumer (receives mint requests) & Producer (confirms deploys).
**Authentication:** Bearer Token (for receiving) & HMAC (for sending callback).

**Required Action:**
1. Expose `POST /api/mint` to receive orders from Nexus.
2. Call Nexus Webhook (`POST /events`) when logic is done:
```typescript
// Event: MINT_CONFIRMED
{
  "event": "MINT_CONFIRMED",
  "payload": {
    "originalTxId": "uuid",
    "contractAddress": "EQD...",
    "network": "TON"
  }
}
```

### 🟢 FOR NEOBOT AGENT
**Role:** Subscriber (real-time notifications).
**Authentication:** None for WebSocket (internal network) or Token (future).

**Required Action:**
Connect WebSocket to Nexus and subscribe.
```typescript
// On Connect
ws.send(JSON.stringify({ action: "subscribe", events: ["MINT_CONFIRMED", "PAYMENT_FAILED"] }));

// On Message
ws.on('message', (data) => {
  const { event, payload } = JSON.parse(data);
  if (event === 'MINT_CONFIRMED') sendWhatsApp(payload.user, `Token Created! Addr: ${payload.contractAddress}`);
});
```

---

## 3. Environment Variables (Copy to your .env)

### 🔵 Add to FLOWPAY .env
```bash
# Nexus Integration
NEXUS_API_URL=http://localhost:3000/api
NEXUS_SECRET=b2a974f838b3b65c41c66f5abccf013c19f1d3313670be29afcf8611807f81b1
```

### 🔴 Add to SMART FACTORY .env
```bash
# Nexus Integration
NEXUS_API_URL=http://localhost:3000/api
NEXUS_SECRET=b2a974f838b3b65c41c66f5abccf013c19f1d3313670be29afcf8611807f81b1
SMART_FACTORY_API_KEY= (create one and share with Nexus .env)
```

### 🟢 Add to NEOBOT .env
```bash
# Nexus Integration
NEXUS_WS_URL=ws://localhost:3000
```
