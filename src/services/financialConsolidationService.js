/**
 * ============================================================================
 * DISK — IMPLANTAÇÃO 5: SERVIÇO DE CONSOLIDAÇÃO FINANCEIRA, TAXAS E CUSTOS
 * (src/services/financialConsolidationService.js)
 * 
 * Camada financeira consolidada baseada no fluxo real:
 * VENDA → PAGAMENTO → TAXAS → CUSTOS → ESTORNOS → SALDO → REPASSE → CONCILIAÇÃO
 * 
 * Princípios Fundamentais:
 * 1. Cada Evento possui saldo próprio; saldo consolidado é agregação sem "bolsão".
 * 2. Venda não é saldo.
 * 3. Dinheiro do produtor não é receita da Disk.
 * 4. Taxa administrativa Disk não é custo de cartão/gateway (MDR/adquirentes).
 * 5. Estorno não é chargeback (são eventos distintos).
 * 6. Fonte da verdade unificada: Ledger contábil + eventBalanceService.
 * ============================================================================
 */

import { eventBalanceService, OFFICIAL_PRODUCERS } from './eventBalanceService.js';
import { accessAuditService } from './accessAuditService.js';
import { eventFeeRulesService } from './eventFeeRulesService.js';

// Catálogo e histórico de regras de taxa Disk por produtor e evento
let DISK_FEE_RULES = [
  // Regra padrão do Produtor 1 (15%)
  {
    id: 'RULE-PROD-1-DEFAULT',
    targetId: 'prod-1',
    producerId: 'prod-1',
    eventId: null,
    feeType: 'PERCENTAGE',
    rateType: 'PERCENTUAL',
    rate: 15.0,
    value: 15.0,
    calculationBase: 'GROSS_SALES',
    isOverridden: false,
    active: true,
    validFrom: '2026-01-01T00:00:00.000Z',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    updatedBy: 'Carlos Lima (Gestor Financeiro)',
    history: [
      {
        version: 1,
        feeType: 'PERCENTAGE',
        rateType: 'PERCENTUAL',
        rate: 15.0,
        value: 15.0,
        previousRate: null,
        newRate: 15.0,
        calculationBase: 'GROSS_SALES',
        effectiveDate: '2026-01-01T00:00:00.000Z',
        timestamp: '2026-01-01T00:00:00.000Z',
        targetId: 'prod-1',
        actorName: 'Carlos Lima',
        changedBy: { id: 'user-admin-carlos', name: 'Carlos Lima', role: 'GESTOR_FINANCEIRO' },
        justification: 'Contrato comercial inicial padrão DiskIngressos 2026.',
        reason: 'Contrato comercial inicial padrão DiskIngressos 2026.'
      }
    ]
  },
  // Regra específica sobrescrita para Evento 3195 (Knife Show - 12%)
  {
    id: 'RULE-EV-3195',
    targetId: '3195',
    producerId: 'prod-1',
    eventId: '3195',
    feeType: 'PERCENTAGE',
    rateType: 'PERCENTUAL',
    rate: 12.0,
    value: 12.0,
    calculationBase: 'GROSS_SALES',
    isOverridden: true,
    active: true,
    validFrom: '2026-02-01T00:00:00.000Z',
    effectiveFrom: '2026-02-01T00:00:00.000Z',
    updatedBy: 'Carlos Lima (Gestor Financeiro)',
    history: [
      {
        version: 1,
        feeType: 'PERCENTAGE',
        rateType: 'PERCENTUAL',
        rate: 12.0,
        value: 12.0,
        previousRate: 15.0,
        newRate: 12.0,
        calculationBase: 'GROSS_SALES',
        effectiveDate: '2026-02-01T00:00:00.000Z',
        timestamp: '2026-02-01T00:00:00.000Z',
        targetId: '3195',
        actorName: 'Carlos Lima',
        changedBy: { id: 'user-admin-carlos', name: 'Carlos Lima', role: 'GESTOR_FINANCEIRO' },
        justification: 'Negociação especial Knife Show 2026: taxa reduzida para 12%.',
        reason: 'Negociação especial Knife Show 2026: taxa reduzida para 12%.'
      }
    ]
  },
  // Regra específica sobrescrita para Evento 3178 (Feijoada e Costela - 10%)
  {
    id: 'RULE-EV-3178',
    targetId: '3178',
    producerId: 'prod-1',
    eventId: '3178',
    feeType: 'PERCENTAGE',
    rateType: 'PERCENTUAL',
    rate: 10.0,
    value: 10.0,
    calculationBase: 'GROSS_SALES',
    isOverridden: true,
    active: true,
    validFrom: '2026-03-01T00:00:00.000Z',
    effectiveFrom: '2026-03-01T00:00:00.000Z',
    updatedBy: 'Carlos Lima (Gestor Financeiro)',
    history: [
      {
        version: 1,
        feeType: 'PERCENTAGE',
        rateType: 'PERCENTUAL',
        rate: 10.0,
        value: 10.0,
        previousRate: 15.0,
        newRate: 10.0,
        calculationBase: 'GROSS_SALES',
        effectiveDate: '2026-03-01T00:00:00.000Z',
        timestamp: '2026-03-01T00:00:00.000Z',
        targetId: '3178',
        actorName: 'Carlos Lima',
        changedBy: { id: 'user-admin-carlos', name: 'Carlos Lima', role: 'GESTOR_FINANCEIRO' },
        justification: 'Parceria de gastronomia e lazer: taxa 10%.',
        reason: 'Parceria de gastronomia e lazer: taxa 10%.'
      }
    ]
  },
  // Regra fixa por ingresso para Evento 934 (Show Rock Nacional - R$ 5,00/ingresso)
  {
    id: 'RULE-EV-934',
    targetId: '934',
    producerId: 'prod-1',
    eventId: '934',
    feeType: 'FIXED_PER_TICKET',
    rateType: 'VALOR_FIXO',
    rate: 5.00,
    value: 5.00,
    calculationBase: 'QUANTIDADE_INGRESSOS',
    isOverridden: true,
    active: true,
    validFrom: '2026-03-01T00:00:00.000Z',
    effectiveFrom: '2026-03-01T00:00:00.000Z',
    updatedBy: 'Carlos Lima (Gestor Financeiro)',
    history: [
      {
        version: 1,
        feeType: 'FIXED_PER_TICKET',
        rateType: 'VALOR_FIXO',
        rate: 5.00,
        value: 5.00,
        previousRate: 15.0,
        newRate: 5.00,
        calculationBase: 'QUANTIDADE_INGRESSOS',
        effectiveDate: '2026-03-01T00:00:00.000Z',
        timestamp: '2026-03-01T00:00:00.000Z',
        targetId: '934',
        actorName: 'Carlos Lima',
        changedBy: { id: 'user-admin-carlos', name: 'Carlos Lima', role: 'GESTOR_FINANCEIRO' },
        justification: 'Taxa fixa por ingresso R$ 5,00 para evento acústico.',
        reason: 'Taxa fixa por ingresso R$ 5,00 para evento acústico.'
      }
    ]
  },
  // Regra padrão do Produtor 2 (CWB Brasil - 10%)
  {
    id: 'RULE-PROD-2-DEFAULT',
    targetId: 'prod-2',
    producerId: 'prod-2',
    eventId: null,
    feeType: 'PERCENTAGE',
    rateType: 'PERCENTUAL',
    rate: 10.0,
    value: 10.0,
    calculationBase: 'GROSS_SALES',
    isOverridden: false,
    active: true,
    validFrom: '2026-01-01T00:00:00.000Z',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    updatedBy: 'Carlos Lima (Gestor Financeiro)',
    history: [
      {
        version: 1,
        feeType: 'PERCENTAGE',
        rateType: 'PERCENTUAL',
        rate: 10.0,
        value: 10.0,
        previousRate: null,
        newRate: 10.0,
        calculationBase: 'GROSS_SALES',
        effectiveDate: '2026-01-01T00:00:00.000Z',
        timestamp: '2026-01-01T00:00:00.000Z',
        targetId: 'prod-2',
        actorName: 'Administrador Master',
        changedBy: { id: 'user-admin-master', name: 'Administrador Master', role: 'ADMINISTRADOR' },
        justification: 'Contrato corporativo CWB Brasil.',
        reason: 'Contrato corporativo CWB Brasil.'
      }
    ]
  }
];

