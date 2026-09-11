/**
 * Fase 26.17.9.5 — Serviço de Transferência entre Eventos
 * Implementa validação estrita das Regras de Negócio RN01 a RN13,
 * simulação de prévia, idempotência e geração atômica de duplas movimentações.
 */

import { eventBalanceGateway } from './eventBalanceGateway.js';
import { eventBalanceService } from './eventBalanceService.js';
import { financialRulesEngine } from './financialRulesService.js';

// Cache em memória de transferências para persistência imediata e histórico consistente
let LOCAL_TRANSFERS = [
  {
    id: "TRF-20260909-001",
    producerId: "prod-1",
    producerName: "DiskIngressos Eventos Ltda",
    sourceEventId: "3368",
    sourceEventName: "Experiencia Música e Natureza - Julho",
    targetEventId: "3178",
    targetEventName: "Feijoada e Costela assada - PETFRIENDLY",
    amount: 1200.00,
    reason: "Remanejamento operacional de caixa para estrutura do evento",
    notes: "Aprovado internamente pela produção",
    costCenter: "CC-PRODUCAO-01",
    status: "CONCLUIDA",
    requestedBy: "Vinicius Casagrande",
    approvedBy: "Controladoria Financeira",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    processedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    correlationId: "CORR-98234-A1B2",
    sourceBefore: 9800.00,
    sourceAfter: 8600.00,
    targetBefore: 6200.00,
    targetAfter: 7400.00,
    producerTotalBefore: 16000.00,
    producerTotalAfter: 16000.00
  }
];

let AUDIT_LOGS = [
  {
    id: "AUD-001",
    transferId: "TRF-20260909-001",
    actor: "Vinicius Casagrande",
    action: "CRIACAO_TRANSFERENCIA",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    details: "Transferência de R$ 1.200,00 solicitada entre eventos 3368 -> 3178.",
    ip: "189.102.44.12"
  },
  {
    id: "AUD-002",
    transferId: "TRF-20260909-001",
    actor: "Sistema / Controladoria",
    action: "CONCLUSAO_TRANSFERENCIA",
    timestamp: new Date(Date.now() - 3600000 * 5 + 2000).toISOString(),
    details: "Movimentações atômicas criadas: TRANSFERENCIA_EVENTO_SAIDA (-1200.00) e TRANSFERENCIA_EVENTO_ENTRADA (+1200.00).",
    ip: "INTERNAL_SYSTEM"
  }
];

let LOCAL_TIMELINES = {};

