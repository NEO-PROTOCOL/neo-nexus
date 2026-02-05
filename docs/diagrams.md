<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# 📊 NΞØ PROTOCOL - SISTEMA DE DIAGRAMAS

Este documento contém a representação visual da arquitetura orquestrada pelo **NΞØ Nexus**. Todos os diagramas utilizam Mermaid e refletem as conexões reais de produção.

---

## 1. Arquitetura Global do Ecossistema

O Nexus atua como o **Centro de Comando**, desacoplando os nós soberanos e garantindo que o protocolo escale organicamente.

```mermaid
graph TB
    subgraph SOBERANOS["NÓS SOBERANOS (Connected)"]
        direction LR
        FP["FlowPay Sovereign<br/>(flowpay.cash)"]
        SF["Smart Factory<br/>(factory.neoprotocol.space)"]
        NB["Neobot Core<br/>(AI Communication)"]
    end

    subgraph NEXUS["NΞØ NEXUS (Orchestrator)"]
        direction TB
        BUS["Core Event Bus<br/>(EventEmitter)"]
        REACTORS["Reactors System<br/>(Logic Layer)"]
        MIO["MIO Identity System<br/>(Authentication)"]
        
        BUS <--> REACTORS
        BUS <--> MIO
    end

    subgraph INFRA["INFRAESTRUTURA"]
        RLY["Railway.app<br/>(Compute)"]
        BASE["Base L2<br/>(Settlement)"]
        TON["TON Network<br/>(MiniApp Layer)"]
    end

    %% Conexões Reais
    FP -- "PAYMENT_RECEIVED" --> BUS
    BUS -- "MINT_REQUESTED" --> SF
    SF -- "MINT_CONFIRMED" --> BUS
    BUS -- "NOTIFICATION_DISPATCH" --> NB

    %% Infra
    NEXUS -.-> RLY
    SF -.-> BASE
    SF -.-> TON
    FP -.-> BASE

    %% Styling
    classDef nexus fill:#ccff00,stroke:#669900,stroke-width:2px,color:#000
    classDef nodes fill:#f5f5f5,stroke:#333,stroke-width:1px,color:#000
    classDef infra fill:#333,stroke:#fff,stroke-width:1px,color:#fff,stroke-dasharray: 5 5

    class BUS,REACTORS,MIO nexus
    class FP,SF,NB nodes
    class RLY,BASE,TON infra
```

---

## 2. Fluxo Principal: Pagamento -> Mint -> Notificação

Este é o "Happy Path" do protocolo, onde o Nexus coordena o FlowPay, a Smart Factory e o Neobot.

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuário
    participant FP as FlowPay (flowpay.cash)
    participant NX as NΞØ Nexus
    participant SF as Smart Factory
    participant NB as Neobot (WhatsApp/TG)

    U->>FP: Realiza Pagamento (PIX/Crypto)
    FP->>NX: POST /api/webhooks/flowpay (HMAC Signed)
    Note over NX: Event: PAYMENT_RECEIVED
    
    NX->>NX: Reactor: Payment-to-Mint execution
    NX->>SF: POST /api/mint (MIO Authenticated)
    Note over NX: Event: MINT_REQUESTED
    
    SF->>SF: Deploy/Mint on-chain (Base/TON)
    SF->>NX: POST /api/webhooks/factory (HMAC Signed)
    Note over NX: Event: MINT_CONFIRMED
    
    NX->>NB: Notify Dispatch (via WebSocket/API)
    NB->>U: Envia comprovante & link do contrato
```

---

## 3. Camada de Identidade MIO (Sovereign Identities)

Como os nós autenticam suas ações de forma soberana usando as 9 identidades registradas.

```mermaid
graph LR
    subgraph VAULT["NΞØ Vault (.env)"]
        CORE_K["Neo Core Key"]
        GATEWAY_K["Neo Gateway Key"]
        FACTORY_K["Neo Factory Key"]
        FLOWPAY_K["Neo FlowPay Key"]
    end

    subgraph MIO_SYSTEM["MIO System"]
        MANAGER["MioIdentityManager"]
        REGISTRY["Identity Registry"]
    end

    subgraph ACTION["Ações Assinadas"]
        MINT["Mint Protocolar"]
        LOG["Log Auditado"]
        VOTE["Voto DAO"]
    end

    VAULT --> MANAGER
    MANAGER -- "Sign Message" --> ACTION
    ACTION -- "Verify" --> MIO_SYSTEM
```

---

## 4. Mapa Logístico de Endpoints

| Nó | Produção | Função |
| :--- | :--- | :--- |
| **Nexus Core** | `nexus.neoprotocol.space` | Orquestração e Barramento |
| **FlowPay** | `flowpay.cash` | Gateway de Pagamentos |
| **Smart Factory** | `factory.neoprotocol.space` | Deploys de Contratos |
| **Neobot** | `neobot.neoprotocol.space` | Comunicação IA |
| **MIO ID** | `id.neoprotocol.space` | Identidade Digital |

---

▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
"Design is the first step of protocol."
────────────────────────────────────────
