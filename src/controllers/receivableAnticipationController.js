/**
 * ============================================================================
 * DISK — CONTROLADOR DE ANTECIPAÇÕES DE RECEBÍVEIS (PORTAL DO PRODUTOR)
 * Gestão de Base Elegível, Simulação Financeira e Submissão para Central Disk
 * ============================================================================
 */

import { receivableAnticipationService } from '../services/receivableAnticipationService.js';
import { financialApprovalService } from '../services/financialApprovalService.js';
import { accessControlService } from '../services/accessControlService.js';

export const receivableAnticipationController = {
  currentProducerId: 'prod-1',
  selectedEventId: '3368',

  init() {
    this.bindEvents();
    this.loadAdvanceView(this.currentProducerId);
  },

  /**
   * Carrega a visão de antecipação com métricas e histórico
   */
  async loadAdvanceView(producerId = 'prod-1') {
    this.currentProducerId = producerId;
    const pane = document.getElementById('subpane-antecipacoes');
    if (!pane) return;

    try {
      const baseInfo = await receivableAnticipationService.calculateEligibleBase(this.selectedEventId, producerId);
      const allAnticipations = financialApprovalService.listRequests({ type: 'ANTECIPACAO', producerId });
      const openAnticipations = allAnticipations.filter(r => 
        r.status === 'AGUARDANDO_APROVACAO' || 
        r.status === 'AGUARDANDO_ANALISE' || 
        r.status === 'EM_ANALISE' || 
        r.status === 'AGUARDANDO_ACEITE_PRODUTOR'
      );

      // Renderiza Métricas Operacionais no topo da aba
      pane.innerHTML = `
        <!-- Métricas Oficiais da Antecipação -->
        <div class="row g-2 mb-3">
          <div class="col-6 col-md">
            <div class="card border shadow-sm p-3 bg-white h-100">
              <span class="text-muted fs-xxs text-uppercase fw-bold d-block mb-1">Valor Futuro Previsto</span>
              <strong class="fs-5 text-dark font-monospace">R$ ${baseInfo.futureReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              <span class="text-muted fs-xxs d-block mt-1">Agenda de vendas futuras</span>
            </div>
          </div>
          <div class="col-6 col-md">
            <div class="card border border-primary-subtle shadow-sm p-3 bg-primary-subtle h-100">
              <span class="text-primary fs-xxs text-uppercase fw-bold d-block mb-1">Valor Potencialmente Elegível</span>
              <strong class="fs-5 text-primary font-monospace">R$ ${baseInfo.eligibleBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              <span class="text-muted fs-xxs d-block mt-1">Base descontada de retenções</span>
            </div>
          </div>
          <div class="col-6 col-md">
            <div class="card border shadow-sm p-3 bg-white h-100">
              <span class="text-muted fs-xxs text-uppercase fw-bold d-block mb-1">Valores Já Comprometidos</span>
              <strong class="fs-5 text-warning font-monospace">R$ ${(baseInfo.committed + baseInfo.reserves + baseInfo.retentions).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              <span class="text-muted fs-xxs d-block mt-1">Reservas e retenção cautelar</span>
            </div>
          </div>
          <div class="col-6 col-md">
            <div class="card border shadow-sm p-3 bg-white h-100">
              <span class="text-muted fs-xxs text-uppercase fw-bold d-block mb-1">Antecipações em Aberto</span>
              <strong class="fs-5 text-info font-monospace">${openAnticipations.length}</strong>
              <span class="text-muted fs-xxs d-block mt-1">Aguardando decisão</span>
            </div>
          </div>
          <div class="col-12 col-md">
            <div class="card border shadow-sm p-3 bg-white h-100">
              <span class="text-muted fs-xxs text-uppercase fw-bold d-block mb-1">Próximo Repasse Previsto</span>
              <strong class="fs-5 text-success font-monospace">${baseInfo.nextPayoutDate}</strong>
              <span class="text-muted fs-xxs d-block mt-1">Cronograma ordinário</span>
            </div>
          </div>
        </div>

        <!-- Formulário e Simulação de Nova Solicitação -->
        <div class="row g-3 mb-4">
          <div class="col-lg-6">
            <div class="card border shadow-sm h-100">
              <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
                  <i class="ph-hand-coins text-primary"></i> Solicitar Nova Antecipação
                </strong>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-xxs">Operação Controlada</span>
              </div>
              <div class="card-body p-3">
                <form id="form-advance-request" onsubmit="event.preventDefault(); window.submitAnticipationRequest();">
                  <div class="mb-2">
                    <label class="form-label fs-xs fw-semibold mb-1" for="advance-event-select">Evento com Recebíveis Elegíveis</label>
                    <select class="form-select form-select-sm" id="advance-event-select" onchange="window.onAdvanceEventChange(this.value)">
                      <option value="3368" ${this.selectedEventId === '3368' ? 'selected' : ''}>Experiência Música & Natureza (Base: R$ 95.000,00)</option>
                      <option value="3178" ${this.selectedEventId === '3178' ? 'selected' : ''}>Feijoada & Costela (Base: R$ 19.000,00)</option>
                    </select>
                  </div>
                  <div class="mb-2">
                    <label class="form-label fs-xs fw-semibold mb-1" for="advance-amount-input">Valor Pretendido (R$)</label>
                    <div class="input-group input-group-sm">
                      <span class="input-group-text">R$</span>
                      <input type="number" id="advance-amount-input" class="form-control" step="100" min="500" max="${baseInfo.eligibleBase || 50000}" value="15000" oninput="window.calculateAnticipationSimPage()">
                    </div>
                    <span class="fs-xxs text-muted">Limite disponível para este evento: R$ ${baseInfo.eligibleBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div class="mb-2">
                    <label class="form-label fs-xs fw-semibold mb-1" for="advance-justification-input">Justificativa da Antecipação</label>
                    <textarea id="advance-justification-input" class="form-control form-control-sm" rows="2" placeholder="Ex: Adiantamento para cobertura de despesas de infraestrutura e montagem.">Adiantamento de recebíveis para pagamento de fornecedores operacionais do evento.</textarea>
                  </div>
                  <div class="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
                    <button type="reset" class="btn btn-sm btn-light border">Limpar</button>
                    <button type="submit" class="btn btn-sm btn-primary fw-bold px-3 d-flex align-items-center gap-1 shadow-sm">
                      <i class="ph-paper-plane-tilt"></i> Solicitar Antecipação
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="card border border-primary-subtle shadow-sm h-100 bg-white">
              <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
                  <i class="ph-calculator text-primary"></i> Simulação Oficial da Operação
                </strong>
                <span class="badge bg-info-subtle text-info border border-info-subtle fs-xxs">Cálculo Contratual</span>
              </div>
              <div class="card-body p-3">
                <div class="payout-card-summary mb-3 font-monospace fs-xs">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="text-muted font-sans-serif">Valor Solicitado:</span>
                    <strong class="text-dark" id="sim-advance-gross">R$ 15.000,00</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-1 text-danger">
                    <span class="font-sans-serif">Taxa de Antecipação (<span id="sim-advance-rate-label">${baseInfo.contractRate}%</span> a.m.):</span>
                    <span id="sim-advance-cost">- R$ 375,00</span>
                  </div>
                  <div class="d-flex justify-content-between mb-1 text-muted">
                    <span class="font-sans-serif">Outros Encargos Aplicáveis:</span>
                    <span>R$ 0,00</span>
                  </div>
                  <hr class="my-2">
                  <div class="d-flex justify-content-between text-success fw-bold fs-sm">
                    <span class="font-sans-serif">Valor Líquido Estimado:</span>
                    <strong id="sim-advance-net">R$ 14.625,00</strong>
                  </div>
                  <div class="d-flex justify-content-between mt-1 text-dark fs-xxs">
                    <span class="font-sans-serif text-muted">Previsão Estimada de Liquidação:</span>
                    <span>Até 24h úteis pós-aprovação</span>
                  </div>
                </div>

                <!-- Aviso de Simulação Oficial -->
                <div class="alert alert-warning py-2 px-3 fs-xxs mb-0 border border-warning d-flex align-items-center gap-2">
                  <i class="ph-warning-circle text-warning fs-5"></i>
                  <span><strong>Atenção:</strong> Esta é uma simulação. O valor final está sujeito à análise e aprovação do Financeiro Disk.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabela de Solicitações de Antecipação do Produtor -->
        <div class="card border shadow-sm">
          <div class="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
            <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
              <i class="ph-list-checks text-primary"></i> Minhas Solicitações de Antecipação
            </strong>
            <span class="badge bg-light text-dark border fs-xxs">${allAnticipations.length} solicitações</span>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 fs-xs">
              <thead class="table-light">
                <tr>
                  <th>Protocolo</th>
                  <th>Evento</th>
                  <th class="text-end">Valor Bruto</th>
                  <th class="text-end">Taxa</th>
                  <th class="text-end">Valor Líquido</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th class="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${allAnticipations.length > 0 ? allAnticipations.map(req => {
                  const snap = req.payload?.advanceSnapshot || {};
                  return `
                    <tr>
                      <td class="font-monospace fw-bold text-primary">${req.protocol || req.id}</td>
                      <td>${req.eventName || 'Experiência Música & Natureza'}</td>
                      <td class="text-end font-monospace">R$ ${req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td class="text-end text-muted font-monospace">${snap.contractRate || 2.5}% a.m.</td>
                      <td class="text-end font-monospace fw-bold text-success">R$ ${(snap.estimatedNet || req.amount * 0.975).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td><span class="badge ${req.badgeClass} fs-xxs">${req.statusLabelPtBr}</span></td>
                      <td class="text-muted fs-xxs">${new Date(req.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td class="text-center">
                        <button class="btn btn-xs btn-outline-primary" onclick="window.openApprovalDecisionDrawer('${req.id}')">
                          <i class="ph-eye"></i> Detalhes
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="8" class="text-center py-4 text-muted">Nenhuma solicitação de antecipação realizada até o momento.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      `;

      this.handleSimulationInput();
    } catch (err) {
      console.error('[receivableAnticipationController] Falha ao carregar tela:', err);
    }
  },

  /**
   * Atualização dinâmica da simulação ao digitar valor
   */
  async handleSimulationInput() {
    const valInput = document.getElementById('advance-amount-input');
    if (!valInput) return;
    const amount = Number(valInput.value) || 0;

    const sim = await receivableAnticipationService.simulateAnticipation({
      eventId: this.selectedEventId,
      producerId: this.currentProducerId,
      requestedAmount: amount
    });

    const grossEl = document.getElementById('sim-advance-gross');
    const rateEl = document.getElementById('sim-advance-rate-label');
    const costEl = document.getElementById('sim-advance-cost');
    const netEl = document.getElementById('sim-advance-net');

    if (grossEl) grossEl.textContent = `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (rateEl) rateEl.textContent = `${sim.contractRate}%`;
    if (costEl) costEl.textContent = `- R$ ${sim.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (netEl) netEl.textContent = `R$ ${sim.estimatedNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  },

  /**
   * Dispara a solicitação oficial para a Central de Solicitações Financeiras
   */
  async submitAnticipation() {
    const valInput = document.getElementById('advance-amount-input');
    const justInput = document.getElementById('advance-justification-input');
    const eventSelect = document.getElementById('advance-event-select');

    const amount = Number(valInput?.value) || 0;
    const justification = justInput?.value?.trim() || '';
    const eventId = eventSelect?.value || this.selectedEventId;
    const eventName = eventSelect?.options[eventSelect.selectedIndex]?.text?.split('(')[0]?.trim() || 'Evento';

    if (amount <= 0) {
      alert('Por favor, informe um valor pretendido válido.');
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
        type: 'ANTECIPACAO',
        producerId: this.currentProducerId,
        producerName: 'DiskIngressos Eventos Ltda',
        eventId,
        eventName,
        requestedBy: user,
        amount,
        justification,
        payload: {
          requestedPercent: '70%',
          discountRate: '2.5% a.m.'
        }
      });

      if (res && res.ok) {
        if (window.showAppNotification) {
          window.showAppNotification(`Solicitação de antecipação criada com sucesso! Protocolo: ${res.data.protocol || res.data.id}`, 'success');
        } else {
          alert(`Solicitação de antecipação criada com sucesso! Protocolo: ${res.data.protocol || res.data.id}`);
        }
        await this.loadAdvanceView(this.currentProducerId);
        if (window.refreshApprovalsDashboard) {
          window.refreshApprovalsDashboard();
        }
      }
    } catch (err) {
      alert(`Erro ao solicitar antecipação: ${err.message}`);
    }
  },

  bindEvents() {
    window.receivableAnticipationController = this;
    window.initAnticipationView = (prodId) => this.loadAdvanceView(prodId);
    window.calculateAnticipationSimPage = () => this.handleSimulationInput();
    window.submitAnticipationRequest = () => this.submitAnticipation();
    window.onAdvanceEventChange = (evId) => {
      this.selectedEventId = evId;
      this.loadAdvanceView(this.currentProducerId);
    };
  }
};
