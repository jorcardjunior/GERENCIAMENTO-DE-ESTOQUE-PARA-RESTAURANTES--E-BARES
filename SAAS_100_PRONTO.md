# SAAS 100% PRONTO — Documentação do MVP

## Stack

| Camada        | Tecnologia                                  |
|---------------|---------------------------------------------|
| Framework     | Next.js 16 (Turbopack)                      |
| Autenticação  | Better-Auth v1 + drizzleAdapter + bcryptjs   |
| ORM           | Drizzle ORM + postgres (driver pg)          |
| Banco         | PostgreSQL (via `DATABASE_URL`)             |
| Frontend      | React 19, Tailwind 4, Framer Motion, Recharts, Radix UI |
| Formulários   | react-hook-form + zod                       |
| Ícones        | lucide-react (468+ via `optimizePackageImports`) |
| Linter/Format | Biome                                         |
| Gráficos      | Recharts (linha, barra, pizza, radar)        |
| Planilhas     | xlsx (importação/exportação)                |
| Estado        | zustand (cliente) + TanStack Query (server) |

## Roteiro de Inicialização

```bash
# 1. Clonar
git clone <repo>
cd <dir>

# 2. Instalar
npm install

# 3. Configurar variáveis (obrigatório)
cp .env.example .env.local

# Edite .env.local:
#   DATABASE_URL=postgresql://...
#   BETTER_AUTH_SECRET=$(openssl rand -base64 32)
#   BETTER_AUTH_URL=http://localhost:3000

# 4. Subir banco (Docker opcional)
docker run -d --name pg-estoque -e POSTGRES_PASSWORD=local -p 5432:5432 postgres:16

# 5. Migrar schema
npm run db:push

# 6. Seed (cria admin@admin.com / admin123)
npm run seed

# 7. Rodar
npm run dev        # http://localhost:3000
```

## Variáveis de Ambiente (`lib/env.ts`)

| Variável             | Obrigatória | Fallback              |
|----------------------|-------------|-----------------------|
| `DATABASE_URL`       | Sim         | —                     |
| `BETTER_AUTH_SECRET` | Sim         | —                     |
| `BETTER_AUTH_URL`    | Não         | `http://localhost:3000` |
| `JWT_SECRET`         | Não\*       | `dev-secret-...`      |
| `NODE_ENV`           | Não         | `development`         |

> \*JWT_SECRET é obrigatório em produção; em dev usa fallback inseguro.

## Comandos Disponíveis

| Comando              | Ação                                  |
|----------------------|---------------------------------------|
| `npm run dev`        | Servidor dev (webpack mode)           |
| `npm run build`      | Build produção (roda type-check antes)|
| `npm run start`      | Servidor produção                     |
| `npm run type-check` | TypeScript check (`tsc --noEmit`)     |
| `npm run lint`       | Biome check + auto-fix                |
| `npm run lint:check` | Biome check-only                      |
| `npm run format`     | Biome format + write                  |
| `npm run format:check` | Biome format check                 |
| `npm run validate`   | lint:check + type-check               |
| `npm run db:generate`| Gera migration Drizzle                |
| `npm run db:migrate` | Aplica migration                      |
| `npm run db:push`    | Push schema direto (dev)              |
| `npm run db:studio`  | Drizzle Studio (GUI do banco)         |
| `npm run seed`       | Popula admin + dados iniciais         |

## Schema do Banco (`db/schema.ts`)

### Tabelas Principais

- **user** — Better-Auth (id uuid, email, name, role, companyId, mustChangePassword)
- **users** — Legado (id serial, email, password hash, name, role, betterAuthId)
- **estabelecimentos** — Empresas/multi-unidades
- **estoque_estabelecimento** — Estoque atual por item/unidade
- **categorias** — Categorias de insumos
- **items** — Catálogo de insumos
- **fornecedores** — Suppliers
- **movimentacoes_estoque** — Movimentações (IN/OUT/AJUSTE/TRANSFERENCIA/PERDA)
- **fichas_tecnicas** — Fichas técnicas (receitas)
- **ficha_insumos** — Insumos de cada ficha
- **registros_producao** — Produção (data, ficha, qtd, custo)
- **pedidos_compra** — Purchase orders (cabeçalho)
- **pedido_itens** — Itens do pedido
- **transferencias** — Transferências entre estabelecimentos
- **transferencia_itens** — Itens transferidos
- **perdas_estoque** — Registro de perdas com tipo/motivo
- **despesas** — Despesas fixas/variáveis
- **categorias_despesa** — Categorias de despesas
- **notificacoes** — Notificações do sistema
- **budget** — Orçamento mensal
- **audit_log** — Log de auditoria (SWITCH_USER, DELETE, etc)

