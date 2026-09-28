/**
 * ============================================================================
 * MEGA PACOTE 1 — AUTENTICAÇÃO + GERENCIAMENTO DE ACESSO
 * Motor RBAC, Escopos e Controle de Sessão (src/services/accessControlService.js)
 * ============================================================================
 */

import { accessAuditService } from './accessAuditService.js';

/**
 * Catálogo de Perfis e Permissões Padrão
 */
export const PROFILE_DEFAULTS = {
  ADMINISTRADOR: {
    label: 'Administrador Master',
    badgeClass: 'bg-dark text-white',
    description: 'Acesso irrestrito a configurações, finanças e governança da plataforma.',
    permissions: [
      'acesso.usuarios.visualizar',
      'acesso.usuarios.criar',
      'acesso.usuarios.editar',
      'acesso.usuarios.bloquear',
      'acesso.perfis.visualizar',
      'acesso.perfis.administrar',
      'acesso.permissoes.administrar',
      'acesso.alcadas.visualizar',
      'acesso.alcadas.administrar',
      'acesso.auditoria.visualizar',
      'financeiro.dashboard.visualizar',
      'financeiro.saldos.visualizar',
      'financeiro.aprovacoes.visualizar',
      'financeiro.aprovacoes.analisar',
      'financeiro.aprovacoes.aprovar',
      'financeiro.aprovacoes.rejeitar',
      'financeiro.aprovacoes.devolver',
      'financeiro.aprovacoes.nivel1',
      'financeiro.aprovacoes.nivel2',
      'financeiro.aprovacoes.administrar',
      'financeiro.transferencias.criar',
      'financeiro.transferencias.aprovar',
      'financeiro.repasses.solicitar',
      'financeiro.repasses.aprovar',
      'financeiro.antecipacoes.solicitar',
      'financeiro.antecipacoes.aprovar',
      'financeiro.pagamentos.criar',
      'financeiro.pagamentos.aprovar',
      'financeiro.estornos.solicitar',
      'financeiro.estornos.aprovar',
      'financeiro.dados_bancarios.editar',
      'financeiro.dados_bancarios.aprovar',
      'eventos.visualizar',
      'eventos.criar',
      'eventos.editar',
      'eventos.excluir',
      'marketing.visualizar',
      'marketing.campanhas.criar',
      'atendimento.consultar',
      'atendimento.atender',
      'contabilidade.visualizar'
    ],
    thresholds: {
      transferLimit: 10000000,
      payoutLimit: 10000000,
      paymentLimit: 10000000,
      refundLimit: 10000000,
      canApproveBankDetails: true,
      canApproveAnticipation: true,
      maxApprovalLevel: 'DIRETORIA'
    }
  },

  GESTOR_FINANCEIRO: {
    label: 'Gestor Financeiro',
    badgeClass: 'bg-primary text-white',
    description: 'Alçada executiva N2, autorização de antecipações e alterações bancárias.',
    permissions: [
      'acesso.usuarios.visualizar',
      'acesso.alcadas.visualizar',
      'acesso.auditoria.visualizar',
      'financeiro.dashboard.visualizar',
      'financeiro.saldos.visualizar',
      'financeiro.aprovacoes.visualizar',
      'financeiro.aprovacoes.analisar',
      'financeiro.aprovacoes.aprovar',
      'financeiro.aprovacoes.rejeitar',
      'financeiro.aprovacoes.devolver',
      'financeiro.aprovacoes.nivel1',
      'financeiro.aprovacoes.nivel2',
      'financeiro.aprovacoes.administrar',
      'financeiro.transferencias.criar',
      'financeiro.transferencias.aprovar',
      'financeiro.repasses.solicitar',
      'financeiro.repasses.aprovar',
      'financeiro.antecipacoes.solicitar',
      'financeiro.antecipacoes.aprovar',
      'financeiro.pagamentos.criar',
      'financeiro.pagamentos.aprovar',
      'financeiro.estornos.solicitar',
      'financeiro.estornos.aprovar',
      'financeiro.dados_bancarios.editar',
      'financeiro.dados_bancarios.aprovar',
      'contabilidade.visualizar'
    ],
    thresholds: {
      transferLimit: 500000,
      payoutLimit: 500000,
      paymentLimit: 500000,
      refundLimit: 100000,
      canApproveBankDetails: true,
      canApproveAnticipation: true,
      maxApprovalLevel: 'NIVEL_2'
    }
  },

  FINANCEIRO: {
    label: 'Financeiro Operacional',
    badgeClass: 'bg-success text-white',
    description: 'Análise diária de caixa, liquidações N1 até R$ 50 mil.',
    permissions: [
      'financeiro.dashboard.visualizar',
      'financeiro.saldos.visualizar',
      'financeiro.aprovacoes.visualizar',
      'financeiro.aprovacoes.analisar',
      'financeiro.aprovacoes.aprovar',
      'financeiro.aprovacoes.rejeitar',
      'financeiro.aprovacoes.devolver',
      'financeiro.aprovacoes.nivel1',
      'financeiro.transferencias.aprovar',
      'financeiro.repasses.aprovar',
      'financeiro.pagamentos.aprovar',
      'financeiro.estornos.aprovar'
    ],
    thresholds: {
      transferLimit: 50000,
      payoutLimit: 50000,
      paymentLimit: 25000,
      refundLimit: 5000,
      canApproveBankDetails: false,
      canApproveAnticipation: false, // Somente análise
      maxApprovalLevel: 'NIVEL_1'
    }
  },

  PRODUTOR_ADMINISTRADOR: {
    label: 'Produtor Administrador',
    badgeClass: 'bg-warning text-dark',
    description: 'Gestor geral do produtor com autonomia total sobre eventos e solicitações.',
    permissions: [
      'eventos.visualizar',
      'eventos.criar',
      'eventos.editar',
      'eventos.excluir',
      'financeiro.dashboard.visualizar',
      'financeiro.saldos.visualizar',
      'financeiro.repasses.solicitar',
      'financeiro.repasses.visualizar',
      'financeiro.transferencias.criar',
      'financeiro.antecipacoes.solicitar',
      'financeiro.dados_bancarios.editar',
      'marketing.visualizar',
      'marketing.campanhas.criar'
    ],
    thresholds: {
      transferLimit: 0,
      payoutLimit: 0,
      paymentLimit: 0,
      refundLimit: 0,
      canApproveBankDetails: false,
      canApproveAnticipation: false,
      maxApprovalLevel: 'NIVEL_1'
    }
  },

  PRODUTOR_FINANCEIRO: {
    label: 'Produtor Financeiro',
    badgeClass: 'bg-info text-white',
    description: 'Operador financeiro do produtor para solicitar repasses e conferir extratos.',
    permissions: [
      'financeiro.dashboard.visualizar',
      'financeiro.saldos.visualizar',
      'financeiro.repasses.solicitar',
      'financeiro.repasses.visualizar',
      'financeiro.transferencias.criar'
    ],
    thresholds: {
      transferLimit: 0,
      payoutLimit: 0,
      paymentLimit: 0,
      refundLimit: 0,
      canApproveBankDetails: false,
      canApproveAnticipation: false,
      maxApprovalLevel: 'NIVEL_1'
    }
  },

  PRODUTOR_OPERACIONAL: {
    label: 'Produtor Operacional',
    badgeClass: 'bg-light text-dark border',
    description: 'Acompanhamento de portaria, check-in e participantes.',
    permissions: [
      'eventos.visualizar',
      'eventos.checkin',
      'eventos.participantes'
    ],
    thresholds: {
      transferLimit: 0,
      payoutLimit: 0,
      paymentLimit: 0,
      refundLimit: 0,
      canApproveBankDetails: false,
      canApproveAnticipation: false,
      maxApprovalLevel: 'NIVEL_1'
    }
  },

  MARKETING: {
    label: 'Marketing & CRM',
    badgeClass: 'bg-purple text-white',
    description: 'Gestão de campanhas, públicos e tráfego pago.',
    permissions: [
      'marketing.visualizar',
      'marketing.campanhas.criar',
      'marketing.campanhas.editar',
      'marketing.audiences',
      'marketing.pixels'
    ],
    thresholds: {
      transferLimit: 0,
      payoutLimit: 0,
      paymentLimit: 0,
      refundLimit: 0,
      canApproveBankDetails: false,
      canApproveAnticipation: false,
      maxApprovalLevel: 'NIVEL_1'
    }
  },

  ATENDIMENTO_SAC: {
    label: 'Atendimento SAC',
    badgeClass: 'bg-secondary text-white',
    description: 'Suporte ao cliente final e solicitação de estornos pontuais.',
    permissions: [
      'atendimento.consultar',
      'atendimento.atender',
      'financeiro.estornos.solicitar'
    ],
    thresholds: {
      transferLimit: 0,
      payoutLimit: 0,
      paymentLimit: 0,
      refundLimit: 0,
      canApproveBankDetails: false,
      canApproveAnticipation: false,
      maxApprovalLevel: 'NIVEL_1'
    }
  },

  DEVELOPER: {
    label: 'Developer / Engenharia',
    badgeClass: 'bg-danger text-white',
    description: 'Acesso técnico a ferramentas de diagnóstico e API.',
    permissions: ['*'],
    thresholds: {
      transferLimit: 10000000,
      payoutLimit: 10000000,
      paymentLimit: 10000000,
      refundLimit: 10000000,
      canApproveBankDetails: true,
      canApproveAnticipation: true,
      maxApprovalLevel: 'DIRETORIA'
    }
  }
};

