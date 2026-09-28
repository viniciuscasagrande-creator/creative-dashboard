/**
 * ============================================================================
 * TESTE E2E — COMPONENTE SCROLLSPY (BOOTSTRAP 5 / LIMITLESS)
 * Validação de requisitos, métodos, eventos, navegações e rotas
 * ============================================================================
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

import { scrollSpyHelper } from '../../src/components/scrollSpyHelper.js';
import { scrollSpyController } from '../../src/controllers/scrollSpyController.js';
import { ROUTES, LEGACY_ROUTE_ALIASES, resolveRoute } from '../../src/navigation/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

let totalTests = 0;
let passedTests = 0;

async function test(desc, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${desc}`);
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    Erro: ${err.message}`);
    throw err;
  }
}

async function run() {
  console.log('\n--- Bateria de Testes: Componente ScrollSpy E2E ---');

  // Carregar index.html real para testar integridade do DOM
  const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const dom = new JSDOM(htmlContent, {
    url: 'http://localhost:3000/#/componentes/scrollspy',
    runScripts: 'dangerously'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;

  // Mock robusto de bootstrap.ScrollSpy em ambiente JSDOM
  const mockInstances = new Map();
  class MockScrollSpy {
    constructor(element, config = {}) {
      this._element = element;
      this._config = config;
      this._disposed = false;
      this._refreshed = false;
      mockInstances.set(element, this);
    }
    refresh() {
      this._refreshed = true;
    }
    dispose() {
      this._disposed = true;
      mockInstances.delete(this._element);
    }
    static getInstance(element) {
      return mockInstances.get(element) || null;
    }
    static getOrCreateInstance(element, config = {}) {
      const existing = mockInstances.get(element);
      if (existing && !existing._disposed) return existing;
      return new MockScrollSpy(element, config);
    }
  }

  global.bootstrap = {
    ScrollSpy: MockScrollSpy
  };
  global.window.bootstrap = global.bootstrap;

  await test('1. Rota canônica /componentes/scrollspy registrada no ROUTES com metadados corretos', () => {
    assert(ROUTES['/componentes/scrollspy'], 'Rota /componentes/scrollspy deve existir');
    const route = ROUTES['/componentes/scrollspy'];
    assert.strictEqual(route.view, 'components-scrollspy');
    assert.strictEqual(route.module, 'componentes');
    assert.strictEqual(route.menuKey, 'comp-scrollspy');
    assert.strictEqual(route.title, 'Componente ScrollSpy');
  });

  await test('2. Aliases legados (scrollspy e components-scrollspy) mapeados para /componentes/scrollspy', () => {
    assert.strictEqual(LEGACY_ROUTE_ALIASES['scrollspy'], '/componentes/scrollspy');
    assert.strictEqual(LEGACY_ROUTE_ALIASES['components-scrollspy'], '/componentes/scrollspy');

    const res1 = resolveRoute('/componentes/scrollspy');
    assert.strictEqual(res1.view, 'components-scrollspy');

    const res2 = resolveRoute('scrollspy');
    assert.strictEqual(res2.view, 'components-scrollspy');
  });

  await test('3. DOM possui a seção #view-components-scrollspy e os 3 contêineres espionados', () => {
    const viewSection = document.getElementById('view-components-scrollspy');
    assert(viewSection, 'Seção #view-components-scrollspy deve existir no DOM');

    const navbarContainer = document.getElementById('scrollspy-container-navbar');
    assert(navbarContainer, 'Contêiner da Navbar deve existir');
    assert.strictEqual(navbarContainer.getAttribute('data-bs-spy'), 'scroll');
    assert.strictEqual(navbarContainer.getAttribute('data-bs-target'), '#navbar-scrollspy-demo');

    const nestedContainer = document.getElementById('scrollspy-container-nested');
    assert(nestedContainer, 'Contêiner da navegação aninhada deve existir');
    assert.strictEqual(nestedContainer.getAttribute('data-bs-spy'), 'scroll');
    assert.strictEqual(nestedContainer.getAttribute('data-bs-target'), '#scrollspy_nest');

    const listGroupContainer = document.getElementById('scrollspy-container-listgroup');
    assert(listGroupContainer, 'Contêiner do list group deve existir');
    assert.strictEqual(listGroupContainer.getAttribute('data-bs-spy'), 'scroll');
    assert.strictEqual(listGroupContainer.getAttribute('data-bs-target'), '#scrollspy_list_group');
  });

  await test('4. Validação de IDs e Âncoras do Exemplo 1 (Navbar)', () => {
    const nav = document.getElementById('navbar-scrollspy-demo');
    assert(nav, 'Navbar #navbar-scrollspy-demo deve existir');

    const links = Array.from(nav.querySelectorAll('a[href^="#"]')).map(a => a.getAttribute('href'));
    assert(links.includes('#scrollspyHeading1'), 'Deve conter link para #scrollspyHeading1');
    assert(links.includes('#scrollspyHeading2'), 'Deve conter link para #scrollspyHeading2');
    assert(links.includes('#scrollspyHeading3'), 'Deve conter link para #scrollspyHeading3 (dropdown)');
    assert(links.includes('#scrollspyHeading4'), 'Deve conter link para #scrollspyHeading4 (dropdown)');
    assert(links.includes('#scrollspyHeading5'), 'Deve conter link para #scrollspyHeading5 (dropdown)');

    // Verificar correspondência exata dos IDs no contêiner
    const container = document.getElementById('scrollspy-container-navbar');
    for (let i = 1; i <= 5; i++) {
      assert(container.querySelector(`#scrollspyHeading${i}`), `Elemento #scrollspyHeading${i} deve existir`);
    }
  });

  await test('5. Validação de IDs e Âncoras do Exemplo 2 (Navegação Aninhada)', () => {
    const nav = document.getElementById('scrollspy_nest');
    assert(nav, 'Nav aninhado #scrollspy_nest deve existir');

    const expectedIds = ['item-1', 'item-1-1', 'item-1-2', 'item-2', 'item-3', 'item-3-1', 'item-3-2'];
    const container = document.getElementById('scrollspy-container-nested');

    expectedIds.forEach(id => {
      assert(nav.querySelector(`a[href="#${id}"]`), `Link a[href="#${id}"] deve existir no menu aninhado`);
      assert(container.querySelector(`#${id}`), `Cabeçalho #${id} deve existir no contêiner`);
    });
  });

  await test('6. Validação de IDs e Âncoras do Exemplo 3 (Grupo de Lista)', () => {
    const listGroup = document.getElementById('scrollspy_list_group');
    assert(listGroup, 'List group #scrollspy_list_group deve existir');

    const expectedListIds = ['list-item-1', 'list-item-2', 'list-item-3', 'list-item-4'];
    const container = document.getElementById('scrollspy-container-listgroup');

    expectedListIds.forEach(id => {
      assert(listGroup.querySelector(`a[href="#${id}"]`), `Link a[href="#${id}"] deve existir`);
      assert(container.querySelector(`#${id}`), `Elemento #${id} deve existir no contêiner`);
    });
  });

  await test('7. scrollSpyHelper.init inicializa e garante position relative no contêiner', () => {
    const container = document.getElementById('scrollspy-container-navbar');
    container.style.position = 'static';

    const instance = scrollSpyHelper.init(container, {
      target: '#navbar-scrollspy-demo',
      offset: 10
    });

    assert(instance, 'Instância deve ser criada com sucesso');
    assert.strictEqual(container.style.position, 'relative', 'Requisito position: relative deve ser assegurado');
  });

  await test('8. scrollSpyHelper.getInstance e getOrCreateInstance retornam a instância ativa', () => {
    const container = document.getElementById('scrollspy-container-navbar');
    const instance = scrollSpyHelper.getInstance(container);
    assert(instance, 'getInstance deve retornar a instância criada');

    const sameInstance = scrollSpyHelper.getOrCreateInstance(container);
    assert.strictEqual(sameInstance, instance, 'getOrCreateInstance deve retornar a mesma instância ativa');
  });

  await test('9. scrollSpyHelper.refresh executa o método refresh na instância', () => {
    const container = document.getElementById('scrollspy-container-navbar');
    const instance = scrollSpyHelper.getInstance(container);
    instance._refreshed = false;

    const success = scrollSpyHelper.refresh(container);
    assert.strictEqual(success, true);
    assert.strictEqual(instance._refreshed, true);
  });

  await test('10. scrollSpyHelper.dispose destrói a instância e remove do registro', () => {
    const container = document.getElementById('scrollspy-container-navbar');
    const instance = scrollSpyHelper.getInstance(container);

    const success = scrollSpyHelper.dispose(container);
    assert.strictEqual(success, true);
    assert.strictEqual(instance._disposed, true);
    assert.strictEqual(scrollSpyHelper.getInstance(container), null);
  });

  await test('11. scrollSpyHelper.refreshAll varre [data-bs-spy="scroll"] e sincroniza instâncias', () => {
    mockInstances.clear();
    scrollSpyHelper.refreshAll(document);

    const navInst = scrollSpyHelper.getInstance('#scrollspy-container-navbar');
    const nestInst = scrollSpyHelper.getInstance('#scrollspy-container-nested');
    const listInst = scrollSpyHelper.getInstance('#scrollspy-container-listgroup');

    assert(navInst, 'Navbar scrollspy deve ter sido inicializado por refreshAll');
    assert(nestInst, 'Nested nav scrollspy deve ter sido inicializado por refreshAll');
    assert(listInst, 'List group scrollspy deve ter sido inicializado por refreshAll');
  });

  await test('12. scrollSpyHelper.onActivate escuta o evento activate.bs.scrollspy', () => {
    const container = document.getElementById('scrollspy-container-navbar');
    let capturedTarget = null;

    const unsubscribe = scrollSpyHelper.onActivate(container, (e, related) => {
      capturedTarget = related;
    });

    const mockLink = document.createElement('a');
    mockLink.textContent = 'Terceiro título';
    mockLink.setAttribute('href', '#scrollspyHeading3');

    const event = new dom.window.CustomEvent('activate.bs.scrollspy', {
      detail: {},
      bubbles: true
    });
    event.relatedTarget = mockLink;

    container.dispatchEvent(event);

    assert(capturedTarget, 'Callback de ativação deve ter sido chamado');
    assert.strictEqual(capturedTarget.textContent, 'Terceiro título');

    // Desinscrição
    unsubscribe();
  });

  await test('13. scrollSpyController.init inicializa todos os 3 exemplos e monitor de eventos', () => {
    scrollSpyController.eventLogs = [];
    scrollSpyController.init();

    assert.strictEqual(scrollSpyController.initialized, true);
    assert(scrollSpyController.eventLogs.length > 0, 'Deve registrar log de inicialização');

    // Testar botões de controle de métodos
    const btnRefresh = document.getElementById('btn-scrollspy-refresh');
    assert(btnRefresh, 'Botão refresh() deve existir');
    btnRefresh.click();

    const hasMethodLog = scrollSpyController.eventLogs.some(l => l.message.includes('refresh()'));
    assert(hasMethodLog, 'Log de refresh() deve ter sido registrado');
  });

  await test('14. Disparo de activate.bs.scrollspy atualiza badge de status e console de logs', () => {
    const container = document.getElementById('scrollspy-container-nested');
    const mockLink = document.createElement('a');
    mockLink.textContent = 'Item 3-1';
    mockLink.setAttribute('href', '#item-3-1');

    const event = new dom.window.CustomEvent('activate.bs.scrollspy', { bubbles: true });
    event.relatedTarget = mockLink;
    container.dispatchEvent(event);

    const badge = document.getElementById('badge-active-nested');
    assert.strictEqual(badge.textContent, 'Ativo: Item 3-1');

    const logContainer = document.getElementById('scrollspy-event-log-container');
    assert(logContainer.innerHTML.includes('Item 3-1'), 'Log container deve exibir o item ativado');
  });

  await test('15. Menu lateral NÃO deve conter item para ScrollSpy (ScrollSpy é função utilitária)', () => {
    const menuLink = document.querySelector('#main-sidebar-nav a[data-view="components-scrollspy"]');
    assert.strictEqual(menuLink, null, 'Link para components-scrollspy não deve existir na barra lateral');
  });

  console.log(`\n============================================================`);
  console.log(`TOTAL DE TESTES SCROLLSPY APROVADOS: ${passedTests}/${totalTests} (100%)`);
}

run().catch(err => {
  console.error('Falha geral nos testes:', err);
  process.exit(1);
});