// Tabela de taxas de custos de meios de pagamento e canais
export const PAYMENT_COST_CONFIG = {
  methods: {
    PIX: { mdrPercent: 0.99, fixedFee: 0.00, label: 'PIX Instantâneo' },
    CREDITO_A_VISTA: { mdrPercent: 2.80, fixedFee: 0.39, label: 'Crédito à Vista (1x)' },
    CREDITO_PARCELADO: { mdrPercent: 3.50, fixedFee: 0.39, installmentAddon: 1.20, label: 'Crédito Parcelado' },
    DEBITO: { mdrPercent: 1.50, fixedFee: 0.25, label: 'Cartão de Débito' }
  },
  channels: {
    ONLINE: { antifraudFee: 0.50, gatewayFee: 0.35, label: 'Canal Online (Web/App)' },
    BILHETERIA: { posTerminalFee: 0.00, gatewayFee: 0.15, label: 'Bilheteria Física (POS)' },
    POS: { posTerminalFee: 0.00, gatewayFee: 0.15, label: 'Bilheteria Física (POS)' },
    AGENCIA: { partnerCommissionPercent: 3.00, label: 'Pontos de Venda / Agências' }
  },
  acquirers: {
    CIELO: { name: 'Cielo', defaultMdrDiscount: 0.0 },
    REDE: { name: 'Rede', defaultMdrDiscount: 0.1 },
    PAGSEGURO: { name: 'PagBank / PagSeguro', defaultMdrDiscount: 0.0 },
    STONE: { name: 'Stone', defaultMdrDiscount: 0.05 }
  }
};

