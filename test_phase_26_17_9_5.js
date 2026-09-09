/**
 * Testes Automatizados de Verificação: Fases 26.17.9.5.1, 26.17.9.5.2, 26.17.9.5.3 e 26.17.9.5.4
 */
import assert from 'node:assert';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { calculateEventAvailableBalance } from './src/services/eventBalanceService.js';
import { balanceTransferService } from './src/services/balanceTransferService.js';
import { eventBalanceService } from './src/services/eventBalanceService.js';

console.log('--- INICIANDO BATERIA DE TESTES: GESTÃO DE SALDOS ENTERPRISE ---');

// 1. Teste de DOM e Estrutura do index.html
console.log('\n[TESTE 1] Verificando integridade do HTML...');
const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html);
const doc = dom.window.document;

// Menu Financeiro -> Gestão de Saldos
const menuLink = doc.querySelector('a[data-view="financial-event-transfers"]');
assert(menuLink, 'Link "Gestão de Saldos" deve existir no menu');
assert(menuLink.textContent.includes('Gestão de Saldos'), 'Texto deve conter Gestão de Saldos');
console.log('✓ Menu "Gestão de Saldos" presente no accordion Financeiro.');

// Container da view
const viewSection = doc.getElementById('view-financial-event-transfers');
assert(viewSection, 'Seção #view-financial-event-transfers deve existir');
console.log('✓ Seção #view-financial-event-transfers renderizada no DOM.');

// 8 KPIs Cards Principais
const kpis = [
  'ft-kpi-total-balance',
  'ft-kpi-available-balance',
  'ft-kpi-committed-balance',
  'ft-kpi-blocked-balance',
  'ft-kpi-pending-settlement',
  'ft-kpi-scheduled-payouts',
  'ft-kpi-reconciliation',
  'ft-kpi-divergences'
];
kpis.forEach(id => {
  assert(doc.getElementById(id), `Elemento de KPI #${id} deve existir`);
});
console.log('✓ Todos os 8 KPIs oficiais estão presentes na tela.');

// Elementos do Dashboard Executivo (Fase 26.17.9.5.4)
const execElements = [
  'ft-pane-dashboard',
  'ft-op-transfers-count',
  'ft-op-transferred-amount',
  'ft-op-pending-approvals',
  'ft-op-reversals-count',
  'ft-op-active-reservations',
  'ft-ratio-avail-pct',
  'ft-ratio-comm-pct',
  'ft-ratio-block-pct',
  'bar-comp-avail',
  'bar-comp-comm',
  'bar-comp-block',
  'ft-dash-alerts-container'
];
execElements.forEach(id => {
  assert(doc.getElementById(id), `Elemento Executivo #${id} deve existir`);
});
console.log('✓ Elementos do Dashboard Executivo (Fase 26.17.9.5.4) validados no DOM.');

// 2. Testes Unitários da Fórmula Oficial de Saldo Disponível (Fase 26.17.9.5.1)
console.log('\n[TESTE 2] Testando Fórmula Oficial de Saldo Disponível...');
const resA = calculateEventAvailableBalance({
  settledAmount: 10000,
  scheduledPayouts: 1000,
  chargebacks: 500
});
assert.strictEqual(resA.settledBase, 10000);
assert.strictEqual(resA.committed, 1000);
assert.strictEqual(resA.blocked, 500);
assert.strictEqual(resA.available, 8500);
assert.strictEqual(resA.isBalanced, true);
assert.strictEqual(resA.difference, 0);
console.log('✓ Cenário A: Saldo disponível 8.500,00 calculado corretamente com 100% de integridade.');

const resB = calculateEventAvailableBalance({
  settledAmount: 1000,
  scheduledPayouts: 800,
  chargebacks: 600
});
assert.strictEqual(resB.available, 0, 'Disponível não pode ser negativo');
assert.strictEqual(resB.deficit, 400, 'Déficit deve registrar o excesso de bloqueio/comprometimento');
console.log('✓ Cenário B: max(0, ...) respeitado sem saldo disponível negativo.');

// 3. Teste de Reserva de Saldo e Workflow de Aprovação (Fase 26.17.9.5.2)
console.log('\n[TESTE 3] Testando Reserva de Saldo e Workflow de Aprovação (Fase 26.17.9.5.2)...');
await eventBalanceService.getEventsBalances('prod-1');

