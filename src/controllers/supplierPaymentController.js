/**
 * ============================================================================
 * DISK — CONTROLADOR DE PAGAMENTOS A FORNECEDORES (PORTAL DO PRODUTOR)
 * Catálogo de Fornecedores, Histórico Bancário, Duplicidade e Submissão
 * ============================================================================
 */

import { supplierPaymentService } from '../services/supplierPaymentService.js';
import { financialApprovalService } from '../services/financialApprovalService.js';
import { accessControlService } from '../services/accessControlService.js';
import { eventBalanceService } from '../services/eventBalanceService.js';

let selectedSupplier = null;

export const supplierPaymentController = {
  currentProducerId: 'prod-1',
  selectedEventId: '3368',

  init() {
    this.bindEvents();
    this.loadPaymentView();
  },

  /**
   * Renderiza a visão completa de despesas e pagamentos a fornecedores
   */
  async loadPaymentView(producerId = 'prod-1') {
    this.currentProducerId = producerId;
    const pane = document.getElementById('subpane-despesas');
    if (!pane) return;

    const user = accessControlService.getCurrentUser() || { name: 'João Silva', id: 'user-producer-joao' };
    const suppliers = supplierPaymentService.listSuppliers({ producerId });
    const myPaymentRequests = financialApprovalService.listRequests({ type: 'PAGAMENTO', producerId });
    const pendingPayments = myPaymentRequests.filter(r => r.status === 'AGUARDANDO_ANALISE' || r.status === 'EM_ANALISE' || r.status === 'AGUARDANDO_APROVACAO');
    const scheduledPayments = myPaymentRequests.filter(r => r.status === 'AGENDADA');
    const paidPayments = myPaymentRequests.filter(r => r.status === 'CONCLUIDA' || r.status === 'PAGA');
    const totalPaidAmount = paidPayments.reduce((acc, r) => acc + (r.amount || 0), 0);

    // Saldo disponível do evento
    let eventAvailable = 0;
    try {
      const bal = await eventBalanceService.getEventBalance(this.selectedEventId);
      if (bal && bal.data) {
        eventAvailable = bal.data.balances?.availableBalance || bal.data.available || 0;
      }
    } catch (_) {}

    pane.innerHTML = `
      <!-- Cabeçalho e Ações Rápidas -->
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
        <div>
          <h5 class="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <i class="ph-credit-card text-info"></i> Pagamentos a Fornecedores &amp; Despesas
          </h5>
          <span class="fs-xs text-muted">Controle de Obrigações • Documento Fiscal • Prevenção de Duplicidades • Reserva de Saldo</span>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary btn-sm fw-bold" onclick="window.supplierPaymentController.openNewSupplierModal()">
            <i class="ph-plus-circle me-1"></i> Cadastrar Fornecedor
          </button>
        </div>
      </div>

      <!-- Métricas Operacionais Superiores -->
      <div class="row g-2 mb-3">
        <div class="col-6 col-md">
          <div class="card border shadow-sm p-3 bg-white h-100">
            <span class="text-muted fs-xxs text-uppercase fw-bold d-block mb-1">Total Liquidado</span>
            <strong class="fs-5 text-dark font-monospace">R$ ${totalPaidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            <span class="text-muted fs-xxs d-block mt-1">${paidPayments.length} pagamentos realizados</span>
          </div>
        </div>
        <div class="col-6 col-md">
          <div class="card border border-warning-subtle shadow-sm p-3 bg-warning-subtle h-100">
            <span class="text-warning-emphasis fs-xxs text-uppercase fw-bold d-block mb-1">Em Análise Disk</span>
            <strong class="fs-5 text-warning-emphasis font-monospace">${pendingRefundsLength(pendingPayments)}</strong>
            <span class="text-muted fs-xxs d-block mt-1">Aguardando aprovação</span>
          </div>
        </div>
        <div class="col-6 col-md">
          <div class="card border border-indigo-subtle shadow-sm p-3 bg-light h-100">
            <span class="text-muted fs-xxs text-uppercase fw-bold d-block mb-1">Agendados p/ Vencimento</span>
            <strong class="fs-5 text-primary font-monospace">${scheduledPayments.length}</strong>
            <span class="text-muted fs-xxs d-block mt-1">Aprovados pela Tesouraria</span>
          </div>
        </div>
        <div class="col-6 col-md">
          <div class="card border shadow-sm p-3 bg-white h-100">
            <span class="text-muted fs-xxs text-uppercase fw-bold d-block mb-1">Saldo Disponível no Evento</span>
            <strong class="fs-5 text-success font-monospace">R$ ${eventAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            <span class="text-muted fs-xxs d-block mt-1">Evento de Origem (#${this.selectedEventId})</span>
          </div>
        </div>
      </div>

      <!-- Formulário de Solicitação de Pagamento a Fornecedor -->
      <div class="card border shadow-sm mb-4">
        <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
          <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
            <i class="ph-file-text text-primary"></i> Nova Solicitação de Pagamento
          </strong>
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-xxs">Operação Controlada</span>
        </div>
        <div class="card-body p-3">
          <form id="form-request-supplier-payment" onsubmit="event.preventDefault(); window.supplierPaymentController.submitPaymentRequest();">
            <div class="row g-3">
              <!-- Evento de Vínculo -->
              <div class="col-md-6">
                <label class="form-label fs-xs fw-semibold mb-1" for="pay-event-select">Evento / Centro de Custos de Origem</label>
                <select class="form-select form-select-sm" id="pay-event-select" onchange="window.supplierPaymentController.onEventChange(this.value)">
                  <option value="3368" ${this.selectedEventId === '3368' ? 'selected' : ''}>Experiência Música e Natureza (#3368) - Disponível: R$ ${eventAvailable.toFixed(2)}</option>
                  <option value="3178" ${this.selectedEventId === '3178' ? 'selected' : ''}>Feijoada & Costela (#3178)</option>
                  <option value="">Despesa Geral / Overhead Corporativo do Produtor</option>
                </select>
                <div class="form-text fs-xxs text-muted">O saldo disponível do evento será reservado preventivamente.</div>
              </div>

              <!-- Fornecedor -->
              <div class="col-md-6">
                <label class="form-label fs-xs fw-semibold mb-1 d-flex justify-content-between" for="pay-supplier-select">
                  <span>Fornecedor Homologado</span>
                  <a href="javascript:void(0)" class="fs-xxs text-primary" onclick="window.supplierPaymentController.openNewSupplierModal()">+ Cadastrar Novo</a>
                </label>
                <select class="form-select form-select-sm" id="pay-supplier-select" onchange="window.supplierPaymentController.onSupplierChange(this.value)" required>
                  <option value="">Selecione o Fornecedor...</option>
                  ${suppliers.map(s => `
                    <option value="${s.id}">${s.tradeName || s.legalName} (${s.taxId}) - ${s.primaryCategory}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Card de Detalhes Bancários do Fornecedor e Alertas de Segurança -->
            <div id="pay-supplier-details-card" class="mt-3 p-3 bg-light rounded border" style="display: none;">
              <!-- Preenchido dinamicamente -->
            </div>

            <!-- Dados da Obrigação / Despesa -->
            <div class="row g-2 mt-2">
              <div class="col-md-8">
                <label class="form-label fs-xs fw-semibold mb-1" for="pay-description-input">Descrição da Despesa / Obrigação</label>
                <input type="text" class="form-control form-control-sm" id="pay-description-input" placeholder="Ex: Locação de geradores para iluminação do palco" required>
              </div>
              <div class="col-md-4">
                <label class="form-label fs-xs fw-semibold mb-1" for="pay-category-select">Categoria</label>
                <select class="form-select form-select-sm" id="pay-category-select">
                  <option value="Infraestrutura & Palco">Infraestrutura & Palco</option>
                  <option value="Equipamentos de Som & Luz">Equipamentos de Som & Luz</option>
                  <option value="Segurança & Portaria">Segurança & Portaria</option>
                  <option value="Limpeza & Apoio">Limpeza & Apoio</option>
                  <option value="Catering & Alimentos">Catering & Alimentos</option>
                  <option value="Marketing & Tráfego">Marketing & Tráfego</option>
                  <option value="Serviços Técnicos">Serviços Técnicos</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <div class="row g-2 mt-1">
              <div class="col-md-3">
                <label class="form-label fs-xs fw-semibold mb-1" for="pay-amount-input">Valor a Pagar (R$)</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-light text-muted font-monospace">R$</span>
                  <input type="number" step="0.01" class="form-control fw-bold font-monospace" id="pay-amount-input" placeholder="0,00" required onchange="window.supplierPaymentController.checkDuplicateRealtime()">
                </div>
              </div>
              <div class="col-md-3">
                <label class="form-label fs-xs fw-semibold mb-1" for="pay-due-date-input">Data de Vencimento</label>
                <input type="date" class="form-control form-control-sm" id="pay-due-date-input" required onchange="window.supplierPaymentController.checkDuplicateRealtime()">
              </div>
              <div class="col-md-3">
                <label class="form-label fs-xs fw-semibold mb-1" for="pay-method-select">Forma de Pagamento</label>
                <select class="form-select form-select-sm" id="pay-method-select">
                  <option value="PIX">Transferência Instantânea PIX</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="CNAB240">Transferência TED / CNAB 240</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fs-xs fw-semibold mb-1" for="pay-competency-input">Mês de Competência</label>
                <input type="text" class="form-control form-control-sm" id="pay-competency-input" placeholder="Ex: 09/2026" value="09/2026">
              </div>
            </div>

            <!-- Documento Fiscal Obrigatório -->
            <div class="row g-2 mt-2 pt-2 border-top">
              <div class="col-md-3">
                <label class="form-label fs-xs fw-semibold mb-1" for="pay-doc-type">Tipo de Documento</label>
                <select class="form-select form-select-sm" id="pay-doc-type">
                  <option value="NOTA_FISCAL">Nota Fiscal (NF-e / NFS-e)</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="RECIBO">Recibo / RPA</option>
                  <option value="CONTRATO">Contrato de Prestação</option>
                  <option value="ORDEM_COMPRA">Ordem de Compra (PO)</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label fs-xs fw-semibold mb-1" for="pay-doc-number">Número do Documento</label>
                <input type="text" class="form-control form-control-sm" id="pay-doc-number" placeholder="Ex: NF-e 88412" required onchange="window.supplierPaymentController.checkDuplicateRealtime()">
              </div>
              <div class="col-md-5">
                <label class="form-label fs-xs fw-semibold mb-1" for="pay-doc-key">Chave de Acesso / Cód. Barras (Opcional)</label>
                <input type="text" class="form-control form-control-sm font-monospace" id="pay-doc-key" placeholder="44 dígitos da NF-e ou linha digitável">
              </div>
            </div>

            <!-- Alerta em tempo real de Suspeita de Duplicidade -->
            <div id="pay-duplicate-alert" class="alert alert-warning py-2 px-3 fs-xs mt-3" style="display: none;">
              <i class="ph-warning-octagon me-1 fs-6 align-middle"></i>
              <span id="pay-duplicate-alert-text">Detectada suspeita de pagamento duplicado.</span>
            </div>

            <!-- Botão Oficial: SOLICITAR PAGAMENTO -->
            <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span class="fs-xxs text-muted">
                <i class="ph-shield-check text-success me-1"></i> A aprovação e execução são de alçada exclusiva do Financeiro Disk
              </span>
              <button type="submit" class="btn btn-primary btn-sm fw-bold px-4 d-flex align-items-center gap-1" id="btn-submit-payment-action">
                <i class="ph-paper-plane-tilt"></i> SOLICITAR PAGAMENTO
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Tabela de Solicitações de Pagamento Recentes -->
      <div class="card border shadow-sm">
        <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
          <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
            <i class="ph-list-checks text-primary"></i> Minhas Solicitações de Pagamento a Fornecedores
          </strong>
          <span class="badge bg-secondary-subtle text-dark fs-xxs">Total: ${myPaymentRequests.length}</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 fs-xs">
            <thead class="table-light">
              <tr>
                <th>Protocolo</th>
                <th>Fornecedor</th>
                <th>Descrição</th>
                <th>Documento</th>
                <th>Vencimento</th>
                <th class="text-end">Valor</th>
                <th class="text-center">Status</th>
                <th class="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${myPaymentRequests.length > 0 ? myPaymentRequests.map(r => `
                <tr>
                  <td><strong class="font-monospace text-primary">${r.protocol || r.id}</strong></td>
                  <td><strong>${r.payload?.supplierName || 'Fornecedor'}</strong></td>
                  <td class="text-truncate" style="max-width: 200px;">${r.justification || r.payload?.description || 'Pagamento operacional'}</td>
                  <td><span class="badge bg-light text-dark border font-monospace fs-xxs">${r.payload?.documentNumber || 'NF'}</span></td>
                  <td><span class="font-monospace">${r.payload?.dueDate || '—'}</span></td>
                  <td class="text-end fw-bold font-monospace text-dark">R$ ${r.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td class="text-center">
                    <span class="badge ${r.badgeClass} fs-xxs">${r.statusLabelPtBr}</span>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-outline-primary btn-xs" onclick="window.financialApprovalsController.openDrawer('${r.id}')">
                      <i class="ph-eye me-1"></i> Acompanhar
                    </button>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="8" class="text-center py-4 text-muted fs-xs">
                    Nenhuma solicitação de pagamento registrada até o momento.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Se houver fornecedores, seleciona o primeiro
    if (suppliers.length > 0) {
      const select = document.getElementById('pay-supplier-select');
      if (select) {
        select.value = suppliers[0].id;
        this.onSupplierChange(suppliers[0].id);
      }
    }
  },

  onEventChange(eventId) {
    this.selectedEventId = eventId;
  },

  onSupplierChange(supplierId) {
    const card = document.getElementById('pay-supplier-details-card');
    if (!card) return;

    if (!supplierId) {
      selectedSupplier = null;
      card.style.display = 'none';
      return;
    }

    selectedSupplier = supplierPaymentService.getSupplier(supplierId);
    if (!selectedSupplier) {
      card.style.display = 'none';
      return;
    }

    const bank = selectedSupplier.bankAccount || {};
    const hasRecentChange = supplierPaymentService.hasRecentBankChange(selectedSupplier);

    card.style.display = 'block';
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
        <div>
          <strong class="fs-xs text-dark">${selectedSupplier.legalName}</strong>
          <span class="text-muted ms-1 fs-xxs font-monospace">(${selectedSupplier.taxId})</span>
        </div>
        <span class="badge bg-success-subtle text-success fs-xxs">Fornecedor Homologado</span>
      </div>

      ${hasRecentChange ? `
        <div class="alert alert-warning py-1 px-2 fs-xxs mb-2 border-warning">
          <i class="ph-shield-warning text-warning fs-6 me-1 align-middle"></i>
          <strong>Alerta de Segurança Cadastral:</strong> Os dados bancários deste fornecedor foram alterados há menos de 30 dias. Esta operação será encaminhada para conferência adicional do Gestor Financeiro (Nível 2).
        </div>
      ` : ''}

      <div class="row g-2 fs-xxs">
        <div class="col-sm-4">
          <span class="text-muted d-block">Banco Favorecido:</span>
          <strong class="text-dark">${bank.bankName || 'Banco'} (${bank.bankCode || '001'})</strong>
        </div>
        <div class="col-sm-4">
          <span class="text-muted d-block">Agência / Conta:</span>
          <strong class="text-dark font-monospace">${bank.agency || '0001'} / ${bank.account || '00000-0'} (${bank.accountType || 'CORRENTE'})</strong>
        </div>
        <div class="col-sm-4">
          <span class="text-muted d-block">Chave PIX:</span>
          <strong class="text-dark font-monospace">${bank.pixKey || 'Não cadastrada'}</strong>
        </div>
      </div>
    `;

    this.checkDuplicateRealtime();
  },

  checkDuplicateRealtime() {
    const supplierId = document.getElementById('pay-supplier-select')?.value;
    const docNumber = document.getElementById('pay-doc-number')?.value;
    const amount = Number(document.getElementById('pay-amount-input')?.value) || 0;
    const dueDate = document.getElementById('pay-due-date-input')?.value;
    const alertBox = document.getElementById('pay-duplicate-alert');
    const alertText = document.getElementById('pay-duplicate-alert-text');

    if (!supplierId || (!docNumber && amount <= 0)) {
      if (alertBox) alertBox.style.display = 'none';
      return;
    }

    const check = supplierPaymentService.checkDuplicatePayment({
      supplierId,
      documentNumber: docNumber,
      amount,
      dueDate,
      existingRequests: financialApprovalService.listRequests()
    });

    if (check.isDuplicate && alertBox && alertText) {
      alertBox.style.display = 'block';
      alertText.textContent = check.alerts[0]?.message || 'Possível duplicidade de pagamento detectada.';
    } else if (alertBox) {
      alertBox.style.display = 'none';
    }
  },

  /**
   * Submete a solicitação formal de pagamento a fornecedor
   */
  async submitPaymentRequest() {
    if (!selectedSupplier) {
      alert('Selecione um fornecedor do catálogo.');
      return;
    }

    const amount = Number(document.getElementById('pay-amount-input')?.value) || 0;
    if (amount <= 0) {
      alert('Informe um valor válido a ser pago.');
      return;
    }

    const description = document.getElementById('pay-description-input')?.value || '';
    const category = document.getElementById('pay-category-select')?.value || 'Serviços Técnicos';
    const dueDate = document.getElementById('pay-due-date-input')?.value;
    const paymentMethod = document.getElementById('pay-method-select')?.value || 'PIX';
    const competency = document.getElementById('pay-competency-input')?.value || '09/2026';
    const docType = document.getElementById('pay-doc-type')?.value || 'NOTA_FISCAL';
    const docNumber = document.getElementById('pay-doc-number')?.value || '';
    const docKey = document.getElementById('pay-doc-key')?.value || '';

    const btn = document.getElementById('btn-submit-payment-action');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Enviando...';
    }

    try {
      const user = accessControlService.getCurrentUser() || { name: 'João Silva', id: 'user-producer-joao', role: 'PRODUTOR' };

      const res = await financialApprovalService.createRequest({
        type: 'PAGAMENTO',
        producerId: this.currentProducerId,
        producerName: 'Parque Jaime Lerner',
        eventId: this.selectedEventId || undefined,
        eventName: this.selectedEventId ? 'Experiência Música & Natureza' : 'Despesa Geral do Produtor',
        requestedBy: {
          id: user.id,
          name: user.name,
          role: user.profile || 'PRODUTOR',
          email: user.email || 'produtor@diskingressos.com.br'
        },
        amount,
        justification: `[${category}] ${description} (Doc: ${docType} ${docNumber})`,
        payload: {
          supplierId: selectedSupplier.id,
          supplierName: selectedSupplier.tradeName || selectedSupplier.legalName,
          supplierTaxId: selectedSupplier.taxId,
          description,
          category,
          costCenterId: 'cc-prod-01',
          costCenterName: category,
          competency,
          dueDate,
          paymentMethod,
          documentType: docType,
          documentNumber: docNumber,
          documentKey: docKey,
          supplierBankSnapshot: { ...selectedSupplier.bankAccount },
          hasRecentBankChange: supplierPaymentService.hasRecentBankChange(selectedSupplier)
        }
      });

      if (res && res.ok) {
        alert(`Solicitação de pagamento registrada com sucesso!\nProtocolo: ${res.data.protocol || res.data.id}\nStatus: Aguardando Análise.\nSaldo do evento reservado preventivamente.`);
        this.loadPaymentView(this.currentProducerId);
      }
    } catch (err) {
      alert(`Falha ao registrar solicitação de pagamento: ${err.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph-paper-plane-tilt"></i> SOLICITAR PAGAMENTO';
      }
    }
  },

  openNewSupplierModal() {
    const modalId = 'modal-new-supplier-fast';
    let modalEl = document.getElementById(modalId);
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = modalId;
      modalEl.className = 'modal fade';
      modalEl.tabIndex = -1;
      modalEl.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header py-2 px-3 bg-light border-bottom">
              <h6 class="modal-title fw-bold text-dark"><i class="ph-plus-circle text-primary me-1"></i> Cadastrar Fornecedor Homologado</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-3">
              <form id="form-fast-new-supplier" onsubmit="event.preventDefault(); window.supplierPaymentController.saveNewSupplier();">
                <div class="mb-2">
                  <label class="form-label fs-xs fw-semibold mb-1">Razão Social</label>
                  <input type="text" class="form-control form-control-sm" id="new-sup-legal-name" placeholder="Ex: Equipamentos de Som Brasil Ltda" required>
                </div>
                <div class="row g-2 mb-2">
                  <div class="col-md-6">
                    <label class="form-label fs-xs fw-semibold mb-1">Nome Fantasia</label>
                    <input type="text" class="form-control form-control-sm" id="new-sup-trade-name" placeholder="Ex: Som Brasil">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fs-xs fw-semibold mb-1">CNPJ / CPF</label>
                    <input type="text" class="form-control form-control-sm font-monospace" id="new-sup-tax-id" placeholder="00.000.000/0000-00" required>
                  </div>
                </div>
                <div class="mb-2">
                  <label class="form-label fs-xs fw-semibold mb-1">Categoria Principal</label>
                  <input type="text" class="form-control form-control-sm" id="new-sup-category" placeholder="Ex: Equipamentos de Iluminação e Palco" value="Serviços Técnicos Especializados">
                </div>
                <hr class="my-2">
                <strong class="fs-xxs text-uppercase text-muted d-block mb-1">Dados Bancários / Chave PIX</strong>
                <div class="row g-2 mb-2">
                  <div class="col-md-6">
                    <label class="form-label fs-xs fw-semibold mb-1">Banco</label>
                    <input type="text" class="form-control form-control-sm" id="new-sup-bank-name" placeholder="Ex: Banco Itaú" value="Banco do Brasil">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fs-xs fw-semibold mb-1">Chave PIX</label>
                    <input type="text" class="form-control form-control-sm font-monospace" id="new-sup-pix" placeholder="CNPJ, E-mail ou Telefone" required>
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-md-6">
                    <label class="form-label fs-xs fw-semibold mb-1">Agência</label>
                    <input type="text" class="form-control form-control-sm font-monospace" id="new-sup-agency" placeholder="0001" value="0001">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fs-xs fw-semibold mb-1">Conta Corrente</label>
                    <input type="text" class="form-control form-control-sm font-monospace" id="new-sup-account" placeholder="12345-6" value="12345-6">
                  </div>
                </div>
                <div class="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
                  <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                  <button type="submit" class="btn btn-primary btn-sm fw-bold">Salvar Fornecedor</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalEl);
    }

    if (window.bootstrap && window.bootstrap.Modal) {
      const bsModal = new window.bootstrap.Modal(modalEl);
      bsModal.show();
    } else {
      modalEl.style.display = 'block';
      modalEl.classList.add('show');
    }
  },

  saveNewSupplier() {
    const legalName = document.getElementById('new-sup-legal-name')?.value;
    const tradeName = document.getElementById('new-sup-trade-name')?.value || legalName;
    const taxId = document.getElementById('new-sup-tax-id')?.value;
    const category = document.getElementById('new-sup-category')?.value;
    const bankName = document.getElementById('new-sup-bank-name')?.value || 'Banco do Brasil';
    const pixKey = document.getElementById('new-sup-pix')?.value;
    const agency = document.getElementById('new-sup-agency')?.value || '0001';
    const account = document.getElementById('new-sup-account')?.value || '12345-6';

    try {
      const newSup = supplierPaymentService.createSupplier({
        producerId: this.currentProducerId,
        legalName,
        tradeName,
        taxId,
        primaryCategory: category,
        bankAccount: {
          bankName,
          bankCode: '001',
          pixKey,
          agency,
          account,
          accountType: 'CORRENTE'
        }
      });

      alert(`Fornecedor ${tradeName} cadastrado com sucesso!`);
      const modalEl = document.getElementById('modal-new-supplier-fast');
      if (modalEl) {
        if (window.bootstrap && window.bootstrap.Modal) {
          const bsModal = window.bootstrap.Modal.getInstance(modalEl);
          if (bsModal) bsModal.hide();
        } else {
          modalEl.style.display = 'none';
          modalEl.classList.remove('show');
        }
      }

      this.loadPaymentView(this.currentProducerId);
    } catch (err) {
      alert(`Falha ao cadastrar fornecedor: ${err.message}`);
    }
  },

  bindEvents() {
    window.supplierPaymentController = this;
  }
};

function pendingRefundsLength(arr) {
  return arr.length;
}

if (typeof window !== 'undefined') {
  window.supplierPaymentController = supplierPaymentController;
}
