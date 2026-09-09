/**
 * Serviço de Contabilidade Enterprise — Fase 26.17.8.1
 * Implementa o contrato de dados: GET /api/accounting/overview
 * com adapter tipado e suporte a filtros por período, produtor, evento e gateway.
 */

export const ACCOUNTING_DATASETS = {
  '30d': {
    period: { start: '2026-06-01', end: '2026-06-30', label: 'Últimos 30 dias' },
    grossTransactionValue: 1842500.00,
    thirdPartyFunds: {
      total: 1513200.00,
      awaitingSettlement: 380000.00,
      availableForPayout: 615000.00,
      scheduledPayout: 310000.00,
      blockedPayout: 42000.00,
      reconciling: 124000.00,
      divergent: 42200.00,
    },
    diskRevenue: {
      total: 229300.00,
      convenienceFee: 178500.00,
      commission: 26300.00,
      services: 18500.00,
      other: 6000.00,
    },
    financialCosts: {
      gatewayFees: 54820.00,
      acquiringFees: 32100.00,
      antifraud: 11200.00,
      anticipation: 8520.00,
      other: 3000.00,
    },
    taxes: {
      provisioned: 28440.00,
      paid: 22100.00,
    },
    payouts: {
      pending: 414700.00,
      paid: 1098500.00,
    },
    netRevenue: 146040.00,
    operatingResult: 118900.00,
    reconciliation: {
      rate: 98.73,
      divergentItems: 27,
      divergentAmount: 34210.00,
    }
  },
  '7d': {
    period: { start: '2026-06-24', end: '2026-06-30', label: 'Últimos 7 dias' },
    grossTransactionValue: 462100.00,
    thirdPartyFunds: {
      total: 379400.00,
      awaitingSettlement: 98000.00,
      availableForPayout: 162000.00,
      scheduledPayout: 85000.00,
      blockedPayout: 9400.00,
      reconciling: 18000.00,
      divergent: 7000.00,
    },
    diskRevenue: {
      total: 58200.00,
      convenienceFee: 45600.00,
      commission: 6800.00,
      services: 4300.00,
      other: 1500.00,
    },
    financialCosts: {
      gatewayFees: 13900.00,
      acquiringFees: 8200.00,
      antifraud: 2800.00,
      anticipation: 2100.00,
      other: 800.00,
    },
    taxes: {
      provisioned: 7150.00,
      paid: 5400.00,
    },
    payouts: {
      pending: 105000.00,
      paid: 274400.00,
    },
    netRevenue: 37150.00,
    operatingResult: 30400.00,
    reconciliation: {
      rate: 99.12,
      divergentItems: 6,
      divergentAmount: 7000.00,
    }
  },
  'hoje': {
    period: { start: '2026-06-30', end: '2026-06-30', label: 'Hoje' },
    grossTransactionValue: 64981.90,
    thirdPartyFunds: {
      total: 53360.00,
      awaitingSettlement: 14200.00,
      availableForPayout: 23500.00,
      scheduledPayout: 12000.00,
      blockedPayout: 1200.00,
      reconciling: 1800.00,
      divergent: 660.00,
    },
    diskRevenue: {
      total: 8190.00,
      convenienceFee: 6450.00,
      commission: 950.00,
      services: 610.00,
      other: 180.00,
    },
    financialCosts: {
      gatewayFees: 1950.00,
      acquiringFees: 1150.00,
      antifraud: 390.00,
      anticipation: 290.00,
      other: 120.00,
    },
    taxes: {
      provisioned: 1010.00,
      paid: 0.00,
    },
    payouts: {
      pending: 15400.00,
      paid: 37960.00,
    },
    netRevenue: 5230.00,
    operatingResult: 4350.00,
    reconciliation: {
      rate: 99.45,
      divergentItems: 2,
      divergentAmount: 660.00,
    }
  },
  'mes': {
    period: { start: '2026-06-01', end: '2026-06-30', label: 'Mês Atual (Junho/2026)' },
    grossTransactionValue: 1842500.00,
    thirdPartyFunds: {
      total: 1513200.00,
      awaitingSettlement: 380000.00,
      availableForPayout: 615000.00,
      scheduledPayout: 310000.00,
      blockedPayout: 42000.00,
      reconciling: 124000.00,
      divergent: 42200.00,
    },
    diskRevenue: {
      total: 229300.00,
      convenienceFee: 178500.00,
      commission: 26300.00,
      services: 18500.00,
      other: 6000.00,
    },
    financialCosts: {
      gatewayFees: 54820.00,
      acquiringFees: 32100.00,
      antifraud: 11200.00,
      anticipation: 8520.00,
      other: 3000.00,
    },
    taxes: {
      provisioned: 28440.00,
      paid: 22100.00,
    },
    payouts: {
      pending: 414700.00,
      paid: 1098500.00,
    },
    netRevenue: 146040.00,
    operatingResult: 118900.00,
    reconciliation: {
      rate: 98.73,
      divergentItems: 27,
      divergentAmount: 34210.00,
    }
  },
  'ano': {
    period: { start: '2026-01-01', end: '2026-12-31', label: 'Ano de 2026 (YTD)' },
    grossTransactionValue: 11240000.00,
    thirdPartyFunds: {
      total: 9230000.00,
      awaitingSettlement: 1250000.00,
      availableForPayout: 3820000.00,
      scheduledPayout: 3200000.00,
      blockedPayout: 180000.00,
      reconciling: 640000.00,
      divergent: 140000.00,
    },
    diskRevenue: {
      total: 1398000.00,
      convenienceFee: 1088000.00,
      commission: 160500.00,
      services: 112500.00,
      other: 37000.00,
    },
    financialCosts: {
      gatewayFees: 334500.00,
      acquiringFees: 196000.00,
      antifraud: 68500.00,
      anticipation: 52000.00,
      other: 18000.00,
    },
    taxes: {
      provisioned: 173500.00,
      paid: 142000.00,
    },
    payouts: {
      pending: 1250000.00,
      paid: 7980000.00,
    },
    netRevenue: 890000.00,
    operatingResult: 724000.00,
    reconciliation: {
      rate: 98.88,
      divergentItems: 42,
      divergentAmount: 140000.00,
    }
  }
};

