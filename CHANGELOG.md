# Changelog — BI & Inteligência + Sugestão de Compra

## [1.2.0] — 2026-06-21

### Alerta Sonoro para Notificações

#### Utilitário (`lib/sound.ts`)
- Web Audio API — nenhum arquivo de áudio externo
- `playBeep(volume)` — tom único 880Hz (200ms)
- `playAlert(volume)` — alerta 660→880→660Hz (300ms cada)
- `playCritical(volume)` — crítico 1000Hz × 4 (100ms) + 800Hz (200ms)
- Volume controlável (0–100, mapeado para ganho 0–1)

#### Integração no NotificationBell (`components/ui/notification-bell.tsx`)
- Toca som automaticamente em novas notificações críticas/alerta/vencimento
- Botão mute (`Volume2`/`VolumeX`) no dropdown, estado salvo em localStorage
- Som respeita configurações de sistema (tipo: beep/alarm/none, volume)

#### TypeScript
- `Volume2`, `VolumeX` adicionados a `types/lucide-react.d.ts`

---

### Sistema de Configurações Expandido

#### Definição Centralizada (`lib/settings.ts`)
- `DEFAULT_SETTINGS` — valores padrão para todas as chaves
- `SETTING_LABELS`, `SETTING_DESCRIPTIONS` — labels e descrições em PT-BR
- `SETTING_CATEGORIES` — mapeamento chave → categoria (notifications/stock/financial/system)
- `SETTING_TYPES` — tipo de cada chave (boolean/number/select/text)
- `SETTING_OPTIONS` — opções para campos do tipo select

#### Hook (`hooks/use-settings.ts`)
- `useSettings()` — carrega settings da API + fallback DEFAULT_SETTINGS
- Retorna `{ settings, loading, saving, save, reload }`
- `save(partial)` — PUT /api/settings com merge local otimista

#### API (`app/api/settings/route.ts`)
- `GET /api/settings` — retorna `{ ...DEFAULTS, ...DB_rows }` para todos
- `PUT /api/settings` — restrito a admin (role !== "admin" → 403)
- Aceita Partial — só atualiza chaves enviadas
- Respeita `SETTING_KEYS` para validar chaves

#### Página de Configurações (`app/app/configuracoes/page.tsx`)
- **Admin:**
  - 4 categorias em grid: Notificações, Estoque, Financeiro, Sistema
  - Cada categoria com seus campos (toggle boolean, select, number input)
  - Botão "Salvar Configurações" com loading state
  - Badge "ADMIN" no header
- **Empregado:**
  - Apenas Preferências Pessoais (alerta sonoro on/off + volume + testar som)
  - Tudo salvo em localStorage (não afeta outros usuários)
- InfoCard no rodapé explicando o escopo das configurações

#### Categorias de Configuração

| Categoria | Chaves | Descrição |
|---|---|---|
| **Notificações** | `alert_sound_enabled`, `alert_sound_type`, `alert_sound_volume`, `alert_low_stock_pct`, `alert_critical_stock_pct`, `alert_expiry_days`, `alert_notify_same_day`, `alert_notify_day_before`, `alert_check_interval` | Som, limites de estoque, vencimentos |
| **Estoque** | `stock_lead_time_days`, `stock_consumption_base_days`, `stock_safety_margin_pct` | Lead time, base de consumo, margem |
| **Financeiro** | `financial_cmv_target_min`, `financial_cmv_target_max`, `financial_closing_day` | Metas CMV, dia fechamento |
| **Sistema** | `system_dashboard_period` | Período padrão do dashboard |

#### Integração com Notificações
- API de notificações (`/api/notificacoes`) lê settings do DB para thresholds:
  - `alert_low_stock_pct` → multiplicador para estoque baixo (default: 1.5)
  - `alert_critical_stock_pct` → multiplicador para crítico (default: 1.0)
  - `alert_expiry_days` → dias antes do vencimento para alertar (default: 7)

---

## [1.1.0] — 2026-06-21

### Botões de Download CSV em Todas as Páginas com Dados

#### Utilitário Reutilizável (`lib/export-csv.ts`)
- `downloadCSV(filename, headers, rows)` — cria e baixa CSV com BOM (compatível Excel)
- `downloadJSON(filename, data)` — exporta dados como JSON

#### Páginas Atualizadas

| Página | Localização do Botão | Dados Exportados |
|---|---|---|
| **BI & Inteligência** (`/app/bi`) | Header, ao lado do título | Resumo, giro por categoria, CMV, perdas, custo vs preço, sazonalidade, budget, comparativo anual |
| **Sugestão de Compra** (`/app/bi/sugestao-compra`) | Header, ao lado do botão "Atualizar" | Tabela completa com itens, prioridades, custos |
| **Financeiro** (`/app/financeiro`) | Header, ao lado do botão "REGISTRAR GASTO" | Despesas: descrição, valor, data, categoria, status |
| **Dashboard / Tela Inicial** (`/app/dashboard`) | Header, ao lado do filtro de período | Todos os itens do estoque: categoria, nome, quantidade, mínimo, valor |
| **Relatórios** (`/app/relatorios`) | Já existente | (já implementado anteriormente) |

