# 📋 TUDO SOBRE O SISTEMA

> Documento mestre de análise — Gerado em Junho/2026
> Contém TODAS as análises estruturais, de segurança, performance, UX e roadmap para tornar o projeto VENDÁVEL.

---

## SUMÁRIO

1. [VISÃO GERAL DO PROJETO](#1-visão-geral-do-projeto)
2. [STACK TECNOLÓGICA vs. MERCADO 2026](#2-stack-tecnológica-vs-mercado-2026)
3. [ARQUITETURA COMPLETA](#3-arquitetura-completa)
4. [ANÁLISE DE SEGURANÇA](#4-análise-de-segurança)
5. [ANÁLISE DO BANCO DE DADOS](#5-análise-do-banco-de-dados)
6. [ANÁLISE DE PERFORMANCE](#6-análise-de-performance)
7. [ANÁLISE DE UX E FEATURES](#7-análise-de-ux-e-features)
8. [CÓDIGO MORTO E DÍVIDA TÉCNICA](#8-código-morto-e-dívida-técnica)
9. [ROADMAP PARA V1 COMERCIALIZÁVEL](#9-roadmap-para-v1-comercializável)
10. [ESTIMATIVA DE ESFORÇO E PRIORIDADES](#10-estimativa-de-esforço-e-prioridades)
11. [ESTRUTURA DE ARQUIVOS COMPLETA](#11-estrutura-de-arquivos-completa)

---

## 1. VISÃO GERAL DO PROJETO

**Nome:** EstoqueRest — Sistema de Gerenciamento de Estoque para Restaurantes e Bares
**Stack:** Next.js 16 + React 19 + TypeScript 5.7 + PostgreSQL + Drizzle ORM + Tailwind CSS 4
**Licença:** Privada (comercial)
**Repositório:** Git (3 commits, branch `main`)
**Estágio:** MVP funcional com falhas críticas de segurança

### O que já funciona
- Autenticação completa (login/cadastro/logout/sessão) via JWT + bcrypt
- CRUD de itens, categorias, fichas técnicas, pedidos de compra, transferências
- Gestão de estabelecimentos (multi-unidades)
- Financeiro com despesas e CMV
- BI & Inteligência com 12 charts (dashboard analítico)
- Sugestão de Compra com algoritmo de reposição inteligente
- Notificações de estoque baixo com som
- Importação de dados (XLSX/CSV)
- Sistema de configurações (admin/empregado)
- Landing page com planos e testimonials
- Paleta de comandos (⌘K), Tour de boas-vindas, Assistente IA
- Exportação CSV/JSON

### O que NÃO funciona (e impede venda)
1. **Segurança:** 9 endpoints sem auth, registro permite escalar privilégio para admin
2. **Auth:** Custom JWT manual em vez de Better-Auth (já instalado!)
3. **Arquitetura:** Dois sistemas de usuário (serial vs uuid) quebram relações
4. **Performance:** Zero pool de conexão, zero paginação, 100% client-side
5. **Dados:** BI retorna dados aleatórios como fallback, sem seed funcional
6. **UX:** Password reset fake, perfil não salva, `window.confirm()` em vez de modal

---

## 2. STACK TECNOLÓGICA vs. MERCADO 2026

### 2.1 O que está ATUALIZADO (bom para 2026)

| Tecnologia | Versão no Projeto | Versão Atual (Jun/2026) | Status |
|---|---|---|---|
| **Next.js** | ^16.0.0 | 16.x | ✅ Atual |
| **React** | ^19.0.0 | 19.x | ✅ Atual |
| **TypeScript** | ^5.7.0 | 5.8+ | ✅ Atual |
| **Drizzle ORM** | ^0.38.0 | 0.38+ | ✅ Atual |
| **Tailwind CSS** | ^4.0.0 | 4.x | ✅ Atual |
| **Biome** (lint) | ^1.9.4 | 1.9.x | ✅ Atual — substituiu ESLint |
| **Zustand** | ^5.0.3 | 5.x | ✅ Atual |
| **TanStack Query** | ^5.62.0 | 5.x | ✅ Atual (mas NÃO usado!) |
| **Radix UI** | ^1.x | 1.x | ✅ Atual |
| **Lucide React** | ^0.468.0 | 0.468+ | ✅ Atual |
| **Sonner** (toast) | ^1.7.0 | 1.7+ | ✅ Atual |
| **Recharts** | ^3.8.1 | 3.x | ✅ Atual |
| **React Hook Form** | ^7.54.0 | 7.x | ✅ Atual |
| **Zod** | ^3.24.0 | 3.x | ✅ Atual |
| **date-fns** | ^4.1.0 | 4.x | ✅ Atual |
| **jose** (JWT) | ^6.2.3 | 6.x | ✅ Atual (mas prefira Better-Auth) |
| **postgres** (driver) | ^3.4.5 | 3.4.9 | ✅ Atual (já suporta pooling nativo) |
| **CVA** | ^0.7.1 | 0.7.x | ✅ Atual |

### 2.2 O que está OBSOLETO ou deve ser mudado

| Tecnologia | Problema | Solução para 2026 |
|---|---|---|
| **100% Client Components** | Next 16 otimizado para RSCs; sem RSCs perde bundle, SEO, performance | Migrar páginas de lista para RSC |
| **Custom JWT** (jose + bcryptjs manual) | Better-Auth é padrão em 2026: já faz rate limit, 2FA, reset de senha, email verification | Better-Auth já no package.json (^1.1.16, atual 1.6.20) |
| **useEffect + fetch puro** | TanStack Query cuida de cache/loading/erro/refetch; está instalado mas não usado | Substituir todos os fetches manuais |
| **Framer Motion** | `framer-motion@^11.15.0` funciona, mas `motion@12.40.0` é o sucessor (rebranded) | Migrar gradualmente para `motion` |
| **xlsx (SheetJS)** | `xlsx@0.18.5` — API antiga | `exceljs` ou `sheets` são opções modernas |
| **Sem testes** | Projeto comercial em 2026 sem testes não é crível | Vitest + Testing Library + Playwright |
| **bcryptjs** | `bcryptjs@2.4.3` é JS puro (lento). `bcrypt` (nativo) é mais rápido | Trocar para `bcrypt` (nativo) |

### 2.3 Dependências instaladas mas NÃO usadas (código morto)

| Pacote | Uso no Projeto | Ação |
|---|---|---|
| `better-auth@^1.1.16` | **Zero** — todo auth é custom JWT | ✅ Deve ser usado (é a prioridade #1) |
| `@tanstack/react-query@^5.62.0` | **Quase zero** — apenas imports soltos | ✅ Deve ser adotado em todo fetch |
| `@tanstack/react-table@^8.21.2` | **Zero** — tabelas são manuais | ✅ Usar ou remover |
| `@hookform/resolvers@^3.9.1` | **Zero** — não achei uso de resolver | ⚠️ Verificar se é necessário |
| `zustand@^5.0.3` | **Zero** — não achei store | ⚠️ Instalado mas sem uso |
| `react-is@^19.2.7` | **Zero** — provavelmente transitório | ✅ Remover |
| `@radix-ui/react-tabs@^1.1.3` | **Zero** — não implementado | ⚠️ Verificar se será usado |

---

## 3. ARQUITETURA COMPLETA

### 3.1 Fluxo de Dados (Atual)

```
Browser → Next.js App Router → API Routes (server) → Drizzle ORM → PostgreSQL
                    ↕
            Client Components
         (useEffect + fetch + useState)
                    ↕
              Context API (Auth)
```

**Problemas do fluxo atual:**
- Toda página é `"use client"` — nenhum Server Component
- Nenhum cache entre requisições (nem TanStack Query)
- API routes sem pool de conexão
- Sem middleware de proteção

### 3.2 Fluxo de Dados (Alvo — Pós-refatoração)

```
Browser → Next.js App Router
            ├── Server Components (dados direto do DB)
            ├── Client Components com TanStack Query (cache + refetch)
            └── Server Actions (mutações)
                    ↕
           Better-Auth (sessão, RBAC, rate limit)
                    ↕
         Drizzle ORM + pool de conexão (max: 20)
                    ↕
              PostgreSQL (Neon/RDS)
                    ↕
            Redis (Upstash/Vercel KV)
          ─ cache de queries pesadas
          ─ rate limiting
          ─ sessões
```

### 3.3 Sistema de Autenticação (ATUAL — Problemático)

```
lib/auth.ts
  └─ createToken(user) → JWT (HS256, 7d exp, payload: {id, email, name, role})
  └─ getSession() → lê cookie "session" → verifica JWT com jose → retorna payload

app/api/auth/login/route.ts
  └─ email + password → bcrypt.compare → createToken → set cookie (httpOnly, secure:false ← ERRO)

app/api/auth/register/route.ts
  └─ name + email + password + role ← role VINDO DO CLIENTE (PRIVILEGE ESCALATION!)
  └─ bcrypt.hash → insert into users
  └─ SEM email verification, SEM validação de senha

app/api/auth/me/route.ts → re-fetch do DB (OK)
app/api/auth/logout/route.ts → clear cookie
```

**Problemas**: hardcoded JWT secret fallback, secure:false, role do cliente, sem rate limit, sem CSRF, sem token rotation, 7d exp.

### 3.4 Arquitetura de Banco (ATUAL — Problemática)

**Dois sistemas de usuário CONFLITANTES:**
```sql
-- Tabela LEGACY (usada pelo auth)
users: id SERIAL PK, name, email, password, role VARCHAR(50)

-- Tabela SUPABASE (NÃO usada pelo auth)
profiles: id UUID PK, email, name

-- Tabelas que referenciam users.id (serial → integer)
items.responsible_user → users.id ✓
items.created_by → users.id ✓

-- Tabelas que esperam UUID (mas recebem stringify(session.id) = "123")
fichas_tecnicas.created_by UUID ← String(123) = "123" ✗
pedidos_compra.created_by UUID ← String(123) = "123" ✗
movimentacoes_estoque.created_by UUID ← String(123) = "123" ✗
transferencias.created_by UUID ← String(123) = "123" ✗
```

---

## 4. ANÁLISE DE SEGURANÇA

### 🔴 CRÍTICOS (Corrigir ANTES de qualquer deploy)

| # | Arquivo:Linha | Problema | Risco |
|---|---|---|---|
| 1 | `register/route.ts:27` | `role: role \|\| "staff"` — role vem do body | **Privilege Escalation**: qualquer um se cadastra como admin |
| 2 | `login/route.ts:51` | `secure: false` hardcoded no cookie | **Session hijacking**: cookie enviado em HTTP puro |
| 3 | `lib/auth.ts:4-6` | `"supersecretkey123..."` hardcoded como fallback | **Token forgery**: se env var não setada, qualquer um forja JWT |
| 4 | Nenhuma rota | Rate limiting inexistente | **Brute force**: login testa senhas ilimitadamente |
| 5 | `fichas-tecnicas/[id]/route.ts:11` | GET sem auth | **Data leak**: qualquer um vê receitas/custos |
| 6 | `transferencias/[id]/route.ts:23-24` | GET sem auth | **Data leak**: qualquer um vê transferências |
| 7 | `estabelecimentos/[id]/route.ts:7-8` | GET sem auth | **Data leak**: qualquer um vê dados do estabelecimento |
| 8 | `import-detect/route.ts` | POST sem auth | **RCE vector**: qualquer um envia arquivos |
| 9 | `import-items/route.ts` | POST sem auth | **Data injection**: qualquer um insere itens |
| 10 | `import-rollback/route.ts` | POST sem auth | **Data destruction**: qualquer um deleta dados |
| 11 | `business-advice/route.ts` | GET sem auth | **Data leak**: qualquer um vê dados de negócio |
| 12 | `.env` | DB URL + Supabase keys em arquivo não gitignorado | **Credential leak**: commit expõe banco |
| 13 | Nenhuma rota | CSRF tokens ausentes | **Cross-site request forgery** |
| 14 | Multiplas rotas | `error.message` retornado ao cliente | **Information disclosure**: atacante descobre estrutura interna |
| 15 | N/A | `middleware.ts` não existe | **Zero proteção centralizada de rotas** |

### 🟡 ALTOS

| # | Arquivo:Linha | Problema |
|---|---|---|
| 16 | `register/route.ts:35-36` | "Email já cadastrado" permite enumeração de usuários |
| 17 | `lib/auth.ts:19` | JWT expira em 7 dias (muito longo) |
| 18 | `forgot-password/page.tsx` | Password reset é FAKE (só `setTimeout`, sem API) |
| 19 | `next.config.ts:5-6` | CSP permite `unsafe-eval` e `unsafe-inline` |
| 20 | `app/layout.tsx:20` | `dangerouslySetInnerHTML` no script de tema |
| 21 | `ai-chat/route.ts` | Non-admin pode ver dados de custo via fallback |

### 🟢 COISAS CERTAS (que já estão boas)

- ✅ httpOnly cookies (token não acessível via JS)
- ✅ bcrypt com salt rounds 10
- ✅ Mensagens genéricas de erro no login (sem enumeração)
- ✅ Drizzle ORM (queries parametrizadas previnem SQL injection)
- ✅ Normalização de nomes (strip special chars)
- ✅ Role checks em operações admin (DELETE, etc.)
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, CSP, etc.)
- ✅ poweredByHeader: false
- ✅ `/api/auth/me` re-valida usuário no DB (não confia só no token)
- ✅ Logout limpa cookie corretamente

---

## 5. ANÁLISE DO BANCO DE DADOS

### 5.1 Schema Overview

**Arquivo:** `db/schema.ts` (~505 linhas)
**Migration:** `db/migrations/0000_flippant_cobalt_man.sql`
**Tabelas:** 28 tabelas + 9 enums

### 5.2 🔴 Problemas Críticos no Schema

| # | Problema | Detalhe | Impacto |
|---|---|---|---|
| 1 | **Dual auth: serial vs uuid** | `users.id` = serial, `profiles.id` = uuid. `createdBy` em 10+ tabelas espera uuid mas recebe `String(userId_int)` | Relações quebradas, dados inconsistentes |
| 2 | **Sem pool de conexão** | `db/index.ts`: `postgres(url)` sem `max`, `idle_timeout` | Em produção com >5 requests simultâneos, conexões esgotam |
| 3 | **Apenas 3 índices** para 28 tabelas | Índices em: `uq_estoque_lote`, `uq_sub_receita`, `uq_usuario_estabelecimento` | Qualquer filtro sem índice = full scan |
| 4 | **Zero ON DELETE CASCADE** | Todas as FKs: `ON DELETE NO ACTION` | Deletar categoria com items = erro. Solução manual em 4+ rotas |
| 5 | **Zero transações** em operações multi-tabela | Deletes em cascata manuais sem `BEGIN/COMMIT` | Falha no meio corrompe dados |
| 6 | **7+ uuid columns sem FK** | `usuario_estabelecimento.userId`, `movimentacoesEstoque.pedidoId`, `auditEvents.userId`, etc. | Dados órfãos, inconsistência |
| 7 | **`createdBy` type mismatch** | `pedidosCompra.createdBy` é uuid, mas rota faz `String(session.id)` (= "123") | PostgreSQL aceita mas é semanticamente errado |
| 8 | **Seed.ts é placeholder** | `seed.ts`: só `console.log("Configure o seed")` | Sem dados de demo para novos clientes |
| 9 | **Sem estratégia de backup** | Nenhum script `pg_dump`, cron job, ou referência | Um crash = perda total |
| 10 | **Duas tabelas de inventário** | `items` (legacy) + `estoque_estabelecimento` (novo) convivem | Dobra complexidade de manutenção |

### 5.3 Índices Necessários (Mínimo)

```sql
-- Foreign keys (mais críticos)
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_items_responsible_user ON items(responsible_user);
CREATE INDEX idx_estoque_estabelecimento_id ON estoque_estabelecimento(estabelecimento_id);
CREATE INDEX idx_estoque_catalog_item_id ON estoque_estabelecimento(catalog_item_id);
CREATE INDEX idx_movimentacoes_catalog_item ON movimentacoes_estoque(catalog_item_id);
CREATE INDEX idx_movimentacoes_data ON movimentacoes_estoque(created_at);
CREATE INDEX idx_movimentacoes_tipo ON movimentacoes_estoque(tipo);
CREATE INDEX idx_pedido_itens_pedido ON pedido_compra_itens(pedido_compra_id);
CREATE INDEX idx_transferencia_itens ON transferencia_itens(transferencia_id);
CREATE INDEX idx_expenses_estabelecimento ON expenses(estabelecimento_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_ficha_insumos_ficha ON ficha_tecnica_insumos(ficha_tecnica_id);
```

### 5.4 Queries Problemáticas

| Arquivo:Linha | Problema | Solução |
|---|---|---|
| `pedidos-compra/route.ts:32` | Subquery correlacionada `SELECT COUNT(*) FROM pedido_compra_itens WHERE ...` | Mudar para `LEFT JOIN` + `GROUP BY` |
| `transferencias/route.ts:54-56` | 3 subqueries correlacionadas (origem, destino, count) | Mudar para JOINs |
| `categories/route.ts:14-24` | N+1 com Drizzle `with` aninhado | Usar `findMany` + join explícito |
| `fichas-tecnicas/route.ts:13-19` | N+1 aninhado profundo | Mesmo problema |
| `import-items/route.ts:134` | Check de duplicata por linha (N+1 dentro do batch) | Usar `ON CONFLICT` ou check em lote |
| `bi/route.ts:113-355` | múltiplos `catch {}` vazios com fallback `Math.random()` | Loggar erros, retornar null |

### 5.5 BI — Dados Aleatórios (ENGANAÇÃO)

O endpoint `/api/bi` retorna **dados aleatórios** como fallback quando o DB está vazio:

```typescript
// bi/route.ts:113-118
const mockCategorias = CATEGORIAS_BI.map(cat => ({
  categoria: cat, giro: +(Math.random() * 5).toFixed(2), ...
}));
```

Isso significa que um cliente sem dados vê **números falsos** achando que são reais. Isso é **inaceitável para um produto comercial**. Deve retornar `null` ou um estado vazio explícito.

---

## 6. ANÁLISE DE PERFORMANCE

### 🔴 Gargalos que impedem escala

| # | Problema | Impacto | Prioridade |
|---|---|---|---|
| 1 | **Sem pool de conexão** | >5 requests simultâneos = timeout | 🔴 Crítico |
| 2 | **Zero paginação** em listas | 10k itens = download de tudo + freeze do browser | 🔴 Crítico |
| 3 | **100% Client Components** | Bundle enorme, sem SSR/SEO, sem streaming | 🔴 Crítico |
| 4 | **Correlated subqueries** | 100 pedidos = 101 queries | 🟡 Alto |
| 5 | **N+1 com Drizzle `with`** | 50 categorias = 51+ queries | 🟡 Alto |
| 6 | **TanStack Query não usado** | Sem cache, refetch manual, sem loading states | 🟡 Alto |
| 7 | **Sem React.memo ou virtualização** | Listas grandes = re-render total | 🟡 Alto |

### 🟡 Problemas de Performance Médios

| # | Problema | Local |
|---|---|---|
| 8 | Framer Motion + Recharts sem lazy loading nas páginas | dashboard, bi, financeiro |
| 9 | Nenhum cache layer (Redis, ISR, SWR) | Toda request bate no DB |
| 10 | Sem `stale-while-revalidate` | middleware força `no-store` |
| 11 | SSE de import segura conexão aberta | import-items/route.ts |
| 12 | file-cache.ts em memória (não compartilhado) | Perdido em restart |
| 13 | `useEffect` + `fetch` repetido em toda navegação | Todas as páginas |

---

## 7. ANÁLISE DE UX E FEATURES

### ✅ O que já está bom

- Landing page com hero, features, testimonials, pricing (3 planos)
- Tour de boas-vindas + Onboarding guide
- Paleta de comandos (⌘K)
- Assistente IA flutuante
- Skip-to-content para acessibilidade
- Notificações com som configurável
- Exportação CSV em todas as páginas
- Error boundary + página 404 customizada
- Sidebar responsiva com indicador de página ativa
- Dark mode com toggle

### 🔴 O que um cliente pagante NOTARIA (e reclamaria)

| # | Problema | Local | Impacto |
|---|---|---|---|
| 1 | **Password reset não funciona** | `forgot-password/page.tsx` | Usuário preso fora do sistema |
| 2 | **Perfil não salva alterações** | `profile/page.tsx` — não chama API | Muda nome/senha e perde |
| 3 | **`window.confirm()` em vez de modal** | Todas as ações destrutivas (20+ ocorrências) | Parece amador |
| 4 | **Formulários sem HTML5 validation** | `gestao`, `pedidos-compra`, `fichas-tecnicas`, etc | Usuário submete e vê toast de erro |
| 5 | **Sem esqueletos de loading** | 7/8 páginas de lista | Flash de "Nenhum item" antes dos dados |
| 6 | **Sem paginação nas listas** | Todas as páginas | 5k itens = página gigante e lenta |
| 7 | **Dark mode quebrado em 2 páginas** | `financeiro/page.tsx`, `relatorios/page.tsx` | Inline styles hardcoded dark |
| 8 | **Sem alternador de estabelecimento** | Layout não tem seletor de unidade | Multi-unidade não utilizável |
| 9 | **Sem logs de auditoria** | Nenhuma ação de usuário é registrada | Cliente não sabe quem fez o quê |
| 10 | **Sem página de termos/privacy** | Essencial para SaaS | Risco legal |
| 11 | **Sem integração de pagamento** | Landing page tem planos mas não cobra | Cliente não consegue assinar |
| 12 | **Data/currency formatting manual** | `toLocaleString("pt-BR")` repetido em 50+ lugares | Inconsistências |

---

## 8. CÓDIGO MORTO E DÍVIDA TÉCNICA

### 8.1 Dependências Não Utilizadas

```
better-auth@^1.1.16          → Instalado, zero imports. DEVE ser usado (é a solução de auth)
@tanstack/react-query@^5.62.0 → Instalado, quase não usado. DEVE ser adotado.
@tanstack/react-table@^8.21.2 → Instalado, zero imports. Usar ou remover.
zustand@^5.0.3               → Instalado, zero stores. Usar ou remover.
react-is@^19.2.7             → Instalado, provável dependência transitória exposta.
@hookform/resolvers@^3.9.1   → Instalado, não achei uso. Verificar.
```

### 8.2 Padrões Problemáticos (Technical Debt)

| Padrão | Ocorrências | Impacto |
|---|---|---|
| `catch {}` vazio | 25+ (bi, ai-chat, notificacoes, etc) | Erros silenciosos, debugging impossível |
| `window.confirm()` | 15+ chamadas | UX amadora |
| Inline styles dark-only | `financeiro/page.tsx`, `relatorios/page.tsx` | Light mode quebrado |
| `error.message` exposto | 8+ rotas de API | Information disclosure |
| `Math.random()` como dados | `bi/route.ts` (10+ locais) | Engana o usuário |
| `useEffect` + `fetch` | 12+ páginas | Sem cache, sem loading states |
| Scripts SQL soltos | 5+ arquivos .sql na raiz | Fora do versionamento de migrações |
| `String(decimal)` | 10+ conversões manuais | Perda de precisão potencial |

### 8.3 ESLint vs Biome

O projeto usa **Biome** (`@biomejs/biome@1.9.4`) para linting, não ESLint. Correto para 2026. O comando `npm run lint` executa `biome check --apply .`.

---

## 9. ROADMAP PARA V1 COMERCIALIZÁVEL

### SEMANA 1 — SEGURANÇA (Prioridade ABSOLUTA)

```
DIA 1: Fechar privilege escalation + Adicionar middleware
  [ ] register/route.ts: remover role do body, forçar "staff" no servidor
  [ ] Criar middleware.ts com:
      - Proteção de rotas (/app/* requer login)
      - Redirecionamento para /auth/login
      - Renew automático do cookie
  [ ] Adicionar HSTS header (Strict-Transport-Security)

DIA 2: Fechar 9 endpoints sem auth + Cookie secure
  [ ] Adicionar getSession() em:
      - GET /api/fichas-tecnicas/[id]
      - GET /api/fichas-tecnicas/[id]/insumos
      - GET /api/transferencias/[id]
      - GET /api/transferencias/[id]/itens
      - GET /api/estabelecimentos/[id]
      - POST /api/import-detect
      - POST /api/import-items
      - POST /api/import-rollback
      - GET /api/business-advice
  [ ] login/route.ts: secure: process.env.NODE_ENV === "production"
  [ ] login/route.ts: sameSite: "strict"

DIA 3: Rate limiting + .env security
  [ ] npm install @upstash/ratelimit
  [ ] Adicionar rate limit no login (5 tentativas/min)
  [ ] Adicionar rate limit nas rotas críticas (import, register)
  [ ] Mover .env para .env.local
  [ ] Criar .env.example (sem valores reais)
  [ ] Verificar .gitignore

DIA 4: Migrar para Better-Auth (PARTE 1)
  [ ] npm install better-auth@latest (atualizar de 1.1.16 para 1.6.20)
  [ ] Remover lib/auth.ts (jose + createToken + getSession)
  [ ] Remover lib/env.ts
  [ ] Configurar Better-Auth com:
      - Database adapter para Drizzle
      - Email + password provider
      - Rate limiting embutido
      - Session management
      - Roles: admin, gerente, chef, bartender, garcom, estoquista, staff

DIA 5: Migrar para Better-Auth (PARTE 2) + Password reset
  [ ] Migrar login/register/logout/me para Better-Auth
  [ ] Adicionar email verification (com Resend)
  [ ] Implementar password reset REAL:
      - POST /api/auth/reset-password (envia email)
      - GET /auth/reset-password/[token] (página)
      - POST /api/auth/reset-password/[token] (confirma)
  [ ] Adicionar CSRF protection (Better-Auth já faz)

DIA 5 (extra): Corrigir error messages + JWT
  [ ] Substituir error.message por mensagens genéricas em todas as rotas
  [ ] Adicionar validação de JWT_SECRET no startup (lançar erro se não setado)
```

### SEMANA 2 — ARQUITETURA E DADOS

```
DIA 6: Unificar sistema de usuários
  [ ] DECIDIR: manter users (serial) ou profiles (uuid)
      → Recomendação: unificar em users (serial) que Better-Auth suporta
      → OU: profiles (uuid) se quiser compatibilidade Supabase
  [ ] Migrar todas as colunas createdBy para o tipo escolhido
  [ ] Adicionar FK constraints em todas as colunas de referência

DIA 7: Pool de conexão + Índices + Backup
  [ ] db/index.ts: configurar pooling:
      const client = postgres(connectionString, {
        max: 20,
        idle_timeout: 30,
        connect_timeout: 10,
        ssl: process.env.NODE_ENV === "production" ? "require" : undefined
      })
  [ ] Gerar migration com 12+ índices (ver seção 5.3)
  [ ] Criar script de backup: scripts/backup.sh / backup.ps1
      - pg_dump diário
  [ ] Adicionar ao cron/agendador do Windows

DIA 8: Transações + FK constraints
  [ ] Wrapping multi-table operations em db.transaction():
      - categories/[id]/route.ts (delete category + items)
      - pedidos-compra/[id]/route.ts (delete pedido + itens)
      - fichas-tecnicas/[id]/route.ts (delete ficha + insumos)
      - transferencias/[id]/route.ts (delete transferencia + itens)
      - import-items/route.ts (batch insert)
  [ ] Adicionar ON DELETE CASCADE nas FKs críticas
  [ ] Adicionar FK constraints nas 7+ colunas órfãs

DIA 9: Seed funcional + Corrigir BI
  [ ] Criar seed.ts funcional com:
      - Usuário admin de teste (admin@email.com / 123456)
      - 3 estabelecimentos
      - 50+ itens em estoque
      - 10 fichas técnicas
      - 5 pedidos de compra
      - 10 movimentações
      - 1 mês de despesas
      - Dados de BI reais (não aleatórios)
  [ ] Usar Drizzle Seed API (drizzle-orm/seed)

DIA 10: Corrigir BI
  [ ] bi/route.ts: remover Math.random() fallback
  [ ] Quando DB vazio: retornar null + frontend mostra EmptyState
  [ ] Adicionar logging nos catch {} vazios
  [ ] Remover tabelas duplicadas legacy (items antigo) se possível
```

### SEMANA 3 — PERFORMANCE E UX

```
DIA 11: Paginação (API) + Queries otimizadas
  [ ] Adicionar ?page=&limit= em todas as listas GET:
      - /api/items
      - /api/categories
      - /api/pedidos-compra
      - /api/transferencias
      - /api/estabelecimentos
      - /api/expenses
      - /api/fichas-tecnicas
  [ ] Substituir subqueries correlacionadas por JOINs:
      - pedidos-compra/route.ts (COUNT → LEFT JOIN + GROUP BY)
      - transferencias/route.ts (nome origem/destino → JOIN)

DIA 12: TanStack Query + Paginação (Frontend)
  [ ] Substituir useEffect + fetch por useQuery em todas as páginas
  [ ] Adicionar paginação UI em todas as listas (shadcn DataTable?)
  [ ] Adicionar React.memo em componentes de linha de tabela

DIA 13: React Server Components
  [ ] Migrar páginas de lista para RSC:
      - gestão de itens (server component + client component de interação)
      - fichas técnicas (idem)
      - pedidos de compra (idem)
  [ ] Manter client components apenas para interatividade

DIA 14: UX — Formulários + Modais + Loading
  [ ] Adicionar HTML5 validation (required, pattern, min, max) em todos os inputs
  [ ] Criar <ConfirmDialog> com shadcn Dialog
  [ ] Substituir todos os 15+ window.confirm() pelo ConfirmDialog
  [ ] Adicionar esqueletos de loading (Skeleton) em todas as páginas
  [ ] Adicionar EmptyState com onboarding em todas as páginas

DIA 15: Correções de UX + QA final
  [ ] Corrigir dark mode no financeiro e relatórios
  [ ] Adicionar alternador de estabelecimento na sidebar
  [ ] Implementar página de perfil real (PUT /api/users/[id])
  [ ] Adicionar troca de senha na página de perfil
  [ ] Testar todos os fluxos crítica (login → dados → logout)
  [ ] Testar em mobile (responsivo)
```

### SEMANA 4 — POLIMENTO FINAL

```
DIA 16: Documentação + Deploy
  [ ] Criar README.md com:
      - Screenshots do sistema
      - Stack usada
      - Instruções de deploy (Vercel + Neon)
      - Variáveis de ambiente necessárias
  [ ] Criar LICENSE.md
  [ ] Termos de serviço + Política de privacidade
  [ ] Deploy na Vercel + Neon PostgreSQL
  [ ] Configurar domínio customizado + SSL

DIA 17: Pagamento + Onboarding
  [ ] Integrar Stripe (cartão internacional) + Asaas (Pix/boleto BR)
  [ ] Criar webhooks de pagamento
  [ ] Migrar landing page planos para planos reais (checkout Stripe/Asaas)
  [ ] Adicionar trial de 7 dias

DIA 18: Testes
  [ ] npm install vitest @testing-library/react @testing-library/jest-dom
  [ ] Testes unitários: libs (auth, settings, export-csv, stock-calc, sound)
  [ ] Testes de API: login, register, items CRUD
  [ ] Testes E2E (Playwright): fluxo completo de usuário

DIA 19: Audit + SEO
  [ ] Lighthouse audit (performance, accessibility, SEO, PWA)
  [ ] Adicionar Google Analytics / Plausible
  [ ] Adicionar meta tags SEO em todas as páginas
  [ ] Sitemap.xml + robots.txt

DIA 20: LANÇAMENTO
  [ ] Teste de carga (k6 ou autocannon) — 100 usuários concorrentes
  [ ] Pentest básico das correções de segurança
  [ ] Deploy final
  [ ] Changelog v2.0.0
  [ ] Git commit + push para GitHub (privado)
```

---

## 10. ESTIMATIVA DE ESFORÇO E PRIORIDADES

### 10.1 Prioridades vs Esforço

| Fase | Esforço | Impacto na Venda | Prioridade |
|---|---|---|---|
| **Segurança** (Semana 1) | 5 dias | 🔴 Sem isso, NÃO venda | **#1 — BLOQUEANTE** |
| **Arquitetura/Dados** (Semana 2) | 5 dias | 🟡 Problemas estruturais graves | **#2 — ALTA** |
| **Performance** (Semana 3) | 5 dias | 🟡 Escalabilidade | **#3 — MÉDIA** |
| **UX** (Semana 3-4) | 5 dias | 🟡 Percepção de qualidade | **#4 — MÉDIA** |
| **Pagamento/Deploy** (Semana 4) | 3 dias | 🟢 Essencial mas rápido | **#5 — MÉDIA** |
| **Testes** (Semana 4) | 2 dias | 🟢 Credibilidade | **#6 — BAIXA** |

### 10.2 Estimativa Total

| Fase | Dias | Horas Estimadas |
|---|---|---|
| Semana 1: Segurança | 5 | 40h |
| Semana 2: Arquitetura/Dados | 5 | 40h |
| Semana 3: Performance/UX | 5 | 40h |
| Semana 4: Polimento | 5 | 40h |
| **Total** | **20 dias** | **~160h** |

> ⚠️ Estimativa para 1 pessoa trabalhando full-time. Se for desenvolver em paralelo com outras atividades, multiplique por 2–3x.

### 10.3 Modelo de Negócio Sugerido

| Plano | Preço | Features |
|---|---|---|
| **Starter** | R$ 97/mês | 1 estabelecimento, 500 itens, 5 usuários |
| **Pro** | R$ 197/mês | 3 estabelecimentos, 5k itens, 15 usuários, BI |
| **Enterprise** | R$ 397/mês | Ilimitado, suporte prioritário, API dedicada |

**Plataforma de pagamento:** Asaas (Pix + boleto + cartão) — domina mercado BR.
**Gateway alternativo:** Stripe (clientes internacionais).

---

## 11. ESTRUTURA DE ARQUIVOS COMPLETA

```
GERENCIAMENTO DE ESTOQUE PARA RESTAURANTES E BARES/
│
├── .env                          ← 🔴 CONTÉM CREDENCIAIS (NÃO COMMITAR!)
├── .env.local                    ├── (alternativa segura)
├── .gitignore
│
├── package.json                  ─ Dependências e scripts
├── tsconfig.json                 ─ TypeScript config
├── next.config.ts                ─ Next.js + security headers + CSP
├── tailwind.config.ts            ─ Tailwind config
├── postcss.config.mjs            ─ PostCSS config
├── drizzle.config.ts             ─ Drizzle Kit config
├── middleware.ts                 ─ 🔴 NÃO EXISTE (precisa criar)
│
├── app/
│   ├── layout.tsx                ─ Root layout (ThemeProvider, AuthProvider, Toaster)
│   ├── page.tsx                  ─ Landing page (hero, features, pricing, testimonials)
│   ├── not-found.tsx             ─ Página 404 customizada
│   ├── error.tsx                 ─ Error boundary global
│   │
│   ├── globals.css               ─ Tailwind v4 + variáveis CSS
│   │
│   ├── auth/
│   │   ├── login/page.tsx        ─ Login
│   │   ├── register/page.tsx     ─ Cadastro
│   │   └── forgot-password/      ─ 🔴 FAKE (só setTimeout)
│   │       └── page.tsx
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts    ─ POST login (secure:false 🔴)
│   │   │   ├── register/route.ts ─ POST register (role do cliente 🔴)
│   │   │   ├── logout/route.ts   ─ POST logout
│   │   │   └── me/route.ts       ─ GET sessão atual
│   │   │
│   │   ├── items/
│   │   │   ├── route.ts          ─ GET/POST items
│   │   │   └── [id]/route.ts     ─ GET/PUT/DELETE item
│   │   │
│   │   ├── categories/
│   │   │   ├── route.ts          ─ GET/POST categories (N+1 🔴)
│   │   │   └── [id]/route.ts     ─ PUT/DELETE (sem transação 🔴)
│   │   │
│   │   ├── suppliers/route.ts    ─ GET/POST fornecedores
│   │   ├── catalog-items/route.ts─ GET catálogo
│   │   │
│   │   ├── estabelecimentos/
│   │   │   ├── route.ts          ─ GET/POST (sem paginação 🔴)
│   │   │   └── [id]/route.ts     ─ PUT/DELETE (GET sem auth 🔴)
│   │   │
│   │   ├── fichas-tecnicas/
│   │   │   ├── route.ts          ─ GET/POST (N+1 🔴)
│   │   │   ├── [id]/route.ts     ─ GET/PUT/DELETE (GET sem auth 🔴)
│   │   │   └── [id]/insumos/route.ts  ─ GET/POST (GET sem auth 🔴)
│   │   │
│   │   ├── pedidos-compra/
│   │   │   ├── route.ts          ─ GET/POST (subquery 🔴, createdBy errado 🔴)
│   │   │   └── [id]/route.ts     ─ GET/PUT/DELETE
│   │   │
│   │   ├── transferencias/
│   │   │   ├── route.ts          ─ GET/POST (3 subqueries 🔴, createdBy errado 🔴)
│   │   │   ├── [id]/route.ts     ─ GET/PUT/DELETE
│   │   │   └── [id]/itens/route.ts
│   │   │
│   │   ├── expenses/
│   │   │   ├── route.ts          ─ GET/POST despesas
│   │   │   └── expense-categories/route.ts
│   │   │
│   │   ├── users/route.ts        ─ GET/POST (admin-only)
│   │   ├── settings/route.ts     ─ GET/PUT configurações
│   │   ├── notificacoes/route.ts ─ GET notificações estoque
│   │   │
│   │   ├── import-items/route.ts ─ POST (sem auth 🔴, sem transação 🔴)
│   │   ├── import-detect/route.ts─ POST (sem auth 🔴)
│   │   ├── import-rollback/route.ts─ POST (sem auth 🔴)
│   │   │
│   │   ├── bi/
│   │   │   ├── route.ts          ─ GET BI (Math.random() 🔴, catch {} vazio 🔴)
│   │   │   └── sugestao-compra/
│   │   │       └── route.ts      ─ GET sugestão de compra
│   │   │
│   │   ├── ai-chat/route.ts      ─ POST chat IA
│   │   └── business-advice/route.ts─ GET (sem auth 🔴)
│   │
│   └── app/
│       ├── layout.tsx            ─ App layout (sidebar, theme, notification bell)
│       ├── page.tsx              ─ Redirect → /app/dashboard
│       │
│       ├── dashboard/page.tsx    ─ Dashboard (única com full states)
│       ├── gestao/page.tsx       ─ CRUD itens (sem loading skeleton)
│       ├── estabelecimentos/     ─ CRUD estabelecimentos
│       ├── fichas-tecnicas/      ─ CRUD fichas técnicas
│       ├── pedidos-compra/       ─ CRUD pedidos
│       ├── transferencias/       ─ CRUD transferências
│       ├── financeiro/page.tsx   ─ Despesas + CMV (dark mode quebrado 🔴)
│       ├── relatorios/page.tsx   ─ Relatórios (dark mode quebrado 🔴)
│       ├── usuarios/page.tsx     ─ Gerência de usuários
│       ├── profile/page.tsx      ─ 🔴 Perfil não salva (mock)
│       ├── importar/page.tsx     ─ Importação
│       ├── preenchimento/page.tsx─ Contagem de estoque
│       ├── configuracoes/page.tsx─ Configurações
│       │
│       └── bi/
│           ├── page.tsx          ─ BI dashboard (12 charts)
│           └── sugestao-compra/
│               └── page.tsx      ─ Sugestão de compra
│
├── components/
│   ├── charts.tsx                 ─ Recharts components
│   ├── splash-screen.tsx          ─ Splash inicial
│   │
│   └── ui/
│       ├── button.tsx             ─ Shadcn button
│       ├── input.tsx              ─ Shadcn input
│       ├── label.tsx              ─ Shadcn label
│       ├── select.tsx             ─ Shadcn select
│       ├── dialog.tsx             ─ Shadcn dialog (instalado mas não usado!)
│       ├── card.tsx               ─ Shadcn card
│       ├── skeleton.tsx           ─ Loading skeleton
│       ├── empty-state.tsx        ─ Empty state
│       ├── error-boundary.tsx     ─ Error boundary
│       ├── theme-toggle.tsx       ─ Dark/light toggle
│       ├── notification-bell.tsx  ─ Sino de notificações
│       ├── command-palette.tsx    ─ ⌘K palette
│       ├── ai-guide.tsx           ─ Assistente IA flutuante
│       ├── welcome-tour.tsx       ─ Tour de boas-vindas
│       ├── onboarding-guide.tsx   ─ Guia de onboarding
│       └── skip-to-content.tsx    ─ Acessibilidade
│
├── hooks/
│   ├── use-auth.tsx               ─ Auth context/provider
│   ├── use-settings.ts            ─ Settings hook
│   ├── use-notificacoes.ts        ─ Notificações polling
│   ├── use-theme.tsx              ─ Theme hook
│   └── theme-context.tsx          ─ Theme context
│
├── lib/
│   ├── auth.ts                   ─ 🔴 Custom JWT (será removido)
│   ├── env.ts                    ─ 🔴 JWT_SECRET (será removido)
│   ├── validation.ts             ─ Zod schemas + normalização
│   ├── settings.ts               ─ Definição de configurações
│   ├── export-csv.ts             ─ Exportação CSV/JSON
│   ├── stock-calc.ts             ─ Algoritmo de estoque mínimo
│   ├── sound.ts                  ─ Web Audio API sounds
│   ├── animations.tsx            ─ Framer Motion variants
│   ├── file-cache.ts             ─ Cache de arquivos (em memória)
│   ├── encoding-fix.ts           ─ Fix encoding importação
│   ├── import-cols.ts            ─ Mapeamento colunas importação
│   ├── item-category-map.ts      ─ Mapa item → categoria
│   ├── consultoria-kb.ts         ─ Base conhecimento IA
│   └── cloud-jobs.ts             ─ ─ Pendente (só placeholder)
│
├── db/
│   ├── schema.ts                 ─ Schema completo (28 tabelas)
│   ├── index.ts                  ─ Conexão (sem pool 🔴)
│   │
│   └── migrations/
│       ├── 0000_flippant_cobalt_man.sql  ─ Única migration
│       └── meta/
│           └── _journal.json
│
├── types/
│   └── lucide-react.d.ts         ─ Declarações de ícones
│
├── seed.ts                       ─ 🔴 Placeholder (não funcional)
├── seed.mjs                      ─ Seed raw SQL (2 usuários)
│
├── CHANGELOG.md                  ─ Histórico de versões
├── TUDO SOBRE O SISTEMA.md       ─ ─ ESTE ARQUIVO
│
└── Arquivos SQL soltos (5):
    ├── sql_mvp.sql
    ├── sql_mvp_completo.sql
    ├── sql_colunas.sql
    ├── sql_colunas_custom.sql
    └── criar_usuarios_teste.sql
```

---

## ANEXO: COMANDOS ÚTEIS

```bash
# Desenvolvimento
npm run dev              # Next.js dev server
npm run type-check       # TypeScript check
npm run lint             # Biome lint + fix
npm run db:generate      # Gerar migration
npm run db:migrate       # Rodar migration
npm run db:studio        # Drizzle Studio (UI do banco)
npm run seed             # Seed (NÃO FUNCIONA — placeholder)

# Build
npm run build            # Build produção
npm run validate         # Lint + type-check

# Git (NUNCA commitar .env!)
git status
git add -A
git commit -m "mensagem"
git push origin main
```

---

## ANEXO: DECISÕES ARQUITETURAIS CHAVE

### Decisão 1: Better-Auth vs Continuar Custom JWT

**Veredito:** Better-Auth (já instalado, versão atual 1.6.20)

Por quê:
- Rate limiting embutido (elimina necessidade de Upstash)
- Password reset + email verification nativos
- RBAC nativo
- CSRF protection embutido
- Session management com refresh automático
- Menos código para manter (elimina lib/auth.ts + lib/env.ts)
- Padrão de mercado em 2026

### Decisão 2: Unificar usuários em serial ou uuid

**Veredito:** Unificar em `serial` (users.id)

Por quê:
- Better-Auth suporta serial PK
- Todas as queries existentes usam `session.id` como número
- uuid adiciona complexidade desnecessária
- Se quiser Supabase no futuro, dá para migrar

### Decisão 3: Postgres pooling nativo vs Neon

**Veredito:** Usar pooling nativo do `postgres` (já instalado)

```typescript
const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});
```

Se for para Neon, usar `@neondatabase/serverless` com `ws` WebSocket.

### Decisão 4: Remover dados aleatórios do BI

**Veredito:** SIM, remover imediatamente. Retornar `null` e mostrar EmptyState.

Dados aleatórios enganam o usuário e podem levar a decisões de negócio erradas. É inaceitável para um produto comercial.

---

## ANEXO: VALIDAÇÃO DAS SUGESTÕES vs MERCADO 2026

Todas as minhas sugestões foram validadas com versões reais de Junho/2026:

| Sugestão | Versão Atual | Acertada? |
|---|---|---|
| `postgres` pooling nativo (max, idle_timeout) | postgres@3.4.9 | ✅ |
| Better-Auth (em vez de custom JWT) | better-auth@1.6.20 | ✅ (já instalado!) |
| TanStack Query para data fetching | @tanstack/react-query@5.x | ✅ (já instalado!) |
| Upstash para rate limiting (se não usar Better-Auth) | @upstash/ratelimit@2.0.8 | ✅ |
| Resend para email transacional | resend@6.14.0 | ✅ |
| Stripe + Asaas para pagamentos | stripe@22.2.2 | ✅ |
| React Server Components (Next.js 16) | Padrão desde Next 13+ | ✅ |
| date-fns para datas | date-fns@4.x | ✅ |
| Zod para validação | zod@3.24+ | ✅ |
| Biome para lint (em vez de ESLint) | @biomejs/biome@1.9.x | ✅ |
| Zustand para estado global | zustand@5.x | ✅ |
| Vitest + Testing Library para testes | vitest latest | ✅ |
| Migrar de `framer-motion` para `motion` | motion@12.40.0 | ⚠️ Baixa prioridade (framer-motion 11 funciona) |
| Trocar bcryptjs por bcrypt nativo | bcrypt latest | ⚠️ Baixa prioridade (bcryptjs funciona) |

---

> **Última atualização:** 21 de Junho de 2026
> **Autor:** Análise gerada por IA (OpenCode)
> **Status:** 🟡 Projeto promissor mas com 15 issues críticas que BLOQUEIAM venda
> **Próxima ação:** Iniciar Semana 1 do Roadmap (Segurança)
