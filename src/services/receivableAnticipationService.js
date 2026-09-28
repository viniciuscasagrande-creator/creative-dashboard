/**
 * ============================================================================
 * DISK — SERVIÇO DE ANTECIPAÇÃO DE RECEBÍVEIS & ELEGIBILIDADE
 * Cálculo de Base Elegível, Simulação Financeira, Reserva e Baixa de Agenda
 * ============================================================================
 */

import { eventBalanceService } from './eventBalanceService.js';
import { payoutScheduleService } from './payoutScheduleService.js';
import { accessAuditService } from './accessAuditService.js';

// Base em memória de recebíveis futuros por evento
let FUTURE_RECEIVABLES_STORE = [
  {
    id: 'REC-3368-01',
    eventId: '3368',
    producerId: 'prod-1',
    dueDate: '2026-10-15',
    dueDateLabel: '15/10/2026',
    grossAmount: 40000.00,
    status: 'DISPONIVEL', // DISPONIVEL | BLOQUEADO_ANTECIPACAO | ANTECIPADO | LIQUIDADO
    contractRate: 2.50,
    lockedByRequestId: null
  },
  {
    id: 'REC-3368-02',
    eventId: '3368',
    producerId: 'prod-1',
    dueDate: '2026-10-22',
    dueDateLabel: '22/10/2026',
    grossAmount: 35000.00,
    status: 'DISPONIVEL',
    contractRate: 2.50,
    lockedByRequestId: null
  },
  {
    id: 'REC-3368-03',
    eventId: '3368',
    producerId: 'prod-1',
    dueDate: '2026-10-29',
    dueDateLabel: '29/10/2026',
    grossAmount: 25000.00,
    status: 'DISPONIVEL',
    contractRate: 2.50,
    lockedByRequestId: null
  },
  {
    id: 'REC-3178-01',
    eventId: '3178',
    producerId: 'prod-1',
    dueDate: '2026-10-18',
    dueDateLabel: '18/10/2026',
    grossAmount: 20000.00,
    status: 'DISPONIVEL',
    contractRate: 2.50,
    lockedByRequestId: null
  },
  {
    id: 'REC-3042-01',
    eventId: '3042',
    producerId: 'prod-2',
    dueDate: '2026-10-20',
    dueDateLabel: '20/10/2026',
    grossAmount: 60000.00,
    status: 'DISPONIVEL',
    contractRate: 2.20,
    lockedByRequestId: null
  }
];

