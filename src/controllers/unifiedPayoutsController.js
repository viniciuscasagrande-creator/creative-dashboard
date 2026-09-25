/**
 * Controlador Unificado de Repasses — Disk Ingressos Pro Dashboard
 * Unifica Opção A (Lotes e Agenda Financeira) e Opção B (Central de Alçadas e Aprovações Individuais)
 * para o Financeiro da Disk Ingressos, enquanto provê ao Produtor uma visão restrita
 * estritamente aos resultados (Concluído/Pago, Aprovado, Em Análise), valores repassados e comprovantes.
 */

import { payoutScheduleGateway } from '../services/payoutScheduleGateway.js';
import { payoutScheduleService } from '../services/payoutScheduleService.js';
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

// Estado do Módulo Unificado
let currentRoleView = 'PRODUCER'; // 'PRODUCER' | 'FINANCEIRO'
let currentFinSubTab = 'alcadas'; // 'alcadas' | 'lotes' | 'auditoria'
let currentProducerId = 'prod-1';
let activePendingPayoutId = null;

export async function initUnifiedPayoutsModule() {
  bindRoleSwitcherEvents();
  await refreshUnifiedPayoutsDashboard();
}

/**
 * Alterna entre a Visão do Produtor (apenas resultados/comprovantes)
 * e a Visão do Financeiro Disk Ingressos (Opção A + Opção B de aprovação)
 */
export async function switchPayoutRoleView(role) {
  currentRoleView = role;

  const btnProd = document.getElementById('btn-payout-role-producer');
  const btnFin = document.getElementById('btn-payout-role-financeiro');
  const containerProd = document.getElementById('payout-producer-container');
  const containerFin = document.getElementById('payout-financeiro-container');
  const subtitleEl = document.getElementById('payout-view-subtitle');

  if (role === 'PRODUCER') {
    if (btnProd) {
      btnProd.className = 'btn btn-sm btn-primary fw-bold';
    }
    if (btnFin) {
      btnFin.className = 'btn btn-sm btn-outline-primary fw-bold';
    }
    if (containerProd) containerProd.style.display = 'block';
    if (containerFin) containerFin.style.display = 'none';
    if (subtitleEl) subtitleEl.textContent = 'Portal do Produtor • Visualização de Repasses e Liquidações';
  } else {
    if (btnProd) {
      btnProd.className = 'btn btn-sm btn-outline-primary fw-bold';
    }
    if (btnFin) {
      btnFin.className = 'btn btn-sm btn-primary fw-bold';
    }
    if (containerProd) containerProd.style.display = 'none';
    if (containerFin) containerFin.style.display = 'block';
    if (subtitleEl) subtitleEl.textContent = 'Central Unificada de Repasses • Disk Ingressos (Alçadas & Lotes Bancários)';
  }

  await refreshUnifiedPayoutsDashboard();
}

/**
 * Alterna sub-abas internas da visão do Financeiro
 */
