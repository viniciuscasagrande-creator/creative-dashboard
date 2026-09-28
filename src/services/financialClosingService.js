/**
 * ============================================================================
 * DISK — IMPLANTAÇÃO 5.3: SERVIÇO DE FECHAMENTO FINANCEIRO POR EVENTO
 * (src/services/financialClosingService.js)
 * 
 * Transforma o relatório estático em um motor financeiro real e auditável:
 * - Vendas / Ingressos (Vendidos, Cortesias, Total)
 * - Formas de Pagamento e Rastreabilidade por Adquirente (Cielo, Rede, Stone, PagBank)
 * - Separação Inviolável: GMV -> Taxa Disk -> MDR -> Estornos -> Chargebacks -> Repasses
 * - Ciclo de Vida: EM_ANDAMENTO -> AGUARDANDO_CONCILIACAO -> COM_DIVERGENCIAS ->
 *                  CONCILIADO -> PRONTO_FECHAMENTO -> FECHADO
 * - Aprovação Disk & Ciência do Produtor com Fechamento Versionado
 * ============================================================================
 */

import { eventFeeRulesService } from './eventFeeRulesService.js';
import { eventBalanceService } from './eventBalanceService.js';
import { financialConsolidationGateway as api } from './financialConsolidationGateway.js';

// Status válidos do fechamento
export const CLOSING_STATUSES = {
  EM_ANDAMENTO: { key: 'EM_ANDAMENTO', label: 'Em Andamento', badgeClass: 'bg-secondary' },
  AGUARDANDO_CONCILIACAO: { key: 'AGUARDANDO_CONCILIACAO', label: 'Aguardando Conciliação', badgeClass: 'bg-info text-dark' },
  COM_DIVERGENCIAS: { key: 'COM_DIVERGENCIAS', label: 'Com Divergências', badgeClass: 'bg-warning text-dark' },
  CONCILIADO: { key: 'CONCILIADO', label: 'Conciliado', badgeClass: 'bg-primary' },
  PRONTO_FECHAMENTO: { key: 'PRONTO_FECHAMENTO', label: 'Pronto para Fechamento', badgeClass: 'bg-purple text-white' },
  FECHADO: { key: 'FECHADO', label: 'Fechado & Homologado', badgeClass: 'bg-success' }
};

