# DO ZERO AO VENDÁVEL — PLAYBOOK OFICIAL

## 1) Objetivo
Este documento registra, do zero ao estado vendável, as decisões técnicas, correções aplicadas, validações executadas e checklist de operação para este SaaS de gerenciamento de estoque para restaurantes e bares.

---

## 2) Estado inicial encontrado
- Projeto com stack moderna (Next.js 16, React 19, TypeScript, Drizzle, PostgreSQL).
- Módulos de negócio já implementados (estoque, financeiro, BI, transferências, fichas técnicas, usuários etc.).
- Build inicialmente bloqueado por:
  - uso de `useSearchParams()` sem `Suspense` em `/auth/activate`
  - coexistência de `middleware.ts` e `proxy.ts` (erro no Next 16)
- Warnings CSS por seletores arbitrários inválidos em `app/globals.css`.

---

## 3) Correções aplicadas (ordem cronológica)

### 3.1 Correção de build blocker em /auth/activate
**Arquivo:** `app/auth/activate/page.tsx`

**Problema:**
`useSearchParams()` em componente client sem boundary apropriado em cenário de prerender.

**Solução aplicada:**
- Estrutura com `Suspense` para o conteúdo que usa `useSearchParams`.
- Ajustes de acessibilidade no formulário (`label htmlFor` e `input id`).

**Impacto:**
- Remove erro de prerender da rota `/auth/activate`.
- Melhora conformidade de acessibilidade.

---

### 3.2 Migração para convenção Next 16 (`proxy.ts`)
**Arquivo criado:** `proxy.ts`
**Arquivo legado:** `middleware.ts` renomeado para `middleware.legacy.ts`

**Problema:**
Next 16 não aceita `middleware.ts` e `proxy.ts` simultaneamente.

**Solução aplicada:**
- Implementado controle central em `proxy.ts`:
  - rotas públicas x privadas
  - bloqueio de API sem sessão (`401`)
  - redirecionamento para login com `redirect`
  - rate limiting por IP

**Impacto:**
- Compatível com convenção atual.
- Evita regressão de segurança por rota desprotegida.

---

### 3.3 Limpeza de warnings CSS
**Arquivo:** `app/globals.css`

**Problema:**
Warnings do otimizador CSS por seletores inválidos:
- `.text-[#0f172a]`
- `.text-[#64748b]`
- `.bg-[#f8fafc]`
- `.border-[#e2e8f0]` em escopo `.dark`

**Solução aplicada:**
- Mantidos seletores estáveis (`.text-slate-900`, `.text-slate-600`, `.bg-slate-50`, `.border-slate-200`) e removidas entradas inválidas.

**Impacto:**
- Build mais limpo.
- Menor risco de comportamento inconsistente de tema.

---

## 4) Testes executados e evidências

### 4.1 Build/Type
- `npm run type-check` → sem erro aparente.
- `npm run build` → **SUCESSO** (compilação, typecheck, geração estática, otimização final).

### 4.2 API (via curl, sem sessão)
- `GET /api/auth/me` → `401` (correto)
- `GET /api/business-advice` → `401` (correto)
- `POST /api/import-detect` → `401` (correto)

**Conclusão parcial:**
As rotas críticas testadas sem autenticação não estão abertas publicamente.

---

## 5) O que já está vendável hoje
- Aplicação compila e builda com sucesso.
- Fluxo de autenticação principal está operacional no nível técnico.
- Módulos principais já existem e são comercialmente demonstráveis.
- Proteção base de APIs sensíveis validada sem sessão.

---

## 6) O que ainda falta para “vendável perfeito” (produção com baixa fricção)

### 6.1 Testes de cobertura total (ainda pendentes)
- Backend completo: todos endpoints e edge cases com/sem sessão.
- Frontend completo: navegação e interação em todas telas principais.
- Testes de permissões por perfil (admin, gerente, funcionário etc.).

### 6.2 Operação SaaS
- Política de backup/restauração formal.
- Monitoramento e alertas (erros de produção, latência, falhas de job).
- Checklist de onboarding comercial replicável.

### 6.3 Comercial e jurídico mínimo
- Termos de uso e política de privacidade/LGPD publicados.
- Fluxo de suporte/SLA definido.
- Proposta comercial padrão e contrato piloto.

---

## 7) Plano de execução até venda (modelo enxuto)

### Dia 1
- Smoke test funcional completo (auth + dashboard + módulos-chave).
- Corrigir bugs críticos encontrados.

### Dia 2
- Validação de permissões e edge cases API.
- Ajustes de UX que geram confiança na demo.

### Dia 3
- Preparar ambiente de produção e monitoramento básico.
- Fechar documentação comercial e onboarding.

### Dia 4 (venda)
- Rodar demo guiada com cliente piloto.
- Fechar contrato inicial (implantação assistida).

---

## 8) Checklist final de “Go Live”
- [x] Build de produção aprovado
- [x] Rota crítica `/auth/activate` corrigida para Next 16
- [x] Convenção `proxy.ts` aplicada
- [x] Rotas críticas sem sessão retornando 401
- [ ] Testes completos de todos endpoints (happy/error/edge)
- [ ] Testes completos de toda UI (fluxo integral)
- [ ] LGPD/Termos publicados
- [ ] Processo de suporte e operação definido

---

## 9) Padrão replicável para futuros SaaS/IA
1. **Nunca vender sem build de produção verde.**
2. **Fechar superfícies de ataque primeiro (auth/permissions/rate limit).**
3. **Corrigir blockers estruturais antes de UI cosmética.**
4. **Registrar tudo em documentação executiva + técnica.**
5. **Vender primeiro como piloto assistido, escalar depois de hardening.**

---

## 10) Resumo executivo
O sistema está em estado **vendável assistido** (piloto pago) com boa base técnica e valor real para o nicho.
Para estado “vendável sem quebrar” em escala, o próximo passo obrigatório é completar a bateria de testes full-stack e finalizar operação/jurídico mínimo.

Documento criado para continuidade por equipes humanas e outras IAs, com trilha clara de evolução do zero ao vendável.
