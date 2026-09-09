/**
 * Fase 26.17.9.5.1 a Fase 26.17.9.5.4 — Controlador de Gestão de Saldos, Transferências e Dashboard Executivo
 * Orquestra Dashboard Executivo, Saldo por Evento, Aprovação de Alçadas, Histórico com Timeline e Auditoria.
 */

import { eventBalanceService, OFFICIAL_PRODUCERS } from '../services/eventBalanceService.js';
import { balanceTransferService } from '../services/balanceTransferService.js';

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatBRL(val) {
  return brlFormatter.format(Number(val) || 0);
}

function formatDate(isoStr) {
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

// Estado interno do módulo
let currentProducerId = 'prod-1';
let currentTab = 'dashboard';
let cachedEvents = [];
let cachedHistory = [];
let cachedAudit = [];
let cachedApprovals = [];
let cachedDashboard = null;

export function initFinancialEventTransfersView() {
  const select = document.getElementById('ft-producer-select');
  if (select) {
    select.innerHTML = OFFICIAL_PRODUCERS.map(p =>
      `<option value="${p.id}" ${p.id === currentProducerId ? 'selected' : ''}>${p.name}</option>`
    ).join('');
  }

  const producerInput = document.getElementById('trf-input-producer-name');
  if (producerInput) {
    const prod = OFFICIAL_PRODUCERS.find(p => p.id === currentProducerId) || OFFICIAL_PRODUCERS[0];
    producerInput.value = prod.name;
  }

  refreshFinancialTransfersView();
}

export async function refreshFinancialTransfersView() {
  const icon = document.getElementById('ft-refresh-icon');
  if (icon) icon.classList.add('ph-spin');

  try {
    // 1. Carregar Visão Consolidada (8 KPIs Principais)
    const ovRes = await eventBalanceService.getOverview(currentProducerId);
    if (ovRes.ok && ovRes.data) {
      const d = ovRes.data;
      const elTotal = document.getElementById('ft-kpi-total-balance');
      const elAvail = document.getElementById('ft-kpi-available-balance');
      const elComm = document.getElementById('ft-kpi-committed-balance');
      const elBlock = document.getElementById('ft-kpi-blocked-balance');
      const elPend = document.getElementById('ft-kpi-pending-settlement');
      const elSched = document.getElementById('ft-kpi-scheduled-payouts');
      const elReconc = document.getElementById('ft-kpi-reconciliation');
      const elDiv = document.getElementById('ft-kpi-divergences');
      const elInteg = document.getElementById('ft-integrity-badge');
      const elApi = document.getElementById('ft-api-status-badge');

      if (elTotal) elTotal.textContent = formatBRL(d.totalBalance);
      if (elAvail) elAvail.textContent = formatBRL(d.totalAvailable);
      if (elComm) elComm.textContent = formatBRL(d.totalCommitted);
      if (elBlock) elBlock.textContent = formatBRL(d.totalBlocked);
      if (elPend) elPend.textContent = formatBRL(d.totalPendingSettlement);
      if (elSched) elSched.textContent = formatBRL(d.scheduledPayouts);
      if (elReconc) elReconc.textContent = formatBRL(d.inReconciliation);
      if (elDiv) {
        elDiv.textContent = d.divergencesCount || '0';
        elDiv.className = `fw-bold mb-0 mt-2 ${d.divergencesCount > 0 ? 'text-danger' : 'text-dark'}`;
      }

      if (elInteg) {
        if (d.integrity && d.integrity.isBalanced) {
          elInteg.className = 'badge bg-success text-white px-3 py-2 fs-xs fw-semibold shadow-sm d-flex align-items-center gap-1';
          elInteg.innerHTML = '<i class="ph-shield-check fs-sm"></i> Integridade Verificada';
        } else {
          elInteg.className = 'badge bg-danger text-white px-3 py-2 fs-xs fw-semibold shadow-sm d-flex align-items-center gap-1';
          elInteg.innerHTML = '<i class="ph-warning-octagon fs-sm"></i> Divergência de Saldo';
        }
      }

      if (elApi) {
        if (ovRes.isLiveApi) {
          elApi.className = 'badge bg-success-subtle text-success border border-success-subtle px-2 py-2 fs-xs';
          elApi.innerHTML = '<i class="ph-plugs-connected text-success me-1"></i> API REST Oficial';
        } else {
          elApi.className = 'badge bg-info-subtle text-info border border-info-subtle px-2 py-2 fs-xs';
          elApi.innerHTML = '<i class="ph-database text-info me-1"></i> Local Seguro (Sync REST)';
        }
      }
    }

    // 2. Carregar Saldos por Evento (Fase 26.17.9.5.1)
    const evRes = await eventBalanceService.getEventsBalances(currentProducerId);
    if (evRes.ok && evRes.data) {
      cachedEvents = evRes.data;
      renderEventsTable(cachedEvents);
      const evBadge = document.getElementById('ft-events-count-badge');
      if (evBadge) evBadge.textContent = String(cachedEvents.length);
    }

    // 3. Carregar Histórico de Transferências (Fase 26.17.9.5.3)
    const histRes = await balanceTransferService.getTransfersHistory(currentProducerId);
    if (histRes.ok && histRes.data) {
      cachedHistory = histRes.data;
      renderHistoryTable(cachedHistory);
      const countEl = document.getElementById('ft-history-count-badge');
      if (countEl) countEl.textContent = String(cachedHistory.length);
    }

    // 4. Carregar Aprovações Pendentes (Fase 26.17.9.5.2)
    cachedApprovals = await balanceTransferService.getPendingApprovals(currentProducerId);
    renderApprovalsTable(cachedApprovals);
    const appBadge = document.getElementById('ft-approvals-count-badge');
    if (appBadge) appBadge.textContent = String(cachedApprovals.length);

    // 5. Carregar Dashboard Executivo (Fase 26.17.9.5.4)
    const dashRes = await eventBalanceService.getExecutiveDashboard(currentProducerId);
    if (dashRes.ok && dashRes.data) {
      cachedDashboard = dashRes.data;
      // Atualizar estatísticas de operações a partir do histórico real
      const totalTransferred = cachedHistory
        .filter(t => t.status === 'CONCLUIDA')
        .reduce((sum, t) => sum + t.amount, 0);
      cachedDashboard.operations.transfersCount = cachedHistory.length;
      cachedDashboard.operations.transferredAmount = totalTransferred;
      cachedDashboard.operations.pendingApprovals = cachedApprovals.length;
      cachedDashboard.operations.reversalsCount = cachedHistory.filter(t => t.status === 'ESTORNADA').length;

      renderExecutiveDashboard(cachedDashboard);
    }

    // 6. Carregar Logs de Auditoria
    const audRes = await balanceTransferService.getAuditLogs();
    if (audRes.ok && audRes.data) {
      cachedAudit = audRes.data;
      renderAuditTable(cachedAudit);
    }
  } catch (err) {
    console.error('[FinancialTransfers] Erro ao carregar saldos:', err);
  } finally {
    if (icon) icon.classList.remove('ph-spin');
  }
}

/**
 * Renderiza o Dashboard Executivo (Fase 26.17.9.5.4)
 */
function renderExecutiveDashboard(dash) {
  if (!dash) return;
  const op = dash.operations;
  const ratios = dash.ratios;
  const summary = dash.summary;

  // Operações
  const elTrfCount = document.getElementById('ft-op-transfers-count');
  const elTrfAmt = document.getElementById('ft-op-transferred-amount');
  const elPendApp = document.getElementById('ft-op-pending-approvals');
  const elRevCount = document.getElementById('ft-op-reversals-count');
  const elActRes = document.getElementById('ft-op-active-reservations');
  const elDeficit = document.getElementById('ft-op-deficit-amount');

  if (elTrfCount) elTrfCount.textContent = String(op.transfersCount || 0);
  if (elTrfAmt) elTrfAmt.textContent = formatBRL(op.transferredAmount || 0);
  if (elPendApp) elPendApp.textContent = String(op.pendingApprovals || 0);
  if (elRevCount) elRevCount.textContent = String(op.reversalsCount || 0);
  if (elActRes) elActRes.textContent = String(op.activeReservations || 0);
  if (elDeficit) elDeficit.textContent = formatBRL(summary.deficitBalance || 0);

  // Ratios
  const elAvailPct = document.getElementById('ft-ratio-avail-pct');
  const elAvailBar = document.getElementById('ft-ratio-avail-bar');
  const elCommPct = document.getElementById('ft-ratio-comm-pct');
  const elCommBar = document.getElementById('ft-ratio-comm-bar');
  const elBlockPct = document.getElementById('ft-ratio-block-pct');
  const elBlockBar = document.getElementById('ft-ratio-block-bar');

  if (elAvailPct) elAvailPct.textContent = `${ratios.availabilityRate}%`;
  if (elAvailBar) elAvailBar.style.width = `${Math.min(100, ratios.availabilityRate)}%`;

  if (elCommPct) elCommPct.textContent = `${ratios.commitmentRate}%`;
  if (elCommBar) elCommBar.style.width = `${Math.min(100, ratios.commitmentRate)}%`;

  if (elBlockPct) elBlockPct.textContent = `${ratios.blockedRate}%`;
  if (elBlockBar) elBlockBar.style.width = `${Math.min(100, ratios.blockedRate)}%`;

  // Composição
  const barAvail = document.getElementById('bar-comp-avail');
  const barComm = document.getElementById('bar-comp-comm');
  const barBlock = document.getElementById('bar-comp-block');
  const compAvail = document.getElementById('comp-label-avail');
  const compComm = document.getElementById('comp-label-comm');
  const compBlock = document.getElementById('comp-label-block');
  const compPend = document.getElementById('comp-label-pend');

  const totalBase = (summary.availableBalance + summary.committedBalance + summary.blockedBalance) || 1;
  const pAvail = Math.round((summary.availableBalance / totalBase) * 100);
  const pComm = Math.round((summary.committedBalance / totalBase) * 100);
  const pBlock = Math.round((summary.blockedBalance / totalBase) * 100);

  if (barAvail) { barAvail.style.width = `${pAvail}%`; barAvail.textContent = `${pAvail}% Disponível`; }
  if (barComm) { barComm.style.width = `${pComm}%`; barComm.textContent = `${pComm}%`; }
  if (barBlock) { barBlock.style.width = `${pBlock}%`; barBlock.textContent = `${pBlock}%`; }

  if (compAvail) compAvail.textContent = formatBRL(summary.availableBalance);
  if (compComm) compComm.textContent = formatBRL(summary.committedBalance);
  if (compBlock) compBlock.textContent = formatBRL(summary.blockedBalance);
  if (compPend) compPend.textContent = formatBRL(summary.pendingSettlement);

  // Top Eventos
  const topTbody = document.getElementById('ft-dash-top-events-tbody');
  if (topTbody && dash.topEvents) {
    topTbody.innerHTML = dash.topEvents.slice(0, 4).map(e => `
      <tr>
        <td>
          <div class="fw-bold text-dark text-truncate" style="max-width: 220px;">${e.name}</div>
          <span class="text-muted fs-xs">Total liquidado: ${formatBRL(e.total)}</span>
        </td>
        <td class="text-end">
          <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fw-bold fs-xs">
            ${formatBRL(e.available)}
          </span>
        </td>
        <td class="text-end pe-2">
          <button class="btn btn-xs btn-outline-secondary" onclick="window.openBalanceTransferModal('${e.id}')">
            <i class="ph-arrows-left-right"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Alertas Executivos
  const alertsCont = document.getElementById('ft-dash-alerts-container');
  const alertsBadge = document.getElementById('ft-dash-alerts-count');
  if (alertsCont) {
    if (!dash.alerts || dash.alerts.length === 0) {
      alertsCont.innerHTML = `
        <div class="d-flex align-items-center gap-2 text-success fs-xs py-1">
          <i class="ph-check-circle fs-5"></i>
          <span>Nenhum alerta crítico ativo. Todos os parâmetros financeiros estão dentro da normalidade operacional.</span>
        </div>
      `;
      if (alertsBadge) alertsBadge.textContent = '0 alertas';
    } else {
      alertsCont.innerHTML = dash.alerts.map(a => {
        const isCrit = a.severity === 'CRITICAL';
        const bgClass = isCrit ? 'alert-danger' : 'alert-warning';
        const icon = isCrit ? 'ph-warning-octagon' : 'ph-warning';
        return `
          <div class="alert ${bgClass} p-2 mb-2 fs-xs d-flex align-items-start gap-2 border-0">
            <i class="${icon} fs-5 mt-1"></i>
            <div class="flex-grow-1">
              <strong>${a.title}:</strong> ${a.description}
            </div>
            ${a.impactedAmount ? `<span class="badge bg-white text-dark border align-self-center">${formatBRL(a.impactedAmount)}</span>` : ''}
          </div>
        `;
      }).join('');
      if (alertsBadge) alertsBadge.textContent = `${dash.alerts.length} alertas`;
    }
  }
}

/**
 * Renderiza Tabela de Saldos por Evento (Fase 26.17.9.5.1)
 */
function renderEventsTable(events) {
  const tbody = document.getElementById('ft-events-tbody');
  if (!tbody) return;

  if (!events || events.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-muted">
          <i class="ph-folder-notch-open fs-2 d-block mb-1"></i>
          Nenhum evento localizado para o produtor selecionado.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = events.map(ev => {
    const b = ev.balances;
    const canTransfer = b.availableBalance > 0 && ev.integrity.isBalanced;
    return `
      <tr>
        <td>
          <div class="fw-bold text-dark">${ev.eventName || ev.eventId}</div>
          <div class="fs-xs text-muted d-flex align-items-center gap-1">
            <span class="badge bg-light text-secondary border">#${ev.eventId}</span>
            <span>Atualizado: ${formatDate(ev.calculatedAt)}</span>
          </div>
        </td>
        <td class="text-end fw-semibold text-muted">${formatBRL(b.transactedAmount)}</td>
        <td class="text-end fw-semibold text-dark">${formatBRL(b.settledAmount)}</td>
        <td class="text-end">
          <span class="badge ${b.availableBalance > 0 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-light text-muted border'} px-2 py-1 fs-xs fw-bold">
            ${formatBRL(b.availableBalance)}
          </span>
        </td>
        <td class="text-end text-warning fw-semibold">${formatBRL(b.committedBalance)}</td>
        <td class="text-end text-danger fw-semibold">${formatBRL(b.blockedBalance)}</td>
        <td class="text-center">
          ${ev.integrity.isBalanced
            ? '<span class="badge bg-success rounded-pill px-2 py-1 fs-xs"><i class="ph-check"></i> 100%</span>'
            : '<span class="badge bg-danger rounded-pill px-2 py-1 fs-xs" title="Divergência detectada"><i class="ph-warning"></i> ERRO</span>'
          }
        </td>
        <td class="text-end pe-3">
          <div class="d-flex justify-content-end gap-1">
            <button class="btn btn-xs ${canTransfer ? 'btn-success' : 'btn-light border text-muted'}"
              ${canTransfer ? '' : 'disabled'}
              onclick="window.openBalanceTransferModal('${ev.eventId}')"
              title="${canTransfer ? 'Transferir saldo disponível deste evento' : 'Sem saldo disponível ou divergência ativa'}">
              <i class="ph-arrows-left-right me-1"></i> Transferir
            </button>
            <button class="btn btn-xs btn-outline-secondary" onclick="window.openEventMovementsModal('${ev.eventId}')" title="Ver movimentações financeiras">
              <i class="ph-receipt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Renderiza Tabela de Aprovações Pendentes (Fase 26.17.9.5.2)
 */
function renderApprovalsTable(approvals) {
  const tbody = document.getElementById('ft-approvals-tbody');
  if (!tbody) return;

  if (!approvals || approvals.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <i class="ph-check-circle fs-2 text-success d-block mb-1"></i>
          Nenhuma transferência aguardando aprovação no momento.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = approvals.map(t => `
    <tr>
      <td>
        <div class="fw-bold font-monospace text-dark">${t.id}</div>
        <span class="badge bg-warning text-dark fs-xs">Alçada &gt; R$ 20.000</span>
      </td>
      <td>
        <div class="text-dark">${formatDate(t.createdAt)}</div>
        <span class="fs-xs text-muted">SLA: Regular (&lt; 2h)</span>
      </td>
      <td>
        <div class="fw-semibold text-dark">${t.sourceEventName}</div>
        <span class="fs-xs text-danger">Reserva: (-) ${formatBRL(t.amount)}</span>
      </td>
      <td>
        <div class="fw-semibold text-dark">${t.targetEventName}</div>
        <span class="fs-xs text-muted">Aguardando liberação</span>
      </td>
      <td class="text-end fw-bold text-dark fs-sm">${formatBRL(t.amount)}</td>
      <td>
        <div class="text-dark">${t.requestedBy}</div>
        <span class="fs-xs text-muted">${t.reason}</span>
      </td>
      <td class="text-end pe-3">
        <div class="d-flex justify-content-end gap-1">
          <button class="btn btn-xs btn-success fw-bold" onclick="window.openApprovalActionModal('${t.id}', 'approve')" title="Aprovar transferência">
            <i class="ph-check"></i> Aprovar
          </button>
          <button class="btn btn-xs btn-outline-danger" onclick="window.openApprovalActionModal('${t.id}', 'reject')" title="Rejeitar transferência">
            <i class="ph-x"></i> Rejeitar
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Renderiza Tabela de Histórico & Estornos (Fase 26.17.9.5.3)
 */
function renderHistoryTable(transfers) {
  const tbody = document.getElementById('ft-history-tbody');
  if (!tbody) return;

  if (!transfers || transfers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <i class="ph-clock-counter-clockwise fs-2 d-block mb-1"></i>
          Nenhuma transferência realizada até o momento.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transfers.map(t => {
    let badgeClass = 'bg-secondary';
    if (t.status === 'CONCLUIDA') badgeClass = 'bg-success';
    else if (t.status === 'EM_APROVACAO') badgeClass = 'bg-warning text-dark';
    else if (t.status === 'ESTORNADA') badgeClass = 'bg-danger';
    else if (t.status === 'REJEITADA') badgeClass = 'bg-dark';

    const canReverse = t.status === 'CONCLUIDA';

    return `
      <tr>
        <td>
          <div class="fw-bold font-monospace text-dark">${t.id}</div>
          <div class="fs-xs text-muted" title="${t.correlationId}">${t.correlationId ? t.correlationId.slice(0, 16) + '...' : ''}</div>
        </td>
        <td>
          <div class="text-dark">${formatDate(t.createdAt)}</div>
          <div class="fs-xs text-muted">Por: ${t.requestedBy || 'Sistema'}</div>
        </td>
        <td>
          <div class="fw-semibold text-dark">${t.sourceEventName || t.sourceEventId}</div>
          <div class="fs-xs text-danger">(-) ${formatBRL(t.amount)}</div>
        </td>
        <td>
          <div class="fw-semibold text-dark">${t.targetEventName || t.targetEventId}</div>
          <div class="fs-xs text-success">(+) ${formatBRL(t.amount)}</div>
        </td>
        <td class="text-end fw-bold text-dark fs-sm">${formatBRL(t.amount)}</td>
        <td class="text-center">
          <span class="badge ${badgeClass} px-2 py-1 fs-xs">${t.status}</span>
        </td>
        <td class="text-end pe-3">
          <div class="d-flex justify-content-end gap-1">
            <button class="btn btn-xs btn-outline-info" onclick="window.openTransferTimelineModal('${t.id}')" title="Ver linha do tempo da operação">
              <i class="ph-git-commit"></i>
            </button>
            <button class="btn btn-xs btn-outline-primary" onclick="window.openTransferAuditModal('${t.id}')" title="Ver comprovante e auditoria">
              <i class="ph-file-text"></i>
            </button>
            ${canReverse ? `
              <button class="btn btn-xs btn-outline-danger" onclick="window.handleReverseTransfer('${t.id}')" title="Estornar transferência (RN09)">
                <i class="ph-arrow-u-down-left"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderAuditTable(logs) {
  const tbody = document.getElementById('ft-audit-tbody');
  if (!tbody) return;

  if (!logs || logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Nenhum log registrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td class="text-nowrap text-muted">${formatDate(l.timestamp)}</td>
      <td class="fw-bold text-primary">${l.transferId || '—'}</td>
      <td>${l.actor || 'Sistema'}</td>
      <td><span class="badge bg-light text-dark border">${l.action}</span></td>
      <td class="text-break">${l.details || ''}</td>
    </tr>
  `).join('');
}

export function changeTransferProducer(prodId) {
  currentProducerId = prodId;
  const prod = OFFICIAL_PRODUCERS.find(p => p.id === prodId) || OFFICIAL_PRODUCERS[0];
  const producerInput = document.getElementById('trf-input-producer-name');
  if (producerInput) producerInput.value = prod.name;
  refreshFinancialTransfersView();
}

export function switchTransferTab(tab) {
  currentTab = tab;
  ['dashboard', 'events', 'approvals', 'history', 'audit'].forEach(t => {
    const link = document.getElementById(`ft-tab-link-${t}`);
    const pane = document.getElementById(`ft-pane-${t}`);
    if (link) link.classList.toggle('active', t === tab);
    if (pane) pane.style.display = t === tab ? 'block' : 'none';
  });
}

export function filterTransferEvents(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    renderEventsTable(cachedEvents);
    return;
  }
  const filtered = cachedEvents.filter(e =>
    (e.eventName && e.eventName.toLowerCase().includes(q)) ||
    String(e.eventId).includes(q)
  );
  renderEventsTable(filtered);
}

export async function openBalanceTransferModal(preselectedSourceId = null) {
  const modalEl = document.getElementById('modal-balance-transfer');
  if (!modalEl) return;

  const form = document.getElementById('form-balance-transfer');
  if (form) form.reset();

  const prod = OFFICIAL_PRODUCERS.find(p => p.id === currentProducerId) || OFFICIAL_PRODUCERS[0];
  const producerInput = document.getElementById('trf-input-producer-name');
  if (producerInput) producerInput.value = prod.name;

  const sourceSelect = document.getElementById('trf-select-source');
  const targetSelect = document.getElementById('trf-select-target');

  const events = cachedEvents.filter(e => e.producerId === currentProducerId);

  const options = events.map(e =>
    `<option value="${e.eventId}">${e.eventName} (#${e.eventId}) — Disp: ${formatBRL(e.balances.availableBalance)}</option>`
  ).join('');

  if (sourceSelect) {
    sourceSelect.innerHTML = `<option value="">Selecione o evento de origem...</option>${options}`;
    if (preselectedSourceId) {
      sourceSelect.value = String(preselectedSourceId);
    }
  }

  if (targetSelect) {
    targetSelect.innerHTML = `<option value="">Selecione o evento de destino...</option>${options}`;
    if (preselectedSourceId && events.length > 1) {
      const other = events.find(e => String(e.eventId) !== String(preselectedSourceId));
      if (other) targetSelect.value = String(other.eventId);
    }
  }

  updateTransferPreview();

  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}

export async function updateTransferPreview() {
  const sourceId = document.getElementById('trf-select-source')?.value;
  const targetId = document.getElementById('trf-select-target')?.value;
  const amountVal = document.getElementById('trf-input-amount')?.value;
  const reasonVal = document.getElementById('trf-input-reason')?.value || '';

  const sourceLabel = document.getElementById('trf-source-available-label');
  const targetLabel = document.getElementById('trf-target-available-label');
  const submitBtn = document.getElementById('btn-submit-balance-transfer');
  const alertEl = document.getElementById('trf-preview-alert');
  const badgeEl = document.getElementById('trf-preview-badge');

  const sourceEv = cachedEvents.find(e => String(e.eventId) === String(sourceId));
  const targetEv = cachedEvents.find(e => String(e.eventId) === String(targetId));

  if (sourceLabel) sourceLabel.textContent = sourceEv ? formatBRL(sourceEv.balances.availableBalance) : 'R$ 0,00';
  if (targetLabel) targetLabel.textContent = targetEv ? formatBRL(targetEv.balances.availableBalance) : 'R$ 0,00';

  const preview = await balanceTransferService.calculateTransferPreview({
    sourceEventId: sourceId,
    targetEventId: targetId,
    amount: amountVal,
    producerId: currentProducerId
  });

  const prevSourceVal = document.getElementById('trf-prev-source-val');
  const prevSourceDelta = document.getElementById('trf-prev-source-delta');
  const prevTargetVal = document.getElementById('trf-prev-target-val');
  const prevTargetDelta = document.getElementById('trf-prev-target-delta');
  const prevConsVal = document.getElementById('trf-prev-cons-val');
  const prevConsStatus = document.getElementById('trf-prev-cons-status');

  const val = Number(amountVal) || 0;

  if (preview.valid) {
    if (prevSourceVal) prevSourceVal.textContent = formatBRL(preview.source.availableAfter);
    if (prevSourceDelta) prevSourceDelta.textContent = `(-) ${formatBRL(val)}`;
    if (prevTargetVal) prevTargetVal.textContent = formatBRL(preview.target.availableAfter);
    if (prevTargetDelta) prevTargetDelta.textContent = `(+) ${formatBRL(val)}`;
    if (prevConsVal) prevConsVal.textContent = formatBRL(preview.consolidated.totalBefore);
    if (prevConsStatus) {
      prevConsStatus.textContent = 'Δ R$ 0,00 (Consolidado Invariável)';
      prevConsStatus.className = 'fs-xs text-success fw-semibold';
    }

    if (alertEl) {
      alertEl.classList.add('d-none');
      alertEl.textContent = '';
    }

    if (badgeEl) {
      badgeEl.className = 'badge bg-success-subtle text-success border border-success-subtle';
      badgeEl.textContent = val > 20000 ? 'Simulação Válida (Requer Aprovação)' : 'Simulação Válida';
    }

    const isReasonValid = reasonVal.trim().length >= 3;
    if (submitBtn) submitBtn.disabled = !isReasonValid;
  } else {
    if (prevSourceVal) prevSourceVal.textContent = '—';
    if (prevSourceDelta) prevSourceDelta.textContent = '—';
    if (prevTargetVal) prevTargetVal.textContent = '—';
    if (prevTargetDelta) prevTargetDelta.textContent = '—';
    if (prevConsVal) prevConsVal.textContent = '—';
    if (prevConsStatus) {
      prevConsStatus.textContent = 'Aguardando validação';
      prevConsStatus.className = 'fs-xs text-muted';
    }

    if (alertEl) {
      alertEl.textContent = preview.error || 'Preencha os campos para simular.';
      alertEl.classList.remove('d-none');
    }

    if (badgeEl) {
      badgeEl.className = 'badge bg-danger-subtle text-danger border border-danger-subtle';
      badgeEl.textContent = 'Ajustes Necessários';
    }

    if (submitBtn) submitBtn.disabled = true;
  }
}

export function setTransferPercentage(pct) {
  const sourceId = document.getElementById('trf-select-source')?.value;
  const sourceEv = cachedEvents.find(e => String(e.eventId) === String(sourceId));
  if (!sourceEv) {
    alert('Selecione primeiro o evento de origem.');
    return;
  }

  const avail = sourceEv.balances.availableBalance;
  if (avail <= 0) {
    alert('O evento de origem não possui saldo disponível.');
    return;
  }

  const targetAmount = Number((avail * pct).toFixed(2));
  const amountInput = document.getElementById('trf-input-amount');
  if (amountInput) {
    amountInput.value = targetAmount.toFixed(2);
    updateTransferPreview();
  }
}

export async function handleBalanceTransferSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const sourceId = document.getElementById('trf-select-source')?.value;
  const targetId = document.getElementById('trf-select-target')?.value;
  const amount = document.getElementById('trf-input-amount')?.value;
  const reason = document.getElementById('trf-input-reason')?.value;
  const notes = document.getElementById('trf-input-notes')?.value;
  const costCenter = document.getElementById('trf-input-cost-center')?.value;

  const submitBtn = document.getElementById('btn-submit-balance-transfer');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ph-arrows-clockwise ph-spin me-1"></i> Processando...';
  }

  try {
    const transfer = await balanceTransferService.executeTransfer({
      sourceEventId: sourceId,
      targetEventId: targetId,
      amount,
      reason,
      notes,
      costCenter,
      producerId: currentProducerId,
      actor: 'Vinicius Casagrande'
    });

    const modalEl = document.getElementById('modal-balance-transfer');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getInstance(modalEl)?.hide();
    }

    if (transfer.status === 'EM_APROVACAO') {
      alert(`Transferência ${transfer.id} registrada com sucesso!\nValor: ${formatBRL(transfer.amount)}\nStatus: EM_APROVACAO (Saldo reservado cautelarmente no evento de origem).`);
      await refreshFinancialTransfersView();
      switchTransferTab('approvals');
    } else {
      alert(`Transferência ${transfer.id} processada com sucesso!\nStatus: ${transfer.status}\nValor: ${formatBRL(transfer.amount)}`);
      await refreshFinancialTransfersView();
      switchTransferTab('history');
    }
  } catch (err) {
    alert(`Falha ao realizar transferência: ${err.message || err}`);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="ph-check-circle me-1"></i> Confirmar Transferência';
    }
  }
}

export function openApprovalActionModal(transferId, actionType) {
  const modalEl = document.getElementById('modal-transfer-approval-action');
  if (!modalEl) return;

  const idInput = document.getElementById('m-act-transfer-id');
  const typeInput = document.getElementById('m-act-type');
  const titleEl = document.getElementById('m-act-title');
  const descEl = document.getElementById('m-act-desc');
  const btnEl = document.getElementById('m-act-confirm-btn');
  const commentEl = document.getElementById('m-act-comment');

  if (idInput) idInput.value = transferId;
  if (typeInput) typeInput.value = actionType;
  if (commentEl) commentEl.value = '';

  const isApprove = actionType === 'approve';
  if (titleEl) titleEl.textContent = isApprove ? 'Aprovação de Transferência' : 'Rejeição de Transferência';
  if (descEl) descEl.textContent = isApprove
    ? `Deseja aprovar a liberação da transferência ${transferId}? O débito e o crédito serão consolidados nos eventos.`
    : `Deseja rejeitar a transferência ${transferId}? O saldo reservado será devolvido à origem.`;
  if (btnEl) {
    btnEl.className = isApprove ? 'btn btn-xs btn-success fw-bold' : 'btn btn-xs btn-danger fw-bold';
    btnEl.textContent = isApprove ? 'Confirmar Aprovação' : 'Confirmar Rejeição';
  }

  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}

export async function confirmApprovalAction() {
  const transferId = document.getElementById('m-act-transfer-id')?.value;
  const actionType = document.getElementById('m-act-type')?.value;
  const comment = document.getElementById('m-act-comment')?.value || '';

  if (!transferId) return;

  try {
    if (actionType === 'approve') {
      await balanceTransferService.approveTransfer(transferId, 'Diretoria Financeira', comment);
      alert(`Transferência ${transferId} APROVADA e consolidada com sucesso!`);
    } else {
      await balanceTransferService.rejectTransfer(transferId, comment || 'Rejeição de alçada', 'Diretoria Financeira');
      alert(`Transferência ${transferId} REJEITADA. Saldo reservado devolvido ao evento de origem.`);
    }

    const modalEl = document.getElementById('modal-transfer-approval-action');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getInstance(modalEl)?.hide();
    }

    await refreshFinancialTransfersView();
    switchTransferTab('history');
  } catch (err) {
    alert(`Erro na decisão de alçada: ${err.message || err}`);
  }
}