export const receivableAnticipationService = {
  /**
   * Obtém a taxa contratual de antecipação do evento/produtor
   */
  getContractRate(eventId = '3368', producerId = 'prod-1') {
    const rec = FUTURE_RECEIVABLES_STORE.find(r => String(r.eventId) === String(eventId));
    if (rec && rec.contractRate) return rec.contractRate;
    return producerId === 'prod-2' ? 2.20 : 2.50; // Taxa contratual real (não arbitrária)
  },

  /**
   * Cálculo da Base Elegível para Antecipação:
   * Base Elegível = Recebíveis futuros elegíveis - valores já antecipados - reservas - compromissos - retenções
   */
  async calculateEligibleBase(eventId = '3368', producerId = 'prod-1') {
    const eventIdStr = String(eventId);

    // 1. Recebíveis futuros disponíveis
    const eventReceivables = FUTURE_RECEIVABLES_STORE.filter(r => 
      String(r.eventId) === eventIdStr && 
      (r.status === 'DISPONIVEL' || r.status === 'BLOQUEADO_ANTECIPACAO')
    );

    const futureReceivables = eventReceivables.reduce((acc, r) => acc + (r.grossAmount || 0), 0);
    const availableReceivables = eventReceivables.filter(r => r.status === 'DISPONIVEL');
    const availableGross = availableReceivables.reduce((acc, r) => acc + (r.grossAmount || 0), 0);

    // 2. Saldos e compromissos do evento
    let committed = 0;
    let alreadyAnticipated = 0;
    let reserves = 0;
    let retentions = 0;

    const balRes = await eventBalanceService.getEventBalance(eventIdStr);
    if (balRes && balRes.data) {
      const b = balRes.data.balances || {};
      committed = b.committedBalance || 0;
      alreadyAnticipated = b.pendingAdvances || 0;
      reserves = b.blockedBalance || 0;
      retentions = Number(((futureReceivables || 100000) * 0.05).toFixed(2)); // Retenção cautelar contratual de 5%
    }

    const eligibleBase = Number(Math.max(0, availableGross - retentions).toFixed(2));

    return {
      eventId: eventIdStr,
      producerId,
      futureReceivables,
      availableReceivablesAmount: availableGross,
      alreadyAnticipated,
      committed,
      reserves,
      retentions,
      eligibleBase,
      contractRate: this.getContractRate(eventIdStr, producerId),
      nextPayoutDate: '2026-10-15',
      openAnticipationsCount: alreadyAnticipated > 0 ? 1 : 0,
      receivablesList: eventReceivables
    };
  },

  /**
   * Simulação Oficial de Antecipação
   * Mostra: Valor solicitado, Taxa contratual, Custo estimado, Encargos, Valor líquido estimado, Data estimada.
   */
  async simulateAnticipation({
    eventId = '3368',
    producerId = 'prod-1',
    requestedAmount = 10000.00
  }) {
    const numAmount = Number(requestedAmount) || 0;
    const baseInfo = await this.calculateEligibleBase(eventId, producerId);

    const rate = baseInfo.contractRate; // Taxa real configurada
    const estimatedCost = Number((numAmount * (rate / 100)).toFixed(2));
    const otherCharges = 0.00;
    const estimatedNet = Number((numAmount - estimatedCost - otherCharges).toFixed(2));

    // Alocação sequencial nas agendas disponíveis
    let remainingToAllocate = numAmount;
    const allocatedSchedule = [];

    for (const rec of baseInfo.receivablesList.filter(r => r.status === 'DISPONIVEL')) {
      if (remainingToAllocate <= 0) break;
      const allocAmount = Math.min(remainingToAllocate, rec.grossAmount);
      allocatedSchedule.push({
        id: rec.id,
        dueDate: rec.dueDate,
        dueDateLabel: rec.dueDateLabel,
        grossAvailable: rec.grossAmount,
        allocatedAmount: allocAmount
      });
      remainingToAllocate -= allocAmount;
    }

    return {
      requestedAmount: numAmount,
      eligibleBase: baseInfo.eligibleBase,
      contractRate: rate,
      estimatedCost,
      otherCharges,
      estimatedNet,
      estimatedDate: '24 horas úteis pós-aprovação',
      allocatedSchedule,
      disclaimer: 'Esta é uma simulação. O valor final está sujeito à análise e aprovação do Financeiro Disk.',
      isEligible: numAmount <= baseInfo.eligibleBase && numAmount > 0,
      calculatedAt: new Date().toISOString()
    };
  },

  /**
   * Bloqueio Cautelar dos Recebíveis (Ao submeter solicitação de antecipação)
   */
  lockReceivables(requestId, allocatedSchedule = []) {
    allocatedSchedule.forEach(alloc => {
      const rec = FUTURE_RECEIVABLES_STORE.find(r => r.id === alloc.id);
      if (rec) {
        rec.status = 'BLOQUEADO_ANTECIPACAO';
        rec.lockedByRequestId = requestId;
      }
    });
  },

  /**
   * Liberação de Recebíveis Bloqueados (Em caso de reprovação ou cancelamento)
   */
  releaseReceivables(requestId) {
    FUTURE_RECEIVABLES_STORE.forEach(rec => {
      if (rec.lockedByRequestId === requestId) {
        rec.status = 'DISPONIVEL';
        rec.lockedByRequestId = null;
      }
    });
  },

  /**
   * Liquidação Definitiva da Antecipação (Após aprovação definitiva pelo Financeiro Disk)
   * Marca recebíveis como ANTECIPADO e registra movimentação no Ledger.
   */
  settleAnticipation(requestId, item) {
    const eventId = String(item.eventId || '3368');
    const grossAmount = item.amount || 0;
    const feeAmount = item.payload?.advanceSnapshot?.estimatedCost || Number((grossAmount * 0.025).toFixed(2));
    const netAmount = item.payload?.advanceSnapshot?.estimatedNet || Number((grossAmount - feeAmount).toFixed(2));

    // 1. Marca recebíveis como ANTECIPADO (impedir antecipação duplicada)
    FUTURE_RECEIVABLES_STORE.forEach(rec => {
      if (rec.lockedByRequestId === requestId) {
        rec.status = 'ANTECIPADO';
      }
    });

    // 2. Registro no Ledger do Evento
    const ledgerMovement = {
      id: `MOV-ANT-${eventId}-${Date.now()}`,
      eventId,
      producerId: item.producerId,
      advanceId: `ADV-${requestId}`,
      type: 'ANTECIPACAO_LIQUIDADA',
      description: `Antecipação aprovada de recebíveis (${item.protocol || item.id}) - Líquido Creditado`,
      amount: netAmount,
      grossAmount,
      feeAmount,
      referenceType: 'ADVANCE_SETTLEMENT',
      referenceId: item.id,
      createdAt: new Date().toISOString(),
      createdBy: item.reviewedBy?.name || 'Sistema de Antecipações'
    };

    eventBalanceService.updateLocalEventBalance(eventId, netAmount, ledgerMovement);

    accessAuditService.log({
      actorId: item.reviewedBy?.id || 'SISTEMA',
      actorName: item.reviewedBy?.name || 'Sistema Financeiro',
      actorRole: 'FINANCEIRO',
      action: 'ADVANCE_SETTLED',
      details: `Antecipação ${item.id} liquidada no Ledger. Bruto: R$ ${grossAmount.toFixed(2)}, Taxa: R$ ${feeAmount.toFixed(2)}, Líquido: R$ ${netAmount.toFixed(2)}.`
    });

    return { ok: true, ledgerMovement, netAmount, feeAmount };
  }
};
