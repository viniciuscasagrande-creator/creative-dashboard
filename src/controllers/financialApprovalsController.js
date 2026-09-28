/**
 * ============================================================================
 * MEGA PACOTE — PERFIL FINANCEIRO + CENTRAL UNIFICADA DE APROVAÇÕES
 * Controlador da Central de Aprovações (src/controllers/financialApprovalsController.js)
 * ============================================================================
 */

import { financialApprovalService } from '../services/financialApprovalService.js';
import { financialApprovalRulesService } from '../services/financialApprovalRulesService.js';
import { financialApprovalNotificationService } from '../services/financialApprovalNotificationService.js';
import { accessControlService } from '../services/accessControlService.js';

// Estado local da tela de aprovações
let currentRole = 'FINANCEIRO'; // 'FINANCEIRO' | 'PRODUTOR' | 'ADMINISTRADOR'
let activeTab = 'todas';        // 'todas' | 'pendentes' | 'em_analise' | 'devolvidas' | 'aprovadas' | 'rejeitadas' | 'concluidas'
let currentActor = accessControlService.getCurrentUser() || {
  id: 'user-fin-carlos',
  name: 'Carlos Lima',
  role: 'GESTOR_FINANCEIRO',
  email: 'carlos.lima@diskingressos.com.br'
};
let selectedRequestId = null;

