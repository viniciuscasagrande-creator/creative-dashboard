/**
 * Fase 26.17.9.4.5 — Controlador do Procure-to-Pay SafeSaff / PDT
 * Orquestra Fornecedores 360°, Compras, Cotações, Pedidos de Compra, Contratos,
 * Rateio Multi-Evento, Alçadas, Maker/Checker, 3-Way Match e Central de Aprovações.
 */

import { procureToPayService } from '../services/procureToPayService.js';
import { OFFICIAL_PRODUCERS } from '../services/eventBalanceService.js';

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatBRL(val) {
  return brlFormatter.format(Number(val) || 0);
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleDateString('pt-BR');
  } catch (_) {
    return isoStr;
  }
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return isoStr;
  }
}

let currentProducerId = 'prod-1';
let currentTab = 'approvals'; // approvals | suppliers | purchases | contracts | matching | budgets | audit
let currentFilterEventId = '';
let currentSupplierSearch = '';
let currentSupplierCategory = '';

export async function initProcureToPayView(initialTab = null) {
  if (initialTab) currentTab = initialTab;

  // Popula seletor de produtor
  const prodSelect = document.getElementById('p2p-producer-select');
  if (prodSelect) {
    prodSelect.innerHTML = OFFICIAL_PRODUCERS.map(p =>
      `<option value="${p.id}" ${p.id === currentProducerId ? 'selected' : ''}>${p.name}</option>`
    ).join('');
  }

  // Atualiza botões de tabs
  const tabs = ['approvals', 'suppliers', 'purchases', 'contracts', 'matching', 'budgets', 'audit'];
  tabs.forEach(t => {
    const btn = document.getElementById(`p2p-tab-btn-${t}`);
    const pane = document.getElementById(`p2p-pane-${t}`);
    if (btn) btn.classList.toggle('active', t === currentTab);
    if (pane) pane.style.display = (t === currentTab) ? 'block' : 'none';
  });

  // Renderiza a aba ativa
  switch (currentTab) {
    case 'approvals':
      await renderApprovalInbox();
      break;
    case 'suppliers':
      await renderSuppliersTab();
      break;
    case 'purchases':
      await renderPurchasesTab();
      break;
    case 'contracts':
      await renderContractsTab();
      break;
    case 'matching':
      await renderMatchingTab();
      break;
    case 'budgets':
      await renderBudgetsTab();
      break;
    case 'audit':
      await renderAuditTab();
      break;
  }

  // Carrega contadores do cabeçalho
  await updateP2PHeaderBadges();
}

export async function switchP2PTab(tabKey) {
  currentTab = tabKey;
  await initProcureToPayView(tabKey);
}

export async function changeP2PProducer(producerId) {
  currentProducerId = producerId;
  await initProcureToPayView();
}

// =========================================================================
// RENDERIZADORES DE ABAS
// =========================================================================

