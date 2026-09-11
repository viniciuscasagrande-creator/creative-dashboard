/**
 * Fase 26.17.9.5.1 — Serviço de Cálculo e Gestão de Saldo Disponível Real por Evento
 * Implementa a fórmula contábil/financeira oficial e regras de integridade.
 */

import { eventBalanceGateway } from './eventBalanceGateway.js';

// Base de produtores oficiais cadastrados no PDT
export const OFFICIAL_PRODUCERS = [
  { id: 'prod-1', name: 'DiskIngressos Eventos Ltda', cnpj: '08.123.456/0001-99' },
  { id: 'prod-2', name: 'CWB Brasil Entretenimento', cnpj: '12.987.654/0001-00' }
];

/**
 * Fórmula Oficial de Cálculo de Saldo Disponível (Fase 26.17.9.5.1):
 * SaldoBaseLiquidado = EntradasLiquidadas + AjustesCredores - AjustesDevedores
 * SaldoComprometido = RepassesComprometidos + Antecipacoes + DespesasReservadas + TransferenciasEmProcessamento + OutrosCompromissos
 * SaldoBloqueado = ChargebacksReservados + EstornosReservados + BloqueiosOperacionais + BloqueiosCompliance + DivergenciasBloqueantes
 * SaldoDisponivel = Math.max(0, SaldoBaseLiquidado - SaldoComprometido - SaldoBloqueado)
 */
export function calculateEventAvailableBalance({
  settledAmount = 0,
  creditAdjustments = 0,
  debitAdjustments = 0,
  scheduledPayouts = 0,
  advances = 0,
  reservedExpenses = 0,
  pendingTransfers = 0,
  otherCommitments = 0,
  chargebacks = 0,
  refunds = 0,
  complianceBlocks = 0,
  operationalBlocks = 0,
  criticalDivergences = 0
}) {
  const settledBase = Number((settledAmount + creditAdjustments - debitAdjustments).toFixed(2));
  const committed = Number((scheduledPayouts + advances + reservedExpenses + pendingTransfers + otherCommitments).toFixed(2));
  const blocked = Number((chargebacks + refunds + complianceBlocks + operationalBlocks + criticalDivergences).toFixed(2));
  
  const rawAvailable = settledBase - committed - blocked;
  const available = Number(Math.max(0, rawAvailable).toFixed(2));
  const deficit = rawAvailable < 0 ? Number(Math.abs(rawAvailable).toFixed(2)) : 0;

  // Integridade: SaldoBaseLiquidado deve ser igual a Disponível + Comprometido + Bloqueado (considerando déficit)
  const difference = Number(Math.abs(settledBase - (available + committed + blocked - deficit)).toFixed(2));
  const isBalanced = difference < 0.01;

  return {
    settledBase,
    available,
    committed,
    blocked,
    deficit,
    difference,
    isBalanced
  };
}

// Armazenamento local reativo sincronizado caso o backend REST esteja inicializando
let LOCAL_EVENTS_BALANCES = null;
let LOCAL_MOVEMENTS_CACHE = {};

export function getLocalBalanceStore() {
  if (!LOCAL_EVENTS_BALANCES) {
    initLocalBalanceStore();
  }
  return LOCAL_EVENTS_BALANCES;
}