### Segurança

- **SWITCH_USER**: permite admin trocar para conta de outro usuário usando a senha real do alvo (auditado em `audit_log`)
- **Roles**: `owner > admin > gerente > funcionario > visualizador`
- **Hierarquia**: `ROLE_HIERARCHY` em `lib/auth-server.ts:13`

## Rotas da Aplicação

### Páginas (`/app/*`)

| Rota                  | Descrição                              |
|-----------------------|----------------------------------------|
| `/app`                | Home do app                            |
| `/app/dashboard`      | Dashboard principal                    |
| `/app/bi`             | BI Central (business intelligence)     |
| `/app/bi/sugestao-compra` | Sugestão automática de compra    |
| `/app/estabelecimentos`  | Gerenciar multi-unidades            |
| `/app/gestao`         | Gestão de estoque (CRUD items)         |
| `/app/fichas-tecnicas`| Fichas técnicas (receitas)             |
| `/app/pedidos-compra` | Purchase orders                        |
| `/app/transferencias` | Transferências entre unidades          |
| `/app/financeiro`     | Financeiro (despesas, fluxo)           |
| `/app/relatorios`     | Relatórios                             |
| `/app/preenchimento`  | Preenchimento/contagem                 |
| `/app/importar`       | Importar planilhas                     |
| `/app/usuarios`       | Gerenciar usuários (admin)             |
| `/app/configuracoes`  | Configurações do sistema               |
| `/app/profile`        | Perfil do usuário                      |

### API Routes

| Rota                                    | Métodos |
|-----------------------------------------|---------|
| `/api/auth/[...all]`                    | Better-Auth handler |
| `/api/auth/register`                    | POST (registro manual, se usado) |
| `/api/auth/login`                       | Via Better-Auth nativo |
| `/api/auth/logout`                      | Via Better-Auth nativo |
| `/api/auth/me`                          | GET (session info) |
| `/api/auth/switch-user`                 | POST (admin troca de conta) |
| `/api/auth/activate`                    | POST (ativação) |
| `/api/auth/forced-reset`                | POST (reset forçado) |
| `/api/auth/sync`                        | POST (sincroniza user legado) |
| `/api/bi`                               | GET (BI completo) |
| `/api/bi/sugestao-compra`               | GET (sugestão inteligente) |
| `/api/business-advice`                  | GET (conselhos + citações) |
| `/api/ai-chat`                          | POST (chat IA) |
| `/api/items`                            | CRUD insumos |
| `/api/items/[id]`                       | CRUD item específico |
| `/api/categories`                       | CRUD categorias |
| `/api/categories/[id]`                  | CRUD categoria específica |
| `/api/catalog-items`                    | Lista catálogo |
| `/api/estabelecimentos`                 | CRUD estabelecimentos |
| `/api/estabelecimentos/[id]`            | CRUD estabelecimento específico |
| `/api/fichas-tecnicas`                  | CRUD fichas técnicas |
| `/api/fichas-tecnicas/[id]`             | CRUD ficha específica |
| `/api/fichas-tecnicas/[id]/insumos`     | Insumos da ficha |
| `/api/fornecedores`                     | CRUD fornecedores |
| `/api/movimentacoes`                    | CRUD movimentações |
| `/api/pedidos-compra`                   | CRUD pedidos |
| `/api/pedidos-compra/[id]`              | CRUD pedido específico |
| `/api/pedidos-compra/[id]/itens`        | Itens do pedido |
| `/api/transferencias`                   | CRUD transferências |
| `/api/transferencias/[id]/itens`        | Itens da transferência |
| `/api/transferencias/[id]`              | CRUD transferência específica |
| `/api/notificacoes`                     | GET notificações |
| `/api/expenses`                         | CRUD despesas |
| `/api/expense-categories`               | CRUD categorias despesa |
| `/api/suppliers`                        | CRUD fornecedores |
| `/api/settings`                         | GET/PUT configurações |
| `/api/users`                            | CRUD usuários |
| `/api/import-detect`                    | POST detecta colunas planilha |
| `/api/import-items`                     | POST importa itens |
| `/api/import-rollback`                  | POST desfaz importação |
| `/api/invitations`                      | Convites |

## BI — Business Intelligence (`/api/bi`)

Endpoint GET que retorna:

