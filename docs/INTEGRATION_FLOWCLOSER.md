<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
========================================
    NEXUS → FLOWCLOSER CONTRACT
========================================

Communication protocol between Nexus
and FlowCloser (Notification Agent).

---

▓▓▓ ARCHITECTURE DECISION
────────────────────────────────────────
FlowCloser is a WEBHOOK RECEIVER, not
a WebSocket client.

└─ Reason: Stateless, simple, resilient
└─ Pattern: HTTP POST (Fire & Forget)
└─ Retry: Nexus handles retries

---

▓▓▓ WEBHOOK ENDPOINT
────────────────────────────────────────
URL: <https://sales.neoprotocol.space/api/webhook/nexus>

Method: POST

Headers:
└─ Content-Type: application/json
└─ X-Nexus-Signature: <HMAC-SHA256>

Body (MINT_CONFIRMED):
{
  "event": "MINT_CONFIRMED",
  "timestamp": "2026-02-05T04:45:00Z",
  "payload": {
    "orderId": "order_abc123",
    "payerId": "5511999999999",
    "contractAddress": "0x123...",
    "txHash": "0xabc...",
    "amount": "1000",
    "currency": "BRL"
  }
}

Body (PAYMENT_RECEIVED):
{
  "event": "PAYMENT_RECEIVED",
  "timestamp": "2026-02-05T04:40:00Z",
  "payload": {
    "orderId": "order_abc123",
    "payerId": "5511999999999",
    "amount": "1000",
    "currency": "BRL",
    "status": "confirmed"
  }
}

---

▓▓▓ SECURITY (HMAC)
────────────────────────────────────────
Secret: NEXUS_SECRET (shared)

Signature Generation (Nexus):
const payload = JSON.stringify(body);
const signature = crypto
  .createHmac('sha256', NEXUS_SECRET)
  .update(payload)
  .digest('hex');

Header: X-Nexus-Signature: <signature>

Validation (FlowCloser):
const received = req.headers['x-nexus-signature'];
const computed = crypto
  .createHmac('sha256', NEXUS_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (!crypto.timingSafeEqual(
  Buffer.from(received),
  Buffer.from(computed)
)) {
  return res.status(401).json({ error: 'Invalid signature' });
}

---

▓▓▓ FLOWCLOSER ACTIONS
────────────────────────────────────────
Event: PAYMENT_RECEIVED
└─ Action: Send WhatsApp confirmation
   "💰 Pagamento recebido! A fábrica
    está preparando seu token..."

Event: MINT_CONFIRMED
└─ Action: Send WhatsApp delivery
   "✅ Token Entregue!
    Contrato: {contractAddress}
    TX: {txHash}"

---

▓▓▓ RETRY POLICY (NEXUS)
────────────────────────────────────────
Attempts: 3
Backoff: Exponential (1s, 2s, 4s)
Timeout: 5s per request

If all retries fail:
└─ Log error to Nexus DB
└─ Alert admin (future: dead letter queue)

---

▓▓▓ RESPONSE CONTRACT
────────────────────────────────────────
Success (200 OK):
{
  "status": "received",
  "event": "MINT_CONFIRMED",
  "timestamp": "2026-02-05T04:45:01Z"
}

Error (4xx/5xx):
{
  "error": "Invalid signature",
  "timestamp": "2026-02-05T04:45:01Z"
}

---

▓▓▓ DEPLOYMENT CHECKLIST
────────────────────────────────────────
[####] FlowCloser code implemented .... OK
[#---] Railway deploy ................. PEND
[#---] WhatsApp QR scan ............... PEND
[#---] NEXUS_SECRET configured ........ PEND
[#---] End-to-end test ................ PEND

---

▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
 chaos becomes protocol."

Security by design.
Exploits find no refuge here.
────────────────────────────────────────
