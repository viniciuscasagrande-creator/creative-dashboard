/**
 * ==========================================================================
 * FASE 28.15.2 — ROUTER CENTRAL DO PDT (src/navigation/router.js)
 * Orquestrador único de navegação, rotas e sincronização de estado
 * ==========================================================================
 */

import { ROUTES, LEGACY_ROUTE_ALIASES, resolveRoute } from './routes.js';
import { MenuStateManager } from './menu-state.js';

class AppRouter {
  constructor() {
    this.currentRoute = null;
    this.currentView = null;
    this.currentTab = null;
    this.currentMenuKey = null;
    this.isNavigating = false;
    this.viewHooks = {};
    this.initialized = false;
  }

  /**
   * Registra hook de ciclo de vida para uma view específica
   * @param {string} viewName - Nome da view sem prefixo view-
   * @param {function} hookFn - Função a ser executada ao abrir a tela
   */
  registerHook(viewName, hookFn) {
    if (typeof hookFn === 'function') {
      this.viewHooks[viewName] = hookFn;
    }
  }

  /**
   * Executa os inicializadores vinculados à tela ativa
   * @param {string} viewName
   * @param {object} routeState
   */
  triggerViewHooks(viewName, routeState) {
    try {
      if (this.viewHooks[viewName]) {
        this.viewHooks[viewName](routeState);
      }
    } catch (err) {
      console.error(`[AppRouter] Erro ao executar hook da view "${viewName}":`, err);
    }
  }

