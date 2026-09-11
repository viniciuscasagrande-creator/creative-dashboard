/**
 * ==========================================================================
 * FASE 28.15.1 — ROUTER ÚNICO E NAVEGAÇÃO CENTRAL (src/navigation/router.js)
 * ==========================================================================
 */

import { ROUTES, LEGACY_ROUTE_ALIASES, resolveRoute } from './routes.js';

export const AppRouter = {
  currentRoute: null,
  isNavigating: false,
  viewHooks: {},

  /**
   * Registra hook customizado de inicialização para uma view específica
   * @param {string} view - Nome da view sem prefixo view-
   * @param {Function} callback - Função a ser executada ao ativar a view
   */
  registerHook(view, callback) {
    if (!this.viewHooks[view]) this.viewHooks[view] = [];
    this.viewHooks[view].push(callback);
  },

  /**
   * Navega para uma rota ou caminho canônico
   * @param {string} target - Caminho, hash ou alias de rota
   * @param {object} options - Opções de navegação { push: boolean, triggerHooks: boolean }
   * @returns {boolean} Sucesso da transição
   */
  navigate(target, options = { push: true, triggerHooks: true }) {
    if (this.isNavigating) return false;
    this.isNavigating = true;

    try {
      const resolved = resolveRoute(target);
      const targetId = 'view-' + resolved.view;
      let targetEl = document.getElementById(targetId) || document.getElementById(resolved.view);

      console.log('[AppRouter]', {
        target,
        resolvedPath: resolved.path,
        resolvedView: resolved.view,
        targetId,
        found: !!targetEl
      });

      if (!targetEl) {
        console.warn(`[AppRouter] Tela #${targetId} não encontrada. Redirecionando para #view-dashboard-main.`);
        targetEl = document.getElementById('view-dashboard-main');
        if (!targetEl) return false;
      }

      // 1. Esconder todas as seções de página
      document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
      });

      // 2. Exibir exclusivamente a view selecionada
      targetEl.style.display = 'block';
      this.currentRoute = resolved;

      // 3. Atualizar Título e Subtítulo da Página
      const titleEl = document.getElementById('active-view-title');
      const subEl = document.getElementById('active-view-subtitle');
      if (titleEl && resolved.title) titleEl.textContent = resolved.title;
      if (subEl && resolved.sub) subEl.textContent = resolved.sub;

      // 4. Sincronizar classes active na Sidebar
      this.syncActiveMenu(resolved);

      // 5. Fechar drawer mobile se aberto
      this.closeMobileDrawer();

      // 6. Atualizar histórico e URL
      const canonicalHash = '#' + resolved.path;
      try {
        if (options.push && window.location.hash !== canonicalHash) {
          history.pushState({ path: resolved.path, tab: resolved.tab }, '', canonicalHash);
        } else if (!options.push) {
          history.replaceState({ path: resolved.path, tab: resolved.tab }, '', canonicalHash);
        }
        sessionStorage.setItem('currentRoute', resolved.path);
      } catch (e) {}

      // 7. Executar hooks específicos da view
      if (options.triggerHooks !== false) {
        this.triggerViewHooks(resolved);
      }

      // 8. Trilha e Redimensionamento de Gráficos
      if (typeof window.triggerGlobalChartResize === 'function') {
        setTimeout(window.triggerGlobalChartResize, 60);
        setTimeout(window.triggerGlobalChartResize, 250);
      }

      window.scrollTo(0, 0);
      return true;
    } finally {
      this.isNavigating = false;
    }
  },

  /**
   * Adaptador temporário para chamadas legadas com openView/switchActiveView
   * @param {string} legacyView - Nome da view sem view-
   * @param {string|null} subTab - Sub-aba opcional (ex: conciliacao, schedule)
   * @param {boolean} push - Se deve criar entrada no histórico
   * @returns {boolean}
   */
  navigateLegacy(legacyView, subTab = null, push = true) {
    if (!legacyView) legacyView = 'dashboard-main';
    let pathOrView = String(legacyView);
    if (subTab) {
      pathOrView = `${pathOrView}/${subTab}`;
    }
    return this.navigate(pathOrView, { push, triggerHooks: true });
  },

  /**
   * Sincroniza classes active nos links da sidebar
   * @param {object} resolved - Objeto da rota resolvida
   */
  syncActiveMenu(resolved) {
    document.querySelectorAll('[data-route], [data-view]').forEach(item => {
      const itemRoute = item.getAttribute('data-route');
      const itemView = (item.getAttribute('data-view') || '').replace(/^view-/, '');
      const itemTab = item.getAttribute('data-tab');

      let isActive = false;
      if (itemRoute) {
        isActive = (itemRoute === resolved.path);
      } else if (itemView) {
        isActive = (itemView === resolved.view || itemView === resolved.path.replace(/^\//, ''));
        if (itemTab && resolved.tab) {
          isActive = isActive && (itemTab === resolved.tab);
        } else if (itemTab && resolved.view === 'accounting-disk') {
          const accTab = (typeof window.currentAccountingTab !== 'undefined' && window.currentAccountingTab) ? window.currentAccountingTab : 'dashboard';
          isActive = isActive && (itemTab === accTab);
        } else if (!itemTab && (resolved.view === 'accounting-disk' || resolved.view === 'procure-to-pay')) {
          if (resolved.tab) isActive = false;
        }
      }

      item.classList.toggle('active', isActive);

      // Expandir accordion pai se estiver ativo
      if (isActive) {
        const parentLi = item.closest('.nav-item-submenu');
        if (parentLi) {
          parentLi.classList.add('nav-item-open');
          const sub = parentLi.querySelector('.nav-group-sub');
          if (sub && typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
            bootstrap.Collapse.getOrCreateInstance(sub, { toggle: false }).show();
          }
        }
      }
    });
  },

  /**
   * Fecha o menu lateral mobile após navegação
   */
  closeMobileDrawer() {
    if (window.innerWidth < 992) {
      const mobileSidebar = document.querySelector('.sidebar.sidebar-main');
      const mobileBackdrop = document.querySelector('.sidebar-mobile-backdrop');
      if (mobileSidebar && mobileSidebar.classList.contains('sidebar-mobile-expanded')) {
        mobileSidebar.classList.remove('sidebar-mobile-expanded');
      }
      if (mobileBackdrop) {
        mobileBackdrop.classList.remove('show');
      }
    }
  },

  /**
   * Dispara hooks e inicializadores funcionais homologados de cada view
   * @param {object} resolved - Objeto da rota resolvida
   */
  triggerViewHooks(resolved) {
    if (this.viewHooks[resolved.view]) {
      this.viewHooks[resolved.view].forEach(fn => {
        try { fn(resolved); } catch (err) { console.error('[AppRouter Hook Error]', err); }
      });
    }

    const v = resolved.view;
    if (v === 'marketing-overview') {
      if (typeof window.renderMarketingOverviewCharts === 'function') setTimeout(window.renderMarketingOverviewCharts, 50);
    } else if (v === 'marketing-campaigns') {
      if (typeof window.initMultichannelCampaignsModule === 'function') window.initMultichannelCampaignsModule();
    } else if (v === 'marketing-whatsapp') {
      if (typeof window.initWhatsAppMarketingModule === 'function') window.initWhatsAppMarketingModule();
    } else if (v === 'marketing-email') {
      if (typeof window.initEmailMarketingModule === 'function') window.initEmailMarketingModule();
    } else if (v === 'marketing-automation') {
      if (typeof window.initMarketingAutomationModule === 'function') window.initMarketingAutomationModule();
    } else if (v === 'marketing-pixel' || v === 'marketing-config') {
      if (typeof window.initMarketingPixelModule === 'function') window.initMarketingPixelModule();
    } else if (v === 'accounting-disk') {
      const accTab = resolved.tab || (typeof window.currentAccountingTab !== 'undefined' && window.currentAccountingTab ? window.currentAccountingTab : 'dashboard');
      if (typeof window.switchAccountingTab === 'function') window.switchAccountingTab(accTab);
    } else if (v === 'financial-event-transfers') {
      if (typeof window.initFinancialEventTransfersView === 'function') window.initFinancialEventTransfersView();
      if (resolved.tab === 'schedule' || resolved.path.includes('agenda')) {
        if (typeof window.switchTransferTab === 'function') window.switchTransferTab('schedule');
      }
    } else if (v === 'procure-to-pay') {
      let p2pTab = resolved.tab || 'approvals';
      if (typeof window.initProcureToPayView === 'function') window.initProcureToPayView(p2pTab);
    }
  },

  /**
   * Inicialização única e vinculação de eventos do Router
   */
  init() {
    if (this.__initialized) return;
    this.__initialized = true;

    // 1. Delegated click listener central
    document.addEventListener('click', (event) => {
      const link = event.target.closest('[data-route], [data-view]');
      if (!link) return;

      event.preventDefault();
      event.stopPropagation();

      const route = link.getAttribute('data-route');
      const view = link.getAttribute('data-view');
      const tab = link.getAttribute('data-tab');

      if (route) {
        this.navigate(route);
      } else if (view) {
        this.navigateLegacy(view, tab);
      }
    });

    // 2. Listener ÚNICO para navegação por hash e popstate
    window.addEventListener('hashchange', () => {
      const rawHash = window.location.hash;
      if (rawHash) {
        this.navigate(rawHash, { push: false, triggerHooks: true });
      }
    });

    window.addEventListener('popstate', (e) => {
      const statePath = e.state?.path || window.location.hash || '/dashboard';
      this.navigate(statePath, { push: false, triggerHooks: true });
    });

    // 3. Resolver e navegar para a rota inicial
    const initialHash = window.location.hash || '/dashboard';
    this.navigate(initialHash, { push: false, triggerHooks: true });
  }
};

// Vinculação Global e Wrappers de Compatibilidade
if (typeof window !== 'undefined') {
  window.AppRouter = AppRouter;

  // Wrappers estritamente delegados sem lógica independente
  window.openView = function(view, subTab = null) {
    return window.AppRouter.navigateLegacy(view, subTab);
  };
  window.navigateTo = window.openView;
  window.switchActiveView = window.openView;
}
