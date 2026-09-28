/**
 * ============================================================================
 * DISK — CONTROLADOR DE ESTORNOS DE PEDIDOS (PORTAL DO PRODUTOR & SAC)
 * Busca Transacional, Seleção de Ingressos, Validação de Check-in e Submissão
 * ============================================================================
 */

import { refundService } from '../services/refundService.js';
import { financialApprovalService } from '../services/financialApprovalService.js';
import { accessControlService } from '../services/accessControlService.js';

let selectedOrder = null;
let selectedTicketIds = [];

export const refundController = {
  currentProducerId: 'prod-1',

  init() {
    this.bindEvents();
    this.loadRefundView();
  },

  /**
   * Renderiza a visão completa de estornos no DOM
   */
  loadRefundView(producerId = 'prod-1') {
    this.currentProducerId = producerId;
    const viewSection = document.getElementById('view-financial-refunds');
    if (!viewSection) return;

    const user = accessControlService.getCurrentUser() || { name: 'Produtor Titular', id: 'user-producer-joao' };
    const myRefundRequests = financialApprovalService.listRequests({ type: 'ESTORNO', producerId });
    const pendingRefunds = myRefundRequests.filter(r => r.status === 'AGUARDANDO_ANALISE' || r.status === 'EM_ANALISE' || r.status === 'AGUARDANDO_APROVACAO');
    const completedRefunds = myRefundRequests.filter(r => r.status === 'CONCLUIDA');
    const totalRefundedAmount = completedRefunds.reduce((acc, r) => acc + (r.amount || 0), 0);

    viewSection.innerHTML = `
      <div class="card card-body shadow-sm d-flex flex-row justify-content-between align-items-center py-2 mb-3" style="border-radius: 6px;">
        <div>
          <h5 class="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <i class="ph-arrow-counter-clockwise text-danger"></i> Central de Estornos e Devoluções
          </h5>
          <span class="fs-xs text-muted">Vínculo transacional obrigatório • Ingressos consumidos • Submissão para análise Disk</span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-light text-dark border fs-xs">
            <i class="ph-user me-1 text-primary"></i> ${user.name}
          </span>
        </div>
      </div>

      <!-- KPIs da Gestão de Estornos -->
      <div class="row g-2 mb-3">
        <div class="col-6 col-md">
          <div class="card border shadow-sm p-3 bg-white h-100">
            <span class="text-muted fs-xxs text-uppercase fw-bold d-block mb-1">Total Estornado</span>
            <strong class="fs-5 text-dark font-monospace">R$ ${totalRefundedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            <span class="text-muted fs-xxs d-block mt-1">${completedRefunds.length} devoluções concluídas</span>
          </div>
        </div>
        <div class="col-6 col-md">
          <div class="card border border-warning-subtle shadow-sm p-3 bg-warning-subtle h-100">
            <span class="text-warning-emphasis fs-xxs text-uppercase fw-bold d-block mb-1">Solicitações em Análise</span>
            <strong class="fs-5 text-warning-emphasis font-monospace">${pendingRefunds.length}</strong>
            <span class="text-muted fs-xxs d-block mt-1">Aguardando Financeiro Disk</span>
          </div>
        </div>
        <div class="col-6 col-md">
          <div class="card border shadow-sm p-3 bg-white h-100">
            <span class="text-muted fs-xxs text-uppercase fw-bold d-block mb-1">Pedidos Elegíveis Teste</span>
            <strong class="fs-5 text-primary font-monospace">3 Pedidos</strong>
            <span class="text-muted fs-xxs d-block mt-1">PED-123456, 123457, 123458</span>
          </div>
        </div>
        <div class="col-6 col-md">
          <div class="card border shadow-sm p-3 bg-white h-100">
            <span class="text-muted fs-xxs text-uppercase fw-bold d-block mb-1">Política Geral CDC</span>
            <strong class="fs-5 text-success font-monospace">7 Dias</strong>
            <span class="text-muted fs-xxs d-block mt-1">Direito de arrependimento</span>
          </div>
        </div>
      </div>

      <!-- Bloco Principal de Busca e Solicitação -->
      <div class="row g-3 mb-4">
        <!-- Coluna da Esquerda: Busca e Seleção do Pedido -->
        <div class="col-lg-5">
          <div class="card border shadow-sm h-100">
            <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
              <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
                <i class="ph-magnifying-glass text-primary"></i> 1. Localizar Transação Original
              </strong>
              <span class="badge bg-secondary-subtle text-dark fs-xxs">Obrigatório</span>
            </div>
            <div class="card-body p-3">
              <div class="mb-3">
                <label class="form-label fs-xs fw-semibold mb-1" for="refund-order-search-input">
                  Número do Pedido, CPF, Nome ou ID Transação
                </label>
                <div class="input-group input-group-sm">
                  <input type="text" class="form-control" id="refund-order-search-input" placeholder="Ex: PED-123456 ou Carlos ou CIELO" value="PED-123456">
                  <button class="btn btn-primary fw-bold" id="btn-search-refund-order" onclick="window.refundController.searchOrder()">
                    <i class="ph-magnifying-glass me-1"></i> Buscar
                  </button>
                </div>
                <div class="form-text fs-xxs text-muted mt-1">
                  Exemplos cadastrados: <a href="javascript:void(0)" onclick="window.refundController.quickSearch('PED-123456')">PED-123456 (Check-in feito)</a>, <a href="javascript:void(0)" onclick="window.refundController.quickSearch('PED-123457')">PED-123457 (PIX)</a>, <a href="javascript:void(0)" onclick="window.refundController.quickSearch('PED-123458')">PED-123458 (Camarote)</a>
                </div>
              </div>

              <!-- Painel do Pedido Localizado -->
              <div id="refund-order-details-box" style="display: none;">
                <!-- Preenchido dinamicamente via renderOrderDetails -->
              </div>

              <div id="refund-order-empty-box" class="p-4 text-center text-muted bg-light rounded border">
                <i class="ph-receipt fs-2 text-secondary mb-2 d-block"></i>
                <span class="fs-xs d-block fw-semibold text-dark">Nenhum pedido selecionado</span>
                <span class="fs-xxs text-muted">Faça uma busca acima para carregar a transação original e os ingressos associados.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna da Direita: Formulário de Solicitação de Estorno -->
        <div class="col-lg-7">
          <div class="card border shadow-sm h-100">
            <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
              <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
                <i class="ph-arrow-counter-clockwise text-danger"></i> 2. Parâmetros da Solicitação de Estorno
              </strong>
              <span class="badge bg-danger-subtle text-danger border border-danger-subtle fs-xxs">Operação Controlada</span>
            </div>
            <div class="card-body p-3">
              <form id="form-submit-refund" onsubmit="event.preventDefault(); window.refundController.submitRefundRequest();">
                <div id="refund-form-fields-container" style="display: none;">
                  <!-- Seleção de Ingressos do Pedido -->
                  <div class="mb-3">
                    <label class="form-label fs-xs fw-semibold mb-1 d-flex justify-content-between">
                      <span>Ingressos a Estornar</span>
                      <span class="fs-xxs text-muted">Selecione para calcular estorno parcial</span>
                    </label>
                    <div id="refund-tickets-list" class="border rounded p-2 bg-light mb-2">
                      <!-- Renderizado dinamicamente -->
                    </div>
                  </div>

                  <!-- Alerta Crítico se houver ingressos com Check-in realizado -->
                  <div id="refund-checked-in-alert" class="alert alert-danger py-2 px-3 fs-xs mb-3" style="display: none;">
                    <i class="ph-warning-octagon me-1 fs-6 align-middle"></i>
                    <strong>Alerta Crítico de Portaria:</strong> Um ou mais ingressos selecionados já foram validados/consumidos na portaria! A solicitação será encaminhada para alçada <strong>Nível 2 / Gestor Financeiro</strong> para autorização de exceção.
                  </div>

                  <!-- Alerta de Venda Já Repassada -->
                  <div id="refund-payout-alert" class="alert alert-warning py-2 px-3 fs-xs mb-3" style="display: none;">
                    <i class="ph-info me-1 fs-6 align-middle"></i>
                    <strong>Aviso Contábil:</strong> O valor desta venda já foi repassado anteriormente ao produtor. O valor devolvido gerará <strong>débito imediato</strong> no saldo disponível do evento.
                  </div>

                  <div class="row g-2 mb-3">
                    <div class="col-md-6">
                      <label class="form-label fs-xs fw-semibold mb-1" for="refund-reason-category">Motivo Oficial</label>
                      <select class="form-select form-select-sm" id="refund-reason-category" required>
                        <option value="DESISTENCIA_CDC">Desistência da Compra (CDC - 7 Dias)</option>
                        <option value="EVENTO_CANCELADO">Cancelamento ou Adiamento de Evento</option>
                        <option value="ERRO_COMPRA">Erro de Categoria/Data pelo Comprador</option>
                        <option value="FRAUDE_PREVENTIVA">Prevenção Antifraude / Chargeback</option>
                        <option value="DUPLICIDADE_PAGAMENTO">Cobrança em Duplicidade</option>
                        <option value="ACORDO_COMERCIAL">Acordo Comercial Excepcional</option>
                        <option value="OUTRO">Outro Motivo Operacional</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fs-xs fw-semibold mb-1" for="refund-amount-display">Valor a Estornar (R$)</label>
                      <div class="input-group input-group-sm">
                        <span class="input-group-text bg-light text-muted font-monospace">R$</span>
                        <input type="number" step="0.01" class="form-control fw-bold text-danger font-monospace" id="refund-amount-input" required readonly>
                      </div>
                      <div class="form-text fs-xxs text-muted">Calculado pela soma dos ingressos selecionados.</div>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fs-xs fw-semibold mb-1" for="refund-justification">Justificativa Detalhada</label>
                    <textarea class="form-control form-control-sm" id="refund-justification" rows="2" placeholder="Descreva os fatos que fundamentam o estorno e o histórico de atendimento..." required></textarea>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fs-xs fw-semibold mb-1" for="refund-attachment">Comprovante / Anexo (Opcional)</label>
                    <input type="file" class="form-control form-control-sm" id="refund-attachment">
                    <div class="form-text fs-xxs text-muted">Anexe prints de conversa com o cliente, e-mail de solicitação ou boletim de ocorrência.</div>
                  </div>

                  <!-- Botão Oficial: SOLICITAR ESTORNO (Regra: Nunca 'Estornar Agora') -->
                  <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span class="fs-xxs text-muted">
                      <i class="ph-shield-check text-success me-1"></i> Submissão para análise do Financeiro Disk
                    </span>
                    <button type="submit" class="btn btn-danger btn-sm fw-bold px-4 d-flex align-items-center gap-1" id="btn-submit-refund-action">
                      <i class="ph-paper-plane-tilt"></i> SOLICITAR ESTORNO
                    </button>
                  </div>
                </div>

                <div id="refund-form-placeholder" class="p-4 text-center text-muted bg-light rounded border">
                  <i class="ph-arrow-counter-clockwise fs-2 text-secondary mb-2 d-block"></i>
                  <span class="fs-xs fw-semibold text-dark d-block">Aguardando seleção de pedido</span>
                  <span class="fs-xxs text-muted">Selecione uma transação à esquerda para habilitar a parametrização do estorno.</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabela de Solicitações Recentes de Estorno -->
      <div class="card border shadow-sm">
        <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
          <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
            <i class="ph-clock-counter-clockwise text-primary"></i> Minhas Solicitações de Estorno
          </strong>
          <span class="badge bg-secondary-subtle text-dark fs-xxs">Total: ${myRefundRequests.length}</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 fs-xs">
            <thead class="table-light">
              <tr>
                <th>Protocolo</th>
                <th>Pedido Original</th>
                <th>Cliente</th>
                <th>Adquirente</th>
                <th class="text-end">Valor Solicitado</th>
                <th class="text-center">Status</th>
                <th>Data</th>
                <th class="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${myRefundRequests.length > 0 ? myRefundRequests.map(r => `
                <tr>
                  <td><strong class="font-monospace text-primary">${r.protocol || r.id}</strong></td>
                  <td><span class="badge bg-light text-dark border font-monospace">#${r.payload?.orderNumber || r.payload?.orderId || '—'}</span></td>
                  <td>${r.payload?.client?.name || r.requestedBy?.name || 'Cliente'}</td>
                  <td><span class="badge bg-light text-muted border">${r.payload?.gateway || 'GATEWAY'}</span></td>
                  <td class="text-end fw-bold text-danger font-monospace">R$ ${r.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td class="text-center">
                    <span class="badge ${r.badgeClass} fs-xxs">${r.statusLabelPtBr}</span>
                  </td>
                  <td class="text-muted fs-xxs">${new Date(r.createdAt).toLocaleDateString('pt-BR')} ${new Date(r.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td class="text-end">
                    <button class="btn btn-outline-primary btn-xs" onclick="window.financialApprovalsController.openDrawer('${r.id}')">
                      <i class="ph-eye me-1"></i> Acompanhar
                    </button>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="8" class="text-center py-4 text-muted fs-xs">
                    Nenhuma solicitação de estorno realizada até o momento.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Carrega o primeiro pedido por padrão
    this.searchOrder('PED-123456');
  },

  quickSearch(term) {
    const input = document.getElementById('refund-order-search-input');
    if (input) input.value = term;
    this.searchOrder(term);
  },

  /**
   * Busca e exibe detalhes da transação
   */
  searchOrder(explicitQuery = null) {
    const input = document.getElementById('refund-order-search-input');
    const q = explicitQuery || (input ? input.value : '');
    const results = refundService.searchOrders(q);

    const detailsBox = document.getElementById('refund-order-details-box');
    const emptyBox = document.getElementById('refund-order-empty-box');
    const formFields = document.getElementById('refund-form-fields-container');
    const formPlaceholder = document.getElementById('refund-form-placeholder');

    if (!results || results.length === 0) {
      selectedOrder = null;
      if (detailsBox) detailsBox.style.display = 'none';
      if (emptyBox) {
        emptyBox.style.display = 'block';
        emptyBox.innerHTML = `
          <i class="ph-warning-circle fs-2 text-warning mb-2 d-block"></i>
          <span class="fs-xs fw-semibold text-dark d-block">Nenhum pedido encontrado</span>
          <span class="fs-xxs text-muted">Nenhum registro coincide com "${q}". Tente PED-123456.</span>
        `;
      }
      if (formFields) formFields.style.display = 'none';
      if (formPlaceholder) formPlaceholder.style.display = 'block';
      return;
    }

    selectedOrder = results[0];
    selectedTicketIds = selectedOrder.tickets.map(t => t.id);

    if (emptyBox) emptyBox.style.display = 'none';
    if (detailsBox) {
      detailsBox.style.display = 'block';
      this.renderOrderDetails(selectedOrder);
    }

    if (formPlaceholder) formPlaceholder.style.display = 'none';
    if (formFields) {
      formFields.style.display = 'block';
      this.renderFormForOrder(selectedOrder);
    }
  },

  renderOrderDetails(order) {
    const box = document.getElementById('refund-order-details-box');
    if (!box) return;

    box.innerHTML = `
      <div class="border rounded p-3 bg-white">
        <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
          <div>
            <strong class="fs-xs text-dark font-monospace">Pedido #${order.orderNumber}</strong>
            <span class="badge bg-success-subtle text-success ms-1 fs-xxs">${order.status}</span>
          </div>
          <span class="badge bg-light text-muted border font-monospace fs-xxs">${order.payment?.gateway} (${order.payment?.method})</span>
        </div>

        <table class="table table-sm table-borderless fs-xxs mb-2">
          <tr><td class="text-muted">Comprador:</td><td class="text-dark fw-bold">${order.client?.name}</td></tr>
          <tr><td class="text-muted">CPF:</td><td class="text-dark font-monospace">${order.client?.cpf}</td></tr>
          <tr><td class="text-muted">E-mail:</td><td class="text-dark">${order.client?.email}</td></tr>
          <tr><td class="text-muted">Evento:</td><td class="text-dark">${order.eventName}</td></tr>
          <tr><td class="text-muted">Transação (TID):</td><td class="text-dark font-monospace">${order.payment?.transactionId}</td></tr>
        </table>

        <div class="p-2 bg-light rounded border mb-2 fs-xxs font-monospace">
          <div class="d-flex justify-content-between"><span>Valor Pago:</span> <strong>R$ ${order.payment.originalAmount.toFixed(2)}</strong></div>
          <div class="d-flex justify-content-between text-muted"><span>Taxas Plataforma:</span> <span>R$ ${order.payment.fees.toFixed(2)}</span></div>
          <div class="d-flex justify-content-between text-warning"><span>Já Estornado:</span> <span>R$ ${order.payment.alreadyRefunded.toFixed(2)}</span></div>
          <div class="d-flex justify-content-between text-success fw-bold border-top pt-1 mt-1">
            <span>Saldo Estornável:</span> <span>R$ ${order.payment.availableForRefund.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;
  },

  renderFormForOrder(order) {
    const list = document.getElementById('refund-tickets-list');
    const checkedInAlert = document.getElementById('refund-checked-in-alert');
    const payoutAlert = document.getElementById('refund-payout-alert');
    const amountInput = document.getElementById('refund-amount-input');

    if (!list) return;

    let hasCheckedIn = false;
    list.innerHTML = order.tickets.map(t => {
      const isValidated = t.status === 'validado' || t.checkedIn;
      if (isValidated) hasCheckedIn = true;
      const isCancelled = t.status === 'cancelado';

      return `
        <div class="form-check d-flex justify-content-between align-items-center py-1 border-bottom">
          <div>
            <input class="form-check-input ticket-select-checkbox" type="checkbox" value="${t.id}" id="chk-ticket-${t.id}" 
                   ${isCancelled ? 'disabled' : 'checked'} onchange="window.refundController.onTicketSelectChange()">
            <label class="form-check-label fs-xs ms-1 ${isCancelled ? 'text-decoration-line-through text-muted' : 'text-dark'}" for="chk-ticket-${t.id}">
              <strong>${t.category}</strong> (${t.sector}) - <span class="font-monospace">#${t.id}</span>
            </label>
          </div>
          <div class="d-flex align-items-center gap-2">
            ${isValidated ? `
              <span class="badge bg-danger-subtle text-danger border border-danger-subtle fs-xxs">
                <i class="ph-check-circle me-1"></i> Validado na Portaria
              </span>
            ` : isCancelled ? `
              <span class="badge bg-secondary-subtle text-muted fs-xxs">Já Cancelado</span>
            ` : `
              <span class="badge bg-success-subtle text-success fs-xxs">Disponível</span>
            `}
            <strong class="font-monospace text-dark fs-xs">R$ ${t.price.toFixed(2)}</strong>
          </div>
        </div>
      `;
    }).join('');

    if (checkedInAlert) {
      checkedInAlert.style.display = hasCheckedIn ? 'block' : 'none';
    }
    if (payoutAlert) {
      payoutAlert.style.display = order.payment.alreadyPaidOutToProducer ? 'block' : 'none';
    }

    this.recalculateRefundAmount();
  },

  onTicketSelectChange() {
    this.recalculateRefundAmount();
  },

  recalculateRefundAmount() {
    if (!selectedOrder) return;
    const checkboxes = document.querySelectorAll('.ticket-select-checkbox:checked');
    selectedTicketIds = Array.from(checkboxes).map(c => c.value);

    let total = 0;
    selectedOrder.tickets.forEach(t => {
      if (selectedTicketIds.includes(t.id)) {
        total += t.price;
      }
    });

    const amountInput = document.getElementById('refund-amount-input');
    if (amountInput) {
      amountInput.value = total.toFixed(2);
    }
  },

  /**
   * Submete a solicitação de estorno formal para a Central de Solicitações Disk
   */
  async submitRefundRequest() {
    if (!selectedOrder) {
      alert('Selecione uma transação original primeiro.');
      return;
    }

    const amountInput = document.getElementById('refund-amount-input');
    const amount = Number(amountInput?.value) || 0;
    if (amount <= 0) {
      alert('Selecione ao menos um ingresso válido para compor o valor do estorno.');
      return;
    }

    const reasonCategory = document.getElementById('refund-reason-category')?.value || 'DESISTENCIA_CDC';
    const justification = document.getElementById('refund-justification')?.value || '';

    const btn = document.getElementById('btn-submit-refund-action');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Enviando...';
    }

    try {
      const user = accessControlService.getCurrentUser() || { name: 'João Silva', id: 'user-producer-joao', role: 'PRODUTOR' };
      const selectedTickets = selectedOrder.tickets.filter(t => selectedTicketIds.includes(t.id));
      const hasCheckedInTickets = selectedTickets.some(t => t.status === 'validado' || t.checkedIn === true);

      const res = await financialApprovalService.createRequest({
        type: 'ESTORNO',
        producerId: selectedOrder.producerId || this.currentProducerId,
        producerName: 'Parque Jaime Lerner',
        eventId: selectedOrder.eventId,
        eventName: selectedOrder.eventName,
        requestedBy: {
          id: user.id,
          name: user.name,
          role: user.profile || 'PRODUTOR',
          email: user.email || 'produtor@diskingressos.com.br'
        },
        amount,
        justification: `[${reasonCategory}] ${justification}`,
        payload: {
          orderId: selectedOrder.id,
          orderNumber: selectedOrder.orderNumber,
          order: selectedOrder,
          refundType: selectedTickets.length === selectedOrder.tickets.length ? 'TOTAL' : 'PARCIAL',
          reasonCategory,
          ticketIds: selectedTicketIds,
          tickets: selectedTickets,
          client: selectedOrder.client,
          gateway: selectedOrder.payment?.gateway,
          transactionId: selectedOrder.payment?.transactionId,
          hasCheckedInTickets,
          alreadyPaidOut: Boolean(selectedOrder.payment?.alreadyPaidOutToProducer)
        }
      });

      if (res && res.ok) {
        alert(`Solicitação de estorno enviada com sucesso ao Financeiro Disk!\nProtocolo: ${res.data.protocol || res.data.id}\nStatus: Aguardando Análise.`);
        this.loadRefundView(this.currentProducerId);
      }
    } catch (err) {
      alert(`Falha ao registrar solicitação: ${err.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph-paper-plane-tilt"></i> SOLICITAR ESTORNO';
      }
    }
  },

  bindEvents() {
    window.refundController = this;
  }
};

if (typeof window !== 'undefined') {
  window.refundController = refundController;
}
