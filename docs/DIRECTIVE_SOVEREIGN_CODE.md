# DIRECTIVE: SOVEREIGN CODE & ADAPTER PATTERN
> **Classification:** NEO-PROTOCOL/DOCTRINE
> **Target:** All Principal Nodes (Smart Core, FlowPay, Gateway, MIO)
> **Status:** ACTIVE

## 1. O Princípio da Autossuficiência

Um Nó NEØ não pode falhar porque uma biblioteca de terceiros (upstream) mudou, quebrou ou desapareceu. A dependência direta de código instável é uma vulnerabilidade inaceitável para uma infraestrutura interplanetária.

**A Regra de Ouro:**
> *"Se uma funcionalidade é crítica para a sobrevivência do Nó, ela não pode ser terceirizada diretamente. Ela deve ser mediada."*

## 2. O Padrão "Sovereign Adapter"

Em vez de importar bibliotecas externas profundamente na lógica de negócio, todo Nó deve implementar **Adapters Soberanos** na camada de Infraestrutura (`src/infra/*`).

### Antes (Vulnerável):
```typescript
// src/core/logic.ts
import { UnstableFunction } from "external-lib-v1"; // Se isso mudar, o Core quebra.

export function run() {
  UnstableFunction();
}
```

### Depois (Soberano):
```typescript
// src/infra/adapters/sov-adapter.ts
// Nós definimos a interface. Nós controlamos o contrato.
export interface SovereignInterface {
  execute(): void;
}

// Implementação Real (pode falhar, pode mudar, nós controlamos o erro)
export const adapter: SovereignInterface = {
  execute: () => {
    try {
      require("external-lib-v1").UnstableFunction();
    } catch {
      console.warn("External lib failed. Using fallback.");
      // Fallback Lógico ou No-Op seguro
    }
  }
}
```

```typescript
// src/core/logic.ts
import { adapter } from "../infra/adapters/sov-adapter"; // Importamos NOSSO código.

export function run() {
  adapter.execute(); // O Core está protegido.
}
```

## 3. A Estratégia de Análise (The Eye of NEO)

Todo templo deve possuir mecanismos de introspecção. Não confie apenas em linters padrão. Crie scripts de **Análise de Código Soberana** (`scripts/code-analysis.ts`) que verifiquem:

1.  **Integridade de Imports:** O código compila sem a rede externa?
2.  **Detecção de Fantasmas:** Existem chamadas para funções que não existem mais?
3.  **Tipagem Defensiva:** Estamos usando `unknown` e validando, ou confiando cegamente em `any` externo?

## 4. Aplicação nos Nós Principais

Baseado no `ecosystem.json`, eis a missão para cada Templo:

*   **Gateway (neobot):** IMPLEMENTADO. Adapter `pi-adapter.ts` substituiu dependência quebrada.
*   **Smart Factory:** Deve isolar a lógica de deploy on-chain. Se a RPC da Base falhar, o factory deve armazenar a intenção localmente (queue) e não crashar.
*   **FlowPay:** A conexão com bancos (Open Finance) deve ser isolada. Se a API do banco muda, apenas o Adapter do Banco precisa ser recompilado, nunca o Core do Ledger.
*   **MIO System:** A identidade é a verdade absoluta. Não pode depender de serviços de verificação externos. A criptografia deve ser interna.

---
**Assinado:**
*Antigravity, Agent of NEØ Protocol*
*Ref: Incident 2026-02-03 (The Upstream Breakage)*
