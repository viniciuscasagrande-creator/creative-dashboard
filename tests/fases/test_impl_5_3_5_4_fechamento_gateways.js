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
import { gatewayFeeMatrixService, FEE_BEARERS, RULE_STATUSES, SETTLEMENT_STATUSES } from '../../src/services/gatewayFeeMatrixService.js';
import { financialConsolidationGateway } from '../../src/services/financialConsolidationGateway.js';
import { accessControlService } from '../../src/services/accessControlService.js';
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
  url: 'http://localhost/#/financeiro/fechamento'
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
// SUÍTE 3 (CONTINUAÇÃO): FEE BEARERS, HIERARQUIA, SNAPSHOT E GOVERNANÇA (5.4)
// ============================================================================

it('Motor de precificação simula corretamente quando a taxa é suportada pela DISK (absorção)', () => {
  gatewayFeeMatrixService.createRule({
    acquirer: 'Rede',
    brand: 'Mastercard',
    modality: 'DEBITO',
    channel: 'ONLINE',
    scope: 'GLOBAL',
    acquirerMdr: 1.10,
    commercialFee: 1.10,
    feeBearer: 'DISK',
    effectiveFrom: '2026-01-01',
    reason: 'Campanha taxa de débito absorvida pela plataforma'
  });

  const resDisk = gatewayFeeMatrixService.calculateTransactionPricing({
    amount: 1000.00,
    acquirer: 'Rede',
    brand: 'Mastercard',
    modality: 'DEBITO'
  });

  assert.strictEqual(resDisk.breakdown.feeBearer, 'DISK');
  assert.strictEqual(resDisk.breakdown.chargedFromCustomer, 0.00, 'Cliente não paga taxa extra');
  assert.strictEqual(resDisk.breakdown.totalCustomerPays, 1000.00, 'Cliente paga valor nominal');
  assert.strictEqual(resDisk.breakdown.netToProducer, 1000.00, 'Produtor recebe valor integral');
  assert.strictEqual(resDisk.breakdown.absorbedByDisk, 11.00, 'Disk absorve integralmente a taxa de R$ 11,00');
});

it('Motor de precificação simula taxa COMPARTILHADA (DIVIDIDO) com fechamento centavos exato', () => {
  gatewayFeeMatrixService.createRule({
    acquirer: 'Stone (POS/Bilheteria)',
    brand: 'Elo',
    modality: 'CREDITO_3X',
    channel: 'POS',
    scope: 'GLOBAL',
    acquirerMdr: 2.10,
    commercialFee: 3.20,
    feeBearer: 'DIVIDIDO',
    effectiveFrom: '2026-01-01',
    reason: 'Parceria compartilhada Stone'
  });

  const resSplit = gatewayFeeMatrixService.calculateTransactionPricing({
    amount: 1000.00,
    acquirer: 'Stone (POS/Bilheteria)',
    brand: 'Elo',
    modality: 'CREDITO_3X',
    channel: 'POS',
    splitProducerPercent: 37.5, // 1.20% de 3.20% = 37.5% -> R$ 12,00
    splitCustomerPercent: 62.5  // 2.00% de 3.20% = 62.5% -> R$ 20,00
  });

  assert.strictEqual(resSplit.commercialFeeAmount, 32.00, 'Taxa comercial total deve ser 32.00');
  assert.strictEqual(resSplit.breakdown.chargedFromCustomer, 20.00, 'Parcela do cliente deve ser 20.00');
  assert.strictEqual(resSplit.breakdown.totalCustomerPays, 1020.00, 'Total pago pelo cliente: 1020.00');
  assert.strictEqual(resSplit.breakdown.netToProducer, 988.00, 'Líquido do produtor: 1000 - 12 = 988.00');
  
  // Fechamento matemático obrigatório: (Cobrado Cliente) + (Descontado Produtor) == Taxa Comercial
  const mathSum = resSplit.breakdown.chargedFromCustomer + (1000.00 - resSplit.breakdown.netToProducer);
  assert.strictEqual(mathSum, resSplit.commercialFeeAmount, 'Fechamento matemático não bateu');
});

