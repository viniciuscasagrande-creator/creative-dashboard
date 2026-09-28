/**
 * ============================================================================
 * MEGA PACOTE — PERFIL FINANCEIRO + CENTRAL UNIFICADA DE APROVAÇÕES
 * Serviço de Notificações Internas Reais (src/services/financialApprovalNotificationService.js)
 * Conectado ao sino (#notification-badge e #notification-list-container)
 * ============================================================================
 */

let NOTIFICATIONS = [
  {
    id: 'NOTIF-001',
    recipientRole: 'FINANCEIRO',
    recipientUserId: null,
    title: 'Nova solicitação financeira',
    message: 'Parque Jaime Lerner solicitou transferência de R$ 35.000,00 entre eventos.',
    requestId: 'APR-2026-00142',
    requestType: 'TRANSFERENCIA_EVENTOS',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false,
    actionUrl: '#/financeiro/aprovacoes?id=APR-2026-00142',
    priority: 'ALTA'
  },
  {
    id: 'NOTIF-002',
    recipientRole: 'FINANCEIRO',
    recipientUserId: null,
    title: 'Repasse aguardando aprovação',
    message: 'DiskIngressos Eventos Ltda solicitou repasse de R$ 12.500,00 para 28/09.',
    requestId: 'APR-2026-00140',
    requestType: 'REPASSE',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    read: false,
    actionUrl: '#/financeiro/aprovacoes?id=APR-2026-00140',
    priority: 'MEDIA'
  },
  {
    id: 'NOTIF-003',
    recipientRole: 'PRODUTOR',
    recipientUserId: 'user-producer-1',
    title: 'Solicitação aprovada',
    message: 'Seu repasse APR-2026-00138 de R$ 3.500,00 foi aprovado pelo Financeiro e enviado para liquidação.',
    requestId: 'APR-2026-00138',
    requestType: 'REPASSE',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    read: false,
    actionUrl: '#/financeiro/repasses',
    priority: 'NORMAL'
  }
];

