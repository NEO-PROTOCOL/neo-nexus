# NEO NEXUS — Checklist de Conformidade do Ecossistema

> Documento oficial de requisitos, estado atual e roadmap de execucao para integracao do ecossistema NEO Protocol com o Neo Nexus como Hub Central de Eventos.

**Data**: 2026-02-06
**Versao**: 3.0
**Status**: Dispatch Executado — Nos Ativados
**Decisao Arquitetural**: Nexus-Centric (infrastructure-core-features)
**Autor**: Auditoria automatizada via Claude Agent

### Changelog

| Versao | Data       | Mudanca                                                                    |
| ------ | ---------- | -------------------------------------------------------------------------- |
| 1.0    | 2026-02-06 | Checklist inicial com requisitos genericos                                 |
| 2.0    | 2026-02-06 | Arquitetura eleita (Nexus-Centric), estado real auditado, roadmap definido |
| 3.0    | 2026-02-06 | Protocol Dispatch executado: /api/ecosystem + Smart-Core Ingress Adapter   |

---

## Indice

1. [Decisao Arquitetural](#decisao-arquitetural)
2. [Protocol Dispatch (v3.0)](#protocol-dispatch)
3. [Mapa de Conexoes Oficiais](#mapa-de-conexoes-oficiais)
4. [Estado Real das Integracoes](#estado-real-das-integracoes)
5. [Regras Universais (Todos os Projetos)](#regras-universais)
6. [FlowPay](#flowpay)
7. [Smart Factory (smart-core)](#smart-factory)
8. [Neobot (FlowCloser)](#neobot)
9. [Fluxx DAO](#fluxx-dao)
10. [Projetos Opcionais](#projetos-opcionais)
11. [Fluxo Critico: Payment > Mint > Notify](#fluxo-critico)
12. [Matriz de Seguranca e Identidade (MIO)](#matriz-de-seguranca)
13. [Roadmap de Execucao (The Ignition Path)](#roadmap-de-execucao)
14. [Proximos Passos](#proximos-passos)

---

## Decisao Arquitetural

### Caminho Eleito: Neo-Nexus como Hub Central

O monolito (Neobot) deixara de ser o orquestrador direto do FlowPay.
O Neo-Nexus assume a responsabilidade de rotear TODOS os eventos entre nos,
garantindo que o sistema seja resiliente, auditavel e escalavel.

```
deployStrategy: "infrastructure-core-features"

Ordem: Infraestrutura (Nexus) -> Core (FlowPay, Factory) -> Features (Neobot, Fluxx, etc.)
```

### O que isso significa na pratica

| Antes (Monolito)                           | Depois (Nexus-Centric)                       |
| ------------------------------------------ | -------------------------------------------- |
| FlowPay chama Neobot direto                | FlowPay so fala com Nexus                    |
| FlowPay chama Nexus E Neobot (redundancia) | Nexus roteia para Factory e Neobot           |
| Neobot tem Nexus embutido (EventEmitter)   | Neobot vira consumidor do Nexus externo      |
| Factory nao tem backend                    | Factory (smart-core) expoe /api/mint         |
| Ponto-a-ponto, cada no sabe dos outros     | Nos so conhecem eventos, nao implementacoes  |
| Config estatica via .env em cada projeto    | Auto-descoberta via /api/ecosystem           |

### Topologia Alvo

```
                     NEOBOT /api/ecosystem
                   (Registro de Nomes — DNS do Protocolo)
                   core.neoprotocol.space/api/ecosystem
                               |
                    [descoberta dinamica]
                               |
                          NEO-NEXUS
                     (Hub Central / Event Bus)
                  nexus.neoprotocol.space/api
                            |
              +-------------+-------------+
              |             |             |
         FLOWPAY      SMART FACTORY    NEOBOT
      pay.flowoff.xyz  smart.neo...   core.neo...
      (Pagamentos)    (Mint/Chain)   (Notificacoes)
              |             |             |
              v             v             v
          PIX/Crypto    Blockchain    WhatsApp/TG
```

---

## Protocol Dispatch

> Secao adicionada na v3.0 — registra o dispatch executado em 2026-02-06.

### O que foi disparado

Dois commits foram executados e pushados para producao:

| Repositorio  | Branch                | Commit                                                      | Status    |
| ------------ | --------------------- | ----------------------------------------------------------- | --------- |
| `neobot`     | `main`                | `feat: implement /api/ecosystem and update smart-core entry` | DEPLOYED  |
| `smart-core` | `feat/ton-factory-v2` | `feat: add nexus ingress adapter and sync identities`        | PUSHED    |

### 1. API /api/ecosystem (Neobot — Registro de Nomes)

**Arquivo**: `neobot/src/gateway/ecosystem-http.ts`
**Dados**: `neobot/config/ecosystem.json` (27 nos registrados)
**Deploy**: Apos Railway concluir, disponivel em `https://core.neoprotocol.space/api/ecosystem`

**Endpoints implementados**:

| Metodo | Rota                          | Descricao                       | Auth     |
| ------ | ----------------------------- | ------------------------------- | -------- |
| GET    | `/api/ecosystem`              | Retorna todos os 27 nos         | Publica  |
| GET    | `/v1/ecosystem`               | Alias moderno (mesmo resultado) | Publica  |
| GET    | `/api/ecosystem?id=smart-core`| Filtra no especifico por ID     | Publica  |

**Respostas**:

```json
// GET /api/ecosystem (lista completa)
{
  "ok": true,
  "ecosystem": [
    {
      "id": "smart-core",
      "org": "NEO Protocol",
      "name": "Smart Core",
      "description": "Protocol layer...",
      "localPath": "../smart-core",
      "repository": "https://github.com/neomello/smart-core",
      "role": "Protocol Layer",
      "hosting": {
        "platform": "Railway",
        "productionUrl": "https://smart.neoprotocol.space",
        "adminEmail": "admin@neoprotocol.space",
        "targetCustomDomain": "smart.neoprotocol.space"
      }
    }
    // ... 26 outros nos
  ]
}

// GET /api/ecosystem?id=smart-core (no especifico)
{
  "ok": true,
  "node": { ... }
}

// GET /api/ecosystem?id=inexistente (404)
{
  "ok": false,
  "error": "Node not found"
}
```

**Seguranca**: Endpoint publico, somente leitura, sem secrets expostos.
Registrado no server HTTP ANTES do middleware de autenticacao (linha 259 de server-http.ts).

### 2. Smart-Core Ingress Adapter (Factory como No Reativo)

**Arquivo**: `smart-core/integrations/nexus/server.js`
**Versao**: 0.5.3-ignition
**Deploy alvo**: `https://smart.neoprotocol.space`

**Endpoints implementados**:

| Metodo | Rota         | Descricao                            | Auth                |
| ------ | ------------ | ------------------------------------ | ------------------- |
| POST   | `/api/mint`  | Recebe pedido de mint do Nexus       | Bearer FACTORY_KEY  |
| GET    | `/health`    | Health check                         | Publica             |

**Fluxo interno do /api/mint**:

```
1. Recebe POST /api/mint com Bearer token
2. Valida Authorization header (401 se invalido)
3. Retorna 202 Accepted IMEDIATAMENTE (evita timeout de 30s)
4. Executa mint on-chain via Hardhat (bridgeMint no contrato NeoTokenV2)
5. Envia webhook de retorno ao Nexus:
   - Sucesso: FACTORY:MINT_CONFIRMED + txHash
   - Falha: FACTORY:MINT_FAILED + error
6. Webhook assinado com HMAC-SHA256 (X-Nexus-Signature)
```

**Webhook de retorno (Factory -> Nexus)**:

```json
// Sucesso
{
  "event": "FACTORY:MINT_CONFIRMED",
  "payload": {
    "contractAddress": "0x41F4...",
    "status": "confirmed",
    "metadata": {
      "txHash": "0xabc...",
      "orderId": "order_abc123",
      "recipient": "0x..."
    }
  }
}

// Falha
{
  "event": "FACTORY:MINT_FAILED",
  "payload": {
    "contractAddress": "0x41F4...",
    "status": "failed",
    "metadata": {
      "orderId": "order_abc123",
      "error": "Insufficient gas"
    }
  }
}
```

**Env vars configuradas no smart-core/.env**:

```bash
PRIVATE_KEY=0x8b5d...                    # MIO Sovereign Identity wallet
FACTORY_PORT=3005
FACTORY_API_KEY=fb691ae...448cd0ca       # Bearer token (inbound)
NEXUS_SECRET=b2a974f...807f81b1          # HMAC secret (outbound)
NEXUS_WEBHOOK_URL=https://nexus.neoprotocol.space/api/webhooks/factory
NEOFLW_TOKEN_ADDRESS=0x41F4...           # Contrato NeoTokenV2 (Polygon)
FACTORY_API_URL=https://smart.neoprotocol.space
NEXUS_API_URL=https://nexus.neoprotocol.space/api
POLYGON_RPC=https://polygon-rpc.com
```

### 3. Auto-Descoberta Dinamica (Novo paradigma)

Com a API /api/ecosystem, os nos podem se auto-configurar em vez de depender de .env estatico:

```javascript
// Exemplo: Nexus descobre a Factory dinamicamente
async function bootstrapEcosystem() {
    const response = await fetch('https://core.neoprotocol.space/api/ecosystem?id=smart-core');
    const { node } = await response.json();
    // node.hosting.productionUrl = "https://smart.neoprotocol.space"
    process.env.FACTORY_API_URL = node.hosting.productionUrl;
}
```

**Impacto na arquitetura**:

| Antes (v2.0)                                      | Depois (v3.0)                                          |
| ------------------------------------------------- | ------------------------------------------------------ |
| Cada no configura URLs dos outros via .env         | Nos consultam /api/ecosystem para descobrir URLs        |
| Mudar URL de um no = editar .env em todos          | Mudar URL = editar ecosystem.json no Neobot apenas      |
| Nexus precisa saber onde Factory esta hardcoded    | Nexus pergunta ao Neobot e descobre em runtime          |
| Config dispersa em N repositorios                  | Fonte unica de verdade: ecosystem.json                  |

**Propagacao planejada**:

| Projeto       | Acao                                                                  | Status     |
| ------------- | --------------------------------------------------------------------- | ---------- |
| Neo-Nexus     | Consumir /api/ecosystem no bootstrap para descobrir Factory e Neobot  | PLANEJADO  |
| FlowPay       | nexus-bridge.mjs consulta /api/ecosystem para URL do Nexus            | PLANEJADO  |
| Smart-Core    | Dashboard consome /api/ecosystem para listar tokens e deployments     | PLANEJADO  |

---

## Mapa de Conexoes Oficiais

Enderecos validados e confirmados em 2026-02-06.
Fonte canonica: `neobot/config/ecosystem.json` (27 nos) via `GET /api/ecosystem`.

| No do Protocolo  | Subdominio / Endpoint Oficial                    | Papel no Ecossistema          |
| ---------------- | ------------------------------------------------ | ----------------------------- |
| Neo-Nexus        | `https://nexus.neoprotocol.space/api`            | Hub Central (Event Bus)       |
| Smart Factory    | `https://smart.neoprotocol.space`                | Mintagem e On-Chain Ops       |
| Neobot (Core)    | `https://core.neoprotocol.space`                 | Registro + Comunicacao        |
| FlowPay          | `https://pay.flowoff.xyz`                        | Gateway de Pagamentos         |
| Fluxx DAO        | `https://fluxx.neoprotocol.space`                | Governanca Descentralizada    |
| MIO Identity     | `https://id.neoprotocol.space`                   | Identidade e Auth (futuro)    |

---

## Estado Real das Integracoes

Auditoria do codigo-fonte atualizada em 2026-02-06 (pos-dispatch v3.0).

### Setas REAIS (codigo implementado)

| Origem          | Destino        | Como                                               | Arquivo fonte                                      | Status     |
| --------------- | -------------- | -------------------------------------------------- | -------------------------------------------------- | ---------- |
| FlowPay         | Neo-Nexus      | POST /api/webhooks/flowpay com HMAC                 | `flowpay/src/services/api/nexus-bridge.mjs`        | PRODUCAO   |
| FlowPay         | Neobot         | POST /tools/invoke (triggerUnlock) DIRETO           | `flowpay/src/services/api/neobot-bridge.mjs`       | LEGADO     |
| Neo-Nexus       | Smart Factory  | POST /api/mint com Bearer token                     | `neo-nexus/src/reactors/payment-to-mint.ts`        | PRODUCAO   |
| Smart Factory   | Neo-Nexus      | POST /api/webhooks/factory com HMAC (callback)      | `smart-core/integrations/nexus/server.js`          | DEPLOYADO  |
| Neobot          | Ecossistema    | GET /api/ecosystem (registro de nomes)              | `neobot/src/gateway/ecosystem-http.ts`             | DEPLOYADO  |

### Setas PLANEJADAS (documentadas, ainda nao implementadas)

| Origem          | Destino        | O que falta                                         | Fase do Roadmap |
| --------------- | -------------- | --------------------------------------------------- | --------------- |
| Neo-Nexus       | Neobot         | Nexus precisa chamar /api/webhook/nexus no Neobot    | FASE 3          |
| FlowPay         | Neo-Nexus ONLY | Remover chamada direta ao Neobot (redundancia)       | FASE 2          |
| Neobot          | Neo-Nexus      | Neobot parar de orquestrar, virar consumer           | FASE 3          |
| Neo-Nexus       | Neobot         | Nexus consumir /api/ecosystem para auto-descoberta   | FASE 2          |

### Diagrama do Estado Atual (pos-dispatch v3.0)

```
ESTADO ATUAL (v3.0):

  Neobot /api/ecosystem ← (fonte de verdade para URLs de todos os nos)
     |
     |  FlowPay ──webhook──> Neo-Nexus ──POST /api/mint──> Smart Factory (smart-core)
     |     |                                                       |
     |     └──direto──> Neobot (LEGADO, a remover)                 └── MINT_CONFIRMED ──> Nexus
     |
     └── Registro: 27 nos com URLs, repos, roles, hosting


ESTADO ALVO (apos roadmap completo):

                    Neobot /api/ecosystem
                         |
                    [auto-descoberta]
                         |
  FlowPay ──webhook──> Neo-Nexus ──POST /api/mint──> Smart Factory
                           |                               |
                           |<──MINT_CONFIRMED──────────────┘
                           |
                           └──webhook──> Neobot ──> WhatsApp/TG
```

---

## Regras Universais

Aplicam-se a **todos** os projetos que se conectam ao Nexus.

| #   | Requisito                     | Detalhe                                                         | Criticidade |
| --- | ----------------------------- | --------------------------------------------------------------- | ----------- |
| U1  | NEXUS_SECRET compartilhado    | Minimo 32 caracteres hex, mesmo valor em todos os nos           | CRITICA     |
| U2  | TLS/SSL obrigatorio           | Todas as comunicacoes HTTPS/WSS, sem excecao                    | CRITICA     |
| U3  | Content-Type JSON             | Header `Content-Type: application/json` em todos os webhooks    | CRITICA     |
| U4  | HMAC-SHA256 em webhooks       | Header `X-Nexus-Signature` com HMAC do body usando NEXUS_SECRET | CRITICA     |
| U5  | timingSafeEqual               | Validacao HMAC via `crypto.timingSafeEqual`, nunca `===`        | CRITICA     |
| U6  | Limite de payload             | Maximo 50KB para REST, 10KB para WebSocket                      | ALTA        |
| U7  | Validacao de dados            | Currency ISO 4217, enderecos 0x format, IDs 1-100 chars         | ALTA        |
| U8  | Rate limiting                 | Respeitar 100 req/15min no Nexus REST API                       | ALTA        |
| U9  | Health check                  | Expor `GET /health` retornando `{ status: "ok" }`               | MEDIA       |
| U10 | Log sanitizado                | Nunca logar tokens, secrets ou senhas em plaintext               | CRITICA     |
| U11 | Retry com backoff exponencial | 3 tentativas (1s, 2s, 4s) ao chamar o Nexus                     | ALTA        |
| U12 | Endpoint de recebimento       | Expor `POST /api/webhook/nexus` para eventos inbound do Nexus   | CRITICA     |
| U13 | Auto-descoberta (v3.0)        | Consultar `/api/ecosystem` no bootstrap em vez de hardcodar URLs | MEDIA       |

### Geracao de assinatura HMAC (referencia)

```javascript
const crypto = require('crypto');

function signPayload(body, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
}

// Envio:
const signature = signPayload(body, NEXUS_SECRET);
headers['X-Nexus-Signature'] = signature;
```

### Validacao de assinatura HMAC (referencia)

```javascript
function verifySignature(req, secret) {
  const received = req.headers['x-nexus-signature'];
  const computed = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(received),
    Buffer.from(computed)
  );
}
```

### Auto-descoberta via /api/ecosystem (referencia v3.0)

```javascript
// Qualquer no pode descobrir outro no em runtime:
async function discoverNode(nodeId) {
  const res = await fetch(`https://core.neoprotocol.space/api/ecosystem?id=${nodeId}`);
  const { ok, node } = await res.json();
  if (!ok) throw new Error(`Node ${nodeId} not found in ecosystem`);
  return node.hosting.productionUrl;
}

// Uso:
const factoryUrl = await discoverNode('smart-core');
// => "https://smart.neoprotocol.space"
```

---

## FlowPay

**Repositorios locais**: `flowpay-core` (UI library, independente), `flowpay` (producao)
**Dominio**: `pay.flowoff.xyz`
**Papel**: Gateway de pagamentos PIX/Crypto
**Estado atual**: Ja envia webhooks para Nexus E chama Neobot diretamente (redundancia a eliminar)

### Checklist

| #   | Requisito              | Detalhe                                                                               | Status    |
| --- | ---------------------- | ------------------------------------------------------------------------------------- | --------- |
| FP1 | Webhook de saida       | Chamar `POST <NEXUS_URL>/api/webhooks/flowpay` ao processar pagamento                 | [x] REAL  |
| FP2 | Assinatura HMAC        | Incluir `X-Nexus-Signature` no header do webhook                                      | [x] REAL  |
| FP3 | Payload de pagamento   | Body: `{ orderId, amount, currency, payerId, status, metadata? }`                     | [x] REAL  |
| FP4 | Status validos         | `status` deve ser: `confirmed`, `completed`, `failed` ou `pending`                    | [ ] CHECK |
| FP5 | Endpoint inbound       | Expor `POST /api/webhook/nexus` para receber eventos (ex: `MINT_CONFIRMED`)           | [ ] FALTA |
| FP6 | Validacao HMAC inbound | Validar `X-Nexus-Signature` nos webhooks recebidos do Nexus                           | [ ] FALTA |
| FP7 | Env vars               | `NEXUS_API_URL`, `NEXUS_AUTH_TOKEN`, `NEXUS_WEBHOOK_URL`                              | [x] REAL  |
| FP8 | Retry com backoff      | 3 tentativas com backoff exponencial ao chamar Nexus                                  | [ ] CHECK |
| FP9 | Currency ISO 4217      | Campo `currency` sempre 3 letras maiusculas (BRL, USD, etc.)                          | [ ] CHECK |
| FP10| Remover chamada direta | Eliminar `neobot-bridge.mjs` — FlowPay nao deve chamar Neobot direto                 | [ ] FASE2 |
| FP11| Auto-descoberta (v3.0) | nexus-bridge.mjs consultar /api/ecosystem para URL do Nexus                           | [ ] FASE2 |

### Env vars confirmadas em producao

```bash
NEXUS_API_URL=https://nexus.neoprotocol.space/api
NEXUS_SECRET=<configurado>
NEOBOT_URL=https://moltbot-production-b25c.up.railway.app  # REMOVER na Fase 2
NEOBOT_API_KEY=neo_bridge_secure_token_v1                   # REMOVER na Fase 2
```

### Payload de referencia (FlowPay -> Nexus)

```json
{
  "orderId": "order_abc123",
  "amount": "1000.00",
  "currency": "BRL",
  "payerId": "5511999999999",
  "status": "confirmed",
  "metadata": {
    "txHash": "0xabc...",
    "reason": "token_purchase"
  }
}
```

---

## Smart Factory

**Repositorio local**: `smart-core` (backend reativo), `neo-smart-factory` (contratos Hardhat)
**Dominio**: `https://smart.neoprotocol.space`
**Papel**: Mintagem de tokens e deploy de contratos on-chain
**Estado atual (v3.0)**: Ingress Adapter completo com /api/mint + webhook de retorno HMAC

### Checklist

| #    | Requisito               | Detalhe                                                                                 | Status           |
| ---- | ----------------------- | --------------------------------------------------------------------------------------- | ---------------- |
| SF1  | Endpoint de mint        | Expor `POST /api/mint` aceitando `{ targetAddress, tokenId, amount, reason, refTxId }`  | [x] IMPLEMENTADO |
| SF2  | Auth Bearer             | Aceitar `Authorization: Bearer <FACTORY_API_KEY>` no endpoint de mint                   | [x] IMPLEMENTADO |
| SF3  | Resposta 202 imediata   | Retornar 202 Accepted imediatamente (mint assincrono)                                   | [x] IMPLEMENTADO |
| SF4  | Webhook de retorno      | Enviar FACTORY:MINT_CONFIRMED ou FACTORY:MINT_FAILED ao Nexus apos mint                 | [x] IMPLEMENTADO |
| SF5  | Assinatura HMAC saida   | Incluir `X-Nexus-Signature` no webhook de retorno                                       | [x] IMPLEMENTADO |
| SF6  | Payload de retorno      | Body: `{ event, payload: { contractAddress, status, metadata: { txHash, orderId } } }`  | [x] IMPLEMENTADO |
| SF7  | contractAddress formato | Formato Ethereum: `0x` seguido de 40 caracteres hexadecimais                            | [x] IMPLEMENTADO |
| SF8  | Status validos          | Events: `FACTORY:MINT_CONFIRMED` ou `FACTORY:MINT_FAILED`                               | [x] IMPLEMENTADO |
| SF9  | Health check            | Expor `GET /health` retornando status ok                                                | [x] IMPLEMENTADO |
| SF10 | Env vars                | `FACTORY_API_KEY`, `NEXUS_SECRET`, `NEXUS_WEBHOOK_URL`, `NEOFLW_TOKEN_ADDRESS`          | [x] CONFIGURADO  |
| SF11 | Deploy producao         | Publicar em `smart.neoprotocol.space` no Railway                                        | [ ] FALTA        |
| SF12 | Endpoint inbound        | Expor `POST /api/webhook/nexus` para receber eventos do Nexus                           | [ ] FALTA        |

### Identidade criptografica

```
Chave privada da Factory: NEO_FACTORY_PRIVATE_KEY (0x8b5d...3afe)
FACTORY_API_KEY: fb691ae48eb507caa35df10028388c81607146ed0f95dab3df59469d448cd0ca
Contrato: NeoTokenV2 em NEOFLW_TOKEN_ADDRESS (0x41F4...)
Metodo: bridgeMint(address target, uint256 amount) — requer signer como bridgeMinter
```

### Payload que o Nexus envia para o Factory (mint request)

```json
{
  "targetAddress": "5511999999999",
  "tokenId": "NEOFLW",
  "amount": "1000",
  "reason": "purchase",
  "refTransactionId": "order_abc123"
}
```

### Payload que a Factory retorna ao Nexus (confirmado no codigo v3.0)

```json
{
  "event": "FACTORY:MINT_CONFIRMED",
  "payload": {
    "contractAddress": "0x41F4...",
    "status": "confirmed",
    "metadata": {
      "txHash": "0xabc123...",
      "orderId": "order_abc123",
      "recipient": "0x..."
    }
  }
}
```

---

## Neobot

**Repositorio local**: `neobot`
**Dominios**: `core.neoprotocol.space` (Neobot Core), `sales.neoprotocol.space` (FlowCloser)
**Papel**: Registro de Nomes do Ecossistema + Notificacoes + Skills autonomas
**Estado atual (v3.0)**: Monolito com /api/ecosystem (DNS do Protocolo) implementado. Nexus embutido (EventEmitter) ainda ativo. Recebe chamadas diretas do FlowPay.

### Checklist

| #    | Requisito                | Detalhe                                                                          | Status         |
| ---- | ------------------------ | -------------------------------------------------------------------------------- | -------------- |
| NB1  | API /api/ecosystem       | Expor GET /api/ecosystem com registro de 27 nos do protocolo                     | [x] DEPLOYADO  |
| NB2  | Filtro por ID            | Suportar ?id=<node-id> para consulta especifica                                  | [x] DEPLOYADO  |
| NB3  | Versionamento API        | Suportar rotas /api/ecosystem e /v1/ecosystem                                    | [x] DEPLOYADO  |
| NB4  | Endpoint webhook         | Expor `POST /api/webhook/nexus` em `core.neoprotocol.space`                      | [ ] FALTA      |
| NB5  | Validacao HMAC           | Validar `X-Nexus-Signature` com `timingSafeEqual`                                | [ ] FALTA      |
| NB6  | Evento PAYMENT_RECEIVED  | Tratar e processar o evento `PAYMENT_RECEIVED` vindo do Nexus                    | [ ] FALTA      |
| NB7  | Evento MINT_CONFIRMED    | Tratar e processar o evento `MINT_CONFIRMED` vindo do Nexus                      | [ ] FALTA      |
| NB8  | Resposta padrao          | Retornar `{ status: "received", event: "<nome>", timestamp: "<ISO>" }`           | [ ] FALTA      |
| NB9  | Notificacao pos-evento   | Disparar WhatsApp/Telegram ao receber MINT_CONFIRMED com dados do payerId        | [ ] FALTA      |
| NB10 | Desativar Nexus embutido | Migrar EventEmitter interno para consumir do Nexus externo                       | [ ] FASE3      |
| NB11 | WebSocket (opcional)     | Conectar via `wss://nexus.neoprotocol.space?token=<SECRET>` para real-time       | [ ] FASE3      |
| NB12 | Env vars Nexus           | `NEXUS_WS_URL`, `NEXUS_AUTH_TOKEN`, `NEXUS_WEBHOOK_SECRET`                       | [ ] FALTA      |

### Payload que o Nexus enviara (MINT_CONFIRMED)

```json
{
  "event": "MINT_CONFIRMED",
  "timestamp": "2026-02-06T12:00:00Z",
  "payload": {
    "orderId": "order_abc123",
    "payerId": "5511999999999",
    "contractAddress": "0x123...",
    "txHash": "0xabc...",
    "amount": "1000",
    "currency": "BRL"
  }
}
```

### Resposta esperada do Neobot

```json
{
  "status": "received",
  "event": "MINT_CONFIRMED",
  "timestamp": "2026-02-06T12:00:01Z"
}
```

### Env vars Nexus (configuradas no .env do neobot)

```bash
NEXUS_API_URL=https://nexus.neoprotocol.space/api
NEXUS_WS_URL=wss://nexus.neoprotocol.space
NEXUS_SECRET=<compartilhado com todos os nos>
```

---

## Fluxx DAO

**Dominio**: `fluxx.neoprotocol.space`
**Papel**: Governanca descentralizada e protocolo de liquidez
**Estado atual**: Sem integracao com Nexus (FASE 3+)

### Checklist

| #   | Requisito                | Detalhe                                                                 | Status    |
| --- | ------------------------ | ----------------------------------------------------------------------- | --------- |
| FX1 | Webhook PROPOSAL_CREATED | Chamar Nexus ao criar nova proposta de governanca                       | [ ] FASE3 |
| FX2 | Webhook VOTE_CAST        | Chamar Nexus ao registrar voto                                          | [ ] FASE3 |
| FX3 | Assinatura HMAC          | Incluir `X-Nexus-Signature` em todas as chamadas                        | [ ] FASE3 |
| FX4 | Payload governance       | Body: `{ proposalId, voterId, decision: "for" | "against" }`            | [ ] FASE3 |
| FX5 | Endpoint inbound         | Expor `POST /api/webhook/nexus` para receber eventos do ecossistema     | [ ] FASE3 |
| FX6 | Env vars                 | `FLUXX_API_KEY`, `NEXUS_API_URL`, `NEXUS_AUTH_TOKEN`                    | [ ] FASE3 |

---

## Projetos Opcionais

Integracao parcial — requisitos minimos para conectar ao Nexus. Todos sao FASE 3+.

| Projeto           | Repo local         | Dominio                        | Requisitos minimos                                           |
| ----------------- | ------------------ | ------------------------------ | ------------------------------------------------------------ |
| NEO FlowOFF       | `neo-flowoff-pwa`  | `flowoff.xyz`                  | Env: `FLOWOFF_API_KEY`, endpoint `/api/webhook/nexus`        |
| WOD [X] PRO       | ---                | `app.wodx.pro`                 | Env: `WOD_API_KEY`, endpoint `/api/webhook/nexus`            |
| NEO Agent Node    | `neo-agent-full`   | `agent-node.neoprotocol.space` | Env: `AGENT_NODE_API_KEY`, endpoint `/api/webhook/nexus`     |
| NEO Protocol Core | `neo-protcl`       | `neoprotocol.space`            | Env: `PROTOCOL_API_KEY`, endpoint `/api/webhook/nexus`       |
| MIO Identity      | ---                | `id.neoprotocol.space`         | Emitir `IDENTITY_VERIFIED` via webhook, validacao HMAC       |

---

## Fluxo Critico

### Payment > Mint > Notify (end-to-end)

```
FlowPay                     Nexus                      Factory                   Neobot
   |                          |                           |                          |
   |--- POST /webhooks/flowpay -->                        |                          |
   |    [HMAC + payload]      |                           |                          |
   |                          |--- POST /api/mint ------->|                          |
   |                          |    [Bearer FACTORY_KEY]    |                          |
   |                          |                           |                          |
   |                          |                    [202 Accepted]                    |
   |                          |                    [mint on-chain]                   |
   |                          |                           |                          |
   |                          |<-- POST /webhooks/factory -|                          |
   |                          |    [HMAC + MINT_CONFIRMED] |                          |
   |                          |                                                      |
   |                          |--- POST /api/webhook/nexus ----------------------->|
   |                          |    [HMAC + MINT_CONFIRMED]                           |
   |                          |                                     [WhatsApp msg]  |
```

### Pontos de falha a validar

| Ponto | De > Para            | O que pode falhar                                        | Status (v3.0) |
| ----- | -------------------- | -------------------------------------------------------- | ------------- |
| A     | FlowPay > Nexus      | HMAC invalido, payload incompleto, Nexus fora do ar      | OK (producao) |
| B     | Nexus > Factory      | API key incorreta, Factory timeout, endpoint inexistente | PRONTO (code) |
| C     | Factory > Nexus      | HMAC invalido, contractAddress formato errado            | PRONTO (code) |
| D     | Nexus > Neobot       | Endpoint inexistente, HMAC rejeitado, sem retry          | FALTA         |
| E     | Neobot > Usuario     | WhatsApp API fora, payerId invalido                      | FALTA         |

---

## Matriz de Seguranca

### Chaves e Identidades Criptograficas Validadas

| Identidade              | Tipo              | Valor / Referencia                                               | Status    |
| ----------------------- | ----------------- | ---------------------------------------------------------------- | --------- |
| NEXUS_SECRET            | Shared Secret     | `b2a974f...807f81b1` (64 chars hex)                              | ATIVO     |
| FACTORY_API_KEY         | Bearer Token      | `fb691ae...448cd0ca` (64 chars hex)                              | ATIVO     |
| NEO_FACTORY_PRIVATE_KEY | Chave Privada     | `0x8b5d...3afe` (Ethereum signing key)                           | ATIVO     |
| NEOFLW_TOKEN_ADDRESS    | Contrato          | `0x41F4...` (NeoTokenV2 na Polygon)                              | ATIVO     |
| NEOBOT_API_KEY          | API Key           | `neo_bridge_secure_token_v1`                                     | LEGADO    |

### Validacao cruzada de secrets (v3.0)

| Secret         | Neobot .env | Smart-Core .env | FlowPay .env | Neo-Nexus .env |
| -------------- | ----------- | --------------- | ------------ | -------------- |
| NEXUS_SECRET   | MATCH       | MATCH           | MATCH        | MATCH          |
| FACTORY_API_KEY| ---         | CONFIGURADO     | ---          | CONFIGURADO    |

### Notas de seguranca

- O `NEXUS_SECRET` e o segredo compartilhado entre todos os nos para HMAC-SHA256
- O `FACTORY_API_KEY` e usado pelo Nexus para autenticar no endpoint `/api/mint` da Factory
- O `NEO_FACTORY_PRIVATE_KEY` e usado pela Factory para assinar transacoes on-chain (bridgeMint)
- O `NEOBOT_API_KEY` e LEGADO — sera descontinuado quando FlowPay parar de chamar Neobot direto
- O endpoint `/api/ecosystem` e PUBLICO por design — somente leitura, sem secrets expostos
- **FASE 4**: Substituir shared secrets pelo MIO Identity System (autenticacao por identidade)

---

## Roadmap de Execucao

### The Ignition Path

```
deployStrategy: "infrastructure-core-features"
Ordem: Infraestrutura (Nexus) -> Core (FlowPay, Factory) -> Features (Neobot, Fluxx, etc.)
```

### FASE 1 — Ativacao dos Nos (Smart Factory como No Reativo)

**Objetivo**: Dar "ouvidos" a Factory para que o Nexus consiga pedir um mint.
**Status**: QUASE COMPLETO (falta deploy)

| Item | Acao                                                                | Status           |
| ---- | ------------------------------------------------------------------- | ---------------- |
| 1.1  | Criar Ingress Adapter em `smart-core/integrations/nexus/server.js`  | FEITO            |
| 1.2  | Endpoint `POST /api/mint` aceitando payload do Nexus                | FEITO            |
| 1.3  | Auth via `Authorization: Bearer <FACTORY_API_KEY>`                  | FEITO            |
| 1.4  | Factory envia MINT_CONFIRMED de volta ao Nexus apos mint            | FEITO (v3.0)     |
| 1.5  | HMAC na resposta (X-Nexus-Signature)                                | FEITO (v3.0)     |
| 1.6  | Resposta 202 Accepted imediata (mint assincrono)                    | FEITO (v3.0)     |
| 1.7  | Deploy do smart-core em `smart.neoprotocol.space`                   | FALTA            |
| 1.8  | Nexus: implementar dead letter queue para eventos sem resposta      | FALTA            |
| 1.9  | Nexus: implementar retry exponencial no reactor payment-to-mint     | CHECK            |
| 1.10 | Neobot: /api/ecosystem implementado e pushado                       | FEITO (v3.0)     |

**Resultado esperado**: Nexus pede mint -> Factory processa on-chain -> Factory confirma de volta ao Nexus.

### FASE 2 — Desacoplamento do FlowPay + Auto-Descoberta

**Objetivo**: Eliminar redundancia e implementar descoberta dinamica.
**Status**: NAO INICIADO

| Item | Acao                                                                | Status |
| ---- | ------------------------------------------------------------------- | ------ |
| 2.1  | FlowPay: remover `neobot-bridge.mjs` do webhook handler            | FALTA  |
| 2.2  | FlowPay: manter APENAS `nexus-bridge.mjs` como saida               | FALTA  |
| 2.3  | FlowPay: remover env vars `NEOBOT_URL` e `NEOBOT_API_KEY`          | FALTA  |
| 2.4  | FlowPay: expor `POST /api/webhook/nexus` para receber do Nexus     | FALTA  |
| 2.5  | FlowPay: implementar validacao HMAC inbound                        | FALTA  |
| 2.6  | Nexus: consumir /api/ecosystem no bootstrap para descobrir nos      | FALTA  |
| 2.7  | FlowPay: nexus-bridge consultar /api/ecosystem para URL do Nexus   | FALTA  |
| 2.8  | Testar fluxo: FlowPay -> Nexus (sem Neobot direto)                 | FALTA  |

**Resultado esperado**: FlowPay so fala com Nexus. Nos descobrem URLs via /api/ecosystem.

### FASE 3 — Transicao do Neobot para Consumidor

**Objetivo**: Neobot para de "adivinhar" e passa a ouvir a confirmacao definitiva via Nexus.
**Status**: NAO INICIADO

| Item | Acao                                                                | Status |
| ---- | ------------------------------------------------------------------- | ------ |
| 3.1  | Neobot: expor `POST /api/webhook/nexus` em core.neoprotocol.space  | FALTA  |
| 3.2  | Neobot: implementar validacao HMAC (X-Nexus-Signature)              | FALTA  |
| 3.3  | Neobot: tratar evento MINT_CONFIRMED -> disparar WhatsApp           | FALTA  |
| 3.4  | Neobot: tratar evento PAYMENT_RECEIVED -> log/notificacao           | FALTA  |
| 3.5  | Neobot: retornar resposta padrao `{ status, event, timestamp }`     | FALTA  |
| 3.6  | Nexus: configurar rota outbound para Neobot no ecosystem            | FALTA  |
| 3.7  | Testar fluxo completo: Payment -> Mint -> Notify via Nexus          | FALTA  |

**Resultado esperado**: Factory confirma mint -> Nexus roteia -> Neobot notifica usuario no WhatsApp.

### FASE 4 — Ecossistema Expandido

**Objetivo**: Conectar nos secundarios e migrar seguranca para MIO.
**Status**: FUTURO

| Item | Acao                                                                | Status |
| ---- | ------------------------------------------------------------------- | ------ |
| 4.1  | Fluxx DAO: integrar com Nexus (PROPOSAL_CREATED, VOTE_CAST)        | FUTURO |
| 4.2  | MIO Identity: substituir NEXUS_SECRET por autenticacao MIO          | FUTURO |
| 4.3  | Nexus: implementar circuit breaker                                  | FUTURO |
| 4.4  | Nexus: implementar monitoring/alerting                              | FUTURO |
| 4.5  | Neobot: desativar Nexus embutido (EventEmitter) completamente       | FUTURO |
| 4.6  | Conectar nos opcionais (FlowOFF, WOD, Agent Node, Protocol Core)    | FUTURO |

---

## Proximos Passos

### Acoes imediatas (para fechar FASE 1)

1. **Deploy smart-core (SF11)**: Publicar em `smart.neoprotocol.space` no Railway
2. **Verificar deploy do Neobot**: Confirmar que /api/ecosystem esta acessivel em producao
3. **Nexus dead letter queue**: Implementar fila de eventos nao entregues

### Acoes de planejamento

4. **Definir janela de transicao**: Quando o FlowPay para de chamar Neobot direto (FASE 2)
5. **Implementar auto-descoberta no Nexus**: Consumir /api/ecosystem no bootstrap
6. **Alinhar com roadmap do Neobot**: Planejar migracao de monolito para consumer (FASE 3)
7. **Teste end-to-end em staging**: Simular Payment > Mint > Notify antes de producao

### Governanca do documento

- Revisar apos cada fase concluida
- Atualizar status dos itens conforme implementacao
- Versionar mudancas de contrato entre projetos
- Fonte canonica de URLs: `neobot/config/ecosystem.json` via `/api/ecosystem`

---

> **Arquitetura eleita**: Neo-Nexus como Hub Central
> **Deploy strategy**: infrastructure-core-features
> **Versao**: 3.0 — Protocol Dispatch executado
> **Proxima revisao**: Apos deploy do smart-core em producao (FASE 1 fechada)
> **Responsavel**: NEO Protocol Core Team
