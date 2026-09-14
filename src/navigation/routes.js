/**
 * ==========================================================================
 * FASE 28.15.4 — MAPA CANÔNICO DE ROTAS E ALIASES (src/navigation/routes.js)
 * Enriquecido com subrotas contábeis independentes sobre view-accounting-disk
 * ==========================================================================
 */

import {
  ACCOUNTING_ROUTES,
  ACCOUNTING_TAB_TO_ROUTE,
  ACCOUNTING_ROUTE_TO_TAB,
  CONTABILIDADE_TAB_TO_MENU_KEY
} from './accounting-routes.js';

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

  // Financeiro — Domínio 1: Visão Geral
  '/financeiro/dashboard': {
    path: '/financeiro/dashboard',
    view: 'financial-dashboard',
    module: 'financeiro',
    menuKey: 'fin-dashboard',
    title: 'Painel Financeiro',
    sub: 'Resumo financeiro, conciliação e fluxo de caixa.'
  },
  '/financeiro/inteligencia': {
    path: '/financeiro/inteligencia',
    view: 'financial-analytics',
    module: 'financeiro',
    menuKey: 'fin-intelligence',
    title: 'Inteligência Financeira',
    sub: 'Análise preditiva, lucratividade e insights de vendas.'
  },
  '/financeiro/indicadores': {
    path: '/financeiro/indicadores',
    view: 'dashboard-indicators',
    module: 'financeiro',
    menuKey: 'fin-indicators',
    title: 'Indicadores de Performance',
    sub: 'Metas e indicadores consolidados de bilheteria.'
  },

  // Financeiro — Domínio 2: Tesouraria
  '/financeiro/saldo': {
    path: '/financeiro/saldo',
    view: 'financial-balance',
    module: 'financeiro',
    menuKey: 'fin-balance',
    title: 'Conta Financeira',
    sub: 'Saldo disponível, bloqueado e visão bancária.'
  },
  '/financeiro/gestao-saldos': {
    path: '/financeiro/gestao-saldos',
    view: 'financial-event-transfers',
    module: 'financeiro',
    tab: 'balances',
    menuKey: 'fin-balances',
    title: 'Gestão de Saldos & Transferência entre Eventos',
    sub: 'Painel consolidado, saldos disponíveis reais por evento e transferência atômica.'
  },
  '/financeiro/transferencias': {
    path: '/financeiro/transferencias',
    view: 'financial-event-transfers',
    module: 'financeiro',
    tab: 'transfer',
    menuKey: 'fin-event-transfers',
    title: 'Transferência entre Eventos',
    sub: 'Transferência atômica e remanejamento de saldo entre eventos.'
  },
  '/financeiro/contas-bancarias': {
    path: '/financeiro/contas-bancarias',
    view: 'financial-accounts',
    module: 'financeiro',
    menuKey: 'fin-bank-accounts',
    title: 'Contas Bancárias',
    sub: 'Contas cadastradas para repasses e conciliação.'
  },
  '/financeiro/pix': {
    path: '/financeiro/pix',
    view: 'treasury',
    module: 'financeiro',
    tab: 'pix',
    menuKey: 'fin-treasury-pix',
    title: 'Pagamentos PIX',
    sub: 'Emissão e conciliação instantânea de pagamentos PIX.'
  },
  '/financeiro/cnab': {
    path: '/financeiro/cnab',
    view: 'treasury',
    module: 'financeiro',
    tab: 'batches',
    menuKey: 'fin-treasury-cnab',
    title: 'Remessa e Retorno CNAB',
    sub: 'Geração e leitura de arquivos CNAB 240/400.'
  },
  '/financeiro/pagamentos-lote': {
    path: '/financeiro/pagamentos-lote',
    view: 'treasury',
    module: 'financeiro',
    tab: 'batches',
    menuKey: 'fin-treasury-batches',
    title: 'Pagamentos em Lote',
    sub: 'Processamento e liquidação de pagamentos bancários em lote.'
  },
  '/financeiro/tesouraria': {
    path: '/financeiro/tesouraria',
    view: 'treasury',
    module: 'financeiro',
    menuKey: 'fin-treasury-batches',
    title: 'Tesouraria Operacional & Bancos',
    sub: 'Gestão de contas, pagamentos PIX, remessa e retorno bancário CNAB 240.'
  },

  // Financeiro — Domínio 3: Contas
  '/financeiro/repasses': {
    path: '/financeiro/repasses',
    view: 'financial-repass',
    module: 'financeiro',
    menuKey: 'fin-receivables',
    title: 'Contas a Receber',
    sub: 'Controle de recebíveis, previsões de entrada e histórico.'
  },
  '/financeiro/despesas': {
    path: '/financeiro/despesas',
    view: 'financial-expenses',
    module: 'financeiro',
    menuKey: 'fin-payables',
    title: 'Contas a Pagar',
    sub: 'Contas pendentes, pagas e agendadas.'
  },
  '/financeiro/antecipacoes': {
    path: '/financeiro/antecipacoes',
    view: 'financial-advance',
    module: 'financeiro',
    menuKey: 'fin-advances',
    title: 'Antecipações',
    sub: 'Solicitações de antecipação de recebíveis.'
  },
  '/financeiro/repasses-produtor': {
    path: '/financeiro/repasses-produtor',
    view: 'financial-repass',
    module: 'financeiro',
    tab: 'payouts',
    menuKey: 'fin-payouts',
    title: 'Repasses a Produtores',
    sub: 'Controle de liquidação e repasses a produtores.'
  },
  '/financeiro/agenda': {
    path: '/financeiro/agenda',
    view: 'financial-event-transfers',
    module: 'financeiro',
    tab: 'schedule',
    menuKey: 'fin-schedule',
    title: 'Agenda Financeira & Lotes',
    sub: 'Agendamentos de repasses, lotes homologados e liquidação bancária.'
  },

  // Financeiro — Domínio 4: Compras
  '/financeiro/aprovacoes': {
    path: '/financeiro/aprovacoes',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'approvals',
    menuKey: 'fin-approvals',
    title: 'Central de Aprovações',
    sub: 'Workflow de aprovação multinível de despesas e pedidos.'
  },
  '/financeiro/compras': {
    path: '/financeiro/compras',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'approvals',
    menuKey: 'fin-approvals',
    title: 'Procure-to-Pay & Compras',
    sub: 'Fornecedor 360°, cotações, pedidos, contratos e centro de custos.'
  },
  '/financeiro/compras/solicitacoes': {
    path: '/financeiro/compras/solicitacoes',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'purchases',
    menuKey: 'fin-purchases-requests',
    title: 'Solicitações de Compra',
    sub: 'Requisição e workflow de compras internas.'
  },
  '/financeiro/compras/cotacoes': {
    path: '/financeiro/compras/cotacoes',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'purchases',
    menuKey: 'fin-purchases-quotations',
    title: 'Cotações e Propostas',
    sub: 'Mapa comparativo de cotações e propostas comerciais.'
  },
  '/financeiro/compras/pedidos': {
    path: '/financeiro/compras/pedidos',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'purchases',
    menuKey: 'fin-purchases-orders',
    title: 'Pedidos de Compra',
    sub: 'Emissão e acompanhamento de pedidos de compra.'
  },
  '/financeiro/compras/recebimentos': {
    path: '/financeiro/compras/recebimentos',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'matching',
    menuKey: 'fin-purchases-receipts',
    title: 'Recebimentos Físico/Fiscal',
    sub: '3-way matching, conferência de XML de NF-e e entrada física.'
  },

  // Financeiro — Domínio 5: Fornecedores
  '/financeiro/fornecedores': {
    path: '/financeiro/fornecedores',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'suppliers',
    menuKey: 'fin-suppliers-registry',
    title: 'Cadastro de Fornecedores',
    sub: 'Base cadastral e homologação de parceiros e fornecedores.'
  },
  '/financeiro/fornecedores/360': {
    path: '/financeiro/fornecedores/360',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'suppliers',
    menuKey: 'fin-suppliers-360',
    title: 'Fornecedor 360°',
    sub: 'Visão unificada, histórico financeiro, compras e conformidade.'
  },
  '/financeiro/fornecedores/documentos': {
    path: '/financeiro/fornecedores/documentos',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'suppliers',
    menuKey: 'fin-suppliers-docs',
    title: 'Documentos de Fornecedores',
    sub: 'Repositório de contratos, propostas e comprovantes.'
  },
  '/financeiro/fornecedores/cnd': {
    path: '/financeiro/fornecedores/cnd',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'suppliers',
    menuKey: 'fin-suppliers-cnd',
    title: 'Certidões Negativas de Débitos',
    sub: 'Monitoramento de regularidade fiscal e trabalhista (CNDs).'
  },

  // Financeiro — Domínio 6: Contratos
  '/financeiro/contratos': {
    path: '/financeiro/contratos',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'contracts',
    menuKey: 'fin-contracts',
    title: 'Central de Contratos',
    sub: 'Gestão de vigência, reajustes e cláusulas contratuais.'
  },
  '/financeiro/contratos/parcelas': {
    path: '/financeiro/contratos/parcelas',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'contracts',
    menuKey: 'fin-contracts-installments',
    title: 'Parcelas Contratuais',
    sub: 'Cronograma financeiro e parcelamento de contratos.'
  },
  '/financeiro/contratos/vencimentos': {
    path: '/financeiro/contratos/vencimentos',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'contracts',
    menuKey: 'fin-contracts-expirations',
    title: 'Vencimentos Contratuais',
    sub: 'Alertas preventivos de renovação e rescisão de contratos.'
  },

  // Financeiro — Domínio 7: Controladoria
  '/financeiro/centros-de-custos': {
    path: '/financeiro/centros-de-custos',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'budgets',
    menuKey: 'fin-costcenters',
    title: 'Centros de Custos',
    sub: 'Rateio gerencial por centro de custo e área.'
  },
  '/financeiro/orcamentos': {
    path: '/financeiro/orcamentos',
    view: 'procure-to-pay',
    module: 'financeiro',
    tab: 'budgets',
    menuKey: 'fin-budgets',
    title: 'Orçamentos e Budgets',
    sub: 'Controle de tetos orçamentários e desvio orçado vs realizado.'
  },
  '/financeiro/fluxo-caixa': {
    path: '/financeiro/fluxo-caixa',
    view: 'cashflow-performance',
    module: 'financeiro',
    menuKey: 'fin-cashflow',
    title: 'Fluxo de Caixa Financeiro',
    sub: 'Projeção e controle consolidado de entradas e saídas.'
  },
  '/financeiro/fluxo-caixa/evolucao': {
    path: '/financeiro/fluxo-caixa/evolucao',
    view: 'cashflow-flow',
    module: 'financeiro',
    menuKey: 'fin-cashflow-flow',
    title: 'Projeção de Caixa',
    sub: 'Evolução diária de saldos projetados e realizados.'
  },
  '/financeiro/dre-evento': {
    path: '/financeiro/dre-evento',
    view: 'cashflow-dre',
    module: 'financeiro',
    menuKey: 'fin-dre',
    title: 'DRE do Evento',
    sub: 'Demonstrativo de resultado gerencial por evento.'
  },

  // Financeiro — Domínio 8: Conciliação
  '/financeiro/conciliacao/bancaria': {
    path: '/financeiro/conciliacao/bancaria',
    view: 'treasury',
    module: 'financeiro',
    tab: 'reconciliation',
    menuKey: 'fin-reconciliation-bank',
    title: 'Conciliação Bancária',
    sub: 'Conferência automática de extratos bancários e conciliação OFX/CNAB.'
  },
  '/financeiro/gateways': {
    path: '/financeiro/gateways',
    view: 'financial-operators',
    module: 'financeiro',
    menuKey: 'fin-gateways',
    title: 'Gateways e Adquirentes',
    sub: 'Taxas, prazos de liquidação e conciliação de adquirentes.'
  },
  '/financeiro/conciliacao/repasses': {
    path: '/financeiro/conciliacao/repasses',
    view: 'financial-repass',
    module: 'financeiro',
    tab: 'reconciliation',
    menuKey: 'fin-reconcile-payouts',
    title: 'Conciliação de Repasses',
    sub: 'Auditoria e conferência de repasses efetuados.'
  },
  '/financeiro/conciliacao/retorno': {
    path: '/financeiro/conciliacao/retorno',
    view: 'treasury',
    module: 'financeiro',
    tab: 'batches',
    menuKey: 'fin-cnab-return',
    title: 'Retorno Bancário',
    sub: 'Processamento e conciliação de arquivos retorno bancários.'
  },

  // Financeiro — Domínio 9: Operação
  '/financeiro/pdv': {
    path: '/financeiro/pdv',
    view: 'financial-pdv',
    module: 'financeiro',
    menuKey: 'fin-pdv',
    title: 'Pontos de Venda (PDV)',
    sub: 'Fechamento de caixa e conciliação de PDV físico.'
  },
  '/financeiro/metodos-pagamento': {
    path: '/financeiro/metodos-pagamento',
    view: 'financial-paymethods',
    module: 'financeiro',
    menuKey: 'fin-paymethods',
    title: 'Métodos de Pagamento',
    sub: 'Configurações de taxas por meio de pagamento.'
  },
  '/financeiro/pagamentos-customizados': {
    path: '/financeiro/pagamentos-customizados',
    view: 'financial-custompay',
    module: 'financeiro',
    menuKey: 'fin-custompay',
    title: 'Pagamentos Customizados',
    sub: 'Condições especiais, permutas e cortesias.'
  },
  '/financeiro/negociacoes': {
    path: '/financeiro/negociacoes',
    view: 'financial-negotiations',
    module: 'financeiro',
    menuKey: 'fin-negotiations',
    title: 'Negociações Financeiras',
    sub: 'Acordos comerciais, prazos e taxas especiais.'
  },
  '/financeiro/operadoras': {
    path: '/financeiro/operadoras',
    view: 'financial-operators',
    module: 'financeiro',
    menuKey: 'fin-operators',
    title: 'Operadoras de Cartão',
    sub: 'Gateways, adquirentes e conciliação de recebíveis.'
  },
  '/financeiro/estornos': {
    path: '/financeiro/estornos',
    view: 'financial-refunds',
    module: 'financeiro',
    menuKey: 'fin-refunds',
    title: 'Devoluções e Estornos',
    sub: 'Gestão de cancelamentos, estornos e chargebacks.'
  },

  // Financeiro — Domínio 10: Relatórios
  '/financeiro/extrato': {
    path: '/financeiro/extrato',
    view: 'financial-statement',
    module: 'financeiro',
    menuKey: 'fin-statement',
    title: 'Extrato Financeiro',
    sub: 'Extrato consolidado de movimentações financeiras.'
  },
  '/financeiro/bordero': {
    path: '/financeiro/bordero',
    view: 'financial-bordero',
    module: 'financeiro',
    menuKey: 'fin-bordero',
    title: 'Borderô Financeiro',
    sub: 'Borderô detalhado por evento e fechamento.'
  },
  '/financeiro/relatorios/vendas': {
    path: '/financeiro/relatorios/vendas',
    view: 'reports-sales',
    module: 'financeiro',
    menuKey: 'fin-reports-sales',
    title: 'Relatório Consolidado de Vendas',
    sub: 'Relatórios analíticos e consolidados de faturamento e vendas.'
  },

  // Contabilidade (12 subrotas canônicas via ACCOUNTING_ROUTES da Fase 28.15.4)
  ...ACCOUNTING_ROUTES,

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
    module: 'financeiro',
    menuKey: 'fin-revenues-desc',
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
    module: 'financeiro',
    menuKey: 'fin-revenues-cat',
    title: 'Receitas por Categoria',
    sub: 'Agrupamentos e setores do evento.'
  },
  '/receitas/evento': {
    path: '/receitas/evento',
    view: 'revenues-event',
    module: 'financeiro',
    menuKey: 'fin-revenues-event',
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
    module: 'financeiro',
    menuKey: 'fin-expenses-cat',
    title: 'Despesas por Categoria',
    sub: 'Categorização analítica de despesas.'
  },
  '/despesas/evento': {
    path: '/despesas/evento',
    view: 'expenses-event',
    module: 'financeiro',
    menuKey: 'fin-expenses-event',
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

  'gateways': '/financeiro/gateways',
  'fin-gateways': '/financeiro/gateways',
  'financial-gateways': '/financeiro/gateways',
  'financial-indicators': '/financeiro/indicadores',
  'financial-pix': '/financeiro/pix',
  'financial-cnab': '/financeiro/cnab',
  'financial-batches': '/financeiro/pagamentos-lote',
  'financial-transfers': '/financeiro/transferencias',
  'transferencias': '/financeiro/transferencias',
  'repasses-produtor': '/financeiro/repasses-produtor',
  'aprovacoes': '/financeiro/aprovacoes',
  'fornecedores': '/financeiro/fornecedores',
  'fornecedores-360': '/financeiro/fornecedores/360',
  'contratos': '/financeiro/contratos',
  'centros-de-custos': '/financeiro/centros-de-custos',
  'orcamentos': '/financeiro/orcamentos',
  'dre-evento': '/financeiro/dre-evento',
  'conciliacao-bancaria': '/financeiro/conciliacao/bancaria',
  'conciliacao-repasses': '/financeiro/conciliacao/repasses',
  'conciliacao-retorno': '/financeiro/conciliacao/retorno',
  'relatorios-vendas': '/financeiro/relatorios/vendas',

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
  'accounting-overview': '/contabilidade/dashboard',
  'accounting-intelligence': '/contabilidade/inteligencia',
  'accounting-reconciliation': '/contabilidade/conciliacao',
  'accounting-traceability': '/contabilidade/rastreabilidade',
  'accounting-dre': '/contabilidade/dre',
  'accounting-balance': '/contabilidade/balanco',
  'accounting-closing': '/contabilidade/fechamento',
  'accounting-chart': '/contabilidade/plano-de-contas',
  'accounting-journal': '/contabilidade/lancamentos',
  'accounting-documents': '/contabilidade/documentos',
  'accounting-fiscal': '/contabilidade/fiscal',
  'accounting-reports': '/contabilidade/relatorios',
  'accounting-audit': '/contabilidade/auditoria',
  'accounting-config': '/contabilidade/configuracoes',

  // Fluxo de Caixa (Consolidado em Financeiro > Controladoria)
  'fluxo-caixa': '/financeiro/fluxo-caixa',
  'fluxo-caixa/performance': '/financeiro/fluxo-caixa',
  'fluxo-caixa/evolucao': '/financeiro/fluxo-caixa/evolucao',
  'fluxo-caixa/dre': '/financeiro/dre-evento',
  'cashflow-performance': '/financeiro/fluxo-caixa',
  'cashflow-statement': '/fluxo-caixa/extrato',
  'cashflow-flow': '/financeiro/fluxo-caixa/evolucao',
  'cashflow-dre': '/financeiro/dre-evento',

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

  // 1. Garantir formato de caminho canônico com barra inicial
  const formattedPath = raw.startsWith('/') ? raw : '/' + raw;

  // 2. Verificar correspondência exata em ROUTES (ex: /contabilidade/dre, /contabilidade/dashboard)
  if (ROUTES[formattedPath]) {
    const route = { ...ROUTES[formattedPath] };
    if (explicitSubTab) route.tab = explicitSubTab;
    if (route.view === 'accounting-disk' && !route.menuKey) {
      route.menuKey = CONTABILIDADE_TAB_TO_MENU_KEY[route.tab] || 'accounting-overview';
    }
    return route;
  }

  // 3. Se for rota composta legada (ex: accounting-disk/conciliacao), extrair view e subTab
  if (raw.includes('/') && !raw.startsWith('/')) {
    const parts = raw.split('/');
    raw = parts[0];
    if (!explicitSubTab) explicitSubTab = parts[1] || null;
  }

  const normalizedKey = raw.replace(/^\//, '').toLowerCase();

  // 4. Se for navegação contábil legada com subTab (ex: /contabilidade ou accounting-disk com subTab="dre")
  if ((normalizedKey === 'contabilidade' || normalizedKey === 'accounting-disk') && explicitSubTab) {
    const canonicalSubRoute = ACCOUNTING_TAB_TO_ROUTE[explicitSubTab];
    if (canonicalSubRoute && ROUTES[canonicalSubRoute]) {
      return { ...ROUTES[canonicalSubRoute] };
    }
  }

  // 5. Verificar correspondência em aliases legados
  if (LEGACY_ROUTE_ALIASES[normalizedKey]) {
    const canonicalPath = LEGACY_ROUTE_ALIASES[normalizedKey];
    if (explicitSubTab && (normalizedKey === 'contabilidade' || normalizedKey === 'accounting-disk')) {
      const canonicalSubRoute = ACCOUNTING_TAB_TO_ROUTE[explicitSubTab];
      if (canonicalSubRoute && ROUTES[canonicalSubRoute]) {
        return { ...ROUTES[canonicalSubRoute] };
      }
    }
    const route = { ...ROUTES[canonicalPath] };
    if (explicitSubTab) route.tab = explicitSubTab;
    if (route.view === 'accounting-disk') {
      route.menuKey = CONTABILIDADE_TAB_TO_MENU_KEY[route.tab] || route.menuKey || 'accounting-overview';
    }
    return route;
  }

  // 6. Se o input for diretamente uma tab contábil conhecida (ex: 'dre', 'conciliacao', 'rastreabilidade')
  if (ACCOUNTING_TAB_TO_ROUTE[normalizedKey]) {
    const canonicalSubRoute = ACCOUNTING_TAB_TO_ROUTE[normalizedKey];
    if (ROUTES[canonicalSubRoute]) {
      return { ...ROUTES[canonicalSubRoute] };
    }
  }

  // 7. Fallback inteligente para garantir zero telas brancas
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
