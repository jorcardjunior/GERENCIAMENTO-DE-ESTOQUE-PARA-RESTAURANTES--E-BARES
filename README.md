# Gerenciamento de Estoque (EstoqueRest)

Sistema web full-stack de gerenciamento de estoque para restaurantes e bares, com multiusuário, multi-estabelecimento, fichas técnicas e controle financeiro.

> Status: projeto em desenvolvimento ativo. Sem declaração de deploy em produção (`NÃO CONFIRMADO` até prova de ambiente publicado).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| ORM / Banco | Drizzle ORM 0.38, PostgreSQL (Drizzle migrations) |
| Autenticação | Better Auth 1.1 (`better-auth`) |
| Validação / Estado / UI | Zod, Zustand, TanStack Query, TanStack Table, Recharts |
| Utilitários | jose, bcryptjs, xlsx (importação CSV/Excel), resend |

## Funcionalidades principais

- Autenticação e gestão de usuários (login, registro, ativação, reset forçado, troca de usuário) com Better Auth + fallback JWT legado.
- Multi-estabelecimento: registros por estabelecimento com vínculo de usuário.
- Controle de estoque: itens, categorias, lotes, movimentações, fornecedores e pedidos de compra.
- Fichas técnicas com insumos e sub-receitas.
- Transferências de estoque entre estabelecimentos (com itens).
- Controle financeiro: categorias de despesa e despesas.
- BI / inteligência de compras: sugestão de compra e advice de negócio.
- Importação de itens CSV/Excel com detecção e correção automática de encoding.
- Auditoria de eventos (`auditEvents`), notificações e logs de produção/perda.

## Rotas da aplicação

Área logada (`/app`): `dashboard`, `gestao`, `estabelecimentos`, `fichas-tecnicas`, `financeiro`, `importar`, `pedidos-compra`, `preenchimento`, `profile`, `relatorios`, `transferencias`, `usuarios`, `configuracoes`, `bi`.

Autenticação: `/login`, `/register`, `/activate`, `/forgot-password`, `/forced-reset`.

## Banco de dados

Schema Drizzle com ~35 tabelas, incluindo `items`, `catalogItems`, `inventoryItems`, `stockMovements`, `suppliers`, `estabelecimentos`, `fichasTecnicas`, `pedidosCompra`, `transferencias`, `expenses`, `auditEvents`, entre outras. Migrations em `db/migrations/` (0000–0003).

## Como rodar localmente

Pré-requisito: Node.js + PostgreSQL.

```bash
npm install
cp .env.example .env     # ajuste DATABASE_URL
npm run db:push          # aplica o schema no banco (ou npm run db:migrate)
npm run seed             # cria admin padrão (opcional)
npm run dev              # servidor de desenvolvimento
```

Scripts disponíveis: `dev`, `build`, `start`, `lint`, `format`, `type-check`, `db:generate`, `db:migrate`, `db:push`, `db:studio`, `seed`.

## Variáveis de ambiente

Veja `.env.example`:

- `DATABASE_URL` — conexão PostgreSQL (obrigatório).
- `BETTER_AUTH_SECRET` — segredo do Better Auth (obrigatório; gere com `openssl rand -base64 32`).
- `BETTER_AUTH_URL` — URL pública da autenticação.
- `JWT_SECRET` — opcional; usado apenas se o fluxo de JWT manual for ativado.
- `NEXT_PUBLIC_APP_URL` — URL pública da aplicação.

## Estrutura

```
app/      # rotas do Next.js (páginas + API routes)
components/
db/       # Drizzle schema, conexão e migrations
lib/      # utilitários (auth, rate-limit, import-cols, encoding-fix, export-csv, audit, stock-calc, etc.)
types/
```

## Notas

- Testes automatizados: não localizados no repositório (`NÃO CONFIRMADO`).
- Deploy em produção: não verificado (`NÃO CONFIRMADO`).
- O repositório contém scripts e SQLs de apoio ao desenvolvimento na raiz (seed, testes de banco, variações de schema) — documentação de apoio, não fazem parte do runtime.