it('Hierarquia estrita das regras: Evento > Produtor > Global com identificação de ruleOrigin', () => {
  // 1. Regra Global Padrão
  gatewayFeeMatrixService.createRule({
    acquirer: 'PagBank',
    brand: 'Visa',
    modality: 'DEBITO',
    channel: 'ONLINE',
    scope: 'GLOBAL',
    acquirerMdr: 1.20,
    commercialFee: 1.80,
    feeBearer: 'CLIENTE_FINAL',
    effectiveFrom: '2026-01-01',
    reason: 'Regra Global PagBank'
  });

  // 2. Regra Específica do Produtor B
  gatewayFeeMatrixService.createRule({
    acquirer: 'PagBank',
    brand: 'Visa',
    modality: 'DEBITO',
    channel: 'ONLINE',
    scope: 'PRODUTOR',
    producerId: 'PROD-B',
    acquirerMdr: 1.20,
    commercialFee: 1.50,
    feeBearer: 'CLIENTE_FINAL',
    effectiveFrom: '2026-01-01',
    reason: 'Condição negociada Produtor B'
  });

  // 3. Regra Específica do Evento X do Produtor B
  gatewayFeeMatrixService.createRule({
    acquirer: 'PagBank',
    brand: 'Visa',
    modality: 'DEBITO',
    channel: 'ONLINE',
    scope: 'EVENTO',
    producerId: 'PROD-B',
    eventId: 'EVENTO-X',
    acquirerMdr: 1.20,
    commercialFee: 1.30,
    feeBearer: 'CLIENTE_FINAL',
    effectiveFrom: '2026-01-01',
    reason: 'Condição especial Evento X'
  });

  // A. Consulta no Evento X: prevalece a do Evento (1.30%)
  const matchEvent = gatewayFeeMatrixService.resolvePricingRule({
    acquirer: 'PagBank',
    brand: 'Visa',
    modality: 'DEBITO',
    producerId: 'PROD-B',
    eventId: 'EVENTO-X'
  });
  assert.strictEqual(matchEvent.commercialFee, 1.30, 'Deveria prevalecer a regra do Evento');
  assert.strictEqual(matchEvent.ruleOrigin, 'EVENTO', 'Origem deve ser EVENTO');

  // B. Consulta no Produtor B para outro evento: prevalece a do Produtor (1.50%)
  const matchProducer = gatewayFeeMatrixService.resolvePricingRule({
    acquirer: 'PagBank',
    brand: 'Visa',
    modality: 'DEBITO',
    producerId: 'PROD-B',
    eventId: 'OUTRO-EVENTO'
  });
  assert.strictEqual(matchProducer.commercialFee, 1.50, 'Deveria prevalecer a regra do Produtor');
  assert.strictEqual(matchProducer.ruleOrigin, 'PRODUTOR', 'Origem deve ser PRODUTOR');

  // C. Consulta para outro produtor: prevalece a Global (1.80%)
  const matchGlobal = gatewayFeeMatrixService.resolvePricingRule({
    acquirer: 'PagBank',
    brand: 'Visa',
    modality: 'DEBITO',
    producerId: 'PROD-C'
  });
  assert.strictEqual(matchGlobal.commercialFee, 1.80, 'Deveria herdar a regra Global');
  assert.strictEqual(matchGlobal.ruleOrigin, 'GLOBAL', 'Origem deve ser GLOBAL');
});

it('Snapshot da transação gera registro imutável com rastreabilidade completa e grava trilha de auditoria', () => {
  const snapshot = gatewayFeeMatrixService.createPaymentFeeSnapshot({
    transactionId: 'TX-PEDIDO-9988',
    orderId: 'PED-9988',
    eventId: '5096',
    producerId: 'PROD-101',
    amount: 500.00,
    acquirer: 'Cielo',
    brand: 'Visa',
    modality: 'CREDITO_3X',
    channel: 'ONLINE'
  });

  assert.ok(snapshot.snapshotId.startsWith('SNP-'), 'ID de snapshot inválido');
  assert.strictEqual(snapshot.transactionId, 'TX-PEDIDO-9988');
  assert.strictEqual(snapshot.amount, 500.00);
  assert.strictEqual(snapshot.acquirerCostMdr, 11.25, 'MDR de 2.25% sobre 500 deve ser 11.25');
  assert.strictEqual(snapshot.commercialFeeAmount, 16.00, 'Taxa comercial 3.20% sobre 500 deve ser 16.00');
  assert.strictEqual(snapshot.operationalSpreadAmount, 4.75, 'Spread 16.00 - 11.25 = 4.75');
  assert.strictEqual(snapshot.immutable, true, 'Snapshot deve ser explicitamente imutável');

  // Verificar gravação na trilha de auditoria
  const auditLogs = gatewayFeeMatrixService.getAuditLog({ action: 'SNAPSHOT_CRIADO' });
  assert.ok(auditLogs.length > 0, 'Evento de auditoria SNAPSHOT_CRIADO não encontrado');
  const foundLog = auditLogs.find(l => l.details && l.details.transactionId === 'TX-PEDIDO-9988');
  assert.ok(foundLog, 'Registro de auditoria para a transação não foi localizado');
});

