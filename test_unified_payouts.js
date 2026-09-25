/**
 * Testes Automatizados — Sistema Unificado de Repasses (Opção A + Opção B)
 * Visão do Produtor (apenas resultados, valores repassados e comprovante)
 * Visão Financeiro Disk Ingressos (Central de Alçadas, Aprovações, Lotes e Liquidação Bancária)
 */

import assert from 'assert';
import fs from 'fs';
import { payoutScheduleService } from './src/services/payoutScheduleService.js';
import { payoutScheduleGateway } from './src/services/payoutScheduleGateway.js';

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${desc}`);
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    Erro: ${err.message}`);
    throw err;
  }
}

async function itAsync(desc, fn) {
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

console.log('====================================================================');
console.log(' INICIANDO TESTES DO SISTEMA UNIFICADO DE REPASSES (PRODUTOR + DISK)');
console.log('====================================================================\n');

// -------------------------------------------------------------------------
// 1. ESTRUTURA E INTERFACE NO DOM (index.html)
// -------------------------------------------------------------------------
console.log('1. Verificação de Elementos de Interface no DOM (index.html):');

it('Verifica container de alternância de perfis (Produtor vs Financeiro Disk)', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert(html.includes('id="payout-role-view-toggle"'), 'Container #payout-role-view-toggle deve existir');
  assert(html.includes('id="btn-payout-role-producer"'), 'Botão #btn-payout-role-producer deve existir');
  assert(html.includes('id="btn-payout-role-financeiro"'), 'Botão #btn-payout-role-financeiro deve existir');
});

it('Verifica container exclusivo do Produtor (apenas extrato, valores e status)', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert(html.includes('id="payout-producer-container"'), 'Container #payout-producer-container deve existir');
  assert(html.includes('id="table-producer-payouts-body"'), 'Tabela #table-producer-payouts-body deve existir');
  assert(html.includes('id="prod-kpi-total-repassado"'), 'KPI de total repassado deve existir');
  assert(html.includes('id="prod-kpi-aprovados"'), 'KPI de repasses aprovados deve existir');
});

it('Verifica container exclusivo do Financeiro Disk (Opção A + Opção B)', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert(html.includes('id="payout-financeiro-container"'), 'Container #payout-financeiro-container deve existir');
  assert(html.includes('id="table-financeiro-alcadas-body"'), 'Tabela de alçadas #table-financeiro-alcadas-body deve existir');
  assert(html.includes('id="table-financeiro-lotes-body"'), 'Tabela de lotes #table-financeiro-lotes-body deve existir');
  assert(html.includes('openCreatePayoutBatchModal'), 'Ação de criar lote bancário deve existir');
});

it('Verifica os 3 novos modais de governança e comprovante', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert(html.includes('id="modal-payout-receipt-view"'), 'Modal #modal-payout-receipt-view deve existir');
  assert(html.includes('id="modal-approve-single-payout"'), 'Modal #modal-approve-single-payout deve existir');
  assert(html.includes('id="modal-reject-single-payout"'), 'Modal #modal-reject-single-payout deve existir');
});

// -------------------------------------------------------------------------
// 2. VISÃO DO PRODUTOR: APENAS RESULTADOS, VALORES LÍQUIDOS E COMPROVANTE
// -------------------------------------------------------------------------
console.log('\n2. Sanitização e Visão Restrita do Produtor:');

await itAsync('Produtor visualiza extrato com valores brutos, taxas e valores líquidos transferidos', async () => {
  const res = await payoutScheduleGateway.getProducerPayoutsView('prod-1');
  assert(res.ok, 'Resposta deve ser ok');
  assert(Array.isArray(res.data), 'Data deve ser um array de repasses');
  assert(res.summary, 'Deve conter resumo financeiro');
  assert(typeof res.summary.totalConcluido === 'number', 'totalConcluido deve ser numérico');
  assert(typeof res.summary.totalAprovado === 'number', 'totalAprovado deve ser numérico');

  // Verificar que cada item possui campos limpos e amigáveis ao produtor
  for (const item of res.data) {
    assert(item.id, 'Deve conter id');
    assert(item.grossAmount > 0, 'Valor bruto deve ser maior que zero');
    assert(item.netAmount > 0, 'Valor líquido deve ser maior que zero');
    assert(item.statusLabel, 'Deve conter rótulo amigável');
    // Não deve vazar campos internos confidenciais de risco
    assert.strictEqual(item.riskProfile, undefined, 'Não deve expor riskProfile');
    assert.strictEqual(item.rulesEvaluation, undefined, 'Não deve expor regras internas do motor');
  }
});

