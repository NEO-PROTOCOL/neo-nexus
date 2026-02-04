<!-- markdownlint-disable MD003 MD007 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
```
========================================================================
              NEO PROTOCOL STACK - ARQUITETURA HIBRIDA
========================================================================
[####] Versao 1.0.0 ................................................ OK
[####] Data 30 Janeiro 2026 ........................................ OK
[####] Arquiteto NEØ MELLØ ......................................... OK
[#---] Status Design Phase ........................................ WARN
========================================================================
```
```
========================================================================
                        VISAO ESTRATEGICA
========================================================================
```
O NEO Protocol e uma camada descentralizada e autonoma construida
sobre o motor openclaw, seguindo os principios Web3.

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ NEO PROTOCOL STACK (100% Autonomous)                            ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ┃
┃ ░ ░  NEO Layer (Descentralizada)                         ░ ░ ┃
┃ ░ ░  • NEO Skills Registry (IPFS)                        ░ ░ ┃
┃ ░ ░  • NEO Identity System (mio-system)                   ░ ░ ┃
┃ ░ ░  • NEO Docs (Self-hosted)                             ░ ░ ┃
┃ ░ ░  • NEO Gateway Extensions (Web3-native)               ░ ░ ┃
┃ ░ ░  • NEO Dashboard (iOS-style)                          ░ ░ ┃
┃ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ┃
┃                    Protocol Interface                           ┃
┃ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ┃
┃ ░ ░  Moltbot Core (Sincronizado c/ Upstream)              ░ ░ ┃
┃ ░ ░  • Gateway Runtime (ws://...)                         ░ ░ ┃
┃ ░ ░  • Channel Adapters (WhatsApp, Telegram, etc)         ░ ░ ┃
┃ ░ ░  • Agent Runtime (Pi RPC)                             ░ ░ ┃
┃ ░ ░  • Tool Execution Engine                              ░ ░ ┃
┃ ░ ░  • Session Management                                 ░ ░ ┃
┃ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```
```
========================================================================
                       ESTRATEGIA HIBRIDA
========================================================================
```
```
┌────────────────────────────────────────────────────────────────┐
│ ▓▓▓ MANTEMOS SINCRONIZADO (Moltbot Core)                       │
├────────────────────────────────────────────────────────────────┤
│ └─ Diretorio: src/ (core only)                                  │
│    └─ src/gateway/ - Gateway WebSocket                          │
│    └─ src/channels/ - WhatsApp, Telegram, Slack, etc            │
│    └─ src/agents/ - Agent runtime (Pi RPC)                      │
│    └─ src/sessions/ - Session management                        │
│    └─ src/infra/ - Health, Ledger, Notifiers                   │
│    └─ src/process/ - Tool execution                            │
│    └─ src/media/ - Media pipeline                               │
│    └─ src/security/ - Security core                            │
└────────────────────────────────────────────────────────────────┘
```
Estrategia de Sincronizacao:

  # Remote upstream
  git remote add upstream git@github.com:moltbot/moltbot.git

  # Pull updates (mensal)
  git fetch upstream main
  git merge upstream/main --strategy-option theirs src/

  # Resolve conflitos apenas no core
  # NEO layer permanece intocada

Vantagem: Recebemos bugfixes, novas channels, melhorias de performance

```
┌────────────────────────────────────────────────────────────────┐
│ ▓▓▓ DESACOPLAMOS (NEO Layer)                                   │
├────────────────────────────────────────────────────────────────┤
│ └─ 1. NEO Skills Registry (IPFS-First)                         │
│ └─ 2. NEO Identity System (mio-system)                         │
│ └─ 3. NEO Docs (Self-Hosted)                                   │
│ └─ 4. NEO Protocol Nexus (Orchestration)                       │
│ └─ 5. NEO Gateway Extensions                                   │
│ └─ 6. NEO Dashboard (Ja Existente)                             │
└────────────────────────────────────────────────────────────────┘
```

----------------------------------------------------------------------
1. NEO Skills Registry (IPFS-First)
----------------------------------------------------------------------
Substitui: ClawdHub (<https://clawdhub.com>)

Implementacao: neo/registry/index.ts
```
  export interface NeoSkill {
    id: string; name: string; version: string; cid: CID;
    author: string; category: string[]; metadata: { ... }
  }

  export class NeoSkillsRegistry {
    async publish(skill: NeoSkill): Promise<CID>
    async install(skillId: string): Promise<NeoSkill>
    async search(query: string): Promise<NeoSkill[]>
  }
```
Estrutura no IPFS:
```
┌────────────────────────────────────────────────────────────────┐
│ ▓▓▓ ipfs://QmNeoSkillsIndex                                     │
├────────────────────────────────────────────────────────────────┤
│ └─ skills/                                                     │
│    └─ ipfs-status/v1.0.0 -> QmXxx...                           │
│    └─ asi1-llm/v1.2.0 -> QmYyy...                              │
│    └─ smart-factory/v2.0.0 -> QmZzz...                         │
│ └─ index.json -> QmIndexRoot...                                 │
└────────────────────────────────────────────────────────────────┘
```
Comando CLI:
```text
  pnpm neobot neo:skill:publish ./skills/ipfs/
  pnpm neobot neo:skill:install ipfs-status@1.0.0
  pnpm neobot neo:skill:list
```
----------------------------------------------------------------------
2. NEO Identity System (mio-system)
----------------------------------------------------------------------
Substitui: Auth tradicional

Implementacao: neo/identity/mio-system.ts
```
  export interface NeoIdentity {
    id: string; publicKey: string; roles: string[];
    permissions: { channels, skills, tools };
    metadata: { name, avatar?, bio? }; createdAt: Date; signature
  }

  export class MioIdentityManager {
    async createIdentity(metadata): Promise<NeoIdentity>
    async verifyIdentity(identity: NeoIdentity): Promise<boolean>
  }
```
Registro das 9 Identidades (neo/identity/registry.ts):
```
┌────────────────────────────────────────────────────────────────┐
│ ▓▓▓ NEO_IDENTITIES                                              │
├────────────────────────────────────────────────────────────────┤
│ └─ mio-core      System Core          NEO Core System           │
│ └─ mio-gateway   Gateway Manager      NEO Gateway               │
│ └─ mio-skills    Skills Registry      NEO Skills Manager        │
│ └─ mio-factory   Smart Factory        Smart Factory Manager     │
│ └─ mio-flowpay   FlowPay System       FlowPay Manager           │
│ └─ mio-asi1      ASI1 LLM             ASI1 LLM Agent            │
│ └─ mio-telegram  Telegram Bot         NEO Telegram              │
│ └─ mio-whatsapp  WhatsApp Gateway     NEO WhatsApp              │
│ └─ mio-ipfs      IPFS Node            NEO IPFS                  │
└────────────────────────────────────────────────────────────────┘
```
----------------------------------------------------------------------
3. NEO Docs (Self-Hosted)
----------------------------------------------------------------------
Substitui: <https://docs.molt.bot>

Estrutura:
```
┌────────────────────────────────────────────────────────────────┐
│ ▓▓▓ docs-neo/                                                  │
├────────────────────────────────────────────────────────────────┤
│ └─ index.md                                                    │
│ └─ protocol/ (architecture, identity, skills-registry)         │
│ └─ skills/ (ipfs, asi1, smart-factory, flowpay)                │
│ └─ guides/ (quickstart, telegram-setup, whatsapp-setup)        │
│ └─ api/ (gateway, skills-registry, mio-identity)               │
└────────────────────────────────────────────────────────────────┘
```
Hosting: Build estatico (Vitepress) -> ipfs add -r dist/
         Alias DNS: neo-docs.mellø.eth -> ipfs://QmNeoDocsV1...

----------------------------------------------------------------------
4. NEO Protocol Nexus (Orchestration)
----------------------------------------------------------------------
O sistema nervoso central do NEØBOT. Um barramento de eventos (Event Bus)
que coordena a comunicacao entre os nos soberanos.

Implementacao: `src/nexus/index.ts`
Documentacao: `docs/neo-protocol/NEXUS_OPERATIONS_MANUAL.md`

Fluxos principais:
- `PAYMENT_RECEIVED` -> Trigger `MINT_REQUESTED`
- `MINT_CONFIRMED` -> Trigger `NOTIFICATION_DISPATCH`

----------------------------------------------------------------------
5. NEO Gateway Extensions (Web3-Native)
----------------------------------------------------------------------
```
neo/gateway/extensions.ts

  export interface NeoGatewayExtension {
    name, version, protocol: 'ipfs'|'web3'|'matrix'|'nostr',
    handler: (message) => Promise<void>
  }
```
  Exemplo: IPFSChannelAdapter - IPFS PubSub para mensagens NEO,
           roteamento para gateway moltbot.

----------------------------------------------------------------------
5. NEO Dashboard (Ja Existente)
----------------------------------------------------------------------
[####] Status Implementado ........................................ OK
Localizacao: dashboard/

Features NEO-Specific:

- iOS-style UI
- Claude AI chat integrado
- Automacoes NEO (cron jobs)
- Metricas do protocolo
- Skills manager UI

Melhorias: NeoDashboardService - loadSkills(), loadIdentities(),
           getIPFSStatus() (neo-integration.ts)

----------------------------------------------------------------------
6. Sovereign Adapter Pattern
----------------------------------------------------------------------
Garante a independencia de bibliotecas externas (upstream).
Implementacao: `src/infra/pi-adapter.ts`
- Substitui deps instaveis (ex: pi-coding-agent) por adaptadores locais.
- Mantem o No operacional mesmo se o upstream desaparecer.

========================================================================
                    ESTRUTURA DE DIRETORIOS
========================================================================

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ MOLTBOT CORE (src/) - Sincronizado upstream                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ┃
┃ ░ ░  gateway/ channels/ agents/ sessions/ infra/             ░ ┃
┃ ░ ░  process/ media/ security/                                ░ ┃
┃ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ NEO PROTOCOL LAYER (neo/)                                      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ┃
┃ ░ ░  registry/     Skills Registry (IPFS)                      ░ ┃
┃ ░ ░  identity/     mio-system (mio-system, registry, verifier) ░ ┃
┃ ░ ░  nexus/        Protocol Nexus (Event Bus / Orchestrator)   ░ ┃
┃ ░ ░  gateway/      Extensions (ipfs-channel, web3-signer, etc) ░ ┃
┃ ░ ░  cli/          neo:skill, neo:identity, protocol-info      ░ ┃
┃ ░ ░  sdk/          index, types                                ░ ┃
┃ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌────────────────────────────────────────────────────────────────┐
│ ▓▓▓ neobot/                                                    │
├────────────────────────────────────────────────────────────────┤
│ └─ src/              MOLTBOT CORE (sincronizado)                │
│ └─ neo/              NEO PROTOCOL LAYER                         │
│ └─ skills/           NEO SKILLS (18 skills)                     │
│ └─ dashboard/        NEO DASHBOARD                              │
│ └─ docs-neo/         NEO DOCS (self-hosted)                    │
│ └─ config/neobot.runtime.json                                  │
│ └─ ARCHITECTURE_NEO_PROTOCOL.md, NEXT_STEPS.md, package.json   │
└────────────────────────────────────────────────────────────────┘

========================================================================
                     CONFIGURACAO RUNTIME
========================================================================

config/neobot.runtime.json:
```
  neo.enabled, neo.protocol (version, network)
  neo.registry (type: ipfs, endpoint, indexCID)
  neo.identity (system: mio, wallet: ethereum/flow-mainnet)
  neo.gateway.extensions: ipfs-channel, web3-signer, nostr-relay
  neo.dashboard (port: 3000, auth: mio-identity)
  - gateway, channels (config moltbot existente)
```
========================================================================
                       COMANDOS CLI NEO
========================================================================
```
[####] Info ............ pnpm neobot neo:info ........................ OK
[####] Skills list ...... pnpm neobot neo:skill:list .................. OK
[####] Skill publish .... pnpm neobot neo:skill:publish ./path/ ...... OK
[####] Skill install .... pnpm neobot neo:skill:install id@ver ....... OK
[####] Identity create .. pnpm neobot neo:identity:create --name ...   OK
[####] Identity list .... pnpm neobot neo:identity:list .............. OK
[####] Identity verify .. pnpm neobot neo:identity:verify mio-xxx ..... OK
[####] IPFS status ...... pnpm neobot neo:ipfs:status ................. OK
[####] IPFS publish ..... pnpm neobot neo:ipfs:publish ./data/ ........ OK
[####] IPFS cat ......... pnpm neobot neo:ipfs:cat QmXxx... ........... OK
[####] Dashboard ........ pnpm neobot neo:dashboard:start ............. OK
```
========================================================================
                      METRICAS DE AUTONOMIA
========================================================================

┌────────────────────────────────────────────────────────────────┐
│ ▓▓▓ Componente            Upstream   NEO    Status             │
├────────────────────────────────────────────────────────────────┤
│ └─ Gateway Runtime        100%       0%     Sync               │
│ └─ Channel Adapters       100%       0%     Sync               │
│ └─ Agent Runtime          100%       0%     Sync               │
│ └─ Skills Registry        0%         100%   NEO                │
│ └─ Identity System        0%         100%   NEO                │
│ └─ Protocol Nexus         0%         100%   NEO                │
│ └─ Documentation          0%         100%   NEO                │
│ └─ Dashboard              0%         100%   NEO                │
│ └─ Gateway Extensions     0%         100%   NEO                │
│ └─ Autonomia Total        30%        70%    Objetivo            │
└────────────────────────────────────────────────────────────────┘

========================================================================
                    ROADMAP DE IMPLEMENTACAO
========================================================================

[#---] Fase 1 Foundation (Semana 1-2) ............................ WARN
       Criar neo/, NEO Skills Registry, migrar 18 skills,
       mio-system 9 identidades, CLI neo:*

[#---] Fase 2 Extensions (Semana 3-4) ............................ WARN
       IPFS Channel Adapter, Web3 Signature, Nostr (opc),
       Dashboard integracao NEO

[#---] Fase 3 Documentation (Semana 5-6) ......................... WARN
       Build docs-neo/, Deploy IPFS+DNS, guias, API reference

[#---] Fase 4 Testing & Polish (Semana 7-8) ...................... WARN
       E2E NEO, benchmarks, security audit, Release v1.0.0

========================================================================
                   CONSIDERACOES DE SEGURANCA
========================================================================

┌────────────────────────────────────────────────────────────────┐
│ ▓▓▓ mio-system Identities                                      │
├────────────────────────────────────────────────────────────────┤
│ └─ Private keys em .env (nunca commitar)                       │
│ └─ Hardware wallet para producao                               │
│ └─ Rotacao de chaves trimestral                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ▓▓▓ IPFS Registry                                              │
├────────────────────────────────────────────────────────────────┤
│ └─ Skills assinadas cryptographicamente                        │
│ └─ Verificacao de integridade (CID)                            │
│ └─ Pinning redundante (3+ nodes)                               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ▓▓▓ Gateway Extensions                                         │
├────────────────────────────────────────────────────────────────┤
│ └─ Sandbox isolado por extensao                               │
│ └─ Permission system granular                                  │
│ └─ Rate limiting por identity                                  │
└────────────────────────────────────────────────────────────────┘

========================================================================
                          REFERENCIAS
========================================================================

  IPFS Docs       <https://docs.ipfs.tech/>
  Ethers.js       <https://docs.ethers.org/>
  Flow Blockchain <https://flow.com/developers>
  Nostr Protocol  <https://nostr.com/>

========================================================================
                         CONTRIBUINDO
========================================================================

NEO Protocol Layer e independente do upstream moltbot.

1. Fork o repo
2. Branch: neo/feature-xyz
3. Commit: feat(neo): add xyz
4. Push e PR

Diretrizes: Mudancas src/ discutir; neo/ livre; skills/ via NEO Registry.

========================================================================
                            LICENCA
========================================================================

  Moltbot Core (src/) ...................... MIT (upstream)
  NEO Layer (neo/, skills/, dashboard/) .... MIT (neomello)

========================================================================
  Mantido por: NODE NEØ (@neomello) | Versao 1.0.0 | 30 Jan 2026
========================================================================

┌─────────────────────────────────────────────────────────────────┐
│ ▓▓▓ NΞØ MELLØ                                                   │
│     Core Architect · NΞØ Protocol                               │
│     neo@neoprotocol.space                                       │
│                                                                 │
│     "Code is law. Expand until chaos becomes protocol."         │
│                                                                 │
│     Security by design. Exploits find no refuge here.           │
└─────────────────────────────────────────────────────────────────┘