export const financialApprovalsController = {
  init() {
    this.bindGlobalEvents();
    this.refreshDashboard();
    financialApprovalNotificationService.refreshNavbarBell(currentRole);
  },

  /**
   * Alterna perfil ativo no seletor de simulação
   */
  switchRole(role) {
    currentRole = role;
    if (role === 'PRODUTOR') {
      currentActor = accessControlService.switchCurrentUser('user-producer-joao');
    } else if (role === 'ADMINISTRADOR') {
      currentActor = accessControlService.switchCurrentUser('user-admin-master');
    } else {
      currentRole = 'FINANCEIRO';
      currentActor = accessControlService.switchCurrentUser('user-fin-carlos');
    }

    // Atualiza badges visuais do seletor
    const btnProd = document.getElementById('btn-profile-produtor');
    const btnFin = document.getElementById('btn-profile-financeiro');
    const btnAdmin = document.getElementById('btn-profile-admin');

    if (btnProd) btnProd.className = `btn btn-xs ${role === 'PRODUTOR' ? 'btn-primary active' : 'btn-outline-primary'}`;
    if (btnFin) btnFin.className = `btn btn-xs ${role === 'FINANCEIRO' ? 'btn-success active' : 'btn-outline-success'}`;
    if (btnAdmin) btnAdmin.className = `btn btn-xs ${role === 'ADMINISTRADOR' ? 'btn-dark active' : 'btn-outline-dark'}`;

    const labelIndicator = document.getElementById('approval-current-role-badge');
    if (labelIndicator) {
      labelIndicator.textContent = currentActor.name;
    }

    this.refreshDashboard();
    financialApprovalNotificationService.refreshNavbarBell(currentRole);
  },

  /**
   * Alterna a aba ativa da fila
   */
  switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-approval-link').forEach(btn => {
      btn.classList.remove('active', 'btn-primary', 'text-white');
      btn.classList.add('btn-light', 'text-dark');
    });

    const activeBtn = document.getElementById(`tab-appr-${tab}`);
    if (activeBtn) {
      activeBtn.classList.remove('btn-light', 'text-dark');
      activeBtn.classList.add('active', 'btn-primary', 'text-white');
    }

    this.renderTable();
  },

  /**
   * Atualiza todo o painel, KPIs e badges
   */
  refreshDashboard() {
    this.renderKpis();
    this.renderTable();
    this.updateSidebarBadge();
  },

  /**
   * Atualiza o badge reativo no menu lateral
   */
  updateSidebarBadge() {
    const stats = financialApprovalService.getStats();
    const navBadge = document.getElementById('fin-nav-approvals-badge');
    if (navBadge) {
      navBadge.textContent = String(stats.pendingCount);
      navBadge.style.display = stats.pendingCount > 0 ? 'inline-block' : 'none';
    }
  },

  /**
   * Renderiza os 5 Cards de Indicadores Superiores
   */
  renderKpis() {
    const stats = financialApprovalService.getStats(currentRole === 'PRODUTOR' ? currentActor.producerId : null);

    const kpiPendingCount = document.getElementById('kpi-appr-pending-count');
    const kpiPendingAmount = document.getElementById('kpi-appr-pending-amount');
    const kpiUrgentCount = document.getElementById('kpi-appr-urgent-count');
    const kpiSlaExpiring = document.getElementById('kpi-appr-sla-expiring');
    const kpiApprovedToday = document.getElementById('kpi-appr-approved-today');

    if (kpiPendingCount) kpiPendingCount.textContent = String(stats.pendingCount);
    if (kpiPendingAmount) kpiPendingAmount.textContent = `R$ ${stats.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (kpiUrgentCount) kpiUrgentCount.textContent = String(stats.urgentCount);
    if (kpiSlaExpiring) kpiSlaExpiring.textContent = String(stats.slaExpiringCount);
    if (kpiApprovedToday) kpiApprovedToday.textContent = String(stats.approvedTodayCount);
  },

  /**
   * Renderiza a tabela operacional de solicitações
   */
  renderTable() {
    const tbody = document.getElementById('table-financial-approvals-body');
    if (!tbody) return;

    const search = document.getElementById('input-filter-approval-search')?.value || '';
    const type = document.getElementById('select-filter-approval-type')?.value || 'TODOS';
    const risk = document.getElementById('select-filter-approval-risk')?.value || 'TODOS';

    let statusFilter = 'TODAS';
    if (activeTab === 'pendentes') statusFilter = 'PENDENTES';
    else if (activeTab === 'em_analise') statusFilter = 'EM_ANALISE';
    else if (activeTab === 'devolvidas') statusFilter = 'DEVOLVIDA';
    else if (activeTab === 'aprovadas') statusFilter = 'APROVADA';
    else if (activeTab === 'rejeitadas') statusFilter = 'REJEITADA';
    else if (activeTab === 'concluidas') statusFilter = 'CONCLUIDA';

    const list = financialApprovalService.listRequests({
      status: statusFilter,
      type,
      riskLevel: risk,
      search,
      producerId: currentRole === 'PRODUTOR' ? currentActor.producerId : null
    });

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-5 text-muted">
            <i class="ph-files fs-1 d-block mb-2 opacity-50"></i>
            <strong>Nenhuma solicitação encontrada</strong><br>
            <span class="fs-xs">Não há operações correspondentes aos filtros selecionados.</span>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(req => {
      const typeMeta = financialApprovalRulesService.getTypeMeta(req.type);
      const isUrgent = req.riskLevel === 'ALTO' || req.riskLevel === 'CRITICO';
      const slaClass = req.slaStatus === 'VENCIDO' ? 'badge bg-danger' : (req.slaStatus === 'VENCENDO' ? 'badge bg-warning text-dark' : 'badge bg-light text-muted border');
      const isMaker = currentActor.id === req.requestedBy?.id;

      return `
        <tr class="${isUrgent && req.status === 'AGUARDANDO_APROVACAO' ? 'table-warning-subtle' : ''}">
          <td class="fw-bold fs-xs text-primary font-monospace">
            ${req.id}
          </td>
          <td>
            <span class="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
              <i class="${typeMeta.icon} ${typeMeta.color}"></i> ${typeMeta.label}
            </span>
          </td>
          <td>
            <div class="fw-semibold text-dark fs-xs">${req.producerName}</div>
            <div class="text-muted fs-xxs">${req.eventName || 'Operação Geral'}</div>
          </td>
          <td class="fw-bold fs-xs ${req.amount > 0 ? 'text-dark' : 'text-muted'}">
            ${req.amount > 0 ? `R$ ${req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
          </td>
          <td>
            <div class="fs-xs text-dark">${req.requestedBy.name}</div>
            <div class="text-muted fs-xxs">${req.requestedBy.role}</div>
          </td>
          <td class="fs-xxs text-muted">
            ${new Date(req.createdAt).toLocaleDateString('pt-BR')} ${new Date(req.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </td>
          <td>
            <span class="badge bg-light text-dark border fs-xxs">${req.approvalLevelLabel}</span>
          </td>
          <td>
            <span class="${slaClass} fs-xxs">${req.slaStatus.replace('_', ' ')}</span>
          </td>
          <td>
            <span class="badge ${req.badgeClass} fs-xxs">${req.statusLabelPtBr}</span>
          </td>
          <td class="text-end">
            <button class="btn btn-xs btn-primary fw-bold d-inline-flex align-items-center gap-1 shadow-sm" onclick="window.openApprovalDecisionDrawer('${req.id}')">
              <i class="ph-magnifying-glass"></i> Analisar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Abre o Painel Lateral de Decisão (Drawer / Offcanvas)
   */
  openDrawer(id) {
    selectedRequestId = id;
    const req = financialApprovalService.getRequestById(id);
    if (!req) return;

    // Se estiver em aguardando e quem abriu foi Financeiro, inicia análise
    if (currentRole === 'FINANCEIRO' && req.status === 'AGUARDANDO_APROVACAO') {
      financialApprovalService.startAnalysis(id, currentActor);
    }

    const drawerElement = document.getElementById('offcanvas-approval-decision');
    const content = document.getElementById('offcanvas-approval-content');
    const footer = document.getElementById('offcanvas-approval-footer');

    if (!drawerElement || !content) return;

    const typeMeta = financialApprovalRulesService.getTypeMeta(req.type);
    const user = accessControlService.getCurrentUser() || currentActor;
    const isMaster = user.profile === 'ADMINISTRADOR' || user.profile === 'DEVELOPER';
    const isMaker = user.id === req.requestedBy?.id || (user.email && req.requestedBy?.email && user.email.toLowerCase() === req.requestedBy?.email.toLowerCase());
    const canApprove = accessControlService.can(user, 'financeiro.aprovacoes.aprovar', {
      producerId: req.producerId,
      eventId: req.eventId
    });
    const canReject = accessControlService.can(user, 'financeiro.aprovacoes.rejeitar', {
      producerId: req.producerId,
      eventId: req.eventId
    });
    const canReturn = accessControlService.can(user, 'financeiro.aprovacoes.devolver', {
      producerId: req.producerId,
      eventId: req.eventId
    });

    // 1. Bloco de Impacto Financeiro
    let impactHtml = '';
    if (req.financialImpact) {
      const fi = req.financialImpact;
      impactHtml = `
        <div class="card border border-primary-subtle bg-light mb-3 shadow-sm">
          <div class="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
            <strong class="fs-xs text-uppercase text-primary d-flex align-items-center gap-1">
              <i class="ph-scales"></i> Impacto Financeiro da Operação
            </strong>
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-xxs">Simulação em Tempo Real</span>
          </div>
          <div class="card-body p-3">
            <div class="row g-2 text-center">
              <div class="col-6 border-end">
                <span class="fs-xxs text-muted d-block text-uppercase fw-bold">Origem: ${fi.sourceEventName || 'Evento'}</span>
                <div class="d-flex justify-content-between fs-xs mt-1"><span>Saldo Atual:</span> <strong>R$ ${(fi.sourceBalanceBefore || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                <div class="d-flex justify-content-between fs-xs text-danger"><span>Operação:</span> <strong>${(fi.sourceAmount || 0) < 0 ? `- R$ ${Math.abs(fi.sourceAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</strong></div>
                <hr class="my-1">
                <div class="d-flex justify-content-between fs-xs fw-bold text-dark"><span>Saldo Pós:</span> <span class="text-success">R$ ${(fi.sourceBalanceAfter || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              </div>
              <div class="col-6">
                <span class="fs-xxs text-muted d-block text-uppercase fw-bold">Destino: ${fi.targetEventName || 'Favorecido'}</span>
                <div class="d-flex justify-content-between fs-xs mt-1"><span>Saldo Atual:</span> <strong>R$ ${(fi.targetBalanceBefore || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                <div class="d-flex justify-content-between fs-xs text-success"><span>Operação:</span> <strong>+ R$ ${(fi.targetAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                <hr class="my-1">
                <div class="d-flex justify-content-between fs-xs fw-bold text-dark"><span>Novo Saldo:</span> <span class="text-primary">R$ ${(fi.targetBalanceAfter || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Validações Automáticas
    const validationsHtml = req.automatedValidations && req.automatedValidations.length > 0 ? `
      <div class="card border mb-3 shadow-sm">
        <div class="card-header bg-white py-2 px-3 border-bottom">
          <strong class="fs-xs text-dark"><i class="ph-shield-check text-success me-1"></i> Validações Automáticas do Motor de Regras</strong>
        </div>
        <ul class="list-group list-group-flush fs-xs">
          ${req.automatedValidations.map(v => `
            <li class="list-group-item d-flex align-items-start gap-2 py-2">
              <i class="${v.passed ? 'ph-check-circle text-success' : 'ph-warning text-warning'} fs-5 mt-1"></i>
              <div>
                <strong class="text-dark d-block fs-xxs">${v.ruleTitle}</strong>
                <span class="text-muted fs-xxs">${v.message}</span>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    ` : '';

    // 3. Linha do Tempo e Auditoria
    const auditHtml = `
      <div class="card border mb-3 shadow-sm">
        <div class="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
          <strong class="fs-xs text-dark"><i class="ph-clock-countdown text-primary me-1"></i> Linha do Tempo &amp; Trilha de Auditoria</strong>
          <span class="fs-xxs text-muted">${req.auditTrail.length} registros</span>
        </div>
        <div class="card-body p-3">
          <div class="timeline-trail">
            ${req.auditTrail.map(a => `
              <div class="d-flex gap-2 mb-2 pb-2 border-bottom border-light">
                <div class="text-primary fs-6"><i class="ph-circle-wavy-check"></i></div>
                <div class="flex-grow-1 fs-xxs">
                  <div class="d-flex justify-content-between">
                    <strong class="text-dark">${a.action.replace(/_/g, ' ')}</strong>
                    <span class="text-muted">${new Date(a.timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                  <div class="text-muted">${a.actorName} (${a.actorRole})</div>
                  ${a.comment ? `<div class="mt-1 p-1 bg-light rounded text-dark fst-italic">"${a.comment}"</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Renderiza o corpo do Drawer
    content.innerHTML = `
      <!-- Cabeçalho do Drawer -->
      <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
        <div>
          <span class="badge ${typeMeta.color} bg-light border px-2 py-1 fs-xxs fw-bold text-uppercase">
            <i class="${typeMeta.icon}"></i> ${typeMeta.label}
          </span>
          <h5 class="fw-bold mb-0 text-dark mt-1 font-monospace">${req.id}</h5>
        </div>
        <span class="badge ${req.badgeClass} fs-xs px-2 py-1">${req.statusLabelPtBr}</span>
      </div>

      <!-- Alerta se devolvida -->
      ${req.status === 'DEVOLVIDA' ? `
        <div class="alert alert-warning py-2 px-3 fs-xs mb-3">
          <strong class="d-block"><i class="ph-warning me-1"></i> Solicitação Devolvida para Ajustes:</strong>
          <span>"${req.returnNotes}"</span>
        </div>
      ` : ''}

      <!-- Resumo do Solicitante e Operação -->
      <div class="card border mb-3 shadow-sm bg-white">
        <div class="card-body p-3">
          <div class="row g-2 fs-xs">
            <div class="col-6"><span class="text-muted fs-xxs d-block">Produtor Titular:</span><strong class="text-dark">${req.producerName}</strong></div>
            <div class="col-6"><span class="text-muted fs-xxs d-block">Evento Vinculado:</span><strong class="text-dark">${req.eventName || 'Geral'}</strong></div>
            <div class="col-6"><span class="text-muted fs-xxs d-block">Valor Solicitado:</span><strong class="text-success fs-sm">R$ ${req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
            <div class="col-6"><span class="text-muted fs-xxs d-block">Solicitado Por:</span><strong class="text-dark">${req.requestedBy.name}</strong> (${req.requestedBy.role})</div>
            <div class="col-12 mt-2">
              <span class="text-muted fs-xxs d-block">Justificativa Formal:</span>
              <p class="text-dark bg-light p-2 rounded mb-0 fst-italic">"${req.justification}"</p>
            </div>
          </div>
        </div>
      </div>

      ${impactHtml}
      ${validationsHtml}
      ${auditHtml}
    `;

    // Renderiza o Rodapé de Ações com Governança Maker/Checker e Dupla Aprovação
    if (footer) {
      if (req.status === 'CONCLUIDA' || req.status === 'REJEITADA') {
        footer.innerHTML = `
          <div class="w-100 d-flex justify-content-between align-items-center">
            <span class="fs-xs text-muted"><i class="ph-lock me-1"></i> Operação encerrada</span>
            <button class="btn btn-sm btn-light border" data-bs-dismiss="offcanvas">Fechar</button>
          </div>
        `;
      } else if (isMaker && !isMaster) {
        // Bloqueio por Maker/Checker: o solicitante não pode aprovar
        footer.innerHTML = `
          <div class="w-100">
            <div class="alert alert-warning py-1 px-2 fs-xxs mb-2 text-center">
              <i class="ph-shield-warning me-1"></i> <strong>Princípio Maker/Checker:</strong> Você solicitou esta operação e não pode aprová-la.
            </div>
            ${req.status === 'DEVOLVIDA' ? `
              <button class="btn btn-sm btn-warning w-100 fw-bold" onclick="window.openResubmitModal('${req.id}')">
                <i class="ph-pencil-simple me-1"></i> Corrigir e Reenviar Solicitação
              </button>
            ` : `
              <button class="btn btn-sm btn-light border w-100" data-bs-dismiss="offcanvas">Fechar Visualização</button>
            `}
          </div>
        `;
      } else if (canApprove) {
        // Se estiver aguardando 2º Nível e quem abriu foi o mesmo que deu o 1º nível:
        const isFirstLevelApprover = req.firstLevelApprovedBy && (req.firstLevelApprovedBy.id === user.id || (req.firstLevelApprovedBy.email && user.email && req.firstLevelApprovedBy.email.toLowerCase() === user.email.toLowerCase()));
        if (isFirstLevelApprover && !isMaster) {
          footer.innerHTML = `
            <div class="w-100">
              <div class="alert alert-info py-1 px-2 fs-xxs mb-2 text-center">
                <i class="ph-info me-1"></i> <strong>Dupla Aprovação Requerida:</strong> Você concedeu o 1º nível de aprovação. O 2º nível deve ser aprovado por outro gestor financeiro.
              </div>
              <button class="btn btn-sm btn-light border w-100" data-bs-dismiss="offcanvas">Fechar</button>
            </div>
          `;
        } else {
          const isSecondLevel = req.approvalLevel === 'DUPLA_APROVACAO' && req.firstLevelApprovedBy;
          footer.innerHTML = `
            <div class="d-flex justify-content-between w-100 gap-2">
              ${canReturn ? `
                <button class="btn btn-sm btn-outline-warning fw-bold d-flex align-items-center gap-1" onclick="window.openReturnDecisionModal('${req.id}')">
                  <i class="ph-arrow-u-up-left"></i> Devolver
                </button>
              ` : ''}
              ${canReject ? `
                <button class="btn btn-sm btn-outline-danger fw-bold d-flex align-items-center gap-1" onclick="window.openRejectDecisionModal('${req.id}')">
                  <i class="ph-x-circle"></i> Rejeitar
                </button>
              ` : ''}
              <button class="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1 px-3" onclick="window.openApproveDecisionModal('${req.id}')">
                <i class="ph-check-circle"></i> ${isSecondLevel ? 'Aprovar (2º Nível)' : 'Aprovar Operação'}
              </button>
            </div>
          `;
        }
      } else {
        footer.innerHTML = `<button class="btn btn-sm btn-light border w-100" data-bs-dismiss="offcanvas">Fechar</button>`;
      }
    }

    // Exibe o offcanvas via Bootstrap se disponível
    if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
      const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(drawerElement);
      bsOffcanvas.show();
    } else {
      drawerElement.classList.add('show');
      drawerElement.style.visibility = 'visible';
    }
  },

  /**
   * Abre Modal de Confirmação de Aprovação
   */
  openApproveModal(id) {
    const req = financialApprovalService.getRequestById(id);
    if (!req) return;

    const modalTitle = document.getElementById('modal-approve-appr-id');
    const modalDesc = document.getElementById('modal-approve-appr-desc');
    if (modalTitle) modalTitle.textContent = req.id;
    if (modalDesc) modalDesc.textContent = `${req.type} no valor de R$ ${req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${req.producerName})`;

    this.showModal('modal-approval-confirm-approve');
  },

  /**
   * Executa Aprovação Formal
   */
  async confirmApprove() {
    if (!selectedRequestId) return;
    const notes = document.getElementById('input-approve-decision-notes')?.value || '';

    try {
      const res = await financialApprovalService.approveRequest(selectedRequestId, currentActor, notes);
      this.hideModal('modal-approval-confirm-approve');
      this.refreshDashboard();
      this.openDrawer(selectedRequestId);

      if (window.showAppNotification) {
        window.showAppNotification('Solicitação aprovada e enviada para processamento com sucesso!', 'success');
      }
    } catch (err) {
      alert(`Erro na aprovação: ${err.message}`);
    }
  },

  /**
   * Abre Modal de Rejeição Formal
   */
  openRejectModal(id) {
    const modalTitle = document.getElementById('modal-reject-appr-id');
    if (modalTitle) modalTitle.textContent = id;
    const reasonInput = document.getElementById('input-reject-decision-reason');
    if (reasonInput) reasonInput.value = '';

    this.showModal('modal-approval-confirm-reject');
  },

  /**
   * Executa Rejeição Formal com Motivo
   */
  confirmReject() {
    if (!selectedRequestId) return;
    const reason = document.getElementById('input-reject-decision-reason')?.value || '';
    if (!reason.trim()) {
      alert('Por favor, informe a justificativa obrigatória da rejeição.');
      return;
    }

    try {
      financialApprovalService.rejectRequest(selectedRequestId, currentActor, reason);
      this.hideModal('modal-approval-confirm-reject');
      this.refreshDashboard();
      this.openDrawer(selectedRequestId);

      if (window.showAppNotification) {
        window.showAppNotification('Solicitação rejeitada com sucesso.', 'info');
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  },

  /**
   * Abre Modal de Devolução para Correção
   */
  openReturnModal(id) {
    const modalTitle = document.getElementById('modal-return-appr-id');
    if (modalTitle) modalTitle.textContent = id;
    const notesInput = document.getElementById('input-return-decision-notes');
    if (notesInput) notesInput.value = '';

    this.showModal('modal-approval-confirm-return');
  },

  /**
   * Executa Devolução para Correção
   */
  confirmReturn() {
    if (!selectedRequestId) return;
    const notes = document.getElementById('input-return-decision-notes')?.value || '';
    if (!notes.trim()) {
      alert('Por favor, informe a orientação detalhada para que o produtor possa corrigir.');
      return;
    }

    try {
      financialApprovalService.returnRequest(selectedRequestId, currentActor, notes);
      this.hideModal('modal-approval-confirm-return');
      this.refreshDashboard();
      this.openDrawer(selectedRequestId);

      if (window.showAppNotification) {
        window.showAppNotification('Solicitação devolvida ao produtor para correção.', 'warning');
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  },

  /**
   * Abre Modal de Correção e Reenvio pelo Produtor
   */
  openResubmitModal(id) {
    const req = financialApprovalService.getRequestById(id);
    if (!req) return;

    const modalTitle = document.getElementById('modal-resubmit-appr-id');
    const returnNotesView = document.getElementById('modal-resubmit-return-notes');
    const justInput = document.getElementById('input-resubmit-justification');

    if (modalTitle) modalTitle.textContent = req.id;
    if (returnNotesView) returnNotesView.textContent = req.returnNotes || 'Sem observações';
    if (justInput) justInput.value = req.justification || '';

    this.showModal('modal-approval-resubmit');
  },

  /**
   * Confirma Reenvio pelo Produtor
   */
  confirmResubmit() {
    if (!selectedRequestId) return;
    const newJust = document.getElementById('input-resubmit-justification')?.value || '';

    try {
      financialApprovalService.resubmitRequest(selectedRequestId, currentActor, {
        justification: newJust
      });
      this.hideModal('modal-approval-resubmit');
      this.refreshDashboard();
      this.openDrawer(selectedRequestId);

      if (window.showAppNotification) {
        window.showAppNotification('Solicitação corrigida e reenviada com sucesso para a Controladoria!', 'success');
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  },

  showModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(el).show();
    } else {
      el.classList.add('show');
      el.style.display = 'block';
    }
  },

  hideModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(el).hide();
    } else {
      el.classList.remove('show');
      el.style.display = 'none';
    }
  },

  bindGlobalEvents() {
    window.switchApprovalRole = (role) => this.switchRole(role);
    window.switchApprovalTab = (tab) => this.switchTab(tab);
    window.filterApprovalTable = () => this.renderTable();
    window.openApprovalDecisionDrawer = (id) => this.openDrawer(id);
    window.openApproveDecisionModal = (id) => this.openApproveModal(id);
    window.confirmApproveDecision = () => this.confirmApprove();
    window.openRejectDecisionModal = (id) => this.openRejectModal(id);
    window.confirmRejectDecision = () => this.confirmReject();
    window.openReturnDecisionModal = (id) => this.openReturnModal(id);
    window.confirmReturnDecision = () => this.confirmReturn();
    window.openResubmitModal = (id) => this.openResubmitModal(id);
    window.confirmResubmit = () => this.confirmResubmit();
    window.refreshApprovalsDashboard = () => this.refreshDashboard();
    window.handleNotificationItemClick = (notifId, reqId) => {
      financialApprovalNotificationService.markAsRead(notifId, currentRole);
      if (reqId) this.openDrawer(reqId);
    };
  }
};
