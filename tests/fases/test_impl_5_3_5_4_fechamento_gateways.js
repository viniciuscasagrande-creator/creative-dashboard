/**
 * ============================================================================
 * SUÍTE DE TESTES E2E / INTEGRAÇÃO — IMPLANTAÇÃO 5.2, 5.3 & 5.4
 * Fechamento Financeiro Real por Evento, Matriz de Gateways & Adquirentes,
 * Vigências Versionadas e Rastreabilidade do Fluxo do Dinheiro
 * tests/fases/test_impl_5_3_5_4_fechamento_gateways.js
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import assert from 'assert';

import { financialClosingService, CLOSING_STATUSES } from '../../src/services/financialClosingService.js';
import { gatewayFeeMatrixService, FEE_BEARERS } from '../../src/services/gatewayFeeMatrixService.js';
import { financialConsolidationGateway } from '../../src/services/financialConsolidationGateway.js';
import { resolveRoute, ROUTES } from '../../src/navigation/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('================================================================');
console.log(' INICIANDO TESTES: IMPLANTAÇÃO 5.2, 5.3 & 5.4');
console.log(' Fechamento Financeiro, Gateways, Adquirentes e Vigências');
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
  url: 'http://localhost/#/financeiro/fechamento',
  runScripts: 'dangerously'
});

global.window = dom.window;
global.document = dom.window.document;

// ============================================================================
// SUÍTE 1: GATEWAY REST OFICIAL (IMPLANTAÇÃO 5.2)
// ============================================================================
console.log('1. Gateway Oficial de Consolidação REST (Implantação 5.2):');

it('financialConsolidationGateway expõe todos os contratos REST esperados', () => {
  assert.strictEqual(typeof financialConsolidationGateway.getPosition, 'function');
  assert.strictEqual(typeof financialConsolidationGateway.getEvents, 'function');
  assert.strictEqual(typeof financialConsolidationGateway.getLedgerSummary, 'function');
  assert.strictEqual(typeof financialConsolidationGateway.getFeeRules, 'function');
  assert.strictEqual(typeof financialConsolidationGateway.createFeeRule, 'function');
  assert.strictEqual(typeof financialConsolidationGateway.getAcquirerSettlements, 'function');
  assert.strictEqual(typeof financialConsolidationGateway.getAcquirerContracts, 'function');
  assert.strictEqual(typeof financialConsolidationGateway.getRefunds, 'function');
  assert.strictEqual(typeof financialConsolidationGateway.getChargebacks, 'function');
  assert.strictEqual(typeof financialConsolidationGateway.getPayoutSettlements, 'function');
});

// ============================================================================
// SUÍTE 2: FECHAMENTO FINANCEIRO POR EVENTO (IMPLANTAÇÃO 5.3)
// ============================================================================
console.log('\n2. Fechamento Financeiro Real por Evento (Implantação 5.3):');

it('Caso de referência do relatório reflete rigorosamente: 476 vendidos + 38 cortesias = 514 ingressos e R$ 50.960,00 GMV', () => {
  const closing = financialClosingService.getClosingByEventId('5096');
  assert.ok(closing, 'Fechamento do evento 5096 não encontrado');

  assert.strictEqual(closing.tickets.sold, 476, 'Ingressos vendidos deve ser 476');
  assert.strictEqual(closing.tickets.complimentary, 38, 'Cortesias deve ser 38');
  assert.strictEqual(closing.tickets.total, 514, 'Total de ingressos deve ser 514 (476 + 38)');
  assert.strictEqual(closing.financials.grossSales, 50960.00, 'Volume bruto deve ser R$ 50.960,00');
});

it('Formas de pagamento discriminam PIX R$ 21.960,00 e detalham adquirentes e conciliação', () => {
  const closing = financialClosingService.getClosingByEventId('5096');
  const pix = closing.payments.find(p => p.method.includes('PIX'));
  assert.ok(pix, 'PIX não encontrado');
  assert.strictEqual(pix.grossAmount, 21960.00, 'PIX deve totalizar R$ 21.960,00');
  assert.strictEqual(pix.acquirer, 'Cielo', 'Adquirente do PIX deve ser Cielo');
  assert.strictEqual(pix.reconciled, true, 'PIX deve estar conciliado');
});

it('Fórmula contábil preserva as três separações invioláveis (GMV != Saldo, Estorno != Chargeback)', () => {
  const closing = financialClosingService.getClosingByEventId('5096');
  const f = closing.financials;

  // Base ajustada: Vendas - Estornos - Chargebacks
  const expectedAdjusted = f.grossSales - f.refunds - f.chargebacks;
  assert.strictEqual(f.adjustedBase, expectedAdjusted, 'Base ajustada inconsistente');

  // Taxa Disk calculada pelo contrato (10% sobre bruto = 5.096,00)
  assert.strictEqual(f.diskFeeAmount, 5096.00, 'Taxa Disk deve ser R$ 5.096,00');

  // MDR / Adquirência retido
  assert.strictEqual(f.acquiringCosts, 1135.80, 'Custos de adquirência deve ser R$ 1.135,80');

  // Líquido do Produtor = GMV - Taxa Disk - MDR - Estornos
  const expectedNet = Math.round((f.grossSales - f.diskFeeAmount - f.acquiringCosts - f.refunds) * 100) / 100;
  assert.strictEqual(f.producerNetRevenue, expectedNet, 'Líquido do produtor diverge do cálculo contábil');

  // Saldo Pendente a Repassar = Líquido - Repasses Já Liquidados
  const expectedPending = Math.round((f.producerNetRevenue - f.paidPayouts) * 100) / 100;
  assert.strictEqual(f.pendingPayoutBalance, expectedPending, 'Saldo pendente a repassar diverge');
});

it('Workflow de status avança e registra auditoria versionada com aprovação Disk e aceite do Produtor', () => {
  const closing = financialClosingService.getClosingByEventId('5096');
  const initialVersion = closing.version;

  // Aprovação pelo Financeiro Disk
  financialClosingService.approveByDisk(closing.closingId, 'Carlos Lima (Financeiro)', 'Homologado na auditoria');
  assert.strictEqual(closing.approvals.diskApproved, true);
  assert.strictEqual(closing.version, initialVersion + 1);

  // Ciência e Aceite do Produtor
  financialClosingService.acceptByProducer(closing.closingId, 'Marcos Vinicius (Produtor)', 'Ciência confirmada');
  assert.strictEqual(closing.approvals.producerAccepted, true);
  assert.strictEqual(closing.status, 'FECHADO', 'Com ambas as aprovações, status deve ser FECHADO');
});

it('generateClosingReportData() estrutura todos os dados para emissão do PDF oficial', () => {
  const closing = financialClosingService.getClosingByEventId('5096');
  const pdfData = financialClosingService.generateClosingReportData(closing.closingId);

  assert.ok(pdfData.title, 'Título do relatório ausente');
  assert.ok(pdfData.indicators.grossSales, 'Vendas brutas ausente no PDF');
  assert.strictEqual(pdfData.tickets.sold, 476);
  assert.strictEqual(pdfData.tickets.complimentary, 38);
  assert.ok(pdfData.payments.length > 0, 'Pagamentos ausentes no PDF');
  assert.ok(pdfData.acquirers.length > 0, 'Adquirentes ausentes no PDF');
  assert.ok(pdfData.payouts.length > 0, 'Repasses ausentes no PDF');
});

// ============================================================================
// SUÍTE 3: GATEWAYS, ADQUIRENTES, BANDEIRAS E REGRAS COMERCIAIS (IMPLANTAÇÃO 5.4)
// ============================================================================
console.log('\n3. Gateways, Adquirentes e Matriz de Taxas (Implantação 5.4):');

it('Adquirentes oficiais homologadas estão catalogadas (Cielo, Rede, Stone, PagBank)', () => {
  const acquirers = gatewayFeeMatrixService.getAcquirers();
  assert.strictEqual(acquirers.length, 4);
  const names = acquirers.map(a => a.name.toLowerCase());
  assert.ok(names.includes('cielo'));
  assert.ok(names.includes('rede'));
  assert.ok(names.includes('stone (pos/bilheteria)'));
  assert.ok(names.includes('pagbank'));
});

it('Separação obrigatória: Custo Disk (MDR) vs Taxa Comercial vs Margem/Spread', () => {
  // Cielo Visa Crédito 3x: Custo Disk = 2.25%, Comercial = 3.20%, Spread = 0.95%
  const rule = gatewayFeeMatrixService.resolvePricingRule({
    acquirer: 'Cielo',
    brand: 'Visa',
    modality: 'CREDITO_3X'
  });

  assert.ok(rule, 'Regra não resolvida');
  assert.strictEqual(rule.acquirerMdr, 2.25, 'Custo Disk deve ser 2.25%');
  assert.strictEqual(rule.commercialFee, 3.20, 'Taxa comercial deve ser 3.20%');
  assert.strictEqual(rule.operationalSpread, 0.95, 'Spread deve ser 0.95% (3.20 - 2.25)');
  assert.strictEqual(rule.feeBearer, 'CLIENTE_FINAL', 'Responsável pela taxa deve ser CLIENTE_FINAL');
});

it('Motor de precificação simula corretamente quando a taxa é suportada pelo CLIENTE_FINAL no checkout', () => {
  const result = gatewayFeeMatrixService.calculateTransactionPricing({
    amount: 1000.00,
    acquirer: 'Cielo',
    brand: 'Visa',
    modality: 'CREDITO_3X'
  });

  assert.strictEqual(result.amount, 1000.00);
  assert.strictEqual(result.acquirerCostMdr, 22.50, 'MDR de 2.25% sobre 1000 deve ser 22.50');
  assert.strictEqual(result.commercialFeeAmount, 32.00, 'Taxa comercial de 3.20% sobre 1000 deve ser 32.00');
  assert.strictEqual(result.operationalSpreadAmount, 9.50, 'Spread deve ser 9.50 (32.00 - 22.50)');

  // Como é cobrado do cliente, o cliente paga 1000 + 32 = 1032 e o produtor recebe 1000
  assert.strictEqual(result.breakdown.chargedFromCustomer, 32.00);
  assert.strictEqual(result.breakdown.totalCustomerPays, 1032.00);
  assert.strictEqual(result.breakdown.netToProducer, 1000.00);
});

it('Motor de precificação simula corretamente quando a taxa é suportada pelo PRODUTOR', () => {
  const result = gatewayFeeMatrixService.calculateTransactionPricing({
    amount: 1000.00,
    acquirer: 'Cielo',
    brand: 'Visa',
    modality: 'CREDITO_1X' // Pela matriz padrão, 1x é suportado pelo PRODUTOR
  });

  // Comercial = 2.50%, cobrado do produtor
  assert.strictEqual(result.breakdown.feeBearer, 'PRODUTOR');
  assert.strictEqual(result.breakdown.chargedFromCustomer, 0.00);
  assert.strictEqual(result.breakdown.totalCustomerPays, 1000.00);
  assert.strictEqual(result.breakdown.netToProducer, 975.00, 'Produtor deve receber 1000 - 25 = 975.00');
});

it('Nova vigência versionada nunca sobrescreve histórico de taxas passadas', () => {
  const rules = gatewayFeeMatrixService.getRules({ acquirer: 'Cielo' });
  const target = rules.find(r => r.modality === 'CREDITO_1X');
  assert.ok(target, 'Regra alvo não encontrada');

  const prevVersion = target.version;
  const prevMdr = target.acquirerMdr;

  gatewayFeeMatrixService.addNewVigency({
    ruleId: target.id,
    acquirerMdr: 1.95,
    commercialFee: 2.70,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-10-01',
    actorName: 'Auditor Contábil',
    reason: 'Reajuste contratual outubro'
  });

  assert.strictEqual(target.version, prevVersion + 1, 'Versão deve ser incrementada');
  assert.strictEqual(target.acquirerMdr, 1.95, 'Novo MDR deve ser 1.95');
  assert.strictEqual(target.history.length > 1, true, 'Histórico deve preservar a vigência anterior');
  assert.strictEqual(target.history[0].acquirerMdr, prevMdr, 'Vigência anterior deve guardar 1.79');
});

it('Criação dinâmica de nova operadora/adquirente cataloga corretamente no motor', () => {
  const newAcq = gatewayFeeMatrixService.createAcquirer({
    name: 'SafraPay Intermediações',
    settlementDays: 'D+14 (Crédito)',
    status: 'ATIVO'
  });

  assert.ok(newAcq.id, 'ID não gerado');
  const allAcquirers = gatewayFeeMatrixService.getAcquirers();
  const found = allAcquirers.find(a => a.name.includes('SafraPay'));
  assert.ok(found, 'Nova adquirente não encontrada no catálogo');
  assert.strictEqual(found.settlementDays, 'D+14 (Crédito)');
});

it('Criação dinâmica de nova bandeira/modalidade/taxa entra com versão 1.0 e vigência ativa', () => {
  const createdRule = gatewayFeeMatrixService.createRule({
    acquirer: 'SafraPay Intermediações',
    brand: 'Mastercard',
    modality: 'CREDITO_2X',
    channel: 'ONLINE',
    scope: 'GLOBAL',
    acquirerMdr: 1.85,
    fixedCost: 0.10,
    commercialFee: 2.80,
    feeBearer: 'CLIENTE_FINAL',
    effectiveFrom: '2026-09-01',
    reason: 'Acordo comercial SafraPay'
  });

  assert.ok(createdRule.id.startsWith('RULE-'), 'ID de regra fora do padrão');
  assert.strictEqual(createdRule.version, 1);
  assert.strictEqual(createdRule.active, true);
  assert.strictEqual(createdRule.history.length, 1);

  // Resolução da nova regra
  const resolved = gatewayFeeMatrixService.resolvePricingRule({
    acquirer: 'SafraPay Intermediações',
    brand: 'Mastercard',
    modality: 'CREDITO_2X'
  });
  assert.ok(resolved, 'Regra recém-criada não foi resolvida');
  assert.strictEqual(resolved.acquirerMdr, 1.85);
  assert.strictEqual(resolved.commercialFee, 2.80);
  assert.strictEqual(resolved.operationalSpread, 0.95);
});

// ============================================================================
// SUÍTE 4: ROTAS, NAVEGAÇÃO E REGRAS DE INTEGRIDADE DA SIDEBAR
// ============================================================================
console.log('\n4. Rotas e Integridade da Sidebar:');

it('Rota /financeiro/fechamento resolve estritamente com view financial-fechamento', () => {
  const resolved = resolveRoute('/financeiro/fechamento');
  assert.ok(resolved, 'Rota /financeiro/fechamento não resolve');
  assert.strictEqual(resolved.view, 'financial-fechamento');
  assert.strictEqual(resolved.menuKey, 'fin-fechamento');
});

it('Rota /financeiro/gateways-adquirentes resolve estritamente com view financial-gateways-adquirentes', () => {
  const resolved = resolveRoute('/financeiro/gateways-adquirentes');
  assert.ok(resolved, 'Rota /financeiro/gateways-adquirentes não resolve');
  assert.strictEqual(resolved.view, 'financial-gateways-adquirentes');
  assert.strictEqual(resolved.menuKey, 'fin-gateways-adquirentes');
});

it('index.html contém as seções de view e os modais/botões de Adicionar Adquirente e Nova Bandeira/Taxa', () => {
  const secClosing = document.getElementById('view-financial-fechamento');
  assert.ok(secClosing, 'Seção #view-financial-fechamento ausente em index.html');

  const secGw = document.getElementById('view-financial-gateways-adquirentes');
  assert.ok(secGw, 'Seção #view-financial-gateways-adquirentes ausente em index.html');

  const btnOpenAcq = document.getElementById('btn-gw-open-acquirer-modal');
  assert.ok(btnOpenAcq, 'Botão #btn-gw-open-acquirer-modal ausente');

  const btnOpenRule = document.getElementById('btn-gw-open-rule-modal');
  assert.ok(btnOpenRule, 'Botão #btn-gw-open-rule-modal ausente');

  const modalAcq = document.getElementById('modal-gw-new-acquirer');
  assert.ok(modalAcq, 'Modal #modal-gw-new-acquirer ausente');

  const modalRule = document.getElementById('modal-gw-new-rule');
  assert.ok(modalRule, 'Modal #modal-gw-new-rule ausente');
});

it('O número de .submenu-link no menu Financeiro permanece estritamente em 50 para conformidade com a Fase 28.15.3', () => {
  const finLinks = Array.from(document.querySelectorAll('#main-sidebar-nav [data-menu-group="financeiro"] .submenu-link'));
  assert.strictEqual(finLinks.length, 50, `Esperado estritamente 50 .submenu-link, encontrados ${finLinks.length}`);
});

console.log('\n================================================================');
console.log(` RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS (100%)`);
console.log('================================================================\n');
