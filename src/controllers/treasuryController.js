/**
 * Fase 26.17.9.4.6 — Controlador da Tesouraria Operacional
 * Gerencia Dashboard, Contas Bancárias Reais, Pagamentos PIX, Remessas CNAB 240, Retorno e Auditoria.
 */

import { treasuryGateway } from '../services/treasuryGateway.js';

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

let currentTreasuryTab = 'dashboard';
let currentProducerId = 'prod-1';
let cachedDashboardData = null;
let cachedAccounts = [];
let cachedPayments = [];
let cachedBatches = [];

export async function initTreasuryView() {
  await refreshTreasuryData();
}

export async function refreshTreasuryData() {
  try {
    const dashRes = await treasuryGateway.getTreasuryDashboard(currentProducerId);
    if (dashRes.ok) {
      cachedDashboardData = dashRes.data;
      cachedAccounts = dashRes.data.accounts || [];
      cachedPayments = dashRes.data.recentPayments || [];
      cachedBatches = dashRes.data.batches || [];

      // 1. Atualizar KPIs do Dashboard
      renderTreasuryKpis(dashRes.data.kpis);

      // 2. Renderizar visualização da aba ativa
      renderCurrentTab();
    }
  } catch (err) {
    console.error('Erro ao recarregar dados da tesouraria:', err);
  }
}

export function switchTreasuryTab(tab) {
  currentTreasuryTab = tab;
  ['dashboard', 'accounts', 'pix', 'batches', 'reconciliation', 'audit'].forEach(t => {
    const link = document.getElementById(`trz-tab-link-${t}`);
    const pane = document.getElementById(`trz-pane-${t}`);
    if (link) link.classList.toggle('active', t === tab);
    if (pane) pane.style.display = t === tab ? 'block' : 'none';
  });
  renderCurrentTab();
}

function renderCurrentTab() {
  if (currentTreasuryTab === 'dashboard') {
    renderTreasuryDashboard();
  } else if (currentTreasuryTab === 'accounts') {
    renderBankAccountsTable();
  } else if (currentTreasuryTab === 'pix') {
    renderPixPaymentsTable();
  } else if (currentTreasuryTab === 'batches') {
    renderBatchesTable();
  } else if (currentTreasuryTab === 'audit') {
    renderAuditTable();
  }
}

function renderTreasuryKpis(kpis) {
  if (!kpis) return;
  const elTotalBank = document.getElementById('trz-kpi-total-balance');
  const elAvailBank = document.getElementById('trz-kpi-avail-balance');
  const elTodayOut = document.getElementById('trz-kpi-today-outflow');
  const elPendingPix = document.getElementById('trz-kpi-pending-pix');
  const elPendingBatches = document.getElementById('trz-kpi-pending-batches');
  const elActiveAccs = document.getElementById('trz-kpi-active-accounts');

  if (elTotalBank) elTotalBank.textContent = formatBRL(kpis.totalBankBalance);
  if (elAvailBank) elAvailBank.textContent = formatBRL(kpis.availableBankBalance);
  if (elTodayOut) elTodayOut.textContent = formatBRL(kpis.todayProjectedOutflow);
  if (elPendingPix) elPendingPix.textContent = `${kpis.pendingPixCount} (R$ ${kpis.pendingPixAmount.toFixed(2)})`;
  if (elPendingBatches) elPendingBatches.textContent = kpis.pendingCnabBatchesCount;
  if (elActiveAccs) elActiveAccs.textContent = kpis.activeAccountsCount;
}

