<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
```text
========================================
    NΞØ NEXUS - PROTOCOL CORE
========================================
[####] System Event Bus .............. OK
[####] Status ACTIVE (v1.0) .......... OK
[####] Role Central Nervous System ... OK
========================================
```

## 1. O Que É o Nexus?

O **Nexus** é o sistema nervoso central
do ecossistema NΞØ Protocol. Substitui
comunicação caótica ponto-a-ponto por um
**Barramento de Eventos Unificado**.

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

## 2. Papel no Ecossistema NΞØ

O Nexus conecta todos os nós do protocolo
através de eventos, garantindo comunicação
desacoplada e resiliente.

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ECOSSISTEMA NΞØ PROTOCOL
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ░ FlowPay (Pagamentos)
┃ ░ Smart Factory (Contratos)
┃ ░ Neobot (Comunicação)
┃ ░ Fluxx (Liquidez)
┃ ░ FlowOFF (MiniApp TON)
┃ ░
┃ ░ → NEXUS ← (Centro de Comando)
```

────────────────────────────────────────

## 3. Nós Conectados

```text
▓▓▓ FLOWPAY
────────────────────────────────────────
└─ Função
   Gateway de pagamentos PIX/Crypto

└─ Integração com Nexus
   Dispara PAYMENT_RECEIVED, PAYMENT_FAILED

└─ Repositório
   <https://github.com/NEO-PROTOCOL/
   flowpay>
```

```text
▓▓▓ SMART FACTORY
────────────────────────────────────────
└─ Função
   Fábrica de contratos inteligentes
   (Jettons TON)

└─ Integração com Nexus
   Dispara MINT_CONFIRMED,
   CONTRACT_DEPLOYED

└─ Repositório
   <https://github.com/NEO-PROTOCOL/
   neo-smart-factory>
```

```text
▓▓▓ NEOBOT
────────────────────────────────────────
└─ Função
   Gateway de comunicação multi-canal
   (WhatsApp, Telegram, Discord)

└─ Integração com Nexus
   Consome NOTIFICATION_DISPATCH,
   LEAD_QUALIFIED

└─ Repositório
   <https://github.com/NEO-PROTOCOL/
   neobot>
```

```text
▓▓▓ FLUXX DAO
────────────────────────────────────────
└─ Função
   Protocolo de liquidez e governança

└─ Integração com Nexus
   Dispara PROPOSAL_CREATED, VOTE_CAST
```

```text
▓▓▓ NEO FLOWOFF AGENCY
────────────────────────────────────────
└─ Função
   Interface TON e serviços de agência

└─ Integração com Nexus
   Dispara TRAFFIC_CONVERSION,
   SERVICE_REQUESTED

└─ Repositório
   <https://github.com/NEO-PROTOCOL/
   neo-flowoff-pwa>
```

```text
▓▓▓ WOD [X] PRO
────────────────────────────────────────
└─ Função
   Move2Earn e Gamificação

└─ Integração com Nexus
   Dispara WORKOUT_COMPLETED,
   REWARD_CLAIMED
```

```text
▓▓▓ NEO AGENT NODE
────────────────────────────────────────
└─ Função
   Nó de Agentes Autônomos

└─ Integração com Nexus
   Dispara TASK_COMPLETED, AGENT_ALERT
```

```text
▓▓▓ NEO PROTOCOL CORE
────────────────────────────────────────
└─ Função
    Governança On-Chain e Staking

└─ Integração com Nexus
   Dispara STAKING_DEPOSITED,
   GOVERNANCE_UPDATED
```

────────────────────────────────────────

## 4. Fluxo de Eventos Típico

```text
▓▓▓ CRIAÇÃO DE TOKEN (Exemplo)
────────────────────────────────────────
1. Usuário paga via FlowPay
   └─ FlowPay → Nexus
      PAYMENT_RECEIVED

2. Nexus valida e dispara
   └─ Nexus → Smart Factory
      MINT_REQUESTED

3. Factory deploya contrato
   └─ Smart Factory → Nexus
      MINT_CONFIRMED

4. Nexus notifica usuário
   └─ Nexus → Neobot
      NOTIFICATION_DISPATCH

5. Usuário recebe confirmação
   └─ WhatsApp: "Token deployado!
      Hash: 0x123..."
```

────────────────────────────────────────

## 5. Filosofia de Design

```text
▓▓▓ PRINCÍPIOS NEXUS
────────────────────────────────────────
└─ Desacoplamento
   Nós não se conhecem diretamente.
   Apenas conhecem eventos.

└─ Resiliência
   Se um nó cai, Nexus retenta.
   Sistema continua operando.

└─ Auditabilidade
   Todo evento é registrado.
   Rastreabilidade completa.

└─ Soberania
   Sem dependências externas críticas.
   Controle total do fluxo.
```

────────────────────────────────────────

## 6. Documentação

Para desenvolvedores e operadores, as instruções técnicas estão separadas para manter a clareza da visão:

- **📋 [SETUP TÉCNICO](./SETUP.md)**: Instalação, Comandos e Variáveis.
- **🏗️ [ARQUITETURA](./docs/ARCHITECTURE.md)**: Desenho do sistema e fluxos.
- **📄 [ECOSYSTEM](./config/ecosystem.json)**: Registro de todos os nós do protocolo.

────────────────────────────────────────

## 7. Status do Ecossistema

O Nexus já está integrado e orquestrando as seguintes conexões em produção:

- **FlowPay [Connected]**: Notificações de PIX e Crypto.
- **Smart Factory [Connected]**: Deploys de tokens on-chain.
- **Neobot [Connected]**: Disparo de mensagens e logs.

────────────────────────────────────────

## 8. Visão de Futuro

O Nexus é a fundação para a **Hiper-Automação do NΞØ Protocol**:

- **Automação Total**: Workflows complexos sem intervenção manual.
- **Escalabilidade**: Adicionar novos nós sem modificar a infraestrutura central.
- **Soberania Digital**: Redução de intermediários através de orquestração criptográfica.

────────────────────────────────────────

## 9. Contribuindo

O Nexus é código aberto. Buscamos desenvolvedores que acreditam na descentralização e na eficiência protocolar.

- **Padrão**: Conventional Commits.
- **Tecnologia**: TypeScript / Node.js.
- **Segurança**: Auditoria contínua e Web3-first.

────────────────────────────────────────

▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until chaos becomes protocol."

Security by design.
Exploits find no refuge here.
────────────────────────────────────────

