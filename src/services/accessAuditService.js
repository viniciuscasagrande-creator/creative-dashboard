/**
 * ============================================================================
 * MEGA PACOTE 1 — AUTENTICAÇÃO + GERENCIAMENTO DE ACESSO
 * Trilha Imutável de Auditoria de Acessos (src/services/accessAuditService.js)
 * ============================================================================
 */

let AUDIT_LOGS = [
  {
    id: 'AUD-ACC-2026-00101',
    timestamp: '2026-09-27T21:32:00.000Z',
    actorId: 'user-admin-carlos',
    actorName: 'Carlos Lima (Gestor Financeiro)',
    actorRole: 'GESTOR_FINANCEIRO',
    targetUserId: 'user-fin-mariana',
    targetUserName: 'Maria Souza',
    action: 'THRESHOLD_CHANGE',
    details: 'Alterada alçada de transferência entre eventos de R$ 50.000 para R$ 100.000.',
    previousValue: { transferLimit: 50000 },
    newValue: { transferLimit: 100000 },
    ip: '177.136.241.10',
    sessionId: 'sess-carlos-992'
  },
  {
    id: 'AUD-ACC-2026-00102',
    timestamp: '2026-09-27T15:10:00.000Z',
    actorId: 'user-fin-mariana',
    actorName: 'Maria Souza',
    actorRole: 'FINANCEIRO',
    action: 'LOGIN',
    details: 'Autenticação bem-sucedida via credenciais corporativas.',
    ip: '189.102.15.84',
    sessionId: 'sess-mariana-412'
  },
  {
    id: 'AUD-ACC-2026-00103',
    timestamp: '2026-09-27T14:32:00.000Z',
    actorId: 'user-producer-joao',
    actorName: 'João Silva',
    actorRole: 'PRODUTOR_ADMINISTRADOR',
    targetUserId: 'user-producer-joao',
    targetUserName: 'João Silva',
    action: 'LOGIN',
    details: 'Login com perfil Produtor (Parque Jaime Lerner - 4 eventos).',
    ip: '201.86.112.50',
    sessionId: 'sess-joao-331'
  },
  {
    id: 'AUD-ACC-2026-00104',
    timestamp: '2026-09-27T13:55:00.000Z',
    actorId: 'user-admin-carlos',
    actorName: 'Carlos Lima',
    actorRole: 'GESTOR_FINANCEIRO',
    action: 'LOGIN',
    details: 'Acesso autenticado ao módulo de Controladoria e Gestão.',
    ip: '177.136.241.10',
    sessionId: 'sess-carlos-992'
  }
];

export const accessAuditService = {
  /**
   * Registra um novo evento de auditoria de acesso
   */
  log({
    actorId = 'SISTEMA',
    actorName = 'Sistema Automatizado',
    actorRole = 'SISTEMA',
    targetUserId,
    targetUserName,
    action,
    details = '',
    previousValue = null,
    newValue = null,
    ip = '127.0.0.1',
    sessionId = null
  }) {
    const seq = AUDIT_LOGS.length + 105;
    const entry = {
      id: `AUD-ACC-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`,
      timestamp: new Date().toISOString(),
      actorId,
      actorName,
      actorRole,
      targetUserId,
      targetUserName,
      action,
      details,
      previousValue,
      newValue,
      ip,
      sessionId: sessionId || `sess-${Date.now().toString(36)}`
    };

    AUDIT_LOGS.unshift(entry);
    return entry;
  },

  /**
   * Retorna lista de auditoria com filtros
   */
  getLogs({ search = '', action = '', targetUserId = '' } = {}) {
    let list = [...AUDIT_LOGS];

    if (action && action !== 'TODAS') {
      list = list.filter(l => l.action === action);
    }

    if (targetUserId) {
      list = list.filter(l => l.targetUserId === targetUserId || l.actorId === targetUserId);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(l =>
        l.id.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        (l.targetUserName && l.targetUserName.toLowerCase().includes(q)) ||
        l.details.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.ip.includes(q)
      );
    }

    return list;
  },

  /**
   * Limpa registros para testes
   */
  _resetLogs(initialLogs = null) {
    if (initialLogs) {
      AUDIT_LOGS = [...initialLogs];
    } else {
      AUDIT_LOGS = [];
    }
  }
};