await itAsync('Geração de comprovante eletrônico oficial para repasse concluído', async () => {
  const schedRes = await payoutScheduleService.getSchedule();
  const targetItem = schedRes.data.find(s => s.status === 'CONCLUIDO') || schedRes.data[0];

  const receiptRes = await payoutScheduleGateway.getPayoutReceipt(targetItem.id);
  assert(receiptRes.ok, 'Comprovante deve retornar ok');
  assert(receiptRes.authCode, 'Comprovante deve conter código de autenticação eletrônica');
  assert(receiptRes.netAmount > 0, 'Comprovante deve exibir valor líquido');
  assert(receiptRes.bankAccount, 'Comprovante deve indicar conta bancária ou chave PIX');
});

// -------------------------------------------------------------------------
// 3. FLUXO OPERACIONAL COMPLETO: SOLICITAÇÃO -> ALÇADA DISK -> LIQUIDAÇÃO
// -------------------------------------------------------------------------
console.log('\n3. Ciclo de Vida: Produtor Solicita -> Alçada Financeiro -> Liquidação:');

let newScheduleId = null;

await itAsync('Passo 1: Produtor solicita novo repasse de R$ 3.500,00', async () => {
  const actor = { name: 'Produtor Festival', role: 'PRODUTOR', id: 'user-producer-1' };
  const res = await payoutScheduleService.schedulePayout({
    producerId: 'prod-1',
    producerName: 'DiskIngressos Eventos Ltda',
    eventId: '3368',
    eventName: 'Experiencia Música e Natureza - Julho',
    amount: 3500.00,
    dueDate: '2026-09-26',
    type: 'PAYOUT_SOLICITADO',
    priority: 'ALTA'
  }, actor);

  assert(res.ok, 'Solicitação do repasse deve ser criada');
  newScheduleId = res.data.id;
  assert(newScheduleId.startsWith('SCH-'), 'ID do repasse deve ter prefixo SCH-');
  assert.strictEqual(res.data.status, 'AGENDADO');
});

await itAsync('Passo 2: Produtor enxerga repasse recém-solicitado como "Em Análise"', async () => {
  const res = await payoutScheduleGateway.getProducerPayoutsView('prod-1');
  const found = res.data.find(p => p.id === newScheduleId);
  assert(found, 'Repasse recém-criado deve estar visível no extrato do produtor');
  assert.strictEqual(found.netAmount, 3500.00);
  assert.strictEqual(found.status, 'EM_ANALISE');
  assert.strictEqual(found.canViewReceipt, false, 'Comprovante ainda não deve estar disponível');
});

await itAsync('Passo 3: Regra Maker/Checker impede que o próprio solicitante aprove o repasse', async () => {
  const sameActor = { name: 'Produtor Festival', role: 'PRODUTOR', id: 'user-producer-1' };
  const approveRes = await payoutScheduleGateway.approveIndividualPayout(
    newScheduleId,
    sameActor,
    'Tentando auto-aprovar'
  );
  assert.strictEqual(approveRes.ok, false, 'Maker/Checker deve rejeitar aprovação pelo mesmo usuário');
  assert(approveRes.error.includes('Maker/Checker'), 'Mensagem de erro deve citar Maker/Checker');
});

await itAsync('Passo 4: Analista do Financeiro Disk aprova na Alçada de Liberação', async () => {
  const financeiroActor = { name: 'Mariana Controladoria', role: 'FINANCEIRO_ADMIN', id: 'user-fin-2' };
  const approveRes = await payoutScheduleGateway.approveIndividualPayout(
    newScheduleId,
    financeiroActor,
    'Documentação conferida e aprovada'
  );

  assert(approveRes.ok, 'Aprovação por outro analista deve ser aceita');
  assert.strictEqual(approveRes.data.status, 'APROVADO');
  assert(approveRes.data.approvalLevel, 'Deve registrar nível da alçada');
  assert.strictEqual(approveRes.data.approvalLevel, 'AUTOMATICA'); // <= 5000 é automática
});