### Sistema de Notificações de Estoque Baixo

#### API (`app/api/notificacoes/route.ts`)
- `GET /api/notificacoes` — verifica itens com estoque baixo ou crítico
- Queries:
  - `estoque_estabelecimento` + `catalogItems` → itens com estoque ≤ 1.5× mínimo
  - Fallback para tabela legada `items` se a primeira query retornar vazia
- Classificação:
  - **Crítico** (gravidade 10): estoque atual ≤ estoque mínimo
  - **Alerta** (gravidade 5): estoque atual ≤ 1.5× estoque mínimo
- Ordenação: mais grave primeiro
- Resposta: `{ notificacoes[], total, criticos, alertas }`

#### Hook (`hooks/use-notificacoes.ts`)
- `useNotificacoes()` — hook client-side que:
  - Faz fetch inicial na montagem
  - Polling automático a cada 60 segundos
  - Retorna `{ data, loading, refetch }`

#### Componente (`components/ui/notification-bell.tsx`)
- `NotificationBell` — sino no canto superior direito:
  - Badge vermelho com contagem de notificações
  - Dropdown com cards de alerta (crítico em vermelho, alerta em amarelo)
  - Link direto para "Ver sugestão de compra →"
  - Fecha ao clicar fora
  - Estado vazio: "Nenhuma notificação"

#### Integração no Layout (`app/app/layout.tsx`)
- Sino de notificações posicionado ao lado do toggle de tema (topo direito)
- Importado via `dynamic()` com `ssr: false` para não impactar carregamento

### TypeScript
- `Info` adicionado a `types/lucide-react.d.ts`

---

## [1.0.0] — 2026-06-21

### Módulo: BI & Inteligência (`/app/bi`)

#### Página Principal (`app/app/bi/page.tsx`)
Dashboard completo com 12 visualizações em português:

| # | Card/Gráfico | Tipo | Descrição |
|---|---|---|---|
| 1 | **Saúde do Negócio** | KPI Card + Sparkline | Score composto 0–100 (giro 50% + margem 30% + perda 20%) |
| 2 | **Giro Médio** | KPI Card + Sparkline | Rotatividade média do estoque |
| 3 | **CMV Médio** | KPI Card + Sparkline | Custo da Mercadoria Vendida (%) |
| 4 | **Perda Total** | KPI Card + Sparkline | Soma de todas as perdas em R$ |
| 5 | **Saúde do Negócio** | GaugeChart | Indicador visual circular 0–100 + barras de Giro/Margem/Perda |
| 6 | **Giro de Estoque** | BarChart horizontal | Giro por categoria |
| 7 | **Dias de Estoque (DIO)** | BarChart horizontal | Dias em estoque por categoria |
| 8 | **Perda por Tipo** | DonutChart | Vencimento / Preparo / Sobra / Quebra |
| 9 | **CMV** | ComposedChart (barras + linha) | CMV mensal com linha meta de 32% |
| 10 | **Custo vs. Preço** | ScatterChart | Cada ponto = um prato do cardápio |
| 11 | **Gargalos do Estoque** | BarChart empilhado | Itens 30+ / 60+ dias parados por categoria |
| 12 | **Sazonalidade** | BarChart vertical | Consumo por dia da semana |
| 13 | **Previsto vs. Real** | BarChart agrupado | Budget mensal (previsto x real) |
| 14 | **Comparativo Anual** | AreaChart | Receita: ano atual vs. anterior |
| 15 | **Previsão de Estoque** | AreaChart | Projeção de 14 dias |
| 16 | **Indicadores por Categoria** | Tabela | Giro, DIO, cobertura (ótima/média/baixa), score com barra |

**Estilo:** NeuCard com fundo escuro (`#0f1929`), glassmorphism, bordas sutis.

#### API Principal (`app/api/bi/route.ts`)
- `GET /api/bi` — consolidado de BI
- Queries reais (drizzle ORM) nas tabelas:
  - `estoque_estabelecimento` → estoque atual e capital
  - `movimentacoes_estoque` (tipo OUT, 30d) → consumo/giro
  - `registros_producao` + `fichas_tecnicas` + `itens_cardapio` → CMV e custo-vs-preço
  - `registros_perda` (group by `tipoPerda`) → perda por tipo
  - `movimentacoes_estoque` + `estoque_estabelecimento` → gargalos
  - `registros_producao` (extract dow) → sazonalidade
  - `expenses` (group by mês) → budget vs real
- Fallback automático com dados mock (simula 6 categorias, dados realistas)
- Health Score composto: giro (50%) + margem (30%) + perda (20%)
- Resposta tipada `BiResponse`
- Cache: não (chamada sob demanda)

---

### Módulo: Sugestão de Compra (`/app/bi/sugestao-compra`)

#### Página (`app/app/bi/sugestao-compra/page.tsx`)
- **Header** com botão "Atualizar" e link de volta ao BI
- **4 Summary Cards:** Itens para Comprar, Custo Total Estimado, Prioridade Alta, Selecionado
- **Ações em massa:** "Selecionar Todos" + "Aprovar N Itens" (com checkbox por linha)
- **Tabela sortável** com colunas:
  - Checkbox → Item (nome + estoque mínimo) → Categoria → Estoque atual → Consumo/dia → Dias restantes → Qtd. sugerida → Custo estimado → Prioridade (alta/média/baixa com badge colorido)
