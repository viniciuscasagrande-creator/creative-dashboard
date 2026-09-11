/**
 * ==========================================================================
 * FASE 28.15.2 — MAPA CANÔNICO DE ROTAS E ALIASES (src/navigation/routes.js)
 * Enriquecido com data-menu-key, grupos de menu e resolução contábil
 * ==========================================================================
 */

export const ROUTES = {
  // Painel Geral
  '/dashboard': {
    path: '/dashboard',
    view: 'dashboard-main',
    module: 'dashboard',
    menuKey: 'dashboard-main',
    title: 'Painel Geral',
    sub: 'Métricas operacionais consolidadas e resumo de vendas.'
  },
  '/agenda': {
    path: '/agenda',
    view: 'dashboard-agenda',
    module: 'dashboard',
    menuKey: 'dashboard-agenda',
    title: 'Agenda de Eventos',
    sub: 'Calendário e programação de eventos da plataforma.'
  },
  '/indicadores': {
    path: '/indicadores',
    view: 'dashboard-indicators',
    module: 'dashboard',
    menuKey: 'dashboard-indicators',
    title: 'Indicadores de Performance',
    sub: 'Metas e indicadores consolidados de bilheteria.'
  },

  // Eventos
  '/eventos': {
    path: '/eventos',
    view: 'events-list',
    module: 'eventos',
    menuKey: 'events-list-root',
    title: 'Todos os Eventos',
    sub: 'Gestão, acompanhamento e status em tempo real de eventos.'
  },
  '/eventos/novo': {
    path: '/eventos/novo',
    view: 'events-new',
    module: 'eventos',
    menuKey: 'events-new',
    title: 'Novo Evento',
    sub: 'Cadastro e configuração de eventos, lotes e ingressos.'
  },
  '/eventos/lotes': {
    path: '/eventos/lotes',
    view: 'events-lotes',
    module: 'eventos',
    menuKey: 'events-lotes',
    title: 'Lotes de Ingressos',
    sub: 'Gestão de lotes, disponibilidade e precificação.'
  },
  '/eventos/cupons': {
    path: '/eventos/cupons',
    view: 'events-cupons',
    module: 'eventos',
    menuKey: 'events-cupons',
    title: 'Cupons de Desconto',
    sub: 'Criação e gestão de cupons promocionais para eventos.'
  },
  '/eventos/checkin': {
    path: '/eventos/checkin',
    view: 'events-checkin',
    module: 'eventos',
    menuKey: 'events-checkin',
    title: 'Validador de Portaria',
    sub: 'Controle de acesso e leitura de ingressos na portaria.'
  },
  '/eventos/participantes': {
    path: '/eventos/participantes',
    view: 'events-attendees',
    module: 'eventos',
    menuKey: 'events-attendees',
    title: 'Lista de Participantes',
    sub: 'Lista consolidada de compradores e participantes.'
  },
  '/eventos/pagina': {
    path: '/eventos/pagina',
    view: 'events-page',
    module: 'eventos',
    menuKey: 'events-page',
    title: 'Página do Evento',
    sub: 'Link público de vendas e QR Code de divulgação.'
  },
  '/consulta-ingressos': {
    path: '/consulta-ingressos',
    view: 'global-consult-ticket',
    module: 'eventos',
    menuKey: 'global-consult-ticket',
    title: 'Consulta de Ingressos',
    sub: 'Busca unificada por pedido, código, CPF ou comprador.'
  },

  // Financeiro
  '/financeiro/dashboard': {
    path: '/financeiro/dashboard',
    view: 'financial-dashboard',
    module: 'financeiro',
    menuKey: 'financial-dashboard',
    title: 'Painel Financeiro',
    sub: 'Resumo financeiro, conciliação e fluxo de caixa.'
  },
  '/financeiro/gestao-saldos': {
    path: '/financeiro/gestao-saldos',
    view: 'financial-event-transfers',
    module: 'financeiro',
    menuKey: 'financial-event-transfers',
    title: 'Gestão de Saldos & Transferência entre Eventos',
    sub: 'Painel consolidado, saldos disponíveis reais por evento e transferência atômica.'
  },
  '/financeiro/agenda': {
    path: '/financeiro/agenda',
    view: 'financial-event-transfers',
    module: 'financeiro',
    tab: 'schedule',
    menuKey: 'financial-event-transfers',
    title: 'Agenda Financeira & Lotes',
    sub: 'Agendamentos de repasses, lotes homologados e liquidação bancária.'
  },
  '/financeiro/tesouraria': {
    path: '/financeiro/tesouraria',
    view: 'treasury',
    module: 'financeiro',
    menuKey: 'treasury',
    title: 'Tesouraria Operacional & Bancos',
    sub: 'Gestão de contas, pagamentos PIX, remessa e retorno bancário CNAB 240.'
  },
  '/financeiro/saldo': {
    path: '/financeiro/saldo',
    view: 'financial-balance',
    module: 'financeiro',
    title: 'Conta Financeira',
    sub: 'Saldo disponível, bloqueado e visão bancária.'
  },
  '/financeiro/repasses': {
    path: '/financeiro/repasses',
    view: 'financial-repass',
    module: 'financeiro',
    title: 'Contas a Receber & Repasses',
    sub: 'Repasses a produtores, histórico e controle de depósitos.'
  },
  '/financeiro/antecipacoes': {
    path: '/financeiro/antecipacoes',
    view: 'financial-advance',
    module: 'financeiro',
    title: 'Antecipações',
    sub: 'Solicitações de antecipação de recebíveis.'
  },
  '/financeiro/despesas': {
    path: '/financeiro/despesas',
    view: 'financial-expenses',
    module: 'financeiro',
    title: 'Contas a Pagar',
    sub: 'Contas pendentes, pagas e agendadas.'
  },
  '/financeiro/fluxo-caixa': {
    path: '/financeiro/fluxo-caixa',
    view: 'cashflow-performance',
    module: 'financeiro',
    menuKey: 'fin-cashflow-performance',
    title: 'Fluxo de Caixa Financeiro',
    sub: 'Projeção e controle consolidado de entradas e saídas.'
  },
  '/financeiro/dre-evento': {
    path: '/financeiro/dre-evento',
    view: 'cashflow-dre',
    module: 'financeiro',
    menuKey: 'fin-cashflow-dre',
    title: 'DRE do Evento',
    sub: 'Demonstrativo de resultado gerencial por evento.'
  },
  '/financeiro/extrato': {
    path: '/financeiro/extrato',
    view: 'financial-statement',
    module: 'financeiro',
    title: 'Extrato Detalhado',
    sub: 'Extrato consolidado de movimentações financeiras.'
  },
  '/financeiro/contas-bancarias': {
    path: '/financeiro/contas-bancarias',
    view: 'financial-accounts',
    module: 'financeiro',
    title: 'Contas Bancárias',
    sub: 'Contas cadastradas para repasses e conciliação.'
  },
  '/financeiro/bordero': {
    path: '/financeiro/bordero',
    view: 'financial-bordero',
    module: 'financeiro',
    title: 'Borderô Financeiro',
    sub: 'Borderô detalhado por evento e fechamento.'
  },
  '/financeiro/pdv': {
    path: '/financeiro/pdv',
    view: 'financial-pdv',
    module: 'financeiro',
    title: 'Pontos de Venda (PDV)',
    sub: 'Fechamento de caixa e conciliação de PDV físico.'
  },
  '/financeiro/metodos-pagamento': {
    path: '/financeiro/metodos-pagamento',
    view: 'financial-paymethods',
    module: 'financeiro',
    title: 'Métodos de Pagamento',
    sub: 'Configurações de taxas por meio de pagamento.'
  },
  '/financeiro/pagamentos-customizados': {
    path: '/financeiro/pagamentos-customizados',
    view: 'financial-custompay',
    module: 'financeiro',
    title: 'Pagamentos Customizados',
    sub: 'Condições especiais, permutas e cortesias.'
  },
  '/financeiro/negociacoes': {
    path: '/financeiro/negociacoes',
    view: 'financial-negotiations',
    module: 'financeiro',
    title: 'Negociações Financeiras',
    sub: 'Acordos comerciais, prazos e taxas especiais.'
  },
  '/financeiro/estornos': {
    path: '/financeiro/estornos',
    view: 'financial-refunds',
    module: 'financeiro',
    title: 'Devoluções e Estornos',
    sub: 'Gestão de cancelamentos, estornos e chargebacks.'
  },
  '/financeiro/operadoras': {
    path: '/financeiro/operadoras',
    view: 'financial-operators',
    module: 'financeiro',
    title: 'Operadoras de Cartão',
    sub: 'Gateways, adquirentes e conciliação de recebíveis.'
  },
  '/financeiro/inteligencia': {
    path: '/financeiro/inteligencia',
    view: 'financial-analytics',
    module: 'financeiro',
    title: 'Inteligência Financeira',
    sub: 'Análise preditiva, lucratividade e insights de vendas.'
  },
  '/financeiro/compras': {
    path: '/financeiro/compras',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'approvals',
    title: 'Procure-to-Pay & Compras',
    sub: 'Fornecedor 360°, cotações, pedidos, contratos e centro de custos.'
  },

  // Contabilidade (12 subitens com menuKey dedicado)
  '/contabilidade/dashboard': {
    path: '/contabilidade/dashboard',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'dashboard',
    menuKey: 'accounting-overview',
    title: 'Contabilidade Disk Enterprise',
    sub: 'Plano de contas, livro diário, razão, DRE e conciliação contábil.'
  },
  '/contabilidade/inteligencia': {
    path: '/contabilidade/inteligencia',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'inteligencia-contabil',
    menuKey: 'accounting-intelligence',
    title: 'Inteligência Contábil',
    sub: 'Alertas preditivos, conformidade contábil e conformidade fiscal.'
  },
  '/contabilidade/conciliacao': {
    path: '/contabilidade/conciliacao',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'conciliacao',
    menuKey: 'accounting-reconciliation',
    title: 'Centro de Conciliação',
    sub: 'Batimento automático, conferência de extratos e divergências.'
  },
  '/contabilidade/rastreabilidade': {
    path: '/contabilidade/rastreabilidade',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'lancamentos',
    menuKey: 'accounting-traceability',
    title: 'Rastreabilidade 360°',
    sub: 'Trilha de auditoria ponta a ponta: do pedido ao balanço contábil.'
  },
  '/contabilidade/dre': {
    path: '/contabilidade/dre',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'relatorios-dre',
    menuKey: 'accounting-dre',
    title: 'DRE Gerencial',
    sub: 'Demonstração do Resultado do Exercício consolidada por período e evento.'
  },
  '/contabilidade/balanco': {
    path: '/contabilidade/balanco',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'relatorios-balanco',
    menuKey: 'accounting-balance',
    title: 'Balanço Patrimonial',
    sub: 'Ativos, passivos, patrimônio líquido e estrutura de capital.'
  },
  '/contabilidade/fechamento': {
    path: '/contabilidade/fechamento',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'cont-fechamento',
    menuKey: 'accounting-closing',
    title: 'Fechamento Mensal',
    sub: 'Etapas de fechamento contábil, apropriação e encerramento de exercício.'
  },
  '/contabilidade/lancamentos': {
    path: '/contabilidade/lancamentos',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'lancamentos',
    menuKey: 'accounting-journal',
    title: 'Livro de Lançamentos',
    sub: 'Partidas dobradas, histórico contábil e diário de operações.'
  },
  '/contabilidade/plano-de-contas': {
    path: '/contabilidade/plano-de-contas',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'plano-contas',
    menuKey: 'accounting-chart',
    title: 'Plano de Contas',
    sub: 'Estrutura hierárquica das contas contábeis padrão CPC/IFRS.'
  },
  '/contabilidade/relatorios': {
    path: '/contabilidade/relatorios',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'relatorios-dre',
    menuKey: 'accounting-reports',
    title: 'Relatórios Contábeis',
    sub: 'Relatórios gerenciais, balancetes e demonstrações contábeis.'
  },
  '/contabilidade/auditoria': {
    path: '/contabilidade/auditoria',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'auditoria',
    menuKey: 'accounting-audit',
    title: 'Auditoria & Compliance',
    sub: 'Logs imutáveis de trilha de auditoria e conformidade fiscal.'
  },
  '/contabilidade/configuracoes': {
    path: '/contabilidade/configuracoes',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'config-plano',
    menuKey: 'accounting-config',
    title: 'Configurações Contábeis',
    sub: 'Parâmetros contábeis, contas padrão e regras de integração.'
  },

  // Marketing
  '/marketing/dashboard': {
    path: '/marketing/dashboard',
    view: 'marketing-overview',
    module: 'marketing',
    title: 'Hub de Marketing DiskIngressos',
    sub: 'Métricas gerais de conversão, ROI de campanhas e canais de aquisição.'
  },
  '/marketing/campanhas': {
    path: '/marketing/campanhas',
    view: 'marketing-campaigns',
    module: 'marketing',
    title: 'Gestão de Campanhas',
    sub: 'Disparos multicanal, agendamentos e acompanhamento de taxa de abertura.'
  },
  '/marketing/whatsapp': {
    path: '/marketing/whatsapp',
    view: 'marketing-whatsapp',
    module: 'marketing',
    title: 'WhatsApp Marketing Oficial',
    sub: 'Disparos via WhatsApp Business Cloud API, templates e mensagens ativas.'
  },
  '/marketing/email': {
    path: '/marketing/email',
    view: 'marketing-email',
    module: 'marketing',
    title: 'E-mail Marketing',
    sub: 'Automação de e-mails transacionais e promocionais com alta entregabilidade.'
  },
  '/marketing/sms': {
    path: '/marketing/sms',
    view: 'marketing-sms',
    module: 'marketing',
    title: 'SMS Marketing',
    sub: 'Disparo de alertas e lembretes de eventos via SMS.'
  },
  '/marketing/automacao': {
    path: '/marketing/automacao',
    view: 'marketing-automation',
    module: 'marketing',
    title: 'Automações de Marketing',
    sub: 'Fluxos automatizados de pós-venda, abandono de carrinho e retenção.'
  },
  '/marketing/pixel': {
    path: '/marketing/pixel',
    view: 'marketing-pixel',
    module: 'marketing',
    title: 'Pixels & Meta CAPI',
    sub: 'Rastreamento server-side, Pixel Meta, Google Analytics 4 e TikTok Ads.'
  },

  // Fluxo de Caixa
  '/fluxo-caixa/performance': {
    path: '/fluxo-caixa/performance',
    view: 'cashflow-performance',
    module: 'fluxo-caixa',
    menuKey: 'cf-performance',
    title: 'Performance Mensal de Caixa',
    sub: 'Acompanhamento do fluxo de caixa e conciliação por período.'
  },
  '/fluxo-caixa/extrato': {
    path: '/fluxo-caixa/extrato',
    view: 'cashflow-statement',
    module: 'fluxo-caixa',
    title: 'Extrato de Caixa',
    sub: 'Movimentações detalhadas da conta gráfica.'
  },
  '/fluxo-caixa/evolucao': {
    path: '/fluxo-caixa/evolucao',
    view: 'cashflow-flow',
    module: 'fluxo-caixa',
    title: 'Evolução de Caixa',
    sub: 'Gráficos preditivos de saldo e liquidez.'
  },
  '/fluxo-caixa/dre': {
    path: '/fluxo-caixa/dre',
    view: 'cashflow-dre',
    module: 'fluxo-caixa',
    menuKey: 'cf-dre',
    title: 'Demonstrativo de Fluxo (DRE)',
    sub: 'Demonstrativo gerencial por regime de caixa.'
  },

  // Receitas
  '/receitas/descricao': {
    path: '/receitas/descricao',
    view: 'revenues-desc',
    module: 'receitas',
    title: 'Receitas por Descrição',
    sub: 'Detalhamento analítico por item de venda.'
  },
  '/receitas/dia': {
    path: '/receitas/dia',
    view: 'revenues-day',
    module: 'receitas',
    title: 'Receitas por Dia',
    sub: 'Série temporal diária de entradas.'
  },
  '/receitas/tipo': {
    path: '/receitas/tipo',
    view: 'revenues-type',
    module: 'receitas',
    title: 'Receitas por Tipo de Ingresso',
    sub: 'Ingressos inteiros, meia-entrada e cortesias.'
  },
  '/receitas/categoria': {
    path: '/receitas/categoria',
    view: 'revenues-category',
    module: 'receitas',
    title: 'Receitas por Categoria',
    sub: 'Agrupamentos e setores do evento.'
  },
  '/receitas/evento': {
    path: '/receitas/evento',
    view: 'revenues-event',
    module: 'receitas',
    title: 'Receitas por Evento',
    sub: 'Desempenho comparativo por evento.'
  },
  '/receitas/etiquetas': {
    path: '/receitas/etiquetas',
    view: 'revenues-tags-event',
    module: 'receitas',
    title: 'Receitas por Etiquetas de Eventos',
    sub: 'Filtro por tags e tags de classificação.'
  },
  '/receitas/centro-de-custo': {
    path: '/receitas/centro-de-custo',
    view: 'revenues-costcenter',
    module: 'receitas',
    title: 'Receitas por Centro de Custo',
    sub: 'Alocação gerencial de receitas.'
  },
  '/receitas/marcacoes': {
    path: '/receitas/marcacoes',
    view: 'revenues-tags-label',
    module: 'receitas',
    title: 'Receitas por Marcações',
    sub: 'Segmentação avançada por tags personalizadas.'
  },

  // Despesas
  '/despesas/descricao': {
    path: '/despesas/descricao',
    view: 'expenses-desc',
    module: 'despesas',
    title: 'Despesas por Descrição',
    sub: 'Detalhamento de gastos operacionais.'
  },
  '/despesas/categoria': {
    path: '/despesas/categoria',
    view: 'expenses-category',
    module: 'despesas',
    title: 'Despesas por Categoria',
    sub: 'Categorização analítica de despesas.'
  },
  '/despesas/evento': {
    path: '/despesas/evento',
    view: 'expenses-event',
    module: 'despesas',
    title: 'Despesas por Evento',
    sub: 'Custos diretos por produção.'
  },

  // Relatórios e Configurações
  '/relatorios': {
    path: '/relatorios',
    view: 'reports-sales',
    module: 'relatorios',
    menuKey: 'reports-sales',
    title: 'Relatórios Gerenciais',
    sub: 'Exportação de relatórios analíticos em PDF e Excel.'
  },
  '/configuracoes': {
    path: '/configuracoes',
    view: 'settings-profile',
    module: 'configuracoes',
    menuKey: 'settings-profile',
    title: 'Configurações do Sistema',
    sub: 'Parâmetros da conta, integrações e segurança.'
  },
  '/configuracoes/perfil': {
    path: '/configuracoes/perfil',
    view: 'settings-profile',
    module: 'configuracoes',
    menuKey: 'settings-profile',
    title: 'Perfil do Usuário',
    sub: 'Dados de identificação e credenciais.'
  },
  '/configuracoes/empresa': {
    path: '/configuracoes/empresa',
    view: 'settings-profile',
    module: 'configuracoes',
    menuKey: 'settings-company',
    title: 'Dados da Empresa',
    sub: 'Razão social, CNPJ e domicílio fiscal.'
  },
  '/configuracoes/usuarios': {
    path: '/configuracoes/usuarios',
    view: 'settings-profile',
    module: 'configuracoes',
    menuKey: 'settings-users',
    title: 'Gestão de Usuários',
    sub: 'Controle de acessos, papéis e permissões.'
  },
  '/configuracoes/integracoes': {
    path: '/configuracoes/integracoes',
    view: 'settings-profile',
    module: 'configuracoes',
    menuKey: 'settings-integrations',
    title: 'Integrações Externas',
    sub: 'Webhooks, APIs e serviços conectados.'
  },
  '/configuracoes/notificacoes': {
    path: '/configuracoes/notificacoes',
    view: 'settings-profile',
    module: 'configuracoes',
    menuKey: 'settings-notifications',
    title: 'Preferências de Notificação',
    sub: 'Alertas por e-mail, push e sistema.'
  },
  '/configuracoes/seguranca': {
    path: '/configuracoes/seguranca',
    view: 'settings-profile',
    module: 'configuracoes',
    menuKey: 'settings-security',
    title: 'Segurança & Auditoria',
    sub: 'Sessões ativas, logs e autenticação de dois fatores.'
  }
};

