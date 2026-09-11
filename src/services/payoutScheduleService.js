/**
 * Fase 26.17.9.5.7 — Serviço de Agenda Financeira, Lotes de Repasse e Repasse Automático
 * Integração mandatória com o Motor de Regras da Fase 26.17.9.5.6.
 */

import { financialRulesEngine } from './financialRulesService.js';
import { eventBalanceService } from './eventBalanceService.js';

export const INITIAL_SCHEDULE = [
  {
    id: 'SCH-2026-001',
    producerId: 'prod-1',
    producerName: 'DiskIngressos Eventos Ltda',
    eventId: '3368',
    eventName: 'Experiencia Música e Natureza - Julho',
    type: 'PAYOUT_AUTOMATIC',
    dueDate: '2026-09-12',
    amount: 3500.00,
    priority: 'ALTA',
    status: 'AGENDADO',
    approvalStatus: 'DISPENSADO',
    correlationId: 'CORR-SCH-3368-01',
    beneficiaryAccount: {
      pixKey: '08123456000199',
      bankCode: '001',
      agency: '1502-4',
      account: '99201-0',
      taxId: '08.123.456/0001-99'
    },
    createdAt: '2026-09-08T10:00:00.000Z'
  },
  {
    id: 'SCH-2026-002',
    producerId: 'prod-1',
    producerName: 'DiskIngressos Eventos Ltda',
    eventId: '3178',
    eventName: 'Feijoada e Costela assada - PETFRIENDLY',
    type: 'PAYOUT_AUTOMATIC',
    dueDate: '2026-09-12',
    amount: 2200.00,
    priority: 'NORMAL',
    status: 'AGENDADO',
    approvalStatus: 'DISPENSADO',
    correlationId: 'CORR-SCH-3178-02',
    beneficiaryAccount: {
      pixKey: '08123456000199',
      bankCode: '001',
      agency: '1502-4',
      account: '99201-0',
      taxId: '08.123.456/0001-99'
    },
    createdAt: '2026-09-09T14:00:00.000Z'
  },
  {
    id: 'SCH-2026-003',
    producerId: 'prod-1',
    producerName: 'DiskIngressos Eventos Ltda',
    eventId: '3195',
    eventName: '9º Knife Show Curitiba - Feira de Facas',
    type: 'PAYOUT_MANUAL',
    dueDate: '2026-09-15',
    amount: 4800.00,
    priority: 'NORMAL',
    status: 'AGENDADO',
    approvalStatus: 'PENDENTE',
    correlationId: 'CORR-SCH-3195-03',
    beneficiaryAccount: {
      pixKey: '08123456000199',
      bankCode: '001',
      agency: '1502-4',
      account: '99201-0',
      taxId: '08.123.456/0001-99'
    },
    createdAt: '2026-09-10T11:00:00.000Z'
  },
  {
    id: 'SCH-2026-004',
    producerId: 'prod-2',
    producerName: 'CWB Brasil Entretenimento',
    eventId: '3042',
    eventName: 'Festival Rock Nacional Curitiba 2026',
    type: 'PAYOUT_AUTOMATIC',
    dueDate: '2026-09-14',
    amount: 15000.00,
    priority: 'CRITICA',
    status: 'AGENDADO',
    approvalStatus: 'DISPENSADO',
    correlationId: 'CORR-SCH-3042-04',
    beneficiaryAccount: {
      pixKey: '12987654000100',
      bankCode: '341',
      agency: '0340',
      account: '44810-9',
      taxId: '12.987.654/0001-00'
    },
    createdAt: '2026-09-10T16:00:00.000Z'
  }
];

