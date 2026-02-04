<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
    MCP SETUP GUIDE - MULTI-IDE
========================================
```

**Data:** 30 Janeiro 2026  
**Para:** Cursor, Antigravity, Windsurf

────────────────────────────────────────

## CONFIGURAÇÃO ATUAL

**Arquivo:** `~/.cursor/mcp.json`  
**Status:** ✅ Funcionando (Cursor)

```json
{
  "mcpServers": {
    "Notion": {
      "url": "https://mcp.notion.com/mcp",
      "headers": {}
    }
  }
}
```

**Nota:** Cursor gerencia auth do Notion
via OAuth. Headers ficam vazios mas
funciona.

────────────────────────────────────────

## PARA ANTIGRAVITY IDE

### Opção 1: OAuth (Recomendado)

Se Antigravity suportar OAuth:

```json
{
  "mcpServers": {
    "Notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp",
      "auth": {
        "type": "oauth",
        "provider": "notion"
      }
    }
  }
}
```

### Opção 2: Token Manual

Se precisar de token explícito:

```json
{
  "mcpServers": {
    "Notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp",
      "headers": {
        "Authorization": "Bearer NOTION_TOKEN"
      }
    }
  }
}
```

**Como obter NOTION_TOKEN:**

1. Abrir Cursor (com Notion conectado)
2. Inspecionar requests no DevTools
3. Procurar header `Authorization`
4. Copiar o Bearer token

**Ou via Notion API:**

1. <https://www.notion.so/my-integrations>
2. Create new integration
3. Copiar Internal Integration Token
4. Usar como Bearer token

────────────────────────────────────────

## BACKUP DA CONFIGURAÇÃO

```bash
# Backup do mcp.json
cp ~/.cursor/mcp.json \
   ~/CODIGOS/neobot/.cursor/mcp.backup.json

# Backup dos MCPs do projeto
tar -czf ~/CODIGOS/neobot/.cursor/\
mcps-backup.tar.gz \
~/.cursor/projects/*/mcps/
```

────────────────────────────────────────

## CONFIGURAÇÃO COMPLETA

**Todos os MCPs configurados:**

```json
{
  "mcpServers": {
    "GitKraken": {
      "command": "/opt/homebrew/bin/gk",
      "args": ["mcp", "--host=cursor"],
      "type": "stdio"
    },
    "docker-local": {
      "command": "npx",
      "args": ["-y",
        "@thelord/mcp-server-docker-npx"],
      "type": "stdio"
    },
    "dockerhub": {
      "command": "docker",
      "args": ["run", "-i", "--rm",
        "-e", "HUB_PAT_TOKEN",
        "mcp/dockerhub",
        "--transport=stdio",
        "--username=eryntt"],
      "env": {
        "HUB_PAT_TOKEN":
          "YOUR_DOCKERHUB_PAT_HERE"
      }
    },
    "fetch": {
      "command": "docker",
      "args": ["run", "-i", "--rm",
        "mcp/fetch"]
    },
    "brave-search": {
      "command": "docker",
      "args": ["run", "-i", "--rm",
        "-e", "BRAVE_API_KEY",
        "mcp/brave-search"],
      "env": {
        "BRAVE_API_KEY":
          "YOUR_BRAVE_API_KEY_HERE"
      }
    },
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "mcp/github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN":
          "YOUR_GITHUB_PAT_HERE"
      }
    },
    "Notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp",
      "headers": {}
    },
    "Neon": {
      "type": "http",
      "url": "https://mcp.neon.tech/mcp",
      "headers": {
        "Authorization":
          "Bearer YOUR_NEON_API_KEY_HERE"
      }
    }
  }
}
```

────────────────────────────────────────

## PORTABILIDADE

### Para usar em outro Mac:

```bash
# 1. Copiar mcp.json
scp ~/.cursor/mcp.json \
    outro-mac:~/.cursor/mcp.json

# 2. Re-autenticar Notion (se OAuth)
# Abrir IDE → MCP Settings → Notion
# → Connect
```

### Para usar no Antigravity:

```bash
# 1. Localizar config do Antigravity
ls ~/.antigravity/ || \
ls ~/.config/antigravity/

# 2. Copiar estrutura
cp ~/.cursor/mcp.json \
   ~/.antigravity/mcp.json

# 3. Ajustar formato se necessário
# (verificar docs do Antigravity)
```

────────────────────────────────────────

## TROUBLESHOOTING

### Notion não conecta:

```bash
# 1. Verificar se MCP está ativo
ls ~/.cursor/projects/*/mcps/user-Notion/

# 2. Verificar logs do Cursor
tail -f ~/Library/Logs/Cursor/\
main.log | grep -i notion

# 3. Re-autenticar
# Cursor → Settings → MCP Servers
# → Notion → Disconnect → Connect
```

### Token expirado:

```text
Erro: "Unauthorized" ou "Invalid token"

Solução:
1. Notion OAuth re-auth (Cursor)
2. Ou gerar novo Integration Token
   (www.notion.so/my-integrations)
```

────────────────────────────────────────

## MCPS DISPONÍVEIS

```text
▓▓▓ STDIO (Local Commands)
────────────────────────────────────────
└─ GitKraken (git operations)
└─ docker-local (Docker mgmt)

▓▓▓ DOCKER (Containers)
────────────────────────────────────────
└─ dockerhub (Docker Hub)
└─ fetch (HTTP requests)
└─ brave-search (Web search)
└─ github (GitHub API)

▓▓▓ HTTP (Cloud Services)
────────────────────────────────────────
└─ Notion (OAuth)
└─ Neon (API Key)
```

────────────────────────────────────────

## ADICIONAR NOVO MCP

### STDIO (Local):

```json
"meu-mcp": {
  "command": "/path/to/command",
  "args": ["arg1", "arg2"],
  "type": "stdio"
}
```

### Docker:

```json
"meu-mcp": {
  "command": "docker",
  "args": ["run", "-i", "--rm",
    "mcp/meu-mcp"]
}
```

### HTTP:

```json
"meu-mcp": {
  "type": "http",
  "url": "https://api.meu-mcp.com/mcp",
  "headers": {
    "Authorization": "Bearer TOKEN"
  }
}
```

────────────────────────────────────────

## SEGURANÇA

**⚠️ IMPORTANTE:**

Este arquivo contém tokens sensíveis:
- GitHub PAT
- DockerHub PAT
- Brave API Key
- Neon API Key

**Nunca commitar para Git!**

```bash
# Adicionar ao .gitignore
echo "~/.cursor/mcp.json" >> .gitignore
echo ".cursor/mcp*.json" >> .gitignore
```

**Backup seguro:**

```bash
# Encriptar antes de guardar
gpg -c ~/.cursor/mcp.json

# Ou usar 1Password CLI
op document create \
  ~/.cursor/mcp.json \
  --title "MCP Config"
```

────────────────────────────────────────

## REFERÊNCIAS

**MCP Oficial:**
- <https://modelcontextprotocol.io/>
- <https://github.com/modelcontextprotocol>

**Notion MCP:**
- <https://mcp.notion.com/>
- <https://www.notion.so/my-integrations>

**Servers Disponíveis:**
- GitKraken: <https://gitkraken.com/cli>
- Docker: <https://hub.docker.com/u/mcp>
- GitHub: <https://github.com/modelcontextprotocol>

────────────────────────────────────────

▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Portability is not a feature.
 It's a requirement."

One config. Multiple IDEs.
────────────────────────────────────────
