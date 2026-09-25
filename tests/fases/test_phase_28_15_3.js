/**
 * ==========================================================================
 * SUÍTE DE TESTES AUTOMATIZADOS — FASE 28.15.3
 * Reestruturação Enterprise do Menu Financeiro do PDT DiskIngressos
 * ==========================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import assert from 'assert';

import { MenuStateManager } from '../../src/navigation/menu-state.js';
import { AppRouter } from '../../src/navigation/router.js';
import { resolveRoute, ROUTES, LEGACY_ROUTE_ALIASES } from '../../src/navigation/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log(' INICIANDO TESTES DA FASE 28.15.3 — FINANCEIRO ENTERPRISE');
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

const dom = new JSDOM(indexHtmlContent, {
  url: 'http://localhost/#/dashboard',
  runScripts: 'dangerously'
});

global.window = dom.window;
global.document = dom.window.document;
global.CSS = dom.window.CSS;
global.HTMLElement = dom.window.HTMLElement;

// ============================================================================
// SUÍTE 1: ARQUITETURA ENTERPRISE DA SIDEBAR (index.html)
// ============================================================================
console.log('1. Arquitetura da Sidebar Enterprise:');

it('Sidebar possui exatamente 6 grupos accordion no primeiro nível', () => {
  const groups = Array.from(document.querySelectorAll('#main-sidebar-nav > .nav-item-submenu'))
    .map(el => el.getAttribute('data-menu-group'));
  
  const expectedGroups = ['dashboard', 'eventos', 'marketing', 'financeiro', 'contabilidade', 'configuracoes'];
  assert.strictEqual(groups.length, 6, `Esperado 6 grupos principais, encontrados ${groups.length}: ${groups.join(', ')}`);
  expectedGroups.forEach(eg => {
    assert.ok(groups.includes(eg), `Grupo principal "${eg}" ausente`);
  });
});

it('Eliminação de grupos redundantes soltos (fluxo-caixa, receitas, despesas fora do top-level)', () => {
  const topGroups = Array.from(document.querySelectorAll('#main-sidebar-nav > .nav-item-submenu'))
    .map(el => el.getAttribute('data-menu-group'));
  assert.ok(!topGroups.includes('fluxo-caixa'), 'fluxo-caixa não deve existir como grupo de 1º nível');
  assert.ok(!topGroups.includes('receitas'), 'receitas não deve existir como grupo de 1º nível');
  assert.ok(!topGroups.includes('despesas'), 'despesas não deve existir como grupo de 1º nível');
});

it('Menu Financeiro contém exatamente os 10 Domínios Enterprise funcionais', () => {
  const finGroup = document.querySelector('#main-sidebar-nav [data-menu-group="financeiro"]');
  assert.ok(finGroup, 'Grupo Financeiro não encontrado');

  const domainHeaders = Array.from(finGroup.querySelectorAll('.nav-item-header[data-finance-domain]'))
    .map(el => el.getAttribute('data-finance-domain'));

  const expectedDomains = [
    'overview',
    'treasury',
    'accounts',
    'procurement',
    'suppliers',
    'contracts',
    'controlling',
    'reconciliation',
    'operation',
    'reports'
  ];

  assert.strictEqual(domainHeaders.length, 10, `Esperado 10 domínios, encontrados ${domainHeaders.length}`);
  expectedDomains.forEach(dom => {
    assert.ok(domainHeaders.includes(dom), `Domínio financeiro "${dom}" ausente na sidebar`);
  });
});

it('Todos os 50 links do menu Financeiro possuem data-view, data-route e data-menu-key válidos', () => {
  const finLinks = Array.from(document.querySelectorAll('#main-sidebar-nav [data-menu-group="financeiro"] .submenu-link'));
  assert.strictEqual(finLinks.length, 50, `Esperado 50 itens no Financeiro, encontrados ${finLinks.length}`);

  const usedKeys = new Set();
  const usedRoutes = new Set();

  finLinks.forEach(link => {
    const view = link.getAttribute('data-view');
    const route = link.getAttribute('data-route');
    const key = link.getAttribute('data-menu-key');

    assert.ok(view, `Item "${link.textContent.trim()}" não possui data-view`);
    assert.ok(route, `Item "${link.textContent.trim()}" não possui data-route`);
    assert.ok(key, `Item "${link.textContent.trim()}" não possui data-menu-key`);

    assert.ok(!usedKeys.has(key), `data-menu-key duplicado: ${key}`);
    assert.ok(!usedRoutes.has(route), `data-route duplicado: ${route}`);

    usedKeys.add(key);
    usedRoutes.add(route);
  });
});

it('Nenhum link ou grupo inicia com .active, .nav-item-open ou .collapse.show hardcoded', () => {
  const activeLinks = document.querySelectorAll('#main-sidebar-nav .nav-link.active');
  const openGroups = document.querySelectorAll('#main-sidebar-nav .nav-item-open');
  const openCollapses = document.querySelectorAll('#main-sidebar-nav .collapse.show');

  assert.strictEqual(activeLinks.length, 0, `Não deve haver active hardcoded (${activeLinks.length})`);
  assert.strictEqual(openGroups.length, 0, `Não deve haver nav-item-open hardcoded (${openGroups.length})`);
  assert.strictEqual(openCollapses.length, 0, `Não deve haver collapse.show hardcoded (${openCollapses.length})`);
});

// ============================================================================
// SUÍTE 2: PRESERVAÇÃO INTEGRAL DE TELAS E REGRAS DE NEGÓCIO
// ============================================================================
console.log('\n2. Preservação Integral de Telas e Módulos no DOM:');

it('Todas as 35 telas/views financeiras continuam 100% preservadas no DOM', () => {
  const requiredViews = [
    'financial-dashboard',
    'financial-analytics',
    'dashboard-indicators',
    'financial-balance',
    'financial-event-transfers',
    'financial-accounts',
    'treasury',
    'financial-repass',
    'financial-expenses',
    'financial-advance',
    'procure-to-pay',
    'cashflow-performance',
    'cashflow-statement',
    'cashflow-flow',
    'cashflow-dre',
    'financial-operators',
    'financial-pdv',
    'financial-paymethods',
    'financial-custompay',
    'financial-negotiations',
    'financial-refunds',
    'financial-statement',
    'financial-bordero',
    'reports-sales',
    'revenues-desc',
    'revenues-day',
    'revenues-type',
    'revenues-category',
    'revenues-event',
    'revenues-tags-event',
    'revenues-costcenter',
    'revenues-tags-label',
    'expenses-desc',
    'expenses-category',
    'expenses-event'
  ];

  requiredViews.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    assert.ok(el, `Tela obrigatória "#view-${v}" não encontrada no DOM!`);
  });
});

it('Dashboard Financeiro (#view-financial-dashboard) permanece 100% íntegro e intocado', () => {
  const dash = document.getElementById('view-financial-dashboard');
  assert.ok(dash, 'Dashboard Financeiro ausente');
  assert.ok(dash.querySelector('.card'), 'Estrutura interna do dashboard violada');
});

// ============================================================================
// SUÍTE 3: RESOLUÇÃO DE ROTAS E ALIASES CANÔNICOS
// ============================================================================
console.log('\n3. Resolução de Rotas e Aliases Canônicos:');

it('Todas as rotas do menu financeiro resolvem explicitamente em ROUTES (0 fallbacks)', () => {
  const finLinks = Array.from(document.querySelectorAll('#main-sidebar-nav [data-menu-group="financeiro"] .submenu-link'));
  finLinks.forEach(link => {
    const routePath = link.getAttribute('data-route');
    const resolved = resolveRoute(routePath);
    assert.ok(resolved, `Rota "${routePath}" falhou ao resolver`);
    assert.ok(ROUTES[routePath], `Rota "${routePath}" não está explicitamente em ROUTES`);
    assert.strictEqual(resolved.module, 'financeiro', `Módulo de "${routePath}" deve ser "financeiro", obtido "${resolved.module}"`);
  });
});

it('Aliases legados resolvem para os contratos canônicos corretos', () => {
  const aliasTests = [
    { alias: 'financial-dashboard', expectedPath: '/financeiro/dashboard', expectedView: 'financial-dashboard' },
    { alias: 'saldo', expectedPath: '/financeiro/saldo', expectedView: 'financial-balance' },
    { alias: 'gestao-saldos', expectedPath: '/financeiro/gestao-saldos', expectedView: 'financial-event-transfers' },
    { alias: 'agenda-financeira', expectedPath: '/financeiro/agenda', expectedView: 'financial-event-transfers' },
    { alias: 'financial-repass', expectedPath: '/financeiro/repasses', expectedView: 'financial-repass' },
    { alias: 'financial-advance', expectedPath: '/financeiro/antecipacoes', expectedView: 'financial-advance' },
    { alias: 'procure-to-pay', expectedPath: '/financeiro/compras', expectedView: 'procure-to-pay' },
    { alias: 'treasury', expectedPath: '/financeiro/tesouraria', expectedView: 'treasury' },
    { alias: 'financial-pix', expectedPath: '/financeiro/pix', expectedView: 'treasury' },
    { alias: 'cashflow-performance', expectedPath: '/financeiro/fluxo-caixa', expectedView: 'cashflow-performance' },
    { alias: 'cashflow-flow', expectedPath: '/financeiro/fluxo-caixa/evolucao', expectedView: 'cashflow-flow' },
    { alias: 'cashflow-dre', expectedPath: '/financeiro/dre-evento', expectedView: 'cashflow-dre' },
    { alias: 'gateways', expectedPath: '/financeiro/gateways', expectedView: 'financial-operators' },
    { alias: 'revenues-event', expectedPath: '/receitas/evento', expectedView: 'revenues-event' },
    { alias: 'expenses-category', expectedPath: '/despesas/categoria', expectedView: 'expenses-category' }
  ];

  aliasTests.forEach(t => {
    const res = resolveRoute(t.alias);
    assert.strictEqual(res.path, t.expectedPath, `Alias "${t.alias}" deveria resolver para "${t.expectedPath}", obteve "${res.path}"`);
    assert.strictEqual(res.view, t.expectedView, `Alias "${t.alias}" deveria mapear view "${t.expectedView}", obteve "${res.view}"`);
  });
});

// ============================================================================
// SUÍTE 4: SINCRONIZAÇÃO DE ESTADO VISUAL DA SIDEBAR (MenuStateManager)
// ============================================================================
console.log('\n4. Sincronização de Estado da Sidebar com os 10 Domínios:');

const testDomainRoutes = [
  { domain: '1. Visão Geral', route: '/financeiro/dashboard', key: 'fin-dashboard' },
  { domain: '2. Tesouraria', route: '/financeiro/pix', key: 'fin-treasury-pix' },
  { domain: '3. Contas', route: '/financeiro/repasses-produtor', key: 'fin-payouts' },
  { domain: '4. Compras', route: '/financeiro/aprovacoes', key: 'fin-approvals' },
  { domain: '5. Fornecedores', route: '/financeiro/fornecedores/360', key: 'fin-suppliers-360' },
  { domain: '6. Contratos', route: '/financeiro/contratos', key: 'fin-contracts' },
  { domain: '7. Controladoria', route: '/financeiro/fluxo-caixa', key: 'fin-cashflow' },
  { domain: '8. Conciliação', route: '/financeiro/conciliacao/bancaria', key: 'fin-reconciliation-bank' },
  { domain: '9. Operação', route: '/financeiro/pdv', key: 'fin-pdv' },
  { domain: '10. Relatórios', route: '/financeiro/relatorios/vendas', key: 'fin-reports-sales' }
];

testDomainRoutes.forEach(({ domain, route, key }) => {
  it(`Navegação no Domínio ${domain} (${route}) ativa item único e abre grupo Financeiro`, () => {
    const routeObj = resolveRoute(route);
    MenuStateManager.sync(routeObj);

    // 1. Apenas 1 link ativo na sidebar
    const activeLinks = document.querySelectorAll('#main-sidebar-nav .nav-link.active');
    assert.strictEqual(activeLinks.length, 1, `Esperado 1 link ativo, encontrados ${activeLinks.length}`);

    // 2. O link ativo é o correto
    const activeLink = activeLinks[0];
    assert.strictEqual(activeLink.getAttribute('data-menu-key'), key, `Chave ativa esperada "${key}", obtida "${activeLink.getAttribute('data-menu-key')}"`);
    assert.strictEqual(activeLink.getAttribute('aria-current'), 'page', 'Atributo aria-current="page" ausente no link ativo');

    // 3. Grupo Financeiro está aberto
    const finGroup = document.querySelector('#main-sidebar-nav [data-menu-group="financeiro"]');
    assert.ok(finGroup.classList.contains('nav-item-open'), 'Grupo financeiro deve ter nav-item-open');
    const trigger = finGroup.querySelector(':scope > .nav-link');
    assert.strictEqual(trigger.getAttribute('aria-expanded'), 'true', 'Trigger do financeiro deve ter aria-expanded="true"');

    // 4. Grupos irmãos estão fechados
    const siblingGroups = ['dashboard', 'eventos', 'marketing', 'contabilidade', 'configuracoes'];
    siblingGroups.forEach(sg => {
      const el = document.querySelector(`#main-sidebar-nav [data-menu-group="${sg}"]`);
      assert.ok(!el.classList.contains('nav-item-open'), `Grupo irmão "${sg}" não deveria estar aberto`);
      const tr = el.querySelector(':scope > .nav-link');
      assert.strictEqual(tr.getAttribute('aria-expanded'), 'false', `Trigger de "${sg}" deveria ter aria-expanded="false"`);
    });
  });
});

it('Alternância entre Financeiro, Contabilidade e Marketing fecha accordions irmãos', () => {
  // 1. Ir para Financeiro > Fornecedor 360°
  MenuStateManager.sync(resolveRoute('/financeiro/fornecedores/360'));
  assert.ok(document.querySelector('[data-menu-group="financeiro"]').classList.contains('nav-item-open'));
  assert.ok(!document.querySelector('[data-menu-group="contabilidade"]').classList.contains('nav-item-open'));

  // 2. Ir para Contabilidade > Conciliação
  MenuStateManager.sync(resolveRoute('/contabilidade/conciliacao'));
  assert.ok(!document.querySelector('[data-menu-group="financeiro"]').classList.contains('nav-item-open'));
  assert.ok(document.querySelector('[data-menu-group="contabilidade"]').classList.contains('nav-item-open'));
  assert.ok(!document.querySelector('[data-menu-group="marketing"]').classList.contains('nav-item-open'));

  // 3. Ir para Marketing > Campanhas
  MenuStateManager.sync(resolveRoute('/marketing/campanhas'));
  assert.ok(!document.querySelector('[data-menu-group="financeiro"]').classList.contains('nav-item-open'));
  assert.ok(!document.querySelector('[data-menu-group="contabilidade"]').classList.contains('nav-item-open'));
  assert.ok(document.querySelector('[data-menu-group="marketing"]').classList.contains('nav-item-open'));

  // 4. Retornar para Financeiro > DRE Gerencial
  MenuStateManager.sync(resolveRoute('/financeiro/dre-evento'));
  assert.ok(document.querySelector('[data-menu-group="financeiro"]').classList.contains('nav-item-open'));
  assert.ok(!document.querySelector('[data-menu-group="marketing"]').classList.contains('nav-item-open'));
  assert.ok(!document.querySelector('[data-menu-group="contabilidade"]').classList.contains('nav-item-open'));
});

// ============================================================================
// SUÍTE 5: EXECUÇÃO DE HOOKS E RENDERIZAÇÃO DE TELAS (AppRouter)
// ============================================================================
console.log('\n5. Execução de Hooks de View e Renderização pelo AppRouter:');

it('AppRouter renderiza view-procure-to-pay e despacha hook com subTab correta', () => {
  let hookCalledWith = null;
  AppRouter.registerHook('procure-to-pay', (routeState) => {
    hookCalledWith = routeState;
  });

  AppRouter.navigate('/financeiro/compras/pedidos');

  const p2pSec = document.getElementById('view-procure-to-pay');
  assert.strictEqual(p2pSec.style.display, 'block', 'View procure-to-pay deve estar visível');
  assert.ok(p2pSec.classList.contains('active'), 'View procure-to-pay deve conter classe active');

  assert.ok(hookCalledWith, 'Hook de procure-to-pay não foi executado');
  assert.strictEqual(hookCalledWith.tab, 'purchases', 'Hook deveria receber subTab "purchases"');
});

it('AppRouter renderiza view-treasury e despacha hook com subTab pix', () => {
  let hookCalledWith = null;
  AppRouter.registerHook('treasury', (routeState) => {
    hookCalledWith = routeState;
  });

  AppRouter.navigate('/financeiro/pix');

  const treasurySec = document.getElementById('view-treasury');
  assert.strictEqual(treasurySec.style.display, 'block', 'View treasury deve estar visível');
  assert.ok(hookCalledWith, 'Hook de treasury não foi executado');
  assert.strictEqual(hookCalledWith.tab, 'pix', 'Hook deveria receber subTab "pix"');
});

it('AppRouter renderiza view-financial-event-transfers e despacha hook com subTab transfer', () => {
  let hookCalledWith = null;
  AppRouter.registerHook('financial-event-transfers', (routeState) => {
    hookCalledWith = routeState;
  });

  AppRouter.navigate('/financeiro/transferencias');

  const transferSec = document.getElementById('view-financial-event-transfers');
  assert.strictEqual(transferSec.style.display, 'block', 'View financial-event-transfers deve estar visível');
  assert.ok(hookCalledWith, 'Hook de transfers não foi executado');
  assert.strictEqual(hookCalledWith.tab, 'transfer', 'Hook deveria receber subTab "transfer"');
});

// ============================================================================
// RESUMO FINAL
// ============================================================================
console.log('\n================================================================');
console.log(` RESULTADO FINAL: ${passedTests}/${totalTests} TESTES PASSARAM COM SUCESSO (100%)`);
console.log('================================================================\n');
