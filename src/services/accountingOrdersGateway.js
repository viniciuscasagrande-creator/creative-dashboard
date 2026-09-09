/**
 * Fase 26.17.9.3 — Gateway de Pedidos Contábeis Reais
 * Fonte oficial apenas. Não possui fallback mock/localStorage.
 */
const API_BASE = (
  import.meta.env.VITE_PDT_API_BASE_URL ||
  import.meta.env.VITE_ACCOUNTING_API_BASE_URL ||
  ''
).replace(/\/$/, '');

function buildUrl(path, params = {}) {
  const base = API_BASE || window.location.origin;
  const url = new URL(path, base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function request(path, { method = 'GET', params = {}, body } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
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

export const accountingOrdersGateway = {
  search: (params = {}) => request('/api/accounting/orders', { params }),
  detail: (orderId) => request(`/api/accounting/orders/${encodeURIComponent(orderId)}`),
  timeline: (orderId) => request(`/api/accounting/orders/${encodeURIComponent(orderId)}/timeline`),
  accountingEntries: (orderId) => request(`/api/accounting/orders/${encodeURIComponent(orderId)}/accounting-entries`),
  auditLog: (orderId) => request(`/api/accounting/orders/${encodeURIComponent(orderId)}/audit-log`),
  addAuditNote: (orderId, payload) => request(`/api/accounting/orders/${encodeURIComponent(orderId)}/audit-log`, { method: 'POST', body: payload })
};
