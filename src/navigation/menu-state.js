/**
 * ==========================================================================
 * FASE 28.15.2 — CONTROLADOR DE ESTADO VISUAL DA SIDEBAR (src/navigation/menu-state.js)
 * Centraliza o estado visual, accordions e acessibilidade de #main-sidebar-nav
 * ==========================================================================
 */

const SIDEBAR_SELECTOR = '#main-sidebar-nav';

function sidebar() {
  if (typeof document === 'undefined') return null;
  return document.querySelector(SIDEBAR_SELECTOR);
}

function escapeCss(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (typeof window !== 'undefined' && window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(str);
  }
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(str);
  }
  return str.replace(/["\\]/g, '\\$&');
}

/**
 * Remove classes active e atributos de página atual estritamente de #main-sidebar-nav.
 * NUNCA afeta tabs, filtros, botões ou modais externos.
 */
function clearActiveItems() {
  const root = sidebar();
  if (!root) return;

  root.querySelectorAll('.nav-link.active').forEach(link => {
    link.classList.remove('active', 'text-primary', 'fw-bold');
    link.removeAttribute('aria-current');
  });
}

/**
 * Abre um grupo accordion específico, configurando classes e atributos de acessibilidade.
 * @param {HTMLElement} group - Elemento li.nav-item-submenu
 */
function openGroup(group) {
  if (!group) return;

  group.classList.add('nav-item-open');
  const trigger = group.querySelector(':scope > .nav-link');
  const submenu = group.querySelector(':scope > .nav-group-sub');

  if (trigger) {
    trigger.setAttribute('aria-expanded', 'true');
  }

  if (submenu) {
    submenu.classList.add('show');
    if (typeof window !== 'undefined' && window.bootstrap && window.bootstrap.Collapse) {
      try {
        const inst = window.bootstrap.Collapse.getOrCreateInstance(submenu, { toggle: false });
        inst.show();
      } catch (e) {
        // Fallback garantido por classList.add('show')
      }
    }
  }
}

/**
 * Fecha um grupo accordion específico.
 * @param {HTMLElement} group - Elemento li.nav-item-submenu
 */
function closeGroup(group) {
  if (!group) return;

  group.classList.remove('nav-item-open');
  const trigger = group.querySelector(':scope > .nav-link');
  const submenu = group.querySelector(':scope > .nav-group-sub');

  if (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
  }

  if (submenu) {
    submenu.classList.remove('show');
    if (typeof window !== 'undefined' && window.bootstrap && window.bootstrap.Collapse) {
      try {
        const inst = window.bootstrap.Collapse.getOrCreateInstance(submenu, { toggle: false });
        inst.hide();
      } catch (e) {
        // Fallback garantido por classList.remove('show')
      }
    }
  }
}

/**
 * Fecha todos os grupos irmãos que não sejam o grupo ativo.
 * @param {HTMLElement|null} activeParent - Grupo pai que deve permanecer aberto (ou null para fechar todos)
 */
function closeInactiveParents(activeParent) {
  const root = sidebar();
  if (!root) return;

  root.querySelectorAll(':scope > .nav-item-submenu').forEach(group => {
    if (group !== activeParent) {
      closeGroup(group);
    }
  });
}

/**
 * Localiza o elemento de link correspondente à rota atual.
 * Prioridade:
 * 1. data-menu-key exato
 * 2. data-route exato
 * 3. data-view + data-tab (fundamental para Contabilidade)
 * 4. data-view compatível com o módulo/grupo
 * @param {object} routeState
 * @returns {HTMLElement|null}
 */
function findActiveLink(routeState) {
  const root = sidebar();
  if (!root || !routeState) return null;

  // 1. data-menu-key direto
  if (routeState.menuKey) {
    const byKey = root.querySelector(`[data-menu-key="${escapeCss(routeState.menuKey)}"]`);
    if (byKey) return byKey;
  }

  // 2. data-route exato
  if (routeState.path) {
    const byRoute = root.querySelector(`[data-route="${escapeCss(routeState.path)}"]`);
    if (byRoute) return byRoute;
  }

  // 3. data-view + data-tab
  if (routeState.view && routeState.tab) {
    const candidates = Array.from(root.querySelectorAll(
      `[data-view="${escapeCss(routeState.view)}"][data-tab="${escapeCss(routeState.tab)}"]`
    ));
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
      if (routeState.path && routeState.path.includes('rastreabilidade')) {
        const trLink = candidates.find(c => c.dataset.menuKey === 'accounting-traceability');
        if (trLink) return trLink;
      }
      return candidates[0];
    }
  }

  // 4. data-view isolado
  if (routeState.view) {
    const candidates = Array.from(root.querySelectorAll(`[data-view="${escapeCss(routeState.view)}"]`));
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
      // Priorizar item cujo grupo pai coincide com o módulo da rota
      const targetGroup = routeState.module || routeState.group;
      if (targetGroup) {
        const match = candidates.find(c => {
          const parentGroup = c.closest('.nav-item-submenu');
          return parentGroup && parentGroup.dataset.menuGroup === targetGroup;
        });
        if (match) return match;
      }
      return candidates[0];
    }
  }

  return null;
}