// Transferência com valor de alçada elevada (> R$ 20.000)
// Vamos adicionar saldo temporário no evento 3368 para testar a alçada
eventBalanceService.updateLocalEventBalance('3368', 35000);
const availBeforeReq = (await eventBalanceService.getEventBalance('3368')).data.balances.availableBalance;

const transferHigh = await balanceTransferService.executeTransfer({
  sourceEventId: '3368',
  targetEventId: '3178',
  amount: 26000,
  reason: 'Adiantamento de grande porte para montagem de infraestrutura',
  producerId: 'prod-1',
  actor: 'Solicitante Produtor'
});

assert.strictEqual(transferHigh.status, 'EM_APROVACAO', 'Valor acima de 25k deve ficar EM_APROVACAO');

// Verificar que o saldo foi reservado e deduzido do disponível utilizável
const availAfterReq = (await eventBalanceService.getEventBalance('3368')).data.balances.availableBalance;
assert.strictEqual(Number((availBeforeReq - availAfterReq).toFixed(2)), 26000, 'Saldo disponível deve refletir a dedução da reserva');
console.log('✓ Saldo caucionado cautelarmente via TRANSFERENCIA_RESERVA durante aprovação.');

// Validar que solicitante NÃO pode aprovar a própria transferência
let selfApproveFailed = false;
try {
  await balanceTransferService.approveTransfer(transferHigh.id, 'Solicitante Produtor');
} catch (e) {
  selfApproveFailed = true;
  assert(e.message.includes('Violação de Alçada'), 'Deve acusar segregação de funções');
}
assert.strictEqual(selfApproveFailed, true);
console.log('✓ Bloqueio de auto-aprovação respeitado (solicitante !== aprovador).');

// Aprovação legítima por outro aprovador
const approved = await balanceTransferService.approveTransfer(transferHigh.id, 'Diretor Financeiro', 'Aprovado conforme contrato');
assert.strictEqual(approved.status, 'CONCLUIDA');
console.log('✓ Transferência aprovada por autoridade competente e consolidada.');

// 4. Teste de Linha do Tempo Append-Only e Histórico (Fase 26.17.9.5.3)
console.log('\n[TESTE 4] Testando Timeline Append-Only e Auditoria de Estornos...');
const timeline = await balanceTransferService.getTransferTimeline(transferHigh.id);
assert(timeline.ok && Array.isArray(timeline.data));
assert(timeline.data.length >= 2, 'Timeline deve possuir múltiplos eventos encadeados');
console.log(`✓ Timeline auditada com ${timeline.data.length} eventos históricos registrados.`);

// 5. Teste de Bloqueio de Estorno se Saldo For Insuficiente no Destino (RN09 / Fase 26.17.9.5.3)
console.log('\n[TESTE 5] Testando Bloqueio de Estorno (ESTORNO_BLOQUEADO_SALDO)...');
// Simular que o evento de destino consumiu seu saldo
const targetEv = (await eventBalanceService.getEventBalance('3178')).data;
eventBalanceService.updateLocalEventBalance('3178', -targetEv.balances.availableBalance); // zera o saldo do destino

let reverseFailed = false;
try {
  await balanceTransferService.reverseTransfer(transferHigh.id, 'Tentativa de estorno sem saldo');
} catch (e) {
  reverseFailed = true;
  assert(e.message.includes('ESTORNO_BLOQUEADO_SALDO'), 'Deve barrar com ESTORNO_BLOQUEADO_SALDO');
}
assert.strictEqual(reverseFailed, true);
console.log('✓ ESTORNO_BLOQUEADO_SALDO ativado: estorno impedido pois o destino já consumiu o recurso.');

// 6. Teste de Dashboard Executivo (Fase 26.17.9.5.4)
console.log('\n[TESTE 6] Testando Agregador do Dashboard Executivo...');
const execDash = await eventBalanceService.getExecutiveDashboard('prod-1');
assert(execDash.ok && execDash.data);
const ed = execDash.data;
assert(ed.summary.totalBalance > 0);
assert(typeof ed.ratios.availabilityRate === 'number');
assert(typeof ed.ratios.commitmentRate === 'number');
assert(Array.isArray(ed.charts.composition));
assert(Array.isArray(ed.alerts));
console.log('✓ Dashboard Executivo consolidado com summary, ratios, composition e alerts.');

console.log('\n======================================================');
console.log('TODAS AS 4 FASES (26.17.9.5.1 A 26.17.9.5.4) PASSARAM! 🎉');
console.log('======================================================');