// Dados detalhados por evento integrados ao Ledger
const EVENTS_FINANCIAL_DETAIL = {
  '3368': {
    id: '3368',
    eventId: '3368',
    name: 'Experiencia Música e Natureza - Julho',
    eventName: 'Experiencia Música e Natureza - Julho',
    producerId: 'prod-1',
    producerName: 'Parque Jaime Lerner',
    status: 'ATIVO',
    ticketsSold: 1250,
    grossSales: 125000.00,
    refundsRequested: 3500.00,
    refundsProcessed: 2400.00,
    refunds: 2400.00,
    chargebacks: 850.00,
    paidOutAmount: 60000.00,
    paidOut: 60000.00,
    reserves: 5000.00,
    committedFunds: 4500.00,
    channels: {
      online: { tickets: 950, amount: 95000.00, cost: 2950.00 },
      pos: { tickets: 250, amount: 25000.00, cost: 520.00 },
      agency: { tickets: 50, amount: 5000.00, cost: 230.00 }
    }
  },
  '3195': {
    id: '3195',
    eventId: '3195',
    name: '9º Knife Show Curitiba - Feira e Exposição de Facas',
    eventName: '9º Knife Show Curitiba - Feira e Exposição de Facas',
    producerId: 'prod-1',
    producerName: 'Parque Jaime Lerner',
    status: 'ATIVO',
    ticketsSold: 880,
    grossSales: 70400.00,
    refundsRequested: 1200.00,
    refundsProcessed: 1200.00,
    refunds: 1200.00,
    chargebacks: 0.00,
    paidOutAmount: 35000.00,
    paidOut: 35000.00,
    reserves: 2500.00,
    committedFunds: 2000.00,
    channels: {
      online: { tickets: 600, amount: 48000.00, cost: 1490.00 },
      pos: { tickets: 280, amount: 22400.00, cost: 460.00 }
    }
  },
  '3178': {
    id: '3178',
    eventId: '3178',
    name: 'Feijoada e Costela assada - PETFRIENDLY',
    eventName: 'Feijoada e Costela assada - PETFRIENDLY',
    producerId: 'prod-1',
    producerName: 'Parque Jaime Lerner',
    status: 'ATIVO',
    ticketsSold: 954,
    grossSales: 47700.00,
    refundsRequested: 600.00,
    refundsProcessed: 600.00,
    refunds: 600.00,
    chargebacks: 250.00,
    paidOutAmount: 20000.00,
    paidOut: 20000.00,
    reserves: 1500.00,
    committedFunds: 1200.00,
    channels: {
      online: { tickets: 750, amount: 37500.00, cost: 1160.00 },
      pos: { tickets: 204, amount: 10200.00, cost: 215.00 }
    }
  },
  '934': {
    id: '934',
    eventId: '934',
    name: 'Rebobinando - Show Rock Nacional Curitiba',
    eventName: 'Rebobinando - Show Rock Nacional Curitiba',
    producerId: 'prod-1',
    producerName: 'Parque Jaime Lerner',
    status: 'ATIVO',
    ticketsSold: 500,
    grossSales: 25000.00,
    refundsRequested: 300.00,
    refundsProcessed: 300.00,
    refunds: 300.00,
    chargebacks: 0.00,
    paidOutAmount: 8000.00,
    paidOut: 8000.00,
    reserves: 1000.00,
    committedFunds: 500.00,
    channels: {
      online: { tickets: 400, amount: 20000.00, cost: 620.00 },
      pos: { tickets: 100, amount: 5000.00, cost: 105.00 }
    }
  },
  '3042': {
    id: '3042',
    eventId: '3042',
    name: 'Festival Rock Nacional Curitiba 2026',
    eventName: 'Festival Rock Nacional Curitiba 2026',
    producerId: 'prod-2',
    producerName: 'Live Curitiba Entretenimento',
    status: 'ATIVO',
    ticketsSold: 3000,
    grossSales: 450000.00,
    refundsRequested: 8000.00,
    refundsProcessed: 6000.00,
    refunds: 6000.00,
    chargebacks: 1500.00,
    paidOutAmount: 220000.00,
    paidOut: 220000.00,
    reserves: 15000.00,
    committedFunds: 12000.00,
    channels: {
      online: { tickets: 2600, amount: 390000.00, cost: 12100.00 },
      pos: { tickets: 400, amount: 60000.00, cost: 1260.00 }
    }
  },
  '3043': {
    id: '3043',
    eventId: '3043',
    name: 'Stand-up Comedy Gala CWB',
    eventName: 'Stand-up Comedy Gala CWB',
    producerId: 'prod-2',
    producerName: 'Live Curitiba Entretenimento',
    status: 'ATIVO',
    ticketsSold: 1200,
    grossSales: 96000.00,
    refundsRequested: 1800.00,
    refundsProcessed: 1800.00,
    refunds: 1800.00,
    chargebacks: 0.00,
    paidOutAmount: 48000.00,
    paidOut: 48000.00,
    reserves: 4000.00,
    committedFunds: 3000.00,
    channels: {
      online: { tickets: 1100, amount: 88000.00, cost: 2730.00 },
      pos: { tickets: 100, amount: 8000.00, cost: 170.00 }
    }
  }
};