export const INITIAL_BATCHES = [
  {
    id: 'LOTE-20260910-001',
    producerId: 'prod-1',
    title: 'Lote Diário Repasses Programados - Seg 10/09',
    scheduledDate: '2026-09-10',
    status: 'CONCLUIDO',
    totalItems: 2,
    totalAmount: 5700.00,
    approvedAmount: 5700.00,
    settledAmount: 5700.00,
    failedAmount: 0.00,
    currency: 'BRL',
    idempotencyKey: 'IDEMP-LOTE-20260910-001',
    createdBy: 'Robô de Fechamento Noturno',
    approvedBy: 'Controladoria SafeSaff',
    approvedAt: '2026-09-10T08:30:00.000Z',
    processedAt: '2026-09-10T09:00:00.000Z',
    completedAt: '2026-09-10T09:15:00.000Z',
    createdAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-09-10T09:15:00.000Z',
    items: [
      {
        id: 'PIT-1001',
        batchId: 'LOTE-20260910-001',
        scheduleId: 'SCH-PREV-01',
        producerId: 'prod-1',
        producerName: 'DiskIngressos Eventos Ltda',
        eventId: '3368',
        eventName: 'Música e Natureza',
        amount: 3200.00,
        authorizedAmount: 3200.00,
        dueDate: '2026-09-10',
        status: 'PAGO',
        ruleDecision: 'ALLOW',
        bankStatus: 'PAGO',
        bankTransactionId: 'BK-TRX-882910',
        idempotencyKey: 'IDEMP-PIT-1001',
        retryCount: 0,
        maxRetries: 3,
        isRetryable: false,
        correlationId: 'CORR-PIT-1001',
        processedAt: '2026-09-10T09:15:00.000Z'
      },
      {
        id: 'PIT-1002',
        batchId: 'LOTE-20260910-001',
        scheduleId: 'SCH-PREV-02',
        producerId: 'prod-1',
        producerName: 'DiskIngressos Eventos Ltda',
        eventId: '3178',
        eventName: 'Feijoada PET',
        amount: 2500.00,
        authorizedAmount: 2500.00,
        dueDate: '2026-09-10',
        status: 'PAGO',
        ruleDecision: 'ALLOW',
        bankStatus: 'PAGO',
        bankTransactionId: 'BK-TRX-882911',
        idempotencyKey: 'IDEMP-PIT-1002',
        retryCount: 0,
        maxRetries: 3,
        isRetryable: false,
        correlationId: 'CORR-PIT-1002',
        processedAt: '2026-09-10T09:15:00.000Z'
      }
    ]
  }
];

// Estado Reativo Sincronizado
let LOCAL_SCHEDULE = JSON.parse(JSON.stringify(INITIAL_SCHEDULE));
let LOCAL_BATCHES = JSON.parse(JSON.stringify(INITIAL_BATCHES));
let LOCAL_IDEMPOTENCY_STORE = new Map();
let LOCAL_SCHEDULE_AUDIT = [];

function generateCorrelationId(prefix = 'SCH') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