  /**
   * Navega para um caminho canônico
   * @param {string} path - Caminho de rota (ex: /financeiro/dashboard)
   * @param {object} options - Opções de navegação { replace, tab, menuKey, skipHistory }
   */
  navigate(path, options = {}) {
    if (this.isNavigating) return;
    this.isNavigating = true;

    try {
      const targetTab = options.tab || null;
      const route = resolveRoute(path, targetTab);

      if (!route) {
        console.error('[AppRouter] Rota não encontrada:', path);
        this.isNavigating = false;
        return this.navigate('/dashboard', { replace: true });
      }

      const routeState = {
        ...route,
        tab: targetTab || route.tab || null,
        menuKey: options.menuKey || route.menuKey || null
      };

      this.currentRoute = routeState.path;
      this.currentView = routeState.view;
      this.currentTab = routeState.tab;
      this.currentMenuKey = routeState.menuKey;

      // 1. Alternar visibilidade das telas
      this.render(routeState);

      // 2. Atualizar URL e histórico do navegador
      if (!options.skipHistory && typeof window !== 'undefined' && window.history) {
        const hashTarget = routeState.tab && routeState.view === 'accounting-disk'
          ? `${routeState.path}?tab=${routeState.tab}`
          : routeState.path;

        if (options.replace) {
          window.history.replaceState({ route: routeState.path, tab: routeState.tab, menuKey: routeState.menuKey }, '', '#' + hashTarget);
        } else {
          window.history.pushState({ route: routeState.path, tab: routeState.tab, menuKey: routeState.menuKey }, '', '#' + hashTarget);
        }
      }

      // 3. Sincronizar estado visual e acessibilidade da sidebar via MenuStateManager
      this.syncActiveMenu(routeState);

      // 4. Fechar gaveta mobile no smartphone após clique de navegação
      this.closeMobileDrawer();

      // 5. Executar inicializadores registrados da tela
      this.triggerViewHooks(routeState.view, routeState);

      return routeState;
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * Navega para uma view legada preservando compatibilidade
   * @param {string} view - Nome legado da tela (ex: financial-dashboard)
   * @param {string|null} subTab - Aba opcional
   * @param {object} options - Opções extras
   */
  navigateLegacy(view, subTab = null, options = {}) {
    const route = resolveRoute(view, subTab);
    const targetPath = route.path || '/dashboard';
    return this.navigate(targetPath, {
      ...options,
      tab: subTab || route.tab,
      menuKey: options.menuKey || route.menuKey
    });
  }

  /**
   * Oculta todas as views e exibe a view ativa
   * @param {object} route
   */
  render(route) {
    if (typeof document === 'undefined') return;

    this.hideAllViews();
    this.showView(route.view, route);
  }

  /**
   * Oculta todas as views com id prefixado por view-
   */
  hideAllViews() {
    const views = document.querySelectorAll('[id^="view-"]');
    views.forEach(v => {
      v.classList.remove('active');
      v.style.display = 'none';
    });
  }

  /**
   * Exibe a view de destino
   * @param {string} viewName
   * @param {object} route
   */
  showView(viewName, route) {
    const cleanId = viewName.startsWith('view-') ? viewName : `view-${viewName}`;
    const targetElement = document.getElementById(cleanId);

    if (!targetElement) {
      console.warn(`[AppRouter] Elemento #${cleanId} não encontrado no DOM. Fallback para #view-dashboard-main.`);
      const fallback = document.getElementById('view-dashboard-main');
      if (fallback) {
        fallback.style.display = 'block';
        fallback.classList.add('active');
      }
      return;
    }

    targetElement.style.display = 'block';
    targetElement.classList.add('active');

    // Atualizar título e subtítulo dinâmicos da página
    this.updatePageHeader(route);
  }

  /**
   * Atualiza os cabeçalhos de título e subtítulo se os elementos existirem
   * @param {object} route
   */
  updatePageHeader(route) {
    if (!route) return;

    const titleEl = document.getElementById('main-content-header-title');
    const subtitleEl = document.getElementById('main-content-header-subtitle');

    if (titleEl && route.title) titleEl.textContent = route.title;
    if (subtitleEl && route.sub) subtitleEl.textContent = route.sub;
  }

  /**
   * Sincroniza o estado ativo da sidebar delegando com exclusividade ao MenuStateManager
   * @param {object} routeState
   */
  syncActiveMenu(routeState) {
    if (typeof window !== 'undefined' && window.MenuStateManager) {
      window.MenuStateManager.sync(routeState);
    } else if (MenuStateManager) {
      MenuStateManager.sync(routeState);
    }
  }

  /**
   * Fecha o drawer mobile ao navegar para uma tela
   */
  closeMobileDrawer() {
    if (typeof document === 'undefined') return;

    const sidebarMain = document.querySelector('.sidebar-main');
    if (sidebarMain && sidebarMain.classList.contains('sidebar-mobile-expanded')) {
      sidebarMain.classList.remove('sidebar-mobile-expanded');
    }

    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (backdrop) {
      backdrop.classList.remove('show');
    }
  }

  /**
   * Lê a URL atual do hash e sincroniza a aplicação
   */
  syncFromLocation() {
    if (typeof window === 'undefined') return;

    let hash = window.location.hash || '';
    if (!hash || hash === '#' || hash === '#/') {
      return this.navigate('/dashboard', { replace: true });
    }

    // Normalizar hash
    hash = hash.replace(/^#\/?/, '');

    // Extrair parâmetros de query se existirem (ex: #/contabilidade/dashboard?tab=conciliacao)
    let path = hash;
    let queryTab = null;

    if (hash.includes('?')) {
      const parts = hash.split('?');
      path = parts[0];
      const params = new URLSearchParams(parts[1]);
      queryTab = params.get('tab');
    }

    const route = resolveRoute(path, queryTab);
    this.navigate(route.path, {
      replace: true,
      tab: queryTab || route.tab,
      menuKey: route.menuKey
    });
  }

  /**
   * Inicialização do router único e seus listeners globais
   */
  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // 1. Inicializar listener de cliques em cabeçalhos de accordion
    if (MenuStateManager && typeof MenuStateManager.init === 'function') {
      MenuStateManager.init();
    }

    // 2. Listener Delegado Único de Cliques na Sidebar
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route], [data-view]');
      if (!link) return;

      // Não interceptar cliques de download ou links externos
      const href = link.getAttribute('href');
      if (href && (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:'))) {
        return;
      }

      e.preventDefault();

      const route = link.getAttribute('data-route') || link.dataset.route;
      const legacyView = link.getAttribute('data-view') || link.dataset.view;
      const tab = link.getAttribute('data-tab') || link.dataset.tab || null;
      const menuKey = link.getAttribute('data-menu-key') || link.dataset.menuKey || null;

      if (route) {
        this.navigate(route, { tab, menuKey });
        return;
      }

      if (legacyView) {
        this.navigateLegacy(legacyView, tab, { menuKey });
      }
    });

    // 3. Listener Único de Navegação no Histórico (Voltar / Avançar)
    window.addEventListener('hashchange', () => {
      this.syncFromLocation();
    });
    window.addEventListener('popstate', () => {
      this.syncFromLocation();
    });

    // 4. Sincronização inicial na carga da página
    this.syncFromLocation();
  }
}

export const AppRouterInstance = new AppRouter();
export { AppRouterInstance as AppRouter };

if (typeof window !== 'undefined') {
  window.AppRouter = AppRouterInstance;
}