export function switchFinanceiroSubTab(tab) {
  currentFinSubTab = tab;
  ['alcadas', 'lotes', 'auditoria'].forEach(t => {
    const btn = document.getElementById(`btn-fin-subtab-${t}`);
    const pane = document.getElementById(`fin-subpane-${t}`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (pane) pane.style.display = t === tab ? 'block' : 'none';
  });
}

/**
 * Atualiza e renderiza todos os dados dos dois modos
 */
export async function refreshUnifiedPayoutsDashboard() {
  try {
    // 1. Carrega dados formatados para a Visão do Produtor
    const prodRes = await payoutScheduleGateway.getProducerPayoutsView(currentProducerId);
    if (prodRes && prodRes.ok) {
      renderProducerView(prodRes.data, prodRes.summary);
    }

    // 2. Carrega dados para a Visão do Financeiro (Opção A + Opção B)
    const schRes = await payoutScheduleGateway.getSchedule({ producerId: currentProducerId });
    const batchesRes = await payoutScheduleGateway.getPayoutBatches({ producerId: currentProducerId });
    const auditRes = await payoutScheduleGateway.getScheduleAuditLog();

    const scheduleList = schRes?.data || [];
    const batchList = batchesRes?.data || [];
    const auditList = auditRes?.data || [];

    renderFinanceiroView(scheduleList, batchList, auditList);
  } catch (err) {
    console.error('Erro ao atualizar dashboard unificado de repasses:', err);
  }
}

/**
 * Renderiza o painel do Produtor
 * (Apenas resultado de concluído, aprovado, em análise e valores repassados)
 */
function renderProducerView(payouts, summary) {
  // KPIs do Produtor
  const elTotalRepassado = document.getElementById('prod-kpi-total-repassado');
  const elAprovados = document.getElementById('prod-kpi-aprovados');
  const elEmAnalise = document.getElementById('prod-kpi-em-analise');
  const elTotalCount = document.getElementById('prod-kpi-count-concluido');

  if (elTotalRepassado) elTotalRepassado.textContent = formatBRL(summary?.totalConcluido || 0);
  if (elAprovados) elAprovados.textContent = formatBRL(summary?.totalAprovado || 0);
  if (elEmAnalise) elEmAnalise.textContent = formatBRL(summary?.totalEmAnalise || 0);
  if (elTotalCount) elTotalCount.textContent = `${summary?.countConcluido || 0} repasses liquidados`;

  // Tabela de Extrato do Produtor
  const tbody = document.getElementById('table-producer-payouts-body');
  if (!tbody) return;

  if (!payouts || payouts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Nenhum registro de repasse para este produtor.</td></tr>';
    return;
  }

  tbody.innerHTML = payouts.map(item => {
    const receiptBtn = item.canViewReceipt
      ? `<button class="btn btn-sm btn-outline-primary fw-bold d-inline-flex align-items-center gap-1 py-1 px-2" style="font-size: 11px;" onclick="window.openPayoutReceiptModal('${item.id}')">
           <i class="ph-file-text"></i> Ver Comprovante
         </button>`
      : `<span class="badge bg-light text-muted border fs-xs">Aguardando Liquidação</span>`;

    return `
      <tr>
        <td class="fw-bold text-dark font-monospace">${item.id}</td>
        <td>${item.requestDate}</td>
        <td>
          <div class="fw-semibold text-dark fs-sm">${item.eventName}</div>
          <span class="fs-xs text-muted">ID Evento: #${item.eventId}</span>
        </td>
        <td class="text-muted">${formatBRL(item.grossAmount)}</td>
        <td class="fw-bold text-success fs-sm">${formatBRL(item.netAmount)}</td>
        <td>
          <div class="fs-xs fw-semibold text-dark">${item.account}</div>
          <span class="fs-xs text-muted">${item.method}</span>
        </td>
        <td>
          <span class="badge ${item.badgeClass} fs-xs px-2 py-1">${item.statusLabel}</span>
        </td>
        <td class="fs-xs text-muted">${item.settledDate}</td>
        <td class="text-end">${receiptBtn}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Renderiza o painel do Financeiro da Disk Ingressos (Opção A + Opção B)
 */
function renderFinanceiroView(scheduleList, batchList, auditList) {
  // KPIs do Financeiro
  const pendingRequests = scheduleList.filter(i => ['AGENDADO', 'PENDENTE', 'EM_ANALISE', 'SOLICITADO'].includes(i.status));
  const pendingSum = pendingRequests.reduce((acc, i) => acc + (i.amount || 0), 0);

  const approvedRequests = scheduleList.filter(i => ['APROVADO', 'EM_LOTE', 'ENVIADO_BANCO'].includes(i.status));
  const approvedSum = approvedRequests.reduce((acc, i) => acc + (i.amount || 0), 0);

  const settledRequests = scheduleList.filter(i => i.status === 'CONCLUIDO');
  const settledSum = settledRequests.reduce((acc, i) => acc + (i.amount || 0), 0);

  const pendingBatches = batchList.filter(b => ['AGUARDANDO_APROVACAO', 'EM_VALIDACAO', 'RASCUNHO'].includes(b.status)).length;

  const elPendingCnt = document.getElementById('fin-kpi-pending-count');
  const elPendingAmt = document.getElementById('fin-kpi-pending-amount');
  const elApprovedAmt = document.getElementById('fin-kpi-approved-amount');
  const elApprovedCnt = document.getElementById('fin-kpi-approved-count');
  const elBatchesCnt = document.getElementById('fin-kpi-batches-count');
  const elSettledAmt = document.getElementById('fin-kpi-settled-total');

  if (elPendingCnt) elPendingCnt.textContent = pendingRequests.length;
  if (elPendingAmt) elPendingAmt.textContent = formatBRL(pendingSum);
  if (elApprovedAmt) elApprovedAmt.textContent = formatBRL(approvedSum);
  if (elApprovedCnt) elApprovedCnt.textContent = `${approvedRequests.length} prontos p/ envio`;
  if (elBatchesCnt) elBatchesCnt.textContent = pendingBatches;
  if (elSettledAmt) elSettledAmt.textContent = formatBRL(settledSum);

  // 1. Tabela de Alçadas Individuais (Opção B)
  renderFinanceiroAlcadasTable(scheduleList);

  // 2. Tabela de Lotes de Repasse (Opção A)
  renderFinanceiroLotesTable(batchList);

  // 3. Tabela de Auditoria
  renderFinanceiroAuditTable(auditList);
}

/**
 * Renderiza Fila de Alçadas Individuais (Opção B)
 */
function renderFinanceiroAlcadasTable(scheduleList) {
  const tbody = document.getElementById('table-financeiro-alcadas-body');
  if (!tbody) return;

  if (scheduleList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">Nenhuma solicitação de repasse pendente.</td></tr>';
    return;
  }

  tbody.innerHTML = scheduleList.map(item => {
    // Alçada calculada
    let alcadaLabel = 'Automática (&le; R$ 10k)';
    let alcadaBadge = 'bg-success-subtle text-success border border-success-subtle';
    if (item.amount > 50000) {
      alcadaLabel = 'Diretoria Nível 2 (&gt; R$ 50k)';
      alcadaBadge = 'bg-danger-subtle text-danger border border-danger-subtle';
    } else if (item.amount > 10000) {
      alcadaLabel = 'Controladoria Nível 1 (10k-50k)';
      alcadaBadge = 'bg-warning-subtle text-dark border border-warning-subtle';
    }

    const isPending = ['AGENDADO', 'PENDENTE', 'EM_ANALISE', 'SOLICITADO'].includes(item.status);
    const isApproved = ['APROVADO', 'EM_LOTE'].includes(item.status);
    const isConcluido = item.status === 'CONCLUIDO';
    const isRejeitado = item.status === 'REJEITADO' || item.status === 'CANCELADO';

    let statusBadge = '<span class="badge bg-warning text-dark">Em Análise</span>';
    if (isConcluido) statusBadge = '<span class="badge bg-success">Concluído / Pago</span>';
    else if (isApproved) statusBadge = '<span class="badge bg-primary">Aprovado</span>';
    else if (isRejeitado) statusBadge = '<span class="badge bg-danger">Rejeitado</span>';

    // Ações do Financeiro
    let actionsHtml = '';
    if (isPending) {
      actionsHtml = `
        <div class="d-flex gap-1 justify-content-end">
          <button class="btn btn-xs btn-success fw-bold d-flex align-items-center gap-1" title="Aprovar Alçada" onclick="window.openApproveSinglePayoutModal('${item.id}')">
            <i class="ph-check"></i> Aprovar Alçada
          </button>
          <button class="btn btn-xs btn-info text-white fw-bold d-flex align-items-center gap-1" title="Liquidar Imediato (PIX)" onclick="window.settleSinglePayoutInstant('${item.id}')">
            <i class="ph-lightning"></i> PIX Direto
          </button>
          <button class="btn btn-xs btn-outline-danger fw-bold" title="Rejeitar" onclick="window.openRejectSinglePayoutModal('${item.id}')">
            <i class="ph-x"></i>
          </button>
        </div>
      `;
    } else if (isApproved) {
      actionsHtml = `
        <div class="d-flex gap-1 justify-content-end">
          <button class="btn btn-xs btn-success fw-bold d-flex align-items-center gap-1" title="Liquidar Agora (PIX)" onclick="window.settleSinglePayoutInstant('${item.id}')">
            <i class="ph-paper-plane-tilt"></i> Liquidar PIX
          </button>
          <button class="btn btn-xs btn-outline-secondary fw-bold" onclick="window.openPayoutReceiptModal('${item.id}')">
            <i class="ph-file-text"></i> Recibo
          </button>
        </div>
      `;
    } else {
      actionsHtml = `
        <div class="d-flex justify-content-end">
          <button class="btn btn-xs btn-outline-primary fw-bold d-flex align-items-center gap-1" onclick="window.openPayoutReceiptModal('${item.id}')">
            <i class="ph-receipt"></i> Comprovante
          </button>
        </div>
      `;
    }

    const pixKey = item.beneficiaryAccount?.pixKey || '08123456000199';

    return `
      <tr>
        <td class="fw-bold text-dark font-monospace">${item.id}</td>
        <td>
          <div class="fw-semibold text-dark fs-sm">${item.producerName}</div>
          <span class="fs-xs text-muted">${item.eventName} (#${item.eventId})</span>
        </td>
        <td>${item.dueDate || formatDate(item.createdAt)}</td>
        <td class="fw-bold text-dark fs-sm">${formatBRL(item.amount)}</td>
        <td><span class="badge ${alcadaBadge} fs-xs">${alcadaLabel}</span></td>
        <td><span class="badge bg-light text-dark border fs-xs">PIX (${pixKey})</span></td>
        <td>${statusBadge}</td>
        <td class="fs-xs text-muted">${item.approvedBy || '—'}</td>
        <td class="text-end">${actionsHtml}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Renderiza Lotes de Repasse (Opção A)
 */
function renderFinanceiroLotesTable(batchList) {
  const tbody = document.getElementById('table-financeiro-lotes-body');
  if (!tbody) return;

  if (batchList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Nenhum lote bancário gerado.</td></tr>';
    return;
  }

  const batchStatusBadges = {
    RASCUNHO: '<span class="badge bg-secondary">Rascunho</span>',
    EM_VALIDACAO: '<span class="badge bg-warning text-dark">Em Validação</span>',
    AGUARDANDO_APROVACAO: '<span class="badge bg-warning text-dark">Aguardando Homologação</span>',
    APROVADO: '<span class="badge bg-primary">Aprovado (Maker/Checker)</span>',
    EM_PROCESSAMENTO: '<span class="badge bg-info text-dark">Transmitindo</span>',
    ENVIADO_BANCO: '<span class="badge bg-info text-dark">Enviado Banco</span>',
    CONCLUIDO: '<span class="badge bg-success">Liquidado / Concluído</span>',
    FALHA: '<span class="badge bg-danger">Falha</span>',
    CANCELADO: '<span class="badge bg-dark">Cancelado</span>'
  };

  tbody.innerHTML = batchList.map(b => {
    return `
      <tr>
        <td class="fw-bold font-monospace text-dark">${b.id}</td>
        <td>
          <div class="fw-semibold text-dark fs-sm">${b.title}</div>
          <span class="fs-xs text-muted">${b.producerId} &bull; ${b.totalItems} repasses agrupados</span>
        </td>
        <td>${b.scheduledDate}</td>
        <td class="fw-bold text-dark">${formatBRL(b.totalAmount)}</td>
        <td class="fw-bold text-success">${formatBRL(b.approvedAmount || 0)}</td>
        <td>${batchStatusBadges[b.status] || b.status}</td>
        <td class="fs-xs text-muted">${b.approvedBy || 'Pendente'}</td>
        <td class="text-end">
          <button class="btn btn-xs btn-primary fw-bold d-inline-flex align-items-center gap-1" onclick="window.viewPayoutBatchDetails('${b.id}')">
            <i class="ph-eye"></i> Detalhes & Ações Lote
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Renderiza Trilha de Auditoria
 */
function renderFinanceiroAuditTable(auditList) {
  const tbody = document.getElementById('table-financeiro-audit-body');
  if (!tbody) return;

  if (auditList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum evento registrado na auditoria.</td></tr>';
    return;
  }

  tbody.innerHTML = auditList.slice(0, 25).map(e => {
    return `
      <tr>
        <td class="fs-xs">${new Date(e.timestamp).toLocaleString('pt-BR')}</td>
        <td>
          <span class="fw-semibold text-dark fs-xs">${e.actor?.name || 'Sistema'}</span>
          <span class="badge bg-light text-dark border fs-xxs ms-1">${e.actor?.role || 'AUTO'}</span>
        </td>
        <td><span class="badge bg-secondary fs-xs">${e.entityType}</span></td>
        <td><span class="badge bg-light text-primary border fs-xs">${e.action}</span></td>
        <td class="fs-xs text-muted">${e.summary}</td>
        <td><code class="fs-xxs">${e.correlationId}</code></td>
      </tr>
    `;
  }).join('');
}

// =========================================================================
// AÇÕES DO FINANCEIRO (OPÇÃO B: APROVAÇÃO INDIVIDUAL & PIX)
// =========================================================================

export function openApproveSinglePayoutModal(scheduleId) {
  activePendingPayoutId = scheduleId;
  const modalEl = document.getElementById('modal-approve-single-payout');
  const detailsEl = document.getElementById('approve-single-payout-details');

  const item = payoutScheduleService.getScheduleAuditLog; // find item
  payoutScheduleGateway.getSchedule().then(res => {
    const list = res.data || [];
    const target = list.find(i => i.id === scheduleId);
    if (target && detailsEl) {
      detailsEl.innerHTML = `
        <div class="p-3 bg-light rounded border mb-3">
          <div class="row g-2">
            <div class="col-6">
              <span class="fs-xs text-muted">Protocolo:</span>
              <div class="fw-bold text-dark font-monospace">${target.id}</div>
            </div>
            <div class="col-6">
              <span class="fs-xs text-muted">Valor a Repassar:</span>
              <div class="fw-bold text-success fs-5">${formatBRL(target.amount)}</div>
            </div>
            <div class="col-12 mt-2">
              <span class="fs-xs text-muted">Produtor & Evento:</span>
              <div class="fw-semibold text-dark">${target.producerName} — ${target.eventName}</div>
            </div>
            <div class="col-12 mt-2">
              <span class="fs-xs text-muted">Destino:</span>
              <div class="fs-xs text-dark font-monospace">PIX: ${target.beneficiaryAccount?.pixKey || '08123456000199'}</div>
            </div>
          </div>
        </div>
      `;
    }
  });

  if (modalEl && typeof bootstrap !== 'undefined') {
    const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    m.show();
  }
}

export async function confirmApproveSinglePayout() {
  if (!activePendingPayoutId) return;

  const notes = document.getElementById('approve-single-notes')?.value || 'Aprovado formalmente pela Controladoria DiskIngressos.';
  const approverName = document.getElementById('approve-single-checker-name')?.value || 'Controladoria SafeSaff';

  try {
    const res = await payoutScheduleGateway.approveIndividualPayout(activePendingPayoutId, {
      name: approverName,
      role: 'CONTROLADORIA'
    }, notes);

    if (res.ok) {
      alert(`[Sucesso] Repasse ${activePendingPayoutId} APROVADO com sucesso por ${approverName}!\nO status já foi atualizado para o Produtor.`);
      const modalEl = document.getElementById('modal-approve-single-payout');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const m = bootstrap.Modal.getInstance(modalEl);
        if (m) m.hide();
      }
      await refreshUnifiedPayoutsDashboard();
    }
  } catch (err) {
    alert(`Erro ao aprovar repasse: ${err.message}`);
  }
}

export async function settleSinglePayoutInstant(scheduleId) {
  if (!confirm(`Deseja efetuar a liquidação imediata via PIX do repasse ${scheduleId}? O saldo será debitado e o comprovante gerado instantaneamente.`)) {
    return;
  }

  try {
    const res = await payoutScheduleGateway.settleIndividualPayout(scheduleId, {
      name: 'Tesouraria DiskIngressos',
      role: 'TESOURARIA'
    }, { method: 'PIX Instantâneo' });

    if (res.ok) {
      alert(`[Repasse Liquidado com Sucesso!]\n• Protocolo: ${scheduleId}\n• Autenticação: ${res.data.authCode}\n• Comprovante emitido e disponível para o Produtor.`);
      await refreshUnifiedPayoutsDashboard();
      openPayoutReceiptModal(scheduleId);
    }
  } catch (err) {
    alert(`Erro ao liquidar repasse: ${err.message}`);
  }
}

export function openRejectSinglePayoutModal(scheduleId) {
  activePendingPayoutId = scheduleId;
  const modalEl = document.getElementById('modal-reject-single-payout');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    m.show();
  }
}

export async function confirmRejectSinglePayout() {
  if (!activePendingPayoutId) return;

  const reason = document.getElementById('reject-single-reason')?.value;
  if (!reason) {
    alert('Informe o motivo da rejeição para notificar o produtor.');
    return;
  }

  try {
    const res = await payoutScheduleGateway.rejectIndividualPayout(activePendingPayoutId, {
      name: 'Auditoria DiskIngressos',
      role: 'AUDITORIA'
    }, reason);

    if (res.ok) {
      alert(`Solicitação ${activePendingPayoutId} rejeitada. O produtor foi informado e o saldo descomprometido.`);
      const modalEl = document.getElementById('modal-reject-single-payout');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const m = bootstrap.Modal.getInstance(modalEl);
        if (m) m.hide();
      }
      await refreshUnifiedPayoutsDashboard();
    }
  } catch (err) {
    alert(`Erro ao rejeitar repasse: ${err.message}`);
  }
}

// =========================================================================
// COMPROVANTE OFICIAL DE REPASSE (PRODUTOR & FINANCEIRO)
// =========================================================================

export async function openPayoutReceiptModal(payoutId) {
  try {
    const res = await payoutScheduleGateway.getPayoutReceipt(payoutId);
    if (!res.ok) {
      alert('Comprovante não disponível.');
      return;
    }

    const d = res;
    const bodyEl = document.getElementById('modal-payout-receipt-content');
    if (bodyEl) {
      bodyEl.innerHTML = `
        <div class="receipt-printable p-4 bg-white text-dark rounded border" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <!-- Top Header com Logo DiskIngressos -->
          <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
            <div>
              <div class="d-flex align-items-center gap-2">
                <div class="p-2 rounded bg-success text-white fw-bold d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                  <i class="ph-check-circle fs-4"></i>
                </div>
                <div>
                  <h5 class="fw-bold mb-0 text-dark">DiskIngressos</h5>
                  <span class="fs-xs text-muted">Plataforma Oficial de Vendas & Liquidação</span>
                </div>
              </div>
            </div>
            <div class="text-end">
              <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-bold fs-xs">
                ${d.status}
              </span>
              <div class="fs-xs text-muted mt-1 font-monospace">${d.receiptNumber}</div>
            </div>
          </div>

          <!-- Titulo Comprovante -->
          <div class="text-center py-2 mb-3 bg-light rounded border">
            <h6 class="fw-bold text-uppercase mb-0 text-dark fs-sm" style="letter-spacing: 0.5px;">Comprovante de Repasse Bancário</h6>
            <span class="fs-xs text-muted">Autenticação Digital: <code class="fw-bold text-primary">${d.authCode}</code></span>
          </div>

          <!-- Dados do Pagamento -->
          <div class="row g-3 mb-3">
            <div class="col-6">
              <div class="card p-2.5 bg-light border shadow-none mb-0">
                <span class="fs-xs text-muted">Favorecido (Produtor):</span>
                <strong class="fs-sm text-dark d-block mt-0.5">${d.producerName}</strong>
                <span class="fs-xs text-muted font-monospace">CNPJ: ${d.producerTaxId}</span>
              </div>
            </div>
            <div class="col-6">
              <div class="card p-2.5 bg-light border shadow-none mb-0">
                <span class="fs-xs text-muted">Emissor / Fonte Pagadora:</span>
                <strong class="fs-sm text-dark d-block mt-0.5">${d.issuerName}</strong>
                <span class="fs-xs text-muted font-monospace">CNPJ: ${d.issuerCnpj}</span>
              </div>
            </div>
          </div>

          <div class="p-3 border rounded bg-white mb-3">
            <div class="row g-2">
              <div class="col-7">
                <span class="fs-xs text-muted">Evento Vinculado:</span>
                <div class="fw-semibold fs-sm text-dark">${d.eventName}</div>
              </div>
              <div class="col-5">
                <span class="fs-xs text-muted">Data/Hora da Liquidação:</span>
                <div class="fw-semibold fs-sm text-dark">${d.settledAt}</div>
              </div>
              <div class="col-12 mt-2 pt-2 border-top">
                <span class="fs-xs text-muted">Conta de Crédito / Destino:</span>
                <div class="fw-bold fs-sm text-dark font-monospace">${d.bankAccount}</div>
              </div>
            </div>
          </div>

          <!-- Discriminação de Valores -->
          <div class="card p-3 border mb-3" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-color: #86efac !important;">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fs-xs text-muted">Valor Bruto Solicitado:</span>
              <span class="fw-semibold text-dark fs-sm">${formatBRL(d.grossAmount)}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-success-subtle">
              <span class="fs-xs text-muted">Taxa de Repasse / Custos:</span>
              <span class="fw-semibold text-muted fs-xs">${formatBRL(d.feeAmount)} (Isento)</span>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong class="text-dark fs-sm">VALOR LÍQUIDO REPASSADO:</strong>
                <div class="fs-xs text-muted">Creditado na conta do produtor</div>
              </div>
              <div class="fs-3 fw-bold text-success font-monospace">${formatBRL(d.netAmount)}</div>
            </div>
          </div>

          <!-- Rodapé de Autenticação -->
          <div class="pt-2 text-center text-muted fs-xxs border-top">
            Documento emitido eletronicamente pela Plataforma DiskIngressos. Válido como comprovante de quitação financeira.<br>
            Autenticação Bancária: <code>${d.authCode}</code> &bull; Emissão: ${d.issueDate}
          </div>
        </div>
      `;
    }

    const modalEl = document.getElementById('modal-payout-receipt-view');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      m.show();
    }
  } catch (err) {
    console.error('Erro ao abrir comprovante:', err);
  }
}

export function printPayoutReceipt() {
  window.print();
}

/**
 * Função chamada quando o produtor conclui o envio no modal de confirmação (Step 4)
 */
export async function handleProducerRepasseSubmitConfirmed(amount, bankName, method) {
  try {
    const res = await payoutScheduleGateway.schedulePayout({
      producerId: currentProducerId,
      producerName: 'DiskIngressos Eventos Ltda',
      eventId: '3368',
      eventName: 'Experiencia Música e Natureza - Julho',
      amount: Number(amount),
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'ALTA',
      type: 'SOLICITACAO_PRODUTOR',
      beneficiaryAccount: {
        bankName: bankName || 'Banco Inter',
        pixKey: method === 'PIX' ? 'financeiro@empresa.com.br' : undefined,
        method: method || 'PIX'
      }
    }, { name: 'Produtor Conectado', role: 'PRODUTOR' });

    if (res.ok) {
      await refreshUnifiedPayoutsDashboard();
    }
  } catch (err) {
    console.error('Erro ao registrar solicitação de repasse:', err);
  }
}

function bindRoleSwitcherEvents() {
  // Global hooks
  window.switchPayoutRoleView = switchPayoutRoleView;
  window.switchFinanceiroSubTab = switchFinanceiroSubTab;
  window.refreshUnifiedPayoutsDashboard = refreshUnifiedPayoutsDashboard;
  window.openApproveSinglePayoutModal = openApproveSinglePayoutModal;
  window.confirmApproveSinglePayout = confirmApproveSinglePayout;
  window.settleSinglePayoutInstant = settleSinglePayoutInstant;
  window.openRejectSinglePayoutModal = openRejectSinglePayoutModal;
  window.confirmRejectSinglePayout = confirmRejectSinglePayout;
  window.openPayoutReceiptModal = openPayoutReceiptModal;
  window.printPayoutReceipt = printPayoutReceipt;
  window.handleProducerRepasseSubmitConfirmed = handleProducerRepasseSubmitConfirmed;
}