export function initLocalBalanceStore(events = []) {
  // Se não forem passados eventos, usa a lista padrão de eventos reais
  const evList = (events && events.length > 0) ? events : [
    { id: 3368, name: "Experiencia Música e Natureza - Julho", revenue: 12851.00, producerId: 'prod-1' },
    { id: 3195, name: "9º Knife Show Curitiba - Feira e Exposição de Facas", revenue: 7720.00, producerId: 'prod-1' },
    { id: 3178, name: "Feijoada e Costela assada - PETFRIENDLY", revenue: 9540.00, producerId: 'prod-1' },
    { id: 3042, name: "Festival Rock Nacional Curitiba 2026", revenue: 45000.00, producerId: 'prod-2' },
    { id: 3043, name: "Stand-up Comedy Gala CWB", revenue: 18200.00, producerId: 'prod-2' }
  ];

  LOCAL_EVENTS_BALANCES = evList.map((ev) => {
    const rev = Number(ev.revenue || 0);
    // Distribuição financeira realista por evento
    const settledAmount = Number((rev * 0.85).toFixed(2));
    const pendingSettlement = Number((rev * 0.15).toFixed(2));
    const committedBalance = Number((settledAmount * 0.12).toFixed(2));
    const blockedBalance = Number((settledAmount * 0.03).toFixed(2));
    
    const calc = calculateEventAvailableBalance({
      settledAmount,
      scheduledPayouts: committedBalance,
      chargebacks: blockedBalance
    });

    const producer = OFFICIAL_PRODUCERS.find(p => p.id === (ev.producerId || 'prod-1')) || OFFICIAL_PRODUCERS[0];

    return {
      eventId: String(ev.id),
      eventName: ev.name,
      producerId: producer.id,
      producerName: producer.name,
      currency: 'BRL',
      calculatedAt: new Date().toISOString(),
      status: calc.isBalanced ? 'OK' : 'DIVERGENTE',
      balances: {
        transactedAmount: rev,
        settledAmount,
        pendingSettlement,
        availableBalance: calc.available,
        committedBalance,
        blockedBalance,
        deficitBalance: calc.deficit
      },
      commitments: {
        scheduledPayouts: committedBalance,
        advances: 0,
        reservedExpenses: 0,
        pendingTransfers: 0,
        other: 0
      },
      blocks: {
        chargebacks: blockedBalance,
        refunds: 0,
        compliance: 0,
        operational: 0,
        criticalDivergences: 0
      },
      integrity: {
        isBalanced: calc.isBalanced,
        difference: calc.difference
      }
    };
  });

  return LOCAL_EVENTS_BALANCES;
}

