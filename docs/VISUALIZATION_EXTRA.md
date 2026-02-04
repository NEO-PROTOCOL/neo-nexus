# NΞØ NEXUS - VISUAL DATA FLOW
> A spatial representation of the Nexus Event Bus.

```text
                                     [ CLOUD / INTERNET ]
                                              │
      ┌──────────────────────┐                │                ┌──────────────────────┐
      │       FLOWPAY        │                │                │    SMART FACTORY     │
      │  (Payment Gateway)   │◄───────────────┼───────────────►│   (Token Deployer)   │
      │   Port: 3001 (Est)   │                │                │    Port: 3002 (Est)  │
      └─────────┬────────────┘                │                └───────────▲──────────┘
                │                             │                            │
                │ (1) HTTP POST               │              (2) HTTP POST │
                │ "PAYMENT_RECEIVED"          │              "MINTREQUEST" │
                │                             │                            │
      ┌─────────▼─────────────────────────────▼────────────────────────────▼──────────┐
      │                                                                               │
      │                           NΞØ NEXUS (Port 3000)                               │
      │                          "The Sovereign Bridge"                               │
      │                                                                               │
      │   ┌────────────────────┐      ┌────────────────────┐      ┌────────────────┐  │
      │   │   Ingress Guard    │─────►│     EVENT BUS      │─────►│   Reactors     │  │
      │   │ (HMAC Validation)  │      │ (Node EventEmitter)│      │ (Logic R1, R2) │  │
      │   └────────────────────┘      └─────────┬──────────┘      └────────────────┘  │
      │                                         │                                     │
      └─────────────────────────────────────────┼─────────────────────────────────────┘
                                                │
                                                │ (3) WEBSOCKET BROADCAST
                                                │ "MINT_CONFIRMED"
                                                │
                                      ┌─────────▼────────┐
                                      │                  │
                                      │      NEOBOT      │
                                      │   (Notification) │
                                      │   Port: 8080     │
                                      │                  │
                                      └─────────┬────────┘
                                                │
                                       (4) WHATSAPP MSG
                                         "Your Token is
                                          Ready, Sir."
                                                │
                                          ┌─────▼─────┐
                                          │ END  USER │
                                          └───────────┘
```

## Legend
1.  **Ingress:** Data enters via secure API (FlowPay).
2.  **Processing:** Nexus validates and routes via **Reactors**.
3.  **Reaction:** Nexus commands Factory to Mint.
4.  **Feedback:** Factory confirms, Nexus broadcasts via WebSocket.
5.  **Output:** Neobot alerts the user.