await itAsync('Passo 5: Produtor vê que seu repasse agora está "Aprovado"', async () => {
  const res = await payoutScheduleGateway.getProducerPayoutsView('prod-1');
  const found = res.data.find(p => p.id === newScheduleId);
  assert(found, 'Repasse deve constar no extrato');
  assert.strictEqual(found.status, 'APROVADO');
  assert(found.statusLabel.includes('Aprovado'), 'Rótulo deve indicar Aprovado');
});

await itAsync('Passo 6: Financeiro Disk realiza liquidação instantânea (PIX Direto)', async () => {
  const treasurerActor = { name: 'Carlos Tesoureiro', role: 'TESOURARIA', id: 'user-fin-3' };
  const settleRes = await payoutScheduleGateway.settleIndividualPayout(
    newScheduleId,
    treasurerActor,
    { paymentMethod: 'PIX', bankName: 'Banco Itaú S.A.' }
  );

  assert(settleRes.ok, 'Liquidação deve ser concluída com sucesso');
  assert.strictEqual(settleRes.data.status, 'CONCLUIDO');
  assert.strictEqual(settleRes.data.bankStatus, 'PAGO');
  assert(settleRes.data.authCode.startsWith('AUTH-DK-'), 'Deve gerar código de autenticação eletrônica');
});

await itAsync('Passo 7: Produtor agora vê o repasse como "Concluído / Repassado" com comprovante disponível', async () => {
  const res = await payoutScheduleGateway.getProducerPayoutsView('prod-1');
  const found = res.data.find(p => p.id === newScheduleId);
  assert(found, 'Repasse deve constar no extrato do produtor');
  assert.strictEqual(found.status, 'CONCLUIDO');
  assert(found.statusLabel.includes('Concluído'), 'Rótulo deve indicar Concluído');
  assert.strictEqual(found.canViewReceipt, true, 'Comprovante agora DEVE estar disponível');
  assert(found.authCode.startsWith('AUTH-DK-'), 'Deve ter o código de autenticação eletrônica');
  assert.strictEqual(found.netAmount, 3500.00, 'Valor repassado deve ser exatamente R$ 3.500,00');

  // Obter o comprovante final
  const receiptRes = await payoutScheduleGateway.getPayoutReceipt(newScheduleId);
  assert(receiptRes.ok, 'Deve gerar comprovante com sucesso');
  assert.strictEqual(receiptRes.authCode, found.authCode);
  assert.strictEqual(receiptRes.netAmount, 3500.00);
});

// -------------------------------------------------------------------------
// 4. TESTE DE REJEIÇÃO MOTIVADA
// -------------------------------------------------------------------------
console.log('\n4. Teste de Rejeição de Repasse com Motivo Claro:');

await itAsync('Financeiro rejeita repasse irregular e produtor é informado com justificativa', async () => {
  const scheduleRes = await payoutScheduleService.schedulePayout({
    producerId: 'prod-1',
    producerName: 'DiskIngressos Eventos Ltda',
    eventId: '3368',
    eventName: 'Experiencia Música e Natureza - Julho',
    amount: 12000.00,
    dueDate: '2026-09-30',
    type: 'PAYOUT_SOLICITADO',
    priority: 'MEDIA'
  }, { name: 'Produtor Festival', id: 'user-producer-1' });

  const rejId = scheduleRes.data.id;

  // Financeiro rejeita
  const rejectRes = await payoutScheduleGateway.rejectIndividualPayout(
    rejId,
    { name: 'Inspetor Compliance', role: 'COMPLIANCE', id: 'user-fin-4' },
    'Inconsistência nos dados bancários cadastrados'
  );

  assert(rejectRes.ok, 'Rejeição deve ser processada');
  assert.strictEqual(rejectRes.data.status, 'REJEITADO');

  // Produtor consulta extrato
  const prodView = await payoutScheduleGateway.getProducerPayoutsView('prod-1');
  const foundRej = prodView.data.find(p => p.id === rejId);
  assert(foundRej, 'Item rejeitado deve constar');
  assert.strictEqual(foundRej.status, 'REJEITADO');
  assert.strictEqual(foundRej.rejectionReason, 'Inconsistência nos dados bancários cadastrados');
  assert.strictEqual(foundRej.canViewReceipt, false);
});

console.log('\n====================================================================');
console.log(` RESULTADO: ${passedTests}/${totalTests} TESTES APROVADOS COM SUCESSO!`);
console.log('====================================================================');