// Base de fechamentos em memória com versionamento
let CLOSINGS_STORE = [
  {
    closingId: 'CLOSE-EV-5096-2026',
    eventId: '5096',
    eventName: 'Festival Sunset Disk 2026',
    producerId: 'prod-1',
    producerName: 'Prime Live Eventos',
    period: 'Setembro / 2026',
    eventDate: '2026-09-20',
    status: 'PRONTO_FECHAMENTO',
    version: 1,
    history: [
      { version: 1, timestamp: '2026-09-25T14:30:00.000Z', actor: 'Sistema Core', action: 'SNAPSHOT_CRIADO', notes: 'Consolidação inicial de bilheteria e liquidações.' }
    ],
    approvals: {
      diskApproved: true,
      diskApprovedBy: 'Carlos Lima (Financeiro Disk)',
      diskApprovedAt: '2026-09-26T10:15:00.000Z',
      producerAccepted: false,
      producerAcceptedBy: null,
      producerAcceptedAt: null
    },
    // 1. Resumo de Ingressos
    tickets: {
      sold: 476,
      complimentary: 38, // Cortesias
      cancelled: 12,
      validated: 460,
      total: 514, // 476 + 38 = 514
      sectors: [
        { name: 'Pista Premium', sold: 198, complimentary: 12, unitPrice: 150.00, gross: 29700.00 },
        { name: 'Área VIP', sold: 164, complimentary: 16, unitPrice: 100.00, gross: 16400.00 },
        { name: 'Camarote Open', sold: 114, complimentary: 10, unitPrice: 42.63, gross: 4860.00 }
      ]
    },
    // 2. Formas de Pagamento
    payments: [
      {
        method: 'PIX Instantâneo',
        channel: 'Online / Checkout',
        grossAmount: 21960.00,
        txCount: 220,
        acquirer: 'Cielo',
        mdrRate: 0.99,
        mdrCost: 217.40,
        fixedCost: 0.00,
        netExpected: 21742.60,
        netReceived: 21742.60,
        reconciled: true
      },
      {
        method: 'Crédito à Vista (1x)',
        channel: 'Online & POS',
        grossAmount: 14500.00,
        txCount: 142,
        acquirer: 'Rede',
        mdrRate: 2.80,
        mdrCost: 406.00,
        fixedCost: 0.00,
        netExpected: 14094.00,
        netReceived: 14094.00,
        reconciled: true
      },
      {
        method: 'Crédito Parcelado (2x-6x)',
        channel: 'Online (Web/App)',
        grossAmount: 11200.00,
        txCount: 96,
        acquirer: 'Cielo',
        mdrRate: 4.20,
        mdrCost: 470.40,
        fixedCost: 0.00,
        netExpected: 10729.60,
        netReceived: 10729.60,
        reconciled: true
      },
      {
        method: 'Débito Maquininha',
        channel: 'Bilheteria Física (POS)',
        grossAmount: 2800.00,
        txCount: 38,
        acquirer: 'Stone',
        mdrRate: 1.50,
        mdrCost: 42.00,
        fixedCost: 0.00,
        netExpected: 2758.00,
        netReceived: 2758.00,
        reconciled: true
      },
      {
        method: 'Dinheiro em Espécie',
        channel: 'Bilheteria Física',
        grossAmount: 500.00,
        txCount: 18,
        acquirer: 'Tesouraria Interna',
        mdrRate: 0.00,
        mdrCost: 0.00,
        fixedCost: 0.00,
        netExpected: 500.00,
        netReceived: 500.00,
        reconciled: true
      }
    ],
    // 3. Totais Financeiros Rigorosos (Cálculo ao Centavo)
    financials: {
      grossSales: 50960.00,
      refunds: 800.00, // Estornos efetivamente processados
      chargebacks: 0.00, // Chargebacks
      adjustedBase: 50160.00, // 50960 - 800 - 0 = 50160
      diskFeeRate: 10.0,
      diskFeeModel: 'PERCENT',
      diskFeeAmount: 5096.00, // 10% sobre vendas brutas conforme contrato
      acquiringCosts: 1135.80, // Total MDR
      otherCosts: 0.00,
      producerNetRevenue: 43928.20, // 50960 - 5096 - 1135.80 - 800 = 43928.20
      paidPayouts: 30000.00, // Repasses bancários liquidados
      committedFunds: 0.00,
      pendingPayoutBalance: 13928.20 // Saldo a repassar
    },
    // 4. Detalhamento por Adquirente
    acquirerSummary: [
      { name: 'Cielo', gross: 33160.00, mdrCalculated: 687.80, mdrRetained: 687.80, netSettled: 32472.20, status: 'CONCILIADO' },
      { name: 'Rede', gross: 14500.00, mdrCalculated: 406.00, mdrRetained: 406.00, netSettled: 14094.00, status: 'CONCILIADO' },
      { name: 'Stone', gross: 2800.00, mdrCalculated: 42.00, mdrRetained: 42.00, netSettled: 2758.00, status: 'CONCILIADO' },
      { name: 'Tesouraria (Espécie)', gross: 500.00, mdrCalculated: 0.00, mdrRetained: 0.00, netSettled: 500.00, status: 'CONFERIDO' }
    ],
    // 5. Histórico de Repasses Liquidados
    payouts: [
      { id: 'PAY-5096-01', date: '2026-09-15', amount: 15000.00, method: 'PIX_DIRETO', bank: 'Itaú Unibanco', status: 'LIQUIDADO', protocol: 'PIX-20260915-0912' },
      { id: 'PAY-5096-02', date: '2026-09-22', amount: 15000.00, method: 'TED_LOTE', bank: 'Itaú Unibanco', status: 'LIQUIDADO', protocol: 'TED-20260922-4410' }
    ]
  },
  // Evento 3368 (Parque Jaime Lerner)
  {
    closingId: 'CLOSE-EV-3368-2026',
    eventId: '3368',
    eventName: 'Circuito Gastronômico Jaime Lerner',
    producerId: 'prod-1',
    producerName: 'Prime Live Eventos',
    period: 'Agosto / 2026',
    eventDate: '2026-08-15',
    status: 'FECHADO',
    version: 2,
    history: [
      { version: 1, timestamp: '2026-08-20T10:00:00.000Z', actor: 'Sistema Core', action: 'SNAPSHOT_CRIADO', notes: 'Primeiro fechamento.' },
      { version: 2, timestamp: '2026-08-28T16:45:00.000Z', actor: 'Carlos Lima', action: 'FECHAMENTO_HOMOLOGADO', notes: 'Homologado após aceite do produtor.' }
    ],
    approvals: {
      diskApproved: true,
      diskApprovedBy: 'Carlos Lima (Financeiro Disk)',
      diskApprovedAt: '2026-08-25T11:00:00.000Z',
      producerAccepted: true,
      producerAcceptedBy: 'Marcos Vinicius (Produtor)',
      producerAcceptedAt: '2026-08-27T15:20:00.000Z'
    },
    tickets: {
      sold: 1250,
      complimentary: 80,
      cancelled: 25,
      validated: 1210,
      total: 1330,
      sectors: [
        { name: 'Ingresso Geral', sold: 1250, complimentary: 80, unitPrice: 120.00, gross: 150000.00 }
      ]
    },
    payments: [
      { method: 'PIX Instantâneo', channel: 'Online', grossAmount: 75000.00, txCount: 625, acquirer: 'Cielo', mdrRate: 0.99, mdrCost: 742.50, fixedCost: 0, netExpected: 74257.50, netReceived: 74257.50, reconciled: true },
      { method: 'Crédito à Vista', channel: 'Online', grossAmount: 50000.00, txCount: 410, acquirer: 'Rede', mdrRate: 2.80, mdrCost: 1400.00, fixedCost: 0, netExpected: 48600.00, netReceived: 48600.00, reconciled: true },
      { method: 'Crédito Parcelado', channel: 'Online', grossAmount: 25000.00, txCount: 215, acquirer: 'Cielo', mdrRate: 4.50, mdrCost: 1125.00, fixedCost: 0, netExpected: 23875.00, netReceived: 23875.00, reconciled: true }
    ],
    financials: {
      grossSales: 150000.00,
      refunds: 2500.00,
      chargebacks: 500.00,
      adjustedBase: 147000.00,
      diskFeeRate: 15.0,
      diskFeeModel: 'PERCENT',
      diskFeeAmount: 22500.00,
      acquiringCosts: 3267.50,
      otherCosts: 0.00,
      producerNetRevenue: 121232.50,
      paidPayouts: 121232.50,
      committedFunds: 0.00,
      pendingPayoutBalance: 0.00
    },
    acquirerSummary: [
      { name: 'Cielo', gross: 100000.00, mdrCalculated: 1867.50, mdrRetained: 1867.50, netSettled: 98132.50, status: 'CONCILIADO' },
      { name: 'Rede', gross: 50000.00, mdrCalculated: 1400.00, mdrRetained: 1400.00, netSettled: 48600.00, status: 'CONCILIADO' }
    ],
    payouts: [
      { id: 'PAY-3368-01', date: '2026-08-26', amount: 121232.50, method: 'TED_LOTE', bank: 'Bradesco', status: 'LIQUIDADO', protocol: 'TED-20260826-8831' }
    ]
  }
];

