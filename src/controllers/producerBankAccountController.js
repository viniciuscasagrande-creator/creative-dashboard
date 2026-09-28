/**
 * ============================================================================
 * DISK — CONTROLADOR DE DADOS BANCÁRIOS DO PRODUTOR (PORTAL DO PRODUTOR)
 * Gestão de Domicílio Bancário Oficial, Mascaramento LGPD e Workflow de Segurança
 * ============================================================================
 */

import { producerBankAccountService } from '../services/producerBankAccountService.js';
import { financialApprovalService } from '../services/financialApprovalService.js';
import { accessControlService } from '../services/accessControlService.js';

export const producerBankAccountController = {
  currentProducerId: 'prod-1',

  init() {
    this.bindEvents();
    this.loadBankAccountView(this.currentProducerId);
  },

  /**
   * Carrega e renderiza o painel de Contas Bancárias do Produtor
   */
  loadBankAccountView(producerId = 'prod-1') {
    this.currentProducerId = producerId;
    const pane = document.getElementById('subpane-contas');
    if (!pane) return;

    const activeAcc = producerBankAccountService.getActiveAccount(producerId);
    const allAccounts = producerBankAccountService.getAccountsByProducer(producerId);
    const pendingBankRequests = financialApprovalService.listRequests({
      type: 'ALTERACAO_DADOS_BANCARIOS',
      producerId
    }).filter(r => r.status === 'AGUARDANDO_APROVACAO' || r.status === 'AGUARDANDO_ANALISE' || r.status === 'EM_ANALISE' || r.status === 'AGUARDANDO_CORRECAO');

    const hasPendingChange = pendingBankRequests.length > 0;
    const pendingReq = hasPendingChange ? pendingBankRequests[0] : null;

    pane.innerHTML = `
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
        <div>
          <h5 class="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <i class="ph-bank text-primary"></i> Domicílio Bancário do Produtor
          </h5>
          <span class="fs-xs text-muted">Gestão cadastral de contas receptoras de repasses e liquidações.</span>
        </div>
        <div>
          <button class="btn btn-sm btn-primary fw-bold d-flex align-items-center gap-1 shadow-sm ${hasPendingChange ? 'disabled opacity-75' : ''}" 
                  onclick="${hasPendingChange ? 'alert(\'Já existe uma solicitação de alteração bancária em andamento. Aguarde a análise da equipe financeira.\')' : 'window.openBankChangeModal()'}">
            <i class="ph-plus-circle"></i> Solicitar Alteração Bancária
          </button>
        </div>
      </div>

      <!-- Alerta de Alteração Pendente em Análise -->
      ${hasPendingChange ? `
        <div class="alert alert-warning py-3 px-3 fs-xs mb-3 shadow-sm border border-warning">
          <div class="d-flex align-items-start gap-2">
            <i class="ph-shield-warning text-warning fs-3 mt-1"></i>
            <div>
              <strong class="text-dark d-block mb-1">
                Solicitação de Alteração Bancária em Análise (Protocolo: ${pendingReq.protocol || pendingReq.id})
              </strong>
              <p class="mb-0 text-dark">
                Por segurança, a <strong>conta bancária atual continuará ativa</strong> até que a alteração seja analisada e aprovada pelo Financeiro Disk. Repasses anteriores já autorizados mantêm seus dados congelados.
              </p>
              <div class="mt-2">
                <button class="btn btn-xs btn-outline-dark fw-bold" onclick="window.openApprovalDecisionDrawer('${pendingReq.id}')">
                  <i class="ph-eye"></i> Acompanhar Protocolo
                </button>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Card da Conta Vigente Ativa -->
      <div class="card border border-success-subtle shadow-sm mb-4 bg-white">
        <div class="card-header bg-success-subtle py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
          <strong class="fs-xs text-uppercase text-success d-flex align-items-center gap-1">
            <i class="ph-check-circle"></i> Conta Bancária Ativa (Domicílio Oficial)
          </strong>
          <span class="badge bg-success text-white fs-xxs">ATIVA &bull; Versão ${activeAcc?.version || 1}</span>
        </div>
        <div class="card-body p-3">
          ${activeAcc ? `
            <div class="row g-3 fs-xs">
              <div class="col-md-3">
                <span class="text-muted fs-xxs d-block">Instituição Financeira:</span>
                <strong class="text-dark fs-sm">${activeAcc.bankName} (${activeAcc.bankCode})</strong>
              </div>
              <div class="col-md-2">
                <span class="text-muted fs-xxs d-block">Agência:</span>
                <strong class="text-dark font-monospace">${activeAcc.agency}</strong>
              </div>
              <div class="col-md-3">
                <span class="text-muted fs-xxs d-block">Conta Corrente (Mascarada):</span>
                <strong class="text-dark font-monospace fs-sm">${producerBankAccountService.maskAccount(activeAcc.account)}</strong>
              </div>
              <div class="col-md-4">
                <span class="text-muted fs-xxs d-block">Chave PIX Cadastrada:</span>
                <span class="badge bg-light text-dark border font-monospace fs-xs">${activeAcc.pixKey || 'Não cadastrada'}</span>
              </div>
              <div class="col-md-6 border-top pt-2">
                <span class="text-muted fs-xxs d-block">Titular Cadastrado:</span>
                <strong class="text-dark">${activeAcc.holderName}</strong>
              </div>
              <div class="col-md-6 border-top pt-2">
                <span class="text-muted fs-xxs d-block">CNPJ / CPF do Titular:</span>
                <span class="text-dark font-monospace">${producerBankAccountService.maskDocument(activeAcc.document)}</span>
              </div>
            </div>
          ` : `
            <p class="text-muted mb-0">Nenhuma conta ativa cadastrada.</p>
          `}
        </div>
      </div>

      <!-- Tabela de Histórico e Versões de Contas -->
      <div class="card border shadow-sm">
        <div class="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
          <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
            <i class="ph-clock-counter-clockwise text-primary"></i> Histórico de Contas e Solicitações
          </strong>
          <span class="badge bg-light text-dark border fs-xxs">${allAccounts.length} registros</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 fs-xs">
            <thead class="table-light">
              <tr>
                <th>Banco</th>
                <th>Agência</th>
                <th>Conta (Protegida)</th>
                <th>Favorecido</th>
                <th>Documento</th>
                <th>Versão</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              ${allAccounts.map(a => {
                let badgeClass = 'bg-secondary text-white';
                let label = a.status;
                if (a.status === 'ATIVA') { badgeClass = 'bg-success text-white'; label = 'Ativa'; }
                else if (a.status === 'PENDENTE_APROVACAO') { badgeClass = 'bg-warning text-dark'; label = 'Em Análise'; }
                else if (a.status === 'INATIVA_HISTORICA') { badgeClass = 'bg-light text-muted border'; label = 'Histórico'; }
                else if (a.status === 'REPROVADA') { badgeClass = 'bg-danger text-white'; label = 'Reprovada'; }

                return `
                  <tr>
                    <td><strong>${a.bankName}</strong> <span class="text-muted fs-xxs">(${a.bankCode})</span></td>
                    <td class="font-monospace">${a.agency}</td>
                    <td class="font-monospace fw-bold text-dark">${producerBankAccountService.maskAccount(a.account)}</td>
                    <td>${a.holderName}</td>
                    <td class="font-monospace">${producerBankAccountService.maskDocument(a.document)}</td>
                    <td class="text-muted">v${a.version || 1}</td>
                    <td><span class="badge ${badgeClass} fs-xxs">${label}</span></td>
                    <td class="text-muted fs-xxs">${new Date(a.activatedAt || a.requestedAt || Date.now()).toLocaleDateString('pt-BR')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal de Solicitação de Alteração de Dados Bancários -->
      <div class="modal fade" id="modal-request-bank-change" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-light py-2 px-3">
              <h6 class="modal-title fw-bold text-dark d-flex align-items-center gap-1">
                <i class="ph-bank text-primary"></i> Solicitar Alteração de Dados Bancários
              </h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body p-3">
              <div class="alert alert-warning py-2 px-3 fs-xxs mb-3 border border-warning">
                <i class="ph-shield-warning me-1"></i>
                <strong>Aviso de Segurança:</strong> Por segurança, a conta bancária atual continuará ativa até que a alteração seja analisada e aprovada pelo Financeiro Disk.
              </div>
              <form id="form-bank-change-request" onsubmit="event.preventDefault(); window.submitBankChangeRequest();">
                <div class="row g-2 mb-2">
                  <div class="col-8">
                    <label class="form-label fs-xxs fw-semibold mb-1" for="bank-input-name">Instituição Financeira</label>
                    <select class="form-select form-select-sm" id="bank-input-select" onchange="window.onBankSelectChange(this)">
                      <option value="033|Banco Santander">Banco Santander (033)</option>
                      <option value="341|Banco Itaú S.A.">Banco Itaú S.A. (341)</option>
                      <option value="237|Banco Bradesco S.A.">Banco Bradesco S.A. (237)</option>
                      <option value="001|Banco do Brasil S.A.">Banco do Brasil S.A. (001)</option>
                      <option value="260|Nu Pagamentos (Nubank)">Nu Pagamentos / Nubank (260)</option>
                    </select>
                  </div>
                  <div class="col-4">
                    <label class="form-label fs-xxs fw-semibold mb-1" for="bank-input-agency">Agência</label>
                    <input type="text" id="bank-input-agency" class="form-control form-control-sm font-monospace" placeholder="0082" required value="0082">
                  </div>
                </div>
                <div class="row g-2 mb-2">
                  <div class="col-7">
                    <label class="form-label fs-xxs fw-semibold mb-1" for="bank-input-account">Conta Corrente com Dígito</label>
                    <input type="text" id="bank-input-account" class="form-control form-control-sm font-monospace" placeholder="44810-9" required value="44810-9">
                  </div>
                  <div class="col-5">
                    <label class="form-label fs-xxs fw-semibold mb-1" for="bank-input-type">Tipo de Conta</label>
                    <select class="form-select form-select-sm" id="bank-input-type">
                      <option value="Conta Corrente Pessoa Jurídica" selected>Corrente PJ</option>
                      <option value="Conta Corrente Pessoa Física">Corrente PF</option>
                    </select>
                  </div>
                </div>
                <div class="mb-2">
                  <label class="form-label fs-xxs fw-semibold mb-1" for="bank-input-holder">Nome / Razão Social do Titular</label>
                  <input type="text" id="bank-input-holder" class="form-control form-control-sm" placeholder="Razão social idêntica ao CNPJ" required value="${activeAcc?.holderName || 'DiskIngressos Eventos Ltda'}">
                </div>
                <div class="row g-2 mb-2">
                  <div class="col-6">
                    <label class="form-label fs-xxs fw-semibold mb-1" for="bank-input-doc">CNPJ ou CPF</label>
                    <input type="text" id="bank-input-doc" class="form-control form-control-sm font-monospace" placeholder="00.000.000/0001-00" required value="${activeAcc?.document || '08.123.456/0001-99'}">
                  </div>
                  <div class="col-6">
                    <label class="form-label fs-xxs fw-semibold mb-1" for="bank-input-pix">Chave PIX</label>
                    <input type="text" id="bank-input-pix" class="form-control form-control-sm font-monospace" placeholder="CNPJ, E-mail ou Telefone" value="12987654000100">
                  </div>
                </div>
                <div class="mb-2">
                  <label class="form-label fs-xxs fw-semibold mb-1" for="bank-input-file">Comprovante de Titularidade (Extrato ou Cartão CNPJ)</label>
                  <input type="file" id="bank-input-file" class="form-control form-control-sm">
                  <span class="fs-xxs text-muted">Formatos aceitos: PDF, PNG, JPG (Máx. 5MB)</span>
                </div>
                <div class="mb-3">
                  <label class="form-label fs-xxs fw-semibold mb-1" for="bank-input-just">Motivo da Alteração</label>
                  <textarea id="bank-input-just" class="form-control form-control-sm" rows="2" placeholder="Descreva a razão da alteração de domicílio bancário.">Mudança de domicílio bancário da empresa para o Banco Santander para centralização de crédito.</textarea>
                </div>
                <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                  <button type="button" class="btn btn-sm btn-light border" data-bs-dismiss="modal">Cancelar</button>
                  <button type="submit" class="btn btn-sm btn-primary fw-bold d-flex align-items-center gap-1 shadow-sm">
                    <i class="ph-paper-plane-tilt"></i> Solicitar Alteração Bancária
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  openChangeModal() {
    const el = document.getElementById('modal-request-bank-change');
    if (!el) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(el).show();
    } else {
      el.classList.add('show');
      el.style.display = 'block';
    }
  },

  hideChangeModal() {
    const el = document.getElementById('modal-request-bank-change');
    if (!el) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(el).hide();
    } else {
      el.classList.remove('show');
      el.style.display = 'none';
    }
  },

  async submitAccountChange() {
    const bankSelect = document.getElementById('bank-input-select');
    const agencyInput = document.getElementById('bank-input-agency');
    const accountInput = document.getElementById('bank-input-account');
    const typeSelect = document.getElementById('bank-input-type');
    const holderInput = document.getElementById('bank-input-holder');
    const docInput = document.getElementById('bank-input-doc');
    const pixInput = document.getElementById('bank-input-pix');
    const justInput = document.getElementById('bank-input-just');

    const [bankCode, bankName] = (bankSelect?.value || '033|Banco Santander').split('|');
    const agency = agencyInput?.value?.trim();
    const account = accountInput?.value?.trim();
    const accountType = typeSelect?.value || 'Conta Corrente Pessoa Jurídica';
    const holderName = holderInput?.value?.trim();
    const documentStr = docInput?.value?.trim();
    const pixKey = pixInput?.value?.trim();
    const justification = justInput?.value?.trim();

    if (!agency || !account || !holderName || !documentStr) {
      alert('Por favor, preencha todos os campos obrigatórios da nova conta bancária.');
      return;
    }

    try {
      const user = accessControlService.getCurrentUser() || {
        id: 'user-producer-joao',
        name: 'João Silva',
        role: 'PRODUTOR',
        email: 'joao.silva@parquejlerner.com.br'
      };

      const res = await financialApprovalService.createRequest({
        type: 'ALTERACAO_DADOS_BANCARIOS',
        producerId: this.currentProducerId,
        producerName: holderName,
        requestedBy: user,
        amount: 0,
        justification,
        payload: {
          bankCode,
          bankName,
          agency,
          account,
          accountType,
          holderName,
          document: documentStr,
          pixKey
        },
        attachments: [
          { name: 'Comprovante_Titularidade_Bancaria.pdf', type: 'application/pdf', uploadedAt: new Date().toISOString() }
        ]
      });

      this.hideChangeModal();
      if (res && res.ok) {
        if (window.showAppNotification) {
          window.showAppNotification(`Solicitação de alteração bancária enviada com sucesso! Protocolo: ${res.data.protocol || res.data.id}`, 'success');
        } else {
          alert(`Solicitação de alteração bancária enviada com sucesso! Protocolo: ${res.data.protocol || res.data.id}`);
        }
        this.loadBankAccountView(this.currentProducerId);
        if (window.refreshApprovalsDashboard) {
          window.refreshApprovalsDashboard();
        }
      }
    } catch (err) {
      alert(`Erro ao solicitar alteração bancária: ${err.message}`);
    }
  },

  bindEvents() {
    window.producerBankAccountController = this;
    window.initBankAccountView = (prodId) => this.loadBankAccountView(prodId);
    window.openBankChangeModal = () => this.openChangeModal();
    window.submitBankChangeRequest = () => this.submitAccountChange();
  }
};