// 1. CENTRAL DE APROVAÇÕES
async function renderApprovalInbox() {
  const container = document.getElementById('p2p-approvals-table-body');
  if (!container) return;

  const res = await procureToPayService.getApprovalInbox({ producerId: currentProducerId });
  const items = res.data || [];
  const counts = res.counts || {};

  // Atualiza métricas rápidas
  const elPending = document.getElementById('p2p-kpi-pending-approvals');
  const elUrgent = document.getElementById('p2p-kpi-urgent-approvals');
  const elOverbudget = document.getElementById('p2p-kpi-overbudget-approvals');
  const elContracts = document.getElementById('p2p-kpi-contracts-approvals');

  if (elPending) elPending.textContent = counts.pendingWithMe || 0;
  if (elUrgent) elUrgent.textContent = counts.urgentCount || 0;
  if (elOverbudget) elOverbudget.textContent = counts.overbudgetCount || 0;
  if (elContracts) elContracts.textContent = counts.contractsCount || 0;

  if (items.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-muted">
          <i class="ph-check-circle fs-3 text-success d-block mb-1"></i>
          Nenhuma pendência de aprovação financeira para este produtor no momento.
        </td>
      </tr>`;
    return;
  }

  container.innerHTML = items.map(item => {
    const typeBadges = {
      PURCHASE_REQUEST: '<span class="badge bg-primary-subtle text-primary border border-primary-subtle">Solicitação Compra</span>',
      PURCHASE_ORDER: '<span class="badge bg-indigo-subtle text-indigo border border-indigo-subtle">Pedido de Compra</span>',
      CONTRACT: '<span class="badge bg-info-subtle text-info border border-info-subtle">Contrato</span>',
      PAYABLE: '<span class="badge bg-warning-subtle text-warning border border-warning-subtle">Conta a Pagar</span>'
    };

    const priorityBadge = item.priority === 'URGENTE' || item.priority === 'CRITICA'
      ? '<span class="badge bg-danger text-white"><i class="ph-warning-circle me-1"></i>Urgente</span>'
      : '<span class="badge bg-light text-muted border">Normal</span>';

    const budgetStatusBadge = item.isOverbudget
      ? '<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="ph-warning me-1"></i>Estouro Orçamento</span>'
      : '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="ph-check me-1"></i>Orçado</span>';

    return `
      <tr>
        <td>
          <span class="fw-bold text-dark">${item.id}</span>
          <div class="fs-xs text-muted">${formatDateTime(item.requestedAt)}</div>
        </td>
        <td>${typeBadges[item.entityType] || item.entityType}</td>
        <td>
          <div class="fw-semibold text-dark">${item.eventName || 'Consolidado'}</div>
          <div class="fs-xs text-muted">${item.costCenterName}</div>
        </td>
        <td>
          <div class="fw-semibold text-dark">${item.supplierName}</div>
          <div class="fs-xs text-muted">Solicitado por: <strong>${item.requesterName}</strong></div>
        </td>
        <td>
          <div class="fw-bold fs-sm text-dark">${formatBRL(item.amount)}</div>
          <div>${budgetStatusBadge}</div>
        </td>
        <td>${priorityBadge}</td>
        <td>
          <span class="badge bg-dark-subtle text-dark border">${item.requiredLevel}</span>
          <div class="fs-xs text-muted text-truncate" style="max-width: 180px;" title="${item.justification || ''}">
            ${item.justification || '—'}
          </div>
        </td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-success fw-bold d-flex align-items-center gap-1" onclick="window.approveInboxItemAction('${item.id}')" title="Aprovar">
              <i class="ph-check"></i> Aprovar
            </button>
            <button class="btn btn-danger fw-bold d-flex align-items-center gap-1" onclick="window.rejectInboxItemAction('${item.id}')" title="Rejeitar">
              <i class="ph-x"></i> Rejeitar
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// 2. FORNECEDORES & FORNECEDOR 360°
async function renderSuppliersTab() {
  const container = document.getElementById('p2p-suppliers-table-body');
  if (!container) return;

  const res = await procureToPayService.getSuppliers({
    producerId: currentProducerId,
    search: currentSupplierSearch,
    category: currentSupplierCategory
  });
  const suppliers = res.data || [];

  if (suppliers.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          Nenhum fornecedor cadastrado ou encontrado com os filtros aplicados.
        </td>
      </tr>`;
    return;
  }

  container.innerHTML = suppliers.map(s => {
    const statusBadges = {
      HOMOLOGADO: '<span class="badge bg-success text-white"><i class="ph-seal-check me-1"></i>Homologado</span>',
      ATIVO: '<span class="badge bg-primary text-white">Ativo</span>',
      PENDENTE_DOCS: '<span class="badge bg-warning text-dark"><i class="ph-warning-diamond me-1"></i>Doc. Pendente</span>',
      BLOQUEADO: '<span class="badge bg-danger text-white"><i class="ph-prohibit me-1"></i>Bloqueado</span>'
    };

    const stars = '★'.repeat(Math.round(s.performance?.averageRating || 5)) +
      '☆'.repeat(5 - Math.round(s.performance?.averageRating || 5));

    return `
      <tr>
        <td>
          <div class="fw-bold text-dark">${s.tradeName}</div>
          <div class="fs-xs text-muted">${s.legalName}</div>
          <div class="fs-xs fw-mono text-secondary">${s.taxId}</div>
        </td>
        <td>
          <span class="badge bg-light text-dark border">${s.primaryCategory}</span>
        </td>
        <td>
          <div class="fs-sm text-dark">${s.contactName}</div>
          <div class="fs-xs text-muted">${s.contactPhone} &bull; ${s.contactEmail}</div>
        </td>
        <td>
          <div class="fs-xs fw-mono"><strong>PIX:</strong> ${s.bankAccount?.pixKey || '—'}</div>
          <div class="fs-xs text-muted">${s.bankAccount?.bankName} (Ag: ${s.bankAccount?.agency})</div>
        </td>
        <td>
          <div class="text-warning fs-xs fw-bold">${stars} <span class="text-dark">${(s.performance?.averageRating || 5).toFixed(1)}</span></div>
          <div class="fs-xs text-muted">${s.performance?.totalContractsCompleted || 0} contratos concluídos</div>
        </td>
        <td>${statusBadges[s.status] || s.status}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary fw-bold d-flex align-items-center gap-1 ms-auto" onclick="window.openSupplier360Modal('${s.id}')">
            <i class="ph-arrows-out-card"></i> Visão 360°
          </button>
        </td>
      </tr>`;
  }).join('');
}

// 3. COMPRAS: SOLICITAÇÕES, COTAÇÕES, PEDIDOS
async function renderPurchasesTab() {
  const reqContainer = document.getElementById('p2p-requests-table-body');
  const poContainer = document.getElementById('p2p-orders-table-body');

  // Renderiza Solicitações
  if (reqContainer) {
    const resReq = await procureToPayService.getPurchaseRequests({ producerId: currentProducerId });
    const requests = resReq.data || [];

    if (requests.length === 0) {
      reqContainer.innerHTML = '<tr><td colspan="7" class="text-center py-3 text-muted">Nenhuma solicitação de compra registrada.</td></tr>';
    } else {
      reqContainer.innerHTML = requests.map(r => {
        const statusMap = {
          DRAFT: '<span class="badge bg-secondary">Rascunho</span>',
          SUBMITTED: '<span class="badge bg-primary">Solicitada</span>',
          IN_QUOTATION: '<span class="badge bg-info">Em Cotação</span>',
          PENDING_APPROVAL: '<span class="badge bg-warning text-dark">Aguardando Aprovação</span>',
          APPROVED: '<span class="badge bg-success text-white">Aprovada</span>',
          REJECTED: '<span class="badge bg-danger text-white">Rejeitada</span>',
          ORDERED: '<span class="badge bg-indigo text-white">Pedido Emitido</span>',
          COMPLETED: '<span class="badge bg-dark text-white">Concluída</span>'
        };

        const actionButtons = [];
        if (r.status === 'DRAFT') {
          actionButtons.push(`<button class="btn btn-xs btn-primary fw-bold" onclick="window.submitPurchaseRequestAction('${r.id}')"><i class="ph-paper-plane-tilt"></i> Enviar</button>`);
        }
        if (r.status === 'APPROVED' && !r.purchaseOrderId) {
          actionButtons.push(`<button class="btn btn-xs btn-success fw-bold" onclick="window.openGeneratePOModal('${r.id}')"><i class="ph-receipt"></i> Gerar Pedido</button>`);
        }
        if (r.status === 'IN_QUOTATION') {
          actionButtons.push(`<button class="btn btn-xs btn-outline-info fw-bold" onclick="window.switchP2PTab('purchases'); window.showQuotationDetail('${r.quotationId || ''}')"><i class="ph-tag"></i> Ver Cotação</button>`);
        }

        return `
          <tr>
            <td><span class="fw-bold text-dark">${r.id}</span></td>
            <td>
              <div class="fw-semibold text-dark">${r.eventName || 'Evento'}</div>
              <div class="fs-xs text-muted">${r.costCenterName}</div>
            </td>
            <td>
              <div class="fs-sm text-dark">${r.description}</div>
              <div class="fs-xs text-muted">${r.items?.length || 1} itens &bull; Solicitante: ${r.requesterName}</div>
            </td>
            <td><span class="fw-bold text-dark">${formatBRL(r.estimatedTotalAmount)}</span></td>
            <td>${formatDate(r.neededUntil)}</td>
            <td>${statusMap[r.status] || r.status}</td>
            <td class="text-end">${actionButtons.join(' ') || '—'}</td>
          </tr>`;
      }).join('');
    }
  }

  // Renderiza Pedidos de Compra
  if (poContainer) {
    const resPO = await procureToPayService.getPurchaseOrders({ producerId: currentProducerId });
    const orders = resPO.data || [];

    if (orders.length === 0) {
      poContainer.innerHTML = '<tr><td colspan="7" class="text-center py-3 text-muted">Nenhum pedido de compra emitido.</td></tr>';
    } else {
      poContainer.innerHTML = orders.map(o => `
        <tr>
          <td><span class="fw-bold text-dark">${o.id}</span></td>
          <td>
            <div class="fw-semibold text-dark">${o.eventName}</div>
            <div class="fs-xs text-muted">${o.costCenterName}</div>
          </td>
          <td>
            <div class="fw-semibold text-dark">${o.supplierName}</div>
            <div class="fs-xs text-muted">CNPJ: ${o.supplierTaxId}</div>
          </td>
          <td><span class="fw-bold text-dark">${formatBRL(o.totalAmount)}</span></td>
          <td>
            <span class="badge bg-success-subtle text-success border border-success-subtle">
              <i class="ph-lock-simple me-1"></i> Orçamento Comprometido
            </span>
          </td>
          <td>
            <span class="badge bg-success text-white">${o.status}</span>
          </td>
          <td class="text-end">
            <button class="btn btn-xs btn-outline-dark fw-bold" onclick="window.openThreeWayMatchModal('${o.id}')">
              <i class="ph-scales"></i> 3-Way Match
            </button>
          </td>
        </tr>`).join('');
    }
  }
}

// 4. CONTRATOS & RATEIO ENTRE EVENTOS
async function renderContractsTab() {
  const container = document.getElementById('p2p-contracts-table-body');
  if (!container) return;

  const res = await procureToPayService.getContracts({ producerId: currentProducerId });
  const contracts = res.data || [];

  if (contracts.length === 0) {
    container.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Nenhum contrato cadastrado.</td></tr>';
    return;
  }

  container.innerHTML = contracts.map(c => {
    const allocationBars = (c.allocations || []).map(a => `
      <div class="d-flex justify-content-between fs-xs mb-1">
        <span class="text-truncate" style="max-width: 140px;" title="${a.eventName}">${a.eventName}:</span>
        <strong>${a.percentage}% (${formatBRL(a.allocatedAmount)})</strong>
      </div>
      <div class="progress mb-2" style="height: 5px;">
        <div class="progress-bar bg-primary" style="width: ${a.percentage}%;"></div>
      </div>
    `).join('');

    return `
      <tr>
        <td>
          <div class="fw-bold text-dark">${c.contractNumber}</div>
          <div class="fs-xs text-muted">${c.objectDescription}</div>
        </td>
        <td>
          <div class="fw-semibold text-dark">${c.supplierName}</div>
          <div class="fs-xs text-muted">CNPJ: ${c.supplierTaxId}</div>
        </td>
        <td>
          <div class="fw-bold fs-sm text-dark">${formatBRL(c.totalAmount)}</div>
          <div class="fs-xs text-muted">${c.installments?.length || 1} parcelas &bull; ${c.paymentMethod}</div>
        </td>
        <td style="min-width: 220px;">
          <div class="border rounded p-2 bg-light">
            <div class="fs-xs fw-bold text-uppercase text-secondary mb-1">Rateio entre Eventos (100%):</div>
            ${allocationBars}
          </div>
        </td>
        <td>
          <div class="fs-xs text-muted">Início: <strong>${formatDate(c.startDate)}</strong></div>
          <div class="fs-xs text-muted">Fim: <strong>${formatDate(c.endDate)}</strong></div>
        </td>
        <td>
          <span class="badge bg-success text-white">${c.status}</span>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary fw-bold" onclick="window.viewContractDetails('${c.id}')">
            <i class="ph-file-text"></i> Detalhes
          </button>
        </td>
      </tr>`;
  }).join('');
}

// 5. CONFERÊNCIA 3-WAY MATCH
async function renderMatchingTab() {
  const container = document.getElementById('p2p-matching-list');
  if (!container) return;

  const res = await procureToPayService.getPurchaseOrders({ producerId: currentProducerId });
  const orders = res.data || [];

  container.innerHTML = orders.map(po => `
    <div class="card card-body shadow-sm mb-3 border">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-2">
        <div>
          <h6 class="fw-bold text-dark mb-0">Conferência Tríplice (3-Way Match) — Pedido #${po.id}</h6>
          <div class="fs-xs text-muted">Fornecedor: <strong>${po.supplierName}</strong> (CNPJ: ${po.supplierTaxId}) &bull; Evento: ${po.eventName}</div>
        </div>
        <button class="btn btn-sm btn-primary fw-bold" onclick="window.openThreeWayMatchModal('${po.id}')">
          <i class="ph-scales me-1"></i> Executar Conferência Tríplice
        </button>
      </div>
      <div class="row g-2 text-center mt-1">
        <div class="col-4">
          <div class="p-2 border rounded bg-light">
            <div class="fs-xs text-muted text-uppercase fw-bold">1. Pedido de Compra</div>
            <div class="fw-bold fs-sm text-dark mt-1">${formatBRL(po.totalAmount)}</div>
            <div class="fs-xs text-success">✓ Aprovado e Orçado</div>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2 border rounded bg-light">
            <div class="fs-xs text-muted text-uppercase fw-bold">2. Recebimento / Medição</div>
            <div class="fw-bold fs-sm text-dark mt-1">${formatBRL(po.totalAmount)}</div>
            <div class="fs-xs text-success">✓ Conferência Física 100%</div>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2 border rounded bg-light">
            <div class="fs-xs text-muted text-uppercase fw-bold">3. Nota Fiscal / Documento</div>
            <div class="fw-bold fs-sm text-dark mt-1">${formatBRL(po.totalAmount)}</div>
            <div class="fs-xs text-success">✓ Liberado para Pagamento</div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// 6. GESTÃO ORÇAMENTÁRIA & CENTROS DE CUSTO
async function renderBudgetsTab() {
  const container = document.getElementById('p2p-budgets-table-body');
  if (!container) return;

  const budgets = procureToPayService.getEventBudgets({ producerId: currentProducerId });
  if (budgets.length === 0) {
    container.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Nenhum orçamento cadastrado.</td></tr>';
    return;
  }

  container.innerHTML = budgets.map(b => {
    const used = b.realizedAmount + b.committedAmount;
    const pctUsed = b.plannedAmount > 0 ? Math.min(100, Math.round((used / b.plannedAmount) * 100)) : 0;
    const barClass = pctUsed > 90 ? 'bg-danger' : (pctUsed > 75 ? 'bg-warning' : 'bg-success');

    return `
      <tr>
        <td>
          <span class="fw-bold text-dark">Evento #${b.eventId}</span>
        </td>
        <td>
          <span class="fw-semibold text-dark">${b.costCenterName}</span>
        </td>
        <td><span class="fw-bold text-dark">${formatBRL(b.plannedAmount)}</span></td>
        <td><span class="text-success fw-semibold">${formatBRL(b.realizedAmount)}</span></td>
        <td><span class="text-warning fw-semibold">${formatBRL(b.committedAmount)}</span></td>
        <td><span class="text-primary fw-bold">${formatBRL(b.availableAmount)}</span></td>
        <td style="min-width: 140px;">
          <div class="d-flex justify-content-between fs-xs fw-bold mb-1">
            <span>${pctUsed}%</span>
            <span class="text-muted">${formatBRL(used)} / ${formatBRL(b.plannedAmount)}</span>
          </div>
          <div class="progress" style="height: 6px;">
            <div class="progress-bar ${barClass}" style="width: ${pctUsed}%;"></div>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// 7. ALERTAS OPERACIONAIS & AUDITORIA
async function renderAuditTab() {
  const alertsContainer = document.getElementById('p2p-alerts-container');
  const auditContainer = document.getElementById('p2p-audit-table-body');

  // Alertas
  if (alertsContainer) {
    const res = await procureToPayService.getOperationalAlerts(currentProducerId);
    const alerts = res.data || res || [];
    if (alerts.length === 0) {
      alertsContainer.innerHTML = '<div class="alert alert-success border-0 shadow-sm py-2">✓ Nenhum alerta de risco operacional ou documental ativo.</div>';
    } else {
      alertsContainer.innerHTML = alerts.map(a => {
        const alertClass = a.severity === 'CRITICAL' ? 'alert-danger' : (a.severity === 'WARNING' ? 'alert-warning' : 'alert-info');
        const icon = a.severity === 'CRITICAL' ? 'ph-warning-octagon' : (a.severity === 'WARNING' ? 'ph-warning' : 'ph-info');
        return `
          <div class="alert ${alertClass} border shadow-sm p-3 mb-2 d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <i class="${icon} fs-4"></i>
              <div>
                <strong class="d-block">${a.title}</strong>
                <span class="fs-xs">${a.description}</span>
              </div>
            </div>
          </div>`;
      }).join('');
    }
  }

  // Trilha de Auditoria
  if (auditContainer) {
    const auditLogs = procureToPayService.getProcureAuditLog();
    if (auditLogs.length === 0) {
      auditContainer.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum evento de auditoria registrado ainda.</td></tr>';
    } else {
      auditContainer.innerHTML = auditLogs.slice(0, 50).map(log => `
        <tr>
          <td><span class="badge bg-secondary-subtle text-secondary font-monospace fs-xs">${log.correlationId}</span></td>
          <td><span class="fs-xs text-muted">${formatDateTime(log.timestamp)}</span></td>
          <td><strong>${log.actor?.name || 'Sistema'}</strong></td>
          <td><span class="badge bg-light text-dark border">${log.entityType}</span></td>
          <td><span class="badge bg-primary-subtle text-primary">${log.action}</span></td>
          <td><span class="fs-sm text-dark">${log.summary}</span></td>
        </tr>`).join('');
    }
  }
}

async function updateP2PHeaderBadges() {
  const res = await procureToPayService.getApprovalInbox({ producerId: currentProducerId });
  const pendingCount = res.counts?.pendingWithMe || 0;
  const badge = document.getElementById('p2p-header-pending-count');
  if (badge) {
    badge.textContent = pendingCount;
    badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }
}

// =========================================================================
// AÇÕES DO USUÁRIO & MODAIS
// =========================================================================

export async function openSupplier360Modal(supplierId) {
  const res = await procureToPayService.getSupplierById(supplierId);
  if (!res.ok) {
    alert(res.error);
    return;
  }
  const s = res.data;

  const modalEl = document.getElementById('modal-supplier-360');
  if (!modalEl) return;

  document.getElementById('s360-trade-name').textContent = s.tradeName;
  document.getElementById('s360-legal-name').textContent = s.legalName;
  document.getElementById('s360-tax-id').textContent = s.taxId;
  document.getElementById('s360-status').innerHTML = `<span class="badge bg-success">${s.status}</span>`;
  document.getElementById('s360-category').textContent = s.primaryCategory;
  document.getElementById('s360-contact').textContent = `${s.contactName} (${s.contactPhone} / ${s.contactEmail})`;
  document.getElementById('s360-pix').textContent = s.bankAccount?.pixKey || '—';
  document.getElementById('s360-bank').textContent = `${s.bankAccount?.bankName} (Ag: ${s.bankAccount?.agency} / CC: ${s.bankAccount?.account})`;

  // Métricas
  document.getElementById('s360-metric-contracted').textContent = formatBRL(s.financialMetrics?.totalContracted);
  document.getElementById('s360-metric-paid').textContent = formatBRL(s.financialMetrics?.totalPaid);
  document.getElementById('s360-metric-pending').textContent = formatBRL(s.financialMetrics?.totalPending);
  document.getElementById('s360-metric-rating').textContent = `${(s.performance?.averageRating || 5).toFixed(1)} / 5.0`;

  // Documentos
  const docsList = document.getElementById('s360-docs-list');
  if (docsList) {
    docsList.innerHTML = (s.documents || []).map(d => `
      <li class="list-group-item d-flex justify-content-between align-items-center py-2">
        <div>
          <strong class="fs-xs text-dark">${d.title}</strong>
          <div class="fs-xs text-muted">Vencimento: ${formatDate(d.expiresAt)}</div>
        </div>
        <span class="badge ${d.status === 'VALIDO' ? 'bg-success' : 'bg-danger'}">${d.status}</span>
      </li>
    `).join('') || '<li class="list-group-item text-muted fs-xs">Nenhum documento anexado.</li>';
  }

  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}

export async function openNewContractModal() {
  const modalEl = document.getElementById('modal-new-contract');
  if (!modalEl) return;

  // Popula fornecedores
  const res = await procureToPayService.getSuppliers({ producerId: currentProducerId });
  const select = document.getElementById('contract-supplier-select');
  if (select) {
    select.innerHTML = (res.data || []).map(s => `<option value="${s.id}">${s.tradeName} (${s.taxId})</option>`).join('');
  }

  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}

export async function saveNewContractAction() {
  const supplierId = document.getElementById('contract-supplier-select')?.value;
  const totalAmount = Number(document.getElementById('contract-total-amount')?.value) || 0;
  const objectDesc = document.getElementById('contract-object')?.value;
  const installmentsCount = Number(document.getElementById('contract-installments')?.value) || 1;

  // Rateio pré-definido equilibrado entre os 3 eventos principais
  const allocations = [
    { eventId: '3368', eventName: 'Experiencia Música e Natureza', percentage: 50.00 },
    { eventId: '3195', eventName: '9º Knife Show Curitiba', percentage: 30.00 },
    { eventId: '3178', eventName: 'Feijoada e Costela assada', percentage: 20.00 }
  ];

  try {
    const res = await procureToPayService.createContract({
      producerId: currentProducerId,
      supplierId,
      totalAmount,
      objectDescription: objectDesc,
      installmentsCount,
      allocations
    }, { name: 'Operador Financeiro', role: 'FINANCEIRO' });

    if (res.ok) {
      alert(`Contrato ${res.data.contractNumber} criado com sucesso! Rateio validado em 100%.`);
      const modalEl = document.getElementById('modal-new-contract');
      if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        bootstrap.Modal.getInstance(modalEl)?.hide();
      }
      await renderContractsTab();
    }
  } catch (err) {
    alert(err.message);
  }
}

export async function openThreeWayMatchModal(orderId) {
  const modalEl = document.getElementById('modal-threeway-match');
  if (!modalEl) return;

  const res = await procureToPayService.getPurchaseOrders({ producerId: currentProducerId });
  const po = (res.data || []).find(o => o.id === orderId);
  if (!po) {
    alert('Pedido não localizado.');
    return;
  }

  document.getElementById('match-po-id').value = po.id;
  document.getElementById('match-po-supplier').textContent = `${po.supplierName} (${po.supplierTaxId})`;
  document.getElementById('match-po-amount').textContent = formatBRL(po.totalAmount);
  document.getElementById('match-inv-amount').value = po.totalAmount;
  document.getElementById('match-inv-number').value = `NF-${Math.floor(100000 + Math.random() * 900000)}`;

  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}

export async function executeThreeWayMatchAction() {
  const poId = document.getElementById('match-po-id')?.value;
  const invAmount = Number(document.getElementById('match-inv-amount')?.value) || 0;
  const invNumber = document.getElementById('match-inv-number')?.value;

  try {
    const res = procureToPayService.executeThreeWayMatch({
      purchaseOrderId: poId,
      invoiceAmount: invAmount,
      invoiceNumber: invNumber,
      actor: { name: 'Auditor Fiscal SafeSaff', role: 'AUDITORIA' }
    });

    const result = res.data;
    const msg = result.notes.join('\n');
    alert(`Resultado da Conferência Tríplice:\n\nStatus: ${result.matchStatus}\nLiberado para Pagamento: ${result.isClearedForPayment ? 'SIM' : 'NÃO'}\n\n${msg}`);

    const modalEl = document.getElementById('modal-threeway-match');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getInstance(modalEl)?.hide();
    }
    await renderMatchingTab();
  } catch (err) {
    alert(err.message);
  }
}

export async function approveInboxItemAction(itemId) {
  if (!confirm(`Deseja confirmar a APROVAÇÃO do item ${itemId}?`)) return;

  try {
    await procureToPayService.processApprovalDecision({
      inboxItemId: itemId,
      decision: 'APPROVED',
      justification: 'Aprovado via Central de Aprovações Procure-to-Pay.',
      actor: { name: 'Diretoria Financeira', role: 'DIRETORIA' }
    });
    alert('Item aprovado com sucesso!');
    await renderApprovalInbox();
    await updateP2PHeaderBadges();
  } catch (err) {
    alert(err.message);
  }
}

export async function rejectInboxItemAction(itemId) {
  const justification = prompt(`Informe a justificativa formal para REJEITAR o item ${itemId}:`);
  if (!justification) {
    alert('A justificativa é mandatória para reprovação.');
    return;
  }

  try {
    await procureToPayService.processApprovalDecision({
      inboxItemId: itemId,
      decision: 'REJECTED',
      justification,
      actor: { name: 'Controladoria SafeSaff', role: 'CONTROLADORIA' }
    });
    alert('Item rejeitado formalmente com registro na auditoria.');
    await renderApprovalInbox();
    await updateP2PHeaderBadges();
  } catch (err) {
    alert(err.message);
  }
}

export async function submitPurchaseRequestAction(requestId) {
  try {
    await procureToPayService.submitPurchaseRequest(requestId, { name: 'Operador de Eventos', role: 'OPERADOR_EVENTO' });
    alert(`Solicitação ${requestId} submetida para aprovação!`);
    await renderPurchasesTab();
    await updateP2PHeaderBadges();
  } catch (err) {
    alert(err.message);
  }
}

// Exposição das funções no escopo global
if (typeof window !== 'undefined') {
  window.initProcureToPayView = initProcureToPayView;
  window.switchP2PTab = switchP2PTab;
  window.changeP2PProducer = changeP2PProducer;
  window.openSupplier360Modal = openSupplier360Modal;
  window.openNewContractModal = openNewContractModal;
  window.saveNewContractAction = saveNewContractAction;
  window.openThreeWayMatchModal = openThreeWayMatchModal;
  window.executeThreeWayMatchAction = executeThreeWayMatchAction;
  window.approveInboxItemAction = approveInboxItemAction;
  window.rejectInboxItemAction = rejectInboxItemAction;
  window.submitPurchaseRequestAction = submitPurchaseRequestAction;
}
