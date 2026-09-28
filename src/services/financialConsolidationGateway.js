/**
 * Implantação 5.2 — Gateway de Consolidação Financeira Real
 * Fonte oficial: Core/Ledger + Contratos + Adquirentes + Estornos/Chargebacks + Repasses.
 * Sem fallback mock: falhas são expostas como indisponibilidade para não mascarar números financeiros.
 */
const API_BASE = (
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_PDT_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_FINANCE_API_BASE_URL) ||
  ''
).replace(/\/$/, '');

function urlFor(path, params = {}) {
  const base = API_BASE || window.location.origin;
  const url = new URL(path, base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all' && value !== 'todos') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function request(path, { method = 'GET', params = {}, body } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const response = await fetch(urlFor(path, params), {
      method,
      credentials: 'include',
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctl.signal
    });
    let payload = null;
    try { payload = await response.json(); } catch (_) { payload = null; }
    if (!response.ok) return { ok: false, status: response.status, error: payload?.message || payload?.error || `HTTP ${response.status}`, data: null };
    return { ok: true, status: response.status, error: null, data: payload };
  } catch (error) {
    return { ok: false, status: 0, error: error?.name === 'AbortError' ? 'TIMEOUT' : (error?.message || 'NETWORK_ERROR'), data: null };
  } finally { clearTimeout(timer); }
}

export const financialConsolidationGateway = {
  // Core/Ledger — posição e movimentos consolidados Evento → Produtor → DiskIngressos.
  getPosition: (params = {}) => request('/api/finance/consolidated/position', { params }),
  getEvents: (params = {}) => request('/api/finance/balances/events', { params }),
  getLedgerSummary: (params = {}) => request('/api/finance/ledger/summary', { params }),

  // Contratos — taxa Disk versionada por produtor/evento.
  getFeeRules: (params = {}) => request('/api/finance/contracts/fee-rules', { params }),
  createFeeRule: (payload) => request('/api/finance/contracts/fee-rules', { method: 'POST', body: payload }),

  // Adquirência — MDR e liquidações reais. Acquirers oficiais suportados nesta tela.
  getAcquirerSettlements: (params = {}) => request('/api/finance/acquirers/settlements', { params }),
  getAcquirerContracts: (params = {}) => request('/api/finance/acquirers/contracts', { params }),

  // Eventos financeiros de reversão.
  getRefunds: (params = {}) => request('/api/finance/refunds', { params }),
  getChargebacks: (params = {}) => request('/api/finance/chargebacks', { params }),

  // Repasses liquidados — não confundir solicitado/aprovado com liquidado.
  getPayoutSettlements: (params = {}) => request('/api/finance/payouts/settlements', { params })
};
