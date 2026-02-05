<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
```text
========================================
    NEXUS TECHNICAL SETUP GUIDE
========================================
[####] System PROTOCOL NEXUS ......... OK
[####] Target Developers & Operators . OK
[####] Environment Production Ready .. OK
========================================
```

## 1. Arquitetura Técnica

O Nexus é o orquestrador central que roda em ambiente Node.js/TypeScript.

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ NEXUS CORE
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ░ src/core/nexus.ts
┃ ░ Event Bus (EventEmitter)
┃ ░ Reactors (IFTTT Logic)
┃ ░ Persistence (SQLite)
```

### Eventos Principais
- **`PAYMENT_RECEIVED`**: Disparado quando um pagamento é confirmado (FlowPay).
- **`MINT_REQUESTED`**: Nexus solicita à Smart Factory que inicie o processo de mint local.
- **`MINT_CONFIRMED`**: Fábrica avisa que o contrato/token está on-chain.
- **`NOTIFICATION_DISPATCH`**: Nexus solicita ao Neobot que notifique o usuário final.

---

## 2. Infraestrutura e Deploy

### Railway (Recomendado)
Nexus está otimizado para a plataforma Railway.
- **Deploy Automático**: Vinculado ao GitHub na branch `main`.
- **Configuração**: `railway.json` define o ambiente.
- **SSL**: Gerenciado automaticamente pelo Railway/Cloudflare.

### VPS Soberana (Self-Hosted)
Pode ser rodado via Docker:
```bash
docker build -t neo-nexus .
docker run -p 3000:3000 neo-nexus
```

---

## 3. Comandos Úteis

```bash
# Instalar dependências
npm install

# Build TypeScript
npm run build

# Rodar em desenvolvimento
npm run dev

# Verificar Lint (Padrão NΞØ)
npm run lint

# Health check local
curl http://localhost:3000/health
```

---

## 4. Variáveis de Ambiente (.env)

Crie um arquivo `.env` baseado no `.env.example`:

```bash
NODE_ENV=production
PORT=3000

# Segurança
NEXUS_SECRET=sua_chave_hmac_aqui

# Integrações
FLOWPAY_API_KEY=sua_chave_aqui
NEOBOT_API_KEY=sua_chave_aqui
FLUXX_API_KEY=sua_chave_aqui
FACTORY_API_KEY=sua_chave_aqui

# MIO Identity System (Identidades Soberanas)
MIO_API_URL=https://id.neoprotocol.space
NEO_CORE_PRIVATE_KEY=0x...
NEO_GATEWAY_PRIVATE_KEY=0x...
# ... etc (9 chaves são suportadas)
```

---

## 5. Verificação de Segurança (WebSocket)

O servidor exige autenticação via Token/Secret.

```bash
# Teste automatizado
npx tsx scripts/test-connection.ts

# Teste manual com wscat
wscat -c "ws://localhost:3000?token=SEU_NEXUS_SECRET"
```

---

## 6. Estrutura de Diretórios

```text
└─ src/
   ├─ core/       -> Lógica central e Event Bus
   ├─ reactors/   -> Processamento de regras de negócio (IFTTT)
   ├─ routes/     -> Endpoints REST e Webhooks
   ├─ websocket/  -> Servidor de tempo real (Streaming de Eventos)
   └─ server.ts   -> Entrypoint do servidor Express/WS
```

---

## 7. Troubleshooting

- **401 Unauthorized**: Verifique se a `X-Nexus-Signature` (REST) ou o `token` (WS) estão batendo com o `NEXUS_SECRET`.
- **Vulnerabilidades**: Rode `npm audit` para checar dependências.
- **Build falha**: Garanta a versão do Node >= 18.

---

▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Security by design. Chaos is the exception, Protocol is the rule."
────────────────────────────────────────
