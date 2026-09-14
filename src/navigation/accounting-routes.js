/**
 * ==========================================================================
 * FASE 28.15.4 — MAPA DE SUBROTAS DA CONTABILIDADE (src/navigation/accounting-routes.js)
 * Define as 12 subrotas contábeis canônicas sobre a view única view-accounting-disk
 * ==========================================================================
 */

export const ACCOUNTING_TAB_TO_ROUTE = {
  'dashboard': '/contabilidade/dashboard',
  'inteligencia': '/contabilidade/inteligencia',
  'inteligencia-contabil': '/contabilidade/inteligencia',
  'conciliacao': '/contabilidade/conciliacao',
  'rastreabilidade': '/contabilidade/rastreabilidade',
  'dre': '/contabilidade/dre',
  'relatorios-dre': '/contabilidade/dre',
  'balanco': '/contabilidade/balanco',
  'relatorios-balanco': '/contabilidade/balanco',
  'fechamento': '/contabilidade/fechamento',
  'cont-fechamento': '/contabilidade/fechamento',
  'plano-de-contas': '/contabilidade/plano-de-contas',
  'plano-contas': '/contabilidade/plano-de-contas',
  'lancamentos': '/contabilidade/lancamentos',
  'documentos': '/contabilidade/documentos',
  'fiscal-nfe': '/contabilidade/documentos',
  'nfe': '/contabilidade/documentos',
  'fiscal': '/contabilidade/fiscal',
  'impostos': '/contabilidade/fiscal',
  'relatorios': '/contabilidade/relatorios',
  'demonstracoes': '/contabilidade/relatorios',
  'auditoria': '/contabilidade/auditoria',
  'configuracoes': '/contabilidade/configuracoes',
  'config-plano': '/contabilidade/configuracoes'
};

export const ACCOUNTING_ROUTE_TO_TAB = {
  '/contabilidade/dashboard': 'dashboard',
  '/contabilidade/inteligencia': 'inteligencia-contabil',
  '/contabilidade/conciliacao': 'conciliacao',
  '/contabilidade/rastreabilidade': 'rastreabilidade',
  '/contabilidade/dre': 'relatorios-dre',
  '/contabilidade/balanco': 'relatorios-balanco',
  '/contabilidade/fechamento': 'cont-fechamento',
  '/contabilidade/plano-de-contas': 'plano-contas',
  '/contabilidade/lancamentos': 'lancamentos',
  '/contabilidade/documentos': 'documentos',
  '/contabilidade/fiscal': 'fiscal',
  '/contabilidade/relatorios': 'relatorios',
  '/contabilidade/auditoria': 'auditoria',
  '/contabilidade/configuracoes': 'config-plano'
};

export const CONTABILIDADE_TAB_TO_MENU_KEY = {
  'dashboard': 'accounting-overview',
  'inteligencia': 'accounting-intelligence',
  'inteligencia-contabil': 'accounting-intelligence',
  'conciliacao': 'accounting-reconciliation',
  'rastreabilidade': 'accounting-traceability',
  'dre': 'accounting-dre',
  'relatorios-dre': 'accounting-dre',
  'balanco': 'accounting-balance',
  'relatorios-balanco': 'accounting-balance',
  'fechamento': 'accounting-closing',
  'cont-fechamento': 'accounting-closing',
  'plano-de-contas': 'accounting-chart',
  'plano-contas': 'accounting-chart',
  'lancamentos': 'accounting-journal',
  'documentos': 'accounting-documents',
  'nfe': 'accounting-documents',
  'fiscal-nfe': 'accounting-documents',
  'fiscal': 'accounting-fiscal',
  'impostos': 'accounting-fiscal',
  'relatorios': 'accounting-reports',
  'demonstracoes': 'accounting-reports',
  'auditoria': 'accounting-audit',
  'configuracoes': 'accounting-config',
  'config-plano': 'accounting-config'
};

export const ACCOUNTING_ROUTES = {
  '/contabilidade/dashboard': {
    path: '/contabilidade/dashboard',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'dashboard',
    menuKey: 'accounting-overview',
    title: 'Contabilidade Disk Enterprise',
    sub: 'Visão executiva, balancetes consolidados, saúde financeira e KPIs.'
  },
  '/contabilidade/inteligencia': {
    path: '/contabilidade/inteligencia',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'inteligencia-contabil',
    menuKey: 'accounting-intelligence',
    title: 'Inteligência Contábil',
    sub: 'Alertas preditivos, conformidade contábil e auditoria fiscal em tempo real.'
  },
  '/contabilidade/conciliacao': {
    path: '/contabilidade/conciliacao',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'conciliacao',
    menuKey: 'accounting-reconciliation',
    title: 'Centro de Conciliação',
    sub: 'Batimento automático, conciliação bancária, gateway e divergências.'
  },
  '/contabilidade/rastreabilidade': {
    path: '/contabilidade/rastreabilidade',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'rastreabilidade',
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
  '/contabilidade/plano-de-contas': {
    path: '/contabilidade/plano-de-contas',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'plano-contas',
    menuKey: 'accounting-chart',
    title: 'Plano de Contas',
    sub: 'Estrutura hierárquica das contas contábeis padrão CPC/IFRS.'
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
  '/contabilidade/documentos': {
    path: '/contabilidade/documentos',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'documentos',
    menuKey: 'accounting-documents',
    title: 'Documentos Fiscais & Contábeis',
    sub: 'NF-e, NFS-e, comprovantes e repositório de documentos contábeis.'
  },
  '/contabilidade/fiscal': {
    path: '/contabilidade/fiscal',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'fiscal',
    menuKey: 'accounting-fiscal',
    title: 'Gestão Fiscal & Tributos',
    sub: 'Apuração tributária, cálculo de impostos e obrigações fiscais.'
  },
  '/contabilidade/relatorios': {
    path: '/contabilidade/relatorios',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'relatorios',
    menuKey: 'accounting-reports',
    title: 'Relatórios Contábeis',
    sub: 'Relatórios gerenciais, balancetes e demonstrações contábeis.'
  },

  // Rotas de compatibilidade adicional
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
  }
};
