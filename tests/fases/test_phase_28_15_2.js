/**
 * ==========================================================================
 * SUÍTE DE TESTES AUTOMATIZADOS — FASE 28.15.2
 * Validação: Menus, Submenus, Estados Ativos e Acessibilidade da Sidebar
 * ==========================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import assert from 'assert';

import { MenuStateManager } from '../../src/navigation/menu-state.js';
import { resolveRoute, ROUTES, LEGACY_ROUTE_ALIASES } from '../../src/navigation/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log(' INICIANDO TESTES DA FASE 28.15.2 — MENUS E ESTADOS ATIVOS');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FALHA: ${desc}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

// Carregar index.html real
const indexHtmlContent = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

// Montar ambiente JSDOM
const dom = new JSDOM(indexHtmlContent, {
  url: 'http://localhost/#/dashboard',
  runScripts: 'dangerously'
});

global.window = dom.window;
global.document = dom.window.document;
global.CSS = dom.window.CSS;
global.HTMLElement = dom.window.HTMLElement;

// ============================================================================
// SUÍTE 1: VERIFICAÇÃO DE ATRIBUTOS E ESTRUTURA NO DOM REAL (index.html)
// ============================================================================
console.log('1. Estrutura e Atributos Semânticos no index.html:');

it('Verifica se os grupos principais de menu possuem data-menu-group explícito', () => {
  const groups = Array.from(document.querySelectorAll('#main-sidebar-nav .nav-item-submenu'))
    .map(el => el.getAttribute('data-menu-group'));
  
  const expectedGroups = [
    'dashboard', 'eventos', 'marketing', 'financeiro',
    'contabilidade', 'configuracoes'
  ];

  assert.strictEqual(groups.length, 6, `Esperado 6 grupos, encontrados ${groups.length}`);
  expectedGroups.forEach(eg => {
    assert.ok(groups.includes(eg), `Grupo esperado "${eg}" não encontrado no DOM`);
  });
});

it('Verifica se nenhum grupo inicia com nav-item-open ou collapse show hardcoded', () => {
  const openGroups = document.querySelectorAll('#main-sidebar-nav .nav-item-open');
  const openCollapses = document.querySelectorAll('#main-sidebar-nav .collapse.show');
  assert.strictEqual(openGroups.length, 0, `Não deve haver nav-item-open hardcoded (encontrados ${openGroups.length})`);
  assert.strictEqual(openCollapses.length, 0, `Não deve haver collapse.show hardcoded (encontrados ${openCollapses.length})`);
});

it('Verifica se nenhum link na sidebar inicia com classe active hardcoded', () => {
  const activeLinks = document.querySelectorAll('#main-sidebar-nav .nav-link.active');
  assert.strictEqual(activeLinks.length, 0, `Não deve haver .active hardcoded na sidebar (encontrados ${activeLinks.length})`);
});

it('Verifica se todos os 12 itens de Contabilidade possuem data-tab e data-menu-key únicos', () => {
  const contLinks = Array.from(document.querySelectorAll('#main-sidebar-nav [data-menu-group="contabilidade"] .submenu-link'));
  assert.strictEqual(contLinks.length, 12, `Esperado 12 itens na Contabilidade, encontrados ${contLinks.length}`);

  const menuKeys = new Set();
  contLinks.forEach(link => {
    const tab = link.getAttribute('data-tab');
    const key = link.getAttribute('data-menu-key');
    assert.ok(tab, `Item contábil "${link.textContent.trim()}" não possui data-tab`);
    assert.ok(key, `Item contábil "${link.textContent.trim()}" não possui data-menu-key`);
    assert.ok(!menuKeys.has(key), `Chave duplicada encontrada na Contabilidade: ${key}`);
    menuKeys.add(key);
  });
});

it('Verifica se todos os cabeçalhos de grupos principais possuem aria-expanded="false" e aria-controls', () => {
  const triggers = document.querySelectorAll('#main-sidebar-nav .nav-item-submenu > .nav-link');
  assert.strictEqual(triggers.length, 6);
  triggers.forEach(tr => {
    assert.strictEqual(tr.getAttribute('aria-expanded'), 'false', `Trigger "${tr.textContent.trim()}" deve iniciar aria-expanded="false"`);
    assert.ok(tr.getAttribute('aria-controls'), `Trigger "${tr.textContent.trim()}" deve possuir aria-controls`);
  });
});

// ============================================================================
// SUÍTE 2: REGRA DO ITEM ATIVO ÚNICO E ACCORDION
// ============================================================================
console.log('\n2. Unicidade de Item Ativo e Comportamento Accordion:');

it('Navegar para rota em Financeiro ativa EXATAMENTE 1 link e abre grupo financeiro', () => {
  const route = resolveRoute('/financeiro/dashboard');
  MenuStateManager.sync(route);

  const activeLinks = document.querySelectorAll('#main-sidebar-nav .nav-link.active');
  assert.strictEqual(activeLinks.length, 1, `Esperado exatamente 1 link ativo, encontrados ${activeLinks.length}`);
  assert.strictEqual(activeLinks[0].getAttribute('data-view'), 'financial-dashboard');

  const openGroups = document.querySelectorAll('#main-sidebar-nav .nav-item-submenu.nav-item-open');
  assert.strictEqual(openGroups.length, 1, `Esperado exatamente 1 grupo aberto, encontrados ${openGroups.length}`);
  assert.strictEqual(openGroups[0].getAttribute('data-menu-group'), 'financeiro');
});

it('Navegar para rota em Marketing fecha Financeiro e abre exclusivamente Marketing', () => {
  const route = resolveRoute('/marketing/campanhas');
  MenuStateManager.sync(route);

  const activeLinks = document.querySelectorAll('#main-sidebar-nav .nav-link.active');
  assert.strictEqual(activeLinks.length, 1, `Esperado 1 link ativo, encontrados ${activeLinks.length}`);
  assert.strictEqual(activeLinks[0].getAttribute('data-view'), 'marketing-campaigns');

  const openGroups = document.querySelectorAll('#main-sidebar-nav .nav-item-submenu.nav-item-open');
  assert.strictEqual(openGroups.length, 1, `Esperado 1 grupo aberto, encontrados ${openGroups.length}`);
  assert.strictEqual(openGroups[0].getAttribute('data-menu-group'), 'marketing');
});

it('Navegar para rota standalone (Todos os Eventos raiz) fecha todos os grupos accordion', () => {
  const route = resolveRoute('/eventos');
  route.menuKey = 'events-list-root';
  MenuStateManager.sync(route);

  const activeLinks = document.querySelectorAll('#main-sidebar-nav .nav-link.active');
  assert.strictEqual(activeLinks.length, 1, `Esperado 1 link ativo, encontrados ${activeLinks.length}`);
  assert.strictEqual(activeLinks[0].getAttribute('data-menu-key'), 'events-list-root');

  const openGroups = document.querySelectorAll('#main-sidebar-nav .nav-item-submenu.nav-item-open');
  assert.strictEqual(openGroups.length, 0, `Todos os grupos irmãos devem estar fechados, encontrados ${openGroups.length}`);
});

// ============================================================================
// SUÍTE 3: ISOLAMENTO DOS 12 ITENS DE CONTABILIDADE
// ============================================================================
console.log('\n3. Isolamento e Identidade dos 12 Itens de Contabilidade:');

it('Navegar para Centro de Conciliação ativa SOMENTE o link de conciliação', () => {
  const route = resolveRoute('/contabilidade/conciliacao');
  MenuStateManager.sync(route);

  const activeLinks = document.querySelectorAll('#main-sidebar-nav .nav-link.active');
  assert.strictEqual(activeLinks.length, 1, `Esperado 1 link ativo, encontrados ${activeLinks.length}`);
  assert.strictEqual(activeLinks[0].getAttribute('data-menu-key'), 'accounting-reconciliation');
  assert.strictEqual(activeLinks[0].getAttribute('data-tab'), 'conciliacao');

  const openGroups = document.querySelectorAll('#main-sidebar-nav .nav-item-submenu.nav-item-open');
  assert.strictEqual(openGroups.length, 1);
  assert.strictEqual(openGroups[0].getAttribute('data-menu-group'), 'contabilidade');
});

it('Diferenciação precisa entre Rastreabilidade e Lançamentos (compartilham aba lancamentos)', () => {
  // Testar ativação de Rastreabilidade
  const routeTrace = resolveRoute('/contabilidade/rastreabilidade');
  MenuStateManager.sync(routeTrace);

  let activeLinks = document.querySelectorAll('#main-sidebar-nav .nav-link.active');
  assert.strictEqual(activeLinks.length, 1);
  assert.strictEqual(activeLinks[0].getAttribute('data-menu-key'), 'accounting-traceability');

  // Testar ativação de Lançamentos
  const routeJournal = resolveRoute('/contabilidade/lancamentos');
  MenuStateManager.sync(routeJournal);

  activeLinks = document.querySelectorAll('#main-sidebar-nav .nav-link.active');
  assert.strictEqual(activeLinks.length, 1);
  assert.strictEqual(activeLinks[0].getAttribute('data-menu-key'), 'accounting-journal');
});

it('Diferenciação precisa entre DRE Gerencial e Relatórios (compartilham aba relatorios-dre)', () => {
  // Testar ativação de DRE Gerencial
  const routeDre = resolveRoute('/contabilidade/dre');
  MenuStateManager.sync(routeDre);

  let activeLinks = document.querySelectorAll('#main-sidebar-nav .nav-link.active');
  assert.strictEqual(activeLinks.length, 1);
  assert.strictEqual(activeLinks[0].getAttribute('data-menu-key'), 'accounting-dre');

  // Testar ativação de Relatórios
  const routeReports = resolveRoute('/contabilidade/relatorios');
  MenuStateManager.sync(routeReports);

  activeLinks = document.querySelectorAll('#main-sidebar-nav .nav-link.active');
  assert.strictEqual(activeLinks.length, 1);
  assert.strictEqual(activeLinks[0].getAttribute('data-menu-key'), 'accounting-reports');
});

// ============================================================================
// SUÍTE 4: ACESSIBILIDADE (aria-expanded e aria-current)
// ============================================================================
console.log('\n4. Sincronização de Acessibilidade (ARIA):');

it('aria-expanded="true" é aplicado estritamente no grupo aberto e "false" nos fechados', () => {
  const route = resolveRoute('/financeiro/tesouraria');
  MenuStateManager.sync(route);

  const finTrigger = document.querySelector('#menu-trigger-financeiro');
  assert.strictEqual(finTrigger.getAttribute('aria-expanded'), 'true');

  const otherTriggers = Array.from(document.querySelectorAll('#main-sidebar-nav .nav-item-submenu:not([data-menu-group="financeiro"]) > .nav-link'));
  otherTriggers.forEach(tr => {
    assert.strictEqual(tr.getAttribute('aria-expanded'), 'false', `Trigger "${tr.textContent.trim()}" deve ter aria-expanded="false"`);
  });
});

it('aria-current="page" existe EXATAMENTE no único link ativo', () => {
  const route = resolveRoute('/contabilidade/balanco');
  MenuStateManager.sync(route);

  const ariaCurrentLinks = document.querySelectorAll('#main-sidebar-nav .nav-link[aria-current="page"]');
  assert.strictEqual(ariaCurrentLinks.length, 1, `Esperado exatamente 1 link com aria-current="page", encontrados ${ariaCurrentLinks.length}`);
  assert.strictEqual(ariaCurrentLinks[0].getAttribute('data-menu-key'), 'accounting-balance');
});

// ============================================================================
// SUÍTE 5: PRESERVAÇÃO DE CLASSES .ACTIVE FORA DA SIDEBAR
// ============================================================================
console.log('\n5. Não-interferência em Componentes Fora da Sidebar:');

it('MenuStateManager não remove classes active de botões, abas ou elementos fora de #main-sidebar-nav', () => {
  // Criar elemento externo simulando tab interna ativa
  const externalTab = document.createElement('button');
  externalTab.id = 'test-external-tab';
  externalTab.className = 'nav-link active';
  document.body.appendChild(externalTab);

  // Executar sincronização do menu
  const route = resolveRoute('/financeiro/dashboard');
  MenuStateManager.sync(route);

  // Verificar se o elemento externo permaneceu com active intacto
  assert.ok(externalTab.classList.contains('active'), 'Classe active externa foi indevidamente removida!');
  externalTab.remove();
});

// ============================================================================
// SUÍTE 6: MODO ACCORDION PROGRAMÁTICO
// ============================================================================
console.log('\n6. Funções de Abertura e Fechamento Programático:');

it('openGroup e closeGroup manipulam classes e aria-expanded de forma consistente', () => {
  const group = document.querySelector('#main-sidebar-nav [data-menu-group="financeiro"]');
  const trigger = group.querySelector(':scope > .nav-link');
  const submenu = group.querySelector(':scope > .nav-group-sub');

  MenuStateManager.openGroup(group);
  assert.ok(group.classList.contains('nav-item-open'));
  assert.strictEqual(trigger.getAttribute('aria-expanded'), 'true');
  assert.ok(submenu.classList.contains('show'));

  MenuStateManager.closeGroup(group);
  assert.ok(!group.classList.contains('nav-item-open'));
  assert.strictEqual(trigger.getAttribute('aria-expanded'), 'false');
  assert.ok(!submenu.classList.contains('show'));
});

console.log('\n================================================================');
console.log(` SUCESSO: TODOS OS ${passedTests}/${totalTests} TESTES DA FASE 28.15.2 FORAM APROVADOS (100% OK)!`);
console.log('================================================================\n');