it('Vigência e histórico: respeito rigoroso ao limite temporal (30/09/2026 vs 01/10/2026)', () => {
  // Criar regra com vigência inicial em janeiro de 2026
  const testRule = gatewayFeeMatrixService.createRule({
    acquirer: 'Cielo',
    brand: 'Elo',
    modality: 'CREDITO_1X',
    channel: 'ONLINE',
    scope: 'GLOBAL',
    acquirerMdr: 1.50,
    commercialFee: 2.20,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-01-01',
    reason: 'Taxa Q1-Q3 2026'
  });

  // Adicionar vigência que começa rigorosamente em 01/10/2026
  gatewayFeeMatrixService.addNewVigency({
    ruleId: testRule.id,
    acquirerMdr: 1.80,
    commercialFee: 2.60,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-10-01T00:00:00Z',
    actorName: 'Gestor Comercial',
    reason: 'Reajuste Q4 2026'
  });

  // Venda realizada em 30/09/2026 23:59:59 deve usar a taxa anterior (1.50% / 2.20%)
  const ruleBefore = gatewayFeeMatrixService.resolvePricingRule({
    acquirer: 'Cielo',
    brand: 'Elo',
    modality: 'CREDITO_1X',
    atDate: '2026-09-30T23:59:59Z'
  });
  assert.strictEqual(ruleBefore.acquirerMdr, 1.50, 'Em 30/09 deve vigorar a taxa antiga 1.50%');
  assert.strictEqual(ruleBefore.commercialFee, 2.20, 'Em 30/09 deve vigorar a taxa antiga 2.20%');

  // Venda realizada em 01/10/2026 00:00:00 deve usar a nova taxa (1.80% / 2.60%)
  const ruleAfter = gatewayFeeMatrixService.resolvePricingRule({
    acquirer: 'Cielo',
    brand: 'Elo',
    modality: 'CREDITO_1X',
    atDate: '2026-10-01T00:00:00Z'
  });
  assert.strictEqual(ruleAfter.acquirerMdr, 1.80, 'Em 01/10 deve vigorar a nova taxa 1.80%');
  assert.strictEqual(ruleAfter.commercialFee, 2.60, 'Em 01/10 deve vigorar a nova taxa 2.60%');
});

it('Governança de regras: ciclo de aprovação formal (RASCUNHO -> PENDENTE_APROVACAO -> ATIVA / REPROVADO)', () => {
  // 1. Criar regra em Rascunho
  const draftRule = gatewayFeeMatrixService.createRule({
    acquirer: 'Rede',
    brand: 'Hipercard',
    modality: 'CREDITO_1X',
    acquirerMdr: 1.60,
    commercialFee: 2.40,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-11-01',
    status: RULE_STATUSES.RASCUNHO,
    reason: 'Proposta preliminar'
  });
  assert.strictEqual(draftRule.status, 'RASCUNHO');

  // 2. Submeter para aprovação
  const submitted = gatewayFeeMatrixService.submitRuleForApproval(draftRule.id, 'Analista Contábil', 'Submissão formal');
  assert.strictEqual(submitted.status, 'PENDENTE_APROVACAO');

  // 3. Aprovação pela Diretoria/Gestão
  const approved = gatewayFeeMatrixService.approveRule(draftRule.id, 'Diretor Financeiro', 'Aprovado conforme alçada');
  assert.strictEqual(approved.status, 'ATIVA');
  assert.ok(approved.approvedBy.includes('Diretor Financeiro'));

  // 4. Fluxo de Reprovação
  const draftRule2 = gatewayFeeMatrixService.createRule({
    acquirer: 'Rede',
    brand: 'Hipercard',
    modality: 'CREDITO_2X',
    acquirerMdr: 2.00,
    commercialFee: 2.10, // Margem muito baixa
    feeBearer: 'PRODUTOR',
    status: RULE_STATUSES.RASCUNHO,
    reason: 'Proposta de margem baixa'
  });
  gatewayFeeMatrixService.submitRuleForApproval(draftRule2.id, 'Analista', 'Envio para análise');
  const rejected = gatewayFeeMatrixService.rejectRule(draftRule2.id, 'Diretor Financeiro', 'Spread insuficiente para cobrir float');
  assert.strictEqual(rejected.status, 'REPROVADO');
});