- **Badge de prioridade:**
  - 🔴 Alta (estoque ≤ mínimo OU dias ≤ 7)
  - 🟡 Média (dias ≤ 14)
  - 🟢 Baixa (demais)
- **Footer:** timestamp de geração, lead time 7d, consumo base 30d
- **Estado vazio:** "Nenhum item precisa de reposição"

#### API (`app/api/bi/sugestao-compra/route.ts`)
- `GET /api/bi/sugestao-compra`
- Queries reais (drizzle ORM):
  - `estoque_estabelecimento` (INNER JOIN `catalogItems`) → estoque atual + mínimo + custo médio
  - `movimentacoes_estoque` (tipo OUT, 30d, GROUP BY catalogItemId) → consumo médio diário
- Algoritmo:
  1. Consumo médio diário = total OUT (30d) / 30
  2. Dias até faltar = estoque atual / consumo médio diário
  3. Estoque de segurança = max(estoque mínimo, consumo × leadDays)
  4. Qtd. sugerida = ceil((consumo × leadDays) − estoque + segurança × 0.2)
  5. Só sugere se qtd > 0 OU dias até faltar ≤ 14
- Ordenação: prioridade (alta → media → baixa) → dias até faltar (crescente)
- Fallback: 6 itens mock realistas (Filé Mignon, Tomate Pelado, Mussarela, Coca-Cola, Óleo, Detergente)
- Resposta tipada `SugestaoResponse`
- Cache: não (chamada sob demanda)

---

### Sidebar (`app/app/layout.tsx`)

- **Novos ícones importados:** `BrainCircuit` + `ShoppingBag`
- **Novos itens de navegação:**
  - `/app/bi` — "BI & Inteligência" (adminOnly: true) — ícone `BrainCircuit`
  - `/app/bi/sugestao-compra` — "Sugestão de Compra" (adminOnly: false) — ícone `ShoppingBag`
- Posição: entre Financeiro e Importar

---

### TypeScript (`types/lucide-react.d.ts`)

**7 novas declarações de ícones lucide-react adicionadas:**

| Ícone | Uso |
|---|---|
| `BrainCircuit` | Nav BI + página BI (ícone principal) |
| `CalendarDays` | DIO chart + Sazonalidade |
| `PiggyBank` | CMV chart + Budget |
| `LineChart` | Comparativo Anual + Previsão |
| `Flame` | Perda Total KPI |
| `ChartLine` | (reserva) |
| `ChartBar` | (reserva) |
| `ShoppingBag` | Nav Sugestão de Compra + página |

---

### Estrutura de Arquivos

```
app/api/bi/
├── route.ts                    # GET /api/bi — BI consolidado (381 linhas)
└── sugestao-compra/
    └── route.ts                # GET /api/bi/sugestao-compra (153 linhas)

app/app/bi/
├── page.tsx                    # Dashboard BI (644 linhas)
├── page.tsx.backup             # Backup anterior
└── sugestao-compra/
    └── page.tsx                # Sugestão de Compra (302 linhas)

app/app/layout.tsx              # Sidebar com nav items (266 linhas)

types/lucide-react.d.ts         # Declarações de tipos lucide-react (100 linhas)
```

---

### Regras de Negócio

1. **CMV é a métrica #1** — gráfico central maior que os demais (ComposedChart com linha meta 28–35%)
2. **Health Score** ponderado: 50% giro + 30% margem + 20% perda
3. **Sugestão de Compra** só exibe itens que precisam de reposição (qtd sugerida > 0 ou dias até faltar ≤ 14)
4. **Fallback automático** em todas as queries — se DB vazio, dados mock realistas garantem UI funcional
5. **Idioma:** 100% português brasileiro (labels, tooltips, placeholders)
6. **Formato monetário:** `pt-BR` (R$ 1.234,56)
7. **Zero erros TypeScript** (`npx tsc --noEmit` exit 0)
8. **Lead time padrão:** 7 dias para sugestão de compra

---

### Próximos Passos Sugeridos

- [ ] Integrar botão "Aprovar" com criação de pedido de compra via `pedidosCompra`
- [ ] Adicionar filtros por categoria/estabelecimento na Sugestão de Compra
- [ ] Exportar relatórios como PDF (usando biblioteca como jsPDF)
- [ ] Notificações por e-mail/whatsapp para estoque crítico
- [ ] Histórico de acerto das sugestões (taxa de aprovação)
- [ ] Badge animado piscando no sino quando houver notificação crítica
- [ ] Central de notificações com histórico e "marcar como lida"
- [ ] Notificações por e-mail/whatsapp para estoque crítico
- [ ] Integrar botão "Aprovar" com criação de pedido de compra via `pedidosCompra`
- [ ] Filtros por categoria/estabelecimento na Sugestão de Compra
- [ ] Logs de auditoria para alterações de configurações
