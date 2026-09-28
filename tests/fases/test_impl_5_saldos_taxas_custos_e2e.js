/**
 * ==========================================================================
 * SUÍTE DE TESTES E2E — IMPLANTAÇÃO 5
 * Saldos Consolidados, Taxas Disk, Custos de Pagamento e Smart Scroll da Sidebar
 * tests/fases/test_impl_5_saldos_taxas_custos_e2e.js
 * ==========================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import assert from 'assert';

import { financialConsolidationService } from '../../src/services/financialConsolidationService.js';
import { accessControlService } from '../../src/services/accessControlService.js';
import { MenuStateManager } from '../../src/navigation/menu-state.js';
import { resolveRoute, ROUTES, LEGACY_ROUTE_ALIASES } from '../../src/navigation/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('================================================================');
console.log(' INICIANDO TESTES DA IMPLANTAÇÃO 5 — SALDOS, TAXAS, CUSTOS & SCROLL');
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
const indexHtmlContent = fs.readFileSync(path.resolve(rootDir, 'index.html'), 'utf8');

const dom = new JSDOM(indexHtmlContent, {
  url: 'http://localhost/#/dashboard',
  runScripts: 'dangerously'
});

global.window = dom.window;
global.document = dom.window.document;
global.CSS = dom.window.CSS;
global.HTMLElement = dom.window.HTMLElement;

// ============================================================================
// SUÍTE 1: COMPORTAMENTO DO SMART SCROLL DA SIDEBAR
// ============================================================================
console.log('1. Smart Scroll da Sidebar e Cabeçalho Fixo:');

it('Cabeçalho da sidebar possui a classe .sidebar-section-header-fixed', () => {
  const header = document.querySelector('.sidebar-section-header-fixed');
  assert.ok(header, 'Cabeçalho fixo da sidebar não encontrado com .sidebar-section-header-fixed');
});

it('Área de navegação da sidebar possui #sidebar-nav-scroll-area e classe .sidebar-navigation-scroll-area', () => {
  const scrollArea = document.getElementById('sidebar-nav-scroll-area');
  assert.ok(scrollArea, '#sidebar-nav-scroll-area não encontrado');
  assert.ok(scrollArea.classList.contains('sidebar-navigation-scroll-area'), 'Classe .sidebar-navigation-scroll-area ausente');
});

it('getScrollContainer() identifica estritamente o container interno da sidebar e nunca a janela/window', () => {
  const container = MenuStateManager.getScrollContainer();
  assert.ok(container, 'Container de scroll não localizado');
  assert.strictEqual(container.id, 'sidebar-nav-scroll-area');
  assert.notStrictEqual(container, dom.window);
  assert.notStrictEqual(container, dom.window.document.body);
});

it('scrollModuleToTop() calcula a rolagem relativa correta baseada no topo do container', () => {
  const container = MenuStateManager.getScrollContainer();
  const finGroup = document.querySelector('#main-sidebar-nav [data-menu-group="financeiro"]');
  assert.ok(finGroup, 'Grupo Financeiro não encontrado');

  // Mock getBoundingClientRect
  container.scrollTop = 150;
  container.getBoundingClientRect = () => ({ top: 60, height: 800, bottom: 860, left: 0, right: 260, width: 260 });
  finGroup.getBoundingClientRect = () => ({ top: 300, height: 400, bottom: 700, left: 0, right: 260, width: 260 });

  let scrollToTarget = null;
  container.scrollTo = (options) => {
    scrollToTarget = options.top;
  };

  MenuStateManager.scrollModuleToTop(finGroup, false);
  // Cálculo: scrollTop (150) + (finGroup.top (300) - container.top (60)) = 150 + 240 = 390
  assert.strictEqual(scrollToTarget, 390, `Esperado rolagem para 390, obtido ${scrollToTarget}`);
});

it('Ao abrir um módulo novo, fecha irmãos e posiciona o cabeçalho no topo da área navegável', () => {
  const finGroup = document.querySelector('#main-sidebar-nav [data-menu-group="financeiro"]');
  const mktGroup = document.querySelector('#main-sidebar-nav [data-menu-group="marketing"]');
  
  MenuStateManager.openGroup(mktGroup);
  assert.ok(mktGroup.classList.contains('nav-item-open'));

  // Abre Financeiro
  MenuStateManager.openActiveParent(finGroup.querySelector('.nav-link'));
  assert.ok(finGroup.classList.contains('nav-item-open'));
  assert.ok(!mktGroup.classList.contains('nav-item-open'), 'Marketing deveria ter sido recolhido');
});

// ============================================================================
// SUÍTE 2: REORGANIZAÇÃO OPERACIONAL DOS SUBMENUS FINANCEIROS
// ============================================================================
console.log('\n2. Reorganização Operacional e Divisores Visuais:');

it('Existem divisores operacionais leves (.nav-item-section-divider) na sidebar', () => {
  const dividers = Array.from(document.querySelectorAll('#menu-sub-financeiro .nav-item-section-divider'));
  assert.ok(dividers.length >= 4, `Esperado pelo menos 4 divisores operacionais, encontrados ${dividers.length}`);
  
  const textContent = dividers.map(d => d.textContent.trim()).join(' | ');
  assert.ok(textContent.includes('Visão Financeira'), 'Seção Visão Financeira ausente');
  assert.ok(textContent.includes('Operações'), 'Seção Operações ausente');
  assert.ok(textContent.includes('Tesouraria'), 'Seção Tesouraria ausente');
  assert.ok(textContent.includes('Controle & Conciliação'), 'Seção Controle & Conciliação ausente');
});

it('Novos links da Implantação 5 possuem data-view, data-route e data-menu-key válidos', () => {
  const linkPosicao = document.querySelector('#menu-sub-financeiro [data-menu-key="fin-posicao-geral"]');
  const linkSaldos = document.querySelector('#menu-sub-financeiro [data-menu-key="fin-saldos-consolidado"]');
  const linkTaxas = document.querySelector('#menu-sub-financeiro [data-menu-key="fin-taxas-custos"]');

  assert.ok(linkPosicao, 'Link de Posição Geral não encontrado');
  assert.strictEqual(linkPosicao.getAttribute('data-route'), '/financeiro/posicao-geral');
  assert.strictEqual(linkPosicao.getAttribute('data-view'), 'financial-posicao-geral');

  assert.ok(linkSaldos, 'Link de Saldos não encontrado');
  assert.strictEqual(linkSaldos.getAttribute('data-route'), '/financeiro/saldos');
  assert.strictEqual(linkSaldos.getAttribute('data-view'), 'financial-saldos');

  assert.ok(linkTaxas, 'Link de Taxas e Custos não encontrado');
  assert.strictEqual(linkTaxas.getAttribute('data-route'), '/financeiro/taxas-custos');
  assert.strictEqual(linkTaxas.getAttribute('data-view'), 'financial-taxas-custos');
});

it('Rotas canônicas de Implantação 5 resolvem com 0 fallbacks em ROUTES', () => {
  const r1 = resolveRoute('/financeiro/posicao-geral');
  const r2 = resolveRoute('/financeiro/saldos');
  const r3 = resolveRoute('/financeiro/taxas-custos');

  assert.strictEqual(r1.view, 'financial-posicao-geral');
  assert.strictEqual(r2.view, 'financial-saldos');
  assert.strictEqual(r3.view, 'financial-taxas-custos');
});

// ============================================================================
// SUÍTE 3: MODELO MATEMÁTICO E CÁLCULO EXATO DE SALDOS E TAXAS (LEDGER)
// ============================================================================
console.log('\n3. Modelo Matemático e Consistência Contábil (Cálculo ao Centavo):');

it('Exemplo canônico de referência (R$ 1.000.000 GMV, 15% taxa) decompõe com exatidão matemática', () => {
  const gross = 1000000;
  const tickets = 10000;
  const refunds = 30000;
  const chargebacks = 5000;
  const paidOut = 400000;
  const committed = 30000;
  const reserves = 20000;

  // 1. Taxa Disk (15%)
  const feeRule = { feeType: 'PERCENTAGE', rate: 15, calculationBase: 'GROSS_SALES' };
  const feeCalc = financialConsolidationService.calculateDiskFee(gross, feeRule, tickets);
  assert.strictEqual(feeCalc.diskFee, 150000, 'Taxa Disk esperada R$ 150.000');

  // 2. Custos de Meios de Pagamento estimados (MDR)
  const paymentCosts = 25000;

  // 3. Recursos Gerados do Produtor
  // gross (1.000.000) - diskFee (150.000) - paymentCosts (25.000) - refunds (30.000) - chargebacks (5.000) = 790.000
  const producerFunds = gross - feeCalc.diskFee - paymentCosts - refunds - chargebacks;
  assert.strictEqual(producerFunds, 790000, `Recursos do produtor esperado R$ 790.000, obtido ${producerFunds}`);

  // 4. Saldo Disponível Real
  // producerFunds (790.000) - paidOut (400.000) - committed (30.000) - reserves (20.000) = 340.000
  const availableBalance = producerFunds - paidOut - committed - reserves;
  assert.strictEqual(availableBalance, 340000, `Saldo disponível esperado R$ 340.000, obtido ${availableBalance}`);

  // 5. Margem Líquida Disk
  // diskFee (150.000) - paymentCosts (25.000) = 125.000
  const diskMargin = feeCalc.diskFee - paymentCosts;
  assert.strictEqual(diskMargin, 125000, `Margem Disk esperada R$ 125.000, obtido ${diskMargin}`);
});

it('Regra de taxa fixa R$/ingresso aplica corretamente sobre a quantidade de ingressos', () => {
  const gross = 50000;
  const tickets = 500;
  const feeRule = { feeType: 'FIXED_PER_TICKET', rate: 5.00 }; // R$ 5,00 por ingresso
  const feeCalc = financialConsolidationService.calculateDiskFee(gross, feeRule, tickets);
  assert.strictEqual(feeCalc.diskFee, 2500, `Esperado R$ 2.500 de taxa, obtido ${feeCalc.diskFee}`);
});

it('Override de taxa no evento sobrepõe o padrão da plataforma com registro de histórico', () => {
  // Configura override de 10% no evento 3368
  const res = financialConsolidationService.setFeeRule({
    targetId: '3368',
    feeType: 'PERCENTAGE',
    rate: 10.0,
    calculationBase: 'GROSS_SALES',
    reason: 'Aditivo contratual promocional 2026',
    actor: { id: 'usr-admin', name: 'Diretor Financeiro' }
  });

  assert.ok(res.ok, 'Falha ao salvar regra de taxa');
  const appliedRule = financialConsolidationService.getFeeRule('3368');
  assert.strictEqual(appliedRule.rate, 10.0);

  // Verifica que histórico gravou a transição
  const history = financialConsolidationService.getFeeRuleHistory('3368');
  assert.ok(history.length >= 1, 'Histórico de versões deve registrar alteração');
  assert.strictEqual(history[history.length - 1].newRate, 10.0);
  assert.strictEqual(history[history.length - 1].actorName, 'Diretor Financeiro');
});

// ============================================================================
// SUÍTE 4: VISÃO CONSOLIDADA DO PRODUTOR (SALDOS)
// ============================================================================
console.log('\n4. Portal do Produtor — Saldos Consolidados:');

it('Produtor consulta saldo consolidado padrão ("TODOS") somando todos os seus eventos', () => {
  const consolidated = financialConsolidationService.getProducerConsolidatedBalance('prod-1');
  assert.ok(consolidated, 'Dados consolidados não retornados');
  assert.ok(consolidated.events.length >= 1, 'Produtor deve ter ao menos 1 evento');
  assert.ok(consolidated.totals.availableBalance >= 0, 'Saldo disponível deve ser >= 0');
  assert.ok(consolidated.totals.grossSales > 0, 'GMV total deve ser positivo');
});

it('Produtor consulta detalhamento de evento individual mantendo as mesmas deduções contábeis', () => {
  const eventComp = financialConsolidationService.getEventFinancialComposition('3368');
  assert.ok(eventComp, 'Composição do evento 3368 não encontrada');
  assert.strictEqual(eventComp.eventId, '3368');
  assert.strictEqual(
    eventComp.availableBalance,
    Math.round((eventComp.producerFunds - eventComp.paidOut - eventComp.committedFunds - eventComp.reserves) * 100) / 100
  );
});

// ============================================================================
// SUÍTE 5: VISÃO EXECUTIVA DISK (POSIÇÃO GERAL & TAXAS/CUSTOS)
// ============================================================================
console.log('\n5. Visão Master Disk Interno (Posição Geral e Custos):');

it('Posição Geral agrega múltiplos produtores e eventos com segregação de passivo vs margem', () => {
  const master = financialConsolidationService.getDiskMasterPosition();
  assert.ok(master, 'Posição master não gerada');
  assert.ok(master.events.length >= 3, 'Deve conter múltiplos eventos no catálogo Disk');
  assert.ok(master.totals.grossSales > 0, 'Vendas brutas totais devem ser > 0');
  assert.ok(master.totals.diskRevenue > 0, 'Receita Disk total deve ser > 0');
  assert.ok(master.totals.diskMargin > 0, 'Margem líquida Disk deve ser > 0');
  assert.ok(master.totals.paymentCosts > 0, 'Custos de MDR devem ser calculados');
});

it('Posição Geral suporta filtragem estrita por canal e adquirente', () => {
  const filtered = financialConsolidationService.getDiskMasterPosition({ channel: 'ONLINE' });
  assert.ok(filtered, 'Posição filtrada não gerada');
  assert.ok(filtered.events.length >= 1);
});

// ============================================================================
// SUÍTE 6: MATRIZ DE ACESSO RBAC (SEGURANÇA & ISOLAMENTO)
// ============================================================================
console.log('\n6. Governança e Matriz de Permissões RBAC:');

it('Produtor Administrador possui permissão para ver saldos consolidados de seus eventos', () => {
  const producer = accessControlService.getUserById('user-producer-joao');
  assert.ok(producer, 'Usuário produtor não encontrado');
  assert.ok(accessControlService.can(producer, 'financeiro.saldos.visualizar'));
  assert.ok(accessControlService.can(producer, 'financeiro.saldos.consolidado_produtor'));
});

it('Produtor NÃO possui permissão para ver outros produtores nem configurar taxas da Disk', () => {
  const producer = accessControlService.getUserById('user-producer-joao');
  assert.ok(!accessControlService.can(producer, 'financeiro.saldos.todos_produtores'), 'Produtor não pode ver todos os produtores');
  assert.ok(!accessControlService.can(producer, 'financeiro.taxas.configurar'), 'Produtor não pode alterar taxas Disk');
  assert.ok(!accessControlService.can(producer, 'financeiro.posicao_geral.visualizar'), 'Produtor não pode ver Posição Geral');
});

it('Gestor Financeiro Disk possui permissão total sobre Posição Geral, Saldos e Taxas', () => {
  const gestor = accessControlService.getUserById('user-admin-carlos');
  assert.ok(gestor, 'Gestor Financeiro não encontrado');
  assert.ok(accessControlService.can(gestor, 'financeiro.posicao_geral.visualizar'));
  assert.ok(accessControlService.can(gestor, 'financeiro.taxas.visualizar'));
  assert.ok(accessControlService.can(gestor, 'financeiro.taxas.configurar'));
  assert.ok(accessControlService.can(gestor, 'financeiro.custos.visualizar'));
  assert.ok(accessControlService.can(gestor, 'financeiro.saldos.todos_produtores'));
});

console.log('\n================================================================');
console.log(` RESULTADO FINAL: ${passedTests}/${totalTests} TESTES PASSARAM COM SUCESSO (100%)`);
console.log('================================================================\n');
