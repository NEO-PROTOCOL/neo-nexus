<!-- markdownlint-disable MD003 MD034 -->
# NΞØ NEXUS - EXTERNAL AGENT CONTEXT
> **Use this file to instruct AI Agents in other nodes (FlowPay, Neobot, Smart Factory) about how to connect to Nexus.**

---

## 🗺️ Routing & Topology
The authoritative source for all node URLs, IDs, and domains is the ecosystem manifest:
👉 `config/ecosystem.json`

### Production Endpoints
- **Nexus API (SSL):** `https://nexus.neoprotocol.space/api`
- **Nexus WebSocket (SSL):** `wss://nexus.neoprotocol.space`

---

## 🛡️ Security Standard (HMAC)
All nodes MUST use HMAC-SHA256 signatures for HTTP requests to Nexus.
- **Header:** `X-Nexus-Signature`
- **Secret:** `NEXUS_SECRET` (Sync via secure channel)

---

## 2. Integration Contract (By Node)

### 🔵 FOR FLOWPAY AGENT
**Role:** Producer (sends payment events).
**Webhook Destination:** `POST /api/webhooks/flowpay`

**Payload Specification:**
```json
{
  "orderId": "ID_UNICO",
  "amount": "100.00",
  "currency": "USDT",
  "payerId": "ID_USUARIO",
  "status": "confirmed",
  "metadata": { "txHash": "0x..." }
}
```

---

### 🔴 FOR SMART FACTORY AGENT
**Role:** Consumer (receives mint requests) & Producer (confirms deploys).

**1. Receiving (Consumer):**
Expose `POST /api/mint` (or similar) to receive orders from Nexus. 
*Auth:* Nexus will call you using your `FACTORY_API_KEY`.

**2. Notifying Back (Producer):**
When minting is done, notify Nexus:
**Webhook Destination:** `POST /api/webhooks/factory`
```json
{
  "contractAddress": "0x...",
  "status": "deployed",
  "metadata": { "txHash": "..." }
}
```

---

### 🟢 FOR NEOBOT / AGENT NODE
**Role:** Subscriber (real-time stream).

**WebSocket Connection:**
`wss://nexus.neoprotocol.space?token=NEXUS_SECRET`

**Workflow:**
1. Connect via WebSocket using `NEXUS_SECRET` as token.
2. Subscribe to specific events:
```json
{ "action": "subscribe", "events": ["FLOWPAY:PAYMENT_RECEIVED", "FACTORY:MINT_CONFIRMED"] }
```

---

## 3. Environment Variables (Reference)

### 🔑 Shared Secret
All nodes in the trusted perimeter must share:
`NEXUS_SECRET=b2a974f838b3b65c41c66f5abccf013c19f1d3313670be29afcf8611807f81b1`

### 🔵 Add to Node .env
```bash
# Nexus Integration
NEXUS_API_URL=https://nexus.neoprotocol.space/api
NEXUS_WS_URL=wss://nexus.neoprotocol.space
NEXUS_SECRET=b2a974f838b3b65c41c66f5abccf013c19f1d3313670be29afcf8611807f81b1
```
