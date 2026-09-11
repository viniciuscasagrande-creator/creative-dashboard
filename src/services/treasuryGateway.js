/**
 * Fase 26.17.9.4.6 — Gateway REST de Integração para Tesouraria Operacional
 * Comunicação com backend bancário e fallback resiliente para treasuryService.
 */

import { treasuryService } from './treasuryService.js';

const BASE_API_URL = '/api/treasury';

export const treasuryGateway = {
  // 1. Dashboard & KPIs
  async getTreasuryDashboard(producerId = 'prod-1') {
    try {
      const res = await fetch(`${BASE_API_URL}/dashboard?producerId=${producerId}`);
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.getTreasuryDashboard(producerId);
  },

  // 2. Contas Bancárias Reais
  async getBankAccounts(params = {}) {
    try {
      const res = await fetch(`${BASE_API_URL}/accounts?` + new URLSearchParams(params));
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.getBankAccounts(params);
  },

  async getBankAccountById(id) {
    try {
      const res = await fetch(`${BASE_API_URL}/accounts/${id}`);
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.getBankAccountById(id);
  },

  async createBankAccount(data, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.createBankAccount(data, actor);
  },

  async requestBankAccountChange(data, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/accounts/change-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.requestBankAccountChange(data, actor);
  },

  async approveBankAccountChange(requestId, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/accounts/change-request/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.approveBankAccountChange(requestId, actor);
  },

  // 3. Pagamentos PIX & Individuais
  async getPayments(params = {}) {
    try {
      const res = await fetch(`${BASE_API_URL}/payments?` + new URLSearchParams(params));
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.getPayments(params);
  },

  async createPixPayment(data, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/payments/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.createPixPayment(data, actor);
  },

  async approvePayment(paymentId, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.approvePayment(paymentId, actor);
  },

  async submitPixPayment(paymentId, options = {}) {
    try {
      const res = await fetch(`${BASE_API_URL}/payments/${paymentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': options.idempotencyKey || ''
        },
        body: JSON.stringify(options)
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.submitPixPayment(paymentId, options);
  },

  // 4. Lotes & CNAB 240 / 400
  async getPaymentBatches(params = {}) {
    try {
      const res = await fetch(`${BASE_API_URL}/batches?` + new URLSearchParams(params));
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.getPaymentBatches(params);
  },

  async createPaymentBatch(data, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.createPaymentBatch(data, actor);
  },

  async approvePaymentBatch(batchId, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/batches/${batchId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.approvePaymentBatch(batchId, actor);
  },

  async generateCnab240Remessa(batchId, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/batches/${batchId}/cnab240-remessa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.generateCnab240Remessa(batchId, actor);
  },

  async processCnabRetorno(filename, fileContent, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/cnab/retorno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, fileContent, actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return treasuryService.processCnabRetorno(filename, fileContent, actor);
  },

  // 5. Auditoria
  async getTreasuryAuditLog() {
    return { ok: true, data: treasuryService.getTreasuryAuditLog() };
  }
};
