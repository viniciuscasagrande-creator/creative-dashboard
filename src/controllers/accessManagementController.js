/**
 * ============================================================================
 * MEGA PACOTE 1 — AUTENTICAÇÃO + GERENCIAMENTO DE ACESSO
 * Controlador da Central de Gerenciamento de Acesso (src/controllers/accessManagementController.js)
 * ============================================================================
 */

import { accessControlService, PROFILE_DEFAULTS } from '../services/accessControlService.js';
import { accessAuditService } from '../services/accessAuditService.js';

let activeAccessTab = 'visao-geral';
let currentWizardStep = 1;
let wizardFormData = {
  name: '',
  email: '',
  phone: '',
  jobTitle: '',
  status: 'ATIVO',
  userType: 'INTERNO_DISK',
  producerId: '',
  producerName: '',
  profile: 'FINANCEIRO',
  scope: {
    allProducers: true,
    producerIds: [],
    allEvents: true,
    eventIds: []
  },
  directPermissions: [],
  thresholds: {
    transferLimit: 50000,
    payoutLimit: 50000,
    paymentLimit: 25000,
    refundLimit: 5000,
    canApproveBankDetails: false,
    canApproveAnticipation: false,
    maxApprovalLevel: 'NIVEL_1'
  },
  mfaEnabled: false
};