| Campo              | Descrição                                           | Demo? |
|--------------------|-----------------------------------------------------|-------|
| `resumo`           | Total itens, categorias, estabelecimentos, capital  | Não   |
| `giro`             | Giro de estoque por categoria + médio (real)        | Não   |
| `cmv`              | CMV histórico 6 meses (real com distribuidor cat)   | Não   |
| `perda`            | Perdas por tipo (real agregado, distribuído)        | Não   |
| `custoxPreco`      | Custo vs preço por ficha técnica (real)             | Não   |
| `gargalos`         | Itens parados 30/60d (real)                         | Não   |
| `sazonalidade`     | Consumo por dia da semana (real)                    | Não   |
| `budget`           | Orçado vs realizado (real)                          | Não   |
| `comparativoAnual` | Comparativo ano atual vs anterior (real)            | Não   |
| `previsao`         | Projeção 14 dias (MMoL + sazonalidade)              | Não   |
| `healthScore`      | Score 0-100 baseado em giro, perda, CMV             | Não   |

### Dados Demonstrativos

OBJETIVO: Se o banco estiver vazio, **NÃO** usar `Math.random()`. Em vez disso, usar funções determinísticas baseadas em hash do nome (`seededRandom`). Isso garante que os dados são:
- **Reprodutíveis** — mesmos inputs geram mesmos outputs
- **Realistas** — distribuição calibrada para um restaurante típico
- **Identificáveis** — todo objeto demo carrega `demo: true`

### Todos os helpers usam `seededRandom(seed, min, max)`

Para gerar dados demonstração quando o banco está vazio, as funções no `route.ts` usam `seededRandom` em vez de `Math.random()`, garantindo determinismo:

```typescript
function seededRandom(seed: string, min = 0, max = 1): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const normalized = Math.abs(hash % 100000) / 100000;
  return min + normalized * (max - min);
}
```

**Regra**: se alguma query real retornar dados, eles são usados. Se todas falham/estão vazias, `seededRandom` gera dados demo realistas. NUNCA `Math.random()` em dados.

## Middleware

- **middleware.ts** (atual): intercepta `/app/*`, `/api/*`, verifica sessão via Better-Auth, redireciona para `/auth/login` se não autenticado. Protege todas as rotas do app.
- **middleware.legacy.ts**: versão antiga baseada em JWT manual (desativada).

## Linter / Formatação

Usamos Biome. Padrão:

```bash
npm run lint          # auto-fix (apply .)
npm run lint:check    # apenas verificar
npm run format        # formatar
npm run format:check  # verificar formatação
```

Biome configurado para:
- aspas duplas
- trailing comma all
- indentação com espaços (2)
- sem ponto-e-vírgula (semicolons as needed — default biome)

## Seed (`seed.ts`)

Cria admin padrão:
- Email: `admin@admin.com` (ou `SEED_ADMIN_EMAIL`)
- Senha: `admin123` (ou `SEED_ADMIN_PASSWORD`)
- Nome: `Admin`
- Role: `admin`
- `mustChangePassword: true`

Só roda se não existir usuário com mesmo email. Insere tanto na tabela `user` (Better-Auth) quanto `users` (legado com bcrypt).

## Segurança

### CSP (Content Security Policy)
```text
default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:;
font-src 'self' data:; connect-src 'self' https:;
frame-src 'self'; base-uri 'self'
```

### Headers HTTP
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-DNS-Prefetch-Control: on`
- `Cache-Control: no-store` nas API routes

### Rate Limit
Better-Auth: 5 requisições por janela de 60s.

### SWITCH_USER (auditado)
Admin pode assumir identidade de outro usuário fornecendo a senha **do usuário alvo**. Toda troca é registrada em `audit_log` com `action: "SWITCH_USER"`.

## Dependências Principais

```json
{
  "next": "^16.0.0",
  "react": "^19.0.0",
  "better-auth": "^1.1.16",
  "drizzle-orm": "^0.38.0",
  "postgres": "^3.4.5",
  "recharts": "^3.8.1",
  "lucide-react": "^0.468.0",
  "tailwindcss": "^4.0.0",
  "framer-motion": "^11.15.0",
  "@tanstack/react-query": "^5.62.0",
  "zustand": "^5.0.3",
  "xlsx": "^0.18.5",
  "zod": "^3.24.0",
  "bcryptjs": "^2.4.3"
}
```

## Build Status (23/06/2026)

```
✓ TypeScript (tsc --noEmit) — 0 errors
✓ Next Build — 51 pages, 44 API routes
✓ Biome Lint — clean
```