export const financialApprovalNotificationService = {
  /**
   * Obtém todas as notificações filtradas por perfil
   */
  getNotifications(role = 'FINANCEIRO', userId = null) {
    return NOTIFICATIONS.filter(n => {
      if (role === 'ADMINISTRADOR') return true;
      if (n.recipientRole === role) {
        if (!n.recipientUserId || !userId || n.recipientUserId === userId) return true;
      }
      return false;
    });
  },

  /**
   * Contador de notificações não lidas
   */
  getUnreadCount(role = 'FINANCEIRO', userId = null) {
    const list = this.getNotifications(role, userId);
    return list.filter(n => !n.read).length;
  },

  /**
   * Dispara notificação de nova solicitação para a equipe do Financeiro
   */
  notifyNewRequest(request) {
    const notif = {
      id: `NOTIF-${Date.now().toString(36).toUpperCase()}`,
      recipientRole: 'FINANCEIRO',
      recipientUserId: null,
      title: 'Nova solicitação financeira',
      message: `${request.producerName} solicitou ${request.type} no valor de R$ ${request.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      requestId: request.id,
      requestType: request.type,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: `#/financeiro/aprovacoes?id=${request.id}`,
      priority: request.riskLevel === 'ALTO' || request.riskLevel === 'CRITICO' ? 'ALTA' : 'MEDIA'
    };

    NOTIFICATIONS.unshift(notif);
    this.refreshNavbarBell('FINANCEIRO');
    return notif;
  },

  /**
   * Dispara notificação de decisão (Aprovada ou Rejeitada) para o Produtor
   */
  notifyDecision(request, decision, actor, reason = '') {
    const isApproved = decision === 'APROVADA';
    const notif = {
      id: `NOTIF-${Date.now().toString(36).toUpperCase()}`,
      recipientRole: 'PRODUTOR',
      recipientUserId: request.requestedBy?.id || null,
      title: isApproved ? 'Solicitação aprovada' : 'Solicitação rejeitada',
      message: isApproved
        ? `Sua solicitação ${request.id} (${request.type}) de R$ ${request.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi aprovada por ${actor.name}.`
        : `Sua solicitação ${request.id} foi rejeitada por ${actor.name}. Motivo: ${reason}`,
      requestId: request.id,
      requestType: request.type,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: `#/financeiro/aprovacoes?id=${request.id}`,
      priority: isApproved ? 'NORMAL' : 'ALTA'
    };

    NOTIFICATIONS.unshift(notif);
    return notif;
  },

  /**
   * Dispara notificação de devolução para correção
   */
  notifyReturned(request, actor, returnNotes = '') {
    const notif = {
      id: `NOTIF-${Date.now().toString(36).toUpperCase()}`,
      recipientRole: 'PRODUTOR',
      recipientUserId: request.requestedBy?.id || null,
      title: 'Solicitação devolvida para correção',
      message: `A solicitação ${request.id} precisa de ajustes antes de ser autorizada. Orientação: "${returnNotes}".`,
      requestId: request.id,
      requestType: request.type,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: `#/financeiro/aprovacoes?id=${request.id}`,
      priority: 'ALTA'
    };

    NOTIFICATIONS.unshift(notif);
    return notif;
  },

  /**
   * Dispara notificação de reenvio pelo produtor
   */
  notifyResubmitted(request) {
    const notif = {
      id: `NOTIF-${Date.now().toString(36).toUpperCase()}`,
      recipientRole: 'FINANCEIRO',
      recipientUserId: null,
      title: 'Solicitação corrigida e reenviada',
      message: `${request.producerName} corrigiu e reenviou a solicitação ${request.id}.`,
      requestId: request.id,
      requestType: request.type,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: `#/financeiro/aprovacoes?id=${request.id}`,
      priority: 'MEDIA'
    };

    NOTIFICATIONS.unshift(notif);
    this.refreshNavbarBell('FINANCEIRO');
    return notif;
  },

  /**
   * Marca uma ou todas as notificações como lidas
   */
  markAsRead(id = null, role = 'FINANCEIRO') {
    if (id) {
      const item = NOTIFICATIONS.find(n => n.id === id);
      if (item) item.read = true;
    } else {
      NOTIFICATIONS.forEach(n => {
        if (role === 'ADMINISTRADOR' || n.recipientRole === role) {
          n.read = true;
        }
      });
    }
    this.refreshNavbarBell(role);
  },

  /**
   * Atualiza reativamente os elementos visuais do sininho no DOM (#notification-badge e lista)
   */
  refreshNavbarBell(role = 'FINANCEIRO') {
    if (typeof document === 'undefined') return;

    const unread = this.getUnreadCount(role);
    const badge = document.getElementById('notification-badge');
    const countBadge = document.getElementById('notification-count-badge');
    const listContainer = document.getElementById('notification-list-container');

    if (badge) {
      badge.textContent = String(unread);
      badge.style.display = unread > 0 ? 'inline-block' : 'none';
    }

    if (countBadge) {
      countBadge.textContent = `${unread} Novas`;
    }

    if (listContainer) {
      const items = this.getNotifications(role);
      if (items.length === 0) {
        listContainer.innerHTML = `
          <div class="p-3 text-center text-muted fs-xs">
            <i class="ph-bell-slash fs-4 d-block mb-1 opacity-50"></i>
            Nenhuma notificação no momento
          </div>
        `;
      } else {
        listContainer.innerHTML = items.slice(0, 6).map(n => `
          <a href="${n.actionUrl}" class="d-flex align-items-start gap-2 p-2 border-bottom text-decoration-none ${n.read ? 'bg-white opacity-75' : 'bg-light'}" onclick="window.handleNotificationItemClick('${n.id}', '${n.requestId}')">
            <div class="p-1 rounded-circle ${n.priority === 'ALTA' ? 'bg-danger text-white' : 'bg-primary text-white'} d-flex align-items-center justify-content-center" style="width: 28px; height: 28px; font-size: 14px;">
              <i class="ph-scales"></i>
            </div>
            <div class="flex-grow-1" style="min-width: 0;">
              <div class="d-flex justify-content-between align-items-center">
                <strong class="fs-xxs text-dark text-truncate">${n.title}</strong>
                <span class="fs-xxs text-muted">${new Date(n.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p class="fs-xxs text-muted mb-0 text-truncate" title="${n.message}">${n.message}</p>
            </div>
          </a>
        `).join('');
      }
    }
  }
};
