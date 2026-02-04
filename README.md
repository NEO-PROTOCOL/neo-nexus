# NEXUS OPERATIONS MANUAL
> **System:** PROTOCOL NEXUS (Event Bus)
> **Status:** ACTIVE (v1.0)
> **Target:** Architects & Node Operators

## 1. O Que É o Nexus?

O **Nexus** é o sistema nervoso central do NEØBOT. Ele substitui a comunicação "ponto-a-ponto" caótica por um **Barramento de Eventos Unificado**.

*   **Antes:** O FlowPay tinha que saber o IP da Smart Factory para pedir um contrato. Se o IP mudasse, quebrava.
*   **Agora:** O FlowPay avisa o Nexus: "Pagamento Recebido". O Nexus decide quem deve reagir (Smart Factory, Notificações, Fluxx).

---

## 2. Arquitetura Técnica

O Nexus roda dentro do processo do Gateway (`src/nexus/index.ts`).

### Tipos de Eventos Principais
1.  `PAYMENT_RECEIVED`: Disparado quando dinheiro entra (FlowPay).
2.  `MINT_REQUESTED`: O Nexus traduz o pagamento em uma ordem de serviço para a Fabrica.
3.  `MINT_CONFIRMED`: A Fábrica avisa que o contrato está on-chain.
4.  `NOTIFICATION_DISPATCH`: O Nexus avisa o usuário no WhatsApp/Telegram.

---

## 3. Guia de Infraestrutura (Onde Rodar?)

Para produção, o Nexus (NEOBOT) precisa de estabilidade.

### Opção A: Railway (Recomendada Atual)
*   **Vantagem:** Deploy contínuo via GitHub, logs fáceis, SSL automático.
*   **Configuração:** Já está configurado no `railway.json`. Apenas garanta que as variáveis de ambiente (chaves de API) estejam lá.

### Opção B: VPS Soberana (Próximo Passo)
*   **Vantagem:** Controle total, custo fixo, IP estático para whitelists de banco.
*   **Setup:** Docker Compose rodando o Gateway + Redis (para persistência de fila futura).

**Veredito:** Mantenha no **Railway** por enquanto. Mover para VPS só quando o volume de transações exigir IP fixo para whitelisting bancário.

---

## 4. Integrações Externas (Como Conectar os Nós)

Aqui está o trabalho para os próximos dias.

### A. Conectar FlowPay -> Nexus (Prioridade Alta)
O FlowPay precisa avisar o Nexus quando um PIX cai.
1.  **No FlowPay:** Configurar um Webhook que aponte para `https://core.neoprotocol.space/api/webhook/flowpay`.
2.  **No Neobot (Nexus):** Criar esse endpoint HTTP (em `src/server/index.ts` ou plugin) que recebe o JSON, valida a assinatura e dispara `Nexus.dispatch(ProtocolEvent.PAYMENT_RECEIVED, data)`.

### B. Conectar Nexus -> Smart Factory
O Nexus precisa mandar a Fábrica trabalhar.
1.  **Na Smart Factory:** Garantir que existe uma API (ex: `POST /api/mint`) que aceita uma chave de API segura.
2.  **No Neobot (Nexus):** No Reactor `PAYMENT_RECEIVED`, implementar a chamada `fetch('https://smart.neoprotocol.space/api/mint', ...)` com os dados do pagamento.

### C. Conectar Smart Factory -> Nexus (Callback)
A Fábrica precisa avisar quando terminar.
1.  **Na Smart Factory:** Ao terminar o deploy, chamar o Webhook do Nexus `POST /api/webhook/factory` com o endereço do contrato.
2.  **No Neobot (Nexus):** Disparar `ProtocolEvent.MINT_CONFIRMED` e notificar o cliente.

---

## 5. Roadmap de Desenvolvimento (Próximos 3 Dias)

### Dia 1: A Ponte de Entrada (Ingress)
*   [ ] Criar endpoint HTTP no Neobot para receber Webhooks externos (FlowPay/Factory).
*   [ ] Implementar validação de segurança (HMAC Signature) para aceitar apenas chamadas legítimas.

### Dia 2: A Lógica de Reação (Reactors)
*   [ ] Implementar o Reactor `PAYMENT_RECEIVED` real: Fazer a chamada HTTP para a Smart Factory.
*   [ ] Tratar erros: O que acontece se a Factory estiver fora do ar? (Implementar Retry simples).

### Dia 3: O Feedback (Notifications)
*   [ ] Implementar o Reactor `MINT_CONFIRMED`: Usar o canal WhatsApp/Telegram já existente para enviar: *"Seu contrato foi deployado! Hash: 0x123..."*

---

## 6. Configuração no GitHub

Para que isso flua via CI/CD:
1.  **Secrets:** Adicione `SMART_FACTORY_API_KEY` e `FLOWPAY_WEBHOOK_SECRET` nas Secrets do repositório `neobot` (e no Railway).
2.  **Protection Rules:** Mantenha a branch `main` protegida. Só aceite PRs que passem no `pnpm analyze` (nosso Sovereign Eye).

---
*Documento gerado por Agent Antigravity para NEØ Protocol.*
