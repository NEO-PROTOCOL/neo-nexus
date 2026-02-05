<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
========================================
       NΞØ NEXUS - NEXT STEPS
========================================

Authoritative roadmap for Phase 1 closure
and Phase 2 initiation.

---

▓▓▓ 1. INFRASTRUCTURE & DNS
────────────────────────────────────────
[####] Subdomains: neoprotocol.space .. OK
[#---] Subdomains: nsfactory.xyz ...... WARN
[#---] Subdomains: flowoff.xyz ........ WARN

└─ Task: Add CNAMEs for branding domains
   (See docs/DNS_RECORDS_MANIFEST.md)
└─ Task: Verify SSL on Railway for all
   custom domains.

---

▓▓▓ 2. PRODUCTION HARDENING
────────────────────────────────────────
[#---] Production Health Check ........ WARN
[#---] Node Secret Sync ............... WARN

└─ Task: Test <https://nexus.neoprotocol.space/health>
   after Railway deploy.
└─ Task: Update .env in FlowPay, Neobot,
   and Smart Factory with the new
   Production URLs.

---

▓▓▓ 3. CLIENT INTEGRATION (REAL-TIME)
────────────────────────────────────────
[#---] Neobot WebSocket Connection .... WARN
[#---] WhatsApp Notification Test ..... WARN

└─ Task: Verify Neobot is listening to
   wss://nexus.neoprotocol.space
└─ Task: Simulate real payment and
   trace WhatsApp delivery.

---

▓▓▓ 4. PHASE 2 - SOBERANIA
────────────────────────────────────────
[░░░░] Sovereign VPS Migration ........ PEND
[░░░░] MIO Identity Layer ............. PEND
[░░░░] Neo Dashboard Integration ...... PEND

└─ Goal: Remove shared secrets. Use MIO
   Logic Hashes for authentication.
└─ Goal: Visualize all events on 
   dashboard.neoprotocol.space.

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
