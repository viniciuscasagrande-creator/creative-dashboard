/**
 * Fase 26.17.9.5 & Fase 26.17.9.5.1 — Gateway de Saldos e Transferências Financeiras Reais
 * Conexão oficial com endpoints REST de finanças do PDT.
 */

const API_BASE = (
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_PDT_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_ACCOUNTING_API_BASE_URL) ||
  (typeof process !== 'undefined' && process?.env?.VITE_PDT_API_BASE_URL) ||
  ''
).replace(/\/$/, '');

function buildUrl(path, params = {}) {
  const base = API_BASE || window.location.origin;
  const url = new URL(path, base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'todos') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function request(path, { method = 'GET', params = {}, body } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(buildUrl(path, params), {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    let payload = null;
    try { payload = await response.json(); } catch (_) { payload = null; }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: payload?.message || payload?.error || `HTTP ${response.status}`,
        data: null
      };
    }

    return { ok: true, status: response.status, error: null, data: payload };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error?.name === 'AbortError' ? 'TIMEOUT' : (error?.message || 'NETWORK_ERROR'),
      data: null
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const eventBalanceGateway = {
  getOverview: (params = {}) => request('/api/finance/balances/overview', { params }),
  getDashboard: (params = {}) => request('/api/finance/balances/dashboard', { params }),
  getEvents: (params = {}) => request('/api/finance/balances/events', { params }),
  getEventBalance: (eventId) => request(`/api/finance/balances/events/${encodeURIComponent(eventId)}`),
  getEventMovements: (eventId) => request(`/api/finance/balances/events/${encodeURIComponent(eventId)}/movements`),
  getTransfers: (params = {}) => request('/api/finance/balance-transfers', { params }),
  getTransferById: (id) => request(`/api/finance/balance-transfers/${encodeURIComponent(id)}`),
  getTimeline: (id) => request(`/api/finance/balance-transfers/${encodeURIComponent(id)}/timeline`),
  createTransfer: (payload) => request('/api/finance/balance-transfers', { method: 'POST', body: payload }),
  approveTransfer: (id, comment = '') => request(`/api/finance/balance-transfers/${encodeURIComponent(id)}/approve`, { method: 'POST', body: { comment } }),
  rejectTransfer: (id, reason) => request(`/api/finance/balance-transfers/${encodeURIComponent(id)}/reject`, { method: 'POST', body: { reason } }),
  cancelTransfer: (id, reason) => request(`/api/finance/balance-transfers/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: { reason } }),
  reverseTransfer: (id, reason) => request(`/api/finance/balance-transfers/${encodeURIComponent(id)}/reverse`, { method: 'POST', body: { reason } }),
  getTransferAudit: (id) => request(`/api/finance/balance-transfers/${encodeURIComponent(id)}/audit-log`)
};
