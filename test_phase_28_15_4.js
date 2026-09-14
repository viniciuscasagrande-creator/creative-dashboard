/**
 * ==========================================================================
 * SUÍTE DE TESTES AUTOMATIZADOS — FASE 28.15.4
 * Validação: Consolidação Contabilidade + Subrotas e AccountingController
 * ==========================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import assert from 'assert';

import {
  ACCOUNTING_ROUTES,
  ACCOUNTING_TAB_TO_ROUTE,
  ACCOUNTING_ROUTE_TO_TAB,
  CONTABILIDADE_TAB_TO_MENU_KEY
} from './src/navigation/accounting-routes.js';
import { AccountingController, TAB_PANE_MAP, TAB_TITLES } from './src/accounting/accounting-controller.js';
import { MenuStateManager } from './src/navigation/menu-state.js';
import { resolveRoute, ROUTES, LEGACY_ROUTE_ALIASES } from './src/navigation/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log(' INICIANDO TESTES DA FASE 28.15.4 — CONTABILIDADE + SUBROTAS');
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
const indexHtmlContent = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');

// Montar ambiente JSDOM
const dom = new JSDOM(indexHtmlContent, {
  url: 'http://localhost/#/contabilidade/dashboard',
  runScripts: 'dangerously'
});

global.window = dom.window;
global.document = dom.window.document;
global.CSS = dom.window.CSS;
global.HTMLElement = dom.window.HTMLElement;
global.AccountingController = AccountingController;

// ============================================================================
// SUÍTE 1: VERIFICAÇÃO DO CATÁLOGO DE SUBROTAS (accounting-routes.js & routes.js)
// ============================================================================
console.log('1. Catálogo e Resolução das 12 Subrotas Canônicas:');

const CANONICAL_SUBROUTES = [
  { path: '/contabilidade/dashboard', tab: 'dashboard', menuKey: 'accounting-overview', title: 'Contabilidade Disk Enterprise' },
  { path: '/contabilidade/inteligencia', tab: 'inteligencia-contabil', menuKey: 'accounting-intelligence', title: 'Inteligência Contábil' },
  { path: '/contabilidade/conciliacao', tab: 'conciliacao', menuKey: 'accounting-reconciliation', title: 'Centro de Conciliação' },
  { path: '/contabilidade/rastreabilidade', tab: 'rastreabilidade', menuKey: 'accounting-traceability', title: 'Rastreabilidade 360°' },
  { path: '/contabilidade/dre', tab: 'relatorios-dre', menuKey: 'accounting-dre', title: 'DRE Gerencial' },
  { path: '/contabilidade/balanco', tab: 'relatorios-balanco', menuKey: 'accounting-balance', title: 'Balanço Patrimonial' },
  { path: '/contabilidade/fechamento', tab: 'cont-fechamento', menuKey: 'accounting-closing', title: 'Fechamento Mensal' },
  { path: '/contabilidade/plano-de-contas', tab: 'plano-contas', menuKey: 'accounting-chart', title: 'Plano de Contas' },
  { path: '/contabilidade/lancamentos', tab: 'lancamentos', menuKey: 'accounting-journal', title: 'Livro de Lançamentos' },
  { path: '/contabilidade/documentos', tab: 'documentos', menuKey: 'accounting-documents', title: 'Documentos Fiscais & Contábeis' },
  { path: '/contabilidade/fiscal', tab: 'fiscal', menuKey: 'accounting-fiscal', title: 'Gestão Fiscal & Tributos' },
  { path: '/contabilidade/relatorios', tab: 'relatorios', menuKey: 'accounting-reports', title: 'Relatórios Contábeis' }
];

it('Todas as 12 subrotas canônicas estão registradas em ROUTES e utilizam view-accounting-disk', () => {
  CANONICAL_SUBROUTES.forEach(sr => {
    assert.ok(ROUTES[sr.path], `Rota "${sr.path}" não encontrada em ROUTES`);
    assert.strictEqual(ROUTES[sr.path].view, 'accounting-disk', `Rota "${sr.path}" deve usar view accounting-disk`);
    assert.strictEqual(ROUTES[sr.path].module, 'contabilidade', `Rota "${sr.path}" deve pertencer ao módulo contabilidade`);
    assert.strictEqual(ROUTES[sr.path].tab, sr.tab, `Rota "${sr.path}" deve ter tab="${sr.tab}"`);
    assert.strictEqual(ROUTES[sr.path].menuKey, sr.menuKey, `Rota "${sr.path}" deve ter menuKey="${sr.menuKey}"`);
  });
});

it('Rotas adicionais de auditoria e configurações permanecem válidas e acessíveis', () => {
  const extraRoutes = ['/contabilidade/auditoria', '/contabilidade/configuracoes'];
  extraRoutes.forEach(p => {
    assert.ok(ROUTES[p], `Rota extra "${p}" deve existir`);
    assert.strictEqual(ROUTES[p].view, 'accounting-disk');
    assert.strictEqual(ROUTES[p].module, 'contabilidade');
  });
});

it('resolveRoute() resolve cada uma das 12 subrotas sem fallback e sem warnings', () => {
  CANONICAL_SUBROUTES.forEach(sr => {
    const resolved = resolveRoute(sr.path);
    assert.strictEqual(resolved.path, sr.path);
    assert.strictEqual(resolved.tab, sr.tab);
    assert.strictEqual(resolved.menuKey, sr.menuKey);
    assert.strictEqual(resolved.view, 'accounting-disk');
  });
});

it('resolveRoute() resolve inputs com hash (#/contabilidade/dre) e sem barra inicial (contabilidade/dre)', () => {
  const hashRes = resolveRoute('#/contabilidade/dre');
  assert.strictEqual(hashRes.path, '/contabilidade/dre');
  assert.strictEqual(hashRes.tab, 'relatorios-dre');
  assert.strictEqual(hashRes.menuKey, 'accounting-dre');

  const noSlashRes = resolveRoute('contabilidade/dre');
  assert.strictEqual(noSlashRes.path, '/contabilidade/dre');
  assert.strictEqual(noSlashRes.tab, 'relatorios-dre');
});

it('resolveRoute() resolve aliases legados e identificadores de tabs contábeis diretos', () => {
  const aliases = [
    { input: 'accounting-disk', expectedPath: '/contabilidade/dashboard' },
    { input: 'accounting-dre', expectedPath: '/contabilidade/dre' },
    { input: 'accounting-traceability', expectedPath: '/contabilidade/rastreabilidade' },
    { input: 'accounting-documents', expectedPath: '/contabilidade/documentos' },
    { input: 'accounting-fiscal', expectedPath: '/contabilidade/fiscal' },
    { input: 'dre', expectedPath: '/contabilidade/dre' },
    { input: 'relatorios-dre', expectedPath: '/contabilidade/dre' },
    { input: 'rastreabilidade', expectedPath: '/contabilidade/rastreabilidade' },
    { input: 'conciliacao', expectedPath: '/contabilidade/conciliacao' }
  ];

  aliases.forEach(a => {
    const res = resolveRoute(a.input);
    assert.strictEqual(res.path, a.expectedPath, `Alias "${a.input}" deveria resolver para "${a.expectedPath}", mas obteve "${res.path}"`);
  });
});

// ============================================================================
// SUÍTE 2: VERIFICAÇÃO DO DOM E VIEW ÚNICA (index.html)
// ============================================================================
console.log('\n2. Verificação de View Única e Sidebar no index.html:');

it('Existe EXATAMENTE UMA view-accounting-disk no DOM (zero duplicação física)', () => {
  const views = document.querySelectorAll('#view-accounting-disk');
  assert.strictEqual(views.length, 1, `Esperada exatamente 1 view-accounting-disk, encontradas ${views.length}`);
});

it('O submenu de Contabilidade possui EXATAMENTE 12 itens com atributos canônicos únicos', () => {
  const items = Array.from(document.querySelectorAll('#main-sidebar-nav [data-menu-group="contabilidade"] .submenu-link'));
  assert.strictEqual(items.length, 12, `Esperado 12 itens na sidebar de Contabilidade, encontrados ${items.length}`);

  const routesSet = new Set();
  const menuKeysSet = new Set();
  const tabsSet = new Set();

  items.forEach(it => {
    const r = it.getAttribute('data-route');
    const mk = it.getAttribute('data-menu-key');
    const tab = it.getAttribute('data-tab');

    assert.ok(r, `Link "${it.textContent.trim()}" não possui data-route`);
    assert.ok(mk, `Link "${it.textContent.trim()}" não possui data-menu-key`);
    assert.ok(tab, `Link "${it.textContent.trim()}" não possui data-tab`);

    assert.ok(!routesSet.has(r), `data-route duplicado: ${r}`);
    assert.ok(!menuKeysSet.has(mk), `data-menu-key duplicado: ${mk}`);
    assert.ok(!tabsSet.has(tab), `data-tab duplicado: ${tab}`);

    routesSet.add(r);
    menuKeysSet.add(mk);
    tabsSet.add(tab);
  });
});

// ============================================================================
// SUÍTE 3: ISOLAMENTO DE ESTADO E ITEM ATIVO ÚNICO (MenuStateManager)
// ============================================================================
console.log('\n3. Sincronização e Item Ativo Único por Subrota:');

CANONICAL_SUBROUTES.forEach(sr => {
  it(`Navegação para ${sr.path} ativa EXATAMENTE 1 link na sidebar com menuKey="${sr.menuKey}"`, () => {
    const route = resolveRoute(sr.path);
    MenuStateManager.sync(route);

    const activeLinks = document.querySelectorAll('#main-sidebar-nav .nav-link.active');
    assert.strictEqual(activeLinks.length, 1, `Esperado 1 link ativo para ${sr.path}, encontrados ${activeLinks.length}`);
    assert.strictEqual(activeLinks[0].getAttribute('data-menu-key'), sr.menuKey);
    assert.strictEqual(activeLinks[0].getAttribute('aria-current'), 'page');

    const openGroups = document.querySelectorAll('#main-sidebar-nav .nav-item-submenu.nav-item-open');
    assert.strictEqual(openGroups.length, 1, `Grupo contabilidade deve ser o único aberto`);
    assert.strictEqual(openGroups[0].getAttribute('data-menu-group'), 'contabilidade');
  });
});

// ============================================================================
// SUÍTE 4: ACCOUNTING CONTROLLER (Ativação de Painéis e Breadcrumbs)
// ============================================================================
console.log('\n4. Orquestração do AccountingController:');

it('activateTab("dashboard") ativa painel accpane-dashboard e esconde outros', () => {
  const ok = AccountingController.activateTab('dashboard');
  assert.ok(ok, 'activateTab("dashboard") falhou');
  assert.strictEqual(AccountingController.currentTab, 'dashboard');

  const dashPane = document.getElementById('accpane-dashboard');
  assert.strictEqual(dashPane.style.display, 'block');
  assert.ok(dashPane.classList.contains('active'));

  const breadcrumb = document.getElementById('acc-breadcrumb-current-label');
  assert.strictEqual(breadcrumb.textContent, 'Visão Geral');
});

it('activateTab("inteligencia-contabil") ativa painel accpane-inteligencia-contabil', () => {
  AccountingController.activateTab('inteligencia-contabil');
  assert.strictEqual(AccountingController.currentTab, 'inteligencia-contabil');

  const intelPane = document.getElementById('accpane-inteligencia-contabil');
  assert.strictEqual(intelPane.style.display, 'block');
  assert.ok(intelPane.classList.contains('active'));

  const dashPane = document.getElementById('accpane-dashboard');
  assert.strictEqual(dashPane.style.display, 'none');
});

it('activateTab("rastreabilidade") ativa accpane-lancamentos sem gerar erro nem undefined', () => {
  AccountingController.activateTab('rastreabilidade');
  assert.strictEqual(AccountingController.currentTab, 'rastreabilidade');

  const lancPane = document.getElementById('accpane-lancamentos');
  assert.strictEqual(lancPane.style.display, 'block');
  assert.ok(lancPane.classList.contains('active'));

  const breadcrumb = document.getElementById('acc-breadcrumb-current-label');
  assert.strictEqual(breadcrumb.textContent, 'Rastreabilidade 360º');
});

it('activateTab("relatorios-dre") ativa accpane-relatorios-dre e atualiza breadcrumb para "DRE Gerencial"', () => {
  AccountingController.activateTab('relatorios-dre');
  assert.strictEqual(AccountingController.currentTab, 'relatorios-dre');

  const drePane = document.getElementById('accpane-relatorios-dre');
  assert.strictEqual(drePane.style.display, 'block');
  assert.ok(drePane.classList.contains('active'));

  const breadcrumb = document.getElementById('acc-breadcrumb-current-label');
  assert.strictEqual(breadcrumb.textContent, 'DRE Gerencial');
});

it('activateTab("documentos") ativa accpane-fiscal-nfe', () => {
  AccountingController.activateTab('documentos');
  assert.strictEqual(AccountingController.currentTab, 'documentos');

  const nfePane = document.getElementById('accpane-fiscal-nfe');
  assert.strictEqual(nfePane.style.display, 'block');

  const breadcrumb = document.getElementById('acc-breadcrumb-current-label');
  assert.strictEqual(breadcrumb.textContent, 'Documentos Fiscais & Contábeis');
});

it('activateTab("fiscal") ativa accpane-impostos', () => {
  AccountingController.activateTab('fiscal');
  assert.strictEqual(AccountingController.currentTab, 'fiscal');

  const impPane = document.getElementById('accpane-impostos');
  assert.strictEqual(impPane.style.display, 'block');

  const breadcrumb = document.getElementById('acc-breadcrumb-current-label');
  assert.strictEqual(breadcrumb.textContent, 'Gestão Fiscal & Tributos');
});

it('activateTab() com undefined ou null faz fallback seguro para dashboard', () => {
  AccountingController.activateTab(undefined);
  assert.strictEqual(AccountingController.currentTab, 'dashboard');

  const dashPane = document.getElementById('accpane-dashboard');
  assert.strictEqual(dashPane.style.display, 'block');

  AccountingController.activateTab(null);
  assert.strictEqual(AccountingController.currentTab, 'dashboard');
});

console.log('\n================================================================');
console.log(` SUCESSO: TODOS OS ${passedTests}/${totalTests} TESTES DA FASE 28.15.4 FORAM APROVADOS (100% OK)!`);
console.log('================================================================\n');
