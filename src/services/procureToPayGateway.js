/**
 * Fase 26.17.9.4.5 — Gateway REST de Integração do Procure-to-Pay SafeSaff / PDT
 * Implementa o contrato de APIs documentado na Seção 18 da especificação.
 */

import { procureToPayService } from './procureToPayService.js';

const BASE_API_URL = '/api';

export const procureToPayGateway = {
  // 1. Fornecedores
  async getSuppliers(params = {}) {
    try {
      const res = await fetch(`${BASE_API_URL}/suppliers?` + new URLSearchParams(params));
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.getSuppliers(params);
  },

  async getSupplierById(id) {
    try {
      const res = await fetch(`${BASE_API_URL}/suppliers/${id}`);
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.getSupplierById(id);
  },

  async createSupplier(data, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.createSupplier(data, actor);
  },

  // 2. Solicitações de Compra
  async getPurchaseRequests(params = {}) {
    try {
      const res = await fetch(`${BASE_API_URL}/purchases/requests?` + new URLSearchParams(params));
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.getPurchaseRequests(params);
  },

  async createPurchaseRequest(data, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/purchases/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.createPurchaseRequest(data, actor);
  },

  async submitPurchaseRequest(id, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/purchases/requests/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.submitPurchaseRequest(id, actor);
  },

  // 3. Cotações & Pedidos
  async createQuotation(requestId, payload, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/purchases/requests/${requestId}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.createQuotation({ purchaseRequestId: requestId, ...payload }, actor);
  },

  async createPurchaseOrder(orderData, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/purchases/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.createPurchaseOrder(orderData, actor);
  },

  // 4. Contratos
  async getContracts(params = {}) {
    try {
      const res = await fetch(`${BASE_API_URL}/contracts?` + new URLSearchParams(params));
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.getContracts(params);
  },

  async getContractById(id) {
    try {
      const res = await fetch(`${BASE_API_URL}/contracts/${id}`);
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.getContractById(id);
  },

  async createContract(data, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.createContract(data, actor);
  },

  // 5. Central de Aprovações
  async getApprovalInbox(params = {}) {
    try {
      const res = await fetch(`${BASE_API_URL}/approvals/inbox?` + new URLSearchParams(params));
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.getApprovalInbox(params);
  },

  async approveItem(id, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/approvals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.processApprovalDecision({ inboxItemId: id, decision: 'APPROVED', actor });
  },

  async rejectItem(id, justification, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/approvals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ justification, actor })
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.processApprovalDecision({ inboxItemId: id, decision: 'REJECTED', justification, actor });
  },

  // 6. Recebimento & 3-Way Match
  async matchDocument(payload, actor) {
    try {
      const res = await fetch(`${BASE_API_URL}/finance/documents/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return { ok: true, isLiveApi: true, data: await res.json() };
    } catch (_) {}
    return procureToPayService.executeThreeWayMatch({ ...payload, actor });
  }
};