/**
 * Sincroniza atributos ARIA de todos os grupos e itens na sidebar
 * @param {object} [routeState]
 */
function syncAccessibility(routeState) {
  const root = sidebar();
  if (!root) return;

  root.querySelectorAll(':scope > .nav-item-submenu').forEach(group => {
    const trigger = group.querySelector(':scope > .nav-link');
    const isOpen = group.classList.contains('nav-item-open');
    if (trigger) {
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  });
}

/**
 * Ativa o link correspondente à rota e retorna o elemento ativado
 * @param {object} routeState
 * @returns {HTMLElement|null}
 */
function setActiveItem(routeState) {
  const activeLink = findActiveLink(routeState);
  if (!activeLink) return null;

  activeLink.classList.add('active');
  activeLink.setAttribute('aria-current', 'page');
  return activeLink;
}

/**
 * Abre o grupo pai do link ativo e fecha os demais grupos irmãos
 * @param {HTMLElement|null} activeLink
 * @returns {HTMLElement|null} Grupo pai aberto
 */
function openActiveParent(activeLink) {
  if (!activeLink) {
    closeInactiveParents(null);
    return null;
  }

  const parent = activeLink.closest('.nav-item-submenu');
  closeInactiveParents(parent);
  if (parent) {
    openGroup(parent);
  }
  return parent;
}

/**
 * Localiza o container navegável que sofre scroll na sidebar.
 * Nunca retorna o documento inteiro ou window.
 */
function getScrollContainer() {
  if (typeof document === 'undefined') return null;
  const scrollArea = document.getElementById('sidebar-nav-scroll-area') || 
                     document.querySelector('.sidebar-navigation-scroll-area');
  if (scrollArea) return scrollArea;
  const content = document.querySelector('.sidebar.sidebar-main .sidebar-content');
  if (content) return content;
  return document.querySelector('.sidebar.sidebar-main');
}

/**
 * Rola a sidebar AUTOMATICAMENTE para que o cabeçalho do módulo selecionado
 * fique posicionado no TOPO da área navegável da sidebar.
 * NÃO rola a página central nem a janela (nunca window.scrollTo).
 * @param {HTMLElement} moduleGroup - Elemento do grupo (li.nav-item-submenu)
 * @param {boolean} [smooth=true] - Transição suave
 */
function scrollModuleToTop(moduleGroup, smooth = true) {
  if (!moduleGroup) return;
  const container = getScrollContainer();
  if (!container) return;

  const containerRect = container.getBoundingClientRect ? container.getBoundingClientRect() : { top: 0 };
  const moduleRect = moduleGroup.getBoundingClientRect ? moduleGroup.getBoundingClientRect() : { top: 0 };

  const currentScroll = container.scrollTop || 0;
  const target = currentScroll + (moduleRect.top - containerRect.top);

  if (typeof container.scrollTo === 'function') {
    container.scrollTo({
      top: Math.max(0, Math.round(target)),
      behavior: smooth ? 'smooth' : 'auto'
    });
  } else {
    container.scrollTop = Math.max(0, Math.round(target));
  }
}

/**
 * Garante que o item de subrota ativo fique visível dentro da área navegável,
 * sem movimentar a página inteira.
 * @param {HTMLElement} item
 */
function ensureActiveItemVisible(item) {
  if (!item) return;
  const container = getScrollContainer();
  if (!container) return;

  const cRect = container.getBoundingClientRect ? container.getBoundingClientRect() : { top: 0, bottom: 1000 };
  const iRect = item.getBoundingClientRect ? item.getBoundingClientRect() : { top: 0, bottom: 0 };

  if (iRect.top < cRect.top) {
    const diff = iRect.top - cRect.top - 12;
    const target = (container.scrollTop || 0) + diff;
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top: Math.max(0, Math.round(target)), behavior: 'smooth' });
    } else {
      container.scrollTop = Math.max(0, Math.round(target));
    }
  } else if (iRect.bottom > cRect.bottom) {
    const diff = iRect.bottom - cRect.bottom + 12;
    const target = (container.scrollTop || 0) + diff;
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top: Math.max(0, Math.round(target)), behavior: 'smooth' });
    } else {
      container.scrollTop = Math.max(0, Math.round(target));
    }
  }
}

