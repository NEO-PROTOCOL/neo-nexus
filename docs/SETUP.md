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

## 2. Infraestrutura (Onde Rodar?)

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

## 3. Integrações (Conectar Nós)

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

## 4. Roadmap (Próximos 3 Dias)

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

## 5. Configuração GitHub/Railway

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

## 6. Comandos Úteis

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

## 7. Docker Setup

```bash
# Build da imagem
docker build -t neo-nexus .

# Rodar container
docker run -p 3000:3000 neo-nexus

# Com variáveis de ambiente
docker run -p 3000:3000 \
  -e NEXUS_SECRET=your_secret \
  -e SMART_FACTORY_API_KEY=your_key \
  neo-nexus
```

## 7.1. Verificação de Segurança (WebSocket)

O servidor agora exige autenticação para conexões WebSocket.

```bash
# Instalar wscat (ferramenta de teste)
npm install -g wscat

# Teste (Deve Falhar - 401 Unauthorized)
wscat -c ws://localhost:3000

# Teste (Deve Funcionar)
wscat -c "ws://localhost:3000?token=SEU_NEXUS_SECRET"
```

Alternativamente, use o script local:

```bash
# Rodar teste automatizado
npm install tsx -g
npx tsx scripts/test-connection.ts
```

────────────────────────────────────────

## 8. Estrutura de Diretórios

```text
▓▓▓ ESTRUTURA DO PROJETO
────────────────────────────────────────
└─ src/
   └─ core/
      └─ nexus.ts (Event Bus)
   └─ middleware/
      └─ auth.ts (Autenticação)
   └─ routes/
      └─ webhooks.ts (Endpoints)
   └─ types/
      └─ events.ts (Tipos)
└─ config/
   └─ ecosystem.json
└─ dist/ (build output)
```

────────────────────────────────────────

## 9. Variáveis de Ambiente

```bash
# .env.example
NODE_ENV=production
PORT=3000
NEXUS_SECRET=your_nexus_secret_here
SMART_FACTORY_API_KEY=your_api_key_here
FLOWPAY_WEBHOOK_SECRET=your_webhook_secret
DATABASE_URL=sqlite:./data/nexus.db
```

────────────────────────────────────────

## 10. Troubleshooting

```text
▓▓▓ PROBLEMAS COMUNS
────────────────────────────────────────
└─ Build falha
   • Verificar versão Node.js (>=18)
   • Limpar node_modules e reinstalar

└─ Webhook não recebe eventos
   • Verificar HMAC secret
   • Checar logs do Railway
   • Testar endpoint com curl

└─ Factory não responde
   • Verificar API key
   • Checar status da Factory
   • Implementar retry logic
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
