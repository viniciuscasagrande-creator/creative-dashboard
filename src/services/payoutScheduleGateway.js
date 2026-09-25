/**
 * Fase 26.17.9.5.7 — Gateway REST de Integração para Agenda Financeira e Lotes de Repasse
 * Orquestra chamadas com o backend e fallback resiliente para o payoutScheduleService.
 */

import { payoutScheduleService } from './payoutScheduleService.js';

const BASE_API_URL = '/api/payouts';

export const payoutScheduleGateway = {
  // 1. Agenda Financeira
  async getSchedule(params = {}) {
    try {
      const res = await fetch(`${BASE_API_URL}/schedule?` + new URLSearchParams(params));
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.getSchedule(params);
  },

  async schedulePayout(data, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.schedulePayout(data, actor);
  },

  async cancelScheduledPayout(scheduleId, justification, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/schedule/${scheduleId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ justification, actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.cancelScheduledPayout(scheduleId, justification, actor);
  },

  // 2. Lotes de Repasse
  async getPayoutBatches(params = {}) {
    try {
      const res = await fetch(`${BASE_API_URL}/batches?` + new URLSearchParams(params));
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.getPayoutBatches(params);
  },

  async getPayoutBatchById(batchId) {
    try {
      const res = await fetch(`${BASE_API_URL}/batches/${batchId}`);
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.getPayoutBatchById(batchId);
  },

  async createPayoutBatch(payload, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.createPayoutBatch(payload, actor);
  },

  async validatePayoutBatch(batchId, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/batches/${batchId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.validatePayoutBatch(batchId, actor);
  },

  async approvePayoutBatch(batchId, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/batches/${batchId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.approvePayoutBatch(batchId, actor);
  },

  async processPayoutBatch(batchId, options = {}) {
    try {
      const res = await fetch(`${BASE_API_URL}/batches/${batchId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': options.idempotencyKey || ''
        },
        body: JSON.stringify(options)
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.processPayoutBatch(batchId, options);
  },

  // 3. Webhook de Retorno Bancário
  async processBankReturnWebhook(webhookPayload, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/webhooks/bank-return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...webhookPayload, actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.processBankReturnWebhook(webhookPayload, actor);
  },

  // 4. Reprocessamento Seguro
  async retryPayoutItem(itemId, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/items/${itemId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.retryPayoutItem(itemId, actor);
  },

  // 5. Trilha de Auditoria
  async getScheduleAuditLog() {
    return { ok: true, data: payoutScheduleService.getScheduleAuditLog() };
  },

  // 6. Aprovação por Alçada Individual (Opção B Unificada)
  async approveIndividualPayout(scheduleId, actor, notes) {
    try {
      const res = await fetch(`${BASE_API_URL}/schedule/${scheduleId}/approve-individual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, notes })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    try {
      return await payoutScheduleService.approveIndividualPayout(scheduleId, actor, notes);
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  async settleIndividualPayout(scheduleId, actor, options) {
    try {
      const res = await fetch(`${BASE_API_URL}/schedule/${scheduleId}/settle-individual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, options })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    try {
      return await payoutScheduleService.settleIndividualPayout(scheduleId, actor, options);
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  async rejectIndividualPayout(scheduleId, actor, reason) {
    try {
      const res = await fetch(`${BASE_API_URL}/schedule/${scheduleId}/reject-individual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, reason })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    try {
      return await payoutScheduleService.rejectIndividualPayout(scheduleId, actor, reason);
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  // 7. Visão do Produtor & Comprovante Oficial
  async getProducerPayoutsView(producerId) {
    try {
      const res = await fetch(`${BASE_API_URL}/producer-view?producerId=${producerId || 'prod-1'}`);
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.getProducerPayoutsView(producerId);
  },

  async getPayoutReceipt(payoutId) {
    try {
      const res = await fetch(`${BASE_API_URL}/receipts/${payoutId}`);
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return payoutScheduleService.getPayoutReceipt(payoutId);
  }
};
