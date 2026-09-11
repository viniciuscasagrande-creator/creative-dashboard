/**
 * Fase 26.17.9.5.1 a Fase 26.17.9.5.4 — Controlador de Gestão de Saldos, Transferências e Dashboard Executivo
 * Orquestra Dashboard Executivo, Saldo por Evento, Aprovação de Alçadas, Histórico com Timeline e Auditoria.
 */

import { eventBalanceService, OFFICIAL_PRODUCERS } from '../services/eventBalanceService.js';
import { balanceTransferService } from '../services/balanceTransferService.js';
import { cashForecastService } from '../services/cashForecastService.js';
import { financialRulesEngine } from '../services/financialRulesService.js';
import { payoutScheduleGateway } from '../services/payoutScheduleGateway.js';
import { payoutScheduleService } from '../services/payoutScheduleService.js';

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
let currentHorizonDays = 30;
let currentForecastEventId = 'consolidado';
let cachedForecast = null;
let forecastChartCurve = null;
let forecastChartFlow = null;


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

    // 7. Carregar Projeção Preditiva de Caixa e Repasses (Fase 26.17.9.5.5)
    refreshForecastData();
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
  ['dashboard', 'events', 'approvals', 'history', 'audit', 'forecast', 'rules'].forEach(t => {
    const link = document.getElementById(`ft-tab-link-${t}`);
    const pane = document.getElementById(`ft-pane-${t}`);
    if (link) link.classList.toggle('active', t === tab);
    if (pane) pane.style.display = t === tab ? 'block' : 'none';
  });
  if (tab === 'forecast') {
    refreshForecastData();
  }
  if (tab === 'rules') {
    refreshRulesData();
  }
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