function renderTreasuryDashboard() {
  // 1. Posição por Banco
  const bankCardsContainer = document.getElementById('trz-bank-accounts-cards');
  if (bankCardsContainer) {
    bankCardsContainer.innerHTML = cachedAccounts.map(acc => {
      return `
        <div class="col-md-6 col-xl-3 mb-2">
          <div class="card h-100 border shadow-sm p-3 bg-white">
            <div class="d-flex justify-content-between align-items-center">
              <span class="badge bg-light text-dark border fw-bold">${acc.bankCode} - ${acc.bankName}</span>
              <span class="badge ${acc.status === 'ATIVA' ? 'bg-success' : 'bg-secondary'}">${acc.status}</span>
            </div>
            <div class="mt-2 text-muted fs-xs">
              Ag: <strong>${acc.agency}</strong> &bull; Conta: <strong>${acc.maskedAccount}</strong>
            </div>
            <h4 class="fw-bold text-dark mt-2 mb-0">${formatBRL(acc.currentBalance)}</h4>
            <div class="d-flex justify-content-between text-muted fs-xs mt-1">
              <span>Disponível:</span>
              <strong class="text-success">${formatBRL(acc.availableBalance)}</strong>
            </div>
            <div class="fs-xs text-muted mt-2 border-top pt-1">
              Finalidade: <span class="badge bg-light text-primary border">${acc.purpose}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Extrato Recente
  const tbody = document.getElementById('trz-tbody-recent-movements');
  if (tbody) {
    if (cachedPayments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Nenhuma movimentação bancária registrada.</td></tr>';
      return;
    }
    tbody.innerHTML = cachedPayments.slice(0, 8).map(p => {
      const statusBadges = {
        SETTLED: '<span class="badge bg-success">Liquidado</span>',
        APPROVED: '<span class="badge bg-primary">Aprovado</span>',
        AWAITING_APPROVAL: '<span class="badge bg-warning text-dark">Aguardando Aprovação</span>',
        PROCESSING: '<span class="badge bg-info text-dark">Processando</span>',
        FAILED: '<span class="badge bg-danger">Falha</span>',
        REJECTED: '<span class="badge bg-danger">Rejeitado</span>'
      };
      return `
        <tr>
          <td>${formatDate(p.createdAt)}</td>
          <td><span class="badge bg-light text-dark border">${p.method}</span></td>
          <td>
            <div class="fw-semibold text-dark">${p.destinationAccount.holderName}</div>
            <span class="fs-xs text-muted">${p.description}</span>
          </td>
          <td class="fw-bold text-dark">${formatBRL(p.amount)}</td>
          <td>${statusBadges[p.status] || p.status}</td>
          <td><code class="fs-xs">${p.externalTransactionId || '—'}</code></td>
          <td class="text-end">
            <button class="btn btn-xs btn-outline-secondary" onclick="window.viewPaymentReceipt('${p.id}')">
              <i class="ph-receipt"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function renderBankAccountsTable() {
  const tbody = document.getElementById('trz-tbody-accounts');
  if (!tbody) return;

  tbody.innerHTML = cachedAccounts.map(acc => {
    return `
      <tr>
        <td>
          <div class="fw-bold text-dark">${acc.bankName}</div>
          <span class="fs-xs text-muted">Cód: ${acc.bankCode}</span>
        </td>
        <td>${acc.agency}</td>
        <td><code>${acc.maskedAccount}</code></td>
        <td><span class="badge bg-light text-dark border">${acc.type}</span></td>
        <td><span class="badge bg-primary-subtle text-primary">${acc.purpose}</span></td>
        <td>
          <div class="fw-semibold text-dark">${acc.holderName}</div>
          <span class="fs-xs text-muted">${acc.holderTaxId}</span>
        </td>
        <td>
          <div class="fs-xs text-muted">${acc.pixKey ? `${acc.pixKeyType}: ${acc.pixKey}` : '—'}</div>
        </td>
        <td class="fw-bold text-success">${formatBRL(acc.availableBalance)}</td>
        <td><span class="badge ${acc.status === 'ATIVA' ? 'bg-success' : 'bg-secondary'}">${acc.status}</span></td>
        <td class="text-end">
          <button class="btn btn-xs btn-outline-primary" onclick="window.openRequestAccountChangeModal('${acc.id}')" title="Solicitar Alteração Segura">
            <i class="ph-pencil-simple"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPixPaymentsTable() {
  const tbody = document.getElementById('trz-tbody-pix');
  if (!tbody) return;

  const pixPayments = cachedPayments.filter(p => p.method === 'PIX');
  if (pixPayments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">Nenhum pagamento PIX registrado.</td></tr>';
    return;
  }

  const statusBadges = {
    SETTLED: '<span class="badge bg-success">Liquidado (Pago)</span>',
    APPROVED: '<span class="badge bg-primary">Aprovado (Pronto)</span>',
    AWAITING_APPROVAL: '<span class="badge bg-warning text-dark">Aguardando Aprovação</span>',
    PROCESSING: '<span class="badge bg-info text-dark">Processando</span>',
    FAILED: '<span class="badge bg-danger">Falha</span>'
  };

  tbody.innerHTML = pixPayments.map(p => {
    return `
      <tr>
        <td class="fw-bold">${p.id}</td>
        <td>
          <div class="fw-semibold text-dark">${p.destinationAccount.holderName}</div>
          <span class="fs-xs text-muted">${p.destinationAccount.pixKeyType}: ${p.destinationAccount.pixKey}</span>
        </td>
        <td class="fw-bold text-dark">${formatBRL(p.amount)}</td>
        <td>${p.scheduledDate}</td>
        <td>${statusBadges[p.status] || p.status}</td>
        <td><span class="fs-xs text-muted">${p.createdBy}</span></td>
        <td><span class="fs-xs text-success">${p.approvedBy || '—'}</span></td>
        <td><code class="fs-xs">${p.endToEndId ? p.endToEndId.slice(0, 16) + '...' : '—'}</code></td>
        <td class="text-end">
          ${p.status === 'AWAITING_APPROVAL' ? `
            <button class="btn btn-xs btn-warning fw-bold text-dark" onclick="window.approveTreasuryPayment('${p.id}')">
              <i class="ph-check"></i> Aprovar
            </button>
          ` : ''}
          ${p.status === 'APPROVED' ? `
            <button class="btn btn-xs btn-success fw-bold" onclick="window.submitTreasuryPixPayment('${p.id}')">
              <i class="ph-paper-plane-tilt"></i> Pagar Agora
            </button>
          ` : ''}
          <button class="btn btn-xs btn-outline-secondary" onclick="window.viewPaymentReceipt('${p.id}')" title="Comprovante">
            <i class="ph-receipt"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderBatchesTable() {
  const tbody = document.getElementById('trz-tbody-batches');
  if (!tbody) return;

  if (cachedBatches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Nenhum lote de remessa CNAB registrado.</td></tr>';
    return;
  }

  const batchStatusBadges = {
    AGUARDANDO_APROVACAO: '<span class="badge bg-warning text-dark">Aguardando Aprovação</span>',
    APROVADO: '<span class="badge bg-primary">Aprovado</span>',
    ENVIADO_BANCO: '<span class="badge bg-info text-dark">Remessa Gerada</span>',
    PROCESSADO: '<span class="badge bg-success">Liquidado</span>'
  };

  tbody.innerHTML = cachedBatches.map(b => {
    return `
      <tr>
        <td class="fw-bold">${b.id}</td>
        <td>${b.title}</td>
        <td>${b.originBankName}</td>
        <td>${b.totalItems} itens</td>
        <td class="fw-bold text-dark">${formatBRL(b.totalAmount)}</td>
        <td>${batchStatusBadges[b.status] || b.status}</td>
        <td><code class="fs-xs">${b.cnabFileId || '—'}</code></td>
        <td class="text-end">
          ${b.status === 'AGUARDANDO_APROVACAO' ? `
            <button class="btn btn-xs btn-warning text-dark fw-bold" onclick="window.approveTreasuryBatch('${b.id}')">
              <i class="ph-check"></i> Homologar
            </button>
          ` : ''}
          ${b.status === 'APROVADO' ? `
            <button class="btn btn-xs btn-primary fw-bold" onclick="window.generateCnabRemessa('${b.id}')">
              <i class="ph-file-arrow-down"></i> Gerar CNAB 240
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

async function renderAuditTable() {
  const tbody = document.getElementById('trz-tbody-audit');
  if (!tbody) return;

  const res = await treasuryGateway.getTreasuryAuditLog();
  const list = res.data || [];

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum registro de auditoria na tesouraria.</td></tr>';
    return;
  }

  tbody.innerHTML = list.slice(0, 30).map(entry => {
    return `
      <tr>
        <td>${formatDate(entry.timestamp)}</td>
        <td>
          <span class="fw-semibold text-dark">${entry.actor?.name || 'Sistema'}</span>
          <span class="badge bg-light text-dark border fs-xs ms-1">${entry.actor?.role || 'SISTEMA'}</span>
        </td>
        <td><span class="badge bg-secondary">${entry.entityType}</span></td>
        <td><span class="badge bg-light text-primary border">${entry.action}</span></td>
        <td class="fs-xs">${entry.summary}</td>
        <td><code class="fs-xs">${entry.correlationId}</code></td>
      </tr>
    `;
  }).join('');
}

// =========================================================================
// AÇÕES DO USUÁRIO & MODAIS
// =========================================================================

export function openNewBankAccountModal() {
  const modalEl = document.getElementById('modal-treasury-account-create');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    m.show();
  }
}

export async function handleNewBankAccountSubmit(e) {
  e.preventDefault();
  const bankCode = document.getElementById('tr-acc-bankcode')?.value;
  const bankName = document.getElementById('tr-acc-bankname')?.value;
  const agency = document.getElementById('tr-acc-agency')?.value;
  const account = document.getElementById('tr-acc-account')?.value;
  const accountDigit = document.getElementById('tr-acc-digit')?.value;
  const purpose = document.getElementById('tr-acc-purpose')?.value;
  const holderName = document.getElementById('tr-acc-holder')?.value;
  const holderTaxId = document.getElementById('tr-acc-taxid')?.value;
  const pixKey = document.getElementById('tr-acc-pixkey')?.value;
  const pixKeyType = document.getElementById('tr-acc-pixtype')?.value;
  const initialBalance = parseFloat(document.getElementById('tr-acc-balance')?.value || 0);

  try {
    const res = await treasuryGateway.createBankAccount({
      producerId: currentProducerId,
      bankCode,
      bankName,
      agency,
      account,
      accountDigit,
      purpose,
      holderName,
      holderTaxId,
      pixKey,
      pixKeyType,
      initialBalance
    }, { name: 'Operador de Tesouraria', role: 'OPERADOR_FINANCEIRO' });

    if (res.ok) {
      alert(`Conta bancária ${bankName} cadastrada com sucesso!`);
      const modalEl = document.getElementById('modal-treasury-account-create');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const m = bootstrap.Modal.getInstance(modalEl);
        if (m) m.hide();
      }
      refreshTreasuryData();
    }
  } catch (err) {
    alert(`Erro ao cadastrar conta: ${err.message}`);
  }
}

export function openRequestAccountChangeModal(accId) {
  const acc = cachedAccounts.find(a => a.id === accId);
  if (!acc) return;

  const inputId = document.getElementById('tr-chg-acc-id');
  const inputBank = document.getElementById('tr-chg-acc-bank');
  if (inputId) inputId.value = acc.id;
  if (inputBank) inputBank.value = `${acc.bankName} (Ag: ${acc.agency} Cc: ${acc.maskedAccount})`;

  const modalEl = document.getElementById('modal-treasury-account-change');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    m.show();
  }
}

export async function handleRequestAccountChangeSubmit(e) {
  e.preventDefault();
  const bankAccountId = document.getElementById('tr-chg-acc-id')?.value;
  const newPixKey = document.getElementById('tr-chg-new-pix')?.value;
  const newAccount = document.getElementById('tr-chg-new-acc')?.value;
  const reason = document.getElementById('tr-chg-reason')?.value;

  try {
    const requestedChanges = {};
    if (newPixKey) requestedChanges.pixKey = newPixKey;
    if (newAccount) requestedChanges.account = newAccount;

    const res = await treasuryGateway.requestBankAccountChange({
      bankAccountId,
      requestedChanges,
      reason
    }, { name: 'Operador de Tesouraria', role: 'OPERADOR_FINANCEIRO' });

    if (res.ok) {
      alert(`Solicitação de alteração de dados bancários (ID: ${res.data.id}) submetida para alçada de segurança!`);
      const modalEl = document.getElementById('modal-treasury-account-change');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const m = bootstrap.Modal.getInstance(modalEl);
        if (m) m.hide();
      }
      refreshTreasuryData();
    }
  } catch (err) {
    alert(`Erro ao solicitar alteração: ${err.message}`);
  }
}

export function openNewPixPaymentModal() {
  const selectOrigin = document.getElementById('tr-pix-origin-acc');
  if (selectOrigin) {
    selectOrigin.innerHTML = cachedAccounts.map(a =>
      `<option value="${a.id}">${a.bankName} (Disp: ${formatBRL(a.availableBalance)})</option>`
    ).join('');
  }

  const dateInput = document.getElementById('tr-pix-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  const modalEl = document.getElementById('modal-treasury-pix-create');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    m.show();
  }
}

export async function handleNewPixPaymentSubmit(e) {
  e.preventDefault();
  const originBankAccountId = document.getElementById('tr-pix-origin-acc')?.value;
  const holderName = document.getElementById('tr-pix-dest-name')?.value;
  const holderTaxId = document.getElementById('tr-pix-dest-taxid')?.value;
  const pixKey = document.getElementById('tr-pix-dest-key')?.value;
  const pixKeyType = document.getElementById('tr-pix-dest-type')?.value;
  const amount = parseFloat(document.getElementById('tr-pix-amount')?.value);
  const scheduledDate = document.getElementById('tr-pix-date')?.value;
  const description = document.getElementById('tr-pix-desc')?.value;

  try {
    const res = await treasuryGateway.createPixPayment({
      producerId: currentProducerId,
      originBankAccountId,
      destinationAccount: { holderName, holderTaxId, pixKey, pixKeyType },
      amount,
      scheduledDate,
      description
    }, { name: 'Operador de Tesouraria', role: 'OPERADOR_FINANCEIRO' });

    if (res.ok) {
      alert(`Ordem de pagamento PIX ${res.data.id} criada! Status: ${res.data.status}`);
      const modalEl = document.getElementById('modal-treasury-pix-create');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const m = bootstrap.Modal.getInstance(modalEl);
        if (m) m.hide();
      }
      refreshTreasuryData();
    }
  } catch (err) {
    alert(`Erro ao criar ordem de pagamento PIX: ${err.message}`);
  }
}

export async function approveTreasuryPayment(paymentId) {
  try {
    const checker = { name: 'Gerente Financeiro', role: 'CHECKER_DIRETORIA' };
    await treasuryGateway.approvePayment(paymentId, checker);
    alert(`Pagamento ${paymentId} homologado com sucesso! Liberado para liquidação.`);
    refreshTreasuryData();
  } catch (err) {
    alert(`Erro ao aprovar pagamento: ${err.message}`);
  }
}

export async function submitTreasuryPixPayment(paymentId) {
  try {
    const res = await treasuryGateway.submitPixPayment(paymentId, {
      actor: { name: 'Operador de Pagamentos', role: 'OPERADOR_FINANCEIRO' }
    });
    if (res.isIdempotentReplay) {
      alert('[IDEMPOTÊNCIA] O pagamento já foi liquidado anteriormente. Exibindo comprovante.');
    } else {
      alert(`Pagamento PIX liquidado com sucesso! EndToEnd: ${res.data.endToEndId}`);
    }
    refreshTreasuryData();
  } catch (err) {
    alert(`Erro ao transmitir PIX: ${err.message}`);
  }
}

export function openCreateTreasuryBatchModal() {
  const selectOrigin = document.getElementById('tr-batch-origin-acc');
  if (selectOrigin) {
    selectOrigin.innerHTML = cachedAccounts.map(a =>
      `<option value="${a.id}">${a.bankName} (Disp: ${formatBRL(a.availableBalance)})</option>`
    ).join('');
  }

  const modalEl = document.getElementById('modal-treasury-batch-create');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    m.show();
  }
}

export async function handleCreateTreasuryBatchSubmit(e) {
  e.preventDefault();
  const originBankAccountId = document.getElementById('tr-batch-origin-acc')?.value;
  const title = document.getElementById('tr-batch-title')?.value;
  const scheduledDate = document.getElementById('tr-batch-date')?.value;

  // Seleciona pagamentos pendentes
  const pendingPayments = cachedPayments.filter(p => ['APPROVED', 'AWAITING_APPROVAL'].includes(p.status));
  if (pendingPayments.length === 0) {
    alert('Não há pagamentos pendentes para compor o lote.');
    return;
  }

  try {
    const res = await treasuryGateway.createPaymentBatch({
      producerId: currentProducerId,
      originBankAccountId,
      paymentIds: pendingPayments.map(p => p.id),
      title,
      scheduledDate
    }, { name: 'Operador de Caixa', role: 'OPERADOR_FINANCEIRO' });

    if (res.ok) {
      alert(`Lote de pagamentos ${res.data.id} criado com sucesso!`);
      const modalEl = document.getElementById('modal-treasury-batch-create');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const m = bootstrap.Modal.getInstance(modalEl);
        if (m) m.hide();
      }
      refreshTreasuryData();
    }
  } catch (err) {
    alert(`Erro ao criar lote: ${err.message}`);
  }
}

export async function approveTreasuryBatch(batchId) {
  try {
    const checker = { name: 'Diretoria Financeira', role: 'DIRETORIA' };
    await treasuryGateway.approvePaymentBatch(batchId, checker);
    alert(`Lote ${batchId} homologado pela diretoria! Liberado para geração de remessa CNAB.`);
    refreshTreasuryData();
  } catch (err) {
    alert(`Erro ao aprovar lote: ${err.message}`);
  }
}

export async function generateCnabRemessa(batchId) {
  try {
    const res = await treasuryGateway.generateCnab240Remessa(batchId, { name: 'Operador de Remessa', role: 'OPERADOR_FINANCEIRO' });
    if (res.ok) {
      // Dispara download simulado do arquivo de remessa
      const blob = new Blob([res.data.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename;
      a.click();
      URL.revokeObjectURL(url);

      alert(`Arquivo CNAB 240 ${res.data.filename} gerado com sucesso para o lote ${batchId}!`);
      refreshTreasuryData();
    }
  } catch (err) {
    alert(`Erro ao gerar remessa CNAB: ${err.message}`);
  }
}

export async function handleCnabRetornoUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    const content = event.target?.result;
    try {
      const res = await treasuryGateway.processCnabRetorno(file.name, content, { name: 'Operador de Retorno', role: 'OPERADOR_FINANCEIRO' });
      if (res.ok) {
        alert(`Arquivo retorno processado com sucesso! ${res.data.totalOccurrences} ocorrências lidas. R$ ${res.data.settledAmount.toFixed(2)} liquidados.`);
        refreshTreasuryData();
      }
    } catch (err) {
      alert(`Erro no processamento do arquivo retorno: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

export function viewPaymentReceipt(paymentId) {
  const p = cachedPayments.find(pay => pay.id === paymentId);
  if (!p) return;

  alert(`COMPROVANTE DE PAGAMENTO TESOURARIA
-----------------------------------------
ID: ${p.id}
Data: ${formatDate(p.settledAt || p.createdAt)}
Favorecido: ${p.destinationAccount.holderName}
Documento: ${p.destinationAccount.holderTaxId}
Chave PIX: ${p.destinationAccount.pixKey || '—'}
Valor: ${formatBRL(p.amount)}
Status: ${p.status}
Transação Bancária: ${p.externalTransactionId || '—'}
EndToEnd PIX: ${p.endToEndId || '—'}`);
}

// Registro global para DOM
if (typeof window !== 'undefined') {
  window.initTreasuryView = initTreasuryView;
  window.refreshTreasuryData = refreshTreasuryData;
  window.switchTreasuryTab = switchTreasuryTab;
  window.openNewBankAccountModal = openNewBankAccountModal;
  window.handleNewBankAccountSubmit = handleNewBankAccountSubmit;
  window.openRequestAccountChangeModal = openRequestAccountChangeModal;
  window.handleRequestAccountChangeSubmit = handleRequestAccountChangeSubmit;
  window.openNewPixPaymentModal = openNewPixPaymentModal;
  window.handleNewPixPaymentSubmit = handleNewPixPaymentSubmit;
  window.approveTreasuryPayment = approveTreasuryPayment;
  window.submitTreasuryPixPayment = submitTreasuryPixPayment;
  window.openCreateTreasuryBatchModal = openCreateTreasuryBatchModal;
  window.handleCreateTreasuryBatchSubmit = handleCreateTreasuryBatchSubmit;
  window.approveTreasuryBatch = approveTreasuryBatch;
  window.generateCnabRemessa = generateCnabRemessa;
  window.handleCnabRetornoUpload = handleCnabRetornoUpload;
  window.viewPaymentReceipt = viewPaymentReceipt;
}
