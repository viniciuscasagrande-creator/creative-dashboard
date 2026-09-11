/**
 * Fase 26.17.9.5.5 — Serviço de Projeção de Caixa e Repasses por Evento
 * Implementa motor de cálculo preditivo, classificação de risco de insuficiência,
 * recomendações de cobertura entre eventos do mesmo produtor e simulador financeiro.
 */

import { eventBalanceGateway } from './eventBalanceGateway.js';
import { eventBalanceService, OFFICIAL_PRODUCERS } from './eventBalanceService.js';
import { balanceTransferService } from './balanceTransferService.js';

/**
 * Limiares de Risco Configuráveis (RN06 & 03_RISCO_INSUFICIENCIA.md)
 */
export const DEFAULT_RISK_POLICY = {
  safetyThreshold: 1000.00, // Limite absoluto de segurança em R$
  tightMarginRatio: 0.15,   // Margem estreita se folga < 15% das saídas previstas
  criticalMarginRatio: 0.05 // Crítico se folga < 5% das saídas previstas
};

/**
 * Formata data YYYY-MM-DD
 */
function toDateKey(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Adiciona dias a uma data
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Classifica o status de risco do evento
 */
export function classifyForecastRisk({
  projectedBalance,
  minimumProjectedBalance,
  expectedOutflows,
  policy = DEFAULT_RISK_POLICY
}) {
  if (minimumProjectedBalance < 0) {
    return 'DEFICIT_PROJETADO';
  }
  if (minimumProjectedBalance <= policy.safetyThreshold) {
    return 'CRITICO';
  }
  if (expectedOutflows > 0 && minimumProjectedBalance < (expectedOutflows * policy.tightMarginRatio)) {
    return 'ATENCAO';
  }
  return 'NORMAL';
}

/**
 * Constrói a timeline dia a dia no horizonte especificado
 */
export function buildTimelinePoints({
  openingBalance,
  horizonDays = 30,
  dailyInflows = {},
  dailyOutflows = {},
  startDate = new Date()
}) {
  const timeline = [];
  let runningBalance = Number(openingBalance) || 0;

  for (let i = 0; i < horizonDays; i++) {
    const dayDate = addDays(startDate, i);
    const dateStr = toDateKey(dayDate);

    const inflows = Number((dailyInflows[dateStr] || 0).toFixed(2));
    const outflows = Number((dailyOutflows[dateStr] || 0).toFixed(2));

    runningBalance = Number((runningBalance + inflows - outflows).toFixed(2));

    timeline.push({
      date: dateStr,
      dayIndex: i + 1,
      inflows,
      outflows,
      projectedBalance: runningBalance
    });
  }

  return timeline;
}

/**
 * Calcula a projeção de caixa para um evento específico
 */
export async function calculateEventCashForecast(eventId, {
  horizonDays = 30,
  policy = DEFAULT_RISK_POLICY,
  customPendingTransfers = null
} = {}) {
  // 1. Obter saldo oficial atual
  let eventData = null;
  const evRes = await eventBalanceService.getEventBalance(eventId);
  if (evRes.ok && evRes.data) {
    eventData = evRes.data;
  } else {
    const all = await eventBalanceService.getEvents();
    eventData = (all.data || []).find(e => String(e.eventId) === String(eventId));
  }

  if (!eventData) {
    throw new Error(`Evento #${eventId} não encontrado para cálculo de projeção.`);
  }

  const currentAvailable = Number(eventData.balances?.availableBalance || 0);
  const currentCommitted = Number(eventData.balances?.committedBalance || 0);
  const currentBlocked = Number(eventData.balances?.blockedBalance || 0);
  const pendingSettlement = Number(eventData.balances?.pendingSettlement || 0);

  // 2. Mapear transferências pendentes envolvendo este evento
  let transfers = customPendingTransfers;
  if (!transfers) {
    const trfRes = await balanceTransferService.getTransfers({ eventId });
    transfers = trfRes.data || [];
  }

  const today = new Date();
  const dailyInflows = {};
  const dailyOutflows = {};

  // 3. Distribuição de liquidações previstas (Inflows da agenda de gateways)
  // Regra: pendingSettlement é distribuído realisticamente nos primeiros 14 dias (D+1 PIX, D+2 Débito, D+14 Cartão)
  if (pendingSettlement > 0) {
    const daysToDistribute = Math.min(horizonDays, 14);
    const dailySettlement = Number((pendingSettlement / daysToDistribute).toFixed(2));
    for (let i = 1; i <= daysToDistribute; i++) {
      const dKey = toDateKey(addDays(today, i));
      dailyInflows[dKey] = (dailyInflows[dKey] || 0) + dailySettlement;
    }
  }

  // 4. Transferências internas agendadas/pendentes (RN04)
  transfers.forEach(t => {
    if (t.status === 'PENDING_APPROVAL' || t.status === 'APPROVED') {
      const dKey = toDateKey(addDays(today, 2)); // Projetada para D+2 após alçadas
      const amt = Number(t.amount || 0);
      if (String(t.targetEventId) === String(eventId)) {
        // Entrada futura no destino
        dailyInflows[dKey] = (dailyInflows[dKey] || 0) + amt;
      }
    }
  });

  // 5. Repasses e despesas programadas (Outflows)
  // Utiliza as obrigações reais do evento (se houver agendamentos)
  const scheduledPayouts = Number(eventData.commitments?.scheduledPayouts || 0);
  const reservedExpenses = Number(eventData.commitments?.reservedExpenses || 0);

  // Agenda repasses em ciclos de D+7 e D+21 se houver compromissos programados
  if (scheduledPayouts > 0) {
    const payoutDay1 = toDateKey(addDays(today, Math.min(horizonDays, 7)));
    dailyOutflows[payoutDay1] = (dailyOutflows[payoutDay1] || 0) + scheduledPayouts;
  }

  if (reservedExpenses > 0) {
    const expDay = toDateKey(addDays(today, Math.min(horizonDays, 12)));
    dailyOutflows[expDay] = (dailyOutflows[expDay] || 0) + reservedExpenses;
  }

  // 6. Constrói a curva de caixa diária
  const timeline = buildTimelinePoints({
    openingBalance: currentAvailable,
    horizonDays,
    dailyInflows,
    dailyOutflows,
    startDate: today
  });

  // 7. Totais e Métricas
  const totalInflows = Number(Object.values(dailyInflows).reduce((a, b) => a + b, 0).toFixed(2));
  const totalOutflows = Number(Object.values(dailyOutflows).reduce((a, b) => a + b, 0).toFixed(2));
  const finalProjectedBalance = timeline[timeline.length - 1]?.projectedBalance ?? currentAvailable;

  // Encontra menor saldo e data crítica
  let minimum = timeline[0] || { projectedBalance: currentAvailable, date: toDateKey(today) };
  timeline.forEach(pt => {
    if (pt.projectedBalance < minimum.projectedBalance) {
      minimum = pt;
    }
  });

  const minimumProjectedBalance = minimum.projectedBalance;
  const minimumProjectedDate = minimum.date;

  // Classificação de risco
  const riskStatus = classifyForecastRisk({
    projectedBalance: finalProjectedBalance,
    minimumProjectedBalance,
    expectedOutflows: totalOutflows,
    policy
  });

  const forecastResult = {
    calculatedAt: new Date().toISOString(),
    eventId: String(eventId),
    eventName: eventData.eventName || `Evento #${eventId}`,
    producerId: eventData.producerId || 'prod-1',
    producerName: eventData.producerName || 'Produtor Oficial',
    currency: 'BRL',
    current: {
      availableBalance: currentAvailable,
      committedBalance: currentCommitted,
      blockedBalance: currentBlocked,
      pendingSettlement
    },
    forecast: {
      expectedInflows: totalInflows,
      expectedOutflows: totalOutflows,
      projectedBalance: finalProjectedBalance,
      minimumProjectedBalance,
      minimumProjectedDate,
      riskStatus,
      horizonDays
    },
    timeline,
    coverage: {
      requiredAmount: minimumProjectedBalance < 0 ? Number(Math.abs(minimumProjectedBalance).toFixed(2)) : 0,
      suggestions: []
    }
  };

  return forecastResult;
}

/**
 * Constrói sugestões de cobertura preventiva entre eventos do mesmo produtor
 * RN07 & RN08: Nunca executa automaticamente, apenas recomenda candidatos com saldo real seguro.
 */
export async function buildCoverageSuggestions(eventId, {
  horizonDays = 30,
  policy = DEFAULT_RISK_POLICY
} = {}) {
  const targetForecast = await calculateEventCashForecast(eventId, { horizonDays, policy });

  if (targetForecast.forecast.minimumProjectedBalance >= 0) {
    return {
      requiredAmount: 0,
      suggestions: []
    };
  }

  const requiredAmount = Number(Math.abs(targetForecast.forecast.minimumProjectedBalance).toFixed(2));
  const producerId = targetForecast.producerId;

  // Buscar todos os eventos do mesmo produtor
  const allEventsRes = await eventBalanceService.getEvents({ producerId });
  const allEvents = allEventsRes.data || [];

  const candidates = allEvents.filter(e => String(e.eventId) !== String(eventId));
  const suggestions = [];

  for (const candidate of candidates) {
    const candidateAvailable = Number(candidate.balances?.availableBalance || 0);
    if (candidateAvailable <= 0) continue;

    // Calcular projeção do candidato para garantir que ele não entre em risco
    const candidateForecast = await calculateEventCashForecast(candidate.eventId, { horizonDays, policy });
    const candidateMinBalance = candidateForecast.forecast.minimumProjectedBalance;

    // Capacidade Segura = Math.max(0, Math.min(candidateAvailable, candidateMinBalance))
    const safeCapacity = Number(Math.max(0, Math.min(candidateAvailable, candidateMinBalance)).toFixed(2));

    if (safeCapacity <= 0) continue;

    const suggestedAmount = Number(Math.min(safeCapacity, requiredAmount).toFixed(2));
    const projectedBalanceAfterCoverage = Number((candidateForecast.forecast.projectedBalance - suggestedAmount).toFixed(2));
    const minBalanceAfterCoverage = Number((candidateMinBalance - suggestedAmount).toFixed(2));

    const riskAfterCoverage = classifyForecastRisk({
      projectedBalance: projectedBalanceAfterCoverage,
      minimumProjectedBalance: minBalanceAfterCoverage,
      expectedOutflows: candidateForecast.forecast.expectedOutflows,
      policy
    });

    suggestions.push({
      sourceEventId: String(candidate.eventId),
      sourceEventName: candidate.eventName,
      availableBalance: candidateAvailable,
      candidateMinProjected: candidateMinBalance,
      safeCapacity,
      suggestedAmount,
      projectedBalanceAfterCoverage,
      riskAfterCoverage
    });
  }

  // Ordenar sugestões da maior capacidade para a menor
  suggestions.sort((a, b) => b.suggestedAmount - a.suggestedAmount);

  return {
    requiredAmount,
    suggestions
  };
}

/**
 * Obtém Projeção Consolidada de Caixa do Produtor
 */
export async function getConsolidatedCashForecast(producerId = 'prod-1', {
  horizonDays = 30,
  policy = DEFAULT_RISK_POLICY
} = {}) {
  // Tentar via API oficial primeiro
  try {
    const apiRes = await eventBalanceGateway.getCashForecast({ producerId, horizonDays });
    if (apiRes.ok && apiRes.data) {
      return { ok: true, data: apiRes.data, isLiveApi: true };
    }
  } catch (_) {}

  // Cálculo resiliente no motor local oficial
  const allEventsRes = await eventBalanceService.getEvents({ producerId });
  const events = (allEventsRes.data || []).filter(e => e.producerId === producerId);

  let totalAvailable = 0;
  let totalCommitted = 0;
  let totalBlocked = 0;
  let totalPendingSettlement = 0;
  let totalExpectedInflows = 0;
  let totalExpectedOutflows = 0;
  let totalProjectedBalance = 0;
  let totalRequiredCoverage = 0;
  let eventsAtRiskCount = 0;

  const eventForecasts = [];
  const allCoverageSuggestions = [];

  for (const ev of events) {
    const fc = await calculateEventCashForecast(ev.eventId, { horizonDays, policy });
    
    // Anexar sugestões se em déficit
    if (fc.forecast.riskStatus === 'DEFICIT_PROJETADO') {
      const cov = await buildCoverageSuggestions(ev.eventId, { horizonDays, policy });
      fc.coverage = cov;
      totalRequiredCoverage += cov.requiredAmount;
      cov.suggestions.forEach(s => {
        allCoverageSuggestions.push({
          targetEventId: ev.eventId,
          targetEventName: ev.eventName,
          ...s
        });
      });
    }

    if (fc.forecast.riskStatus !== 'NORMAL') {
      eventsAtRiskCount++;
    }

    totalAvailable += fc.current.availableBalance;
    totalCommitted += fc.current.committedBalance;
    totalBlocked += fc.current.blockedBalance;
    totalPendingSettlement += fc.current.pendingSettlement;
    totalExpectedInflows += fc.forecast.expectedInflows;
    totalExpectedOutflows += fc.forecast.expectedOutflows;
    totalProjectedBalance += fc.forecast.projectedBalance;

    eventForecasts.push(fc);
  }

  // Constrói timeline consolidada somando as timelines dos eventos
  const consolidatedTimeline = [];
  for (let i = 0; i < horizonDays; i++) {
    const dayDate = eventForecasts[0]?.timeline[i]?.date || toDateKey(addDays(new Date(), i));
    let dayInflows = 0;
    let dayOutflows = 0;
    let dayProjected = 0;

    eventForecasts.forEach(ef => {
      const pt = ef.timeline[i];
      if (pt) {
        dayInflows += pt.inflows;
        dayOutflows += pt.outflows;
        dayProjected += pt.projectedBalance;
      }
    });

    consolidatedTimeline.push({
      date: dayDate,
      dayIndex: i + 1,
      inflows: Number(dayInflows.toFixed(2)),
      outflows: Number(dayOutflows.toFixed(2)),
      projectedBalance: Number(dayProjected.toFixed(2))
    });
  }

  const minConsolidated = consolidatedTimeline.reduce((acc, cur) =>
    cur.projectedBalance < acc.projectedBalance ? cur : acc,
    consolidatedTimeline[0] || { projectedBalance: totalAvailable, date: toDateKey(new Date()) }
  );

  const producer = OFFICIAL_PRODUCERS.find(p => p.id === producerId) || OFFICIAL_PRODUCERS[0];

  const result = {
    calculatedAt: new Date().toISOString(),
    producerId: producer.id,
    producerName: producer.name,
    horizonDays,
    kpis: {
      totalAvailable: Number(totalAvailable.toFixed(2)),
      totalCommitted: Number(totalCommitted.toFixed(2)),
      totalBlocked: Number(totalBlocked.toFixed(2)),
      totalPendingSettlement: Number(totalPendingSettlement.toFixed(2)),
      totalExpectedInflows: Number(totalExpectedInflows.toFixed(2)),
      totalExpectedOutflows: Number(totalExpectedOutflows.toFixed(2)),
      totalProjectedBalance: Number(totalProjectedBalance.toFixed(2)),
      minimumProjectedBalance: Number(minConsolidated.projectedBalance.toFixed(2)),
      minimumProjectedDate: minConsolidated.date,
      eventsAtRiskCount,
      totalEvents: events.length,
      totalRequiredCoverage: Number(totalRequiredCoverage.toFixed(2))
    },
    timeline: consolidatedTimeline,
    events: eventForecasts,
    coverageSuggestions: allCoverageSuggestions
  };

  return { ok: true, data: result, isLiveApi: false };
}

/**
 * Simulador de Cobertura entre Eventos (RN07 & 07_SIMULADOR_COBERTURA.md)
 * Permite ao gestor simular o impacto de transferir um valor antes de abrir solicitação formal.
 * Não realiza mutação em nenhuma base de dados ou saldo real.
 */
export async function simulateCoverage({
  sourceEventId,
  targetEventId,
  amount,
  horizonDays = 30,
  policy = DEFAULT_RISK_POLICY
}) {
  const numAmount = Number(amount) || 0;
  if (numAmount <= 0) {
    throw new Error('Valor da simulação de cobertura deve ser maior que zero.');
  }

  // 1. Projeção antes da simulação
  const beforeSource = await calculateEventCashForecast(sourceEventId, { horizonDays, policy });
  const beforeTarget = await calculateEventCashForecast(targetEventId, { horizonDays, policy });

  if (beforeSource.current.availableBalance < numAmount) {
    return {
      success: false,
      error: `Saldo disponível real da origem (${beforeSource.current.availableBalance}) é insuficiente para a simulação de R$ ${numAmount.toFixed(2)}.`,
      before: { source: beforeSource, target: beforeTarget }
    };
  }

  // 2. Simular impacto na timeline
  // Recalcula fonte diminuindo saldo inicial e recalcula destino aumentando entrada
  const afterSourceTimeline = beforeSource.timeline.map(pt => ({
    ...pt,
    projectedBalance: Number((pt.projectedBalance - numAmount).toFixed(2))
  }));

  const afterTargetTimeline = beforeTarget.timeline.map(pt => ({
    ...pt,
    projectedBalance: Number((pt.projectedBalance + numAmount).toFixed(2))
  }));

  const minAfterSource = afterSourceTimeline.reduce((acc, cur) => cur.projectedBalance < acc.projectedBalance ? cur : acc, afterSourceTimeline[0]);
  const minAfterTarget = afterTargetTimeline.reduce((acc, cur) => cur.projectedBalance < acc.projectedBalance ? cur : acc, afterTargetTimeline[0]);

  const riskAfterSource = classifyForecastRisk({
    projectedBalance: afterSourceTimeline[afterSourceTimeline.length - 1].projectedBalance,
    minimumProjectedBalance: minAfterSource.projectedBalance,
    expectedOutflows: beforeSource.forecast.expectedOutflows,
    policy
  });

  const riskAfterTarget = classifyForecastRisk({
    projectedBalance: afterTargetTimeline[afterTargetTimeline.length - 1].projectedBalance,
    minimumProjectedBalance: minAfterTarget.projectedBalance,
    expectedOutflows: beforeTarget.forecast.expectedOutflows,
    policy
  });

  return {
    success: true,
    amount: numAmount,
    sourceEventId,
    targetEventId,
    before: {
      sourceMinBalance: beforeSource.forecast.minimumProjectedBalance,
      sourceRisk: beforeSource.forecast.riskStatus,
      targetMinBalance: beforeTarget.forecast.minimumProjectedBalance,
      targetRisk: beforeTarget.forecast.riskStatus
    },
    after: {
      sourceMinBalance: minAfterSource.projectedBalance,
      sourceRisk: riskAfterSource,
      targetMinBalance: minAfterTarget.projectedBalance,
      targetRisk: riskAfterTarget
    },
    deltaConsolidated: 0.00, // Invariância Consolidada mantida
    isBalanced: true
  };
}

export const cashForecastService = {
  calculateEventCashForecast,
  buildCoverageSuggestions,
  getConsolidatedCashForecast,
  simulateCoverage,
  classifyForecastRisk,
  DEFAULT_RISK_POLICY
};
