/**
 * ============================================================================
 * DISK / LIMITLESS — HELPER & GERENCIADOR DO COMPONENTE SCROLLSPY (BOOTSTRAP 5)
 * Sincronização automática de menus e listas com a posição de rolagem
 * ============================================================================
 */

export const scrollSpyHelper = {
  /**
   * Inicializa o ScrollSpy em um elemento ou seletor
   * @param {string|HTMLElement} elementOrSelector
   * @param {object} options { target, offset, method }
   * @returns {object|null} Instância do ScrollSpy
   */
  init(elementOrSelector, options = {}) {
    const el = this._resolveElement(elementOrSelector);
    if (!el) {
      console.warn('[ScrollSpyHelper] Elemento não encontrado:', elementOrSelector);
      return null;
    }

    // Validação e garantia de requisitos CSS
    this._ensureCssRequirements(el);

    if (typeof bootstrap !== 'undefined' && bootstrap.ScrollSpy) {
      try {
        // Se já existe, destrói antes para reinicializar com novas opções
        const existing = bootstrap.ScrollSpy.getInstance(el);
        if (existing) {
          existing.dispose();
        }

        const defaults = {
          offset: 10,
          method: 'auto'
        };
        const config = { ...defaults, ...options };
        const instance = new bootstrap.ScrollSpy(el, config);
        return instance;
      } catch (err) {
        console.error('[ScrollSpyHelper] Erro ao instanciar ScrollSpy:', err);
        return null;
      }
    } else {
      console.warn('[ScrollSpyHelper] bootstrap.ScrollSpy não disponível no escopo global.');
      return null;
    }
  },

  /**
   * Atualiza a instância do ScrollSpy após adição ou alteração no DOM
   * @param {string|HTMLElement} elementOrSelector
   * @returns {boolean}
   */
  refresh(elementOrSelector) {
    const el = this._resolveElement(elementOrSelector);
    if (!el) return false;

    if (typeof bootstrap !== 'undefined' && bootstrap.ScrollSpy) {
      const instance = bootstrap.ScrollSpy.getInstance(el);
      if (instance && typeof instance.refresh === 'function') {
        instance.refresh();
        return true;
      }
    }
    return false;
  },

  /**
   * Destrói a instância do ScrollSpy associada ao elemento
   * @param {string|HTMLElement} elementOrSelector
   * @returns {boolean}
   */
  dispose(elementOrSelector) {
    const el = this._resolveElement(elementOrSelector);
    if (!el) return false;

    if (typeof bootstrap !== 'undefined' && bootstrap.ScrollSpy) {
      const instance = bootstrap.ScrollSpy.getInstance(el);
      if (instance && typeof instance.dispose === 'function') {
        instance.dispose();
        return true;
      }
    }
    return false;
  },

  /**
   * Retorna a instância ativa do ScrollSpy no elemento
   * @param {string|HTMLElement} elementOrSelector
   * @returns {object|null}
   */
  getInstance(elementOrSelector) {
    const el = this._resolveElement(elementOrSelector);
    if (!el) return null;

    if (typeof bootstrap !== 'undefined' && bootstrap.ScrollSpy) {
      return bootstrap.ScrollSpy.getInstance(el);
    }
    return null;
  },

  /**
   * Obtém a instância existente ou cria uma nova se não existir
   * @param {string|HTMLElement} elementOrSelector
   * @param {object} options
   * @returns {object|null}
   */
  getOrCreateInstance(elementOrSelector, options = {}) {
    const el = this._resolveElement(elementOrSelector);
    if (!el) return null;

    this._ensureCssRequirements(el);

    if (typeof bootstrap !== 'undefined' && bootstrap.ScrollSpy) {
      return bootstrap.ScrollSpy.getOrCreateInstance(el, options);
    }
    return null;
  },

  /**
   * Atualiza todos os elementos marcados com [data-bs-spy="scroll"] no DOM
   * @param {HTMLElement|Document} root
   */
  refreshAll(root = (typeof document !== 'undefined' ? document : null)) {
    if (!root) return;
    const spies = Array.from(root.querySelectorAll('[data-bs-spy="scroll"]'));
    spies.forEach(spyEl => {
      this._ensureCssRequirements(spyEl);
      if (typeof bootstrap !== 'undefined' && bootstrap.ScrollSpy) {
        const instance = bootstrap.ScrollSpy.getInstance(spyEl);
        if (instance) {
          instance.refresh();
        } else {
          bootstrap.ScrollSpy.getOrCreateInstance(spyEl);
        }
      }
    });
  },

  /**
   * Destrói todos os ScrollSpies no DOM
   * @param {HTMLElement|Document} root
   */
  disposeAll(root = (typeof document !== 'undefined' ? document : null)) {
    if (!root) return;
    const spies = Array.from(root.querySelectorAll('[data-bs-spy="scroll"]'));
    spies.forEach(spyEl => {
      this.dispose(spyEl);
    });
  },

  /**
   * Registra listener para o evento oficial 'activate.bs.scrollspy'
   * @param {string|HTMLElement} elementOrSelector
   * @param {function} callback - Recebe (event, relatedTarget)
   * @returns {function} Função de desinscrição
   */
  onActivate(elementOrSelector, callback) {
    const el = this._resolveElement(elementOrSelector);
    if (!el || typeof callback !== 'function') return () => {};

    const handler = (e) => {
      callback(e, e.relatedTarget);
    };

    el.addEventListener('activate.bs.scrollspy', handler);
    return () => el.removeEventListener('activate.bs.scrollspy', handler);
  },

  /**
   * Configura rolagem suave para cliques em âncoras dentro de um nav/menu alvo
   * Evita desvios no roteador SPA e garante navegação fluida dentro da área espionada
   * @param {string|HTMLElement} navSelector
   * @param {string|HTMLElement} scrollContainerSelector
   */
  setupSmoothScrolling(navSelector, scrollContainerSelector) {
    const nav = this._resolveElement(navSelector);
    const scrollContainer = this._resolveElement(scrollContainerSelector);
    if (!nav) return;

    const links = nav.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;

        let targetEl = null;
        if (scrollContainer) {
          targetEl = scrollContainer.querySelector(targetId);
        }
        if (!targetEl && typeof document !== 'undefined') {
          targetEl = document.querySelector(targetId);
        }

        if (targetEl) {
          e.preventDefault();
          if (scrollContainer && scrollContainer !== document.body) {
            const containerTop = scrollContainer.getBoundingClientRect().top;
            const targetTop = targetEl.getBoundingClientRect().top;
            const currentScroll = scrollContainer.scrollTop;
            const scrollOffset = targetTop - containerTop + currentScroll - 10;
            scrollContainer.scrollTo({
              top: scrollOffset,
              behavior: 'smooth'
            });
          } else {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
  },

  /**
   * Auto-inicializa todos os elementos marcados no documento
   */
  autoInit() {
    if (typeof document === 'undefined') return;
    this.refreshAll(document);
  },

  /**
   * Garante position: relative e overflow-y nos contêineres espionados
   * @private
   */
  _ensureCssRequirements(el) {
    if (!el || el === document.body) return;
    const computed = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (computed) {
      if (computed.position === 'static') {
        el.style.position = 'relative';
      }
      if (computed.overflowY === 'visible' && !el.classList.contains('scrollspy-example')) {
        el.style.overflowY = 'auto';
      }
    }
  },

  /**
   * Resolve string ou elemento DOM
   * @private
   */
  _resolveElement(elementOrSelector) {
    if (!elementOrSelector) return null;
    if (typeof elementOrSelector === 'string') {
      return typeof document !== 'undefined' ? document.querySelector(elementOrSelector) : null;
    }
    return elementOrSelector;
  }
};

// Exposição global para consumo via window ou módulos
if (typeof window !== 'undefined') {
  window.ScrollSpyHelper = scrollSpyHelper;
  if (window.App) {
    window.App.initScrollSpy = () => scrollSpyHelper.autoInit();
  }
}