/**
 * Sincronização centralizada do estado visual da sidebar.
 * Deve ser invocada pelo AppRouter em todas as transições (navegação, popstate, F5, deep-link).
 * @param {object} routeState - Estado da rota { path, view, module, tab, menuKey }
 */
function sync(routeState) {
  const root = sidebar();
  if (!root || !routeState) return;

  // 1. Limpar todos os itens ativos de #main-sidebar-nav
  clearActiveItems();

  // 2. Ativar somente o link final da rota
  const activeLink = setActiveItem(routeState);

  // 3. Abrir o grupo pai e fechar irmãos
  const parent = openActiveParent(activeLink);

  // 4. Sincronizar acessibilidade (aria-expanded e aria-current)
  syncAccessibility(routeState);

  // 5. Garantir visibilidade do item ativo na área navegável (Comportamento B e C)
  if (activeLink) {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        ensureActiveItemVisible(activeLink);
        setTimeout(() => {
          ensureActiveItemVisible(activeLink);
        }, 60);
      });
    } else {
      ensureActiveItemVisible(activeLink);
    }
  }

  if (typeof window !== 'undefined' && window.NAV_DEBUG) {
    console.debug('[MENU_STATE]', {
      route: routeState.path,
      view: routeState.view,
      tab: routeState.tab,
      menuKey: routeState.menuKey || activeLink?.dataset.menuKey,
      openGroup: parent?.dataset.menuGroup || null
    });
  }
}

/**
 * Inicializa a escuta para cliques manuais em cabeçalhos de grupos accordion
 */
function init() {
  const root = sidebar();
  if (!root || root.__menuStateInitialized) return;
  root.__menuStateInitialized = true;

  root.addEventListener('click', (e) => {
    const trigger = e.target.closest('.nav-item-submenu > .nav-link');
    if (!trigger) return;

    // Cabeçalho de submenu clicado
    const group = trigger.closest('.nav-item-submenu');
    if (!group) return;

    e.preventDefault();

    // 1. Fechar outros grupos irmãos (comportamento accordion exclusivo)
    closeInactiveParents(group);

    // 2. Abrir grupo e resetar posição anterior garantindo que fique no topo
    openGroup(group);

    // 3. Posicionar o cabeçalho no TOPO da área navegável da sidebar (Comportamento A)
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        scrollModuleToTop(group, true);
        setTimeout(() => {
          scrollModuleToTop(group, true);
          syncAccessibility();
        }, 60);
      });
    } else {
      scrollModuleToTop(group, false);
      syncAccessibility();
    }
  });
}

export const MenuStateManager = {
  sync,
  clearActiveItems,
  setActiveItem,
  openActiveParent,
  closeInactiveParents,
  openGroup,
  closeGroup,
  syncAccessibility,
  findActiveLink,
  getScrollContainer,
  scrollModuleToTop,
  ensureActiveItemVisible,
  init
};

if (typeof window !== 'undefined') {
  window.MenuStateManager = MenuStateManager;
}
