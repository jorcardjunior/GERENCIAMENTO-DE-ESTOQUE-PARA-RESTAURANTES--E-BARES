Você é um desenvolvedor sênior especializado em criar MVPs modernos, performáticos e com excelente experiência do usuário para o mercado de food service em 2026.

Vamos construir o MVP de um sistema de controle de estoque para restaurantes utilizando tecnologias atuais e modernas.

**Stack Tecnológica (implementada):**

- **Framework**: TanStack Start (SSR) + TypeScript + React 19
- **Estilização**: Tailwind CSS 4 + shadcn/ui (componentes) + Framer Motion (animações)
- **Banco de Dados**: PostgreSQL via Supabase (integração direta com Supabase JS client)
- **Autenticação**: Supabase Auth (email/senha + triggers p/ criação automática de profiles)
- **Gerenciamento de Estado e Dados**: TanStack Query v5
- **Roteamento e Navegação**: TanStack Router (file-based, com layouts protegidos)
- **Notificações e Feedback**: Sonner (toasts)
- **Ícones**: Lucide React
- **Datas**: date-fns + locale ptBR

**Objetivo do Produto:**
Criar uma aplicação web moderna, rápida e visualmente profissional, que transmita seriedade e tecnologia para donos de restaurantes. O design deve ser limpo, com boa tipografia, cores sóbrias e componentes bem acabados.

**Tipos de Usuário:**
- Admin: acesso completo ao sistema
- Staff: acesso restrito à tela de preenchimento de estoque

**Usuários de teste (seed):**
- admin@gmail.com / Ky7#mP9xL2$wQ8 → tipo Admin
- staff@gmail.com / Gt4&nR7kZ1!vB9 → tipo Staff

**Telas do MVP (implementadas):**

1. **Tela de Login** (`/auth/login`)
   - Interface limpa e moderna com foto de restaurante + overlay gradiente.
   - Login com email e senha via Supabase Auth.
   - Botão "Criar Contas de Teste" para seed automático de admin + staff.
   - Links para cadastro e hints de contas de teste.
   - Loading state no botão, erros via Sonner toast.

2. **Tela de Gestão de Estoque** (`/app/gestao`) — Admin
   - Categorias como cabeçalhos colapsáveis com tabelas de itens.
   - Botão "Carregar Padrão" — seed de 20 categorias + ~380 itens.
   - Criar/remover categorias e itens via dialogs.
   - Colunas extras por categoria (texto/número/data) via botão ⚙️.
   - Cada categoria mostra: nome, total de itens, quem criou e quando.
   - Colunas padrão: Produto, Unidade, Est. Mínimo, Qtd Atual, Data Contagem, Validade, Responsável.
   - Filtro por busca (nome do produto).
   - Alertas visuais: linha vermelha se validade ≤ 1 dia, célula amarela se estoque < mínimo.
   - Admin vê coluna de ações (excluir item).

3. **Tela de Preenchimento de Estoque** (`/app/preenchimento`) — Admin + Staff
   - Foco em velocidade: TAB/Enter/Shift+Tab para navegar entre células.
   - Filtro por categoria + campo de busca de produto.
   - Tabela editável: Quantidade (number input) e Validade (date input).
   - Colunas extras também editáveis com TAB nav.
   - Alertas visuais (amarelo/vermelho) iguais à gestão.
   - Responsável preenchido automaticamente pelo usuário logado.
   - Botão "Salvar" + "Descartar" fixos no topo.
   - Após salvar, exibe banner de resumo com total de itens alterados.

4. **Tela de Gerenciar Usuários** (`/app/usuarios`) — Admin
   - Página existente herdada (admin/users list + add form).
   - Acesso restrito a admin.

**Estrutura de Banco de Dados (Supabase / PostgreSQL):**

Tabelas principais existentes:
- `profiles` (id, name, email, role, status, avatar_url, created_at)
- `categories` (id, name, description, user_id, created_at, updated_at)
- `catalog_items` (id, name, category_id, unit_default, track_expiry, thresholds)
- `inventory_items` (id, catalog_item_id, category_id, name, unit, current_stock, min_stock, custom_fields JSONB, updated_at, user_id)
- `item_batches` (id, inventory_item_id, expires_at, qty_current, batch_code)
- `custom_columns` (id, category_id, name, type, display_order) — criado via migration manual
- `stock_movements` (movimentações auditáveis)
- `suppliers` (fornecedores)
- `audit_events` (eventos de auditoria)

Triggers:
- `on_auth_user_created` → `handle_new_user()`: cria profile automaticamente no signup
- `on_profile_created_assign_role`: ajusta role baseado no email

Seed disponível:
- `sql_seed_completo.sql`: 20 categorias + ~380 itens
- Botão "Carregar Padrão" na UI faz seed via cliente autenticado

**Requisitos Técnicos (atendidos):**

- Aplicação 100% responsiva com experiência touch-friendly (inputs altos, h-12).
- SSR via TanStack Start + Vite.
- Tipagem forte com tipos gerados do Supabase.
- Navegação protegida: `/app` redireciona para `/auth/login` se não autenticado.
- Admin vê tudo; Staff vê apenas Preenchimento (não vê botões de ação em Gestão).
- RLS pode ser configurado no Supabase para proteção adicional.

**Arquivos Relevantes:**
- `src/routes/auth/login.tsx` — Login
- `src/routes/auth/register.tsx` — Cadastro
- `src/routes/app/gestao.tsx` — Gestão de Estoque
- `src/routes/app/preenchimento.tsx` — Preenchimento
- `src/routes/app/usuarios.tsx` — Usuários (admin)
- `src/data/seed-padrao.ts` — Dados de seed para UI
- `sql_seed_completo.sql` — Seed SQL para execução manual
- `sql_colunas_custom.sql` — Migration para colunas personalizadas

**Comandos:**
- `npm run dev` — Inicia servidor de desenvolvimento
- `npx tsc --noEmit` — Type check
- `npm run build` — Build de produção