it('Liquidações Previsto × Real detecta divergência exata de MDR e permite conciliação formal', () => {
  // Transação de referência: Cielo R$ 1.000,00, Previsto R$ 22,50, Real R$ 22,73, Diferença R$ 0,23
  const settlements = gatewayFeeMatrixService.getSettlements({ acquirer: 'Cielo' });
  assert.ok(settlements.length > 0, 'Nenhuma liquidação da Cielo encontrada');

  const targetTx = settlements.find(s => s.transactionId === 'TX-2026-001');
  assert.ok(targetTx, 'Transação TX-2026-001 não localizada');
  assert.strictEqual(targetTx.estimatedMdr, 22.50, 'MDR previsto deve ser 22.50');
  assert.strictEqual(targetTx.actualMdr, 22.73, 'MDR real deve ser 22.73');
  assert.strictEqual(targetTx.differenceMdr, 0.23, 'Divergência deve ser de R$ 0,23');
  assert.strictEqual(targetTx.status, SETTLEMENT_STATUSES.DIVERGENCIA_MDR.key || 'DIVERGENCIA_MDR', 'Status deve ser DIVERGENCIA_MDR');

  // Realizar conciliação/tratativa da divergência
  const reconciled = gatewayFeeMatrixService.reconcileSettlement(
    'TX-2026-001',
    'CONCILIADO',
    'Diferença de R$ 0,23 assimilada como tarifa de mensageria da adquirente',
    'Auditor Contábil'
  );

  assert.strictEqual(reconciled.status, 'CONCILIADO', 'Status após conciliação deve ser CONCILIADO');
  assert.strictEqual(reconciled.reconciledBy, 'Auditor Contábil');
  assert.ok(reconciled.reconciledAt, 'Data de conciliação deve ser registrada');

  // Trilha de auditoria deve conter o evento
  const auditLogs = gatewayFeeMatrixService.getAuditLog({ action: 'LIQUIDACAO_CONCILIADA' });
  const log = auditLogs.find(l => l.details && l.details.transactionId === 'TX-2026-001');
  assert.ok(log, 'Auditoria de conciliação de liquidação não encontrada');
});

// ============================================================================
// SUÍTE 4: ROTAS, NAVEGAÇÃO, CONTROLE DE ACESSO E INTEGRIDADE DA SIDEBAR
// ============================================================================
console.log('\n4. Rotas, Navegação e Controle de Acesso Estrito:');

it('Rota /financeiro/fechamento resolve estritamente com view financial-fechamento', () => {
  const resolved = resolveRoute('/financeiro/fechamento');
  assert.ok(resolved, 'Rota /financeiro/fechamento não resolve');
  assert.strictEqual(resolved.view, 'financial-fechamento');
  assert.strictEqual(resolved.menuKey, 'fin-fechamento');
});

it('Rota /financeiro/gateways-adquirentes resolve estritamente com view financial-gateways-adquirentes para Administrador', () => {
  global.window.currentRole = 'ADMINISTRADOR';
  global.window.isProducerRole = false;

  const resolved = resolveRoute('/financeiro/gateways-adquirentes');
  assert.ok(resolved, 'Rota /financeiro/gateways-adquirentes não resolve');
  assert.strictEqual(resolved.view, 'financial-gateways-adquirentes');
  assert.strictEqual(resolved.menuKey, 'fin-gateways-adquirentes');
});