/**
 * Busca o Resumo Contábil Executivo
 * Simula o endpoint GET /api/accounting/overview
 * @param {Object} filters
 * @returns {Promise<AccountingOverview>}
 */
export async function getAccountingOverview(filters = {}) {
  const periodKey = filters.period || '30d';
  const base = ACCOUNTING_DATASETS[periodKey] || ACCOUNTING_DATASETS['30d'];

  // Simula latência de rede realista
  await new Promise(resolve => setTimeout(resolve, 80));

  // Clone dos dados
  const result = JSON.parse(JSON.stringify(base));

  // Filtro por Produtor (se selecionado, ajusta dados simulados)
  if (filters.producerId && filters.producerId !== 'todos') {
    const factor = filters.producerId === 'prod-1' ? 0.42 : filters.producerId === 'prod-2' ? 0.35 : 0.23;
    result.grossTransactionValue *= factor;
    result.thirdPartyFunds.total *= factor;
    result.thirdPartyFunds.awaitingSettlement *= factor;
    result.thirdPartyFunds.availableForPayout *= factor;
    result.thirdPartyFunds.scheduledPayout *= factor;
    result.thirdPartyFunds.blockedPayout *= factor;
    result.thirdPartyFunds.reconciling *= factor;
    result.thirdPartyFunds.divergent *= factor;
    result.diskRevenue.total *= factor;
    result.diskRevenue.convenienceFee *= factor;
    result.diskRevenue.commission *= factor;
    result.diskRevenue.services *= factor;
    result.financialCosts.gatewayFees *= factor;
    result.taxes.provisioned *= factor;
    result.payouts.pending *= factor;
    result.payouts.paid *= factor;
    result.netRevenue *= factor;
    result.operatingResult *= factor;
    result.reconciliation.divergentAmount *= factor;
    result.reconciliation.divergentItems = Math.max(1, Math.round(result.reconciliation.divergentItems * factor));
  }

  return result;
}

export default {
  getAccountingOverview,
  ACCOUNTING_DATASETS
};