export async function openBalanceTransferModal(preselectedSourceId = null, preselectedTargetId = null, prefillAmount = null, prefillReason = '') {
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
    if (preselectedTargetId) {
      targetSelect.value = String(preselectedTargetId);
    } else if (preselectedSourceId && events.length > 1) {
      const other = events.find(e => String(e.eventId) !== String(preselectedSourceId));
      if (other) targetSelect.value = String(other.eventId);
    }
  }

  if (prefillAmount) {
    const amountInput = document.getElementById('trf-input-amount');
    if (amountInput) amountInput.value = Number(prefillAmount).toFixed(2);
  }

  if (prefillReason) {
    const reasonInput = document.getElementById('trf-input-reason');
    if (reasonInput) reasonInput.value = prefillReason;
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

// =========================================================================
// Fase 26.17.9.5.5 — Projeção de Caixa e Repasses por Evento
// =========================================================================

export async function refreshForecastData() {
  const icon = document.getElementById('ft-fc-refresh-icon');
  if (icon) icon.classList.add('ph-spin');

  try {
    // 1. Popular select de eventos do forecast se estiver vazio ou com opções desatualizadas
    const eventSelect = document.getElementById('ft-fc-event-select');
    if (eventSelect) {
      const currentVal = eventSelect.value || currentForecastEventId;
      const events = cachedEvents.filter(e => e.producerId === currentProducerId);
      const opts = [
        '<option value="consolidado">Consolidado (Todos os Eventos)</option>',
        ...events.map(e => `<option value="${e.eventId}">${e.eventName} (#${e.eventId})</option>`)
      ].join('');
      eventSelect.innerHTML = opts;
      eventSelect.value = currentVal;
    }

    // 2. Carregar dados de projeção (Consolidado ou Evento Específico)
    if (currentForecastEventId === 'consolidado') {
      const res = await cashForecastService.getConsolidatedCashForecast(currentProducerId, { horizonDays: currentHorizonDays });
      if (res.ok && res.data) {
        cachedForecast = res.data;
        renderForecastConsolidatedKpis(cachedForecast);
        renderForecastCharts(cachedForecast.timeline);
        renderForecastEventsTable(cachedForecast.events);
        renderForecastCoverageSection(cachedForecast.coverageSuggestions || []);
      }
    } else {
      const evForecast = await cashForecastService.calculateEventCashForecast(currentForecastEventId, { horizonDays: currentHorizonDays });
      cachedForecast = evForecast;
      renderForecastSingleEventKpis(evForecast);
      renderForecastCharts(evForecast.timeline);
      renderForecastEventsTable([evForecast]);
      
      // Buscar sugestões se em déficit
      if (evForecast.forecast.riskStatus === 'DEFICIT_PROJETADO') {
        const cov = await cashForecastService.buildCoverageSuggestions(currentForecastEventId, { horizonDays: currentHorizonDays });
        renderForecastCoverageSection(cov.suggestions.map(s => ({
          targetEventId: evForecast.eventId,
          targetEventName: evForecast.eventName,
          ...s
        })));
      } else {
        renderForecastCoverageSection([]);
      }
    }
  } catch (err) {
    console.error('[CashForecast] Erro ao carregar projeção:', err);
  } finally {
    if (icon) icon.classList.remove('ph-spin');
  }
}

function renderForecastConsolidatedKpis(data) {
  const k = data.kpis;
  const elAvail = document.getElementById('ft-fc-kpi-current-available');
  const elInflows = document.getElementById('ft-fc-kpi-expected-inflows');
  const elOutflows = document.getElementById('ft-fc-kpi-expected-outflows');
  const elProj = document.getElementById('ft-fc-kpi-projected-balance');
  const elMin = document.getElementById('ft-fc-kpi-minimum-balance');
  const elCritDate = document.getElementById('ft-fc-kpi-critical-date-label');
  const elRiskBadge = document.getElementById('ft-fc-kpi-risk-badge');
  const elRiskSublabel = document.getElementById('ft-fc-kpi-risk-sublabel');
  const elEventsRisk = document.getElementById('ft-fc-kpi-events-at-risk');
  const elReqCov = document.getElementById('ft-fc-kpi-required-coverage');
  const tabBadge = document.getElementById('ft-forecast-risk-badge');

  if (elAvail) elAvail.textContent = formatBRL(k.totalAvailable);
  if (elInflows) elInflows.textContent = formatBRL(k.totalExpectedInflows);
  if (elOutflows) elOutflows.textContent = formatBRL(k.totalExpectedOutflows);
  if (elProj) {
    elProj.textContent = formatBRL(k.totalProjectedBalance);
    elProj.className = `fw-bold mb-0 mt-2 ${k.totalProjectedBalance < 0 ? 'text-danger' : 'text-indigo'}`;
  }
  if (elMin) {
    elMin.textContent = formatBRL(k.minimumProjectedBalance);
    elMin.className = `fs-5 fw-bold mt-1 ${k.minimumProjectedBalance < 0 ? 'text-danger' : 'text-dark'}`;
  }
  if (elCritDate) elCritDate.textContent = `Menor nível em: ${k.minimumProjectedDate ? formatDate(k.minimumProjectedDate).slice(0, 10) : '—'}`;

  // Risco Global
  let riskStatus = 'NORMAL';
  let badgeClass = 'badge bg-success text-white px-2 py-1 fs-xs fw-semibold';
  let sublabel = 'Folga financeira adequada';

  if (k.totalRequiredCoverage > 0) {
    riskStatus = 'DEFICIT_PROJETADO';
    badgeClass = 'badge bg-danger text-white px-2 py-1 fs-xs fw-semibold';
    sublabel = 'Déficit projetado identificado';
  } else if (k.eventsAtRiskCount > 0) {
    riskStatus = 'ATENÇÃO';
    badgeClass = 'badge bg-warning text-dark px-2 py-1 fs-xs fw-semibold';
    sublabel = `${k.eventsAtRiskCount} evento(s) com folga estreita`;
  }

  if (elRiskBadge) {
    elRiskBadge.textContent = riskStatus;
    elRiskBadge.className = badgeClass;
  }
  if (elRiskSublabel) elRiskSublabel.textContent = sublabel;

  if (elEventsRisk) elEventsRisk.textContent = `${k.eventsAtRiskCount} / ${k.totalEvents}`;
  if (elReqCov) {
    elReqCov.textContent = formatBRL(k.totalRequiredCoverage);
    elReqCov.className = `fs-5 fw-bold mt-1 ${k.totalRequiredCoverage > 0 ? 'text-danger' : 'text-muted'}`;
  }

  // Atualizar badge no cabeçalho da aba
  if (tabBadge) {
    if (k.eventsAtRiskCount > 0 || k.totalRequiredCoverage > 0) {
      tabBadge.textContent = String(k.eventsAtRiskCount || 1);
      tabBadge.classList.remove('d-none');
    } else {
      tabBadge.classList.add('d-none');
    }
  }
}

function renderForecastSingleEventKpis(ev) {
  const f = ev.forecast;
  const c = ev.current;

  const elAvail = document.getElementById('ft-fc-kpi-current-available');
  const elInflows = document.getElementById('ft-fc-kpi-expected-inflows');
  const elOutflows = document.getElementById('ft-fc-kpi-expected-outflows');
  const elProj = document.getElementById('ft-fc-kpi-projected-balance');
  const elMin = document.getElementById('ft-fc-kpi-minimum-balance');
  const elCritDate = document.getElementById('ft-fc-kpi-critical-date-label');
  const elRiskBadge = document.getElementById('ft-fc-kpi-risk-badge');
  const elRiskSublabel = document.getElementById('ft-fc-kpi-risk-sublabel');
  const elEventsRisk = document.getElementById('ft-fc-kpi-events-at-risk');
  const elReqCov = document.getElementById('ft-fc-kpi-required-coverage');

  if (elAvail) elAvail.textContent = formatBRL(c.availableBalance);
  if (elInflows) elInflows.textContent = formatBRL(f.expectedInflows);
  if (elOutflows) elOutflows.textContent = formatBRL(f.expectedOutflows);
  if (elProj) {
    elProj.textContent = formatBRL(f.projectedBalance);
    elProj.className = `fw-bold mb-0 mt-2 ${f.projectedBalance < 0 ? 'text-danger' : 'text-indigo'}`;
  }
  if (elMin) {
    elMin.textContent = formatBRL(f.minimumProjectedBalance);
    elMin.className = `fs-5 fw-bold mt-1 ${f.minimumProjectedBalance < 0 ? 'text-danger' : 'text-dark'}`;
  }
  if (elCritDate) elCritDate.textContent = `Menor nível em: ${f.minimumProjectedDate ? formatDate(f.minimumProjectedDate).slice(0, 10) : '—'}`;

  let badgeClass = 'badge bg-success text-white px-2 py-1 fs-xs fw-semibold';
  let sub = 'Folga financeira adequada';
  if (f.riskStatus === 'DEFICIT_PROJETADO') {
    badgeClass = 'badge bg-danger text-white px-2 py-1 fs-xs fw-semibold';
    sub = 'Necessidade de cobertura';
  } else if (f.riskStatus === 'CRITICO') {
    badgeClass = 'badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 fs-xs fw-semibold';
    sub = 'Próximo do limite de segurança';
  } else if (f.riskStatus === 'ATENCAO') {
    badgeClass = 'badge bg-warning text-dark px-2 py-1 fs-xs fw-semibold';
    sub = 'Folga inferior a 15% das obrigações';
  }

  if (elRiskBadge) {
    elRiskBadge.textContent = f.riskStatus;
    elRiskBadge.className = badgeClass;
  }
  if (elRiskSublabel) elRiskSublabel.textContent = sub;
  if (elEventsRisk) elEventsRisk.textContent = f.riskStatus === 'NORMAL' ? '0 / 1' : '1 / 1';
  if (elReqCov) {
    elReqCov.textContent = formatBRL(ev.coverage?.requiredAmount || 0);
    elReqCov.className = `fs-5 fw-bold mt-1 ${(ev.coverage?.requiredAmount || 0) > 0 ? 'text-danger' : 'text-muted'}`;
  }
}

export function switchForecastHorizon(days) {
  currentHorizonDays = parseInt(days, 10) || 30;
  refreshForecastData();
}

export function switchForecastEvent(eventId) {
  currentForecastEventId = eventId;
  refreshForecastData();
}

export function renderForecastCharts(timeline) {
  if (!timeline || timeline.length === 0) return;
  if (typeof window === 'undefined' || !window.Chart) return;

  const canvasCurve = document.getElementById('ft-fc-chart-curve');
  const canvasFlow = document.getElementById('ft-fc-chart-flow');
  if (!canvasCurve || !canvasFlow) return;

  const labels = timeline.map((pt, i) => {
    if (timeline.length <= 15) return pt.date.slice(5);
    return i % 3 === 0 ? pt.date.slice(5) : '';
  });

  const balances = timeline.map(pt => pt.projectedBalance);
  const inflows = timeline.map(pt => pt.inflows);
  const outflows = timeline.map(pt => pt.outflows);

  // 1. Curva de Caixa
  if (forecastChartCurve) {
    forecastChartCurve.destroy();
    forecastChartCurve = null;
  }

  try {
    const ctxCurve = canvasCurve.getContext('2d');
    forecastChartCurve = new window.Chart(ctxCurve, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Saldo Projetado (R$)',
          data: balances,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.2,
          pointRadius: timeline.length <= 15 ? 3 : 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Saldo Projetado: ${formatBRL(ctx.raw)}`
            }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: {
              callback: (val) => formatBRL(val).replace('R$', '').trim()
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  } catch (err) {
    console.warn('[CashForecast] Erro ao renderizar Chart Curve:', err);
  }

  // 2. Gráfico de Entradas vs Saídas
  if (forecastChartFlow) {
    forecastChartFlow.destroy();
    forecastChartFlow = null;
  }

  try {
    const ctxFlow = canvasFlow.getContext('2d');
    forecastChartFlow = new window.Chart(ctxFlow, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Entradas Previstas',
            data: inflows,
            backgroundColor: '#0284c7'
          },
          {
            label: 'Saídas Previstas',
            data: outflows,
            backgroundColor: '#ef4444'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${formatBRL(ctx.raw)}`
            }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: {
              callback: (val) => formatBRL(val).replace('R$', '').trim()
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  } catch (err) {
    console.warn('[CashForecast] Erro ao renderizar Chart Flow:', err);
  }
}

function renderForecastEventsTable(events) {
  const tbody = document.getElementById('ft-fc-events-tbody');
  if (!tbody) return;

  if (!events || events.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3">Nenhum evento encontrado para o produtor selecionado.</td></tr>';
    return;
  }

  tbody.innerHTML = events.map(ev => {
    const c = ev.current || {};
    const f = ev.forecast || {};
    const r = f.riskStatus || 'NORMAL';

    let riskBadgeClass = 'bg-success text-white';
    if (r === 'DEFICIT_PROJETADO') riskBadgeClass = 'bg-danger text-white';
    else if (r === 'CRITICO') riskBadgeClass = 'bg-danger-subtle text-danger border border-danger-subtle';
    else if (r === 'ATENCAO') riskBadgeClass = 'bg-warning text-dark';

    return `
      <tr>
        <td>
          <div class="fw-bold text-dark">${ev.eventName}</div>
          <div class="text-muted fs-xs">#${ev.eventId} &bull; ${ev.producerName || 'Produtor Oficial'}</div>
        </td>
        <td class="text-end fw-semibold text-dark">${formatBRL(c.availableBalance)}</td>
        <td class="text-end text-primary">${formatBRL(f.expectedInflows)}</td>
        <td class="text-end text-danger">${formatBRL(f.expectedOutflows)}</td>
        <td class="text-end fw-bold ${f.projectedBalance < 0 ? 'text-danger' : 'text-dark'}">${formatBRL(f.projectedBalance)}</td>
        <td class="text-end fw-bold ${f.minimumProjectedBalance < 0 ? 'text-danger' : 'text-dark'}">
          ${formatBRL(f.minimumProjectedBalance)}
          <div class="text-muted fs-xs">${f.minimumProjectedDate ? formatDate(f.minimumProjectedDate).slice(0, 10) : ''}</div>
        </td>
        <td class="text-center">
          <span class="badge ${riskBadgeClass} fs-xs px-2 py-1">${r}</span>
        </td>
        <td class="text-center">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary btn-xs" onclick="window.switchForecastEvent('${ev.eventId}')" title="Ver Curva Individual">
              <i class="ph-chart-line"></i>
            </button>
            <button class="btn btn-outline-primary btn-xs" onclick="window.openCoverageSimulator('${ev.eventId}')" title="Simular Cobertura">
              <i class="ph-flask"></i>
            </button>
            <button class="btn btn-success btn-xs" onclick="window.openBalanceTransferModal(null, '${ev.eventId}')" title="Solicitar Transferência">
              <i class="ph-arrows-left-right"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderForecastCoverageSection(suggestions) {
  const container = document.getElementById('ft-fc-coverage-section');
  const cardsContainer = document.getElementById('ft-fc-coverage-cards-container');
  const countBadge = document.getElementById('ft-fc-coverage-count-badge');
  if (!container || !cardsContainer) return;

  if (!suggestions || suggestions.length === 0) {
    container.classList.add('d-none');
    return;
  }

  container.classList.remove('d-none');
  if (countBadge) countBadge.textContent = `${suggestions.length} Alerta(s)`;

  cardsContainer.innerHTML = suggestions.map(s => `
    <div class="col-12 col-md-6 col-xl-4">
      <div class="card h-100 border shadow-none bg-white p-3">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="badge bg-danger-subtle text-danger border border-danger-subtle fs-xs">Déficit no Evento Destino</span>
          <span class="fw-bold text-success fs-xs">Sugestão: ${formatBRL(s.suggestedAmount)}</span>
        </div>
        <div class="mb-2">
          <div class="fs-xs text-muted text-uppercase fw-bold">Evento Destino em Risco</div>
          <div class="fw-bold text-dark fs-sm">${s.targetEventName || 'Evento em Risco'} (#${s.targetEventId})</div>
        </div>
        <div class="mb-3 pt-2 border-top">
          <div class="fs-xs text-muted text-uppercase fw-bold">Origem Recomendada (Candidato)</div>
          <div class="fw-bold text-dark fs-sm">${s.sourceEventName} (#${s.sourceEventId})</div>
          <div class="d-flex justify-content-between text-muted fs-xs mt-1">
            <span>Disp. Atual: <strong>${formatBRL(s.availableBalance)}</strong></span>
            <span>Capacidade: <strong>${formatBRL(s.safeCapacity)}</strong></span>
          </div>
        </div>
        <div class="d-flex gap-2 mt-auto">
          <button class="btn btn-xs btn-outline-primary w-50 d-flex align-items-center justify-content-center gap-1" onclick="window.openCoverageSimulator('${s.targetEventId}', '${s.sourceEventId}', ${s.suggestedAmount})">
            <i class="ph-flask"></i> Simular
          </button>
          <button class="btn btn-xs btn-primary w-50 fw-bold d-flex align-items-center justify-content-center gap-1" onclick="window.openBalanceTransferModal('${s.sourceEventId}', '${s.targetEventId}', ${s.suggestedAmount}, 'Cobertura preventiva de fluxo de caixa projetado')">
            <i class="ph-arrows-left-right"></i> Solicitar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

export async function openCoverageSimulator(targetEventId = null, sourceEventId = null, prefillAmount = null) {
  const modalEl = document.getElementById('modal-forecast-coverage-simulator');
  if (!modalEl) return;

  const targetSelect = document.getElementById('sim-select-target');
  const sourceSelect = document.getElementById('sim-select-source');
  const amountInput = document.getElementById('sim-input-amount');

  const events = cachedEvents.filter(e => e.producerId === currentProducerId);

  const targetOptions = events.map(e =>
    `<option value="${e.eventId}">${e.eventName} (#${e.eventId}) — Disp: ${formatBRL(e.balances.availableBalance)}</option>`
  ).join('');

  const sourceOptions = events.map(e =>
    `<option value="${e.eventId}">${e.eventName} (#${e.eventId}) — Disp: ${formatBRL(e.balances.availableBalance)}</option>`
  ).join('');

  if (targetSelect) {
    targetSelect.innerHTML = targetOptions;
    if (targetEventId) targetSelect.value = String(targetEventId);
  }

  if (sourceSelect) {
    sourceSelect.innerHTML = sourceOptions;
    if (sourceEventId) {
      sourceSelect.value = String(sourceEventId);
    } else {
      const other = events.find(e => String(e.eventId) !== String(targetSelect?.value));
      if (other) sourceSelect.value = String(other.eventId);
    }
  }

  if (amountInput) {
    amountInput.value = prefillAmount ? Number(prefillAmount).toFixed(2) : '1000';
  }

  await updateCoverageSimulation();

  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}

export async function updateCoverageSimulation() {
  const targetId = document.getElementById('sim-select-target')?.value;
  const sourceId = document.getElementById('sim-select-source')?.value;
  const amount = Number(document.getElementById('sim-input-amount')?.value || 0);

  const displayEl = document.getElementById('sim-amount-display');
  if (displayEl) displayEl.textContent = formatBRL(amount);

  if (!targetId || !sourceId || amount <= 0 || targetId === sourceId) return;

  try {
    const sim = await cashForecastService.simulateCoverage({
      sourceEventId: sourceId,
      targetEventId: targetId,
      amount,
      horizonDays: currentHorizonDays
    });

    const elSrcBef = document.getElementById('sim-res-source-before');
    const elSrcAft = document.getElementById('sim-res-source-after');
    const elSrcRisk = document.getElementById('sim-res-source-risk-badge');

    const elTgtBef = document.getElementById('sim-res-target-before');
    const elTgtAft = document.getElementById('sim-res-target-after');
    const elTgtRisk = document.getElementById('sim-res-target-risk-badge');

    if (sim.before) {
      if (elSrcBef) elSrcBef.textContent = formatBRL(sim.before.sourceMinBalance);
      if (elTgtBef) elTgtBef.textContent = formatBRL(sim.before.targetMinBalance);
    }

    if (sim.after) {
      if (elSrcAft) elSrcAft.textContent = formatBRL(sim.after.sourceMinBalance);
      if (elTgtAft) elTgtAft.textContent = formatBRL(sim.after.targetMinBalance);

      if (elSrcRisk) elSrcRisk.innerHTML = `<span class="badge ${sim.after.sourceRisk === 'NORMAL' ? 'bg-success' : 'bg-warning'} fs-xs">${sim.after.sourceRisk}</span>`;
      if (elTgtRisk) elTgtRisk.innerHTML = `<span class="badge ${sim.after.targetRisk === 'NORMAL' ? 'bg-success' : 'bg-warning'} fs-xs">${sim.after.targetRisk}</span>`;
    }
  } catch (err) {
    console.warn('[CashForecast] Erro na simulação:', err);
  }
}

export function applySimulatedTransferToModal() {
  const targetId = document.getElementById('sim-select-target')?.value;
  const sourceId = document.getElementById('sim-select-source')?.value;
  const amount = Number(document.getElementById('sim-input-amount')?.value || 0);

  const modalEl = document.getElementById('modal-forecast-coverage-simulator');
  if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    bootstrap.Modal.getInstance(modalEl)?.hide();
  }

  openBalanceTransferModal(sourceId, targetId, amount, 'Cobertura simulada de fluxo de caixa projetado');
}

/**
 * Fase 26.17.9.5.6 — Controlador do Motor de Regras de Repasse e Prioridades Financeiras
 */
let currentRulesSubTab = 'policies';

export function switchRulesSubTab(subTab) {
  currentRulesSubTab = subTab;
  const subtabs = ['policies', 'priorities', 'reserves', 'blocks', 'limits', 'exceptions', 'simulator', 'audit'];
  subtabs.forEach(st => {
    const btn = document.getElementById(`ft-rul-btn-subtab-${st}`);
    const pane = document.getElementById(`ft-rul-pane-${st}`);
    if (btn) btn.classList.toggle('active', st === subTab);
    if (pane) pane.style.display = st === subTab ? 'block' : 'none';
  });
}

export async function refreshRulesData() {
  try {
    const policies = financialRulesEngine.getPolicies();
    const priorities = financialRulesEngine.getPriorities();
    const exceptions = financialRulesEngine.getExceptions();
    const auditLogs = financialRulesEngine.getAuditLog();

    // KPIs
    const elPolCount = document.getElementById('ft-rul-kpi-policies-count');
    const elBadge = document.getElementById('ft-rules-count-badge');
    const elMinRes = document.getElementById('ft-rul-kpi-min-reserve');
    const elMaxWithout = document.getElementById('ft-rul-kpi-max-without-app');
    const elTwoLevel = document.getElementById('ft-rul-kpi-two-level-app');
    const elWindow = document.getElementById('ft-rul-kpi-window-status');
    const elWindowSub = document.getElementById('ft-rul-kpi-window-sub');
    const elExcCount = document.getElementById('ft-rul-kpi-exceptions-count');

    if (elPolCount) elPolCount.textContent = String(policies.filter(p => p.active).length);
    if (elBadge) elBadge.textContent = String(policies.filter(p => p.active).length);

    const globalPol = policies.find(p => p.scope === 'GLOBAL') || policies[0];
    if (globalPol) {
      if (elMinRes) elMinRes.textContent = `${globalPol.minReservePercent}% / ${formatBRL(globalPol.minReserveFixed)}`;
      if (elMaxWithout) elMaxWithout.textContent = formatBRL(globalPol.maxWithoutApproval);
      if (elTwoLevel) elTwoLevel.textContent = `Acima de ${formatBRL(globalPol.twoLevelApprovalThreshold)}`;
      if (elWindow) {
        elWindow.textContent = `${String(globalPol.operationalWindow.startHour).padStart(2, '0')}h - ${String(globalPol.operationalWindow.endHour).padStart(2, '0')}h`;
      }
      if (elWindowSub) {
        const now = new Date();
        const d = now.getDay();
        const h = now.getHours();
        const isOpen = globalPol.operationalWindow.daysOfWeek.includes(d) && h >= globalPol.operationalWindow.startHour && h < globalPol.operationalWindow.endHour;
        elWindowSub.textContent = isOpen ? 'Janela Aberta (Operando)' : 'Janela Fechada (HOLD)';
        elWindowSub.className = `fs-xs ${isOpen ? 'text-success' : 'text-danger'}`;
      }
    }

    const activeExceptions = exceptions.filter(e => e.status === 'ACTIVE');
    if (elExcCount) elExcCount.textContent = String(activeExceptions.length);

    // Render Sub-panes
    renderRulesPoliciesTable(policies);
    renderRulesPriorities(priorities);
    renderRulesBlocksMatrix(policies);
    renderRulesExceptionsTable(exceptions);
    renderRulesAuditTable(auditLogs);
    updateRulesSimEvents(currentProducerId);
  } catch (err) {
    console.error('[FinancialRules] Erro ao carregar dados:', err);
  }
}

function renderRulesPoliciesTable(policies) {
  const tbody = document.getElementById('ft-rul-policies-tbody');
  if (!tbody) return;

  if (!policies || policies.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3 text-muted">Nenhuma política configurada.</td></tr>';
    return;
  }

  tbody.innerHTML = policies.map(p => {
    const scopeBadge = p.scope === 'GLOBAL'
      ? '<span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-xs">GLOBAL</span>'
      : p.scope === 'PRODUCER'
      ? `<span class="badge bg-warning-subtle text-dark border border-warning-subtle fs-xs">PRODUTOR (#${p.targetId})</span>`
      : `<span class="badge text-white fs-xs" style="background-color: #7c3aed;">EVENTO (#${p.targetId})</span>`;

    const reserveDesc = p.reserveRule === 'GREATER_OF'
      ? `Maior entre ${p.minReservePercent}% e ${formatBRL(p.minReserveFixed)}`
      : p.reserveRule === 'PERCENT'
      ? `${p.minReservePercent}% do saldo liquidado`
      : formatBRL(p.minReserveFixed);

    const windowDesc = p.operationalWindow?.enabled
      ? `${p.operationalWindow.startHour}h-${p.operationalWindow.endHour}h (Seg-Sex)`
      : '<span class="text-muted">24/7 (Sem restrição)</span>';

    return `
      <tr>
        <td>
          <div class="fw-bold text-dark">${p.name}</div>
          <div class="fs-xs text-muted font-monospace">${p.id}</div>
        </td>
        <td>${scopeBadge}</td>
        <td class="text-center"><span class="badge bg-light text-dark border">P-${p.priority}</span></td>
        <td>
          <div class="fw-semibold text-dark">${reserveDesc}</div>
          <div class="fs-xs text-muted">Máx liberável: ${p.maxReleasePercent}%</div>
        </td>
        <td class="text-end fw-bold text-success">${formatBRL(p.maxWithoutApproval)}</td>
        <td class="text-end fw-bold text-warning">${formatBRL(p.twoLevelApprovalThreshold)}</td>
        <td class="text-center fs-xs">${windowDesc}</td>
      </tr>
    `;
  }).join('');
}

function renderRulesPriorities(priorities) {
  const container = document.getElementById('ft-rul-priorities-container');
  if (!container) return;

  const categoryBadges = {
    BLOCK: { label: 'Bloqueio Estrito', class: 'bg-danger text-white' },
    RESERVE: { label: 'Reserva Cautelar', class: 'bg-primary text-white' },
    FEE: { label: 'Tarifa / MDR', class: 'bg-warning text-dark' },
    PAYOUT: { label: 'Repasse Aprovado', class: 'bg-success text-white' },
    TRANSFER: { label: 'Transferência Interna', class: 'bg-info text-white' },
    EXPENSE: { label: 'Despesa Crítica', class: 'bg-secondary text-white' },
    FREE: { label: 'Saldo Livre', class: 'text-white', style: 'background-color: #7c3aed;' }
  };

  container.innerHTML = priorities.map(p => {
    const badge = categoryBadges[p.category] || { label: p.category, class: 'bg-light text-dark' };
    return `
      <div class="col-12 col-md-6 col-xl-4">
        <div class="card h-100 border p-2 mb-0 shadow-none bg-light d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="badge bg-dark text-white fw-bold fs-xs">PRIORIDADE ${p.order}</span>
              <span class="badge ${badge.class} fs-xs" ${badge.style ? `style="${badge.style}"` : ''}>${badge.label}</span>
            </div>
            <div class="fw-bold text-dark fs-xs mt-1">${p.name}</div>
            <p class="fs-xs text-muted mb-0 mt-1">${p.description}</p>
          </div>
          <div class="mt-2 pt-2 border-top d-flex justify-content-between align-items-center fs-xs text-muted">
            <span>Código: <code>${p.code}</code></span>
            ${p.mandatory ? '<span class="text-danger fw-bold"><i class="ph-asterisk"></i> Mandatório</span>' : '<span class="text-success"><i class="ph-check"></i> Alocável</span>'}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRulesBlocksMatrix(policies) {
  const container = document.getElementById('ft-rul-blocks-matrix-container');
  if (!container) return;

  const blocks = [
    {
      title: 'Divergência Contábil Ativa',
      rule: 'DIVERGENCIA_CONTABIL',
      decision: 'BLOCK',
      desc: 'Bloqueio estrito se o evento tiver saldo liquidado desbalanceado (diferença entre Saldo Base e Disponível + Comprometido + Bloqueado).',
      icon: 'ph-warning-octagon text-danger'
    },
    {
      title: 'Janela Operacional Bancária',
      rule: 'JANELA_OPERACIONAL',
      decision: 'HOLD',
      desc: 'Retenção temporária fora do horário comercial bancário (08h às 18h em dias úteis). A operação é retida e liberada na abertura da janela.',
      icon: 'ph-clock text-warning'
    },
    {
      title: 'Conciliação Bancária Pendente',
      rule: 'CONCILIACAO_PENDENTE',
      decision: 'HOLD',
      desc: 'Aguardando batimento e confirmação do lote de recebíveis do adquirente antes de liberar transferências e repasses.',
      icon: 'ph-git-diff text-info'
    },
    {
      title: 'Chargeback Crítico em Disputa',
      rule: 'CHARGEBACK_CRITICO',
      decision: 'BLOCK',
      desc: 'Trava de segurança caso existam contestações ou chargebacks não cobertos pelo fundo garantidor.',
      icon: 'ph-shield-warning text-danger'
    },
    {
      title: 'Bloqueio de Compliance / Documentos',
      rule: 'COMPLIANCE_PENDENTE',
      decision: 'BLOCK',
      desc: 'Trava jurídica ou regulatória aplicada pela Controladoria até saneamento cadastral e societário.',
      icon: 'ph-scales text-danger'
    },
    {
      title: 'Inconsistência de Titularidade (RN01)',
      rule: 'PRODUTOR_DIVERGENTE',
      decision: 'BLOCK',
      desc: 'Tentativa de transferir recursos entre eventos de produtores com CNPJ/titularidade jurídica diferentes.',
      icon: 'ph-prohibit text-danger'
    }
  ];

  container.innerHTML = blocks.map(b => {
    const isBlock = b.decision === 'BLOCK';
    return `
      <div class="col-12 col-md-6 col-xl-4">
        <div class="card h-100 border p-3 shadow-none bg-light">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="d-flex align-items-center gap-2">
              <i class="${b.icon} fs-4"></i>
              <h6 class="fw-bold text-dark mb-0 fs-xs">${b.title}</h6>
            </div>
            <span class="badge ${isBlock ? 'bg-danger' : 'bg-warning text-dark'} fs-xs">${b.decision}</span>
          </div>
          <p class="fs-xs text-muted mb-2">${b.desc}</p>
          <div class="mt-auto pt-2 border-top d-flex justify-content-between align-items-center fs-xs">
            <span class="text-muted">Chave: <code>${b.rule}</code></span>
            <button class="btn btn-xs btn-outline-secondary" onclick="window.openCreateExceptionModal('${b.rule}')">
              Exceção
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRulesExceptionsTable(exceptions) {
  const tbody = document.getElementById('ft-rul-exceptions-tbody');
  if (!tbody) return;

  if (!exceptions || exceptions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-3 text-muted">
          <i class="ph-shield-check fs-3 d-block mb-1 text-success"></i>
          Nenhuma exceção cadastrada. O motor está operando com 100% de rigor contábil.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = exceptions.map(exc => {
    const isActive = exc.status === 'ACTIVE' && new Date(exc.validUntil) >= new Date();
    const statusBadge = isActive
      ? '<span class="badge bg-success text-white fs-xs">VIGENTE</span>'
      : '<span class="badge bg-secondary text-white fs-xs">EXPIRADA / REVOGADA</span>';

    return `
      <tr>
        <td>
          <div class="fw-bold text-dark">${exc.id}</div>
          <div class="fs-xs text-muted">${formatDate(exc.createdAt)}</div>
        </td>
        <td><span class="badge bg-warning-subtle text-dark border border-warning-subtle fs-xs">${exc.ruleToBypass}</span></td>
        <td><span class="badge bg-light text-dark border fs-xs">${exc.scope}</span></td>
        <td class="fs-xs text-dark">${exc.justification}</td>
        <td>
          <div class="fw-semibold text-dark fs-xs">${exc.approvedBy}</div>
          <span class="badge bg-purple-subtle text-purple fs-xs" style="color: #7c3aed;">${exc.actorRole}</span>
        </td>
        <td class="fs-xs fw-bold">${new Date(exc.validUntil).toLocaleDateString('pt-BR')}</td>
        <td class="text-center">
          ${statusBadge}
          ${isActive ? `<button class="btn btn-xs btn-outline-danger mt-1" onclick="window.handleRevokeException('${exc.id}')" title="Revogar exceção"><i class="ph-x"></i> Revogar</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function renderRulesAuditTable(auditLogs) {
  const tbody = document.getElementById('ft-rul-audit-tbody');
  if (!tbody) return;

  if (!auditLogs || auditLogs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">Nenhum registro de auditoria no motor.</td></tr>';
    return;
  }

  tbody.innerHTML = auditLogs.slice(0, 50).map(log => {
    const decClass = log.decision === 'ALLOW' ? 'bg-success text-white'
      : log.decision === 'ALLOW_WITH_APPROVAL' ? 'bg-warning text-dark'
      : log.decision === 'ALLOW_PARTIAL' ? 'bg-info text-white'
      : log.decision === 'HOLD' ? 'bg-secondary text-white'
      : log.decision === 'BLOCK' ? 'bg-danger text-white'
      : 'bg-light text-dark border';

    return `
      <tr>
        <td class="fs-xs text-muted font-monospace">${formatDate(log.timestamp)}</td>
        <td>
          <div class="fw-bold text-dark fs-xs">${log.actor}</div>
          <span class="badge bg-light text-secondary border fs-xs">${log.actorRole}</span>
        </td>
        <td><span class="badge bg-dark text-white fs-xs">${log.action}</span></td>
        <td>${log.decision ? `<span class="badge ${decClass} fs-xs">${log.decision}</span>` : '—'}</td>
        <td class="fs-xs text-dark">${log.details}</td>
        <td class="fs-xs font-monospace text-muted">${log.correlationId || '—'}</td>
      </tr>
    `;
  }).join('');
}

export function updateRulesSimEvents(producerId) {
  const sel = document.getElementById('sim-rul-event-select');
  if (!sel) return;

  const events = cachedEvents.filter(e => e.producerId === producerId);
  if (events.length === 0) {
    sel.innerHTML = '<option value="">Nenhum evento localizado</option>';
    return;
  }

  sel.innerHTML = events.map(e =>
    `<option value="${e.eventId}">${e.eventName} (#${e.eventId}) — Disp: ${formatBRL(e.balances.availableBalance)}</option>`
  ).join('');
}

export async function runRulesSimulation() {
  const opType = document.getElementById('sim-rul-operation-type')?.value || 'PAYOUT';
  const prodId = document.getElementById('sim-rul-producer-select')?.value || currentProducerId;
  const eventId = document.getElementById('sim-rul-event-select')?.value || null;
  const amount = Number(document.getElementById('sim-rul-amount-input')?.value || 0);

  const decBadge = document.getElementById('sim-rul-res-decision-badge');
  const corrId = document.getElementById('sim-rul-res-corr-id');
  const maxAllowed = document.getElementById('sim-rul-res-max-allowed');
  const reserve = document.getElementById('sim-rul-res-reserve');
  const appLevel = document.getElementById('sim-rul-res-approval-level');
  const alertsCont = document.getElementById('sim-rul-res-alerts-container');
  const policiesList = document.getElementById('sim-rul-res-policies-list');

  try {
    const res = await financialRulesEngine.simulateFinancialOperation({
      operationType: opType,
      producerId: prodId,
      eventId: eventId,
      amount,
      actor: { name: 'Operador Financeiro PDT', role: 'CONTROLADORIA' }
    });

    if (corrId) corrId.textContent = res.correlationId;
    if (maxAllowed) maxAllowed.textContent = formatBRL(res.maxAllowedAmount);
    if (reserve) reserve.textContent = formatBRL(res.reserveAmount);
    if (appLevel) {
      appLevel.textContent = res.approvalLevel === 'NIVEL_2_DIRETORIA' ? 'Nível 2 (Diretoria)'
        : res.approvalLevel === 'NIVEL_1_FINANCEIRO' ? 'Nível 1 (Controladoria)'
        : 'Automática (Sem Alçada)';
    }

    if (decBadge) {
      const badges = {
        ALLOW: { label: 'ALLOW — OPERAÇÃO PERMITIDA', class: 'bg-success text-white' },
        ALLOW_WITH_APPROVAL: { label: 'ALLOW_WITH_APPROVAL — REQUER ALÇADA', class: 'bg-warning text-dark' },
        ALLOW_PARTIAL: { label: 'ALLOW_PARTIAL — LIBERADO PARCIALMENTE', class: 'bg-info text-white' },
        HOLD: { label: 'HOLD — OPERAÇÃO RETIDA', class: 'bg-secondary text-white' },
        BLOCK: { label: 'BLOCK — OPERAÇÃO BLOQUEADA', class: 'bg-danger text-white' }
      };
      const b = badges[res.decision] || { label: res.decision, class: 'bg-dark text-white' };
      decBadge.innerHTML = `<span class="badge ${b.class} px-3 py-2 fs-6 fw-bold shadow-sm">${b.label}</span>`;
    }

    if (alertsCont) {
      let alertsHtml = '';
      if (res.blockedReasons && res.blockedReasons.length > 0) {
        alertsHtml += res.blockedReasons.map(r => `
          <div class="alert alert-danger p-2 mb-1 fs-xs d-flex align-items-center gap-2 border-0">
            <i class="ph-x-circle fs-5"></i>
            <div><strong>Bloqueio:</strong> ${r}</div>
          </div>
        `).join('');
      }
      if (res.warnings && res.warnings.length > 0) {
        alertsHtml += res.warnings.map(w => `
          <div class="alert alert-warning p-2 mb-1 fs-xs d-flex align-items-center gap-2 border-0">
            <i class="ph-warning fs-5"></i>
            <div><strong>Atenção:</strong> ${w}</div>
          </div>
        `).join('');
      }
      if (!alertsHtml) {
        alertsHtml = `
          <div class="alert alert-success p-2 mb-1 fs-xs d-flex align-items-center gap-2 border-0">
            <i class="ph-check-circle fs-5"></i>
            <div>Nenhum impedimento ou bloqueio detectado. Operação aderente a todas as políticas financeiras.</div>
          </div>
        `;
      }
      alertsCont.innerHTML = alertsHtml;
    }

    if (policiesList && res.appliedPolicies) {
      policiesList.innerHTML = res.appliedPolicies.map(p => `
        <li class="d-flex justify-content-between py-1 border-bottom">
          <span><strong>${p.name}</strong> (${p.id})</span>
          <span class="badge ${p.result === 'PASS' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-dark'} fs-xs">${p.result}</span>
        </li>
      `).join('');
    }

    // Atualiza auditoria em background
    const auditLogs = financialRulesEngine.getAuditLog();
    renderRulesAuditTable(auditLogs);
  } catch (err) {
    console.error('[FinancialRulesSim] Erro na simulação:', err);
    if (decBadge) decBadge.innerHTML = `<span class="badge bg-danger text-white px-3 py-2 fs-6">ERRO NA SIMULAÇÃO: ${err.message}</span>`;
  }
}

export function openCreateExceptionModal(rulePreset = null) {
  const modalEl = document.getElementById('modal-create-financial-exception');
  if (!modalEl) return;

  const form = document.getElementById('form-create-financial-exception');
  if (form) form.reset();

  if (rulePreset) {
    const sel = document.getElementById('exc-input-rule');
    if (sel) sel.value = rulePreset;
  }

  // Preenche data de vigência padrão para 7 dias no futuro
  const dtInput = document.getElementById('exc-input-valid-until');
  if (dtInput) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    dtInput.value = d.toISOString().split('T')[0];
  }

  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}

export function handleCreateException(event) {
  if (event) event.preventDefault();

  const ruleToBypass = document.getElementById('exc-input-rule')?.value;
  const scope = document.getElementById('exc-input-scope')?.value || 'GLOBAL';
  const validUntil = document.getElementById('exc-input-valid-until')?.value;
  const approvedBy = document.getElementById('exc-input-approved-by')?.value;
  const justification = document.getElementById('exc-input-justification')?.value;

  try {
    financialRulesEngine.createException({
      scope,
      targetId: scope === 'PRODUCER' ? currentProducerId : null,
      ruleToBypass,
      justification,
      approvedBy,
      actorRole: 'CONTROLADORIA',
      validUntil: `${validUntil}T23:59:59.000Z`
    });

    const modalEl = document.getElementById('modal-create-financial-exception');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getInstance(modalEl)?.hide();
    }

    refreshRulesData();
  } catch (err) {
    alert(`Erro ao criar exceção: ${err.message}`);
  }
}

export function handleRevokeException(id) {
  if (!confirm(`Deseja realmente revogar a exceção "${id}"? As regras voltarão a ser aplicadas estritamente.`)) {
    return;
  }
  try {
    financialRulesEngine.revokeException(id, { name: 'Controladoria', role: 'CONTROLADORIA' });
    refreshRulesData();
  } catch (err) {
    alert(`Erro ao revogar exceção: ${err.message}`);
  }
}


// =========================================================================
// FASE 26.17.9.5.7 — AGENDA FINANCEIRA, REPASSE AUTOMÁTICO E LOTES DE REPASSE
// =========================================================================

let cachedSchedule = [];
let cachedBatches = [];
let selectedScheduleIds = new Set();
let currentScheduleSubTab = 'calendar';
let activeBatchDetails = null;

export async function refreshScheduleData() {
  try {
    const scheduleRes = await payoutScheduleGateway.getSchedule({ producerId: currentProducerId });
    const batchesRes = await payoutScheduleGateway.getPayoutBatches({ producerId: currentProducerId });

    if (scheduleRes.ok) cachedSchedule = scheduleRes.data || [];
    if (batchesRes.ok) cachedBatches = batchesRes.data || [];

    // 1. Atualizar KPIs
    const now = new Date().toISOString().split('T')[0];
    const totalScheduled = cachedSchedule.reduce((acc, i) => acc + (i.amount || 0), 0);
    const todayItems = cachedSchedule.filter(i => i.dueDate === now);
    const todayAmount = todayItems.reduce((acc, i) => acc + (i.amount || 0), 0);
    
    const next7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const weekAmount = cachedSchedule
      .filter(i => i.dueDate >= now && i.dueDate <= next7Days)
      .reduce((acc, i) => acc + (i.amount || 0), 0);

    const pendingBatches = cachedBatches.filter(b => ['AGUARDANDO_APROVACAO', 'EM_VALIDACAO', 'RASCUNHO'].includes(b.status)).length;
    const settledBatches = cachedBatches.filter(b => b.status === 'CONCLUIDO').length;
    
    let retryableCount = 0;
    cachedBatches.forEach(b => {
      (b.items || []).forEach(it => {
        if (it.status === 'FALHA_TECNICA' && it.isRetryable) retryableCount++;
      });
    });

    const elTotalAmt = document.getElementById('ft-sch-kpi-total-amount');
    const elTotalCnt = document.getElementById('ft-sch-kpi-total-count');
    const elTodayAmt = document.getElementById('ft-sch-kpi-today-amount');
    const elTodayCnt = document.getElementById('ft-sch-kpi-today-count');
    const elWeekAmt = document.getElementById('ft-sch-kpi-week-amount');
    const elBatchesPend = document.getElementById('ft-sch-kpi-batches-pending');
    const elBatchesSett = document.getElementById('ft-sch-kpi-batches-settled');
    const elRetryable = document.getElementById('ft-sch-kpi-retryable');
    const elBadge = document.getElementById('ft-schedule-count-badge');

    if (elTotalAmt) elTotalAmt.textContent = formatBRL(totalScheduled);
    if (elTotalCnt) elTotalCnt.textContent = `${cachedSchedule.length} repasses`;
    if (elTodayAmt) elTodayAmt.textContent = formatBRL(todayAmount);
    if (elTodayCnt) elTodayCnt.textContent = `${todayItems.length} itens hoje`;
    if (elWeekAmt) elWeekAmt.textContent = formatBRL(weekAmount);
    if (elBatchesPend) elBatchesPend.textContent = pendingBatches;
    if (elBatchesSett) elBatchesSett.textContent = settledBatches;
    if (elRetryable) elRetryable.textContent = retryableCount;
    if (elBadge) elBadge.textContent = cachedSchedule.length;

    // 2. Renderizar Sub-abas ativas
    renderScheduleCalendarTable();
    renderScheduleBatchesTable();
    renderScheduleAuditTable();
  } catch (err) {
    console.error('Erro ao recarregar dados da agenda financeira:', err);
  }
}

export function switchScheduleSubTab(subTab) {
  currentScheduleSubTab = subTab;
  ['calendar', 'batches', 'webhook', 'audit'].forEach(t => {
    const btn = document.getElementById(`ft-sch-btn-subtab-${t}`);
    const pane = document.getElementById(`ft-sch-subpane-${t}`);
    if (btn) btn.classList.toggle('active', t === subTab);
    if (pane) pane.style.display = t === subTab ? 'block' : 'none';
  });
}

export function renderScheduleCalendarTable() {
  const tbody = document.getElementById('ft-sch-tbody-calendar');
  if (!tbody) return;

  if (cachedSchedule.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">Nenhum repasse agendado para este produtor.</td></tr>';
    return;
  }

  const priorityColors = {
    CRITICA: 'badge bg-danger',
    ALTA: 'badge bg-warning text-dark',
    NORMAL: 'badge bg-info text-dark'
  };

  const statusBadges = {
    AGENDADO: '<span class="badge bg-primary">Agendado</span>',
    EM_LOTE: '<span class="badge bg-info text-dark">Em Lote</span>',
    CONCLUIDO: '<span class="badge bg-success">Concluído</span>',
    CANCELADO: '<span class="badge bg-secondary">Cancelado</span>'
  };

  tbody.innerHTML = cachedSchedule.map(item => {
    const isChecked = selectedScheduleIds.has(item.id) ? 'checked' : '';
    const canSelect = item.status === 'AGENDADO';
    return `
      <tr>
        <td>
          <input type="checkbox" value="${item.id}" ${isChecked} ${canSelect ? '' : 'disabled'} onchange="window.toggleSelectScheduleItem('${item.id}', this.checked)">
        </td>
        <td class="fw-bold">${item.id}</td>
        <td>
          <div class="fw-semibold text-dark">${item.eventName}</div>
          <span class="fs-xs text-muted">ID: ${item.eventId}</span>
        </td>
        <td>${item.dueDate}</td>
        <td><span class="badge bg-light text-dark border">${item.type}</span></td>
        <td><span class="${priorityColors[item.priority] || 'badge bg-secondary'}">${item.priority}</span></td>
        <td class="fw-bold text-dark">${formatBRL(item.amount)}</td>
        <td>
          <div class="fs-xs text-muted">PIX: ${item.beneficiaryAccount?.pixKey || '—'}</div>
          <div class="fs-xs text-muted">BCO: ${item.beneficiaryAccount?.bankCode || '—'} / AG: ${item.beneficiaryAccount?.agency || '—'}</div>
        </td>
        <td>${statusBadges[item.status] || item.status}</td>
        <td class="text-end">
          ${item.status === 'AGENDADO' ? `
            <button class="btn btn-xs btn-outline-danger" onclick="window.cancelScheduledPayout('${item.id}')" title="Cancelar Agendamento">
              <i class="ph-x"></i>
            </button>
          ` : '—'}
        </td>
      </tr>
    `;
  }).join('');
}

export function toggleSelectScheduleItem(id, checked) {
  if (checked) {
    selectedScheduleIds.add(id);
  } else {
    selectedScheduleIds.delete(id);
  }
}

export function toggleSelectAllSchedule(checked) {
  cachedSchedule.forEach(i => {
    if (i.status === 'AGENDADO') {
      if (checked) selectedScheduleIds.add(i.id);
      else selectedScheduleIds.delete(i.id);
    }
  });
  renderScheduleCalendarTable();
}

export function selectAllScheduleItems(bool) {
  toggleSelectAllSchedule(bool);
  const masterCheck = document.getElementById('ft-sch-check-all');
  if (masterCheck) masterCheck.checked = bool;
}

export function openBatchFromSelection() {
  if (selectedScheduleIds.size === 0) {
    alert('Selecione ao menos um repasse agendado com status AGENDADO para criar o lote.');
    return;
  }
  openCreatePayoutBatchModal();
}

export function renderScheduleBatchesTable() {
  const tbody = document.getElementById('ft-sch-tbody-batches');
  if (!tbody) return;

  if (cachedBatches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">Nenhum lote de repasse registrado.</td></tr>';
    return;
  }

  const batchStatusBadges = {
    RASCUNHO: '<span class="badge bg-secondary">Rascunho</span>',
    EM_VALIDACAO: '<span class="badge bg-warning text-dark">Em Validação</span>',
    AGUARDANDO_APROVACAO: '<span class="badge bg-warning text-dark">Aguardando Aprovação</span>',
    APROVADO: '<span class="badge bg-primary">Aprovado</span>',
    EM_PROCESSAMENTO: '<span class="badge bg-info text-dark">Processando</span>',
    ENVIADO_BANCO: '<span class="badge bg-info text-dark">Enviado Banco</span>',
    PARCIAL: '<span class="badge bg-warning text-dark">Parcial</span>',
    CONCLUIDO: '<span class="badge bg-success">Concluído</span>',
    FALHA: '<span class="badge bg-danger">Falha</span>',
    CANCELADO: '<span class="badge bg-dark">Cancelado</span>'
  };

  tbody.innerHTML = cachedBatches.map(b => {
    return `
      <tr>
        <td class="fw-bold">${b.id}</td>
        <td>
          <div class="fw-semibold text-dark">${b.title}</div>
          <span class="fs-xs text-muted">${b.producerId}</span>
        </td>
        <td>${b.scheduledDate}</td>
        <td><span class="badge bg-light text-dark border">${b.totalItems} itens</span></td>
        <td class="fw-bold text-dark">${formatBRL(b.totalAmount)}</td>
        <td class="fw-bold text-success">${formatBRL(b.approvedAmount || 0)}</td>
        <td>${batchStatusBadges[b.status] || b.status}</td>
        <td><span class="fs-xs text-muted">${b.createdBy || 'Sistema'}</span></td>
        <td><code class="fs-xs">${b.idempotencyKey || '—'}</code></td>
        <td class="text-end">
          <button class="btn btn-xs btn-primary fw-bold" onclick="window.viewPayoutBatchDetails('${b.id}')">
            <i class="ph-eye me-1"></i> Detalhes &amp; Ações
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

export async function renderScheduleAuditTable() {
  const tbody = document.getElementById('ft-sch-tbody-audit');
  if (!tbody) return;

  const res = await payoutScheduleGateway.getScheduleAuditLog();
  const list = res.data || [];

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum registro de auditoria.</td></tr>';
    return;
  }

  tbody.innerHTML = list.slice(0, 30).map(entry => {
    return `
      <tr>
        <td>${formatDate(entry.timestamp)}</td>
        <td>
          <span class="fw-semibold text-dark">${entry.actor?.name || 'Sistema'}</span>
          <span class="badge bg-light text-dark border fs-xs ms-1">${entry.actor?.role || 'AUTO'}</span>
        </td>
        <td><span class="badge bg-secondary">${entry.entityType}</span></td>
        <td><span class="badge bg-light text-primary border">${entry.action}</span></td>
        <td class="fs-xs">${entry.summary}</td>
        <td><code class="fs-xs">${entry.correlationId}</code></td>
      </tr>
    `;
  }).join('');
}

export function openSchedulePayoutModal(preselectedEventId) {
  const select = document.getElementById('sch-input-event');
  if (select) {
    const events = cachedEvents.filter(e => e.producerId === currentProducerId);
    select.innerHTML = events.map(e =>
      `<option value="${e.eventId}" ${preselectedEventId === e.eventId ? 'selected' : ''}>
        ${e.eventName} (#${e.eventId}) — Disp: ${formatBRL(e.balances.availableBalance)}
      </option>`
    ).join('');
  }
  const dateInput = document.getElementById('sch-input-duedate');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  const modalEl = document.getElementById('modal-schedule-payout');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    m.show();
  }
}

export async function handleSchedulePayoutSubmit(e) {
  e.preventDefault();
  const eventId = document.getElementById('sch-input-event')?.value;
  const amount = parseFloat(document.getElementById('sch-input-amount')?.value);
  const dueDate = document.getElementById('sch-input-duedate')?.value;
  const type = document.getElementById('sch-input-type')?.value;
  const priority = document.getElementById('sch-input-priority')?.value;
  const pix = document.getElementById('sch-input-pix')?.value;

  const ev = cachedEvents.find(ev => String(ev.eventId) === String(eventId));

  try {
    const payload = {
      producerId: currentProducerId,
      producerName: ev?.producerName || 'Produtor Oficial',
      eventId,
      eventName: ev?.eventName || `Evento ${eventId}`,
      amount,
      dueDate,
      type,
      priority,
      beneficiaryAccount: { pixKey: pix || '08123456000199', bankCode: '001', agency: '1502-4', account: '99201-0' }
    };

    const res = await payoutScheduleGateway.schedulePayout(payload, { name: 'Operador Financeiro', role: 'OPERADOR' });
    if (res.ok) {
      alert(`Repasse agendado com sucesso! ID: ${res.data.id}`);
      const modalEl = document.getElementById('modal-schedule-payout');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const m = bootstrap.Modal.getInstance(modalEl);
        if (m) m.hide();
      }
      refreshScheduleData();
    }
  } catch (err) {
    alert(`Erro ao agendar repasse: ${err.message}`);
  }
}

export async function cancelScheduledPayout(scheduleId) {
  const reason = prompt('Informe a justificativa do cancelamento:');
  if (reason === null) return;
  try {
    await payoutScheduleGateway.cancelScheduledPayout(scheduleId, reason, { name: 'Operador Financeiro', role: 'OPERADOR' });
    alert(`Agendamento ${scheduleId} cancelado com sucesso.`);
    refreshScheduleData();
  } catch (err) {
    alert(`Erro ao cancelar: ${err.message}`);
  }
}

export function openCreatePayoutBatchModal() {
  const dateInput = document.getElementById('batch-input-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  const titleInput = document.getElementById('batch-input-title');
  if (titleInput) {
    const count = selectedScheduleIds.size;
    titleInput.value = `Lote de Repasse (${count} itens) — ${new Date().toLocaleDateString('pt-BR')}`;
  }

  const modalEl = document.getElementById('modal-create-payout-batch');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    m.show();
  }
}

export async function handleCreatePayoutBatchSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('batch-input-title')?.value;
  const scheduledDate = document.getElementById('batch-input-date')?.value;
  const itemIds = Array.from(selectedScheduleIds);

  if (itemIds.length === 0) {
    alert('Nenhum item selecionado para o lote.');
    return;
  }

  try {
    const createRes = await payoutScheduleGateway.createPayoutBatch({
      producerId: currentProducerId,
      title,
      scheduledDate,
      scheduleItemIds: itemIds
    }, { name: 'Operador Financeiro', role: 'OPERADOR_FINANCEIRO' });

    if (!createRes.ok) throw new Error(createRes.error || 'Erro ao criar lote.');

    const batch = createRes.data;

    const modalEl = document.getElementById('modal-create-payout-batch');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const m = bootstrap.Modal.getInstance(modalEl);
      if (m) m.hide();
    }

    selectedScheduleIds.clear();

    // Validação mandatória no Motor de Regras da Fase 26.17.9.5.6
    await payoutScheduleGateway.validatePayoutBatch(batch.id, { name: 'Motor de Lotes', role: 'SISTEMA' });

    await refreshScheduleData();
    viewPayoutBatchDetails(batch.id);
  } catch (err) {
    alert(`Erro ao criar e validar lote: ${err.message}`);
  }
}

export async function viewPayoutBatchDetails(batchId) {
  const res = await payoutScheduleGateway.getPayoutBatchById(batchId);
  if (!res.ok) {
    alert(res.error || 'Lote não localizado.');
    return;
  }

  const batch = res.data;
  activeBatchDetails = batch;

  const titleEl = document.getElementById('modal-batch-details-title');
  if (titleEl) titleEl.innerHTML = `<i class="ph-stack me-1"></i> Lote ${batch.id} &bull; ${batch.title}`;

  const summaryEl = document.getElementById('batch-details-summary-card');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="row g-2">
        <div class="col-md-3">
          <span class="fs-xs text-muted">Status do Lote:</span>
          <div class="fw-bold fs-sm text-dark">${batch.status}</div>
        </div>
        <div class="col-md-3">
          <span class="fs-xs text-muted">Data Programada:</span>
          <div class="fw-bold fs-sm text-dark">${batch.scheduledDate}</div>
        </div>
        <div class="col-md-3">
          <span class="fs-xs text-muted">Valor Total Solicitado:</span>
          <div class="fw-bold fs-sm text-dark">${formatBRL(batch.totalAmount)}</div>
        </div>
        <div class="col-md-3">
          <span class="fs-xs text-muted">Valor Aprovado p/ Pagamento:</span>
          <div class="fw-bold fs-sm text-success">${formatBRL(batch.approvedAmount || 0)}</div>
        </div>
      </div>
      <div class="row g-2 mt-2 pt-2 border-top">
        <div class="col-md-4">
          <span class="fs-xs text-muted">Criado Por (Maker):</span>
          <div class="fw-semibold fs-xs text-dark">${batch.createdBy || 'Operador Financeiro'}</div>
        </div>
        <div class="col-md-4">
          <span class="fs-xs text-muted">Aprovado Por (Checker):</span>
          <div class="fw-semibold fs-xs text-primary">${batch.approvedBy || 'Pendente de Homologação'}</div>
        </div>
        <div class="col-md-4">
          <span class="fs-xs text-muted">Idempotency Key:</span>
          <div><code class="fs-xs">${batch.idempotencyKey || '—'}</code></div>
        </div>
      </div>
    `;
  }

  // Tabela dos Itens
  const tbody = document.getElementById('batch-details-items-tbody');
  if (tbody) {
    const decisionBadges = {
      ALLOW: '<span class="badge bg-success">ALLOW</span>',
      ALLOW_WITH_APPROVAL: '<span class="badge bg-warning text-dark">ALLOW_WITH_APPROVAL</span>',
      ALLOW_PARTIAL: '<span class="badge bg-info text-dark">ALLOW_PARTIAL</span>',
      HOLD: '<span class="badge bg-secondary">HOLD</span>',
      BLOCK: '<span class="badge bg-danger">BLOCK</span>'
    };

    tbody.innerHTML = (batch.items || []).map(item => {
      const reasons = (item.ruleReasons || []).join('; ') || 'Sem restrições';
      const isRetryable = item.status === 'FALHA_TECNICA' && item.isRetryable;
      return `
        <tr>
          <td class="fw-bold">${item.id}</td>
          <td>
            <div class="fw-semibold text-dark">${item.eventName}</div>
            <span class="fs-xs text-muted">#${item.eventId}</span>
          </td>
          <td class="fw-bold text-dark">${formatBRL(item.amount)}</td>
          <td>${decisionBadges[item.ruleDecision] || '<span class="badge bg-light text-dark border">Pendente</span>'}</td>
          <td class="fw-bold text-success">${formatBRL(item.authorizedAmount || 0)}</td>
          <td><span class="badge bg-light text-dark border">${item.status}</span></td>
          <td class="fs-xs text-muted" style="max-width: 250px;">${reasons}</td>
          <td class="text-end">
            ${isRetryable ? `
              <button class="btn btn-xs btn-outline-danger fw-bold" onclick="window.retryPayoutItem('${item.id}')">
                <i class="ph-arrow-counter-clockwise me-1"></i> Retry Seguro
              </button>
            ` : '—'}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Botões de Ação
  const btnContainer = document.getElementById('batch-actions-buttons-container');
  if (btnContainer) {
    let btns = '';
    if (['RASCUNHO', 'FALHA'].includes(batch.status)) {
      btns += `
        <button class="btn btn-sm btn-outline-primary fw-bold" onclick="window.validatePayoutBatch('${batch.id}')">
          <i class="ph-cpu me-1"></i> Reavaliar Motor de Regras
        </button>
      `;
    }
    if (['AGUARDANDO_APROVACAO', 'PARCIAL', 'EM_VALIDACAO'].includes(batch.status)) {
      btns += `
        <button class="btn btn-sm btn-warning text-dark fw-bold" onclick="window.approvePayoutBatch('${batch.id}')">
          <i class="ph-check-square me-1"></i> Homologar Lote (Maker/Checker)
        </button>
      `;
    }
    if (batch.status === 'APROVADO') {
      btns += `
        <button class="btn btn-sm btn-success fw-bold" onclick="window.processPayoutBatch('${batch.id}')">
          <i class="ph-paper-plane-tilt me-1"></i> Processar Lote Bancário
        </button>
      `;
    }
    btnContainer.innerHTML = btns || '<span class="fs-xs text-muted">Lote em estado final ou em processamento bancário.</span>';
  }

  const modalEl = document.getElementById('modal-payout-batch-details');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    m.show();
  }
}

export async function validatePayoutBatch(batchId) {
  try {
    await payoutScheduleGateway.validatePayoutBatch(batchId, { name: 'Operador Financeiro', role: 'OPERADOR' });
    alert(`Lote ${batchId} revalidado com sucesso pelo Motor de Regras!`);
    await refreshScheduleData();
    viewPayoutBatchDetails(batchId);
  } catch (err) {
    alert(`Erro na validação: ${err.message}`);
  }
}

export async function approvePayoutBatch(batchId) {
  try {
    const checkerActor = { name: 'Controladoria SafeSaff', role: 'CHECKER_DIRETORIA' };
    await payoutScheduleGateway.approvePayoutBatch(batchId, checkerActor);
    alert(`Lote ${batchId} homologado com sucesso! Saldo liberado para envio bancário.`);
    await refreshScheduleData();
    viewPayoutBatchDetails(batchId);
  } catch (err) {
    alert(`Erro ao aprovar lote: ${err.message}`);
  }
}

export async function processPayoutBatch(batchId) {
  try {
    const res = await payoutScheduleGateway.processPayoutBatch(batchId, {
      actor: { name: 'Operador de Repasses', role: 'OPERADOR' }
    });
    if (res.isIdempotentReplay) {
      alert('[IDEMPOTÊNCIA] O lote já havia sido submetido! Retornando resposta gravada com segurança.');
    } else {
      alert(`Lote ${batchId} transmitido ao provedor bancário com sucesso!`);
    }
    await refreshScheduleData();
    viewPayoutBatchDetails(batchId);
  } catch (err) {
    alert(`Erro no processamento bancário: ${err.message}`);
  }
}

export async function submitSimulatedBankWebhook() {
  const txid = document.getElementById('ft-sch-sim-txid')?.value?.trim();
  const status = document.getElementById('ft-sch-sim-status')?.value;
  const error = document.getElementById('ft-sch-sim-error')?.value;

  if (!txid) {
    alert('Informe o ID da Transação Bancária ou o ID do Item (Ex: BK-TRX-882910 ou PIT-1001).');
    return;
  }

  try {
    const res = await payoutScheduleGateway.processBankReturnWebhook({
      bankTransactionId: txid,
      payoutItemId: txid,
      status,
      errorCode: error || undefined,
      errorMessage: error ? `Falha simulada: ${error}` : undefined
    }, { name: 'Provedor Bancário Webhook', role: 'BANCO' });

    alert(`Webhook bancário processado com sucesso! Item: ${res.data.id} -> Status: ${res.data.status}`);
    await refreshScheduleData();
    if (activeBatchDetails) {
      viewPayoutBatchDetails(activeBatchDetails.id);
    }
  } catch (err) {
    alert(`Erro ao processar retorno bancário: ${err.message}`);
  }
}

export async function retryPayoutItem(itemId) {
  try {
    await payoutScheduleGateway.retryPayoutItem(itemId, { name: 'Operador de Repasse', role: 'OPERADOR' });
    alert(`Reprocessamento seguro acionado para o item ${itemId}! Nova transação bancária gerada.`);
    await refreshScheduleData();
    if (activeBatchDetails) {
      viewPayoutBatchDetails(activeBatchDetails.id);
    }
  } catch (err) {
    alert(`Reprocessamento negado: ${err.message}`);
  }
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
  // Fase 26.17.9.5.5
  window.refreshForecastData = refreshForecastData;
  window.switchForecastHorizon = switchForecastHorizon;
  window.switchForecastEvent = switchForecastEvent;
  window.renderForecastCharts = renderForecastCharts;
  window.openCoverageSimulator = openCoverageSimulator;
  window.updateCoverageSimulation = updateCoverageSimulation;
  window.applySimulatedTransferToModal = applySimulatedTransferToModal;
  // Fase 26.17.9.5.6 — Motor de Regras
  window.switchRulesSubTab = switchRulesSubTab;
  window.refreshRulesData = refreshRulesData;
  window.runRulesSimulation = runRulesSimulation;
  window.openCreateExceptionModal = openCreateExceptionModal;
  window.handleCreateException = handleCreateException;
  window.handleRevokeException = handleRevokeException;
  window.updateRulesSimEvents = updateRulesSimEvents;
}

