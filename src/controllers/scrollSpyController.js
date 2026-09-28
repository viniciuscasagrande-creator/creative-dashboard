/**
 * ============================================================================
 * DISK / LIMITLESS — CONTROLADOR DO COMPONENTE SCROLLSPY (UI COMPONENT SHOWCASE)
 * Gerenciador interativo de instâncias, logs de eventos e métodos do ScrollSpy
 * ============================================================================
 */

import { scrollSpyHelper } from '../components/scrollSpyHelper.js';

export const scrollSpyController = {
  initialized: false,
  eventLogs: [],

  /**
   * Inicializa todas as demonstrações e escutas do ScrollSpy
   */
  init() {
    this.bindMethodButtons();
    this.initNavbarExample();
    this.initNestedNavExample();
    this.initListGroupExample();
    this.bindEventsMonitor();
    this.initialized = true;
    this.logEvent('info', 'Controlador ScrollSpy inicializado com sucesso.');
  },

  /**
   * 1. Exemplo de Barra de Navegação (Navbar)
   */
  initNavbarExample() {
    const container = document.getElementById('scrollspy-container-navbar');
    if (!container) return;

    scrollSpyHelper.init(container, {
      target: '#navbar-scrollspy-demo',
      offset: 10
    });

    scrollSpyHelper.setupSmoothScrolling('#navbar-scrollspy-demo', container);
  },

  /**
   * 2. Exemplo de Navegação Aninhada (.nav-pills)
   */
  initNestedNavExample() {
    const container = document.getElementById('scrollspy-container-nested');
    if (!container) return;

    scrollSpyHelper.init(container, {
      target: '#scrollspy_nest',
      offset: 10
    });

    scrollSpyHelper.setupSmoothScrolling('#scrollspy_nest', container);
  },

  /**
   * 3. Exemplo de Grupo de Lista (.list-group)
   */
  initListGroupExample() {
    const container = document.getElementById('scrollspy-container-listgroup');
    if (!container) return;

    scrollSpyHelper.init(container, {
      target: '#scrollspy_list_group',
      offset: 10
    });

    scrollSpyHelper.setupSmoothScrolling('#scrollspy_list_group', container);
  },

  /**
   * Monitor de eventos oficial 'activate.bs.scrollspy'
   */
  bindEventsMonitor() {
    const containers = [
      { id: 'scrollspy-container-navbar', name: 'Navbar Demo' },
      { id: 'scrollspy-container-nested', name: 'Navegação Aninhada' },
      { id: 'scrollspy-container-listgroup', name: 'Grupo de Listas' }
    ];

    containers.forEach(({ id, name }) => {
      const el = document.getElementById(id);
      if (el) {
        scrollSpyHelper.onActivate(el, (e, relatedTarget) => {
          const targetText = relatedTarget ? relatedTarget.textContent.trim() : 'item';
          const targetHref = relatedTarget ? relatedTarget.getAttribute('href') : '';
          this.logEvent('activate', `[${name}] Ativado: <strong>${targetText}</strong> (${targetHref})`);
          this.updateActiveBadge(id, targetText);
        });
      }
    });
  },

  /**
   * Botões de teste dos 4 métodos do ScrollSpy (Refresh, Dispose, GetInstance, GetOrCreateInstance)
   */
  bindMethodButtons() {
    const btnRefresh = document.getElementById('btn-scrollspy-refresh');
    const btnDispose = document.getElementById('btn-scrollspy-dispose');
    const btnReinit = document.getElementById('btn-scrollspy-reinit');
    const btnClearLogs = document.getElementById('btn-scrollspy-clear-logs');

    if (btnRefresh && !btnRefresh.dataset.bound) {
      btnRefresh.dataset.bound = 'true';
      btnRefresh.addEventListener('click', () => {
        scrollSpyHelper.refreshAll();
        this.logEvent('method', '<code>refresh()</code> executado em todas as instâncias ativas.');
      });
    }

    if (btnDispose && !btnDispose.dataset.bound) {
      btnDispose.dataset.bound = 'true';
      btnDispose.addEventListener('click', () => {
        scrollSpyHelper.dispose('#scrollspy-container-navbar');
        scrollSpyHelper.dispose('#scrollspy-container-nested');
        scrollSpyHelper.dispose('#scrollspy-container-listgroup');
        this.logEvent('method', '<span class="text-danger fw-bold">dispose()</span> executado: instâncias destruídas temporariamente.');
      });
    }

    if (btnReinit && !btnReinit.dataset.bound) {
      btnReinit.dataset.bound = 'true';
      btnReinit.addEventListener('click', () => {
        this.initNavbarExample();
        this.initNestedNavExample();
        this.initListGroupExample();
        this.logEvent('method', '<span class="text-success fw-bold">getOrCreateInstance()</span> executado: instâncias recriadas.');
      });
    }

    if (btnClearLogs && !btnClearLogs.dataset.bound) {
      btnClearLogs.dataset.bound = 'true';
      btnClearLogs.addEventListener('click', () => {
        this.eventLogs = [];
        this.renderLogs();
      });
    }
  },

  /**
   * Adiciona entrada ao log do monitor
   */
  logEvent(type, message) {
    const time = new Date().toLocaleTimeString('pt-BR');
    let badge = '<span class="badge bg-secondary">INFO</span>';
    if (type === 'activate') badge = '<span class="badge bg-primary">ACTIVATE</span>';
    if (type === 'method') badge = '<span class="badge bg-success">METHOD</span>';

    this.eventLogs.unshift({ time, badge, message });
    if (this.eventLogs.length > 20) this.eventLogs.pop();
    this.renderLogs();
  },

  /**
   * Renderiza a lista de logs
   */
  renderLogs() {
    const logContainer = document.getElementById('scrollspy-event-log-container');
    if (!logContainer) return;

    if (this.eventLogs.length === 0) {
      logContainer.innerHTML = '<div class="text-muted fs-xs p-2 text-center">Nenhum evento registrado ainda. Role os exemplos para testar!</div>';
      return;
    }

    logContainer.innerHTML = this.eventLogs.map(item => `
      <div class="d-flex align-items-center justify-content-between p-2 border-bottom fs-xs">
        <div class="d-flex align-items-center gap-2">
          ${item.badge}
          <span>${item.message}</span>
        </div>
        <span class="text-muted font-monospace fs-xxs">${item.time}</span>
      </div>
    `).join('');
  },

  /**
   * Atualiza badge do item ativo no cabeçalho do card
   */
  updateActiveBadge(containerId, activeText) {
    let badgeId = '';
    if (containerId === 'scrollspy-container-navbar') badgeId = 'badge-active-navbar';
    if (containerId === 'scrollspy-container-nested') badgeId = 'badge-active-nested';
    if (containerId === 'scrollspy-container-listgroup') badgeId = 'badge-active-listgroup';

    const badge = document.getElementById(badgeId);
    if (badge) {
      badge.textContent = `Ativo: ${activeText}`;
      badge.className = 'badge bg-primary px-2 py-1 fs-xxs';
    }
  }
};

// Exposição global
if (typeof window !== 'undefined') {
  window.scrollSpyController = scrollSpyController;
}