/**
 * Base de Usuários Inicial com Perfis, Escopos e Alçadas
 */
let USERS_STORE = [
  {
    id: 'user-admin-master',
    name: 'Administrador Master',
    email: 'admin@diskingressos.com.br',
    phone: '(41) 99888-0001',
    jobTitle: 'Diretor de Tecnologia e Operações',
    status: 'ATIVO',
    userType: 'INTERNO_DISK',
    producerId: null,
    producerName: 'DiskIngressos Corporativo',
    profile: 'ADMINISTRADOR',
    profileLabelPtBr: 'Administrador Master',
    directPermissions: [],
    deniedPermissions: [],
    scope: {
      allProducers: true,
      producerIds: [],
      allEvents: true,
      eventIds: []
    },
    thresholds: { ...PROFILE_DEFAULTS.ADMINISTRADOR.thresholds },
    mfaEnabled: true,
    lastLoginAt: '2026-09-27T22:15:00.000Z',
    lastIp: '189.102.15.84',
    failedLoginAttempts: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-27T22:15:00.000Z'
  },
  {
    id: 'user-admin-carlos',
    name: 'Carlos Lima',
    email: 'carlos.lima@diskingressos.com.br',
    phone: '(41) 99888-0002',
    jobTitle: 'Gestor Financeiro e Controladoria',
    status: 'ATIVO',
    userType: 'INTERNO_DISK',
    producerId: null,
    producerName: 'DiskIngressos Corporativo',
    profile: 'GESTOR_FINANCEIRO',
    profileLabelPtBr: 'Gestor Financeiro',
    directPermissions: [],
    deniedPermissions: [],
    scope: {
      allProducers: true,
      producerIds: [],
      allEvents: true,
      eventIds: []
    },
    thresholds: { ...PROFILE_DEFAULTS.GESTOR_FINANCEIRO.thresholds },
    mfaEnabled: true,
    lastLoginAt: '2026-09-27T13:55:00.000Z',
    lastIp: '177.136.241.10',
    failedLoginAttempts: 0,
    createdAt: '2026-02-15T10:00:00.000Z',
    updatedAt: '2026-09-27T13:55:00.000Z'
  },
  {
    id: 'user-fin-mariana',
    name: 'Maria Souza',
    email: 'maria.souza@diskingressos.com.br',
    phone: '(41) 99888-0003',
    jobTitle: 'Analista Financeiro N1',
    status: 'ATIVO',
    userType: 'INTERNO_DISK',
    producerId: null,
    producerName: 'DiskIngressos Corporativo',
    profile: 'FINANCEIRO',
    profileLabelPtBr: 'Financeiro Operacional',
    directPermissions: [],
    deniedPermissions: [],
    scope: {
      allProducers: false,
      producerIds: ['prod-1', 'prod-2', 'prod-3', 'prod-festival', 'prod-art', 'prod-shows'],
      allEvents: false,
      eventIds: ['3368', '3195', '3178', '934']
    },
    thresholds: { ...PROFILE_DEFAULTS.FINANCEIRO.thresholds },
    mfaEnabled: false,
    lastLoginAt: '2026-09-27T15:10:00.000Z',
    lastIp: '189.102.15.84',
    failedLoginAttempts: 0,
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-09-27T15:10:00.000Z'
  },
  {
    id: 'user-producer-joao',
    name: 'João Silva',
    email: 'joao.silva@parquejlerner.com.br',
    phone: '(41) 99777-1122',
    jobTitle: 'Produtor Titular',
    status: 'ATIVO',
    userType: 'PRODUTOR',
    producerId: 'prod-1',
    producerName: 'Parque Jaime Lerner',
    profile: 'PRODUTOR_ADMINISTRADOR',
    profileLabelPtBr: 'Produtor Administrador',
    directPermissions: [],
    deniedPermissions: [],
    scope: {
      allProducers: false,
      producerIds: ['prod-1'],
      allEvents: false,
      eventIds: ['3368', '3195', '3178', '934']
    },
    thresholds: { ...PROFILE_DEFAULTS.PRODUTOR_ADMINISTRADOR.thresholds },
    mfaEnabled: false,
    lastLoginAt: '2026-09-27T14:32:00.000Z',
    lastIp: '201.86.112.50',
    failedLoginAttempts: 0,
    createdAt: '2026-04-10T14:00:00.000Z',
    updatedAt: '2026-09-27T14:32:00.000Z'
  }
];

