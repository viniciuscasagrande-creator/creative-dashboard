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
let currentActor = accessControlService.getCurrentUser() || accessControlService.getUserById('user-admin-carlos') || {
  id: 'user-admin-carlos',
  name: 'Carlos Lima',
  role: 'GESTOR_FINANCEIRO',
  email: 'carlos.lima@diskingressos.com.br'
};
let selectedRequestId = null;

export const financialApprovalsController = {
  init() {
    this.bindGlobalEvents();
    this.updateHeader();
    this.refreshDashboard();
    financialApprovalNotificationService.refreshNavbarBell(currentRole);
  },

  /**
   * Atualiza cabeçalho e títulos contextuais (Portal do Produtor vs Financeiro Disk)
   */
  updateHeader() {
    const titleEl = document.getElementById('approval-header-main-text');
    const subEl = document.getElementById('approval-view-header-subtitle');
    const iconEl = document.getElementById('approval-header-icon');
    if (titleEl) {
      if (currentRole === 'PRODUTOR') {
        titleEl.textContent = 'Portal do Produtor — Minhas Solicitações Financeiras';
        if (iconEl) iconEl.className = 'ph-user-circle text-primary';
        if (subEl) subEl.innerHTML = 'Portal do Produtor &bull; Acompanhamento de Protocolos e Solicitações Controladas (Tipo C)';
      } else if (currentRole === 'FINANCEIRO') {
        titleEl.textContent = 'Central de Solicitações Financeiras';
        if (iconEl) iconEl.className = 'ph-shield-check text-primary';
        if (subEl) subEl.innerHTML = 'Backoffice Disk Interno &bull; Recebimento, Análise, Decisão e Execução Financeira &bull; Maker/Checker &bull; Alçadas';
      } else {
        titleEl.textContent = 'Central Unificada de Aprovações Financeiras (Master)';
        if (iconEl) iconEl.className = 'ph-shield-check text-dark';
        if (subEl) subEl.innerHTML = 'Supervisão Geral de Governança, Alçadas, Auditoria e Liquidações Contábeis';
      }
    }
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
      currentActor = accessControlService.switchCurrentUser('user-admin-carlos') || accessControlService.switchCurrentUser('user-fin-mariana');
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

    this.updateHeader();
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

    const activeBtn = document.getElementById(`tab-appr-${tab}`) ||
      (tab === 'novas' ? document.getElementById('tab-appr-pendentes') : null) ||
      (tab === 'pendentes' ? document.getElementById('tab-appr-novas') : null) ||
      (tab === 'aguardando_correcao' ? document.getElementById('tab-appr-devolvidas') : null) ||
      (tab === 'devolvidas' ? document.getElementById('tab-appr-aguardando_correcao') : null) ||
      (tab === 'reprovadas' ? document.getElementById('tab-appr-rejeitadas') : null) ||
      (tab === 'rejeitadas' ? document.getElementById('tab-appr-reprovadas') : null);

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
    if (activeTab === 'pendentes' || activeTab === 'novas') statusFilter = 'PENDENTES';
    else if (activeTab === 'em_analise') statusFilter = 'EM_ANALISE';
    else if (activeTab === 'devolvidas' || activeTab === 'aguardando_correcao') statusFilter = 'DEVOLVIDA';
    else if (activeTab === 'aprovadas') statusFilter = 'APROVADA';
    else if (activeTab === 'rejeitadas' || activeTab === 'reprovadas') statusFilter = 'REJEITADA';
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
        <tr class="${isUrgent && (req.status === 'AGUARDANDO_APROVACAO' || req.status === 'AGUARDANDO_ANALISE') ? 'table-warning-subtle' : ''}">
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
            ${currentRole === 'PRODUTOR' ? `
              <button class="btn btn-xs btn-outline-primary fw-bold d-inline-flex align-items-center gap-1 shadow-sm" onclick="window.openApprovalDecisionDrawer('${req.id}')">
                <i class="ph-files"></i> Ver Protocolo
              </button>
            ` : `
              <button class="btn btn-xs btn-primary fw-bold d-inline-flex align-items-center gap-1 shadow-sm" onclick="window.openApprovalDecisionDrawer('${req.id}')">
                <i class="ph-magnifying-glass"></i> Analisar
              </button>
            `}
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

    const user = accessControlService.getCurrentUser() || currentActor;
    const isProducer = currentRole === 'PRODUTOR' || (currentRole !== 'FINANCEIRO' && currentRole !== 'ADMINISTRADOR' && (user.userType === 'PRODUTOR' || user.profile?.startsWith('PRODUTOR')));

    const drawerElement = document.getElementById('offcanvas-approval-decision');
    const content = document.getElementById('offcanvas-approval-content');
    const footer = document.getElementById('offcanvas-approval-footer');
    const drawerTitle = document.getElementById('offcanvas-approval-title-text');
    const drawerSubtitle = document.getElementById('offcanvas-approval-subtitle');

    if (drawerTitle) {
      drawerTitle.textContent = isProducer ? `Protocolo de Solicitação — ${req.id}` : `Painel de Análise e Decisão — ${req.id}`;
    }
    if (drawerSubtitle) {
      drawerSubtitle.textContent = isProducer ? 'Portal do Produtor • Acompanhamento da Solicitação' : 'Backoffice Disk • Controladoria Financeira';
    }

    if (!drawerElement || !content) return;

    const typeMeta = financialApprovalRulesService.getTypeMeta(req.type);
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

    // Dados de Situação Financeira e Domicílio Bancário
    const fiSituation = financialApprovalService.getFinancialSituation(req);
    const bankData = financialApprovalService.getBankDetails(req);

    // 1. Bloco de Impacto Financeiro (Apenas para operações sem tela dedicada de transferência)
    let impactHtml = '';
    if (req.financialImpact && req.type !== 'TRANSFERENCIA_EVENTOS') {
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

    // 2. Situação Financeira (Exclusivo Backoffice Disk / Financeiro)
    let financialSituationHtml = '';
    if (!isProducer) {
      if (req.type === 'TRANSFERENCIA_EVENTOS' && req.financialImpact) {
        const fi = req.financialImpact;
        const totalBefore = fi.consolidatedBefore || ((fi.sourceBalanceBefore || 0) + (fi.targetBalanceBefore || 0));
        const totalAfter = fi.consolidatedAfter || ((fi.sourceBalanceAfter || 0) + (fi.targetBalanceAfter || 0));

        financialSituationHtml = `
          <div class="card border border-primary-subtle shadow-sm mb-3">
            <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
              <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
                <i class="ph-arrows-left-right text-primary"></i> Situação Financeira — Transferência entre Eventos
              </strong>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-xxs">Posição Atualizada</span>
            </div>
            <div class="card-body p-3">
              <div class="row g-2 mb-3">
                <!-- Origem -->
                <div class="col-md-6 border-end">
                  <div class="p-2 bg-light rounded border">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <strong class="fs-xs text-danger d-flex align-items-center gap-1">
                        <i class="ph-arrow-up-right"></i> Evento de Origem (Cede Saldo)
                      </strong>
                      <span class="badge bg-danger-subtle text-danger border border-danger-subtle fs-xxs">#${fi.sourceEventId}</span>
                    </div>
                    <div class="text-truncate fw-bold text-dark fs-xs mb-2">${fi.sourceEventName}</div>
                    <table class="table table-sm table-borderless fs-xxs mb-0 font-monospace">
                      <tr>
                        <td class="text-muted font-sans-serif">Saldo contábil:</td>
                        <td class="text-end text-dark">R$ ${(fi.sourceSettled || fi.sourceBalanceBefore || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td class="text-muted font-sans-serif">Valores comprometidos:</td>
                        <td class="text-end text-warning">- R$ ${(fi.sourceCommitted || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td class="text-muted font-sans-serif">Saldo disponível:</td>
                        <td class="text-end text-success fw-bold">R$ ${(fi.sourceBalanceBefore || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr class="border-top">
                        <td class="text-danger font-sans-serif fw-bold">Valor da transferência:</td>
                        <td class="text-end text-danger fw-bold">- R$ ${req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr class="border-top border-primary-subtle bg-white">
                        <td class="text-dark font-sans-serif fw-bold">Saldo projetado:</td>
                        <td class="text-end text-success fw-bold">R$ ${(fi.sourceBalanceAfter || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </table>
                  </div>
                </div>
                <!-- Destino -->
                <div class="col-md-6">
                  <div class="p-2 bg-light rounded border">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <strong class="fs-xs text-success d-flex align-items-center gap-1">
                        <i class="ph-arrow-down-left"></i> Evento de Destino (Recebe Saldo)
                      </strong>
                      <span class="badge bg-success-subtle text-success border border-success-subtle fs-xxs">#${fi.targetEventId}</span>
                    </div>
                    <div class="text-truncate fw-bold text-dark fs-xs mb-2">${fi.targetEventName}</div>
                    <table class="table table-sm table-borderless fs-xxs mb-0 font-monospace">
                      <tr>
                        <td class="text-muted font-sans-serif">Saldo contábil atual:</td>
                        <td class="text-end text-dark">R$ ${(fi.targetSettled || fi.targetBalanceBefore || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td class="text-muted font-sans-serif">Saldo disponível atual:</td>
                        <td class="text-end text-primary fw-bold">R$ ${(fi.targetBalanceBefore || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr class="border-top">
                        <td class="text-success font-sans-serif fw-bold">Valor a receber:</td>
                        <td class="text-end text-success fw-bold">+ R$ ${req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr class="border-top border-primary-subtle bg-white">
                        <td class="text-dark font-sans-serif fw-bold">Novo saldo projetado:</td>
                        <td class="text-end text-primary fw-bold">R$ ${(fi.targetBalanceAfter || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>
              <!-- Invariante Consolidado -->
              <div class="p-2 bg-white rounded border d-flex justify-content-between align-items-center fs-xs">
                <div>
                  <span class="text-muted">Invariante Consolidado do Produtor:</span>
                  <strong class="text-dark ms-1">R$ ${totalBefore.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div>
                  <span class="badge bg-success-subtle text-success border border-success-subtle fw-semibold">
                    <i class="ph-check-circle"></i> &Delta; R$ 0,00 (Consolidado Invariável)
                  </span>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (req.type === 'ANTECIPACAO') {
        const snap = req.payload?.advanceSnapshot || req.financialImpact || {};
        const sched = snap.allocatedSchedule || [];
        financialSituationHtml = `
          <div class="card border border-primary-subtle shadow-sm mb-3">
            <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
              <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
                <i class="ph-hand-coins text-primary"></i> Análise Financeira da Antecipação
              </strong>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-xxs">Simulação Contratual</span>
            </div>
            <div class="card-body p-3">
              <div class="row g-2 mb-3">
                <div class="col-6 col-md-4">
                  <div class="p-2 bg-light rounded border">
                    <span class="text-muted fs-xxs d-block">Valor Solicitado</span>
                    <strong class="text-dark fs-xs">R$ ${req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
                <div class="col-6 col-md-4">
                  <div class="p-2 bg-light rounded border">
                    <span class="text-muted fs-xxs d-block">Taxa Contratual</span>
                    <strong class="text-primary fs-xs">${snap.contractRate || 2.5}% a.m.</strong>
                  </div>
                </div>
                <div class="col-6 col-md-4">
                  <div class="p-2 bg-light rounded border">
                    <span class="text-muted fs-xxs d-block">Custo Estimado</span>
                    <strong class="text-danger fs-xs">- R$ ${(snap.estimatedCost || (req.amount * 0.025)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
                <div class="col-6 col-md-4">
                  <div class="p-2 bg-light rounded border">
                    <span class="text-muted fs-xxs d-block">Outros Encargos</span>
                    <strong class="text-muted fs-xs">R$ 0,00</strong>
                  </div>
                </div>
                <div class="col-6 col-md-4">
                  <div class="p-2 bg-success-subtle rounded border border-success-subtle">
                    <span class="text-success-emphasis fs-xxs d-block fw-bold">Valor Líquido Estimado</span>
                    <strong class="text-success fs-xs">R$ ${(snap.estimatedNet || (req.amount * 0.975)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
                <div class="col-6 col-md-4">
                  <div class="p-2 bg-light rounded border">
                    <span class="text-muted fs-xxs d-block">Previsão Liquidação</span>
                    <strong class="text-dark fs-xs">Até 24h úteis</strong>
                  </div>
                </div>
              </div>
              <div class="alert alert-info py-1 px-2 fs-xxs mb-3">
                <i class="ph-info me-1"></i> Esta é uma simulação. O valor final está sujeito à análise e aprovação do Financeiro Disk.
              </div>
              <strong class="fs-xxs text-uppercase text-muted d-block mb-1">Agenda de Recebíveis Considerados</strong>
              <div class="table-responsive">
                <table class="table table-sm table-bordered fs-xxs mb-0 font-monospace">
                  <thead class="table-light font-sans-serif">
                    <tr>
                      <th>Vencimento</th>
                      <th class="text-end">Disponível</th>
                      <th class="text-end">Alocado</th>
                      <th class="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sched.length > 0 ? sched.map(s => `
                      <tr>
                        <td>${s.dueDateLabel || s.dueDate}</td>
                        <td class="text-end">R$ ${(s.grossAvailable || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td class="text-end text-primary fw-bold">R$ ${(s.allocatedAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td class="text-center"><span class="badge bg-warning-subtle text-warning border fs-xxs">Bloqueado</span></td>
                      </tr>
                    `).join('') : `
                      <tr>
                        <td>15/10/2026</td>
                        <td class="text-end">R$ 40.000,00</td>
                        <td class="text-end text-primary fw-bold">R$ ${req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td class="text-center"><span class="badge bg-warning-subtle text-warning border fs-xxs">Bloqueado</span></td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      } else if (req.type === 'ALTERACAO_DADOS_BANCARIOS') {
        const curAcc = req.payload?.currentAccount || {};
        const reqAcc = req.payload?.requestedAccount || {};
        const docs = reqAcc.documents || req.attachments || [];
        financialSituationHtml = `
          <div class="card border border-danger-subtle shadow-sm mb-3">
            <div class="card-header bg-danger-subtle py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
              <strong class="fs-xs text-uppercase text-danger d-flex align-items-center gap-1">
                <i class="ph-bank text-danger"></i> Comparativo Cadastral — Alteração de Dados Bancários
              </strong>
              <span class="badge bg-danger text-white fs-xxs">Alçada Nível 2 / Crítica</span>
            </div>
            <div class="card-body p-3">
              <div class="alert alert-warning py-2 px-3 fs-xs mb-3">
                <i class="ph-shield-warning me-1"></i> <strong>Aviso de Segurança:</strong> Por segurança, a conta bancária atual continuará ativa até que a alteração seja analisada e aprovada pelo Financeiro Disk. Repasses anteriores já autorizados mantêm seus dados congelados.
              </div>
              <div class="row g-2 mb-3">
                <!-- Conta Atual -->
                <div class="col-md-6 border-end">
                  <div class="p-2 bg-light rounded border h-100">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <strong class="fs-xs text-secondary d-flex align-items-center gap-1">
                        <i class="ph-lock"></i> DADOS ATUAIS (Conta Vigente)
                      </strong>
                      <span class="badge bg-success text-white fs-xxs">ATIVA</span>
                    </div>
                    <table class="table table-sm table-borderless fs-xxs mb-0">
                      <tr><td class="text-muted">Banco:</td><td class="text-dark fw-bold">${curAcc.bankName || 'Banco do Brasil'} (${curAcc.bankCode || '001'})</td></tr>
                      <tr><td class="text-muted">Agência:</td><td class="text-dark font-monospace">${curAcc.agency || '1502-4'}</td></tr>
                      <tr><td class="text-muted">Conta:</td><td class="text-dark font-monospace">${curAcc.account || '99201-0'}</td></tr>
                      <tr><td class="text-muted">Titular:</td><td class="text-dark">${curAcc.holderName || req.producerName}</td></tr>
                      <tr><td class="text-muted">CNPJ/CPF:</td><td class="text-dark font-monospace">${curAcc.document || '08.123.456/0001-99'}</td></tr>
                      <tr><td class="text-muted">Chave PIX:</td><td class="text-dark font-monospace">${curAcc.pixKey || '08123456000199'}</td></tr>
                    </table>
                  </div>
                </div>
                <!-- Nova Conta Proposta -->
                <div class="col-md-6">
                  <div class="p-2 bg-primary-subtle rounded border border-primary-subtle h-100">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <strong class="fs-xs text-primary d-flex align-items-center gap-1">
                        <i class="ph-arrows-clockwise"></i> DADOS SOLICITADOS (Proposta)
                      </strong>
                      <span class="badge bg-warning text-dark fs-xxs">PENDENTE APROVAÇÃO</span>
                    </div>
                    <table class="table table-sm table-borderless fs-xxs mb-0">
                      <tr><td class="text-muted">Banco:</td><td class="text-dark fw-bold">${reqAcc.bankName || req.payload?.bankName || 'Banco Santander'} (${reqAcc.bankCode || req.payload?.bankCode || '033'})</td></tr>
                      <tr><td class="text-muted">Agência:</td><td class="text-dark font-monospace fw-bold">${reqAcc.agency || req.payload?.agency || '0082'}</td></tr>
                      <tr><td class="text-muted">Conta:</td><td class="text-dark font-monospace fw-bold">${reqAcc.account || req.payload?.account || '44810-9'}</td></tr>
                      <tr><td class="text-muted">Titular:</td><td class="text-dark">${reqAcc.holderName || req.payload?.holderName || req.producerName}</td></tr>
                      <tr><td class="text-muted">CNPJ/CPF:</td><td class="text-dark font-monospace">${reqAcc.document || req.payload?.document || '08.123.456/0001-99'}</td></tr>
                      <tr><td class="text-muted">Chave PIX:</td><td class="text-dark font-monospace">${reqAcc.pixKey || req.payload?.pixKey || req.payload?.newPixKey || '—'}</td></tr>
                    </table>
                  </div>
                </div>
              </div>
              <strong class="fs-xxs text-uppercase text-muted d-block mb-1">Documentos Comprobatórios Anexados</strong>
              <div class="d-flex flex-wrap gap-2">
                ${docs.length > 0 ? docs.map(d => `
                  <span class="badge bg-light text-dark border p-2 d-flex align-items-center gap-1 fs-xxs">
                    <i class="ph-file-pdf text-danger fs-6"></i> Comprovante de Titularidade: ${d.name || d}
                  </span>
                `).join('') : `
                  <span class="badge bg-light text-muted border p-2 fs-xxs"><i class="ph-file-pdf text-danger me-1"></i> Comprovante de Titularidade Bancária</span>
                `}
              </div>
            </div>
          </div>

          <div class="card border border-primary-subtle shadow-sm mb-3">
            <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
              <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
                <i class="ph-chart-line-up text-primary"></i> Situação Financeira
              </strong>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-xxs">Posição Atualizada</span>
            </div>
            <div class="card-body p-3">
              <div class="table-responsive">
                <table class="table table-sm table-borderless align-middle mb-0 fs-xs font-monospace">
                  <tbody>
                    <tr>
                      <td class="text-muted font-sans-serif">Vendas brutas</td>
                      <td class="text-end fw-bold text-dark">R$ ${fiSituation.grossSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td class="text-muted font-sans-serif">Taxas</td>
                      <td class="text-end text-danger">- R$ ${fiSituation.platformFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td class="text-muted font-sans-serif">Estornos</td>
                      <td class="text-end text-danger">- R$ ${fiSituation.refunds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td class="text-muted font-sans-serif">Chargebacks</td>
                      <td class="text-end text-danger">- R$ ${fiSituation.chargebacks.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td class="text-muted font-sans-serif">Valores comprometidos</td>
                      <td class="text-end text-warning">- R$ ${fiSituation.committed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr class="border-top border-secondary">
                      <td class="fw-bold text-dark font-sans-serif">Saldo disponível</td>
                      <td class="text-end fw-bold text-success fs-sm">R$ ${fiSituation.available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr class="bg-light">
                      <td class="fw-bold text-primary font-sans-serif">Repasse / Valor solicitado</td>
                      <td class="text-end fw-bold text-primary fs-sm">R$ ${req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr class="border-top border-primary-subtle">
                      <td class="fw-bold text-dark font-sans-serif">Saldo projetado</td>
                      <td class="text-end fw-bold ${fiSituation.projected >= 0 ? 'text-success' : 'text-danger'} fs-sm">R$ ${fiSituation.projected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      } else {
        financialSituationHtml = `
          <div class="card border border-primary-subtle shadow-sm mb-3">
            <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
              <strong class="fs-xs text-uppercase text-dark d-flex align-items-center gap-1">
                <i class="ph-chart-line-up text-primary"></i> Situação Financeira
              </strong>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-xxs">Posição Atualizada</span>
            </div>
            <div class="card-body p-3">
              <div class="table-responsive">
                <table class="table table-sm table-borderless align-middle mb-0 fs-xs font-monospace">
                  <tbody>
                    <tr>
                      <td class="text-muted font-sans-serif">Vendas brutas</td>
                      <td class="text-end fw-bold text-dark">R$ ${fiSituation.grossSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td class="text-muted font-sans-serif">Taxas</td>
                      <td class="text-end text-danger">- R$ ${fiSituation.platformFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td class="text-muted font-sans-serif">Estornos</td>
                      <td class="text-end text-danger">- R$ ${fiSituation.refunds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td class="text-muted font-sans-serif">Chargebacks</td>
                      <td class="text-end text-danger">- R$ ${fiSituation.chargebacks.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td class="text-muted font-sans-serif">Valores comprometidos</td>
                      <td class="text-end text-warning">- R$ ${fiSituation.committed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr class="border-top border-secondary">
                      <td class="fw-bold text-dark font-sans-serif">Saldo disponível</td>
                      <td class="text-end fw-bold text-success fs-sm">R$ ${fiSituation.available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr class="bg-light">
                      <td class="fw-bold text-primary font-sans-serif">Repasse / Valor solicitado</td>
                      <td class="text-end fw-bold text-primary fs-sm">R$ ${req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr class="border-top border-primary-subtle">
                      <td class="fw-bold text-dark font-sans-serif">Saldo projetado</td>
                      <td class="text-end fw-bold ${fiSituation.projected >= 0 ? 'text-success' : 'text-danger'} fs-sm">R$ ${fiSituation.projected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      }
    }

    // 3. Dados Bancários & Favorecido (Ocultado apenas em transferências internas entre eventos)
    const bankDetailsHtml = req.type !== 'TRANSFERENCIA_EVENTOS' ? `
      <div class="card border mb-3 shadow-sm bg-white">
        <div class="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
          <strong class="fs-xs text-dark d-flex align-items-center gap-1">
            <i class="ph-bank text-secondary"></i> Dados Bancários &amp; Favorecido
          </strong>
          <span class="badge bg-success-subtle text-success border border-success-subtle fs-xxs">
            <i class="ph-shield-check"></i> Titularidade Validada
          </span>
        </div>
        <div class="card-body p-3 fs-xs">
          <div class="row g-2">
            <div class="col-7"><span class="text-muted fs-xxs d-block">Titular / Favorecido:</span><strong class="text-dark">${bankData.holderName}</strong></div>
            <div class="col-5"><span class="text-muted fs-xxs d-block">CNPJ / CPF:</span><span class="text-dark font-monospace">${bankData.document}</span></div>
            <div class="col-7"><span class="text-muted fs-xxs d-block">Banco:</span><strong class="text-dark">${bankData.bankName} (${bankData.bankCode})</strong></div>
            <div class="col-5"><span class="text-muted fs-xxs d-block">Agência e Conta:</span><span class="text-dark font-monospace">Ag ${bankData.agency} / CC ${bankData.account}</span></div>
            ${bankData.pixKey ? `<div class="col-12 mt-1"><span class="text-muted fs-xxs d-block">Chave PIX:</span><span class="badge bg-light text-dark border font-monospace">${bankData.pixKey}</span></div>` : ''}
          </div>
        </div>
      </div>
    ` : '';

    // 4. Validações Automáticas
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

    // 5. Linha do Tempo e Auditoria
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
      ${(req.status === 'DEVOLVIDA' || req.status === 'AGUARDANDO_CORRECAO') ? `
        <div class="alert alert-warning py-3 px-3 fs-xs mb-3 shadow-sm border border-warning">
          <div class="d-flex align-items-center gap-2 mb-1">
            <i class="ph-warning-circle text-warning fs-4"></i>
            <strong class="text-dark">${isProducer ? 'Solicitação Devolvida para Ajustes' : 'Aguardando Correção pelo Produtor'}</strong>
          </div>
          <div class="p-2 bg-white rounded border fs-xs text-dark fst-italic my-2">
            "${req.returnNotes}"
          </div>
          ${isProducer ? '<span class="fs-xxs text-muted">Ajuste os dados solicitados e reenvie mantendo o mesmo protocolo e histórico.</span>' : ''}
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

      ${financialSituationHtml}
      ${bankDetailsHtml}
      ${impactHtml}
      ${validationsHtml}
      ${auditHtml}
    `;

    // Renderiza o Rodapé de Ações com Governança Maker/Checker e Segregação
    if (footer) {
      if (isProducer) {
        // PRODUTOR NUNCA TEM BOTÕES DE APROVAR/REPROVAR/DEVOLVER
        if (req.status === 'AGUARDANDO_ACEITE_PRODUTOR') {
          footer.innerHTML = `
            <div class="w-100">
              <div class="alert alert-info py-2 px-3 fs-xs mb-2">
                <div class="d-flex align-items-center gap-1 mb-1">
                  <i class="ph-info text-primary"></i>
                  <strong>Condição Ajustada pelo Financeiro Disk:</strong>
                </div>
                Valor: <strong>R$ ${(req.adjustedCondition?.approvedAmount || req.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> |
                Taxa: <strong>${req.adjustedCondition?.approvedRate || 2.5}% a.m.</strong><br>
                <span class="fst-italic text-muted">"${req.adjustedCondition?.reason || 'Ajuste de crédito.'}"</span>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-danger w-50" onclick="window.cancelAdjustedConditionAction('${req.id}')">
                  Recusar / Cancelar
                </button>
                <button class="btn btn-sm btn-success w-50 fw-bold shadow-sm" onclick="window.acceptAdjustedConditionAction('${req.id}')">
                  <i class="ph-check-circle me-1"></i> Aceitar Condição
                </button>
              </div>
            </div>
          `;
        } else if (req.status === 'DEVOLVIDA' || req.status === 'AGUARDANDO_CORRECAO') {
          footer.innerHTML = `
            <div class="w-100 d-flex gap-2">
              <button class="btn btn-sm btn-light border w-50" data-bs-dismiss="offcanvas">Fechar</button>
              <button class="btn btn-sm btn-warning w-50 fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm" onclick="window.openResubmitModal('${req.id}')">
                <i class="ph-pencil-simple"></i> Corrigir e Reenviar
              </button>
            </div>
          `;
        } else {
          footer.innerHTML = `
            <div class="w-100 d-flex justify-content-between align-items-center">
              <span class="fs-xs text-muted"><i class="ph-info me-1"></i> Protocolo registrado no Financeiro Disk</span>
              <button class="btn btn-sm btn-light border" data-bs-dismiss="offcanvas">Fechar Visualização</button>
            </div>
          `;
        }
      } else {
        // BACKOFFICE DISK / FINANCEIRO INTERNO
        if (req.status === 'CONCLUIDA') {
          footer.innerHTML = `
            <div class="w-100 d-flex justify-content-between align-items-center">
              <span class="fs-xs text-success fw-bold"><i class="ph-check-circle me-1"></i> Operação Concluída e Liquidada</span>
              <button class="btn btn-sm btn-light border" data-bs-dismiss="offcanvas">Fechar</button>
            </div>
          `;
        } else if (req.status === 'REJEITADA' || req.status === 'REPROVADA') {
          footer.innerHTML = `
            <div class="w-100 d-flex justify-content-between align-items-center">
              <span class="fs-xs text-danger fw-bold"><i class="ph-x-circle me-1"></i> Operação Reprovada / Arquivada</span>
              <button class="btn btn-sm btn-light border" data-bs-dismiss="offcanvas">Fechar</button>
            </div>
          `;
        } else if (req.status === 'AGUARDANDO_ACEITE_PRODUTOR') {
          footer.innerHTML = `
            <div class="w-100 d-flex justify-content-between align-items-center">
              <span class="fs-xs text-info fw-bold"><i class="ph-clock-countdown me-1"></i> Aguardando Aceite da Contraproposta pelo Produtor</span>
              <button class="btn btn-sm btn-light border" data-bs-dismiss="offcanvas">Fechar</button>
            </div>
          `;
        } else if (isMaker && !isMaster) {
          // Bloqueio por Maker/Checker: o solicitante não pode aprovar
          footer.innerHTML = `
            <div class="w-100">
              <div class="alert alert-warning py-1 px-2 fs-xxs mb-2 text-center">
                <i class="ph-shield-warning me-1"></i> <strong>Princípio Maker/Checker:</strong> Você solicitou esta operação e não possui permissão para aprová-la.
              </div>
              ${(req.status === 'DEVOLVIDA' || req.status === 'AGUARDANDO_CORRECAO') ? `
                <button class="btn btn-sm btn-warning w-100 fw-bold" onclick="window.openResubmitModal('${req.id}')">
                  <i class="ph-pencil-simple me-1"></i> Corrigir e Reenviar Solicitação
                </button>
              ` : `
                <button class="btn btn-sm btn-light border w-100" data-bs-dismiss="offcanvas">Fechar Visualização</button>
              `}
            </div>
          `;
        } else if (canApprove) {
          const isFirstLevelApprover = req.firstLevelApprovedBy && (req.firstLevelApprovedBy.id === user.id || (req.firstLevelApprovedBy.email && user.email && req.firstLevelApprovedBy.email.toLowerCase() === user.email.toLowerCase()));
          if (isFirstLevelApprover && !isMaster) {
            footer.innerHTML = `
              <div class="w-100">
                <div class="alert alert-info py-1 px-2 fs-xxs mb-2 text-center">
                  <i class="ph-info me-1"></i> <strong>Dupla Aprovação Requerida:</strong> Você concedeu o 1º nível de aprovação. O 2º nível deve ser aprovado por outro gestor financeiro independente.
                </div>
                <button class="btn btn-sm btn-light border w-100" data-bs-dismiss="offcanvas">Fechar</button>
              </div>
            `;
          } else if (req.status === 'APROVADA' && req.executionStatus !== 'CONCLUIDA') {
            footer.innerHTML = `
              <div class="d-flex justify-content-between w-100 gap-2">
                <button class="btn btn-sm btn-light border" data-bs-dismiss="offcanvas">Fechar</button>
                <button class="btn btn-sm btn-primary fw-bold d-flex align-items-center gap-1 px-3 shadow-sm" onclick="window.executeApprovedAction('${req.id}')">
                  <i class="ph-lightning"></i> Executar Operação
                </button>
              </div>
            `;
          } else {
            const isSecondLevel = req.approvalLevel === 'DUPLA_APROVACAO' && req.firstLevelApprovedBy;
            footer.innerHTML = `
              <div class="d-flex flex-wrap justify-content-between w-100 gap-2">
                ${(req.status === 'AGUARDANDO_APROVACAO' || req.status === 'AGUARDANDO_ANALISE') ? `
                  <button class="btn btn-sm btn-outline-info fw-bold d-flex align-items-center gap-1" onclick="window.startAnalysisAction('${req.id}')">
                    <i class="ph-magnifying-glass"></i> Iniciar Análise
                  </button>
                ` : ''}
                ${(req.type === 'ANTECIPACAO' && (req.status === 'AGUARDANDO_APROVACAO' || req.status === 'AGUARDANDO_ANALISE' || req.status === 'EM_ANALISE')) ? `
                  <button class="btn btn-sm btn-outline-primary fw-bold d-flex align-items-center gap-1" onclick="window.openAdjustConditionModal('${req.id}')">
                    <i class="ph-sliders"></i> Propor Ajuste
                  </button>
                ` : ''}
                ${canReturn ? `
                  <button class="btn btn-sm btn-outline-warning fw-bold d-flex align-items-center gap-1" onclick="window.openReturnDecisionModal('${req.id}')">
                    <i class="ph-arrow-u-up-left"></i> Devolver
                  </button>
                ` : ''}
                ${canReject ? `
                  <button class="btn btn-sm btn-outline-danger fw-bold d-flex align-items-center gap-1" onclick="window.openRejectDecisionModal('${req.id}')">
                    <i class="ph-x-circle"></i> Reprovar
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

  /**
   * Inicia formalmente a análise da solicitação pelo Financeiro Disk
   */
  startAnalysisAction(id) {
    try {
      financialApprovalService.startAnalysis(id, currentActor);
      this.refreshDashboard();
      this.openDrawer(id);
      if (window.showAppNotification) {
        window.showAppNotification('Solicitação colocada em análise operacional com sucesso!', 'info');
      }
    } catch (err) {
      alert(`Erro ao iniciar análise: ${err.message}`);
    }
  },

  /**
   * Executa a operação aprovada
   */
  async executeApprovedAction(id) {
    try {
      const req = financialApprovalService.getRequestById(id);
      if (!req) return;
      await financialApprovalService.executeApprovedRequest(req);
      this.refreshDashboard();
      this.openDrawer(id);
      if (window.showAppNotification) {
        window.showAppNotification('Operação financeira executada e liquidada com sucesso!', 'success');
      }
    } catch (err) {
      alert(`Erro na execução: ${err.message}`);
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
    window.startAnalysisAction = (id) => this.startAnalysisAction(id);
    window.executeApprovedAction = (id) => this.executeApprovedAction(id);
    window.refreshApprovalsDashboard = () => this.refreshDashboard();
    window.acceptAdjustedConditionAction = async (id) => {
      try {
        await financialApprovalService.acceptAdjustedCondition(id, currentActor);
        this.refreshDashboard();
        this.openDrawer(id);
        if (window.showAppNotification) window.showAppNotification('Condição aceita com sucesso!', 'success');
      } catch (err) {
        alert(err.message);
      }
    };
    window.cancelAdjustedConditionAction = async (id) => {
      try {
        await financialApprovalService.cancelAdjustedCondition(id, currentActor);
        this.refreshDashboard();
        this.openDrawer(id);
        if (window.showAppNotification) window.showAppNotification('Solicitação cancelada.', 'info');
      } catch (err) {
        alert(err.message);
      }
    };
    window.openAdjustConditionModal = (id) => {
      const req = financialApprovalService.getRequestById(id);
      if (!req) return;
      const newAmount = prompt(`Ajustar Valor para Aprovação (Atual: R$ ${req.amount}):`, req.amount);
      if (newAmount === null) return;
      const newRate = prompt(`Ajustar Taxa de Antecipação % a.m.:`, '2.5');
      if (newRate === null) return;
      const reason = prompt(`Motivo do ajuste / contraproposta:`, 'Ajuste de alçada operacional e volume da agenda.');
      if (reason === null) return;
      financialApprovalService.adjustConditions(id, currentActor, { approvedAmount: Number(newAmount), approvedRate: Number(newRate), reason });
      this.refreshDashboard();
      this.openDrawer(id);
    };
    window.handleNotificationItemClick = (notifId, reqId) => {
      financialApprovalNotificationService.markAsRead(notifId, currentRole);
      if (reqId) this.openDrawer(reqId);
    };
  }
};
