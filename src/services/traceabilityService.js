/**
 * Fase 26.17.9.3 — Rastreabilidade baseada em Pedidos Reais.
 * Sem INITIAL_TRACEABILITY_ORDERS e sem localStorage como fonte contábil.
 */
import { accountingOrdersGateway } from './accountingOrdersGateway.js';

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.orders)) return payload.orders;
  return [];
}

function normalizeOrder(payload) {
  const data = payload?.data || payload?.order || payload;
  if (!data || typeof data !== 'object') return null;
  return {
    ...data,
    composition: data.composition || {},
    timeline: Array.isArray(data.timeline) ? data.timeline : [],
    accountingEntries: Array.isArray(data.accountingEntries) ? data.accountingEntries : []
  };
}

class TraceabilityService {
  async searchOrders(query = '', _userRole = 'ADMIN', _userProducerId = null) {
    const result = await accountingOrdersGateway.search({ query: (query || '').trim() });
    if (!result.ok) {
      return { success: false, error: this.toUserError(result), data: [] };
    }
    return { success: true, error: null, data: normalizeList(result.data) };
  }

  async getOrderTraceability(orderId, _userRole = 'ADMIN', _userProducerId = null) {
    const cleanId = String(orderId || '').trim();
    if (!cleanId) return { success: false, error: 'Informe um pedido ou transação para consultar.' };

    const detailResult = await accountingOrdersGateway.detail(cleanId);
    if (!detailResult.ok) {
      return { success: false, error: this.toUserError(detailResult, cleanId) };
    }

    const order = normalizeOrder(detailResult.data);
    if (!order) return { success: false, error: 'A API respondeu sem dados válidos para o pedido.' };

    // Se o backend ainda não agregar tudo no endpoint principal, completa por endpoints oficiais.
    const tasks = [];
    if (!order.timeline.length) tasks.push(accountingOrdersGateway.timeline(cleanId));
    else tasks.push(Promise.resolve(null));
    if (!order.accountingEntries.length) tasks.push(accountingOrdersGateway.accountingEntries(cleanId));
    else tasks.push(Promise.resolve(null));

    const [timelineResult, entriesResult] = await Promise.all(tasks);
    if (timelineResult?.ok) order.timeline = normalizeList(timelineResult.data);
    if (entriesResult?.ok) order.accountingEntries = normalizeList(entriesResult.data);

    return { success: true, data: order };
  }

  async getAuditLogs(orderId) {
    const cleanId = String(orderId || '').trim();
    if (!cleanId) return { success: true, data: [] };
    const result = await accountingOrdersGateway.auditLog(cleanId);
    if (!result.ok) return { success: false, error: this.toUserError(result), data: [] };
    return { success: true, data: normalizeList(result.data) };
  }

  async addAuditLog(orderId, action, actor = '', details = '') {
    const result = await accountingOrdersGateway.addAuditNote(orderId, { action, actor, details });
    if (!result.ok) return { success: false, error: this.toUserError(result) };
    return { success: true, data: result.data };
  }

  toUserError(result, orderId = '') {
    if (result.status === 401 || result.status === 403) return 'Acesso não autorizado para consultar este pedido.';
    if (result.status === 404) return `Pedido ou transação ${orderId || ''} não encontrado na fonte oficial.`.trim();
    if (result.error === 'TIMEOUT') return 'A API oficial de pedidos excedeu o tempo de resposta.';
    if (result.status === 0) return 'A API oficial de pedidos está indisponível. Nenhum dado simulado foi utilizado.';
    return result.error || 'Não foi possível consultar a fonte oficial de pedidos.';
  }
}

export const traceabilityService = new TraceabilityService();
if (typeof window !== 'undefined') window.traceabilityService = traceabilityService;