export async function openTransferTimelineModal(transferId) {
  const codeEl = document.getElementById('m-tl-transfer-code');
  if (codeEl) codeEl.textContent = `Código: ${transferId}`;

  const bodyEl = document.getElementById('m-tl-content-body');
  if (bodyEl) {
    bodyEl.innerHTML = `<div class="text-center py-4"><i class="ph-arrows-clockwise ph-spin fs-3"></i> Carregando linha do tempo...</div>`;
  }

  const modalEl = document.getElementById('modal-transfer-timeline');
  if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  const res = await balanceTransferService.getTransferTimeline(transferId);
  if (res.ok && res.data) {
    const events = res.data;
    if (!bodyEl) return;
    if (events.length === 0) {
      bodyEl.innerHTML = `<div class="text-center text-muted py-3">Nenhum evento na linha do tempo.</div>`;
      return;
    }

    bodyEl.innerHTML = `
      <div class="position-relative ps-4" style="border-left: 2px solid #e2e8f0; margin-left: 12px;">
        ${events.map((e, idx) => `
          <div class="mb-4 position-relative">
            <span class="position-absolute rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
              style="width: 22px; height: 22px; left: -27px; top: 0px; font-size: 11px;">
              ${idx + 1}
            </span>
            <div class="d-flex justify-content-between align-items-start">
              <strong class="text-dark fs-xs">${e.type}</strong>
              <span class="text-muted fs-xs">${formatDate(e.occurredAt)}</span>
            </div>
            <div class="text-secondary fs-xs mt-1">${e.description}</div>
            <div class="fs-xs text-muted mt-1">Ator: <strong>${e.actorName || 'Sistema'}</strong> (${e.actorRole || 'Audit'})</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

export async function openEventMovementsModal(eventId) {
  const evRes = await eventBalanceService.getEventBalance(eventId);
  if (!evRes.ok || !evRes.data) return;
  const ev = evRes.data;

  const titleEl = document.getElementById('m-movements-event-title');
  const subEl = document.getElementById('m-movements-event-subtitle');
  if (titleEl) titleEl.textContent = `Movimentações • ${ev.eventName}`;
  if (subEl) subEl.textContent = `Evento #${ev.eventId} — Disponível Real: ${formatBRL(ev.balances.availableBalance)}`;

  const tbody = document.getElementById('m-movements-tbody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted"><i class="ph-arrows-clockwise ph-spin me-1"></i> Carregando movimentações...</td></tr>`;

  const modalEl = document.getElementById('modal-event-movements');
  if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  const movRes = await eventBalanceService.getEventMovements(eventId);
  if (movRes.ok && movRes.data) {
    const movements = movRes.data;
    if (movements.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Nenhuma movimentação registrada.</td></tr>`;
      return;
    }

    tbody.innerHTML = movements.map(m => {
      const isNegative = m.amount < 0;
      return `
        <tr>
          <td class="text-nowrap text-muted">${formatDate(m.createdAt)}</td>
          <td><span class="badge bg-light text-dark border">${m.type}</span></td>
          <td>
            <div class="fw-semibold text-dark">${m.description}</div>
            <div class="fs-xs text-muted">ID: ${m.id} ${m.transferId ? `&bull; Ref: ${m.transferId}` : ''}</div>
          </td>
          <td class="text-end fw-bold ${isNegative ? 'text-danger' : 'text-success'}">
            ${isNegative ? '(-)' : '(+)'} ${formatBRL(Math.abs(m.amount))}
          </td>
          <td class="text-end fw-bold pe-3 text-dark">${formatBRL(m.balanceAfter)}</td>
        </tr>
      `;
    }).join('');
  }
}

export function openTransferAuditModal(transferId) {
  const transfer = cachedHistory.find(t => t.id === transferId);
  if (!transfer) return;

  const codeEl = document.getElementById('m-audit-code-label');
  if (codeEl) codeEl.textContent = `Código: ${transfer.id}`;

  const bodyEl = document.getElementById('m-audit-content-body');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="card bg-light border-0 mb-3 p-3">
        <div class="d-flex justify-content-between">
          <span class="fs-xs text-muted">Valor da Transferência</span>
          <span class="badge ${transfer.status === 'CONCLUIDA' ? 'bg-success' : 'bg-warning text-dark'}">${transfer.status}</span>
        </div>
        <h3 class="fw-bold text-dark mt-1 mb-0">${formatBRL(transfer.amount)}</h3>
      </div>

      <div class="row g-2 mb-3">
        <div class="col-6">
          <div class="border rounded p-2">
            <span class="fs-xs text-muted d-block">Origem</span>
            <strong class="text-dark fs-xs">${transfer.sourceEventName}</strong>
            <div class="fs-xs text-danger mt-1">Saldo após: ${formatBRL(transfer.sourceAfter)}</div>
          </div>
        </div>
        <div class="col-6">
          <div class="border rounded p-2">
            <span class="fs-xs text-muted d-block">Destino</span>
            <strong class="text-dark fs-xs">${transfer.targetEventName}</strong>
            <div class="fs-xs text-success mt-1">Saldo após: ${formatBRL(transfer.targetAfter)}</div>
          </div>
        </div>
      </div>

      <table class="table table-sm fs-xs mb-3">
        <tbody>
          <tr><th class="text-muted" style="width: 35%;">Produtor:</th><td>${transfer.producerName || transfer.producerId}</td></tr>
          <tr><th class="text-muted">Solicitante:</th><td>${transfer.requestedBy || '—'}</td></tr>
          <tr><th class="text-muted">Aprovador:</th><td>${transfer.approvedBy || '—'}</td></tr>
          <tr><th class="text-muted">Motivo:</th><td>${transfer.reason}</td></tr>
          <tr><th class="text-muted">Data/Hora:</th><td>${formatDate(transfer.createdAt)}</td></tr>
          <tr><th class="text-muted">Correlation ID:</th><td class="font-monospace text-primary">${transfer.correlationId || '—'}</td></tr>
          ${transfer.reversedTransferId ? `<tr><th class="text-danger">Estornado por:</th><td class="text-danger font-monospace">${transfer.reversedTransferId}</td></tr>` : ''}
        </tbody>
      </table>

      <div class="alert alert-secondary p-2 fs-xs mb-0">
        <i class="ph-info me-1"></i> Esta transferência atende integralmente à RN03: o saldo consolidado do produtor permaneceu invariável (${formatBRL(transfer.producerTotalBefore)}).
      </div>
    `;
  }

  const modalEl = document.getElementById('modal-transfer-audit-detail');
  if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}

export async function handleReverseTransfer(transferId) {
  const reason = prompt(`Confirma o estorno da transferência ${transferId}?\nDigite o motivo do estorno:`);
  if (!reason) return;

  try {
    await balanceTransferService.reverseTransfer(transferId, reason);
    alert(`Transferência ${transferId} estornada com sucesso!\nMovimentações financeiras de reversão creditadas e debitadas.`);
    await refreshFinancialTransfersView();
  } catch (err) {
    alert(`Falha ao estornar transferência: ${err.message || err}`);
  }
}

export function exportTransfersCsv() {
  if (!cachedHistory || cachedHistory.length === 0) {
    alert('Nenhuma transferência disponível para exportação.');
    return;
  }

  const headers = ['Código', 'Data', 'Produtor', 'Origem', 'Destino', 'Valor', 'Status', 'Motivo', 'Solicitante', 'CorrelationId'];
  const rows = cachedHistory.map(t => [
    t.id,
    t.createdAt,
    `"${t.producerName || t.producerId}"`,
    `"${t.sourceEventName || t.sourceEventId}"`,
    `"${t.targetEventName || t.targetEventId}"`,
    t.amount,
    t.status,
    `"${t.reason}"`,
    `"${t.requestedBy || ''}"`,
    t.correlationId
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `transferencias_${currentProducerId}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printTransferReceipt() {
  window.print();
}

// Registro das funções globais para consumo no DOM inline
if (typeof window !== 'undefined') {
  window.initFinancialEventTransfersView = initFinancialEventTransfersView;
  window.refreshFinancialTransfersView = refreshFinancialTransfersView;
  window.changeTransferProducer = changeTransferProducer;
  window.switchTransferTab = switchTransferTab;
  window.filterTransferEvents = filterTransferEvents;
  window.openBalanceTransferModal = openBalanceTransferModal;
  window.updateTransferPreview = updateTransferPreview;
  window.setTransferPercentage = setTransferPercentage;
  window.handleBalanceTransferSubmit = handleBalanceTransferSubmit;
  window.openEventMovementsModal = openEventMovementsModal;
  window.openTransferAuditModal = openTransferAuditModal;
  window.openTransferTimelineModal = openTransferTimelineModal;
  window.openApprovalActionModal = openApprovalActionModal;
  window.confirmApprovalAction = confirmApprovalAction;
  window.handleReverseTransfer = handleReverseTransfer;
  window.exportTransfersCsv = exportTransfersCsv;
  window.printTransferReceipt = printTransferReceipt;
}