function logScheduleAudit({ correlationId, actor, entityType, entityId, action, summary, details = {} }) {
  const entry = {
    id: `AUD-SCH-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    correlationId: correlationId || generateCorrelationId(),
    timestamp: new Date().toISOString(),
    actor: actor || { id: 'usr-sys', name: 'Motor Automático', role: 'SISTEMA' },
    entityType,
    entityId,
    action,
    summary,
    details: JSON.parse(JSON.stringify(details))
  };
  LOCAL_SCHEDULE_AUDIT.unshift(entry);
  return entry;
}

export const payoutScheduleService = {
  // =========================================================================
  // 1. AGENDA FINANCEIRA (Hoje, 7d, 30d, Calendário)
  // =========================================================================
  async getSchedule({ producerId = 'prod-1', eventId, horizonDays = 30, status } = {}) {
    const now = new Date();
    const limitDate = new Date(now.getTime() + horizonDays * 86400000);

    let list = LOCAL_SCHEDULE.filter(item => !producerId || item.producerId === producerId);
    if (eventId) list = list.filter(item => String(item.eventId) === String(eventId));
    if (status) list = list.filter(item => item.status === status);

    list = list.filter(item => {
      const due = new Date(item.dueDate);
      return due <= limitDate;
    });

    // Ordena por data de vencimento
    list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const summary = {
      totalAmount: list.reduce((acc, i) => acc + i.amount, 0),
      totalCount: list.length,
      todayCount: list.filter(i => i.dueDate === now.toISOString().split('T')[0]).length,
      todayAmount: list.filter(i => i.dueDate === now.toISOString().split('T')[0]).reduce((acc, i) => acc + i.amount, 0)
    };

    return { ok: true, data: list, summary };
  },

  async schedulePayout(data, actor) {
    if (!data.eventId || !data.amount || data.amount <= 0) {
      throw new Error('Evento e valor maior que zero são obrigatórios.');
    }

    const id = `SCH-${new Date().getFullYear()}-${String(LOCAL_SCHEDULE.length + 1).padStart(4, '0')}`;
    const correlationId = generateCorrelationId('SCH');

    const newItem = {
      id,
      producerId: data.producerId || 'prod-1',
      producerName: data.producerName || 'Produtor',
      eventId: String(data.eventId),
      eventName: data.eventName || `Evento ${data.eventId}`,
      type: data.type || 'PAYOUT_AUTOMATIC',
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      amount: Number(data.amount),
      priority: data.priority || 'NORMAL',
      status: 'AGENDADO',
      approvalStatus: data.amount > 10000 ? 'PENDENTE' : 'DISPENSADO',
      correlationId,
      beneficiaryAccount: data.beneficiaryAccount || { pixKey: '08123456000199', bankCode: '001', agency: '1502-4', account: '99201-0' },
      createdAt: new Date().toISOString()
    };

    LOCAL_SCHEDULE.push(newItem);

    logScheduleAudit({
      actor,
      entityType: 'SCHEDULE',
      entityId: id,
      action: 'PAYOUT_SCHEDULED',
      summary: `Repasse agendado: R$ ${newItem.amount.toFixed(2)} para ${newItem.dueDate} (${newItem.eventName})`,
      details: newItem
    });

    return { ok: true, data: newItem };
  },

  async cancelScheduledPayout(scheduleId, justification, actor) {
    const item = LOCAL_SCHEDULE.find(i => i.id === scheduleId);
    if (!item) throw new Error('Item de agendamento não encontrado.');
    if (item.status === 'EM_LOTE' || item.status === 'CONCLUIDO') {
      throw new Error(`Item com status ${item.status} não pode ser cancelado diretamente.`);
    }

    item.status = 'CANCELADO';

    logScheduleAudit({
      actor,
      entityType: 'SCHEDULE',
      entityId: scheduleId,
      action: 'PAYOUT_CANCELED',
      summary: `Agendamento ${scheduleId} cancelado: ${justification || 'Sem justificativa'}`,
      details: { justification }
    });

    return { ok: true, data: item };
  },

  // =========================================================================
  // 2. CRIAÇÃO E VALIDAÇÃO DE LOTES DE REPASSE
  // =========================================================================
  async getPayoutBatches({ producerId = 'prod-1', status } = {}) {
    let list = LOCAL_BATCHES.filter(b => !producerId || b.producerId === producerId);
    if (status) list = list.filter(b => b.status === status);
    return { ok: true, data: list };
  },

  async getPayoutBatchById(batchId) {
    const b = LOCAL_BATCHES.find(item => item.id === batchId);
    if (!b) return { ok: false, error: 'Lote de repasse não localizado.' };
    return { ok: true, data: b };
  },

  async createPayoutBatch({ producerId = 'prod-1', scheduledDate, scheduleItemIds, title }, actor) {
    if (!scheduleItemIds || scheduleItemIds.length === 0) {
      throw new Error('Selecione ao menos um item de repasse agendado para compor o lote.');
    }

    const dateStr = scheduledDate || new Date().toISOString().split('T')[0];
    const dateFormatted = dateStr.replace(/-/g, '');
    const batchId = `LOTE-${dateFormatted}-${String(LOCAL_BATCHES.length + 1).padStart(3, '0')}`;
    const idempotencyKey = `IDEMP-${batchId}`;

    const items = [];
    let totalAmount = 0;

    for (const sId of scheduleItemIds) {
      const sch = LOCAL_SCHEDULE.find(s => s.id === sId);
      if (!sch) continue;
      if (sch.status !== 'AGENDADO') {
        throw new Error(`Item ${sId} não está agendado (status atual: ${sch.status}).`);
      }

      const itemId = `PIT-${batchId.slice(-3)}${String(items.length + 1).padStart(2, '0')}`;
      const pItem = {
        id: itemId,
        batchId,
        scheduleId: sch.id,
        producerId: sch.producerId,
        producerName: sch.producerName,
        eventId: sch.eventId,
        eventName: sch.eventName,
        amount: sch.amount,
        authorizedAmount: sch.amount,
        dueDate: sch.dueDate,
        status: 'VALIDANDO',
        ruleDecision: undefined,
        ruleReasons: [],
        retryCount: 0,
        maxRetries: 3,
        isRetryable: false,
        correlationId: generateCorrelationId('PIT'),
        beneficiaryAccount: sch.beneficiaryAccount
      };

      items.push(pItem);
      totalAmount += sch.amount;
      sch.status = 'EM_LOTE';
      sch.batchId = batchId;
    }

    const newBatch = {
      id: batchId,
      producerId,
      title: title || `Lote de Repasse — ${dateStr}`,
      scheduledDate: dateStr,
      status: 'RASCUNHO',
      totalItems: items.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      approvedAmount: 0,
      settledAmount: 0,
      failedAmount: 0,
      currency: 'BRL',
      items,
      idempotencyKey,
      createdBy: actor?.name || 'Operador Financeiro',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    LOCAL_BATCHES.unshift(newBatch);

    logScheduleAudit({
      actor,
      entityType: 'PAYOUT_BATCH',
      entityId: batchId,
      action: 'BATCH_CREATED',
      summary: `Lote ${batchId} criado com ${items.length} itens no valor total de R$ ${totalAmount.toFixed(2)}`,
      details: newBatch
    });

    return { ok: true, data: newBatch };
  },

  /**
   * Reavaliação OBRIGATÓRIA item a item no Motor de Regras da Fase 26.17.9.5.6.
   * Nenhum repasse pode ignorar o motor.
   */
  async validatePayoutBatch(batchId, actor) {
    const batch = LOCAL_BATCHES.find(b => b.id === batchId);
    if (!batch) throw new Error('Lote não localizado.');

    batch.status = 'EM_VALIDACAO';
    let approvedTotal = 0;
    let hasApprovalPending = false;
    let hasHold = false;
    let hasBlock = false;

    for (const item of batch.items) {
      // Chamada obrigatória ao Motor de Regras Central
      const evalResult = await financialRulesEngine.evaluateFinancialOperation({
        operationType: 'PAYOUT',
        producerId: item.producerId,
        eventId: item.eventId,
        amount: item.amount,
        actor: actor || { name: 'Motor de Lotes', role: 'OPERADOR_FINANCEIRO' },
        now: new Date()
      });

      item.ruleDecision = evalResult.decision;
      item.ruleReasons = [...(evalResult.blockedReasons || []), ...(evalResult.warnings || [])];

      if (evalResult.decision === 'BLOCK') {
        item.status = 'BLOQUEADO';
        item.isRetryable = false;
        item.authorizedAmount = 0;
        hasBlock = true;
      } else if (evalResult.decision === 'HOLD') {
        item.status = 'RETIDO_HOLD';
        item.isRetryable = false;
        item.authorizedAmount = 0;
        hasHold = true;
      } else if (evalResult.decision === 'ALLOW_PARTIAL') {
        item.status = 'APROVADO';
        item.authorizedAmount = evalResult.maxAllowedAmount;
        approvedTotal += item.authorizedAmount;
      } else if (evalResult.decision === 'ALLOW_WITH_APPROVAL') {
        item.status = 'VALIDANDO';
        hasApprovalPending = true;
        item.authorizedAmount = item.amount;
        approvedTotal += item.amount;
      } else {
        // 'ALLOW'
        item.status = 'APROVADO';
        item.authorizedAmount = item.amount;
        approvedTotal += item.amount;
      }
    }

    batch.approvedAmount = Number(approvedTotal.toFixed(2));

    if (batch.items.every(i => i.status === 'BLOQUEADO')) {
      batch.status = 'FALHA';
    } else {
      batch.status = 'AGUARDANDO_APROVACAO';
    }

    batch.updatedAt = new Date().toISOString();

    logScheduleAudit({
      actor,
      entityType: 'PAYOUT_BATCH',
      entityId: batchId,
      action: 'BATCH_VALIDATED',
      summary: `Validação do lote ${batchId} concluída. Status: ${batch.status} (R$ ${approvedTotal.toFixed(2)} aprovados pós-regras)`,
      details: { batch }
    });

    return { ok: true, data: batch };
  },

  // =========================================================================
  // 3. APROVAÇÃO EM MASSA (Maker / Checker)
  // =========================================================================
  async approvePayoutBatch(batchId, actor) {
    const batch = LOCAL_BATCHES.find(b => b.id === batchId);
    if (!batch) throw new Error('Lote não localizado.');

    // REGRA DE GOVERNANÇA: MAKER / CHECKER
    // Quem montou o lote NÃO pode aprová-lo
    if (actor && actor.name && batch.createdBy && actor.name.toLowerCase() === batch.createdBy.toLowerCase()) {
      throw new Error(`Violação de Segregação de Funções (Maker/Checker): O usuário (${actor.name}) que criou o lote não pode ser seu aprovador.`);
    }

    // Revalida se o lote já não foi executado ou cancelado
    if (!['AGUARDANDO_APROVACAO', 'PARCIAL', 'EM_VALIDACAO'].includes(batch.status)) {
      throw new Error(`Lote com status ${batch.status} não está aguardando aprovação.`);
    }

    // Aprova os itens pendentes que não tenham BLOCK ou HOLD ativo
    let authorizedSum = 0;
    batch.items.forEach(item => {
      if (item.ruleDecision === 'BLOCK' || item.ruleDecision === 'HOLD') {
        // Permanece bloqueado
      } else {
        item.status = 'APROVADO';
        authorizedSum += (item.authorizedAmount || item.amount);
      }
    });

    batch.approvedAmount = Number(authorizedSum.toFixed(2));
    batch.status = authorizedSum > 0 ? 'APROVADO' : 'FALHA';
    batch.approvedBy = actor?.name || 'Aprovador Autorizado';
    batch.approvedAt = new Date().toISOString();
    batch.updatedAt = new Date().toISOString();

    logScheduleAudit({
      actor,
      entityType: 'PAYOUT_BATCH',
      entityId: batchId,
      action: 'BATCH_APPROVED',
      summary: `Lote ${batchId} homologado por ${batch.approvedBy}. R$ ${batch.approvedAmount.toFixed(2)} liberados para processamento.`,
      details: { batch }
    });

    return { ok: true, data: batch };
  },

  // =========================================================================
  // 4. PROCESSAMENTO BANCÁRIO & IDEMPOTÊNCIA
  // =========================================================================
  async processPayoutBatch(batchId, { idempotencyKey, actor } = {}) {
    const batch = LOCAL_BATCHES.find(b => b.id === batchId);
    if (!batch) throw new Error('Lote não localizado.');

    const idempKey = idempotencyKey || batch.idempotencyKey;

    // IDEMPOTÊNCIA: Se já foi processado com essa chave, retorna o resultado cacheado imutável
    if (LOCAL_IDEMPOTENCY_STORE.has(idempKey)) {
      const cached = LOCAL_IDEMPOTENCY_STORE.get(idempKey);
      return { ok: true, isIdempotentReplay: true, data: cached };
    }

    if (!['APROVADO', 'PARCIAL'].includes(batch.status)) {
      throw new Error(`Lote ${batchId} não está no estado APROVADO (status atual: ${batch.status}).`);
    }

    batch.status = 'EM_PROCESSAMENTO';
    batch.processedAt = new Date().toISOString();

    const results = [];
    let settledSum = 0;
    let failedSum = 0;

    for (const item of batch.items) {
      if (item.status !== 'APROVADO') {
        results.push({ itemId: item.id, status: item.status, reasons: item.ruleReasons });
        continue;
      }

      // Reavaliação final de segurança antes do lock
      const recheck = await financialRulesEngine.evaluateFinancialOperation({
        operationType: 'PAYOUT',
        producerId: item.producerId,
        eventId: item.eventId,
        amount: item.authorizedAmount || item.amount,
        actor
      });

      if (['BLOCK', 'HOLD'].includes(recheck.decision)) {
        item.status = recheck.decision === 'BLOCK' ? 'BLOQUEADO' : 'RETIDO_HOLD';
        item.ruleDecision = recheck.decision;
        item.ruleReasons = recheck.blockedReasons;
        failedSum += item.amount;
        results.push({ itemId: item.id, status: item.status, reasons: recheck.blockedReasons });
        continue;
      }

      // 1. Reserva do Saldo Disponível (Lock Contábil)
      const store = eventBalanceService.getLocalBalanceStore();
      const ev = store.find(e => String(e.eventId) === String(item.eventId));
      if (ev) {
        const amt = item.authorizedAmount || item.amount;
        ev.balances.committedBalance = Number((ev.balances.committedBalance + amt).toFixed(2));
        ev.balances.availableBalance = Number(Math.max(0, ev.balances.availableBalance - amt).toFixed(2));
      }

      // 2. Submissão ao provedor bancário
      const itemTrxId = `BK-TRX-${Math.floor(100000 + Math.random() * 900000)}`;
      item.bankTransactionId = itemTrxId;
      item.status = 'ENVIADO_BANCO';
      item.bankStatus = 'PROCESSANDO';
      item.processedAt = new Date().toISOString();
      settledSum += (item.authorizedAmount || item.amount);

      results.push({ itemId: item.id, status: 'ENVIADO_BANCO', bankTransactionId: itemTrxId });
    }

    batch.settledAmount = Number(settledSum.toFixed(2));
    batch.failedAmount = Number(failedSum.toFixed(2));
    batch.status = failedSum > 0 ? 'PARCIAL' : 'ENVIADO_BANCO';
    batch.updatedAt = new Date().toISOString();

    const responsePayload = { batchId: batch.id, status: batch.status, results };

    // Grava resultado na tabela de idempotência
    LOCAL_IDEMPOTENCY_STORE.set(idempKey, responsePayload);

    logScheduleAudit({
      actor,
      entityType: 'PAYOUT_BATCH',
      entityId: batchId,
      action: 'BATCH_SUBMITTED_TO_BANK',
      summary: `Lote ${batchId} transmitido ao banco. Total transmitido: R$ ${settledSum.toFixed(2)} (Idempotency: ${idempKey})`,
      details: responsePayload
    });

    return { ok: true, isIdempotentReplay: false, data: responsePayload };
  },

  // =========================================================================
  // 5. RETORNO BANCÁRIO (Webhook / Arquivo Retorno) & CONCILIAÇÃO
  // =========================================================================
  async processBankReturnWebhook(webhookPayload, actor) {
    const { bankTransactionId, payoutItemId, status, settledAmount, errorCode, errorMessage } = webhookPayload;

    // Localiza o item pelo bankTransactionId ou pelo ID do item
    let targetItem = null;
    let targetBatch = null;

    for (const b of LOCAL_BATCHES) {
      const it = b.items.find(i => i.bankTransactionId === bankTransactionId || i.id === payoutItemId);
      if (it) {
        targetItem = it;
        targetBatch = b;
        break;
      }
    }

    if (!targetItem) {
      throw new Error(`Transação bancária ${bankTransactionId || payoutItemId} não localizada em nenhum lote.`);
    }

    targetItem.bankStatus = status; // 'PAGO' | 'REJEITADO' | 'DEVOLVIDO' | 'CANCELADO'

    const store = eventBalanceService.getLocalBalanceStore();
    const ev = store.find(e => String(e.eventId) === String(targetItem.eventId));

    if (status === 'PAGO') {
      targetItem.status = 'PAGO';
      targetItem.isRetryable = false;

      // Conciliação: Debita efetivamente do saldo liquidado e libera a reserva temporária
      if (ev) {
        const amt = Number(settledAmount || targetItem.authorizedAmount || targetItem.amount);
        ev.balances.committedBalance = Number(Math.max(0, ev.balances.committedBalance - amt).toFixed(2));
        ev.balances.settledAmount = Number(Math.max(0, ev.balances.settledAmount - amt).toFixed(2));
      }

      // Atualiza item na agenda de origem
      if (targetItem.scheduleId) {
        const sch = LOCAL_SCHEDULE.find(s => s.id === targetItem.scheduleId);
        if (sch) sch.status = 'CONCLUIDO';
      }
    } else {
      // 'REJEITADO' ou 'DEVOLVIDO'
      targetItem.status = 'FALHA_TECNICA';
      targetItem.bankErrorCode = errorCode || 'ERR_BANK';
      targetItem.bankErrorMessage = errorMessage || 'Rejeição bancária reportada.';

      // Estorna a reserva de saldo do evento
      if (ev) {
        const amt = targetItem.authorizedAmount || targetItem.amount;
        ev.balances.committedBalance = Number(Math.max(0, ev.balances.committedBalance - amt).toFixed(2));
        ev.balances.availableBalance = Number((ev.balances.availableBalance + amt).toFixed(2));
      }

      // Classifica se é elegível a reprocessamento técnico
      const technicalCodes = ['TIMEOUT', 'NETWORK_ERR', 'BANK_UNAVAILABLE', 'COMMUNICATION_FAIL'];
      targetItem.isRetryable = technicalCodes.includes(errorCode);
    }

    // Atualiza status do lote pai
    const allPaid = targetBatch.items.every(i => i.status === 'PAGO');
    const allFinished = targetBatch.items.every(i => ['PAGO', 'BLOQUEADO', 'FALHA_TECNICA'].includes(i.status));
    if (allPaid) {
      targetBatch.status = 'CONCLUIDO';
      targetBatch.completedAt = new Date().toISOString();
    } else if (allFinished) {
      targetBatch.status = 'PARCIAL';
    }
    targetBatch.updatedAt = new Date().toISOString();

    logScheduleAudit({
      actor,
      entityType: 'BANK_RETURN',
      entityId: bankTransactionId || targetItem.id,
      action: `BANK_RETURN_${status}`,
      summary: `Retorno bancário processado para ${targetItem.id}: Status=${status} (R$ ${targetItem.amount.toFixed(2)})`,
      details: { webhookPayload, item: targetItem }
    });

    return { ok: true, data: targetItem, batchStatus: targetBatch.status };
  },

  // =========================================================================
  // 6. REPROCESSAMENTO SEGURO
  // =========================================================================
  async retryPayoutItem(itemId, actor) {
    let targetItem = null;
    let targetBatch = null;

    for (const b of LOCAL_BATCHES) {
      const it = b.items.find(i => i.id === itemId);
      if (it) {
        targetItem = it;
        targetBatch = b;
        break;
      }
    }

    if (!targetItem) throw new Error('Item de repasse não localizado.');

    // REGRA DE OURO DO REPROCESSAMENTO:
    // Nunca reprocessar automaticamente itens com BLOCK, compliance ou dados bancários inválidos
    if (targetItem.ruleDecision === 'BLOCK') {
      throw new Error(`Reprocessamento Negado: Item ${itemId} foi bloqueado pelo Motor de Regras (${targetItem.ruleReasons.join(', ')}). Ajuste as políticas antes de retentar.`);
    }

    if (!targetItem.isRetryable && targetItem.status !== 'FALHA_TECNICA') {
      throw new Error(`Reprocessamento Negado: Item ${itemId} não é elegível a retry automático.`);
    }

    if (targetItem.retryCount >= targetItem.maxRetries) {
      throw new Error(`Limite máximo de ${targetItem.maxRetries} tentativas excedido para o item ${itemId}.`);
    }

    targetItem.retryCount += 1;
    targetItem.status = 'VALIDANDO';

    // Reavalia regras do zero antes do retry
    const reval = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'PAYOUT',
      producerId: targetItem.producerId,
      eventId: targetItem.eventId,
      amount: targetItem.amount,
      actor
    });

    if (reval.decision === 'BLOCK') {
      targetItem.status = 'BLOQUEADO';
      targetItem.isRetryable = false;
      throw new Error(`Bloqueio no retry: ${reval.blockedReasons.join(', ')}`);
    }

    targetItem.status = 'ENVIADO_BANCO';
    targetItem.bankTransactionId = `BK-RETRY-${Math.floor(100000 + Math.random() * 900000)}`;

    logScheduleAudit({
      actor,
      entityType: 'PAYOUT_ITEM',
      entityId: itemId,
      action: 'PAYOUT_RETRY_EXECUTED',
      summary: `Tentativa ${targetItem.retryCount}/${targetItem.maxRetries} disparada para ${itemId} (Nova Transação: ${targetItem.bankTransactionId})`
    });

    return { ok: true, data: targetItem };
  },

  // =========================================================================
  // 7. AUDITORIA
  // =========================================================================
  getScheduleAuditLog() {
    return [...LOCAL_SCHEDULE_AUDIT];
  }
};
