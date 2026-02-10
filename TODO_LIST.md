# NEO-NEXUS TODO LIST

> **Last Updated:** 2026-02-09
> **Status:** Production Active 🟢

---

## 🔴 **PRIORIDADE ALTA**

### 1. Retry Queue System
**Arquivo:** `src/reactors/payment-to-mint.ts`
**Linhas:** 77, 99, 121
**Descrição:** Implementar fila de retry para chamadas falhadas à Smart Factory

**Contexto:**
Quando a Smart Factory falha (HTTP error, timeout, network error), o evento é apenas logado mas não há retry automático. Isso pode causar perda de pagamentos confirmados.

**Proposta de Implementação:**
```typescript
// src/utils/retry-queue.ts
export class RetryQueue {
    private queue: Map<string, RetryTask> = new Map();

    async add(task: RetryTask) {
        // Persist to database
        // Schedule retry with exponential backoff
        // Max 5 retries, then move to Dead Letter Queue
    }

    async process() {
        // Background job que processa retries
    }
}

interface RetryTask {
    id: string;
    type: 'MINT_REQUEST' | 'WEBHOOK_CALL';
    payload: any;
    attempts: number;
    nextRetry: Date;
}
```

**Estimativa:** 4-6 horas
**Dependências:** Nenhuma

---

### 2. Dead Letter Queue (DLQ)
**Descrição:** Eventos que falharam após N retries devem ir para uma DLQ para análise manual

**Proposta:**
```sql
CREATE TABLE IF NOT EXISTS dead_letter_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_event TEXT NOT NULL,
    payload TEXT NOT NULL,
    error_reason TEXT,
    attempts INTEGER,
    timestamp INTEGER NOT NULL
);
```

**Estimativa:** 2 horas
**Dependências:** Retry Queue

---

## 🟡 **PRIORIDADE MÉDIA**

### 3. Metrics & Observability
**Descrição:** Adicionar métricas Prometheus para monitoramento

**Endpoints propostos:**
- `/metrics` - Prometheus metrics
- `/api/health/detailed` - Health check detalhado

**Métricas:**
- `nexus_events_total{event_type}` - Counter
- `nexus_reactor_duration_seconds{reactor}` - Histogram
- `nexus_api_call_errors_total{target}` - Counter

**Estimativa:** 3-4 horas

---

### 4. Event Replay
**Descrição:** Sistema para reprocessar eventos do banco de dados

**Use cases:**
- Reprocessar eventos após bug fix
- Replay de eventos para novos reactors
- Recovery após downtime

**Estimativa:** 4 horas

---

### 5. Webhook Signature Rotation
**Descrição:** Sistema para rotação de NEXUS_SECRET sem downtime

**Proposta:**
- Aceitar múltiplas signatures simultaneamente (old + new)
- Grace period de 24h para migração
- API para rotação: `POST /api/admin/rotate-secret`

**Estimativa:** 3 horas

---

## 🟢 **PRIORIDADE BAIXA / ENHANCEMENT**

### 6. Rate Limiting por Node ID
**Descrição:** Rate limiting específico por nó do ecossistema

**Atual:** 100 req/15min global
**Proposta:** 100 req/15min por node_id (via header ou signature)

**Estimativa:** 2 horas

---

### 7. WebSocket Rooms
**Descrição:** Separar eventos do WebSocket por "rooms"

**Proposta:**
```typescript
ws.send(JSON.stringify({
    room: 'flowpay',
    event: 'PAYMENT_RECEIVED',
    payload: {...}
}));
```

Clients podem subscribir apenas aos eventos relevantes.

**Estimativa:** 3 horas

---

### 8. GraphQL Query Layer
**Descrição:** Adicionar GraphQL para queries complexas no event log

**Endpoints:**
- `POST /api/graphql`

**Queries propostas:**
```graphql
query {
  events(
    eventType: "PAYMENT_RECEIVED"
    timeRange: { from: "2026-01-01", to: "2026-02-01" }
    limit: 50
  ) {
    id
    event
    payload
    timestamp
  }
}
```

**Estimativa:** 6-8 horas
**Prioridade:** LOW (nice-to-have)

---

## ✅ **COMPLETADO**

- [x] HTTP Server + WebSocket (Express + ws)
- [x] SQLite Persistence
- [x] Security (Helmet, Rate Limiting)
- [x] HMAC Signature Validation
- [x] Dynamic Service Discovery
- [x] Payment → Mint Reactor
- [x] Mint → Notify Reactor
- [x] Event persistence to database
- [x] ALLOWED_ORIGINS documentation

---

## 📋 **BACKLOG (Ideias Futuras)**

- [ ] Multi-region deployment (Railway + Fly.io)
- [ ] Redis cache layer para Discovery
- [ ] E2E tests com playwright
- [ ] Load testing (k6)
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Event schema validation (Zod/JSON Schema)
- [ ] Admin dashboard (React)

---

**Mantido por:** NEO Protocol Team
**Repositório:** [github.com/NEO-PROTOCOL/neo-nexus](https://github.com/NEO-PROTOCOL/neo-nexus)
