export const SISTEMA_KB: Record<string, { titulo: string; descricao: string; dicas: string[] }> = {
  dashboard: {
    titulo: "Tela Inicial (Dashboard)",
    descricao: "Visão geral do negócio com alertas, gráficos e atalhos.",
    dicas: [
      "Card de AI Insights mostra alertas proativos sobre itens críticos.",
      "Gráfico de fluxo por categoria mostra distribuição dos itens.",
      "Card de Status Geral mostra saúde do estoque (saudável/crítico/vencendo).",
      "Alertas Críticos lista itens que precisam de atenção imediata.",
      "Use CMD+K para abrir a paleta de comandos rápidos.",
    ],
  },
  gestao: {
    titulo: "Gestão de Estoque",
    descricao: "Cadastro e gerenciamento de todos os itens do estoque.",
    dicas: [
      "Cadastre itens com categoria, unidade, estoque mínimo e quantidade atual.",
      "Defina preço unitário para calcular capital parado em estoque.",
      "Configure data de validade para receber alertas de vencimento.",
      "Use as sugestões inteligentes ao digitar o nome do item.",
      "Organize por categorias para facilitar a busca.",
    ],
  },
  estabelecimentos: {
    titulo: "Estabelecimentos",
    descricao: "Gerencie múltiplas unidades separadamente.",
    dicas: [
      "Cadastre cada filial/unidade como um estabelecimento diferente.",
      "Atribua colaboradores a cada estabelecimento com cargos específicos.",
      "Monitore o status (ativo/inativo/fechado) de cada unidade.",
      "Configure logotipo e dados de contato por unidade.",
    ],
  },
  "fichas-tecnicas": {
    titulo: "Fichas Técnicas",
    descricao: "Receitas detalhadas com custos e modo de preparo.",
    dicas: [
      "Registre cada prato com ingredientes, quantidades e custos.",
      "O sistema calcula automaticamente o custo total da receita.",
      "Defina preço sugerido com base no custo + margem desejada.",
      "Vincule insumos ao estoque para baixa automática ao produzir.",
      "Use sub-receitas para preparos complexos (molhos, massas).",
    ],
  },
  "pedidos-compra": {
    titulo: "Pedidos de Compra",
    descricao: "Gestão de compras e reposição de estoque.",
    dicas: [
      "Crie pedidos com itens, quantidades e valores unitários.",
      "Acompanhe o status: rascunho → enviado → recebido parcial → recebido.",
      "Registre o recebimento parcial para controle de entregas.",
      "Histórico de preços ajuda a negociar com fornecedores.",
      "Valor total do pedido é calculado automaticamente.",
    ],
  },
  financeiro: {
    titulo: "Financeiro",
    descricao: "Controle de receitas, despesas e saúde financeira.",
    dicas: [
      "Registre todas as despesas fixas (aluguel, salários) e variáveis (insumos).",
      "Acompanhe o fluxo de caixa diário, semanal e mensal.",
      "Categorize gastos para análise posterior.",
      "Visualize gráficos de balanço mensal.",
      "Exporte relatórios para contabilidade.",
    ],
  },
  relatorios: {
    titulo: "Relatórios e Análises",
    descricao: "Indicadores de desempenho e inteligência de negócio.",
    dicas: [
      "Acompanhe capital parado em estoque (valor total dos itens).",
      "Identifique itens com estoque baixo e próximo do vencimento.",
      "Veja distribuição por categoria para análise de mix.",
      "Use os insights para planejar compras e reduzir desperdícios.",
      "Relatório de perdas ajuda a identificar onde está perdendo dinheiro.",
    ],
  },
  usuarios: {
    titulo: "Usuários e Permissões",
    descricao: "Controle de acesso da equipe ao sistema.",
    dicas: [
      "Cadastre cada colaborador com email e senha individuais.",
      "Atribua cargos: admin, gerente, chef, bartender, garçom, estoquista.",
      "Administradores têm acesso total; colaboradores têm acesso limitado.",
      "Monitore quem está ativo na equipe.",
      "Cada usuário tem seu próprio perfil e histórico de ações.",
    ],
  },
  importar: {
    titulo: "Importação Inteligente",
    descricao: "Importe dados de arquivos CSV ou Excel com mapeamento automático por IA.",
    dicas: [
      "Arraste arquivos CSV, XLSX ou XLS para importar itens em massa.",
      "A IA detecta automaticamente o significado de cada coluna do arquivo.",
      "Você pode ajustar o mapeamento antes de confirmar a importação.",
      "O sistema valida duplicatas, linhas incompletas e estima o valor total antes de importar.",
      "A importação é processada em lotes de 100 itens com barra de progresso em tempo real.",
      "É possível desfazer a importação após concluída, removendo todos os itens criados.",
      "Suporta os módulos: Itens, Fichas Técnicas e Fornecedores.",
    ],
  },
  transferencias: {
    titulo: "Transferências entre Unidades",
    descricao: "Movimentação de estoque entre estabelecimentos ou filiais.",
    dicas: [
      "Transfira itens de um estabelecimento para outro com poucos cliques.",
      "Acompanhe o status: rascunho → enviado → recebido.",
      "Registre o recebimento parcial para controle de remessas.",
      "Consulte o histórico completo de transferências realizadas.",
      "Cada transferência registra origem, destino, data e responsável.",
      "Itens transferidos são baixados automaticamente do estoque de origem.",
    ],
  },
  bi: {
    titulo: "Indicadores (BI)",
    descricao: "Business Intelligence com gráficos, métricas e análises avançadas.",
    dicas: [
      "Visualize giro de estoque, CMV, perdas e saúde geral do negócio.",
      "Acompanhe custo vs preço de venda de cada prato do cardápio.",
      "Identifique gargalos: itens parados há 30 ou 60 dias.",
      "Analise sazonalidade: consumo por dia da semana.",
      "Compare orçado vs realizado mês a mês.",
      "Veja projeção de estoque para os próximos 14 dias.",
      "HealthScore calcula a saúde geral do seu negócio em tempo real.",
    ],
  },
  "sugestao-compra": {
    titulo: "Sugestão de Compra",
    descricao: "Recomendações inteligentes de compra baseadas no consumo histórico.",
    dicas: [
      "O sistema analisa o consumo dos últimos 30 dias para sugerir compras.",
      "Considera estoque atual, mínimo e ponto de ressuprimento.",
      "Sugere quantidades ideais para cada item.",
      "Exibe fornecedores sugeridos para cada insumo.",
      "Você pode gerar pedidos de compra diretamente das sugestões.",
    ],
  },
  preenchimento: {
    titulo: "Preenchimento de Estoque",
    descricao: "Registro rápido de inventário e contagem de itens.",
    dicas: [
      "Faça a contagem física dos itens diretamente no sistema.",
      "Registre ajustes de estoque de forma simplificada.",
      "Identifique divergências entre estoque teórico e real.",
      "Ideal para inventários periódicos e fechamento de caixa.",
    ],
  },
  configuracoes: {
    titulo: "Configurações do Sistema",
    descricao: "Preferências gerais da conta e personalização.",
    dicas: [
      "Configure sons de alerta (ativado/desativado, tipo, volume).",
      "Ajuste o tema do sistema (claro, escuro ou automático).",
      "Personalize o idioma (futuramente: suporte a inglês).",
      "Configurações são salvas automaticamente e sincronizadas.",
    ],
  },
  profile: {
    titulo: "Meu Perfil",
    descricao: "Visualize e gerencie suas informações pessoais.",
    dicas: [
      "Veja seu nome, email e cargo no sistema.",
      "Informações de empresa vinculada à sua conta.",
      "Acesse configurações de conta e segurança.",
    ],
  },
  fornecedores: {
    titulo: "Fornecedores",
    descricao: "Cadastro e gestão de fornecedores de insumos.",
    dicas: [
      "Cadastre fornecedores com nome, contato e CNPJ.",
      "Associe itens a fornecedores preferenciais.",
      "Consulte histórico de preços por fornecedor.",
      "Facilita a criação de pedidos de compra.",
    ],
  },
  notificacoes: {
    titulo: "Notificações e Alertas",
    descricao: "Central de notificações com alertas de estoque, vencimento e itens críticos.",
    dicas: [
      "Receba alertas de itens com estoque baixo ou crítico.",
      "Notificações de vencimento próximo de insumos.",
      "Sons configuráveis para cada tipo de alerta.",
      "Acesse a sugestão de compra diretamente da notificação.",
      "Ícone de sino no topo mostra total de alertas pendentes.",
    ],
  },
};