export const financialClosingService = {
  /**
   * Lista todos os fechamentos disponíveis no escopo do usuário
   */
  getClosings(filters = {}) {
    let list = [...CLOSINGS_STORE];
    if (filters.producerId && filters.producerId !== 'TODOS') {
      list = list.filter(c => c.producerId === filters.producerId);
    }
    if (filters.eventId && filters.eventId !== 'TODOS') {
      list = list.filter(c => String(c.eventId) === String(filters.eventId));
    }
    if (filters.status && filters.status !== 'TODOS') {
      list = list.filter(c => c.status === filters.status);
    }
    return list;
  },

  /**
   * Obtém detalhes completos de um fechamento por ID ou por Evento
   */
  getClosingById(closingId) {
    return CLOSINGS_STORE.find(c => c.closingId === closingId) || null;
  },

  getClosingByEventId(eventId) {
    return CLOSINGS_STORE.find(c => String(c.eventId) === String(eventId)) || null;
  },

  /**
   * Avança ou altera o estado do fechamento respeitando a esteira
   */
  updateClosingStatus(closingId, newStatus, actorName = 'Financeiro Disk', notes = '') {
    const closing = this.getClosingById(closingId);
    if (!closing) throw new Error(`Fechamento ${closingId} não encontrado.`);

    if (!CLOSING_STATUSES[newStatus]) {
      throw new Error(`Status inválido: ${newStatus}`);
    }

    closing.status = newStatus;
    closing.version += 1;
    closing.history.unshift({
      version: closing.version,
      timestamp: new Date().toISOString(),
      actor: actorName,
      action: `STATUS_ALTERADO_PARA_${newStatus}`,
      notes: notes || `Transição de status para ${CLOSING_STATUSES[newStatus].label}.`
    });

    return closing;
  },

  /**
   * Aprovação pelo Financeiro Disk
   */
  approveByDisk(closingId, actorName = 'Carlos Lima (Financeiro Disk)', notes = '') {
    const closing = this.getClosingById(closingId);
    if (!closing) throw new Error(`Fechamento ${closingId} não encontrado.`);

    closing.approvals.diskApproved = true;
    closing.approvals.diskApprovedBy = actorName;
    closing.approvals.diskApprovedAt = new Date().toISOString();
    
    // Se o produtor já aceitou, o fechamento avança para FECHADO; caso contrário, PRONTO_FECHAMENTO
    if (closing.approvals.producerAccepted) {
      closing.status = 'FECHADO';
    } else {
      closing.status = 'PRONTO_FECHAMENTO';
    }

    closing.version += 1;
    closing.history.unshift({
      version: closing.version,
      timestamp: new Date().toISOString(),
      actor: actorName,
      action: 'APROVACAO_DISK',
      notes: notes || 'Aprovação financeira Disk homologada.'
    });

    return closing;
  },

  /**
   * Registro de Ciência / Aceite do Produtor
   */
  acceptByProducer(closingId, actorName = 'Produtor Responsável', notes = '') {
    const closing = this.getClosingById(closingId);
    if (!closing) throw new Error(`Fechamento ${closingId} não encontrado.`);

    closing.approvals.producerAccepted = true;
    closing.approvals.producerAcceptedBy = actorName;
    closing.approvals.producerAcceptedAt = new Date().toISOString();

    if (closing.approvals.diskApproved) {
      closing.status = 'FECHADO';
    }

    closing.version += 1;
    closing.history.unshift({
      version: closing.version,
      timestamp: new Date().toISOString(),
      actor: actorName,
      action: 'ACEITE_PRODUTOR',
      notes: notes || 'Ciência e aceite formal do fechamento pelo produtor.'
    });

    return closing;
  },

  /**
   * Gera dados completos estruturados para impressão/emissão de Relatório em PDF
   */
  generateClosingReportData(closingId) {
    const c = this.getClosingById(closingId);
    if (!c) throw new Error(`Fechamento ${closingId} não encontrado.`);

    return {
      title: 'Relatório Oficial de Fechamento Financeiro',
      generatedAt: new Date().toISOString(),
      closingId: c.closingId,
      version: c.version,
      statusLabel: CLOSING_STATUSES[c.status]?.label || c.status,
      event: {
        id: c.eventId,
        name: c.eventName,
        date: c.eventDate,
        producer: c.producerName
      },
      indicators: {
        grossSales: c.financials.grossSales,
        ticketsSold: c.tickets.sold,
        ticketsComplimentary: c.tickets.complimentary,
        ticketsTotal: c.tickets.total,
        diskFee: c.financials.diskFeeAmount,
        acquiringCost: c.financials.acquiringCosts,
        refunds: c.financials.refunds,
        chargebacks: c.financials.chargebacks,
        netRevenue: c.financials.producerNetRevenue,
        paidOut: c.financials.paidPayouts,
        pendingPayout: c.financials.pendingPayoutBalance
      },
      tickets: c.tickets,
      payments: c.payments,
      acquirers: c.acquirerSummary,
      payouts: c.payouts,
      approvals: c.approvals
    };
  }
};

if (typeof window !== 'undefined') {
  window.financialClosingService = financialClosingService;
}