export const balanceTransferService = {
  /**
   * Calcula a Prévia Obrigatória antes da confirmação da transferência
   */
  async calculateTransferPreview({ sourceEventId, targetEventId, amount, producerId }) {
    const val = Number(amount) || 0;
    if (!sourceEventId || !targetEventId) {
      return { valid: false, error: "Selecione o evento de origem e o evento de destino." };
    }

    if (sourceEventId === targetEventId) {
      return { valid: false, error: "O evento de origem e o de destino devem ser diferentes (RN01)." };
    }

    const sourceRes = await eventBalanceService.getEventBalance(sourceEventId);
    const targetRes = await eventBalanceService.getEventBalance(targetEventId);

    if (!sourceRes.ok || !sourceRes.data) {
      return { valid: false, error: "Evento de origem não localizado." };
    }
    if (!targetRes.ok || !targetRes.data) {
      return { valid: false, error: "Evento de destino não localizado." };
    }

    const source = sourceRes.data;
    const target = targetRes.data;

    if (source.producerId !== target.producerId) {
      return { valid: false, error: "Origem e destino pertencem a produtores diferentes! Operação proibida (RN01)." };
    }

    if (producerId && source.producerId !== producerId) {
      return { valid: false, error: "Os eventos não pertencem ao produtor ativo selecionado (RN11)." };
    }

    if (!source.integrity.isBalanced) {
      return {
        valid: false,
        error: "Evento de origem possui divergência contábil ativa. Transferências bloqueadas até saneamento (RN02/RN12)."
      };
    }

    const sourceAvailable = source.balances.availableBalance;
    const targetAvailable = target.balances.availableBalance;

    if (val <= 0) {
      return { valid: false, error: "O valor da transferência deve ser maior que R$ 0,00." };
    }

    if (val > sourceAvailable) {
      return {
        valid: false,
        error: `Saldo disponível insuficiente no evento de origem (Disponível: R$ ${sourceAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`
      };
    }

    // Avaliação no Motor Central de Regras Financeiras (Fase 26.17.9.5.6)
    const ruleEval = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'EVENT_TRANSFER',
      producerId: source.producerId,
      eventId: sourceEventId,
      amount: val,
      actor: { role: 'OPERADOR_FINANCEIRO' }
    });

    if (ruleEval.decision === 'BLOCK') {
      return {
        valid: false,
        error: ruleEval.blockedReasons?.join('; ') || 'Operação bloqueada pelo Motor de Regras Financeiras.',
        rulesEvaluation: ruleEval
      };
    }

    const sourceNewAvailable = Number((sourceAvailable - val).toFixed(2));
    const targetNewAvailable = Number((targetAvailable + val).toFixed(2));

    const totalBefore = Number((sourceAvailable + targetAvailable).toFixed(2));
    const totalAfter = Number((sourceNewAvailable + targetNewAvailable).toFixed(2));
    const consolidatedDifference = Number(Math.abs(totalAfter - totalBefore).toFixed(2));

    return {
      valid: true,
      error: null,
      source: {
        id: source.eventId,
        name: source.eventName,
        availableBefore: sourceAvailable,
        transferAmount: -val,
        availableAfter: sourceNewAvailable
      },
      target: {
        id: target.eventId,
        name: target.eventName,
        availableBefore: targetAvailable,
        transferAmount: val,
        availableAfter: targetNewAvailable
      },
      consolidated: {
        totalBefore,
        totalAfter,
        difference: consolidatedDifference,
        isStrictlyInvariant: consolidatedDifference === 0
      },
      rulesEvaluation: ruleEval
    };
  },

  /**
   * Executa a transferência de forma atômica
   */
  async executeTransfer({
    sourceEventId,
    targetEventId,
    amount,
    reason,
    notes = '',
    costCenter = '',
    producerId,
    actor = 'Usuário Produtor'
  }) {
    // 1. Validar prévia e regras
    const preview = await this.calculateTransferPreview({
      sourceEventId,
      targetEventId,
      amount,
      producerId
    });

    if (!preview.valid) {
      throw new Error(preview.error || "Não foi possível validar os dados da transferência.");
    }

    if (!reason || reason.trim().length < 3) {
      throw new Error("O motivo da transferência é obrigatório (mínimo de 3 caracteres).");
    }

    const idempotencyKey = `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const payload = {
      sourceEventId,
      targetEventId,
      amount: Number(amount),
      reason: reason.trim(),
      notes: notes ? notes.trim() : '',
      costCenter: costCenter ? costCenter.trim() : '',
      idempotencyKey
    };

    // 2. Tentar chamada à API oficial de backend
    const apiRes = await eventBalanceGateway.createTransfer(payload);
    if (apiRes.ok && apiRes.data) {
      return apiRes.data;
    }

    // 3. Processamento seguro local (RN05 Dupla Movimentação + RN06 Atomicidade + RN10 Auditoria)
    const transferId = `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const correlationId = `CORR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const val = Number(amount);
    const sourceEv = (await eventBalanceService.getEventBalance(sourceEventId)).data;
    const targetEv = (await eventBalanceService.getEventBalance(targetEventId)).data;

    // INTEGRAÇÃO COM MOTOR DE REGRAS FINANCEIRAS (Fase 26.17.9.5.6)
    const ruleEval = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'EVENT_TRANSFER',
      producerId: sourceEv.producerId,
      eventId: sourceEventId,
      amount: val,
      actor: { name: actor, role: 'OPERADOR_FINANCEIRO' }
    });

    if (ruleEval.decision === 'BLOCK') {
      const reasonMsg = ruleEval.blockedReasons?.join('; ') || 'Operação bloqueada pelo Motor de Regras Financeiras.';
      throw new Error(`MOTOR_REGRAS_BLOQUEIO: ${reasonMsg}`);
    }

    if (ruleEval.decision === 'HOLD') {
      const holdMsg = ruleEval.warnings?.join('; ') || 'Operação retida temporariamente (fora da janela operacional ou aguardando conciliação).';
      throw new Error(`MOTOR_REGRAS_RETENCAO: ${holdMsg}`);
    }

    if (ruleEval.decision === 'ALLOW_PARTIAL') {
      throw new Error(`MOTOR_REGRAS_PARCIAL: O valor solicitado de R$ ${val.toFixed(2)} excede a capacidade líquida liberável após reservas mínimas. Valor máximo permitido: R$ ${ruleEval.maxAllowedAmount.toFixed(2)}.`);
    }

    // Alçadas determinadas pelas políticas ativas do motor de regras
    const requiresApproval = ruleEval.decision === 'ALLOW_WITH_APPROVAL' || ruleEval.requiresApproval;
    const status = requiresApproval ? 'EM_APROVACAO' : 'CONCLUIDA';
    const approvalRoleText = ruleEval.approvalLevel === 'NIVEL_2_DIRETORIA' ? 'Pendente Diretoria (Nível 2)' : 'Pendente Controladoria (Nível 1)';

    const newTransfer = {
      id: transferId,
      producerId: sourceEv.producerId,
      producerName: sourceEv.producerName,
      sourceEventId,
      sourceEventName: sourceEv.eventName,
      targetEventId,
      targetEventName: targetEv.eventName,
      amount: val,
      reason: reason.trim(),
      notes: notes ? notes.trim() : '',
      costCenter: costCenter ? costCenter.trim() : '',
      status,
      requestedBy: actor,
      approvedBy: status === 'CONCLUIDA' ? 'Aprovação Automática (Dentro do Limite)' : approvalRoleText,
      approvalLevel: ruleEval.approvalLevel,
      rulesCorrelationId: ruleEval.correlationId,
      reserveAmount: ruleEval.reserveAmount,
      createdAt: timestamp,
      processedAt: status === 'CONCLUIDA' ? timestamp : undefined,
      correlationId,
      sourceBefore: preview.source.availableBefore,
      sourceAfter: preview.source.availableAfter,
      targetBefore: preview.target.availableBefore,
      targetAfter: preview.target.availableAfter,
      producerTotalBefore: preview.consolidated.totalBefore,
      producerTotalAfter: preview.consolidated.totalAfter
    };

    if (status === 'CONCLUIDA') {
      // Movimentação de Saída no evento de origem
      eventBalanceService.updateLocalEventBalance(sourceEventId, -val, {
        id: `MOV-${sourceEventId}-${Date.now()}-OUT`,
        eventId: sourceEventId,
        producerId: sourceEv.producerId,
        transferId,
        type: 'TRANSFERENCIA_EVENTO_SAIDA',
        description: `Transferência enviada para ${targetEv.eventName} (${transferId})`,
        amount: -val,
        balanceBefore: preview.source.availableBefore,
        balanceAfter: preview.source.availableAfter,
        createdAt: timestamp,
        createdBy: actor,
        referenceType: 'TRANSFER_OUT',
        referenceId: transferId
      });

      // Movimentação de Entrada no evento de destino
      eventBalanceService.updateLocalEventBalance(targetEventId, val, {
        id: `MOV-${targetEventId}-${Date.now()}-IN`,
        eventId: targetEventId,
        producerId: targetEv.producerId,
        transferId,
        type: 'TRANSFERENCIA_EVENTO_ENTRADA',
        description: `Transferência recebida de ${sourceEv.eventName} (${transferId})`,
        amount: val,
        balanceBefore: preview.target.availableBefore,
        balanceAfter: preview.target.availableAfter,
        createdAt: timestamp,
        createdBy: actor,
        referenceType: 'TRANSFER_IN',
        referenceId: transferId
      });

      this.addTimelineEvent(transferId, {
        type: 'CONCLUIDA_AUTOMATICA',
        actorName: actor,
        actorRole: 'Produtor',
        description: `Transferência aprovada e concluída automaticamente (dentro do limite de alçada).`,
        previousStatus: 'SOLICITADA',
        newStatus: 'CONCLUIDA'
      });
    } else if (status === 'EM_APROVACAO') {
      eventBalanceService.reserveBalance(sourceEventId, val, transferId);

      this.addTimelineEvent(transferId, {
        type: 'RESERVA_CRIADA',
        actorName: actor,
        actorRole: 'Produtor',
        description: `Transferência de R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} aguardando alçada. Saldo caucionado via TRANSFERENCIA_RESERVA.`,
        previousStatus: null,
        newStatus: 'EM_APROVACAO'
      });
    }

    LOCAL_TRANSFERS.unshift(newTransfer);

    // Registro de Auditoria Imutável (RN10)
    AUDIT_LOGS.unshift({
      id: `AUD-${Date.now()}-1`,
      transferId,
      actor,
      action: status === 'CONCLUIDA' ? 'TRANSFERENCIA_CONCLUIDA' : 'TRANSFERENCIA_SOLICITADA',
      timestamp,
      details: `Transferência de R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de "${sourceEv.eventName}" para "${targetEv.eventName}". Motivo: ${reason}. Status: ${status}. CorrelationId: ${correlationId}`,
      ip: '127.0.0.1'
    });

    return newTransfer;
  },

  /**
   * Estorna uma transferência existente (RN09)
   */
  async reverseTransfer(transferId, reason = 'Solicitação de estorno operacional', actor = 'Admin Financeiro') {
    const transfer = LOCAL_TRANSFERS.find(t => t.id === transferId);
    if (!transfer) throw new Error("Transferência não encontrada.");

    if (transfer.status !== 'CONCLUIDA') {
      throw new Error(`Apenas transferências CONCLUIDAS podem ser estornadas. Status atual: ${transfer.status}`);
    }

    // Tentar gateway oficial
    const apiRes = await eventBalanceGateway.reverseTransfer(transferId, reason);
    if (apiRes.ok && apiRes.data) return apiRes.data;

    const targetBal = (await eventBalanceService.getEventBalance(transfer.targetEventId)).data;
    if (targetBal.balances.availableBalance < transfer.amount) {
      throw new Error(`ESTORNO_BLOQUEADO_SALDO: O evento de destino possui apenas R$ ${targetBal.balances.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} disponíveis, insuficiente para devolver R$ ${transfer.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. O saldo foi consumido por repasses ou despesas posteriores.`);
    }

    const timestamp = new Date().toISOString();
    const reverseId = `REV-${transferId}`;

    // Atualiza status do registro original mantendo o histórico
    transfer.status = 'ESTORNADA';
    transfer.reversedTransferId = reverseId;

    // Movimentação inversa
    eventBalanceService.updateLocalEventBalance(transfer.targetEventId, -transfer.amount, {
      id: `MOV-${transfer.targetEventId}-${Date.now()}-REV-OUT`,
      eventId: transfer.targetEventId,
      producerId: transfer.producerId,
      transferId: reverseId,
      type: 'ESTORNO_TRANSFERENCIA_SAIDA',
      description: `Estorno da transferência ${transferId}`,
      amount: -transfer.amount,
      balanceBefore: targetBal.balances.availableBalance,
      balanceAfter: targetBal.balances.availableBalance - transfer.amount,
      createdAt: timestamp,
      createdBy: actor
    });

    const sourceBal = (await eventBalanceService.getEventBalance(transfer.sourceEventId)).data;
    eventBalanceService.updateLocalEventBalance(transfer.sourceEventId, transfer.amount, {
      id: `MOV-${transfer.sourceEventId}-${Date.now()}-REV-IN`,
      eventId: transfer.sourceEventId,
      producerId: transfer.producerId,
      transferId: reverseId,
      type: 'ESTORNO_TRANSFERENCIA_ENTRADA',
      description: `Estorno creditado da transferência ${transferId}`,
      amount: transfer.amount,
      balanceBefore: sourceBal.balances.availableBalance,
      balanceAfter: sourceBal.balances.availableBalance + transfer.amount,
      createdAt: timestamp,
      createdBy: actor
    });

    AUDIT_LOGS.unshift({
      id: `AUD-${Date.now()}-REV`,
      transferId,
      actor,
      action: 'ESTORNO_TRANSFERENCIA',
      timestamp,
      details: `Estorno efetuado para transferência ${transferId}. Motivo: ${reason}`,
      ip: '127.0.0.1'
    });

    this.addTimelineEvent(transferId, {
      type: 'ESTORNO_CONCLUIDO',
      actorName: actor,
      actorRole: 'Controladoria',
      description: `Operação reversa ${reverseId} concluída. Motivo: ${reason}`,
      previousStatus: 'CONCLUIDA',
      newStatus: 'ESTORNADA'
    });

    return transfer;
  },

  /**
   * Fase 26.17.9.5.2 — Aprovar transferência pendente
   */
  async approveTransfer(transferId, actor = 'Gerente Financeiro', comment = '') {
    const transfer = LOCAL_TRANSFERS.find(t => t.id === transferId);
    if (!transfer) throw new Error("Transferência não localizada.");

    if (transfer.status !== 'EM_APROVACAO' && transfer.status !== 'PENDENTE') {
      throw new Error(`Apenas transferências EM_APROVACAO podem ser aprovadas. Status atual: ${transfer.status}`);
    }

    // Regra Crítica: Solicitante não pode aprovar a própria transferência (Segregação de Funções)
    if (transfer.requestedBy && transfer.requestedBy.toLowerCase() === actor.toLowerCase()) {
      throw new Error("Violação de Alçada: O solicitante da transferência não pode ser o aprovador.");
    }

    const apiRes = await eventBalanceGateway.approveTransfer(transferId, comment);
    if (apiRes.ok && apiRes.data) return apiRes.data;

    const sourceEv = (await eventBalanceService.getEventBalance(transfer.sourceEventId)).data;
    const targetEv = (await eventBalanceService.getEventBalance(transfer.targetEventId)).data;

    const timestamp = new Date().toISOString();

    // 1. Liberar reserva e consolidar débito oficial
    eventBalanceService.releaseReservation(transfer.sourceEventId, transfer.amount, transferId);
    eventBalanceService.updateLocalEventBalance(transfer.sourceEventId, -transfer.amount, {
      id: `MOV-${transfer.sourceEventId}-${Date.now()}-OUT`,
      eventId: transfer.sourceEventId,
      producerId: sourceEv.producerId,
      transferId,
      type: 'TRANSFERENCIA_EVENTO_SAIDA',
      description: `Transferência aprovada para ${targetEv.eventName} (${transferId})`,
      amount: -transfer.amount,
      balanceBefore: sourceEv.balances.availableBalance,
      balanceAfter: sourceEv.balances.availableBalance - transfer.amount,
      createdAt: timestamp,
      createdBy: actor
    });

    // 2. Consolidar crédito oficial no destino
    eventBalanceService.updateLocalEventBalance(transfer.targetEventId, transfer.amount, {
      id: `MOV-${transfer.targetEventId}-${Date.now()}-IN`,
      eventId: transfer.targetEventId,
      producerId: targetEv.producerId,
      transferId,
      type: 'TRANSFERENCIA_EVENTO_ENTRADA',
      description: `Transferência aprovada recebida de ${sourceEv.eventName} (${transferId})`,
      amount: transfer.amount,
      balanceBefore: targetEv.balances.availableBalance,
      balanceAfter: targetEv.balances.availableBalance + transfer.amount,
      createdAt: timestamp,
      createdBy: actor
    });

    transfer.status = 'CONCLUIDA';
    transfer.approvedBy = actor;
    transfer.processedAt = timestamp;
    if (comment) transfer.notes = (transfer.notes ? transfer.notes + ' | ' : '') + `Aprovação: ${comment}`;

    this.addTimelineEvent(transferId, {
      type: 'APROVADA_E_EXECUTADA',
      actorName: actor,
      actorRole: 'Controladoria',
      description: `Transferência aprovada e executada por ${actor}. ${comment ? `Comentário: ${comment}` : ''}`,
      previousStatus: 'EM_APROVACAO',
      newStatus: 'CONCLUIDA'
    });

    AUDIT_LOGS.unshift({
      id: `AUD-${Date.now()}-APP`,
      transferId,
      actor,
      action: 'TRANSFERENCIA_APROVADA',
      timestamp,
      details: `Transferência ${transferId} aprovada por ${actor}.`,
      ip: '127.0.0.1'
    });

    return transfer;
  },

  /**
   * Fase 26.17.9.5.2 — Rejeitar transferência pendente
   */
  async rejectTransfer(transferId, reason = 'Rejeitada pela alçada financeira', actor = 'Gerente Financeiro') {
    const transfer = LOCAL_TRANSFERS.find(t => t.id === transferId);
    if (!transfer) throw new Error("Transferência não localizada.");

    if (transfer.status !== 'EM_APROVACAO' && transfer.status !== 'PENDENTE') {
      throw new Error(`Apenas transferências pendentes podem ser rejeitadas.`);
    }

    const apiRes = await eventBalanceGateway.rejectTransfer(transferId, reason);
    if (apiRes.ok && apiRes.data) return apiRes.data;

    // Liberar reserva e restaurar saldo utilizável no evento de origem
    eventBalanceService.releaseReservation(transfer.sourceEventId, transfer.amount, transferId);

    const timestamp = new Date().toISOString();
    transfer.status = 'REJEITADA';
    transfer.notes = (transfer.notes ? transfer.notes + ' | ' : '') + `Rejeição: ${reason}`;

    this.addTimelineEvent(transferId, {
      type: 'REJEITADA',
      actorName: actor,
      actorRole: 'Controladoria',
      description: `Transferência rejeitada por ${actor}. Motivo: ${reason}`,
      previousStatus: 'EM_APROVACAO',
      newStatus: 'REJEITADA'
    });

    AUDIT_LOGS.unshift({
      id: `AUD-${Date.now()}-REJ`,
      transferId,
      actor,
      action: 'TRANSFERENCIA_REJEITADA',
      timestamp,
      details: `Transferência ${transferId} rejeitada por ${actor}. Motivo: ${reason}`,
      ip: '127.0.0.1'
    });

    return transfer;
  },

  /**
   * Fase 26.17.9.5.2 — Retorna transferências pendentes de aprovação
   */
  async getPendingApprovals(producerId = null) {
    const history = await this.getTransfersHistory(producerId);
    const list = history.ok && history.data ? history.data : LOCAL_TRANSFERS;
    return list.filter(t => t.status === 'EM_APROVACAO' || t.status === 'PENDENTE');
  },

  /**
   * Fase 26.17.9.5.3 — Timeline append-only
   */
  addTimelineEvent(transferId, eventData) {
    if (!LOCAL_TIMELINES[transferId]) LOCAL_TIMELINES[transferId] = [];
    LOCAL_TIMELINES[transferId].push({
      id: `TL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transferId,
      occurredAt: new Date().toISOString(),
      ...eventData
    });
  },

  async getTransferTimeline(transferId) {
    const res = await eventBalanceGateway.getTimeline(transferId);
    if (res.ok && res.data && Array.isArray(res.data)) {
      return { ok: true, isLiveApi: true, data: res.data };
    }

    if (!LOCAL_TIMELINES[transferId]) {
      const transfer = LOCAL_TRANSFERS.find(t => t.id === transferId);
      if (transfer) {
        LOCAL_TIMELINES[transferId] = [
          {
            id: `TL-${transferId}-1`,
            transferId,
            type: 'SOLICITADA',
            occurredAt: transfer.createdAt,
            actorName: transfer.requestedBy,
            actorRole: 'Produtor',
            description: `Solicitação de transferência de R$ ${transfer.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} criada.`,
            previousStatus: null,
            newStatus: 'SOLICITADA'
          },
          {
            id: `TL-${transferId}-2`,
            transferId,
            type: transfer.status === 'CONCLUIDA' ? 'CONCLUIDA' : transfer.status,
            occurredAt: transfer.processedAt || transfer.createdAt,
            actorName: transfer.approvedBy || 'Sistema',
            actorRole: 'Controladoria',
            description: `Transferência ${transfer.status.toLowerCase()} com sucesso.`,
            previousStatus: 'SOLICITADA',
            newStatus: transfer.status
          }
        ];
      } else {
        LOCAL_TIMELINES[transferId] = [];
      }
    }

    return { ok: true, isLiveApi: false, data: LOCAL_TIMELINES[transferId] };
  },

  /**
   * Lista o histórico de transferências
   */
  async getTransfers(params = {}) {
    const producerId = typeof params === 'string' ? params : params?.producerId;
    const eventId = typeof params === 'object' ? params?.eventId : null;
    const status = typeof params === 'object' ? params?.status : null;

    const res = await eventBalanceGateway.getTransfers({ producerId });
    let list = (res.ok && res.data && Array.isArray(res.data)) ? res.data : LOCAL_TRANSFERS;

    if (producerId) list = list.filter(t => t.producerId === producerId);
    if (eventId) list = list.filter(t => String(t.sourceEventId) === String(eventId) || String(t.targetEventId) === String(eventId));
    if (status) list = list.filter(t => t.status === status);

    return { ok: true, isLiveApi: res.ok, data: list };
  },

  async getTransfersHistory(producerId = null) {
    return this.getTransfers({ producerId });
  },

  /**
   * Obtém logs de auditoria
   */
  async getAuditLogs(transferId = null) {
    if (transferId) {
      const res = await eventBalanceGateway.getTransferAudit(transferId);
      if (res.ok && res.data) return { ok: true, isLiveApi: true, data: res.data };
      return { ok: true, isLiveApi: false, data: AUDIT_LOGS.filter(a => a.transferId === transferId) };
    }
    return { ok: true, isLiveApi: false, data: AUDIT_LOGS };
  }
};
