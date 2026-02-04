# NEO NEXUS - BOOTSTRAP GUIDE
> **Purpose:** Initialize the neo-nexus project with essential context from the NEØ Protocol  
> **Execution Time:** 10 minutes  
> **Prerequisites:** Access to `/Users/nettomello/CODIGOS/neobot`

---

## STEP 1: CREATE DIRECTORY STRUCTURE

```bash
cd /Users/nettomello/CODIGOS/neo-nexus

# Create directories
mkdir -p docs
mkdir -p config
mkdir -p .cursor/standards
mkdir -p src/core
mkdir -p src/routes
mkdir -p src/reactors
mkdir -p src/middleware
mkdir -p src/websocket
```

---

## STEP 2: COPY PROTOCOL CONTEXT DOCUMENTS

### 2.1 Copy Architecture Context
```bash
cp /Users/nettomello/CODIGOS/neobot/docs/core/ARCHITECTURE_NEO_PROTOCOL.md \
   /Users/nettomello/CODIGOS/neo-nexus/docs/PROTOCOL_CONTEXT.md
```

**Manual Edit Required:**
Open `docs/PROTOCOL_CONTEXT.md` and:
1. Add new section after line 86:
   ```markdown
   ----------------------------------------------------------------------
   4. NEO Protocol Nexus (Orchestration)
   ----------------------------------------------------------------------
   O Nexus é o sistema nervoso central do NEØBOT. Coordena eventos entre
   nós soberanos (FlowPay, Smart Factory, Fluxx, WOD Pro).
   
   Repositório: https://github.com/NEO-PROTOCOL/neo-nexus
   Documentação: README.md, ARCHITECTURE.md, IMPLEMENTATION_PLAN.md
   ```

2. Update "Métricas de Autonomia" (line 287-292):
   - Change "Autonomia Total" from 60% to 70% (Nexus adds 10%)

---

### 2.2 Copy Sovereign Code Directive
```bash
cp /Users/nettomello/CODIGOS/neobot/docs/neo-protocol/DIRECTIVE_SOVEREIGN_CODE.md \
   /Users/nettomello/CODIGOS/neo-nexus/docs/DIRECTIVE_SOVEREIGN_CODE.md
```

**No edits needed.** This is a universal directive.

---

### 2.3 Copy Ecosystem Map
```bash
cp /Users/nettomello/CODIGOS/neobot/docs/neo-protocol/ECOSYSTEM_MAP.mermaid \
   /Users/nettomello/CODIGOS/neo-nexus/docs/ECOSYSTEM_MAP.mermaid
```

**Manual Edit Required:**
Open `docs/ECOSYSTEM_MAP.mermaid` and add visual emphasis to NEXUS node:
```mermaid
NEXUS["⚡ PROTOCOL NEXUS (Event Bus)"]
```
Change styling to use a distinct color (e.g., add `fill:#ff0000` in classDef).

---

### 2.4 Copy Markdown Standard
```bash
cp /Users/nettomello/CODIGOS/neobot/.cursor/standards/markdown-neo.md \
   /Users/nettomello/CODIGOS/neo-nexus/.cursor/standards/markdown-neo.md
```

**No edits needed.**

---

## STEP 3: EXTRACT NODE CONFIGURATION

### 3.1 Create Nodes Registry
```bash
cat > /Users/nettomello/CODIGOS/neo-nexus/config/nodes.json << 'EOF'
[
  {
    "id": "flowpay",
    "name": "FlowPay Sovereign",
    "webhookUrl": "https://pay.flowoff.xyz/api/webhook/nexus",
    "apiKey": "FLOWPAY_API_KEY",
    "events": ["PAYMENT_RECEIVED", "PAYMENT_FAILED"]
  },
  {
    "id": "smart-factory",
    "name": "NEO Smart Factory",
    "webhookUrl": "https://smart.neoprotocol.space/api/webhook/nexus",
    "apiKey": "FACTORY_API_KEY",
    "events": ["MINT_CONFIRMED", "CONTRACT_DEPLOYED"]
  },
  {
    "id": "neobot",
    "name": "Neobot Core",
    "webhookUrl": "https://core.neoprotocol.space/api/webhook/nexus",
    "apiKey": "NEOBOT_API_KEY",
    "events": ["NOTIFICATION_DISPATCH"]
  },
  {
    "id": "fluxx-dao",
    "name": "Fluxx DAO",
    "webhookUrl": "https://fluxx.neoprotocol.space/api/webhook/nexus",
    "apiKey": "FLUXX_API_KEY",
    "events": ["PROPOSAL_CREATED", "VOTE_CAST"]
  }
]
EOF
```