export const ESPECIALISTAS = [
  { frase: "O que nao e medido nao e gerenciado.", area: "Gestao Estrategica" },
  {
    frase: "A vantagem competitiva nao esta na imitacao, mas na diferenciacao.",
    area: "Estrategia Competitiva",
  },
  {
    frase: "Nao se gerencia o que nao se controla, nao se controla o que nao se mede.",
    area: "Qualidade Total",
  },
  {
    frase: "Elimine o desperdicio. O lucro vem da reducao de custos, nao do aumento de precos.",
    area: "Producao Enxuta",
  },
  { frase: "O que voce mede e o que voce consegue gerenciar.", area: "Gestao de Desempenho" },
  {
    frase: "Gestao e, acima de tudo, uma pratica, onde arte, ciencia e oficio se encontram.",
    area: "Organizacao Empresarial",
  },
  {
    frase: "O marketing e a arte de criar valor genuino para o cliente.",
    area: "Marketing e Vendas",
  },
  {
    frase: "Comece com o objetivo em mente. Lideranca e definir o que importa.",
    area: "Lideranca",
  },
  {
    frase: "Empresas visionarias constroem mecanismos, nao seguidores de lideres carismaticos.",
    area: "Excelencia Empresarial",
  },
  { frase: "Trabalhe EM seu negocio, nao DENTRO do seu negocio.", area: "Empreendedorismo" },
];