export const financialConsolidationService = {
  /**
   * Obtém a lista de eventos no escopo
   */
  getEventsInScope(producerId = null) {
    let list = Object.values(EVENTS_FINANCIAL_DETAIL);
    if (producerId && producerId !== 'TODOS') {
      list = list.filter(e => e.producerId === producerId);
    }
    return list.map(e => ({ eventId: e.id, eventName: e.name }));
  },

  /**
   * Obtém a regra de taxa Disk vigente para o produtor/evento
   */
  getFeeRule(targetIdOrProducerId = 'DEFAULT', maybeEventId = null) {
    const target = String(maybeEventId || targetIdOrProducerId);
    if (target && target !== 'DEFAULT') {
      const specific = DISK_FEE_RULES.find(r => r.active && (r.eventId === target || r.targetId === target || r.producerId === target));
      if (specific) {
        return {
          ...specific,
          rate: specific.rate !== undefined ? specific.rate : specific.value,
          value: specific.value !== undefined ? specific.value : specific.rate,
          feeType: specific.feeType || specific.rateType || 'PERCENTAGE',
          isInherited: false
        };
      }
    }

    const defaultRule = DISK_FEE_RULES.find(r => r.active && (r.producerId === targetIdOrProducerId || r.targetId === 'DEFAULT'));
    if (defaultRule) {
      return {
        ...defaultRule,
        rate: defaultRule.rate !== undefined ? defaultRule.rate : defaultRule.value,
        value: defaultRule.value !== undefined ? defaultRule.value : defaultRule.rate,
        feeType: defaultRule.feeType || defaultRule.rateType || 'PERCENTAGE',
        isInherited: true
      };
    }

    return {
      id: 'RULE-DEFAULT-PLATFORM',
      targetId: 'DEFAULT',
      producerId: 'default',
      eventId: null,
      feeType: 'PERCENTAGE',
      rateType: 'PERCENTUAL',
      rate: 15.0,
      value: 15.0,
      calculationBase: 'GROSS_SALES',
      isOverridden: false,
      isInherited: true,
      active: true,
      validFrom: '2026-01-01T00:00:00.000Z',
      history: []
    };
  },

  /**
   * Calcula o valor da taxa Disk com base na regra configurada (sem hardcoding de 15%)
   * Suporta tanto calculateDiskFee(amount, rule, tickets) quanto calculateDiskFee({ amount, ticketCount, ... })
   */
  calculateDiskFee(amountOrObj, maybeRule = null, maybeTicketCount = 0) {
    let amount = 0;
    let ticketCount = 0;
    let rule = null;
    let producerId = 'prod-1';
    let eventId = null;

    if (typeof amountOrObj === 'object' && amountOrObj !== null) {
      amount = amountOrObj.amount || amountOrObj.gross || 0;
      ticketCount = amountOrObj.ticketCount || amountOrObj.tickets || 0;
      producerId = amountOrObj.producerId || 'prod-1';
      eventId = amountOrObj.eventId || null;
      rule = amountOrObj.rule || this.getFeeRule(eventId || producerId);
    } else {
      amount = Number(amountOrObj) || 0;
      rule = maybeRule || this.getFeeRule(producerId, eventId);
      ticketCount = Number(maybeTicketCount) || 0;
    }

    const numAmount = Number(amount) || 0;
    const numTickets = Number(ticketCount) || 0;
    let calculatedFee = 0;
    let formulaDesc = '';

    const rateType = rule.feeType || rule.rateType || 'PERCENTAGE';
    const rateVal = rule.rate !== undefined ? rule.rate : (rule.value !== undefined ? rule.value : 15);
    const calcBase = rule.calculationBase || 'GROSS_SALES';

    if (rateType === 'PERCENTAGE' || rateType === 'PERCENTUAL' || rateType === 'PERCENT') {
      calculatedFee = Number(((numAmount * rateVal) / 100).toFixed(2));
      formulaDesc = `${rateVal}% sobre R$ ${numAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    } else if (rateType === 'FIXED_PER_TICKET' || rateType === 'VALOR_FIXO') {
      const multiplier = (calcBase === 'QUANTIDADE_INGRESSOS' || calcBase === 'TICKETS' || numTickets > 0) ? numTickets : 1;
      calculatedFee = Number((rateVal * multiplier).toFixed(2));
      formulaDesc = `R$ ${rateVal.toFixed(2)} fixos × ${multiplier} ingressos`;
    } else if (rateType === 'FIXED_EVENT' || rateType === 'VALOR_FIXO_EVENTO') {
      calculatedFee = Number(rateVal.toFixed(2));
      formulaDesc = `R$ ${rateVal.toFixed(2)} fixo por evento`;
    }

    return {
      diskFee: calculatedFee,
      calculatedFee,
      ruleId: rule.id || 'RULE',
      rateType,
      feeType: rateType,
      rateValue: rateVal,
      rate: rateVal,
      calculationBase: calcBase,
      isInherited: Boolean(rule.isInherited),
      formulaDesc
    };
  },

  /**
   * Configura ou atualiza regra de taxa Disk com histórico e auditoria imutável
   */
  setFeeRule(payload) {
    const targetId = payload.targetId || (payload.eventId ? String(payload.eventId) : payload.producerId) || 'DEFAULT';
    const feeType = payload.feeType || payload.rateType || 'PERCENTAGE';
    const rateVal = Number(payload.rate !== undefined ? payload.rate : payload.value) || 15;
    const calculationBase = payload.calculationBase || 'GROSS_SALES';
    const justification = payload.reason || payload.justification || 'Ajuste de taxa';
    const resolvedActor = payload.actor || { id: 'user-admin', name: 'Administrador', profile: 'GESTOR_FINANCEIRO' };

    const now = new Date().toISOString();
    let existing = DISK_FEE_RULES.find(r => r.active && (r.targetId === targetId || r.eventId === targetId || r.producerId === targetId));

    if (existing) {
      existing.active = false;
      existing.validTo = now;
      const prev = existing.rate !== undefined ? existing.rate : existing.value;
      const newVersion = (existing.history?.length || 0) + 1;

      const newHistoryItem = {
        version: newVersion,
        feeType,
        rateType: feeType,
        rate: rateVal,
        value: rateVal,
        previousRate: prev,
        newRate: rateVal,
        calculationBase,
        effectiveDate: now,
        timestamp: now,
        targetId,
        actorName: resolvedActor.name,
        changedBy: { id: resolvedActor.id, name: resolvedActor.name, role: resolvedActor.profile || resolvedActor.role },
        justification,
        reason: justification
      };

      const updatedHistory = [...(existing.history || []), newHistoryItem];

      const newRule = {
        id: `RULE-${targetId}-V${newVersion}`,
        targetId,
        producerId: existing.producerId || targetId,
        eventId: targetId !== 'DEFAULT' && targetId !== 'prod-1' && targetId !== 'prod-2' ? targetId : null,
        feeType,
        rateType: feeType,
        rate: rateVal,
        value: rateVal,
        calculationBase,
        isOverridden: targetId !== 'DEFAULT',
        active: true,
        validFrom: now,
        effectiveFrom: now,
        updatedBy: resolvedActor.name,
        history: updatedHistory
      };
      DISK_FEE_RULES.push(newRule);

      accessAuditService.log({
        actorId: resolvedActor.id,
        actorName: resolvedActor.name,
        actorRole: resolvedActor.profile || 'GESTOR_FINANCEIRO',
        action: 'UPDATE_DISK_FEE_RULE',
        details: `Regra de taxa ${targetId} alterada para ${feeType} (${rateVal}). Justificativa: ${justification}`
      });

      try {
        const mappedType = feeType === 'FIXED_PER_TICKET' ? 'FIXED_PER_TICKET' : (feeType === 'FIXED_EVENT' ? 'FIXED_EVENT' : 'PERCENT');
        eventFeeRulesService.upsert({
          eventId: targetId !== 'DEFAULT' && targetId !== 'prod-1' && targetId !== 'prod-2' ? targetId : null,
          producerId: existing?.producerId || (targetId.startsWith('prod-') ? targetId : 'prod-1'),
          type: mappedType,
          value: rateVal,
          base: calculationBase,
          effectiveFrom: now.slice(0, 10),
          effectiveTo: null
        }, resolvedActor.name);
      } catch (_) {}

      return { ok: true, data: newRule, ...newRule };
    } else {
      const newRule = {
        id: `RULE-${targetId}-${Date.now()}`,
        targetId,
        producerId: targetId,
        eventId: targetId !== 'DEFAULT' && targetId !== 'prod-1' && targetId !== 'prod-2' ? targetId : null,
        feeType,
        rateType: feeType,
        rate: rateVal,
        value: rateVal,
        calculationBase,
        isOverridden: true,
        active: true,
        validFrom: now,
        effectiveFrom: now,
        updatedBy: resolvedActor.name,
        history: [
          {
            version: 1,
            feeType,
            rateType: feeType,
            rate: rateVal,
            value: rateVal,
            previousRate: null,
            newRate: rateVal,
            calculationBase,
            effectiveDate: now,
            timestamp: now,
            targetId,
            actorName: resolvedActor.name,
            changedBy: { id: resolvedActor.id, name: resolvedActor.name, role: resolvedActor.profile || resolvedActor.role },
            justification,
            reason: justification
          }
        ]
      };
      DISK_FEE_RULES.push(newRule);

      try {
        const mappedType = feeType === 'FIXED_PER_TICKET' ? 'FIXED_PER_TICKET' : (feeType === 'FIXED_EVENT' ? 'FIXED_EVENT' : 'PERCENT');
        eventFeeRulesService.upsert({
          eventId: targetId !== 'DEFAULT' && targetId !== 'prod-1' && targetId !== 'prod-2' ? targetId : null,
          producerId: targetId.startsWith('prod-') ? targetId : 'prod-1',
          type: mappedType,
          value: rateVal,
          base: calculationBase,
          effectiveFrom: now.slice(0, 10),
          effectiveTo: null
        }, resolvedActor.name);
      } catch (_) {}

      return { ok: true, data: newRule, ...newRule };
    }
  },

  /**
   * Obtém histórico completo de versões
   */
  getFeeRuleHistory(targetId = 'DEFAULT') {
    const rule = this.getFeeRule(targetId);
    return rule.history || [];
  },

  /**
   * Calcula custos de processamento (MDR, adquirentes, canais)
   */
  calculatePaymentCosts(amountOrObj = 0, maybeTickets = 0) {
    let amount = 0;
    let method = 'CREDITO_A_VISTA';
    let channel = 'ONLINE';
    let installments = 1;
    let acquirer = 'CIELO';

    if (typeof amountOrObj === 'object' && amountOrObj !== null) {
      amount = Number(amountOrObj.amount) || 0;
      method = amountOrObj.method || 'CREDITO_A_VISTA';
      channel = amountOrObj.channel || 'ONLINE';
      installments = amountOrObj.installments || 1;
      acquirer = amountOrObj.acquirer || 'CIELO';
    } else {
      amount = Number(amountOrObj) || 0;
    }

    const numAmount = Number(amount) || 0;
    const mConfig = PAYMENT_COST_CONFIG.methods[method] || PAYMENT_COST_CONFIG.methods.CREDITO_A_VISTA;
    const cConfig = PAYMENT_COST_CONFIG.channels[channel] || PAYMENT_COST_CONFIG.channels.ONLINE;

    let mdr = mConfig.mdrPercent || 2.5;
    if (installments > 1 && mConfig.installmentAddon) {
      mdr += (installments - 1) * mConfig.installmentAddon;
    }

    const mdrCost = Number(((numAmount * mdr) / 100).toFixed(2));
    const fixedCost = Number((mConfig.fixedFee || 0).toFixed(2));
    const channelCost = Number(((cConfig.antifraudFee || 0) + (cConfig.gatewayFee || 0)).toFixed(2));
    const totalCost = Number((mdrCost + fixedCost + channelCost).toFixed(2));

    return {
      method,
      channel,
      acquirer,
      amount: numAmount,
      mdrPercent: mdr,
      mdrCost,
      fixedCost,
      channelCost,
      totalCost,
      totalCosts: totalCost
    };
  },

  /**
   * VISÃO DISK — PRODUTOR: Saldo Consolidado do Produtor
   */
  getProducerConsolidatedBalance(producerId = 'prod-1') {
    const events = Object.values(EVENTS_FINANCIAL_DETAIL).filter(e => !producerId || producerId === 'TODOS' || e.producerId === producerId);

    let grossSalesSum = 0;
    let diskFeesSum = 0;
    let paymentCostsSum = 0;
    let refundsSum = 0;
    let chargebacksSum = 0;
    let paidOutSum = 0;
    let committedSum = 0;
    let reservesSum = 0;
    let availableSum = 0;
    let futureSum = 0;

    const eventsBreakdown = events.map(ev => {
      const feeCalc = this.calculateDiskFee({ amount: ev.grossSales, ticketCount: ev.ticketsSold, eventId: ev.id });
      const paymentCostTotal = Object.values(ev.channels || {}).reduce((acc, c) => acc + (c.cost || 0), 0);
      const producerFunds = Math.round((ev.grossSales - feeCalc.diskFee - paymentCostTotal - ev.refunds - ev.chargebacks) * 100) / 100;
      const available = Math.round((producerFunds - ev.paidOut - ev.committedFunds - ev.reserves) * 100) / 100;
      const future = Math.round((ev.grossSales * 0.20) * 100) / 100;

      grossSalesSum += ev.grossSales;
      diskFeesSum += feeCalc.diskFee;
      paymentCostsSum += paymentCostTotal;
      refundsSum += ev.refunds;
      chargebacksSum += ev.chargebacks;
      paidOutSum += ev.paidOut;
      committedSum += ev.committedFunds;
      reservesSum += ev.reserves;
      availableSum += available;
      futureSum += future;

      return {
        eventId: ev.id,
        eventName: ev.name,
        producerId: ev.producerId,
        producerName: ev.producerName,
        status: ev.status,
        ticketsSold: ev.ticketsSold,
        grossSales: ev.grossSales,
        diskFee: feeCalc.diskFee,
        feeFormula: feeCalc.formulaDesc,
        paymentCosts: paymentCostTotal,
        refunds: ev.refunds,
        chargebacks: ev.chargebacks,
        producerFunds,
        paidOut: ev.paidOut,
        committedFunds: ev.committedFunds,
        reserves: ev.reserves,
        availableBalance: available,
        futureReceivables: future
      };
    });

    const totals = {
      grossSales: Math.round(grossSalesSum * 100) / 100,
      diskRevenue: Math.round(diskFeesSum * 100) / 100,
      diskFees: Math.round(diskFeesSum * 100) / 100,
      paymentCosts: Math.round(paymentCostsSum * 100) / 100,
      refunds: Math.round(refundsSum * 100) / 100,
      chargebacks: Math.round(chargebacksSum * 100) / 100,
      paidOut: Math.round(paidOutSum * 100) / 100,
      committedFunds: Math.round(committedSum * 100) / 100,
      reserves: Math.round(reservesSum * 100) / 100,
      availableBalance: Math.round(availableSum * 100) / 100,
      futureReceivables: Math.round(futureSum * 100) / 100
    };

    return {
      producerId,
      producerName: producerId === 'prod-1' ? 'Parque Jaime Lerner' : 'Live Curitiba Entretenimento',
      totals,
      summary: totals,
      events: eventsBreakdown
    };
  },

  /**
   * COMPOSIÇÃO FINANCEIRA DO EVENTO
   */
  getEventFinancialComposition(eventId) {
    const ev = EVENTS_FINANCIAL_DETAIL[String(eventId)] || EVENTS_FINANCIAL_DETAIL['3368'];
    const feeRule = this.getFeeRule(ev.id);
    const feeCalc = this.calculateDiskFee({ amount: ev.grossSales, ticketCount: ev.ticketsSold, rule: feeRule });
    const paymentCosts = Object.values(ev.channels || {}).reduce((acc, c) => acc + (c.cost || 0), 0);
    const producerFunds = Math.round((ev.grossSales - feeCalc.diskFee - paymentCosts - ev.refunds - ev.chargebacks) * 100) / 100;
    const availableBalance = Math.round((producerFunds - ev.paidOut - ev.committedFunds - ev.reserves) * 100) / 100;
    const futureReceivables = Math.round((ev.grossSales * 0.20) * 100) / 100;

    const data = {
      eventId: ev.id,
      eventName: ev.name,
      producerId: ev.producerId,
      producerName: ev.producerName,
      status: ev.status,
      grossSales: ev.grossSales,
      diskFee: feeCalc.diskFee,
      feeFormula: feeCalc.formulaDesc,
      paymentCosts,
      refunds: ev.refunds,
      chargebacks: ev.chargebacks,
      producerFunds,
      paidOut: ev.paidOut,
      reserves: ev.reserves,
      committedFunds: ev.committedFunds,
      availableBalance,
      futureReceivables,
      feeRule
    };

    return {
      ...data,
      composition: data
    };
  },

  /**
   * VISÃO DISK INTERNO: Posição Financeira Geral (Master)
   */
  getDiskMasterPosition(filters = {}) {
    let allEvents = Object.values(EVENTS_FINANCIAL_DETAIL);

    if (filters.producerId && filters.producerId !== 'TODOS') {
      allEvents = allEvents.filter(e => e.producerId === filters.producerId);
    }
    if (filters.eventId && filters.eventId !== 'TODOS') {
      allEvents = allEvents.filter(e => String(e.id) === String(filters.eventId));
    }

    let grossSalesSum = 0;
    let diskRevSum = 0;
    let costsSum = 0;
    let refundsSum = 0;
    let chargebacksSum = 0;
    let paidOutSum = 0;
    let committedSum = 0;
    let reservesSum = 0;
    let availableSum = 0;
    let producerFundsSum = 0;

    const eventRows = allEvents.map(ev => {
      const feeCalc = this.calculateDiskFee({ amount: ev.grossSales, ticketCount: ev.ticketsSold, eventId: ev.id });
      const paymentCost = Object.values(ev.channels || {}).reduce((acc, c) => acc + (c.cost || 0), 0);
      const producerFunds = Math.round((ev.grossSales - feeCalc.diskFee - paymentCost - ev.refunds - ev.chargebacks) * 100) / 100;
      const available = Math.round((producerFunds - ev.paidOut - ev.committedFunds - ev.reserves) * 100) / 100;
      const diskMargin = Math.round((feeCalc.diskFee - paymentCost) * 100) / 100;

      grossSalesSum += ev.grossSales;
      diskRevSum += feeCalc.diskFee;
      costsSum += paymentCost;
      refundsSum += ev.refunds;
      chargebacksSum += ev.chargebacks;
      paidOutSum += ev.paidOut;
      committedSum += ev.committedFunds;
      reservesSum += ev.reserves;
      availableSum += available;
      producerFundsSum += producerFunds;

      return {
        eventId: ev.id,
        eventName: ev.name,
        producerId: ev.producerId,
        producerName: ev.producerName,
        status: ev.status,
        grossSales: ev.grossSales,
        diskFee: feeCalc.diskFee,
        paymentCosts: paymentCost,
        diskMargin,
        refunds: ev.refunds,
        chargebacks: ev.chargebacks,
        producerFunds,
        paidOut: ev.paidOut,
        reserves: ev.reserves,
        committedFunds: ev.committedFunds,
        availableBalance: available,
        feeRule: feeCalc.rule,
        feeRate: feeCalc.rule ? (feeCalc.rule.rate ?? feeCalc.rate) : 15,
        feeType: feeCalc.rule ? (feeCalc.rule.feeType || 'PERCENTAGE') : 'PERCENTAGE'
      };
    });

    const totals = {
      grossSales: Math.round(grossSalesSum * 100) / 100,
      diskRevenue: Math.round(diskRevSum * 100) / 100,
      paymentCosts: Math.round(costsSum * 100) / 100,
      diskMargin: Math.round((diskRevSum - costsSum) * 100) / 100,
      producerFunds: Math.round(producerFundsSum * 100) / 100,
      producerLiability: Math.round((producerFundsSum - paidOutSum) * 100) / 100,
      refunds: Math.round(refundsSum * 100) / 100,
      chargebacks: Math.round(chargebacksSum * 100) / 100,
      reserves: Math.round(reservesSum * 100) / 100,
      paidOut: Math.round(paidOutSum * 100) / 100,
      availableBalance: Math.round(availableSum * 100) / 100
    };

    return {
      totals,
      kpis: totals,
      events: eventRows
    };
  },

  /**
   * CONSOLIDAÇÃO HIERÁRQUICA EM 3 NÍVEIS:
   * NÍVEL 1: Disk Ingressos (Master da Plataforma)
   * NÍVEL 2: Produtor (Custódia Transitória / Passivo Circulante)
   * NÍVEL 3: Evento Individual (Unidade Contábil / Ledger / Saldo Específico)
   */
  getConsolidatedHierarchy(filters = {}) {
    const master = this.getDiskMasterPosition(filters);

    const producersMap = {};
    master.events.forEach(ev => {
      const pid = ev.producerId || 'prod-outros';
      const pname = ev.producerName || 'Outro Produtor';
      if (!producersMap[pid]) {
        producersMap[pid] = {
          producerId: pid,
          producerName: pname,
          totals: {
            grossSales: 0,
            diskFee: 0,
            paymentCosts: 0,
            diskMargin: 0,
            refunds: 0,
            chargebacks: 0,
            producerFunds: 0,
            paidOut: 0,
            reserves: 0,
            committedFunds: 0,
            availableBalance: 0
          },
          events: []
        };
      }

      const p = producersMap[pid];
      p.events.push(ev);
      p.totals.grossSales = Math.round((p.totals.grossSales + ev.grossSales) * 100) / 100;
      p.totals.diskFee = Math.round((p.totals.diskFee + ev.diskFee) * 100) / 100;
      p.totals.paymentCosts = Math.round((p.totals.paymentCosts + ev.paymentCosts) * 100) / 100;
      p.totals.diskMargin = Math.round((p.totals.diskMargin + ev.diskMargin) * 100) / 100;
      p.totals.refunds = Math.round((p.totals.refunds + ev.refunds) * 100) / 100;
      p.totals.chargebacks = Math.round((p.totals.chargebacks + ev.chargebacks) * 100) / 100;
      p.totals.producerFunds = Math.round((p.totals.producerFunds + ev.producerFunds) * 100) / 100;
      p.totals.paidOut = Math.round((p.totals.paidOut + ev.paidOut) * 100) / 100;
      p.totals.reserves = Math.round((p.totals.reserves + ev.reserves) * 100) / 100;
      p.totals.committedFunds = Math.round((p.totals.committedFunds + ev.committedFunds) * 100) / 100;
      p.totals.availableBalance = Math.round((p.totals.availableBalance + ev.availableBalance) * 100) / 100;
    });

    const producersList = Object.values(producersMap);

    return {
      level1_disk: {
        entityType: 'DISK_INGRESSOS_MASTER',
        title: 'Disk Ingressos (Consolidado Master)',
        totals: master.totals,
        producerCount: producersList.length,
        eventCount: master.events.length
      },
      level2_producers: producersList,
      level3_events: master.events
    };
  },

  /**
   * DETALHAMENTO DE TAXAS E CUSTOS
   */
  getFeesAndCostsBreakdown(filters = {}) {
    const master = this.getDiskMasterPosition(filters);
    const avgDiskFee = master.totals.grossSales > 0 ? (master.totals.diskRevenue / master.totals.grossSales) * 100 : 14.12;
    const avgPaymentCost = master.totals.grossSales > 0 ? (master.totals.paymentCosts / master.totals.grossSales) * 100 : 2.68;
    const avgSpread = avgDiskFee - avgPaymentCost;

    const costsList = [
      { channel: 'Online (Web/App)', method: 'PIX Instantâneo', acquirer: 'Cielo', mdr: 0.99, fixedCost: 0.00, antifraudCost: 0.50, totalEstimatedPercent: 1.49 },
      { channel: 'Online (Web/App)', method: 'Crédito à Vista (1x)', acquirer: 'Rede', mdr: 2.80, fixedCost: 0.39, antifraudCost: 0.50, totalEstimatedPercent: 3.69 },
      { channel: 'Online (Web/App)', method: 'Crédito Parcelado (2-6x)', acquirer: 'Cielo', mdr: 4.70, fixedCost: 0.39, antifraudCost: 0.50, totalEstimatedPercent: 5.59 },
      { channel: 'Bilheteria Física (POS)', method: 'Débito Maquininha', acquirer: 'Stone', mdr: 1.50, fixedCost: 0.15, antifraudCost: 0.00, totalEstimatedPercent: 1.65 },
      { channel: 'Bilheteria Física (POS)', method: 'Crédito à Vista (1x)', acquirer: 'Stone', mdr: 2.30, fixedCost: 0.15, antifraudCost: 0.00, totalEstimatedPercent: 2.45 },
      { channel: 'Pontos de Venda / Agência', method: 'Crédito Parceiro', acquirer: 'PagBank', mdr: 3.20, fixedCost: 0.40, antifraudCost: 0.50, totalEstimatedPercent: 4.10 }
    ];

    const allHistory = DISK_FEE_RULES.flatMap(r => r.history || []);
    allHistory.sort((a, b) => new Date(b.timestamp || b.effectiveDate) - new Date(a.timestamp || a.effectiveDate));

    return {
      metrics: {
        avgDiskFee,
        avgPaymentCost,
        avgSpread
      },
      rules: DISK_FEE_RULES.filter(r => r.active),
      paymentCosts: costsList,
      history: allHistory
    };
  }
};

if (typeof window !== 'undefined') {
  window.financialConsolidationService = financialConsolidationService;
}