export const eventBalanceService = {
  getLocalBalanceStore() {
    return getLocalBalanceStore();
  },

  /**
   * Obtém a visão consolidada de saldos do produtor (Fase 26.17.9.5)
   */
  async getOverview(producerId = 'prod-1') {
    const res = await eventBalanceGateway.getOverview({ producerId });
    if (res.ok && res.data) {
      return { ok: true, isLiveApi: true, data: res.data };
    }

    // Fallback local robusto calculado com base nos eventos do produtor
    const store = getLocalBalanceStore();
    const producerEvents = store.filter(e => e.producerId === producerId);

    let totalTransacted = 0;
    let totalSettled = 0;
    let totalAvailable = 0;
    let totalCommitted = 0;
    let totalBlocked = 0;
    let totalPendingSettlement = 0;
    let totalDeficit = 0;
    let eventsWithDivergence = 0;

    producerEvents.forEach(e => {
      totalTransacted += e.balances.transactedAmount;
      totalSettled += e.balances.settledAmount;
      totalAvailable += e.balances.availableBalance;
      totalCommitted += e.balances.committedBalance;
      totalBlocked += e.balances.blockedBalance;
      totalPendingSettlement += e.balances.pendingSettlement;
      totalDeficit += e.balances.deficitBalance;
      if (!e.integrity.isBalanced) eventsWithDivergence++;
    });

    const overview = {
      producerId,
      currency: 'BRL',
      calculatedAt: new Date().toISOString(),
      totalBalance: Number((totalAvailable + totalCommitted + totalBlocked).toFixed(2)),
      totalAvailable: Number(totalAvailable.toFixed(2)),
      totalCommitted: Number(totalCommitted.toFixed(2)),
      totalBlocked: Number(totalBlocked.toFixed(2)),
      totalSettled: Number(totalSettled.toFixed(2)),
      totalPendingSettlement: Number(totalPendingSettlement.toFixed(2)),
      totalDeficit: Number(totalDeficit.toFixed(2)),
      scheduledPayouts: Number(totalCommitted.toFixed(2)),
      inReconciliation: 0,
      divergencesCount: eventsWithDivergence,
      divergenceAmount: 0,
      eventsCount: producerEvents.length,
      integrity: {
        isBalanced: eventsWithDivergence === 0,
        difference: 0
      }
    };

    return { ok: true, isLiveApi: false, data: overview };
  },

  /**
   * Lista os saldos de todos os eventos de um produtor
   */
  async getEvents(params = 'prod-1') {
    const producerId = typeof params === 'string' ? params : (params?.producerId || 'prod-1');
    const res = await eventBalanceGateway.getEvents({ producerId });
    if (res.ok && res.data && Array.isArray(res.data)) {
      return { ok: true, isLiveApi: true, data: res.data };
    }

    const store = getLocalBalanceStore();
    const list = store.filter(e => !producerId || producerId === 'todos' || e.producerId === producerId);
    return { ok: true, isLiveApi: false, data: list };
  },

  async getEventsBalances(producerId = 'prod-1') {
    return this.getEvents(producerId);
  },

  /**
   * Obtém os detalhes completos de saldo de um único evento
   */
  async getEventBalance(eventId) {
    const res = await eventBalanceGateway.getEventBalance(eventId);
    if (res.ok && res.data) {
      return { ok: true, isLiveApi: true, data: res.data };
    }

    const store = getLocalBalanceStore();
    const event = store.find(e => String(e.eventId) === String(eventId));
    if (!event) {
      return { ok: false, error: 'Evento não localizado.' };
    }

    return { ok: true, isLiveApi: false, data: event };
  },

  /**
   * Retorna as movimentações financeiras de um evento
   */
  async getEventMovements(eventId) {
    const res = await eventBalanceGateway.getEventMovements(eventId);
    if (res.ok && res.data && Array.isArray(res.data)) {
      return { ok: true, isLiveApi: true, data: res.data };
    }

    const ev = (await this.getEventBalance(eventId)).data;
    if (!ev) return { ok: false, error: 'Evento não localizado.' };

    const cacheKey = String(eventId);
    if (!LOCAL_MOVEMENTS_CACHE[cacheKey]) {
      LOCAL_MOVEMENTS_CACHE[cacheKey] = [
        {
          id: `MOV-${eventId}-001`,
          eventId: String(eventId),
          producerId: ev.producerId,
          type: "VENDA_LIQUIDADA",
          description: "Liquidação de ingressos vendidos (Lote 1 & 2)",
          amount: ev.balances.settledAmount,
          balanceBefore: 0,
          balanceAfter: ev.balances.settledAmount,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          createdBy: "SISTEMA_LIQUIDACAO"
        },
        {
          id: `MOV-${eventId}-002`,
          eventId: String(eventId),
          producerId: ev.producerId,
          type: "REPASSE_PROGRAMADO",
          description: "Reserva para Repasse Programado de Quarta-feira",
          amount: -ev.balances.committedBalance,
          balanceBefore: ev.balances.settledAmount,
          balanceAfter: ev.balances.settledAmount - ev.balances.committedBalance,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          createdBy: "FINANCEIRO_AUTOMATICO"
        }
      ];
    }

    return { ok: true, isLiveApi: false, data: LOCAL_MOVEMENTS_CACHE[cacheKey] };
  },

  /**
   * Aplica atualização atômica de saldo local para um evento
   */
  updateLocalEventBalance(eventId, availableDelta, newMovement = null) {
    const store = getLocalBalanceStore();
    const event = store.find(e => String(e.eventId) === String(eventId));
    if (!event) return null;

    const oldAvail = event.balances.availableBalance;
    event.balances.availableBalance = Number(Math.max(0, oldAvail + availableDelta).toFixed(2));
    event.balances.settledAmount = Number((event.balances.settledAmount + availableDelta).toFixed(2));
    event.calculatedAt = new Date().toISOString();

    if (newMovement) {
      const cacheKey = String(eventId);
      if (!LOCAL_MOVEMENTS_CACHE[cacheKey]) LOCAL_MOVEMENTS_CACHE[cacheKey] = [];
      LOCAL_MOVEMENTS_CACHE[cacheKey].unshift(newMovement);
    }

    return event;
  },

  /**
   * Fase 26.17.9.5.2 — Reserva de Saldo para Transferência em Aprovação
   */
  reserveBalance(eventId, amount, transferId) {
    const store = getLocalBalanceStore();
    const event = store.find(e => String(e.eventId) === String(eventId));
    if (!event) return null;

    const val = Number(amount) || 0;
    event.commitments.pendingTransfers = Number(((event.commitments.pendingTransfers || 0) + val).toFixed(2));
    event.balances.committedBalance = Number((event.balances.committedBalance + val).toFixed(2));
    event.balances.availableBalance = Number(Math.max(0, event.balances.availableBalance - val).toFixed(2));

    const cacheKey = String(eventId);
    if (!LOCAL_MOVEMENTS_CACHE[cacheKey]) LOCAL_MOVEMENTS_CACHE[cacheKey] = [];
    LOCAL_MOVEMENTS_CACHE[cacheKey].unshift({
      id: `MOV-${eventId}-RES-${Date.now()}`,
      eventId: String(eventId),
      producerId: event.producerId,
      transferId,
      type: "TRANSFERENCIA_RESERVA",
      description: `Reserva cautelar para transferência pendente (${transferId})`,
      amount: -val,
      balanceBefore: event.balances.availableBalance + val,
      balanceAfter: event.balances.availableBalance,
      createdAt: new Date().toISOString(),
      createdBy: "SISTEMA_RESERVA"
    });

    return event;
  },

  /**
   * Fase 26.17.9.5.2 — Liberação de Reserva de Saldo (Rejeição ou Cancelamento)
   */
  releaseReservation(eventId, amount, transferId) {
    const store = getLocalBalanceStore();
    const event = store.find(e => String(e.eventId) === String(eventId));
    if (!event) return null;

    const val = Number(amount) || 0;
    event.commitments.pendingTransfers = Number(Math.max(0, (event.commitments.pendingTransfers || 0) - val).toFixed(2));
    event.balances.committedBalance = Number(Math.max(0, event.balances.committedBalance - val).toFixed(2));
    event.balances.availableBalance = Number((event.balances.availableBalance + val).toFixed(2));

    const cacheKey = String(eventId);
    if (!LOCAL_MOVEMENTS_CACHE[cacheKey]) LOCAL_MOVEMENTS_CACHE[cacheKey] = [];
    LOCAL_MOVEMENTS_CACHE[cacheKey].unshift({
      id: `MOV-${eventId}-REL-${Date.now()}`,
      eventId: String(eventId),
      producerId: event.producerId,
      transferId,
      type: "TRANSFERENCIA_RESERVA_LIBERADA",
      description: `Liberação de reserva da transferência rejeitada (${transferId})`,
      amount: val,
      balanceBefore: event.balances.availableBalance - val,
      balanceAfter: event.balances.availableBalance,
      createdAt: new Date().toISOString(),
      createdBy: "SISTEMA_RESERVA"
    });

    return event;
  },

  /**
   * Fase 26.17.9.5.4 — Dashboard Executivo de Gestão de Saldos
   * Endpoint oficial: GET /api/finance/balances/dashboard
   */
  async getExecutiveDashboard(producerId = 'prod-1') {
    const res = await eventBalanceGateway.getDashboard({ producerId });
    if (res.ok && res.data) {
      return { ok: true, isLiveApi: true, data: res.data };
    }

    const store = getLocalBalanceStore();
    const producerEvents = store.filter(e => !producerId || e.producerId === producerId);

    let totalTransacted = 0;
    let totalSettled = 0;
    let totalAvailable = 0;
    let totalCommitted = 0;
    let totalBlocked = 0;
    let totalPendingSettlement = 0;
    let totalDeficit = 0;
    let activeReservations = 0;
    let divergencesCount = 0;

    producerEvents.forEach(e => {
      totalTransacted += e.balances.transactedAmount;
      totalSettled += e.balances.settledAmount;
      totalAvailable += e.balances.availableBalance;
      totalCommitted += e.balances.committedBalance;
      totalBlocked += e.balances.blockedBalance;
      totalPendingSettlement += e.balances.pendingSettlement;
      totalDeficit += e.balances.deficitBalance;
      if (e.commitments && e.commitments.pendingTransfers > 0) activeReservations++;
      if (!e.integrity.isBalanced) divergencesCount++;
    });

    const totalBalance = Number((totalAvailable + totalCommitted + totalBlocked).toFixed(2));
    const baseSettled = totalSettled > 0 ? totalSettled : (totalBalance || 1);

    const availabilityRate = Number(((totalAvailable / baseSettled) * 100).toFixed(1));
    const commitmentRate = Number(((totalCommitted / baseSettled) * 100).toFixed(1));
    const blockedRate = Number(((totalBlocked / baseSettled) * 100).toFixed(1));

    const alerts = [];
    if (totalDeficit > 0) {
      alerts.push({
        id: 'ALT-DEFICIT-01',
        severity: 'CRITICAL',
        title: 'Déficit Financeiro Detectado',
        description: `Há R$ ${totalDeficit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em obrigações que excedem a liquidação em eventos.`,
        impactedAmount: totalDeficit
      });
    }
    if (divergencesCount > 0) {
      alerts.push({
        id: 'ALT-DIV-01',
        severity: 'CRITICAL',
        title: 'Divergência Contábil Ativa',
        description: 'Um ou mais eventos apresentam diferença matemática no balanço. Transferências para esses eventos estão bloqueadas.',
        impactedAmount: 0
      });
    }
    if (commitmentRate > 40) {
      alerts.push({
        id: 'ALT-COMM-01',
        severity: 'WARNING',
        title: 'Taxa de Comprometimento Elevada',
        description: `${commitmentRate}% dos recursos liquidados estão comprometidos com repasses programados e despesas.`,
        impactedAmount: totalCommitted
      });
    }

    const charts = {
      composition: [
        { label: 'Disponível Real', value: totalAvailable, color: '#10b981' },
        { label: 'Comprometido', value: totalCommitted, color: '#f59e0b' },
        { label: 'Bloqueado', value: totalBlocked, color: '#ef4444' },
        { label: 'Aguardando Liquidação', value: totalPendingSettlement, color: '#8b5cf6' }
      ],
      byEvent: producerEvents.map(e => ({
        eventId: e.eventId,
        eventName: e.eventName,
        available: e.balances.availableBalance,
        committed: e.balances.committedBalance,
        blocked: e.balances.blockedBalance
      })),
      scheduledPayouts: [
        { date: 'Próxima Quarta', amount: totalCommitted * 0.6, eventName: 'Repasse Semanal Produtores' },
        { date: 'Próxima Sexta', amount: totalCommitted * 0.4, eventName: 'Adiantamentos Agendados' }
      ]
    };

    const dashboard = {
      calculatedAt: new Date().toISOString(),
      currency: 'BRL',
      summary: {
        totalBalance,
        availableBalance: Number(totalAvailable.toFixed(2)),
        committedBalance: Number(totalCommitted.toFixed(2)),
        blockedBalance: Number(totalBlocked.toFixed(2)),
        pendingSettlement: Number(totalPendingSettlement.toFixed(2)),
        deficitBalance: Number(totalDeficit.toFixed(2))
      },
      operations: {
        transfersCount: 0, // atualizado pelo balanceTransferService
        transferredAmount: 0,
        pendingApprovals: 0,
        reversalsCount: 0,
        activeReservations,
        divergencesCount
      },
      ratios: {
        availabilityRate,
        commitmentRate,
        blockedRate
      },
      charts,
      alerts,
      topEvents: producerEvents
        .slice()
        .sort((a, b) => b.balances.availableBalance - a.balances.availableBalance)
        .map(e => ({
          id: e.eventId,
          name: e.eventName,
          available: e.balances.availableBalance,
          total: e.balances.settledAmount
        }))
    };

    return { ok: true, isLiveApi: false, data: dashboard };
  }
};