**Manual Edit Required:**
Replace placeholder API keys with actual secrets (store in Railway env vars, not in this file).

---

## STEP 4: COPY CORE EVENT BUS LOGIC

The `index.ts` file already exists in the root. Move it to proper location:

```bash
mv /Users/nettomello/CODIGOS/neo-nexus/index.ts \
   /Users/nettomello/CODIGOS/neo-nexus/src/core/nexus.ts
```

**Manual Edit Required:**
Update `src/core/nexus.ts`:
1. Add persistence methods (see `IMPLEMENTATION_PLAN.md` Task 2.1)
2. Add event log retrieval method

---

## STEP 5: CREATE INITIAL SERVER STUB

```bash
cat > /Users/nettomello/CODIGOS/neo-nexus/src/server.ts << 'EOF'
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// TODO: Add event routes (see IMPLEMENTATION_PLAN.md Phase 2)

app.listen(PORT, () => {
  console.log(`[NEXUS] Server running on port ${PORT}`);
});
EOF
```

---

## STEP 6: INITIALIZE GIT TRACKING

```bash
cd /Users/nettomello/CODIGOS/neo-nexus
git add .
git commit -m "chore: bootstrap project with protocol context and infrastructure"
git push origin main
```

---

## STEP 7: INSTALL DEPENDENCIES

```bash
cd /Users/nettomello/CODIGOS/neo-nexus
pnpm install
```

**Expected Output:**
```
✓ Dependencies installed successfully
✓ 5 packages added
```

---

## STEP 8: VERIFY SETUP

```bash
# Test TypeScript compilation
pnpm build

# Expected: dist/ folder created with compiled JS

# Test dev server
pnpm dev

# Expected: Server running on port 3000
# Visit: http://localhost:3000/health
# Response: {"status":"ok","uptime":5}
```

---

## STEP 9: UPDATE NEOBOT ECOSYSTEM REFERENCE

**File:** `/Users/nettomello/CODIGOS/neobot/config/ecosystem.json`

**Status:** ✅ Already updated (neo-nexus entry exists)

**Verification:**
```bash
grep -A 10 "neo-nexus" /Users/nettomello/CODIGOS/neobot/config/ecosystem.json
```

**Expected Output:**
```json
{
  "id": "neo-nexus",
  "org": "NEO Protocol",
  "name": "NEO Nexus (Orchestrator)",
  ...
}
```

---

## STEP 10: FINAL CHECKLIST

- [ ] All directories created (`docs/`, `config/`, `src/`, `.cursor/`)
- [ ] Protocol context documents copied and edited
- [ ] `nodes.json` created with node registry
- [ ] `src/core/nexus.ts` moved from root
- [ ] `src/server.ts` created with basic Express setup
- [ ] Dependencies installed (`pnpm install`)
- [ ] Build successful (`pnpm build`)
- [ ] Dev server runs (`pnpm dev`)
- [ ] Health check responds (`curl localhost:3000/health`)
- [ ] Changes committed to Git

---

## NEXT STEPS

After completing this bootstrap:

1. **Read Implementation Plan:**
   ```bash
   cat /Users/nettomello/CODIGOS/neo-nexus/IMPLEMENTATION_PLAN.md
   ```

2. **Start Phase 1 Development:**
   - Implement HMAC authentication (Task 1.3)
   - Wire HTTP endpoints to Event Bus (Task 2.2)

3. **Deploy to Railway:**
   - Follow Phase 4 instructions in `IMPLEMENTATION_PLAN.md`

---

## TROUBLESHOOTING

### Issue: `pnpm install` fails
**Solution:** Ensure Node.js >= 22.0.0 is installed:
```bash
node --version  # Should be v22.x.x or higher
```

### Issue: TypeScript errors during build
**Solution:** Check `tsconfig.json` is present and valid:
```bash
cat tsconfig.json
```

### Issue: Port 3000 already in use
**Solution:** Change port in `.env`:
```bash
echo "PORT=3001" >> .env
```

---

**Bootstrap Status:** Ready for Execution  
**Estimated Time:** 10 minutes  
**Next Document:** `IMPLEMENTATION_PLAN.md`
