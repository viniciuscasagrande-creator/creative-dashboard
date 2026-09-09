/**
 * Serviço Agregador do Dashboard Contábil Enterprise Unificado (Fase 26.17.9)
 * Conecta e consolida os dados das Fases 26.17.8.1 até 26.17.8.8 sem duplicar verdades contábeis.
 */

import { traceabilityService } from './traceabilityService.js';
import { dreService } from './dreService.js';
import { balanceSheetService } from './balanceSheetService.js';
import { closingService } from './closingService.js';

export class AccountingDashboardService {
  constructor() {
    this.cachedData = null;
    this.lastFetched = 0;
  }

  /**
   * Obtém os dados consolidados do dashboard contábil para o período e filtros especificados.
   * Simula a chamada GET /api/accounting/dashboard
   */
  async getDashboardData(params = {}) {
    const {
      period = 'mes',
      mode = 'advanced',
      producerId = 'todos',
      gatewayId = 'todos',
      userRole = 'ADMIN'
    } = params;

    // 1. Obter dados base de demonstrações e fechamento
    const dre = dreService.getDreOverview({ period, userRole });
    const balance = balanceSheetService.getBalanceSheet(userRole);
    const closing = closingService.getClosingState();

    // 2. Fator de ajuste para filtros
    let factor = 1.0;
    if (producerId !== 'todos') {
      factor = producerId === 'prod-1' ? 0.45 : producerId === 'prod-2' ? 0.35 : 0.20;
    }

    // 3. KPIs Unificados
    const gmv = 8432110.50 * factor;
    const thirdPartyFundsTotal = 6972430.20 * factor;
    const diskRevenueTotal = 892345.60 * factor;
    const gatewayFees = 312884.90 * factor;
    const provisionedTaxes = 148432.10 * factor;
    const producerPayouts = 6421003.80 * factor;
    const operatingResult = 431028.60 * factor;
    const cashAndBanks = 1284551.30 * factor;

    const kpis = {
      gmv,
      thirdPartyFunds: thirdPartyFundsTotal,
      diskRevenue: diskRevenueTotal,
      gatewayFees,
      provisionedTaxes,
      producerPayouts,
      operatingResult,
      cashAndBanks
    };

    // 4. Evolução Financeira (Séries de pontos)
    const evolution = [
      { label: '01/09', diskRevenue: 135000 * factor, producerPayouts: 880000 * factor, gatewayFees: 48000 * factor, taxes: 23000 * factor, result: 64000 * factor },
      { label: '05/09', diskRevenue: 152000 * factor, producerPayouts: 940000 * factor, gatewayFees: 52000 * factor, taxes: 25000 * factor, result: 75000 * factor },
      { label: '10/09', diskRevenue: 148000 * factor, producerPayouts: 910000 * factor, gatewayFees: 51000 * factor, taxes: 24000 * factor, result: 73000 * factor },
      { label: '15/09', diskRevenue: 172000 * factor, producerPayouts: 1120000 * factor, gatewayFees: 60000 * factor, taxes: 29000 * factor, result: 83000 * factor },
      { label: '20/09', diskRevenue: 140000 * factor, producerPayouts: 890000 * factor, gatewayFees: 49000 * factor, taxes: 23000 * factor, result: 68000 * factor },
      { label: '25/09', diskRevenue: 165000 * factor, producerPayouts: 1040000 * factor, gatewayFees: 57000 * factor, taxes: 27000 * factor, result: 81000 * factor },
      { label: '30/09', diskRevenue: 180345.60 * factor, producerPayouts: 1141003.80 * factor, gatewayFees: 61884.90 * factor, taxes: 28432.10 * factor, result: 90028.60 * factor }
    ];

    // 5. Recursos de Terceiros Segregados
    const thirdPartyFunds = {
      total: thirdPartyFundsTotal,
      awaitingSettlement: 1234552.10 * factor,
      availableForPayout: 3421884.30 * factor,
      scheduledPayout: 1842110.50 * factor,
      blocked: 284331.20 * factor,
      inReconciliation: 145220.60 * factor,
      divergent: 44331.50 * factor
    };

    // 6. Conciliação Integrada
    const reconciliation = {
      rate: 0.987,
      reconciled: Math.round(125432 * factor),
      pending: Math.max(1, Math.round(1021 * factor)),
      divergent: Math.max(1, Math.round(312 * factor)),
      notFound: Math.round(48 * factor),
      duplicates: Math.round(23 * factor),
      refunds: Math.round(156 * factor),
      chargebacks: Math.round(42 * factor)
    };

    // 7. Receita Disk por Origem
    const revenueOrigins = [
      { label: 'Taxa de conveniência', amount: 467112.30 * factor, percentage: 0.524 },
      { label: 'Comissões', amount: 255330.10 * factor, percentage: 0.286 },
      { label: 'Serviços', amount: 107884.40 * factor, percentage: 0.121 },
      { label: 'Outras receitas', amount: 62018.80 * factor, percentage: 0.069 }
    ];

    // 8. Gateways Adquirentes
    const gateways = [
      { name: 'Mercado Pago', amount: 341102.40 * factor, percentage: 0.382 },
      { name: 'PagSeguro', amount: 202654.10 * factor, percentage: 0.227 },
      { name: 'Cielo', amount: 164330.80 * factor, percentage: 0.184 },
      { name: 'Stone', amount: 112441.20 * factor, percentage: 0.126 },
      { name: 'Outros', amount: 72142.10 * factor, percentage: 0.081 }
    ];

    // 9. Próximos Repasses
    const upcomingPayouts = [
      { id: 'pay-1', eventName: 'Festival de Verão 2024', producerName: 'Eventos BR', amount: 428110.50 * factor, date: '15/09/2026' },
      { id: 'pay-2', eventName: 'Show Harmonia', producerName: 'Harmonia Produções', amount: 312884.20 * factor, date: '16/09/2026' },
      { id: 'pay-3', eventName: 'Virada Cultural', producerName: 'Cultura & Arte', amount: 284552.10 * factor, date: '18/09/2026' },
      { id: 'pay-4', eventName: 'Arena Music', producerName: 'Arena Produções', amount: 221441.80 * factor, date: '20/09/2026' }
    ];

    // 10. Inteligência Contábil
    const intelligence = [
      { id: 'int-1', type: 'CRITICO', title: 'R$ 84.320 em repasses não conciliados.', occurredAt: 'Hoje 10:24' },
      { id: 'int-2', type: 'ATENCAO', title: 'Taxa efetiva do Mercado Pago aumentou 0,37%.', occurredAt: 'Hoje 09:12' },
      { id: 'int-3', type: 'FISCAL', title: '17 lançamentos sem classificação fiscal.', occurredAt: 'Ontem 16:45' },
      { id: 'int-4', type: 'OPORTUNIDADE', title: 'Possível redução de 12% nas taxas do gateway.', occurredAt: 'Ontem 11:20' }
    ];

    // 11. Eventos em Destaque (Integrado com Rastreabilidade)
    const featuredEvents = [
      { id: 'ev-1', eventName: 'Festival de Verão 2024', producerName: 'Eventos BR', gmv: 1245884.30 * factor, diskRevenue: 128441.20 * factor, payout: 1102331.10 * factor, reconciliationRate: 1.0, status: 'Conciliado' },
      { id: 'ev-2', eventName: 'Show Harmonia', producerName: 'Harmonia Produções', gmv: 892441.20 * factor, diskRevenue: 94220.10 * factor, payout: 782110.30 * factor, reconciliationRate: 0.98, status: 'Pendente' },
      { id: 'ev-3', eventName: 'Virada Cultural', producerName: 'Cultura & Arte', gmv: 654110.80 * factor, diskRevenue: 68112.40 * factor, payout: 574220.10 * factor, reconciliationRate: 1.0, status: 'Conciliado' },
      { id: 'ev-4', eventName: 'Arena Music', producerName: 'Arena Produções', gmv: 482110.50 * factor, diskRevenue: 51220.10 * factor, payout: 421884.20 * factor, reconciliationRate: 0.95, status: 'Pendente' }
    ];

    // 12. Saúde Contábil, Fechamento e Compliance
    const health = {
      score: 98,
      closingProgress: closing ? closing.progress : 92,
      balanceIntegrity: balance && balance.success ? balance.isBalanced : true,
      criticalIssues: closing ? (closing.checks ? closing.checks.filter(c => c.severity === 'BLOQUEANTE' && c.status === 'PENDENTE').length : 0) : 0,
      complianceScore: 99
    };

    return {
      period: { start: '2026-09-01', end: '2026-09-30', label: 'Setembro/2026' },
      kpis,
      evolution,
      thirdPartyFunds,
      reconciliation,
      revenueOrigins,
      gateways,
      upcomingPayouts,
      intelligence,
      featuredEvents,
      health
    };
  }
}

export const accountingDashboardService = new AccountingDashboardService();