/**
 * Tabela de compatibilidade de aliases legados
 */
export const LEGACY_ROUTE_ALIASES = {
  // Gerais
  'dashboard': '/dashboard',
  'dashboard-main': '/dashboard',
  'agenda': '/agenda',
  'dashboard-agenda': '/agenda',
  'indicadores': '/indicadores',
  'dashboard-indicators': '/indicadores',

  // Eventos
  'eventos': '/eventos',
  'events-list': '/eventos',
  'events-new': '/eventos/novo',
  'events-lotes': '/eventos/lotes',
  'events-cupons': '/eventos/cupons',
  'events-checkin': '/eventos/checkin',
  'events-attendees': '/eventos/participantes',
  'events-page': '/eventos/pagina',
  'global-consult-ticket': '/consulta-ingressos',
  'consulta-ingressos': '/consulta-ingressos',

  // Marketing
  'marketing': '/marketing/dashboard',
  'marketing-overview': '/marketing/dashboard',
  'campanhas': '/marketing/campanhas',
  'marketing-campaigns': '/marketing/campanhas',
  'marketing-campaign-create': '/marketing/campanhas',
  'whatsapp': '/marketing/whatsapp',
  'marketing-whatsapp': '/marketing/whatsapp',
  'email': '/marketing/email',
  'marketing-email': '/marketing/email',
  'sms': '/marketing/sms',
  'marketing-sms': '/marketing/sms',
  'marketing-abandoned-cart': '/marketing/dashboard',
  'marketing-coupons': '/eventos/cupons',
  'marketing-audiences': '/marketing/dashboard',
  'automacao': '/marketing/automacao',
  'marketing-automation': '/marketing/automacao',
  'marketing-utm': '/marketing/dashboard',
  'marketing-pixel': '/marketing/pixel',
  'marketing-config': '/marketing/pixel',
  'marketing-ads': '/marketing/dashboard',
  'marketing-reports': '/marketing/dashboard',

  // Financeiro
  'financeiro': '/financeiro/dashboard',
  'financial-dashboard': '/financeiro/dashboard',
  'saldo': '/financeiro/saldo',
  'financial-balance': '/financeiro/saldo',
  'gestao-saldos': '/financeiro/gestao-saldos',
  'financial-transfers': '/financeiro/gestao-saldos',
  'financial-event-transfers': '/financeiro/gestao-saldos',
  'agenda-financeira': '/financeiro/agenda',
  'financial-schedule': '/financeiro/agenda',
  'payout-batches': '/financeiro/agenda',
  'financial-repass': '/financeiro/repasses',
  'financial-advance': '/financeiro/antecipacoes',
  'financial-negotiations': '/financeiro/negociacoes',
  'financial-statement': '/financeiro/extrato',
  'financial-expenses': '/financeiro/despesas',
  'financial-accounts': '/financeiro/contas-bancarias',
  'financial-bordero': '/financeiro/bordero',
  'financial-pdv': '/financeiro/pdv',
  'financial-paymethods': '/financeiro/metodos-pagamento',
  'financial-custompay': '/financeiro/pagamentos-customizados',
  'financial-refunds': '/financeiro/estornos',
  'financial-operators': '/financeiro/operadoras',
  'financial-analytics': '/financeiro/inteligencia',
  'treasury': '/financeiro/tesouraria',
  'tesouraria': '/financeiro/tesouraria',
  'contas-bancarias': '/financeiro/tesouraria',
  'cnab': '/financeiro/tesouraria',
  'pix': '/financeiro/tesouraria',

  // Compras & P2P
  'procure-to-pay': '/financeiro/compras',
  'approvals-inbox': '/financeiro/compras',
  'purchases-requests': '/financeiro/compras',
  'purchases-quotations': '/financeiro/compras',
  'purchases-orders': '/financeiro/compras',
  'purchases-receipts': '/financeiro/compras',
  'suppliers-registry': '/financeiro/compras',
  'suppliers-360': '/financeiro/compras',
  'suppliers-documents': '/financeiro/compras',
  'contracts-management': '/financeiro/compras',
  'contracts-installments': '/financeiro/compras',
  'contracts-expirations': '/financeiro/compras',
  'management-costcenters': '/financeiro/compras',
  'management-budgets': '/financeiro/compras',

  // Contabilidade
  'contabilidade': '/contabilidade/dashboard',
  'accounting-disk': '/contabilidade/dashboard',

  // Fluxo de Caixa
  'cashflow-performance': '/fluxo-caixa/performance',
  'cashflow-statement': '/fluxo-caixa/extrato',
  'cashflow-flow': '/fluxo-caixa/evolucao',
  'cashflow-dre': '/fluxo-caixa/dre',

  // Receitas
  'revenues-desc': '/receitas/descricao',
  'revenues-day': '/receitas/dia',
  'revenues-type': '/receitas/tipo',
  'revenues-category': '/receitas/categoria',
  'revenues-event': '/receitas/evento',
  'revenues-tags-event': '/receitas/etiquetas',
  'revenues-costcenter': '/receitas/centro-de-custo',
  'revenues-tags-label': '/receitas/marcacoes',

  // Despesas
  'expenses-desc': '/despesas/descricao',
  'expenses-category': '/despesas/categoria',
  'expenses-event': '/despesas/evento',

  // Relatórios & Configurações
  'relatorios': '/relatorios',
  'reports-sales': '/relatorios',
  'configuracoes': '/configuracoes',
  'settings-profile': '/configuracoes'
};

