/**
 * Fase 26.17.8.5 — Balanço Patrimonial & Posição Financeira
 * Módulo de Contabilidade Corporativa DiskIngressos
 *
 * Regras de Ticketing:
 * 1. GMV não é receita própria.
 * 2. Recursos dos produtores devem ficar rigorosamente segregados no passivo.
 * 3. Recebíveis de gateway vinculados à liquidação.
 * 4. Validação estrita: Ativo = Passivo + PL.
 * 5. Produtor NÃO tem acesso ao Balanço Corporativo da DiskIngressos.
 *
 * Endpoints:
 * - GET /api/accounting/financial-position
 * - GET /api/accounting/balance-sheet
 * - GET /api/accounting/financial-position/gateways
 * - GET /api/accounting/financial-position/third-party-funds
 */

const INITIAL_FINANCIAL_POSITION = {
  referenceDate: "2026-09-09T00:00:00Z",
  cashAndBanks: 1420000.00,
  gatewayReceivables: 2180000.00,
  totalAvailability: 3600000.00,
  thirdPartyFunds: 2850000.00, // Valores de terceiros / produtores
  pendingPayouts: 2850000.00,  // Repasses pendentes
  taxesPayable: 85000.00,
  otherLiabilities: 65000.00,
  netFinancialPosition: 600000.00, // Disponibilidades - Obrigações totais
  gateways: [
    { name: "Stone Pagamentos", balance: 940000.00, pendingSettlement: 18000.00, dPlus: "D+1", status: "NORMAL" },
    { name: "Pagar.me / Stone Co", balance: 680000.00, pendingSettlement: 9200.00, dPlus: "D+1", status: "NORMAL" },
    { name: "Cielo Brasil", balance: 310000.00, pendingSettlement: 4500.00, dPlus: "D+2", status: "NORMAL" },
    { name: "Banco Itaú (PIX Direto)", balance: 250000.00, pendingSettlement: 0.00, dPlus: "D+0", status: "LIQUIDADO" }
  ],
  thirdPartyDistribution: [
    { producer: "Live Entretenimento Ltda", event: "Festival de Verão 2026", amount: 1120000.00, status: "EM_CUSTODIA", payoutDate: "15/09/2026" },
    { producer: "Opus Promoções Culturais", event: "Stand-up Comedy Gala", amount: 640000.00, status: "EM_CUSTODIA", payoutDate: "12/09/2026" },
    { producer: "Mercury Concerts Brasil", event: "Turnê Arena Rock", amount: 890000.00, status: "EM_CUSTODIA", payoutDate: "22/09/2026" },
    { producer: "Outros Produtores Diversos", event: "Eventos Regionais", amount: 200000.00, status: "PROGRAMADO", payoutDate: "10/09/2026" }
  ]
};

const INITIAL_BALANCE_SHEET = {
  referenceDate: "31/08/2026",
  comparisonDate: "31/12/2025",
  totalAssets: 4850000.00,
  totalLiabilities: 3302000.00,
  totalEquity: 1548000.00,
  assets: [
    {
      code: "1.1",
      label: "ATIVO CIRCULANTE",
      current: 4120000.00,
      previous: 3480000.00,
      children: [
        { code: "1.1.01", label: "Caixa e Equivalentes de Caixa (Bancos)", current: 1420000.00, previous: 980000.00 },
        { code: "1.1.02", label: "Valores a Receber - Adquirentes & Gateways", current: 2180000.00, previous: 1940000.00 },
        { code: "1.1.03", label: "Aplicações Financeiras de Curto Prazo (CDI)", current: 420000.00, previous: 480000.00 },
        { code: "1.1.04", label: "Outros Créditos e Adiantamentos", current: 100000.00, previous: 80000.00 }
      ]
    },
    {
      code: "1.2",
      label: "ATIVO NÃO CIRCULANTE",
      current: 730000.00,
      previous: 640000.00,
      children: [
        { code: "1.2.01", label: "Realizável a Longo Prazo (Depósitos Judiciais)", current: 90000.00, previous: 80000.00 },
        { code: "1.2.02", label: "Imobilizado (Hardwares, Catracas, Totens)", current: 280000.00, previous: 260000.00 },
        { code: "1.2.03", label: "Intangível (Software de Ticketing & Patentes)", current: 360000.00, previous: 300000.00 }
      ]
    }
  ],
  liabilities: [
    {
      code: "2.1",
      label: "PASSIVO CIRCULANTE",
      current: 3102000.00,
      previous: 2680000.00,
      children: [
        { code: "2.1.01", label: "Fornecedores Operacionais e Cloud", current: 102000.00, previous: 95000.00 },
        { code: "2.1.03", label: "Recursos de Terceiros - Repasses a Produtores", current: 2850000.00, previous: 2450000.00 },
        { code: "2.1.05", label: "Obrigações Tributárias e Fiscais a Recolher", current: 85000.00, previous: 78000.00 },
        { code: "2.1.06", label: "Obrigações Trabalhistas e Sociais", current: 65000.00, previous: 57000.00 }
      ]
    },
    {
      code: "2.2",
      label: "PASSIVO NÃO CIRCULANTE",
      current: 200000.00,
      previous: 240000.00,
      children: [
        { code: "2.2.01", label: "Financiamentos Bancários de Longo Prazo", current: 140000.00, previous: 170000.00 },
        { code: "2.2.02", label: "Provisões para Riscos e Contingências", current: 60000.00, previous: 70000.00 }
      ]
    }
  ],
  equity: [
    {
      code: "3.1",
      label: "PATRIMÔNIO LÍQUIDO",
      current: 1548000.00,
      previous: 1200000.00,
      children: [
        { code: "3.1.01", label: "Capital Social Subscrito e Integralizado", current: 800000.00, previous: 800000.00 },
        { code: "3.1.02", label: "Reservas de Lucros e Expansão", current: 340000.00, previous: 250000.00 },
        { code: "3.1.03", label: "Lucros Acumulados do Exercício 2026", current: 408000.00, previous: 150000.00 }
      ]
    }
  ]
};

class BalanceSheetService {
  /**
   * Obtém os indicadores executivos de Posição Financeira
   */
  getFinancialPosition() {
    return INITIAL_FINANCIAL_POSITION;
  }

  /**
   * Obtém o Balanço Patrimonial estruturado com checagem da equação contábil:
   * ATIVO = PASSIVO + PATRIMÔNIO LÍQUIDO
   *
   * Regra de segurança: Produtor não acessa balanço corporativo.
   */
  getBalanceSheet(userRole = 'ADMIN') {
    if (userRole === 'PRODUTOR') {
      return {
        success: false,
        error: "Acesso restrito: O Balanço Patrimonial Corporativo da DiskIngressos é reservado para Administração, Controladoria e Diretoria Financeira."
      };
    }

    const diff = INITIAL_BALANCE_SHEET.totalAssets - (INITIAL_BALANCE_SHEET.totalLiabilities + INITIAL_BALANCE_SHEET.totalEquity);
    const isBalanced = Math.abs(diff) < 0.01;

    return {
      success: true,
      isBalanced,
      equationDifference: diff,
      data: INITIAL_BALANCE_SHEET
    };
  }
}

export const balanceSheetService = new BalanceSheetService();
if (typeof window !== 'undefined') {
  window.balanceSheetService = balanceSheetService;
}
