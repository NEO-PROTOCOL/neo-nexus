<!-- 
DASHBOARD SOURCE OF TRUTH
Updated by: Antigravity AI
Context: NΞØ NEXUS
-->

# NEXUS SYSTEM DASHBOARD

```text
STATUS: [ONLINE]
UPTIME: (Check /health)
VERSION: 1.0.0
```

## ACTIVE PORTS & SERVICES

| Service Name    | Port | Protocol | Auth Method | Status Check URL          |
|-----------------|------|----------|-------------|----------------------------|
| **Nexus Core**  | 3000 | HTTP/WS  | HMAC/None   | `http://localhost:3000/health` |
| **Nexus DB**    | N/A  | SQLite   | Internal    | N/A                        |

## INTEGRATION MATRIX

| Node Name      | Connection Type | Direction | Secret Key Status       |
|----------------|-----------------|-----------|-------------------------|
| **FlowPay**    | Webhook (HTTP)  | Inbound   | [OK] Configured (in .env)  |
| **SmartFactory**| API (HTTP)      | Outbound  | [WARN] Pending API Key      |
| **Neobot**     | WebSocket       | Outbound  | [OK] Open (Internal)       |

## CURRENT WORKFLOW STATE

### 1. Payment Processing
- **Listener:** `/api/events` (Event: `PAYMENT_RECEIVED`)
- **Reactor:** `src/reactors/payment-to-mint.ts`
- **Action:** Triggers Smart Factory API.

### 2. Notification Pipeline
- **Listener:** Internal Bus (Event: `MINT_CONFIRMED`)
- **Transport:** WebSocket Server (`ws://localhost:3000`)
- **Target:** Connected Clients (Neobot).

## RECENT EVENTS (LOG)
*To see live events, query the SQLite database or check Docker logs.*

```bash
docker logs -f nexus-core
```