const CONTABILIDADE_TAB_TO_MENU_KEY = {
  'dashboard': 'accounting-overview',
  'inteligencia-contabil': 'accounting-intelligence',
  'conciliacao': 'accounting-reconciliation',
  'lancamentos': 'accounting-journal',
  'rastreabilidade': 'accounting-traceability',
  'relatorios-dre': 'accounting-dre',
  'relatorios-balanco': 'accounting-balance',
  'cont-fechamento': 'accounting-closing',
  'plano-contas': 'accounting-chart',
  'relatorios': 'accounting-reports',
  'auditoria': 'accounting-audit',
  'config-plano': 'accounting-config'
};

/**
 * Resolve uma entrada de rota (canônica ou legada) para o contrato canônico
 * @param {string} input - Rota, hash ou view legado
 * @param {string|null} [subTab=null] - Aba opcional para subnavegação
 * @returns {object} Contrato de rota resolvido
 */
export function resolveRoute(input, subTab = null) {
  if (!input) input = '/dashboard';

  let raw = String(input).trim();
  if (raw.startsWith('#')) raw = raw.replace(/^#\/?/, '');
  if (raw.startsWith('view-')) raw = raw.replace(/^view-/, '');

  let explicitSubTab = subTab;

  // Tratar rotas compostas ex: accounting-disk/conciliacao ou /contabilidade/conciliacao
  if (raw.includes('/')) {
    const parts = raw.split('/');
    if (!raw.startsWith('/')) {
      raw = parts[0];
      if (!explicitSubTab) explicitSubTab = parts[1] || null;
    }
  }

  // 1. Verificar correspondência exata em ROUTES (com ou sem barra)
  const formattedPath = raw.startsWith('/') ? raw : '/' + raw;
  if (ROUTES[formattedPath]) {
    const route = { ...ROUTES[formattedPath] };
    if (explicitSubTab) route.tab = explicitSubTab;
    if (route.view === 'accounting-disk' && !route.menuKey) {
      route.menuKey = CONTABILIDADE_TAB_TO_MENU_KEY[route.tab] || 'accounting-overview';
    }
    return route;
  }

  // 2. Verificar correspondência em aliases legados
  const normalizedKey = raw.replace(/^\//, '').toLowerCase();
  if (LEGACY_ROUTE_ALIASES[normalizedKey]) {
    const canonicalPath = LEGACY_ROUTE_ALIASES[normalizedKey];
    const route = { ...ROUTES[canonicalPath] };
    if (explicitSubTab) route.tab = explicitSubTab;
    if (route.view === 'accounting-disk') {
      route.menuKey = CONTABILIDADE_TAB_TO_MENU_KEY[route.tab] || 'accounting-overview';
    }
    return route;
  }

  // 3. Fallback inteligente para garantir zero telas brancas
  console.warn(`[resolveRoute] Rota não catalogada: "${input}". Aplicando fallback seguro.`);
  const fallbackView = normalizedKey.replace(/^view-/, '');
  return {
    path: formattedPath,
    view: fallbackView || 'dashboard-main',
    module: 'dashboard',
    menuKey: fallbackView || 'dashboard-main',
    title: 'Painel Geral',
    sub: 'Métricas operacionais consolidadas e resumo de vendas.'
  };
}

if (typeof window !== 'undefined') {
  window.ROUTES = ROUTES;
  window.LEGACY_ROUTE_ALIASES = LEGACY_ROUTE_ALIASES;
  window.resolveRoute = resolveRoute;
}