export const accessManagementController = {
  init() {
    this.bindGlobalEvents();
    this.renderCurrentTab();
  },

  switchTab(tab) {
    activeAccessTab = tab;
    document.querySelectorAll('.tab-access-link').forEach(btn => {
      btn.classList.remove('active', 'btn-primary', 'text-white');
      btn.classList.add('btn-light', 'text-dark');
    });

    const activeBtn = document.getElementById(`tab-access-${tab}`);
    if (activeBtn) {
      activeBtn.classList.remove('btn-light', 'text-dark');
      activeBtn.classList.add('active', 'btn-primary', 'text-white');
    }

    this.renderCurrentTab();
  },

  renderCurrentTab() {
    const pane = document.getElementById('access-management-content-pane');
    if (!pane) return;

    switch (activeAccessTab) {
      case 'visao-geral':
        pane.innerHTML = this.renderOverviewHtml();
        break;
      case 'usuarios':
        pane.innerHTML = this.renderUsersHtml();
        this.renderUsersTable();
        break;
      case 'perfis':
        pane.innerHTML = this.renderProfilesHtml();
        break;
      case 'permissoes':
        pane.innerHTML = this.renderPermissionsHtml();
        break;
      case 'alcadas':
        pane.innerHTML = this.renderThresholdsHtml();
        break;
      case 'escopos':
        pane.innerHTML = this.renderScopesHtml();
        break;
      case 'seguranca':
        pane.innerHTML = this.renderSecurityHtml();
        break;
      case 'auditoria':
        pane.innerHTML = this.renderAuditHtml();
        this.renderAuditTable();
        break;
      default:
        pane.innerHTML = this.renderOverviewHtml();
    }
  },

  renderOverviewHtml() {
    const stats = accessControlService.getStats();
    const currentUser = accessControlService.getCurrentUser();

    return `
      <!-- 4 Cards Superiores de Métricas de Acesso -->
      <div class="row g-2 mb-3">
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card card-body shadow-sm border-0 border-start border-primary border-4 p-2 h-100">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="fs-xxs text-uppercase fw-bold text-muted d-block">Usuários Cadastrados</span>
                <h4 class="fw-bold mb-0 text-primary mt-1">${stats.totalUsers}</h4>
              </div>
              <div class="p-2 bg-primary-subtle text-primary rounded-circle"><i class="ph-users fs-3"></i></div>
            </div>
            <div class="fs-xxs text-muted mt-2">${stats.internalUsers} Internos Disk &bull; ${stats.producerUsers} Produtores</div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card card-body shadow-sm border-0 border-start border-success border-4 p-2 h-100">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="fs-xxs text-uppercase fw-bold text-muted d-block">Usuários Ativos</span>
                <h4 class="fw-bold mb-0 text-success mt-1">${stats.activeUsers}</h4>
              </div>
              <div class="p-2 bg-success-subtle text-success rounded-circle"><i class="ph-check-circle fs-3"></i></div>
            </div>
            <div class="fs-xxs text-muted mt-2">100% de conformidade com política</div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card card-body shadow-sm border-0 border-start border-danger border-4 p-2 h-100">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="fs-xxs text-uppercase fw-bold text-muted d-block">Bloqueados / Suspensos</span>
                <h4 class="fw-bold mb-0 text-danger mt-1">${stats.blockedUsers}</h4>
              </div>
              <div class="p-2 bg-danger-subtle text-danger rounded-circle"><i class="ph-lock-key fs-3"></i></div>
            </div>
            <div class="fs-xxs text-muted mt-2">Proteção antifraude ativa</div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card card-body shadow-sm border-0 border-start border-info border-4 p-2 h-100">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="fs-xxs text-uppercase fw-bold text-muted d-block">Auditorias Registradas</span>
                <h4 class="fw-bold mb-0 text-info mt-1">${stats.recentAuditCount}</h4>
              </div>
              <div class="p-2 bg-info-subtle text-info rounded-circle"><i class="ph-shield-check fs-3"></i></div>
            </div>
            <div class="fs-xxs text-muted mt-2">Trilha imutável em tempo real</div>
          </div>
        </div>
      </div>

      <!-- Resumo de Segurança e Usuário Ativo -->
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
          <strong class="fs-xs text-dark d-flex align-items-center gap-2">
            <i class="ph-user-circle text-primary fs-5"></i> Sua Sessão Ativa de Trabalho
          </strong>
          <span class="badge bg-success-subtle text-success border border-success-subtle fs-xxs">Autenticado com Sucesso</span>
        </div>
        <div class="card-body p-3">
          <div class="row g-3 fs-xs">
            <div class="col-12 col-md-3">
              <span class="text-muted fs-xxs d-block">Nome do Colaborador:</span>
              <strong class="text-dark fs-sm">${currentUser.name}</strong>
              <div class="text-muted fs-xxs">${currentUser.email}</div>
            </div>
            <div class="col-12 col-md-3">
              <span class="text-muted fs-xxs d-block">Perfil de Acesso:</span>
              <span class="badge bg-primary text-white fs-xs">${currentUser.profileLabelPtBr}</span>
              <div class="text-muted fs-xxs mt-1">${currentUser.jobTitle}</div>
            </div>
            <div class="col-12 col-md-3">
              <span class="text-muted fs-xxs d-block">Escopo Autorizado:</span>
              <strong class="text-dark">${currentUser.scope.allProducers ? 'Todos os Produtores' : `${currentUser.scope.producerIds.length} Produtor(es)`}</strong>
              <div class="text-muted fs-xxs">${currentUser.scope.allEvents ? 'Todos os Eventos' : `${currentUser.scope.eventIds.length} Evento(s)`}</div>
            </div>
            <div class="col-12 col-md-3">
              <span class="text-muted fs-xxs d-block">Alçada Máxima Transferência:</span>
              <strong class="text-success fs-sm">R$ ${(currentUser.thresholds?.transferLimit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              <div class="text-muted fs-xxs">Nível: ${currentUser.thresholds?.maxApprovalLevel || 'NIVEL_1'}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderUsersHtml() {
    return `
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-header bg-white border-bottom py-2 px-3">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-2">
            <div>
              <h6 class="fw-bold mb-0 text-dark">Gestão Central de Usuários</h6>
              <div class="text-muted fs-xs">Administre operadores Disk e usuários credenciados de produtores.</div>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
              <div class="input-group input-group-sm" style="width: 220px;">
                <span class="input-group-text bg-light border-end-0"><i class="ph-magnifying-glass"></i></span>
                <input type="text" class="form-control border-start-0" id="input-filter-access-users" placeholder="Buscar por nome ou e-mail..." oninput="window.filterAccessUsersTable()">
              </div>
              <select class="form-select form-select-sm" id="select-filter-access-role" style="width: 170px;" onchange="window.filterAccessUsersTable()">
                <option value="TODOS">Todos os Perfis</option>
                <option value="ADMINISTRADOR">Administrador Master</option>
                <option value="GESTOR_FINANCEIRO">Gestor Financeiro</option>
                <option value="FINANCEIRO">Financeiro Operacional</option>
                <option value="PRODUTOR_ADMINISTRADOR">Produtor Administrador</option>
                <option value="PRODUTOR_FINANCEIRO">Produtor Financeiro</option>
                <option value="PRODUTOR_OPERACIONAL">Produtor Operacional</option>
                <option value="MARKETING">Marketing &amp; CRM</option>
                <option value="ATENDIMENTO_SAC">Atendimento SAC</option>
              </select>
              <button type="button" class="btn btn-sm btn-primary fw-bold d-flex align-items-center gap-1 shadow-sm" onclick="window.openCreateUserWizard()">
                <i class="ph-plus-circle"></i> Novo Usuário
              </button>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 fs-xs">
            <thead class="table-light text-uppercase fs-xxs text-muted fw-bold">
              <tr>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Vínculo / Produtor</th>
                <th>Escopo Autorizado</th>
                <th>Status</th>
                <th>Último Acesso</th>
                <th class="text-end">Ações</th>
              </tr>
            </thead>
            <tbody id="table-access-users-body">
              <!-- Renderizado via renderUsersTable() -->
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderUsersTable() {
    const tbody = document.getElementById('table-access-users-body');
    if (!tbody) return;

    const search = document.getElementById('input-filter-access-users')?.value || '';
    const profile = document.getElementById('select-filter-access-role')?.value || 'TODOS';

    const users = accessControlService.getUsers({ search, profile });

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            <i class="ph-user-slash fs-1 d-block mb-1 opacity-50"></i>
            Nenhum usuário encontrado com os filtros selecionados.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = users.map(u => {
      const isBlocked = u.status === 'BLOQUEADO';
      const statusBadge = isBlocked
        ? '<span class="badge bg-danger fs-xxs">Bloqueado</span>'
        : '<span class="badge bg-success fs-xxs">Ativo</span>';

      const scopeText = u.scope.allEvents
        ? 'Todos os eventos autorizados'
        : `${u.scope.eventIds.length} evento(s) específico(s)`;

      return `
        <tr>
          <td>
            <div class="fw-bold text-dark">${u.name}</div>
            <div class="text-muted fs-xxs">${u.email}</div>
          </td>
          <td>
            <span class="badge bg-light text-dark border fs-xxs">${u.profileLabelPtBr}</span>
            <div class="text-muted fs-xxs">${u.jobTitle || ''}</div>
          </td>
          <td>
            <span class="badge ${u.userType === 'INTERNO_DISK' ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-warning-subtle text-dark border border-warning-subtle'} fs-xxs">
              ${u.userType === 'INTERNO_DISK' ? 'Interno Disk' : 'Produtor'}
            </span>
            <div class="text-dark fs-xxs fw-semibold mt-1">${u.producerName || 'DiskIngressos'}</div>
          </td>
          <td>
            <div class="text-dark fs-xxs fw-semibold">${scopeText}</div>
            <div class="text-muted fs-xxs">${u.scope.allProducers ? 'Global' : 'Restrito'}</div>
          </td>
          <td>${statusBadge}</td>
          <td class="text-muted fs-xxs">
            ${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('pt-BR') : 'Nunca acessou'}
          </td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-xs btn-outline-secondary" title="Redefinir Acesso" onclick="window.handleResetPassword('${u.id}')">
                <i class="ph-key"></i>
              </button>
              <button class="btn btn-xs ${isBlocked ? 'btn-outline-success' : 'btn-outline-danger'}" title="${isBlocked ? 'Desbloquear' : 'Bloquear'}" onclick="window.handleToggleUserBlock('${u.id}')">
                <i class="${isBlocked ? 'ph-lock-key-open' : 'ph-lock-key'}"></i>
              </button>
              <button class="btn btn-xs btn-primary fw-bold" onclick="window.openUserDetailsModal('${u.id}')">
                Detalhes
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderProfilesHtml() {
    const profiles = Object.entries(PROFILE_DEFAULTS);

    return `
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-header bg-white border-bottom py-2 px-3">
          <h6 class="fw-bold mb-0 text-dark">Matriz de Perfis de Acesso</h6>
          <div class="text-muted fs-xs">Os perfis representam os conjuntos padronizados de permissões e alçadas da plataforma.</div>
        </div>
        <div class="card-body p-3">
          <div class="row g-3">
            ${profiles.map(([key, prof]) => `
              <div class="col-12 col-md-6 col-xl-4">
                <div class="card h-100 border shadow-sm">
                  <div class="card-header bg-light py-2 px-3 d-flex justify-content-between align-items-center">
                    <strong class="fs-xs text-dark">${prof.label}</strong>
                    <span class="badge ${prof.badgeClass} fs-xxs">${key}</span>
                  </div>
                  <div class="card-body p-3 fs-xs">
                    <p class="text-muted fs-xxs mb-2">${prof.description}</p>
                    <div class="d-flex justify-content-between mb-1">
                      <span class="text-muted fs-xxs">Alçada Transferência:</span>
                      <strong class="text-dark fs-xxs">R$ ${prof.thresholds.transferLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span class="text-muted fs-xxs">Alçada Repasse:</span>
                      <strong class="text-dark fs-xxs">R$ ${prof.thresholds.payoutLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                      <span class="text-muted fs-xxs">Nível Máximo:</span>
                      <span class="badge bg-secondary fs-xxs">${prof.thresholds.maxApprovalLevel}</span>
                    </div>
                    <hr class="my-2">
                    <span class="text-muted fs-xxs d-block fw-bold mb-1">Permissões Incluídas (${prof.permissions.length}):</span>
                    <div class="d-flex flex-wrap gap-1">
                      ${prof.permissions.slice(0, 6).map(p => `<span class="badge bg-light text-dark border fs-xxs">${p}</span>`).join('')}
                      ${prof.permissions.length > 6 ? `<span class="badge bg-light text-primary border fs-xxs">+${prof.permissions.length - 6}</span>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderPermissionsHtml() {
    return `
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-header bg-white border-bottom py-2 px-3">
          <h6 class="fw-bold mb-0 text-dark">Dicionário de Permissões por Ação e Módulo</h6>
          <div class="text-muted fs-xs">Controle granular da aplicação avaliado via função <code>can(user, permission, context)</code>.</div>
        </div>
        <div class="card-body p-3">
          <div class="table-responsive">
            <table class="table table-bordered table-sm fs-xs align-middle">
              <thead class="table-light fs-xxs text-uppercase fw-bold text-muted">
                <tr>
                  <th style="width: 180px;">Módulo</th>
                  <th style="width: 250px;">Chave da Permissão</th>
                  <th>Descrição Operacional</th>
                  <th style="width: 140px;">Criticidade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowspan="3" class="fw-bold bg-light">Acesso &amp; Segurança</td>
                  <td><code>acesso.usuarios.visualizar</code></td>
                  <td>Visualizar tabela e listagem de operadores e usuários</td>
                  <td><span class="badge bg-info text-white fs-xxs">Baixa</span></td>
                </tr>
                <tr>
                  <td><code>acesso.usuarios.criar</code></td>
                  <td>Criar novos usuários e conceder perfis operacionais</td>
                  <td><span class="badge bg-warning text-dark fs-xxs">Média</span></td>
                </tr>
                <tr>
                  <td><code>acesso.alcadas.administrar</code></td>
                  <td>Configurar limites e alçadas monetárias de aprovação</td>
                  <td><span class="badge bg-danger text-white fs-xxs">Crítica</span></td>
                </tr>
                <tr>
                  <td rowspan="4" class="fw-bold bg-light">Financeiro &bull; Aprovações</td>
                  <td><code>financeiro.aprovacoes.visualizar</code></td>
                  <td>Acessar fila central de solicitações de aprovação</td>
                  <td><span class="badge bg-info text-white fs-xxs">Baixa</span></td>
                </tr>
                <tr>
                  <td><code>financeiro.aprovacoes.analisar</code></td>
                  <td>Abrir drawer de decisão, verificar impacto e simulação</td>
                  <td><span class="badge bg-info text-white fs-xxs">Baixa</span></td>
                </tr>
                <tr>
                  <td><code>financeiro.aprovacoes.aprovar</code></td>
                  <td>Autorizar operação e despachar para liquidação bancária</td>
                  <td><span class="badge bg-danger text-white fs-xxs">Alta</span></td>
                </tr>
                <tr>
                  <td><code>financeiro.aprovacoes.devolver</code></td>
                  <td>Devolver solicitação ao produtor com orientações</td>
                  <td><span class="badge bg-warning text-dark fs-xxs">Média</span></td>
                </tr>
                <tr>
                  <td rowspan="3" class="fw-bold bg-light">Produtor &bull; Operação</td>
                  <td><code>financeiro.repasses.solicitar</code></td>
                  <td>Submeter pedido de repasse quinzenal de bilheteria</td>
                  <td><span class="badge bg-primary text-white fs-xxs">Operacional</span></td>
                </tr>
                <tr>
                  <td><code>financeiro.transferencias.criar</code></td>
                  <td>Solicitar transferência de saldo entre eventos</td>
                  <td><span class="badge bg-primary text-white fs-xxs">Operacional</span></td>
                </tr>
                <tr>
                  <td><code>financeiro.dados_bancarios.editar</code></td>
                  <td>Solicitar troca de conta corrente ou chave PIX</td>
                  <td><span class="badge bg-danger text-white fs-xxs">Crítica</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderThresholdsHtml() {
    const users = accessControlService.getUsers();

    return `
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-header bg-white border-bottom py-2 px-3">
          <h6 class="fw-bold mb-0 text-dark">Matriz de Alçadas de Aprovação por Colaborador</h6>
          <div class="text-muted fs-xs">Limites financeiros máximos autorizados para aprovação definitiva sem encaminhamento para N2/Diretoria.</div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 fs-xs">
            <thead class="table-light fs-xxs text-uppercase fw-bold text-muted">
              <tr>
                <th>Colaborador</th>
                <th>Perfil</th>
                <th>Alçada Transferência</th>
                <th>Alçada Repasse</th>
                <th>Alçada Pagamento</th>
                <th>Alteração Bancária</th>
                <th>Antecipação</th>
                <th>Nível</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td>
                    <strong class="text-dark">${u.name}</strong>
                    <div class="text-muted fs-xxs">${u.email}</div>
                  </td>
                  <td><span class="badge bg-light text-dark border fs-xxs">${u.profileLabelPtBr}</span></td>
                  <td class="fw-bold text-dark">R$ ${(u.thresholds?.transferLimit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td class="fw-bold text-dark">R$ ${(u.thresholds?.payoutLimit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td class="fw-bold text-dark">R$ ${(u.thresholds?.paymentLimit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span class="badge ${u.thresholds?.canApproveBankDetails ? 'bg-success' : 'bg-secondary'} fs-xxs">
                      ${u.thresholds?.canApproveBankDetails ? 'Autorizado' : 'Não autorizado'}
                    </span>
                  </td>
                  <td>
                    <span class="badge ${u.thresholds?.canApproveAnticipation ? 'bg-success' : 'bg-secondary'} fs-xxs">
                      ${u.thresholds?.canApproveAnticipation ? 'Autorizado' : 'Somente Análise'}
                    </span>
                  </td>
                  <td><span class="badge bg-primary fs-xxs">${u.thresholds?.maxApprovalLevel || 'NIVEL_1'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderScopesHtml() {
    const users = accessControlService.getUsers();

    return `
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-header bg-white border-bottom py-2 px-3">
          <h6 class="fw-bold mb-0 text-dark">Matriz de Escopos (Produtor &bull; Evento)</h6>
          <div class="text-muted fs-xs">Define onde cada colaborador pode exercer suas permissões. O acesso só é concedido se <code>Permissão + Escopo = Válido</code>.</div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 fs-xs">
            <thead class="table-light fs-xxs text-uppercase fw-bold text-muted">
              <tr>
                <th>Usuário</th>
                <th>Vínculo</th>
                <th>Produtores Autorizados</th>
                <th>Eventos Autorizados</th>
                <th>Tipo de Acesso</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td>
                    <strong class="text-dark">${u.name}</strong>
                    <div class="text-muted fs-xxs">${u.profileLabelPtBr}</div>
                  </td>
                  <td>
                    <span class="badge ${u.userType === 'INTERNO_DISK' ? 'bg-primary-subtle text-primary border' : 'bg-warning-subtle text-dark border'} fs-xxs">
                      ${u.userType === 'INTERNO_DISK' ? 'Corporativo Disk' : u.producerName}
                    </span>
                  </td>
                  <td>
                    ${u.scope.allProducers
                      ? '<span class="badge bg-success-subtle text-success border border-success-subtle fs-xxs">Todos os Produtores (Global)</span>'
                      : (u.scope.producerIds.length ? u.scope.producerIds.map(p => `<span class="badge bg-light text-dark border fs-xxs me-1">${p}</span>`).join('') : '<span class="text-muted fs-xxs">Nenhum</span>')
                    }
                  </td>
                  <td>
                    ${u.scope.allEvents
                      ? '<span class="badge bg-success-subtle text-success border border-success-subtle fs-xxs">Todos os Eventos</span>'
                      : (u.scope.eventIds.length ? u.scope.eventIds.map(e => `<span class="badge bg-light text-dark border fs-xxs me-1">Evt #${e}</span>`).join('') : '<span class="text-muted fs-xxs">Nenhum</span>')
                    }
                  </td>
                  <td>
                    <span class="badge ${u.scope.allProducers && u.scope.allEvents ? 'bg-dark' : 'bg-secondary'} fs-xxs">
                      ${u.scope.allProducers && u.scope.allEvents ? 'Acesso Amplo' : 'Escopo Restrito'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderSecurityHtml() {
    return `
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-header bg-white border-bottom py-2 px-3">
          <h6 class="fw-bold mb-0 text-dark">Políticas de Segurança e Sessões Ativas</h6>
          <div class="text-muted fs-xs">Controles de tempo de sessão, autenticação em dois fatores e proteção contra força bruta.</div>
        </div>
        <div class="card-body p-3">
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <div class="p-3 border rounded bg-light">
                <strong class="text-dark fs-xs d-block mb-2"><i class="ph-shield-check text-success me-1"></i> Parâmetros Globais de Segurança</strong>
                <ul class="list-unstyled fs-xs mb-0">
                  <li class="mb-2 d-flex justify-content-between">
                    <span class="text-muted">Tentativas máximas de login:</span>
                    <strong class="text-dark">5 tentativas (bloqueio automático)</strong>
                  </li>
                  <li class="mb-2 d-flex justify-content-between">
                    <span class="text-muted">Duração máxima de sessão:</span>
                    <strong class="text-dark">24 horas (30 dias com "manter conectado")</strong>
                  </li>
                  <li class="mb-2 d-flex justify-content-between">
                    <span class="text-muted">Exigência de MFA / 2FA:</span>
                    <strong class="text-primary">Obrigatório para Administrador e Gestor</strong>
                  </li>
                  <li class="d-flex justify-content-between">
                    <span class="text-muted">Revogação de sessões:</span>
                    <button class="btn btn-xs btn-outline-danger fw-bold" onclick="alert('Todas as sessões ativas foram revogadas com sucesso!')">Revogar Todas as Sessões</button>
                  </li>
                </ul>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="p-3 border rounded bg-light">
                <strong class="text-dark fs-xs d-block mb-2"><i class="ph-lock-key text-primary me-1"></i> Princípio do Menor Privilégio</strong>
                <p class="fs-xxs text-muted mb-2">
                  Um colaborador não pode conceder permissões ou alçadas monetárias superiores àquelas que ele próprio possui administrativamente.
                </p>
                <div class="alert alert-info py-2 px-3 fs-xxs mb-0">
                  <i class="ph-info me-1"></i> Auditoria de acessos ativa: cada alteração de perfil, escopo ou alçada é gravada de forma imutável com IP e sessão.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderAuditHtml() {
    return `
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-header bg-white border-bottom py-2 px-3">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-2">
            <div>
              <h6 class="fw-bold mb-0 text-dark">Trilha Imutável de Auditoria de Acessos</h6>
              <div class="text-muted fs-xs">Registros de logins, alterações de permissões, escopos e bloqueios de segurança.</div>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <input type="text" class="form-control form-control-sm" id="input-filter-access-audit" style="width: 250px;" placeholder="Buscar na trilha de auditoria..." oninput="window.filterAccessAuditTable()">
              <select class="form-select form-select-sm" id="select-filter-access-audit-action" style="width: 170px;" onchange="window.filterAccessAuditTable()">
                <option value="TODAS">Todas as Ações</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="LOGIN_FAIL">Falha de Login</option>
                <option value="USER_CREATE">Criação de Usuário</option>
                <option value="USER_UPDATE">Atualização de Cadastro</option>
                <option value="USER_BLOCK">Bloqueio de Usuário</option>
                <option value="USER_UNBLOCK">Desbloqueio</option>
                <option value="THRESHOLD_CHANGE">Alteração de Alçada</option>
              </select>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 fs-xs">
            <thead class="table-light fs-xxs text-uppercase fw-bold text-muted">
              <tr>
                <th style="width: 140px;">Identificador</th>
                <th style="width: 140px;">Data/Hora</th>
                <th>Responsável (Ator)</th>
                <th>Ação Executada</th>
                <th>Usuário Afetado</th>
                <th>Detalhes do Evento</th>
                <th style="width: 110px;">IP / Sessão</th>
              </tr>
            </thead>
            <tbody id="table-access-audit-body">
              <!-- Renderizado via renderAuditTable() -->
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderAuditTable() {
    const tbody = document.getElementById('table-access-audit-body');
    if (!tbody) return;

    const search = document.getElementById('input-filter-access-audit')?.value || '';
    const action = document.getElementById('select-filter-access-audit-action')?.value || 'TODAS';

    const logs = accessAuditService.getLogs({ search, action });

    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">Nenhum registro de auditoria encontrado.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td class="font-monospace fw-bold text-primary fs-xxs">${l.id}</td>
        <td class="text-muted fs-xxs">${new Date(l.timestamp).toLocaleString('pt-BR')}</td>
        <td>
          <strong class="text-dark fs-xs">${l.actorName}</strong>
          <div class="text-muted fs-xxs">${l.actorRole}</div>
        </td>
        <td><span class="badge bg-light text-dark border fs-xxs">${l.action}</span></td>
        <td>
          <div class="text-dark fs-xs">${l.targetUserName || '—'}</div>
        </td>
        <td class="text-dark fs-xs">${l.details}</td>
        <td class="text-muted fs-xxs font-monospace">${l.ip}</td>
      </tr>
    `).join('');
  },

  /**
   * Abre o Modal do Assistente de Criação de Usuário (8 Etapas)
   */
  openCreateWizard() {
    currentWizardStep = 1;
    this.renderWizardStep();
    this.showModal('modal-access-user-wizard');
  },

  nextWizardStep() {
    if (currentWizardStep < 8) {
      this.collectWizardStepData(currentWizardStep);
      currentWizardStep++;
      this.renderWizardStep();
    }
  },

  prevWizardStep() {
    if (currentWizardStep > 1) {
      currentWizardStep--;
      this.renderWizardStep();
    }
  },

  collectWizardStepData(step) {
    if (step === 1) {
      wizardFormData.name = document.getElementById('wiz-user-name')?.value || '';
      wizardFormData.email = document.getElementById('wiz-user-email')?.value || '';
      wizardFormData.phone = document.getElementById('wiz-user-phone')?.value || '';
      wizardFormData.jobTitle = document.getElementById('wiz-user-job')?.value || '';
    } else if (step === 2) {
      wizardFormData.userType = document.getElementById('wiz-user-type')?.value || 'INTERNO_DISK';
      wizardFormData.producerId = document.getElementById('wiz-user-producer')?.value || '';
      wizardFormData.producerName = document.getElementById('wiz-user-producer-name')?.value || '';
    } else if (step === 3) {
      wizardFormData.profile = document.getElementById('wiz-user-profile')?.value || 'FINANCEIRO';
    }
  },

  renderWizardStep() {
    const stepContainer = document.getElementById('wizard-user-step-content');
    const stepIndicator = document.getElementById('wizard-step-indicator');
    const btnPrev = document.getElementById('btn-wizard-prev');
    const btnNext = document.getElementById('btn-wizard-next');
    const btnFinish = document.getElementById('btn-wizard-finish');

    if (!stepContainer) return;

    if (stepIndicator) {
      stepIndicator.textContent = `Etapa ${currentWizardStep} de 8`;
    }

    if (btnPrev) btnPrev.style.display = currentWizardStep === 1 ? 'none' : 'inline-block';
    if (btnNext) btnNext.style.display = currentWizardStep === 8 ? 'none' : 'inline-block';
    if (btnFinish) btnFinish.style.display = currentWizardStep === 8 ? 'inline-block' : 'none';

    switch (currentWizardStep) {
      case 1:
        stepContainer.innerHTML = `
          <h6 class="fw-bold mb-3 text-dark"><i class="ph-identification-badge text-primary me-1"></i> 1. Identificação do Usuário</h6>
          <div class="row g-2 fs-xs">
            <div class="col-12 col-md-6">
              <label class="form-label fw-semibold">Nome Completo *</label>
              <input type="text" class="form-control form-control-sm" id="wiz-user-name" value="${wizardFormData.name}" required placeholder="Ex: Maria Souza">
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label fw-semibold">E-mail Corporativo *</label>
              <input type="email" class="form-control form-control-sm" id="wiz-user-email" value="${wizardFormData.email}" required placeholder="maria@empresa.com.br">
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label fw-semibold">Telefone / WhatsApp</label>
              <input type="text" class="form-control form-control-sm" id="wiz-user-phone" value="${wizardFormData.phone}" placeholder="(41) 99999-0000">
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label fw-semibold">Cargo / Função</label>
              <input type="text" class="form-control form-control-sm" id="wiz-user-job" value="${wizardFormData.jobTitle}" placeholder="Ex: Analista de Controladoria">
            </div>
          </div>
        `;
        break;

      case 2:
        stepContainer.innerHTML = `
          <h6 class="fw-bold mb-3 text-dark"><i class="ph-buildings text-primary me-1"></i> 2. Vínculo Organizacional</h6>
          <div class="row g-2 fs-xs">
            <div class="col-12 col-md-6">
              <label class="form-label fw-semibold">Tipo de Usuário *</label>
              <select class="form-select form-select-sm" id="wiz-user-type" onchange="window.toggleWizardProducerField()">
                <option value="INTERNO_DISK" ${wizardFormData.userType === 'INTERNO_DISK' ? 'selected' : ''}>Usuário Interno DiskIngressos</option>
                <option value="PRODUTOR" ${wizardFormData.userType === 'PRODUTOR' ? 'selected' : ''}>Usuário de Produtor / Terceiro</option>
              </select>
            </div>
            <div class="col-12 col-md-6" id="wiz-producer-group">
              <label class="form-label fw-semibold">Produtor Vinculado</label>
              <input type="text" class="form-control form-control-sm" id="wiz-user-producer-name" value="${wizardFormData.producerName}" placeholder="Ex: Parque Jaime Lerner">
              <input type="hidden" id="wiz-user-producer" value="prod-1">
            </div>
          </div>
        `;
        break;

      case 3:
        stepContainer.innerHTML = `
          <h6 class="fw-bold mb-3 text-dark"><i class="ph-shield text-primary me-1"></i> 3. Perfil de Acesso Base</h6>
          <div class="fs-xs mb-2 text-muted">Selecione o perfil que fornecerá o conjunto padrão de permissões:</div>
          <select class="form-select form-select-sm" id="wiz-user-profile">
            <option value="FINANCEIRO">Financeiro Operacional (Nível 1)</option>
            <option value="GESTOR_FINANCEIRO">Gestor Financeiro (Nível 2)</option>
            <option value="PRODUTOR_ADMINISTRADOR">Produtor Administrador</option>
            <option value="PRODUTOR_FINANCEIRO">Produtor Financeiro</option>
            <option value="PRODUTOR_OPERACIONAL">Produtor Operacional</option>
            <option value="MARKETING">Marketing &amp; CRM</option>
            <option value="ATENDIMENTO_SAC">Atendimento SAC</option>
            <option value="ADMINISTRADOR">Administrador Master</option>
          </select>
        `;
        break;

      case 4:
        stepContainer.innerHTML = `
          <h6 class="fw-bold mb-3 text-dark"><i class="ph-compass text-primary me-1"></i> 4. Escopo (Produtor e Eventos)</h6>
          <div class="p-3 border rounded bg-light fs-xs mb-3">
            <div class="form-check mb-2">
              <input class="form-check-input" type="checkbox" id="wiz-scope-all-producers" checked>
              <label class="form-check-label fw-semibold">Autorizar acesso a todos os produtores</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="wiz-scope-all-events" checked>
              <label class="form-check-label fw-semibold">Autorizar acesso a todos os eventos do produtor</label>
            </div>
          </div>
        `;
        break;

      case 5:
        stepContainer.innerHTML = `
          <h6 class="fw-bold mb-3 text-dark"><i class="ph-list-checks text-primary me-1"></i> 5. Permissões Granulares</h6>
          <div class="fs-xs text-muted mb-2">Permissões herdadas do perfil selecionado com possibilidade de personalização adicional:</div>
          <div class="row g-2 fs-xs">
            <div class="col-6"><input type="checkbox" checked disabled> Visualizar Saldos</div>
            <div class="col-6"><input type="checkbox" checked disabled> Analisar Aprovações</div>
            <div class="col-6"><input type="checkbox" checked> Aprovar Liquidações N1</div>
            <div class="col-6"><input type="checkbox"> Aprovar Nível 2 (Gestor)</div>
          </div>
        `;
        break;

      case 6:
        stepContainer.innerHTML = `
          <h6 class="fw-bold mb-3 text-dark"><i class="ph-scales text-primary me-1"></i> 6. Alçadas de Aprovação</h6>
          <div class="row g-2 fs-xs">
            <div class="col-6">
              <label class="form-label">Limite Transferência (R$)</label>
              <input type="number" class="form-control form-control-sm" id="wiz-limit-transf" value="50000">
            </div>
            <div class="col-6">
              <label class="form-label">Limite Pagamento (R$)</label>
              <input type="number" class="form-control form-control-sm" id="wiz-limit-pay" value="25000">
            </div>
          </div>
        `;
        break;

      case 7:
        stepContainer.innerHTML = `
          <h6 class="fw-bold mb-3 text-dark"><i class="ph-lock text-primary me-1"></i> 7. Segurança &amp; Credenciais</h6>
          <div class="fs-xs p-3 border rounded bg-light">
            <div class="form-check mb-2">
              <input class="form-check-input" type="checkbox" id="wiz-force-password" checked>
              <label class="form-check-label fw-semibold">Exigir alteração de senha no primeiro login</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="wiz-mfa">
              <label class="form-check-label fw-semibold">Exigir autenticação em dois fatores (MFA/2FA)</label>
            </div>
          </div>
        `;
        break;

      case 8:
        stepContainer.innerHTML = `
          <h6 class="fw-bold mb-3 text-dark"><i class="ph-check-circle text-success me-1"></i> 8. Revisão e Confirmação</h6>
          <div class="card card-body p-3 bg-light border fs-xs mb-2">
            <div><strong>Nome:</strong> ${wizardFormData.name || 'Não informado'}</div>
            <div><strong>E-mail:</strong> ${wizardFormData.email || 'Não informado'}</div>
            <div><strong>Perfil:</strong> ${wizardFormData.profile}</div>
            <div><strong>Vínculo:</strong> ${wizardFormData.userType === 'INTERNO_DISK' ? 'Interno Disk' : 'Produtor'}</div>
          </div>
          <p class="fs-xxs text-muted mb-0">Ao confirmar, o usuário será criado com trilha de auditoria e credenciais temporárias.</p>
        `;
        break;
    }
  },

  confirmCreateUser() {
    this.collectWizardStepData(currentWizardStep);

    try {
      accessControlService.createUser(wizardFormData);
      this.hideModal('modal-access-user-wizard');
      this.renderUsersTable();
      if (window.showAppNotification) {
        window.showAppNotification(`Usuário ${wizardFormData.name} criado com sucesso!`, 'success');
      }
    } catch (err) {
      alert(`Erro ao criar usuário: ${err.message}`);
    }
  },

  handleToggleBlock(id) {
    try {
      const res = accessControlService.toggleUserBlock(id);
      this.renderUsersTable();
      if (window.showAppNotification) {
        window.showAppNotification(`Usuário agora está ${res.status}!`, 'info');
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  },

  handleResetPassword(id) {
    try {
      const res = accessControlService.resetPassword(id);
      alert(res.message);
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  },

  showModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(el).show();
    } else {
      el.classList.add('show');
      el.style.display = 'block';
    }
  },

  hideModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(el).hide();
    } else {
      el.classList.remove('show');
      el.style.display = 'none';
    }
  },

  bindGlobalEvents() {
    window.switchAccessTab = (tab) => this.switchTab(tab);
    window.filterAccessUsersTable = () => this.renderUsersTable();
    window.filterAccessAuditTable = () => this.renderAuditTable();
    window.openCreateUserWizard = () => this.openCreateWizard();
    window.wizardNextStep = () => this.nextWizardStep();
    window.wizardPrevStep = () => this.prevWizardStep();
    window.confirmCreateUserWizard = () => this.confirmCreateUser();
    window.handleToggleUserBlock = (id) => this.handleToggleBlock(id);
    window.handleResetPassword = (id) => this.handleResetPassword(id);
  }
};
