/**
 * Fase 26.17.9.5.7 — Suíte de Homologação Automatizada
 * Agenda Financeira, Repasse Automático, Lotes de Repasse, Motor de Regras, Maker/Checker e Idempotência.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { payoutScheduleService } from '../../src/services/payoutScheduleService.js';
import { payoutScheduleGateway } from '../../src/services/payoutScheduleGateway.js';
import { financialRulesEngine } from '../../src/services/financialRulesService.js';
import { eventBalanceService } from '../../src/services/eventBalanceService.js';

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

console.log('================================================================');
console.log(' INICIANDO TESTES DA FASE 26.17.9.5.7 — AGENDA FINANCEIRA & LOTES');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// 1. ESTRUTURA E DOM
// -------------------------------------------------------------------------
console.log('1. Verificação de Elementos no DOM (index.html):');

it('Verifica se a 8ª aba #ft-tab-link-schedule e o painel #ft-pane-schedule existem no DOM', () => {
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert(html.includes('id="ft-tab-link-schedule"'), 'Aba #ft-tab-link-schedule deve existir no HTML');
  assert(html.includes('id="ft-pane-schedule"'), 'Painel #ft-pane-schedule deve existir no HTML');
  assert(html.includes('id="ft-schedule-count-badge"'), 'Badge de contagem deve existir');
});

it('Verifica se os 3 modais de governança da Fase 26.17.9.5.7 foram injetados', () => {
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert(html.includes('id="modal-schedule-payout"'), 'Modal #modal-schedule-payout deve existir');
  assert(html.includes('id="modal-create-payout-batch"'), 'Modal #modal-create-payout-batch deve existir');
  assert(html.includes('id="modal-payout-batch-details"'), 'Modal #modal-payout-batch-details deve existir');
});

// -------------------------------------------------------------------------
// 2. AGENDA FINANCEIRA (SCHEDULING)
// -------------------------------------------------------------------------
console.log('\n2. Gestão de Agendamentos Financeiros:');

await itAsync('Consulta de agenda financeira com horizonte temporal', async () => {
  const res = await payoutScheduleGateway.getSchedule({ producerId: 'prod-1', horizonDays: 30 });
  assert(res.ok, 'Resposta deve ser ok');
  assert(Array.isArray(res.data), 'Data deve ser um array');
  assert(res.data.length >= 3, 'Deve conter os agendamentos iniciais');
  assert(res.summary.totalAmount > 0, 'Resumo deve conter totalAmount calculado');
});

await itAsync('Criação de novo agendamento de repasse', async () => {
  const actor = { name: 'Operador Financeiro', role: 'OPERADOR' };
  const res = await payoutScheduleGateway.schedulePayout({
    producerId: 'prod-1',
    producerName: 'DiskIngressos Eventos Ltda',
    eventId: '3368',
    eventName: 'Experiencia Música e Natureza - Julho',
    amount: 1250.00,
    dueDate: '2026-09-18',
    type: 'PAYOUT_AUTOMATIC',
    priority: 'ALTA'
  }, actor);

  assert(res.ok, 'Criação do agendamento deve ser ok');
  assert(res.data.id.startsWith('SCH-'), 'ID deve ter prefixo SCH-');
  assert.strictEqual(res.data.amount, 1250.00);
  assert.strictEqual(res.data.status, 'AGENDADO');
});

await itAsync('Cancelamento auditado de agendamento', async () => {
  const actor = { name: 'Operador Financeiro', role: 'OPERADOR' };
  const scheduleRes = await payoutScheduleGateway.schedulePayout({
    producerId: 'prod-1',
    eventId: '3178',
    amount: 500.00,
    dueDate: '2026-09-20'
  }, actor);

  const cancelRes = await payoutScheduleGateway.cancelScheduledPayout(
    scheduleRes.data.id,
    'Cancelamento solicitado pelo produtor para reagendamento',
    actor
  );

  assert(cancelRes.ok, 'Cancelamento deve ser ok');
  assert.strictEqual(cancelRes.data.status, 'CANCELADO');
});

// -------------------------------------------------------------------------
// 3. CRIAÇÃO DE LOTES E MOTOR DE REGRAS MANDATÓRIO
// -------------------------------------------------------------------------
console.log('\n3. Criação de Lotes e Reavaliação no Motor de Regras:');

let testBatchId = null;

await itAsync('Criação de lote de repasse a partir de itens agendados', async () => {
  const actor = { name: 'Robô Noturno', role: 'MAKER' };
  const schedule = await payoutScheduleGateway.getSchedule({ producerId: 'prod-1' });
  const activeItems = schedule.data.filter(i => i.status === 'AGENDADO');
  assert(activeItems.length >= 2, 'Devem existir ao menos 2 itens agendados');

  const itemIds = [activeItems[0].id, activeItems[1].id];
  const res = await payoutScheduleGateway.createPayoutBatch({
    producerId: 'prod-1',
    title: 'Lote Teste Automatizado - Repasse Diário',
    scheduledDate: '2026-09-12',
    scheduleItemIds: itemIds
  }, actor);

  assert(res.ok, 'Lote deve ser criado com sucesso');
  assert(res.data.id.startsWith('LOTE-'), 'ID deve ter prefixo LOTE-');
  assert.strictEqual(res.data.totalItems, 2);
  assert.strictEqual(res.data.status, 'RASCUNHO');
  testBatchId = res.data.id;
});

await itAsync('Reavaliação OBRIGATÓRIA item a item no Motor de Regras da Fase 26.17.9.5.6', async () => {
  const actor = { name: 'Motor de Lotes', role: 'SISTEMA' };
  const valRes = await payoutScheduleGateway.validatePayoutBatch(testBatchId, actor);

  assert(valRes.ok, 'Validação do lote deve ser ok');
  const batch = valRes.data;
  assert(batch.items.length === 2, 'Itens do lote devem ser preservados');
  
  // Cada item deve possuir a decisão formal do motor de regras
  batch.items.forEach(item => {
    assert(['ALLOW', 'ALLOW_WITH_APPROVAL', 'ALLOW_PARTIAL', 'HOLD', 'BLOCK'].includes(item.ruleDecision),
      `Decisão do motor deve ser formal: ${item.ruleDecision}`);
  });
  assert(batch.approvedAmount >= 0, 'Valor aprovado deve ser preenchido');
});

// -------------------------------------------------------------------------
// 4. GOVERNANÇA MAKER / CHECKER
// -------------------------------------------------------------------------
console.log('\n4. Governança Maker / Checker (Segregação de Funções):');

await itAsync('Maker que criou o lote NÃO PODE aprová-lo (Violação de Maker/Checker)', async () => {
  const makerActor = { name: 'Robô Noturno', role: 'MAKER' };
  let thrown = false;
  try {
    await payoutScheduleGateway.approvePayoutBatch(testBatchId, makerActor);
  } catch (err) {
    thrown = true;
    assert(err.message.includes('Maker/Checker'), 'Erro deve apontar violação de segregação de funções');
  }
  assert(thrown, 'Deve disparar exceção ao tentar aprovação pelo próprio criador');
});

await itAsync('Checker autorizado aprova com sucesso o lote', async () => {
  const checkerActor = { name: 'Controladoria SafeSaff', role: 'CHECKER_DIRETORIA' };
  const approveRes = await payoutScheduleGateway.approvePayoutBatch(testBatchId, checkerActor);

  assert(approveRes.ok, 'Aprovação deve ser ok');
  assert.strictEqual(approveRes.data.status, 'APROVADO');
  assert.strictEqual(approveRes.data.approvedBy, 'Controladoria SafeSaff');
});

// -------------------------------------------------------------------------
// 5. PROCESSAMENTO BANCÁRIO & IDEMPOTÊNCIA
// -------------------------------------------------------------------------
console.log('\n5. Processamento Bancário e Idempotência:');

let capturedBankTxId = null;
let capturedItemId = null;

await itAsync('Processamento bancário do lote com reserva de saldo', async () => {
  const actor = { name: 'Operador de Repasse', role: 'OPERADOR' };
  const procRes = await payoutScheduleGateway.processPayoutBatch(testBatchId, { actor });

  assert(procRes.ok, 'Processamento bancário deve ser ok');
  assert.strictEqual(procRes.isIdempotentReplay, false, 'Primeira execução não deve ser replay');
  assert(['ENVIADO_BANCO', 'PARCIAL'].includes(procRes.data.status));
  assert(procRes.data.results.length > 0, 'Deve conter resultados para cada item');

  capturedBankTxId = procRes.data.results[0].bankTransactionId;
  capturedItemId = procRes.data.results[0].itemId;
  assert(capturedBankTxId, 'Transação bancária deve ter ID gerado');
});

await itAsync('Garantia de Idempotência: Segunda submissão com mesma chave retorna replay seguro', async () => {
  const actor = { name: 'Operador de Repasse', role: 'OPERADOR' };
  const replayRes = await payoutScheduleGateway.processPayoutBatch(testBatchId, { actor });

  assert(replayRes.ok, 'Replay deve ser ok');
  assert.strictEqual(replayRes.isIdempotentReplay, true, 'Deve indicar retorno cacheado de idempotência');
  assert.strictEqual(replayRes.data.batchId, testBatchId);
});

// -------------------------------------------------------------------------
// 6. RETORNO BANCÁRIO (WEBHOOK) & CONCILIAÇÃO
// -------------------------------------------------------------------------
console.log('\n6. Retorno Bancário (Webhook) e Baixa / Conciliação:');

await itAsync('Webhook de liquidação PAGO debita e concilia saldo com sucesso', async () => {
  const webhookActor = { name: 'Provedor Bancário', role: 'BANCO' };
  const returnRes = await payoutScheduleGateway.processBankReturnWebhook({
    bankTransactionId: capturedBankTxId,
    payoutItemId: capturedItemId,
    status: 'PAGO',
    settledAmount: 1000.00
  }, webhookActor);

  assert(returnRes.ok, 'Webhook deve ser processado com sucesso');
  assert.strictEqual(returnRes.data.bankStatus, 'PAGO');
  assert.strictEqual(returnRes.data.status, 'PAGO');
});

// -------------------------------------------------------------------------
// 7. TRATAMENTO DE FALHA TÉCNICA E REPROCESSAMENTO SEGURO
// -------------------------------------------------------------------------
console.log('\n7. Tratamento de Falhas e Reprocessamento Seguro:');

let technicalFailItemId = null;

await itAsync('Simulação de falha técnica (TIMEOUT) marca item como retryable', async () => {
  const batchRes = await payoutScheduleGateway.getPayoutBatchById(testBatchId);
  const secondItem = batchRes.data.items[1];
  assert(secondItem, 'Segundo item deve existir');
  technicalFailItemId = secondItem.id;

  const returnRes = await payoutScheduleGateway.processBankReturnWebhook({
    bankTransactionId: secondItem.bankTransactionId,
    payoutItemId: secondItem.id,
    status: 'REJEITADO',
    errorCode: 'TIMEOUT',
    errorMessage: 'Tempo limite esgotado no webhook do banco'
  }, { name: 'Provedor Bancário', role: 'BANCO' });

  assert(returnRes.ok, 'Webhook de rejeição deve ser processado');
  assert.strictEqual(returnRes.data.status, 'FALHA_TECNICA');
  assert.strictEqual(returnRes.data.isRetryable, true, 'TIMEOUT deve ser classificado como retryable');
});

await itAsync('Reprocessamento seguro acionado para item com falha técnica', async () => {
  const actor = { name: 'Operador de Repasse', role: 'OPERADOR' };
  const retryRes = await payoutScheduleGateway.retryPayoutItem(technicalFailItemId, actor);

  assert(retryRes.ok, 'Retry deve ser executado com sucesso');
  assert.strictEqual(retryRes.data.retryCount, 1);
  assert.strictEqual(retryRes.data.status, 'ENVIADO_BANCO');
  assert(retryRes.data.bankTransactionId.startsWith('BK-RETRY-'), 'Nova transação de retry gerada');
});

await itAsync('Reprocessamento é expressamente negado para itens com BLOCK ou sem elegibilidade', async () => {
  const batchRes = await payoutScheduleGateway.getPayoutBatchById(testBatchId);
  const item = batchRes.data.items[0];
  item.ruleDecision = 'BLOCK';
  item.ruleReasons = ['Alerta de compliance emitido'];

  let thrown = false;
  try {
    await payoutScheduleGateway.retryPayoutItem(item.id, { name: 'Operador', role: 'OPERADOR' });
  } catch (err) {
    thrown = true;
    assert(err.message.includes('Reprocessamento Negado'), 'Deve negar reprocessamento');
  }
  assert(thrown, 'Deve disparar erro bloqueando reprocessamento de BLOCK');
});

// -------------------------------------------------------------------------
// 8. TRILHA DE AUDITORIA APPEND-ONLY
// -------------------------------------------------------------------------
console.log('\n8. Trilha de Auditoria Append-Only:');

await itAsync('Auditoria contém logs com correlationId de todo o ciclo de vida', async () => {
  const auditRes = await payoutScheduleGateway.getScheduleAuditLog();
  assert(auditRes.ok, 'Auditoria deve retornar ok');
  assert(auditRes.data.length >= 6, 'Deve haver registros para todas as etapas executadas');

  const hasScheduled = auditRes.data.some(l => l.action === 'PAYOUT_SCHEDULED');
  const hasCreated = auditRes.data.some(l => l.action === 'BATCH_CREATED');
  const hasValidated = auditRes.data.some(l => l.action === 'BATCH_VALIDATED');
  const hasApproved = auditRes.data.some(l => l.action === 'BATCH_APPROVED');
  const hasSubmitted = auditRes.data.some(l => l.action === 'BATCH_SUBMITTED_TO_BANK');
  const hasRetry = auditRes.data.some(l => l.action === 'PAYOUT_RETRY_EXECUTED');

  assert(hasScheduled, 'Deve auditar PAYOUT_SCHEDULED');
  assert(hasCreated, 'Deve auditar BATCH_CREATED');
  assert(hasValidated, 'Deve auditar BATCH_VALIDATED');
  assert(hasApproved, 'Deve auditar BATCH_APPROVED');
  assert(hasSubmitted, 'Deve auditar BATCH_SUBMITTED_TO_BANK');
  assert(hasRetry, 'Deve auditar PAYOUT_RETRY_EXECUTED');

  auditRes.data.forEach(entry => {
    assert(entry.correlationId, 'Todo log deve ter correlationId');
    assert(entry.actor, 'Todo log deve ter ator');
    assert(entry.timestamp, 'Todo log deve ter timestamp');
  });
});

console.log('\n================================================================');
console.log(` SUCESSO: ${passedTests}/${totalTests} TESTES APROVADOS COM 100% DE ÊXITO!`);
console.log('================================================================\n');
