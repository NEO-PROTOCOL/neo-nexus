<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
========================================
       NΞØ DNS RECORDS MANIFEST
========================================

Authoritative source for all DNS configs
across Spaceship and GoDaddy.

---

▓▓▓ REGISTRY: SPACESHIP.COM
────────────────────────────────────────
Domain: <neoprotocol.space>
(Infrastructure & Identity)

└─ Sub: nexus (Orchestrator)
   └─ Type: CNAME
   └─ Dest: <neo-nexus-production.up.railway.app>

└─ Sub: core (FlowCloser Agent)
   └─ Type: CNAME
   └─ Dest: <flowcloser-agent-production.up.railway.app>

└─ Sub: factory (Hub)
   └─ Type: CNAME
   └─ Dest: <smart-factory-production.up.railway.app>

└─ Sub: id (Identity)
   └─ Type: CNAME
   └─ Dest: <mio-system-production.up.railway.app>

└─ Sub: dashboard (UI)
   └─ Type: CNAME
   └─ Dest: <neo-dashboard-deploy.vercel.app>

└─ Sub: docs (Guide)
   └─ Type: CNAME
   └─ Dest: <smart-ui-delta.vercel.app>

└─ Sub: mobile (MiniApp)
   └─ Type: CNAME
   └─ Dest: <miniapp-smartfactory.vercel.app>

────────────────────────────────────────
Domain: <wodx.pro>
(Product/Game)

└─ Sub: app (Frontend)
   └─ Type: CNAME
   └─ Dest: <wod-x-pro.vercel.app>

└─ Sub: api (Backend)
   └─ Type: CNAME
   └─ Dest: <wod-eth-production.up.railway.app>

└─ Sub: protocol (Docs)
   └─ Type: CNAME
   └─ Dest: <wod-protocol.vercel.app>

---

▓▓▓ REGISTRY: GODADDY
────────────────────────────────────────
Domain: <flowoff.xyz>
(Commercial/Agency)

└─ Sub: pay (Gateway)
   └─ Type: CNAME
   └─ Dest: <flowpay-production-10d8.up.railway.app>

└─ Sub: ia (Agent)
   └─ Type: CNAME
   └─ Dest: <agent-neo-flowoff-production.up.railway.app>

└─ Sub: www (Landing)
   └─ Type: CNAME
   └─ Dest: <cname.vercel-dns.com>

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