let currentUser = { ...USERS_STORE[1] }; // Padrão: Carlos Lima (Gestor Financeiro)
let currentSession = {
  token: 'sess-carlos-init',
  userId: currentUser.id,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  ip: '177.136.241.10',
  userAgent: 'Mozilla/5.0 Disk/Enterprise',
  active: true
};

export const accessControlService = {
  /**
   * Resolve um identificador, e-mail ou objeto parcial para um SystemUser canônico
   */
  resolveUser(userOrId) {
    if (!userOrId) return currentUser;
    if (typeof userOrId === 'string') {
      const found = USERS_STORE.find(u => u.id === userOrId || u.email?.toLowerCase() === userOrId.toLowerCase());
      if (found) return found;
      return {
        id: userOrId,
        name: userOrId,
        email: `${userOrId}@diskingressos.com.br`,
        profile: 'FINANCEIRO',
        status: 'ATIVO',
        scope: { allProducers: true, allEvents: true },
        thresholds: { ...PROFILE_DEFAULTS.FINANCEIRO.thresholds }
      };
    }
    if (typeof userOrId === 'object') {
      if (userOrId.id) {
        const found = USERS_STORE.find(u => u.id === userOrId.id || (userOrId.email && u.email.toLowerCase() === userOrId.email.toLowerCase()));
        if (found) {
          return {
            ...found,
            ...userOrId,
            profile: userOrId.profile || found.profile,
            scope: userOrId.scope || found.scope,
            thresholds: userOrId.thresholds || found.thresholds
          };
        }
      }
      const roleStr = String(userOrId.profile || userOrId.role || '').toUpperCase();
      let matchedProfile = 'FINANCEIRO';
      if (roleStr.includes('GESTOR') || roleStr.includes('CHECKER') || roleStr.includes('DIRETORIA') || roleStr.includes('CONTROLADORIA')) {
        matchedProfile = 'GESTOR_FINANCEIRO';
      } else if (roleStr.includes('PRODUTOR')) {
        matchedProfile = 'PRODUTOR_ADMINISTRADOR';
      } else if (roleStr.includes('ADMIN')) {
        matchedProfile = 'ADMINISTRADOR';
      } else if (roleStr.includes('MARKETING')) {
        matchedProfile = 'MARKETING';
      } else if (roleStr.includes('SAC') || roleStr.includes('ATENDIMENTO')) {
        matchedProfile = 'ATENDIMENTO_SAC';
      }
      const def = PROFILE_DEFAULTS[matchedProfile] || PROFILE_DEFAULTS.FINANCEIRO;
      return {
        id: userOrId.id || `usr-${Date.now()}`,
        name: userOrId.name || 'Usuário Operacional',
        email: userOrId.email || 'operador@diskingressos.com.br',
        profile: matchedProfile,
        status: userOrId.status || 'ATIVO',
        scope: userOrId.scope || { allProducers: true, allEvents: true },
        thresholds: userOrId.thresholds || { ...def.thresholds },
        directPermissions: userOrId.directPermissions || [],
        deniedPermissions: userOrId.deniedPermissions || []
      };
    }
    return currentUser;
  },

  /**
   * Avalia autorização canônica: can(user, permission, context)
   * Responde: O que o usuário pode fazer? E onde (escopo) ele pode fazer?
   */
  can(user = currentUser, permission, context = {}) {
    const actualUser = this.resolveUser(user);
    if (!actualUser) return false;

    // 1. Usuário bloqueado não possui qualquer permissão
    if (actualUser.status === 'BLOQUEADO' || actualUser.status === 'PENDENTE_ATIVACAO') {
      return false;
    }

    // 2. Administrador Master e Developer possuem bypass total (exceto negação explícita)
    const isMaster = actualUser.profile === 'ADMINISTRADOR' || actualUser.profile === 'DEVELOPER';
    if (isMaster) {
      if (actualUser.deniedPermissions && actualUser.deniedPermissions.includes(permission)) {
        return false;
      }
      // Mesmo o Administrador respeita o escopo se fornecido expressamente no contexto
      return this.checkScope(actualUser, context);
    }

    // 3. Checagem de Negação Expressa
    if (actualUser.deniedPermissions && actualUser.deniedPermissions.includes(permission)) {
      return false;
    }

    // 4. Monta conjunto de permissões efetivas (Perfil Padrão + Permissões Diretas)
    const profileDef = PROFILE_DEFAULTS[actualUser.profile];
    const defaultPerms = profileDef ? profileDef.permissions : [];
    const directPerms = actualUser.directPermissions || [];
    const effectivePermissions = new Set([...defaultPerms, ...directPerms]);

    const hasPermission = effectivePermissions.has(permission) || effectivePermissions.has('*');
    if (!hasPermission) return false;

    // 5. Verificação de Escopo (Produtor e Evento)
    if (!this.checkScope(actualUser, context)) {
      return false;
    }

    // 6. Verificação de Alçada se o contexto exigir limite financeiro
    if (context.amount !== undefined && context.amount > 0 && context.operation) {
      if (!this.checkThreshold(actualUser, context.operation, context.amount)) {
        return false;
      }
    }

    return true;
  },

  /**
   * Verifica se o usuário tem autorização sobre o Produtor e Evento indicados
   */
  checkScope(user, context = {}) {
    if (!user || !user.scope) return false;
    const scope = user.scope;

    // Verificação de Produtor
    if (context.producerId) {
      if (!scope.allProducers) {
        const prodId = String(context.producerId);
        const authorizedProds = (scope.producerIds || []).map(String);
        if (!authorizedProds.includes(prodId)) {
          return false;
        }
      }
    }

    // Verificação de Evento
    if (context.eventId) {
      if (!scope.allEvents) {
        const evId = String(context.eventId);
        const authorizedEvents = (scope.eventIds || []).map(String);
        if (!authorizedEvents.includes(evId)) {
          return false;
        }
      }
    }

    return true;
  },

  /**
   * Verifica se o usuário possui alçada financeira suficiente para a operação
   */
  checkThreshold(user, operation, amount) {
    if (!user || !user.thresholds) return false;
    const t = user.thresholds;
    const numAmount = Number(amount) || 0;

    switch (operation) {
      case 'TRANSFERENCIA_EVENTOS':
      case 'TRANSFER':
        return numAmount <= (t.transferLimit || 0);

      case 'REPASSE':
      case 'PAYOUT':
        return numAmount <= (t.payoutLimit || 0);

      case 'PAGAMENTO':
      case 'PAGAMENTO_LOTE':
      case 'PAYMENT':
        return numAmount <= (t.paymentLimit || 0);

      case 'ESTORNO':
      case 'REFUND':
        return numAmount <= (t.refundLimit || 0);

      case 'ALTERACAO_DADOS_BANCARIOS':
        return Boolean(t.canApproveBankDetails);

      case 'ANTECIPACAO':
        return Boolean(t.canApproveAnticipation);

      default:
        return true;
    }
  },

  /**
   * Regra Fundamental de Delegação:
   * Um usuário não pode conceder permissões ou alçadas superiores àquelas que ele próprio possui.
   */
  validateDelegation(actor, targetPermissions = [], targetThresholds = {}) {
    if (!actor) throw new Error('Ator administrativo inválido.');
    if (actor.profile === 'ADMINISTRADOR' || actor.profile === 'DEVELOPER') {
      return { ok: true };
    }

    // 1. Checa cada permissão delegada
    for (const perm of targetPermissions) {
      if (!this.can(actor, perm)) {
        throw new Error(`Violação de menor privilégio: Você não possui a permissão "${perm}" para concedê-la a terceiros.`);
      }
    }

    // 2. Checa alçadas delegadas
    if (targetThresholds.transferLimit && targetThresholds.transferLimit > (actor.thresholds?.transferLimit || 0)) {
      throw new Error(`Não é permitido conceder alçada de transferência (R$ ${targetThresholds.transferLimit}) maior que a sua própria (R$ ${actor.thresholds?.transferLimit}).`);
    }

    if (targetThresholds.payoutLimit && targetThresholds.payoutLimit > (actor.thresholds?.payoutLimit || 0)) {
      throw new Error(`Não é permitido conceder alçada de repasse maior que a sua própria.`);
    }

    return { ok: true };
  },

  /**
   * Autenticação Real com Tratamento de Bloqueio por Tentativas
   */
  async login(email, password, keepConnected = false) {
    const user = USERS_STORE.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      accessAuditService.log({
        actorId: 'ANONYMOUS',
        actorName: email,
        action: 'LOGIN_FAIL',
        details: 'Tentativa de login com e-mail inexistente.'
      });
      throw new Error('E-mail ou senha incorretos.');
    }

    if (user.status === 'BLOQUEADO') {
      accessAuditService.log({
        actorId: user.id,
        actorName: user.name,
        targetUserId: user.id,
        action: 'LOGIN_FAIL',
        details: 'Tentativa de acesso em conta bloqueada administrativamente.'
      });
      throw new Error('Esta conta de acesso está bloqueada. Entre em contato com a Controladoria/Admin.');
    }

    // Simulação de validação de senha (em prod validado com Firebase Auth / Hash Seguro)
    const isValidPass = password && password.length >= 6;
    if (!isValidPass) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.status = 'BLOQUEADO';
        accessAuditService.log({
          actorId: 'SISTEMA',
          actorName: 'Guarda Antifraude',
          targetUserId: user.id,
          targetUserName: user.name,
          action: 'USER_BLOCK',
          details: 'Conta bloqueada automaticamente após 5 tentativas inválidas consecutivas.'
        });
        throw new Error('Conta bloqueada por excesso de tentativas incorretas. Procure o Administrador.');
      }

      accessAuditService.log({
        actorId: user.id,
        actorName: user.name,
        targetUserId: user.id,
        action: 'LOGIN_FAIL',
        details: `Senha inválida informada. Tentativa ${user.failedLoginAttempts} de 5.`
      });
      throw new Error('E-mail ou senha incorretos.');
    }

    // Sucesso de Login
    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date().toISOString();
    user.lastIp = '189.102.15.84';

    const token = `sess-${user.id}-${Date.now().toString(36)}`;
    const sessionDuration = keepConnected ? 30 * 86400000 : 86400000;

    currentSession = {
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + sessionDuration).toISOString(),
      ip: user.lastIp,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Disk/App',
      active: true
    };

    currentUser = { ...user };

    accessAuditService.log({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.profile,
      targetUserId: user.id,
      targetUserName: user.name,
      action: 'LOGIN',
      details: `Login bem-sucedido (${user.profileLabelPtBr}). Sessão criada.`,
      sessionId: token
    });

    return { ok: true, user: currentUser, session: currentSession };
  },

  /**
   * Encerramento formal de sessão (Logout)
   */
  logout() {
    if (currentUser) {
      accessAuditService.log({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.profile,
        action: 'LOGOUT',
        details: 'Sessão encerrada pelo usuário.',
        sessionId: currentSession?.token
      });
    }

    currentSession = null;
    return { ok: true };
  },

  /**
   * Retorna usuário atualmente autenticado
   */
  getCurrentUser() {
    return currentUser;
  },

  /**
   * Alterna usuário ativo (Utilizado no seletor de simulação de perfis)
   */
  switchCurrentUser(userIdOrProfile) {
    const found = USERS_STORE.find(u => u.id === userIdOrProfile || u.profile === userIdOrProfile);
    if (found) {
      currentUser = { ...found };
      currentSession = {
        token: `sess-${currentUser.id}-${Date.now().toString(36)}`,
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        ip: currentUser.lastIp || '127.0.0.1',
        userAgent: 'Disk/Simulator',
        active: true
      };
      return currentUser;
    }
    return currentUser;
  },

  /**
   * Listagem de Usuários
   */
  getUsers(filters = {}) {
    let list = [...USERS_STORE];

    if (filters.status && filters.status !== 'TODOS') {
      list = list.filter(u => u.status === filters.status);
    }

    if (filters.profile && filters.profile !== 'TODOS') {
      list = list.filter(u => u.profile === filters.profile);
    }

    if (filters.userType && filters.userType !== 'TODOS') {
      list = list.filter(u => u.userType === filters.userType);
    }

    if (filters.producerId) {
      list = list.filter(u => u.producerId === filters.producerId);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.jobTitle && u.jobTitle.toLowerCase().includes(q)) ||
        (u.producerName && u.producerName.toLowerCase().includes(q))
      );
    }

    return list;
  },

  /**
   * Busca usuário por ID
   */
  getUserById(id) {
    return USERS_STORE.find(u => u.id === id) || null;
  },

  /**
   * Cria novo usuário através do Assistente em 8 Etapas com validação de delegação
   */
  createUser(userData, actor = currentUser) {
    if (!userData.name || !userData.email) {
      throw new Error('Nome e e-mail são obrigatórios para cadastro.');
    }

    const existing = USERS_STORE.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      throw new Error(`O e-mail "${userData.email}" já está cadastrado para outro usuário.`);
    }

    // Validação de Menor Privilégio / Limite de Delegação
    this.validateDelegation(actor, userData.directPermissions || [], userData.thresholds || {});

    const profileMeta = PROFILE_DEFAULTS[userData.profile] || PROFILE_DEFAULTS.PRODUTOR_OPERACIONAL;
    const id = `user-${Date.now().toString(36)}`;

    const newUser = {
      id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      jobTitle: userData.jobTitle || 'Colaborador',
      status: userData.status || 'ATIVO',
      userType: userData.userType || 'INTERNO_DISK',
      producerId: userData.producerId || null,
      producerName: userData.producerName || null,
      profile: userData.profile || 'PRODUTOR_OPERACIONAL',
      profileLabelPtBr: profileMeta.label,
      directPermissions: userData.directPermissions || [],
      deniedPermissions: userData.deniedPermissions || [],
      scope: userData.scope || {
        allProducers: userData.userType === 'INTERNO_DISK',
        producerIds: userData.producerId ? [userData.producerId] : [],
        allEvents: userData.userType === 'INTERNO_DISK',
        eventIds: []
      },
      thresholds: { ...profileMeta.thresholds, ...(userData.thresholds || {}) },
      mfaEnabled: Boolean(userData.mfaEnabled),
      lastLoginAt: null,
      lastIp: null,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    USERS_STORE.unshift(newUser);

    accessAuditService.log({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.profile,
      targetUserId: newUser.id,
      targetUserName: newUser.name,
      action: 'USER_CREATE',
      details: `Criado usuário ${newUser.name} (${newUser.email}) com perfil ${newUser.profileLabelPtBr}.`
    });

    return { ok: true, data: newUser };
  },

  /**
   * Atualiza cadastro de usuário
   */
  updateUser(id, updates, actor = currentUser) {
    const user = this.getUserById(id);
    if (!user) throw new Error(`Usuário ${id} não encontrado.`);

    // Validação de delegação caso tente alterar permissões ou alçadas
    if (updates.directPermissions || updates.thresholds) {
      this.validateDelegation(actor, updates.directPermissions || [], updates.thresholds || {});
    }

    const previousValue = { ...user };
    Object.assign(user, updates);
    user.updatedAt = new Date().toISOString();

    accessAuditService.log({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.profile,
      targetUserId: user.id,
      targetUserName: user.name,
      action: 'USER_UPDATE',
      details: `Dados cadastrais do usuário ${user.name} atualizados.`,
      previousValue,
      newValue: updates
    });

    return { ok: true, data: user };
  },

  /**
   * Bloqueia ou Desbloqueia usuário
   */
  toggleUserBlock(id, actor = currentUser) {
    const user = this.getUserById(id);
    if (!user) throw new Error(`Usuário ${id} não encontrado.`);

    const isBlocking = user.status !== 'BLOQUEADO';
    user.status = isBlocking ? 'BLOQUEADO' : 'ATIVO';
    user.updatedAt = new Date().toISOString();

    accessAuditService.log({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.profile,
      targetUserId: user.id,
      targetUserName: user.name,
      action: isBlocking ? 'USER_BLOCK' : 'USER_UNBLOCK',
      details: `Usuário ${user.name} foi ${isBlocking ? 'BLOQUEADO' : 'DESBLOQUEADO'} por ${actor.name}.`
    });

    return { ok: true, data: user, status: user.status };
  },

  /**
   * Redefine senha do usuário
   */
  resetPassword(id, actor = currentUser) {
    const user = this.getUserById(id);
    if (!user) throw new Error(`Usuário ${id} não encontrado.`);

    user.failedLoginAttempts = 0;
    user.updatedAt = new Date().toISOString();

    accessAuditService.log({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.profile,
      targetUserId: user.id,
      targetUserName: user.name,
      action: 'PASSWORD_RESET',
      details: `Solicitada redefinição segura de senha para ${user.email}.`
    });

    return { ok: true, message: `Instruções de redefinição enviadas para ${user.email}.` };
  },

  /**
   * Estatísticas para os cards superiores da Visão Geral de Acessos
   */
  getStats() {
    const totalUsers = USERS_STORE.length;
    const activeUsers = USERS_STORE.filter(u => u.status === 'ATIVO').length;
    const blockedUsers = USERS_STORE.filter(u => u.status === 'BLOQUEADO').length;
    const producerUsers = USERS_STORE.filter(u => u.userType === 'PRODUTOR').length;
    const internalUsers = USERS_STORE.filter(u => u.userType === 'INTERNO_DISK').length;
    const recentAuditCount = accessAuditService.getLogs().length;

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      producerUsers,
      internalUsers,
      recentAuditCount
    };
  }
};
