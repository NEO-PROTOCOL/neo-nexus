<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
```text
========================================
    NEXUS OPERATIONS MANUAL
========================================
[####] System PROTOCOL NEXUS ......... OK
[####] Status ACTIVE (v1.0) .......... OK
[####] Target Architects & Operators . OK
========================================
```

## 1. O Que É o Nexus?

O **Nexus** é o sistema nervoso central
do NEØBOT. Substitui comunicação caótica
ponto-a-ponto por um **Barramento de
Eventos Unificado**.

```text
▓▓▓ ANTES vs AGORA
────────────────────────────────────────
└─ ANTES
   FlowPay tinha que saber o IP da
   Smart Factory. Se IP mudasse, quebrava.

└─ AGORA
   FlowPay avisa Nexus: "Pagamento OK".
   Nexus decide quem reage (Factory,
   Notificações, Fluxx).
```

────────────────────────────────────────

## 2. Arquitetura Técnica

O Nexus roda dentro do processo Gateway.

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ NEXUS CORE
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ░ src/core/nexus.ts
┃ ░ Event Bus (EventEmitter)
┃ ░ Reactors (IFTTT Logic)
┃ ░ Persistence (SQLite)
```

```text
▓▓▓ EVENTOS PRINCIPAIS
────────────────────────────────────────
└─ PAYMENT_RECEIVED
   Disparado quando dinheiro entra
   (FlowPay PIX/Crypto)

└─ MINT_REQUESTED
   Nexus traduz pagamento em ordem
   de serviço para Smart Factory

└─ MINT_CONFIRMED
   Fábrica avisa: contrato on-chain

└─ NOTIFICATION_DISPATCH
   Nexus avisa usuário via WhatsApp
```

────────────────────────────────────────

## 3. Infraestrutura (Onde Rodar?)

Para produção, Nexus precisa estabilidade.

```text
▓▓▓ OPÇÃO A: RAILWAY (Atual)
────────────────────────────────────────
└─ Vantagens
   • Deploy contínuo via GitHub
   • Logs fáceis, SSL automático
   • Já configurado (railway.json)

└─ Configuração
   Garanta variáveis de ambiente
   (API keys) no Railway Dashboard
```

```text
▓▓▓ OPÇÃO B: VPS SOBERANA (Futuro)
────────────────────────────────────────
└─ Vantagens
   • Controle total, custo fixo
   • IP estático para whitelists

└─ Setup
   Docker Compose + Redis
   (persistência de fila)
```

**Veredito:** Mantenha **Railway** por
enquanto. VPS só quando volume exigir
IP fixo para whitelisting bancário.

────────────────────────────────────────

## 4. Integrações (Conectar Nós)

Trabalho para os próximos dias.

```text
▓▓▓ A. FLOWPAY → NEXUS (Alta Prioridade)
────────────────────────────────────────
└─ No FlowPay
   Configurar Webhook apontando para:
   https://core.neoprotocol.space/
   api/webhook/flowpay

└─ No Neobot (Nexus)
   Criar endpoint HTTP que recebe JSON,
   valida assinatura HMAC e dispara:
   Nexus.dispatch(
     ProtocolEvent.PAYMENT_RECEIVED,
     data
   )
```

```text
▓▓▓ B. NEXUS → SMART FACTORY
────────────────────────────────────────
└─ Na Smart Factory
   Garantir API existe:
   POST /api/mint (com API key)

└─ No Neobot (Nexus)
   No Reactor PAYMENT_RECEIVED,
   implementar chamada:
   fetch('https://smart.neoprotocol.space
         /api/mint', ...)
```

```text
▓▓▓ C. SMART FACTORY → NEXUS (Callback)
────────────────────────────────────────
└─ Na Smart Factory
   Ao terminar deploy, chamar:
   POST /api/webhook/factory
   (com endereço do contrato)

└─ No Neobot (Nexus)
   Disparar ProtocolEvent.MINT_CONFIRMED
   e notificar cliente
```

────────────────────────────────────────

## 5. Roadmap (Próximos 3 Dias)

```text
[#---] Dia 1: Ponte de Entrada ..... WARN
       └─ Criar endpoint HTTP no Neobot
          para receber Webhooks externos
       └─ Implementar validação HMAC
          (aceitar apenas chamadas legítimas)

[#---] Dia 2: Lógica de Reação ..... WARN
       └─ Implementar Reactor real:
          PAYMENT_RECEIVED → Smart Factory
       └─ Tratar erros: Retry se Factory
          estiver offline

[#---] Dia 3: Feedback ............. WARN
       └─ Implementar Reactor:
          MINT_CONFIRMED → WhatsApp/Telegram
       └─ Mensagem: "Seu contrato foi
          deployado! Hash: 0x123..."
```

────────────────────────────────────────

## 6. Configuração GitHub/Railway

Para CI/CD fluir corretamente:

```text
▓▓▓ SECRETS NECESSÁRIOS
────────────────────────────────────────
└─ NEXUS_SECRET
   Chave HMAC para validar webhooks
   (gerar: openssl rand -hex 32)

└─ SMART_FACTORY_API_KEY
   Autenticação para chamar Factory

└─ FLOWPAY_WEBHOOK_SECRET
   Validar assinaturas do FlowPay
```

```text
▓▓▓ PROTEÇÃO DE BRANCH
────────────────────────────────────────
└─ Branch main protegida
└─ PRs devem passar em:
   • npm audit (segurança)
   • npm run build (compilação)
   • Análise de código (se houver)
```

────────────────────────────────────────

## 7. Links Rápidos

- **Repositório:**
  <https://github.com/NEO-PROTOCOL/neo-nexus>

- **Arquitetura:**
  `ARCHITECTURE.md`

- **Plano de Implementação:**
  `IMPLEMENTATION_PLAN.md`

- **Bootstrap:**
  `BOOTSTRAP.md`

- **Ecosystem:**
  `config/ecosystem.json`

────────────────────────────────────────

## 8. Comandos Úteis

```bash
# Instalar dependências
npm install

# Build TypeScript
npm run build

# Rodar em dev
npm run dev

# Health check
curl http://localhost:3000/health

# Deploy Railway
git push origin main
```

────────────────────────────────────────

▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
 chaos becomes protocol."

Security by design.
Exploits find no refuge here.
────────────────────────────────────────
