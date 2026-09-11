# TODO — Rumo ao Vendável (até sexta)

## Fase 1: Bloqueio de build imediato
- [x] Corrigir `app/auth/activate/page.tsx` para compatibilidade Next 16 (`useSearchParams` com Suspense)
- [x] Ajustar acessibilidade dos campos do formulário (associar `label` com `input`)
- [x] Rodar `npm run build` e confirmar sucesso

## Fase 2: Testes críticos (caminho de venda)
- [~] Validar autenticação: login, cadastro, ativação, redefinição forçada, me, logout (parcial: `me` sem sessão validado)
- [ ] Validar fluxo do app: dashboard, gestão, financeiro, BI, perfil
- [~] Validar rotas sensíveis com sessão/autorização (parcial: `business-advice` e `import-detect` sem sessão validados)

## Fase 3: Documentação final vendável
- [ ] Criar documento mestre “Do zero ao vendável” com:
  - [ ] O que foi corrigido
  - [ ] Lista de verificação de produção
  - [ ] Estratégia de venda assistida
  - [ ] Padrão reutilizável para futuros SaaS/IA
