/**
 * ==========================================================================
 * FASE 28.15.1 — MAPA CANÔNICO DE ROTAS E ALIASES (src/navigation/routes.js)
 * ==========================================================================
 */

export const ROUTES = {
  '/dashboard': {
    path: '/dashboard',
    view: 'dashboard-main',
    module: 'dashboard',
    title: 'Painel Geral',
    sub: 'Métricas operacionais consolidadas e resumo de vendas.'
  },
  '/agenda': {
    path: '/agenda',
    view: 'dashboard-agenda',
    module: 'dashboard',
    title: 'Agenda de Eventos',
    sub: 'Calendário e programação de eventos da plataforma.'
  },
  '/indicadores': {
    path: '/indicadores',
    view: 'dashboard-indicators',
    module: 'dashboard',
    title: 'Indicadores de Performance',
    sub: 'Metas e indicadores consolidados de bilheteria.'
  },
  '/eventos': {
    path: '/eventos',
    view: 'events-list',
    module: 'eventos',
    title: 'Todos os Eventos',
    sub: 'Gestão, acompanhamento e status em tempo real de eventos.'
  },
  '/eventos/novo': {
    path: '/eventos/novo',
    view: 'events-new',
    module: 'eventos',
    title: 'Novo Evento',
    sub: 'Cadastro e configuração de eventos, lotes e ingressos.'
  },
  '/eventos/lotes': {
    path: '/eventos/lotes',
    view: 'events-lotes',
    module: 'eventos',
    title: 'Lotes de Ingressos',
    sub: 'Gestão de lotes, disponibilidade e precificação.'
  },
  '/eventos/cupons': {
    path: '/eventos/cupons',
    view: 'events-cupons',
    module: 'eventos',
    title: 'Cupons de Desconto',
    sub: 'Criação e gestão de cupons promocionais para eventos.'
  },
  '/eventos/checkin': {
    path: '/eventos/checkin',
    view: 'events-checkin',
    module: 'eventos',
    title: 'Validador de Portaria',
    sub: 'Controle de acesso e leitura de ingressos na portaria.'
  },
  '/eventos/participantes': {
    path: '/eventos/participantes',
    view: 'events-attendees',
    module: 'eventos',
    title: 'Lista de Participantes',
    sub: 'Lista consolidada de compradores e participantes.'
  },
  '/eventos/pagina': {
    path: '/eventos/pagina',
    view: 'events-page',
    module: 'eventos',
    title: 'Página do Evento',
    sub: 'Link público de vendas e QR Code de divulgação.'
  },
  '/consulta-ingressos': {
    path: '/consulta-ingressos',
    view: 'global-consult-ticket',
    module: 'eventos',
    title: 'Consulta de Ingressos',
    sub: 'Busca unificada por pedido, código, CPF ou comprador.'
  },
  '/financeiro/dashboard': {
    path: '/financeiro/dashboard',
    view: 'financial-dashboard',
    module: 'financeiro',
    title: 'Painel Financeiro',
    sub: 'Resumo financeiro, conciliação e fluxo de caixa.'
  },
  '/financeiro/gestao-saldos': {
    path: '/financeiro/gestao-saldos',
    view: 'financial-event-transfers',
    module: 'financeiro',
    title: 'Gestão de Saldos & Transferência entre Eventos',
    sub: 'Painel consolidado, saldos disponíveis reais por evento e transferência atômica.'
  },
  '/financeiro/agenda': {
    path: '/financeiro/agenda',
    view: 'financial-event-transfers',
    module: 'financeiro',
    tab: 'schedule',
    title: 'Agenda Financeira & Repasses',
    sub: 'Agendamentos futuros, motor de regras de repasses e lotes bancários.'
  },
  '/financeiro/tesouraria': {
    path: '/financeiro/tesouraria',
    view: 'treasury',
    module: 'financeiro',
    title: 'Tesouraria Operacional & Bancos',
    sub: 'Posição consolidada de caixa, contas bancárias, PIX e remessa CNAB 240.'
  },
  '/financeiro/saldo': {
    path: '/financeiro/saldo',
    view: 'financial-balance',
    module: 'financeiro',
    title: 'Saldo Consolidado',
    sub: 'Saldos disponíveis, repasses e fechamento financeiro.'
  },
  '/financeiro/repasses': {
    path: '/financeiro/repasses',
    view: 'financial-repass',
    module: 'financeiro',
    title: 'Solicitações de Repasse',
    sub: 'Gestão e histórico de transferências a produtores.'
  },
  '/financeiro/antecipacoes': {
    path: '/financeiro/antecipacoes',
    view: 'financial-advance',
    module: 'financeiro',
    title: 'Antecipações',
    sub: 'Simulação e contratação de antecipação de recebíveis.'
  },
  '/financeiro/negociacoes': {
    path: '/financeiro/negociacoes',
    view: 'financial-negotiations',
    module: 'financeiro',
    title: 'Negociações Financeiras',
    sub: 'Taxas de serviço, conveniência e comissões por evento.'
  },
  '/financeiro/extrato': {
    path: '/financeiro/extrato',
    view: 'financial-statement',
    module: 'financeiro',
    title: 'Extrato Financeiro',
    sub: 'Histórico detalhado de transações e movimentações.'
  },
  '/financeiro/despesas': {
    path: '/financeiro/despesas',
    view: 'financial-expenses',
    module: 'financeiro',
    title: 'Despesas Financeiras',
    sub: 'Controle e lançamentos de custos operacionais.'
  },
  '/financeiro/contas-bancarias': {
    path: '/financeiro/contas-bancarias',
    view: 'financial-accounts',
    module: 'financeiro',
    title: 'Contas Bancárias',
    sub: 'Cadastro e gestão de contas de produtores e parceiros.'
  },
  '/financeiro/bordero': {
    path: '/financeiro/bordero',
    view: 'financial-bordero',
    module: 'financeiro',
    title: 'Borderô Financeiro',
    sub: 'Demonstrativo consolidado de fechamento de eventos.'
  },
  '/financeiro/pdv': {
    path: '/financeiro/pdv',
    view: 'financial-pdv',
    module: 'financeiro',
    title: 'Pontos de Venda (PDV)',
    sub: 'Monitoramento em tempo real de caixas físicos e operadores.'
  },
  '/financeiro/metodos-pagamento': {
    path: '/financeiro/metodos-pagamento',
    view: 'financial-paymethods',
    module: 'financeiro',
    title: 'Métodos de Pagamento',
    sub: 'Taxas, adquirentes e regras de parcelamento.'
  },
  '/financeiro/pagamentos-customizados': {
    path: '/financeiro/pagamentos-customizados',
    view: 'financial-custompay',
    module: 'financeiro',
    title: 'Pagamentos Customizados',
    sub: 'Condições especiais e formas personalizadas de recebimento.'
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
  '/contabilidade/dashboard': {
    path: '/contabilidade/dashboard',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'dashboard',
    title: 'Contabilidade Disk Enterprise',
    sub: 'Plano de contas, livro diário, razão, DRE e conciliação contábil.'
  },
  '/contabilidade/inteligencia': {
    path: '/contabilidade/inteligencia',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'inteligencia-contabil',
    title: 'Inteligência Contábil',
    sub: 'Alertas preditivos, conformidade contábil e conformidade fiscal.'
  },
  '/contabilidade/conciliacao': {
    path: '/contabilidade/conciliacao',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'conciliacao',
    title: 'Centro de Conciliação',
    sub: 'Batimento automático, conferência de extratos e divergências.'
  },
  '/contabilidade/rastreabilidade': {
    path: '/contabilidade/rastreabilidade',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'lancamentos',
    title: 'Rastreabilidade 360°',
    sub: 'Trilha de auditoria ponta a ponta: do pedido ao balanço contábil.'
  },
  '/contabilidade/dre': {
    path: '/contabilidade/dre',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'relatorios-dre',
    title: 'DRE Gerencial',
    sub: 'Demonstração do Resultado do Exercício consolidada por período e evento.'
  },
  '/contabilidade/balanco': {
    path: '/contabilidade/balanco',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'relatorios-balanco',
    title: 'Balanço Patrimonial',
    sub: 'Ativos, passivos, patrimônio líquido e estrutura de capital.'
  },
  '/contabilidade/fechamento': {
    path: '/contabilidade/fechamento',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'cont-fechamento',
    title: 'Fechamento Mensal',
    sub: 'Etapas de fechamento contábil, apropriação e encerramento de exercício.'
  },
  '/contabilidade/plano-de-contas': {
    path: '/contabilidade/plano-de-contas',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'plano-contas',
    title: 'Plano de Contas',
    sub: 'Estrutura hierárquica das contas contábeis padrão CPC/IFRS.'
  },
  '/contabilidade/lancamentos': {
    path: '/contabilidade/lancamentos',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'lancamentos',
    title: 'Livro de Lançamentos',
    sub: 'Partidas dobradas, histórico contábil e diário de operações.'
  },
  '/contabilidade/auditoria': {
    path: '/contabilidade/auditoria',
    view: 'accounting-disk',
    module: 'contabilidade',
    tab: 'auditoria',
    title: 'Auditoria & Compliance',
    sub: 'Logs imutáveis de trilha de auditoria e conformidade fiscal.'
  },
  '/marketing/dashboard': {
    path: '/marketing/dashboard',
    view: 'marketing-overview',
    module: 'marketing',
    title: 'Marketing Hub',
    sub: 'Visão geral 360° de campanhas, públicos e conversões.'
  },
  '/marketing/campanhas': {
    path: '/marketing/campanhas',
    view: 'marketing-campaigns',
    module: 'marketing',
    title: 'Central de Campanhas',
    sub: 'Planeje, dispare e acompanhe campanhas multicanal.'
  },
  '/marketing/whatsapp': {
    path: '/marketing/whatsapp',
    view: 'marketing-whatsapp',
    module: 'marketing',
    title: 'WhatsApp Marketing',
    sub: 'Disparos e automação de mensagens em massa via WhatsApp.'
  },
  '/marketing/email': {
    path: '/marketing/email',
    view: 'marketing-email',
    module: 'marketing',
    title: 'E-mail Marketing',
    sub: 'Gestão de campanhas de e-mail e métricas de engajamento.'
  },
  '/marketing/sms': {
    path: '/marketing/sms',
    view: 'marketing-sms',
    module: 'marketing',
    title: 'SMS Marketing',
    sub: 'Disparo de SMS direto com alta taxa de entrega e abertura.'
  },
  '/marketing/automacao': {
    path: '/marketing/automacao',
    view: 'marketing-automation',
    module: 'marketing',
    title: 'Automações de Marketing',
    sub: 'Fluxos automáticos de régua de relacionamento.'
  },
  '/marketing/pixel': {
    path: '/marketing/pixel',
    view: 'marketing-pixel',
    module: 'marketing',
    title: 'Pixels & Tracking Central',
    sub: 'Meta Pixel, Google Tag, TikTok e Spotify Conversions.'
  },
  '/relatorios': {
    path: '/relatorios',
    view: 'reports-sales',
    module: 'relatorios',
    title: 'Relatórios e Métricas',
    sub: 'Relatórios consolidados de vendas e participantes.'
  },
  '/configuracoes': {
    path: '/configuracoes',
    view: 'settings-profile',
    module: 'configuracoes',
    title: 'Configurações',
    sub: 'Perfil, preferências e configurações da conta.'
  }
};

export const LEGACY_ROUTE_ALIASES = {
  '': '/dashboard',
  'dashboard': '/dashboard',
  'dashboard-main': '/dashboard',
  'agenda': '/agenda',
  'indicadores': '/indicadores',
  'eventos': '/eventos',
  'events': '/eventos',
  'events-list': '/eventos',
  'novo-evento': '/eventos/novo',
  'events-new': '/eventos/novo',
  'lotes': '/eventos/lotes',
  'events-lotes': '/eventos/lotes',
  'cupons': '/eventos/cupons',
  'events-cupons': '/eventos/cupons',
  'checkin': '/eventos/checkin',
  'events-checkin': '/eventos/checkin',
  'participantes': '/eventos/participantes',
  'events-attendees': '/eventos/participantes',
  'events-page': '/eventos/pagina',
  'consulta': '/consulta-ingressos',
  'global-consult-ticket': '/consulta-ingressos',
  'marketing': '/marketing/dashboard',
  'marketing-dashboard': '/marketing/dashboard',
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
  'contabilidade': '/contabilidade/dashboard',
  'accounting-disk': '/contabilidade/dashboard',
  'relatorios': '/relatorios',
  'reports-sales': '/relatorios',
  'configuracoes': '/configuracoes',
  'settings-profile': '/configuracoes'
};

/**
 * Resolve uma entrada de rota (canônica ou legada) para o contrato canônico
 * @param {string} input - Rota, hash ou view legado
 * @returns {object} Contrato de rota resolvido
 */
export function resolveRoute(input) {
  if (!input) input = '/dashboard';

  let raw = String(input).trim();
  if (raw.startsWith('#')) raw = raw.replace(/^#\/?/, '');
  if (raw.startsWith('view-')) raw = raw.replace(/^view-/, '');

  let explicitSubTab = null;

  // Tratar rotas compostas ex: accounting-disk/conciliacao ou /contabilidade/conciliacao
  if (raw.includes('/')) {
    const parts = raw.split('/');
    if (!raw.startsWith('/')) {
      raw = parts[0];
      explicitSubTab = parts[1] || null;
    }
  }

  // 1. Verificar correspondência exata em ROUTES (com ou sem barra)
  const formattedPath = raw.startsWith('/') ? raw : '/' + raw;
  if (ROUTES[formattedPath]) {
    const route = { ...ROUTES[formattedPath] };
    if (explicitSubTab) route.tab = explicitSubTab;
    return route;
  }

  // 2. Verificar correspondência em aliases legados
  const normalizedKey = raw.replace(/^\//, '').toLowerCase();
  if (LEGACY_ROUTE_ALIASES[normalizedKey]) {
    const canonicalPath = LEGACY_ROUTE_ALIASES[normalizedKey];
    const route = { ...ROUTES[canonicalPath] };
    if (explicitSubTab) route.tab = explicitSubTab;
    return route;
  }

  // 3. Fallback inteligente para garantir zero telas brancas
  console.warn(`[resolveRoute] Rota não catalogada: "${input}". Aplicando fallback seguro.`);
  const fallbackView = normalizedKey.replace(/^view-/, '');
  return {
    path: formattedPath,
    view: fallbackView || 'dashboard-main',
    module: 'geral',
    title: 'Painel Geral',
    sub: 'Métricas operacionais consolidadas e resumo de vendas.'
  };
}

if (typeof window !== 'undefined') {
  window.ROUTES = ROUTES;
  window.LEGACY_ROUTE_ALIASES = LEGACY_ROUTE_ALIASES;
  window.resolveRoute = resolveRoute;
}