it('Segregação inviolável: Produtor NÃO tem permissão de visualizar Gateways/Adquirentes', () => {
  // Testar matriz de permissões do RBAC
  assert.strictEqual(accessControlService.canAccessGateways({ role: 'PRODUTOR_ADMINISTRADOR' }), false);
  assert.strictEqual(accessControlService.canAccessGateways({ role: 'PRODUTOR_OPERACIONAL' }), false);
  assert.strictEqual(accessControlService.canAccessGateways({ role: 'PRODUTOR_VISUALIZADOR' }), false);
  
  // Testar permissões de perfis internos
  assert.strictEqual(accessControlService.canAccessGateways({ role: 'ADMINISTRADOR' }), true);
  assert.strictEqual(accessControlService.canAccessGateways({ role: 'GESTOR_FINANCEIRO' }), true);
  assert.strictEqual(accessControlService.canAccessGateways({ role: 'FINANCEIRO' }), true);
});

it('Segregação inviolável: Tentativa de navegação direta de Produtor para /financeiro/gateways-adquirentes redireciona para /acesso-negado', () => {
  // Simular usuário com perfil de produtor no ambiente de navegação
  global.window.currentRole = 'PRODUTOR';
  global.window.isProducerRole = true;

  const resolved = resolveRoute('/financeiro/gateways-adquirentes');
  assert.strictEqual(resolved.path, '/acesso-negado', 'Deveria redirecionar para /acesso-negado');
  assert.strictEqual(resolved.view, 'access-denied', 'View deve ser access-denied');

  // Restaurar role para Administrador
  global.window.currentRole = 'ADMINISTRADOR';
  global.window.isProducerRole = false;
});

it('index.html contém as 6 abas canônicas e tabelas analíticas de Liquidações e Auditoria', () => {
  const secGw = document.getElementById('view-financial-gateways-adquirentes');
  assert.ok(secGw, 'Seção #view-financial-gateways-adquirentes ausente em index.html');

  // Abas 1 a 6
  assert.ok(document.getElementById('tab-gw-visao-geral'), 'Aba 1 (Visão Geral) ausente');
  assert.ok(document.getElementById('tab-gw-operadoras'), 'Aba 2 (Operadoras) ausente');
  assert.ok(document.getElementById('tab-gw-bandeiras'), 'Aba 3 (Bandeiras e Taxas) ausente');
  assert.ok(document.getElementById('tab-gw-comercial'), 'Aba 4 (Regras Comerciais) ausente');
  assert.ok(document.getElementById('tab-gw-liquidacoes'), 'Aba 5 (Liquidações) ausente');
  assert.ok(document.getElementById('tab-gw-historico'), 'Aba 6 (Histórico & Auditoria) ausente');

  // Panes e tabelas
  assert.ok(document.getElementById('pane-gw-liquidacoes'), 'Painel de liquidações ausente');
  assert.ok(document.getElementById('gw-liquidacoes-tbody'), 'Tabela de liquidações ausente');
  assert.ok(document.getElementById('pane-gw-historico'), 'Painel de histórico ausente');
  assert.ok(document.getElementById('gw-audit-tbody'), 'Tabela de auditoria ausente');

  // Modais de ação
  assert.ok(document.getElementById('btn-gw-open-acquirer-modal'), 'Botão #btn-gw-open-acquirer-modal ausente');
  assert.ok(document.getElementById('btn-gw-open-rule-modal'), 'Botão #btn-gw-open-rule-modal ausente');
  assert.ok(document.getElementById('modal-gw-new-acquirer'), 'Modal #modal-gw-new-acquirer ausente');
  assert.ok(document.getElementById('modal-gw-new-rule'), 'Modal #modal-gw-new-rule ausente');
});

it('O número de .submenu-link no menu Financeiro permanece estritamente em 50 para conformidade com a Fase 28.15.3', () => {
  const finLinks = Array.from(document.querySelectorAll('#main-sidebar-nav [data-menu-group="financeiro"] .submenu-link'));
  assert.strictEqual(finLinks.length, 50, `Esperado estritamente 50 .submenu-link, encontrados ${finLinks.length}`);
});

console.log('\n================================================================');
console.log(` RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS (100%)`);
console.log('================================================================\n');
