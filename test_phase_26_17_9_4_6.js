/**
 * Fase 26.17.9.4.6 — Suíte de Homologação Automatizada
 * Tesouraria Operacional, Contas Bancárias Reais, PIX, CNAB 240/400, Lotes, Idempotência e Auditoria.
 */

import assert from 'assert';
import fs from 'fs';
import { treasuryService } from './src/services/treasuryService.js';
import { treasuryGateway } from './src/services/treasuryGateway.js';

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
console.log(' INICIANDO TESTES DA FASE 26.17.9.4.6 — TESOURARIA OPERACIONAL');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// 1. ESTRUTURA E DOM
// -------------------------------------------------------------------------
console.log('1. Verificação de Elementos no DOM (index.html):');

it('Verifica se a seção #view-treasury e o item do menu existem no HTML', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert(html.includes('id="view-treasury"'), 'Seção #view-treasury deve existir');
  assert(html.includes('data-view="treasury"'), 'Menu item data-view="treasury" deve existir');
});

it('Verifica se os modais da tesouraria foram injetados no HTML', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert(html.includes('id="modal-treasury-account-create"'), 'Modal de nova conta bancária deve existir');
  assert(html.includes('id="modal-treasury-account-change"'), 'Modal de alteração de alto risco deve existir');
  assert(html.includes('id="modal-treasury-pix-create"'), 'Modal de pagamento PIX deve existir');
  assert(html.includes('id="modal-treasury-batch-create"'), 'Modal de lote de pagamento deve existir');
});

// -------------------------------------------------------------------------
// 2. DASHBOARD DA TESOURARIA & POSIÇÃO DE CAIXA
// -------------------------------------------------------------------------
console.log('\n2. Dashboard da Tesouraria e Saldos por Instituição:');

await itAsync('Consulta consolidada da posição de caixa por banco', async () => {
  const res = await treasuryGateway.getTreasuryDashboard('prod-1');
  assert(res.ok, 'Dashboard deve retornar ok');
  assert(res.data.kpis.totalBankBalance > 0, 'Saldo bancário total deve ser positivo');
  assert(res.data.accounts.length >= 3, 'Deve listar as contas dos bancos oficiais');
  assert(res.data.kpis.activeAccountsCount >= 3, 'Contas ativas devem ser contabilizadas');
});

// -------------------------------------------------------------------------
// 3. CENTRAL DE CONTAS BANCÁRIAS REAIS & ALTERAÇÃO DE ALTO RISCO
// -------------------------------------------------------------------------
console.log('\n3. Contas Bancárias Reais e Governança de Alto Risco:');

let newAccId = null;

await itAsync('Cadastro de nova conta bancária com mascaramento de segurança', async () => {
  const actor = { name: 'Operador Financeiro', role: 'OPERADOR_FINANCEIRO' };
  const res = await treasuryGateway.createBankAccount({
    producerId: 'prod-1',
    bankCode: '077',
    bankName: 'Banco Inter',
    agency: '0001',
    account: '778899',
    accountDigit: '1',
    purpose: 'OPERACIONAL',
    holderName: 'DiskIngressos Eventos Ltda',
    holderTaxId: '08.123.456/0001-99',
    initialBalance: 50000.00,
    pixKey: '08123456000199',
    pixKeyType: 'CNPJ'
  }, actor);

  assert(res.ok, 'Conta deve ser criada com sucesso');
  assert(res.data.maskedAccount.includes('***'), 'Conta deve estar mascarada para segurança');
  assert.strictEqual(res.data.currentBalance, 50000.00);
  newAccId = res.data.id;
});

let changeReqId = null;

await itAsync('Solicitação de alteração de alto risco de chave PIX / domicílio', async () => {
  const actor = { name: 'Operador Financeiro', role: 'OPERADOR_FINANCEIRO' };
  const res = await treasuryGateway.requestBankAccountChange({
    bankAccountId: newAccId,
    requestedChanges: { pixKey: 'financeiro.novo@diskingressos.com.br' },
    reason: 'Atualização para e-mail corporativo'
  }, actor);

  assert(res.ok, 'Solicitação deve ser registrada');
  assert.strictEqual(res.data.status, 'PENDENTE');
  assert.strictEqual(res.data.riskLevel, 'CRITICO');
  changeReqId = res.data.id;
});

await itAsync('Maker que solicitou a alteração NÃO PODE aprová-la (Maker/Checker)', async () => {
  const makerActor = { name: 'Operador Financeiro', role: 'OPERADOR_FINANCEIRO' };
  let thrown = false;
  try {
    await treasuryGateway.approveBankAccountChange(changeReqId, makerActor);
  } catch (err) {
    thrown = true;
    assert(err.message.includes('Maker/Checker'), 'Erro deve acusar segregação de funções');
  }
  assert(thrown, 'Deve disparar erro de violação Maker/Checker');
});

await itAsync('Checker autorizado homologa a alteração cadastral bancária', async () => {
  const checkerActor = { name: 'Diretoria Financeira', role: 'DIRETORIA' };
  const res = await treasuryGateway.approveBankAccountChange(changeReqId, checkerActor);

  assert(res.ok, 'Aprovação deve ser realizada com sucesso');
  assert.strictEqual(res.data.pixKey, 'financeiro.novo@diskingressos.com.br');
});

// -------------------------------------------------------------------------
// 4. MÓDULO PIX: CICLO FORMAL & PREVENÇÃO DE DUPLICIDADE
// -------------------------------------------------------------------------
console.log('\n4. Pagamento PIX e Prevenção Rigorosa de Duplicidade:');

let pixPaymentId = null;

await itAsync('Criação de ordem de pagamento PIX com alçada de aprovação', async () => {
  const actor = { name: 'Operador de Caixa', role: 'OPERADOR_FINANCEIRO' };
  const res = await treasuryGateway.createPixPayment({
    producerId: 'prod-1',
    originBankAccountId: 'BACC-001',
    destinationAccount: {
      holderName: 'Locação de Palcos e Tendas Ltda',
      holderTaxId: '22.333.444/0001-55',
      pixKey: '22333444000155',
      pixKeyType: 'CNPJ'
    },
    amount: 15000.00, // > 10.000 exige aprovação de alçada
    description: 'Palco Principal Festival - Parcela 2'
  }, actor);

  assert(res.ok, 'Pagamento deve ser criado');
  assert.strictEqual(res.data.status, 'AWAITING_APPROVAL');
  pixPaymentId = res.data.id;
});

await itAsync('Motor Anti-Duplicidade: Rejeita pagamento idêntico (mesma chave, valor e data)', async () => {
  const actor = { name: 'Operador de Caixa', role: 'OPERADOR_FINANCEIRO' };
  let thrown = false;
  try {
    await treasuryGateway.createPixPayment({
      producerId: 'prod-1',
      originBankAccountId: 'BACC-001',
      destinationAccount: {
        holderName: 'Locação de Palcos e Tendas Ltda',
        holderTaxId: '22.333.444/0001-55',
        pixKey: '22333444000155',
        pixKeyType: 'CNPJ'
      },
      amount: 15000.00,
      description: 'Tentativa duplicada de pagamento'
    }, actor);
  } catch (err) {
    thrown = true;
    assert(err.message.includes('Duplicado Detectada'), 'Deve apontar duplicidade');
  }
  assert(thrown, 'Deve barrar pagamento duplicado');
});

await itAsync('Aprovação de alçada do PIX pelo Checker', async () => {
  const checker = { name: 'Gerente Financeiro', role: 'GERENTE_FINANCEIRO' };
  const res = await treasuryGateway.approvePayment(pixPaymentId, checker);
  assert(res.ok, 'Aprovação deve ser ok');
  assert.strictEqual(res.data.status, 'APPROVED');
});

await itAsync('Liquidação PIX com débito físico na conta bancária e geração de E2E', async () => {
  const initialAcc = await treasuryGateway.getBankAccountById('BACC-001');
  const initialBalance = initialAcc.data.availableBalance;

  const res = await treasuryGateway.submitPixPayment(pixPaymentId, {
    actor: { name: 'Sistema Bancário', role: 'SISTEMA' }
  });

  assert(res.ok, 'Liquidação PIX deve ser concluída');
  assert.strictEqual(res.data.status, 'SETTLED');
  assert(res.data.endToEndId.startsWith('E') && res.data.endToEndId.length >= 25, 'Deve gerar identificador oficial E2E do PIX');

  const afterAcc = await treasuryGateway.getBankAccountById('BACC-001');
  assert.strictEqual(afterAcc.data.availableBalance, Number((initialBalance - 15000.00).toFixed(2)));
});

await itAsync('Idempotência Bancária do PIX: Replay retorna payload cacheado', async () => {
  const replayRes = await treasuryGateway.submitPixPayment(pixPaymentId);
  assert(replayRes.ok, 'Replay deve retornar ok');
  assert.strictEqual(replayRes.isIdempotentReplay, true, 'Deve indicar retorno de idempotência');
  assert.strictEqual(replayRes.data.paymentId, pixPaymentId);
});

// -------------------------------------------------------------------------
// 5. PAGAMENTOS EM LOTE & REMESSA CNAB 240
// -------------------------------------------------------------------------
console.log('\n5. Pagamentos em Lote e Geração de Remessa CNAB 240:');

let batchId = null;

await itAsync('Criação de lote de pagamento a fornecedores', async () => {
  const actor = { name: 'Operador de Caixa', role: 'OPERADOR_FINANCEIRO' };
  const payments = await treasuryGateway.getPayments({ producerId: 'prod-1' });
  const pending = payments.data.filter(p => ['APPROVED', 'AWAITING_APPROVAL'].includes(p.status));
  assert(pending.length >= 1, 'Deve haver ao menos um pagamento elegível');

  const res = await treasuryGateway.createPaymentBatch({
    producerId: 'prod-1',
    originBankAccountId: 'BACC-002',
    paymentIds: [pending[0].id],
    title: 'Lote Remessa Fornecedores Quinzena'
  }, actor);

  assert(res.ok, 'Lote deve ser criado com sucesso');
  assert.strictEqual(res.data.status, 'AGUARDANDO_APROVACAO');
  batchId = res.data.id;
});

await itAsync('Aprovação do lote pela diretoria (Maker/Checker)', async () => {
  const checker = { name: 'Diretoria Financeira', role: 'DIRETORIA' };
  const res = await treasuryGateway.approvePaymentBatch(batchId, checker);
  assert(res.ok, 'Lote deve ser aprovado');
  assert.strictEqual(res.data.status, 'APROVADO');
});

await itAsync('Geração de arquivo FEBRABAN CNAB 240 (Segmentos A e B)', async () => {
  const actor = { name: 'Operador de Remessa', role: 'OPERADOR_FINANCEIRO' };
  const res = await treasuryGateway.generateCnab240Remessa(batchId, actor);

  assert(res.ok, 'Remessa deve ser gerada');
  assert(res.data.filename.endsWith('.REM'), 'Arquivo deve ter extensão .REM');
  assert(res.data.content.includes('00013'), 'Conteúdo deve conter registro de detalhe segmento A/B');
  assert.strictEqual(res.batch.status, 'ENVIADO_BANCO');
});

// -------------------------------------------------------------------------
// 6. PROCESSAMENTO DE RETORNO CNAB & CONCILIAÇÃO BANCÁRIA
// -------------------------------------------------------------------------
console.log('\n6. Processamento de Retorno Bancário CNAB e Baixa Contábil:');

await itAsync('Processador de arquivo retorno CNAB 240 com leitura de ocorrências', async () => {
  // Arquivo retorno simulado com ocorrência 00 (Liquidado com sucesso)
  const simulatedRetorno = `3410000000208123456000199DiskIngressos                 Itaú Unibanco                 20260912000001084\r\n34100011C2001040081234560001990034000004481000Lote Retorno Fornecedores     \r\n` +
    `3410001300001A0000000101502000001122340SEGURANCA TOTAL VIGILANCIA    ${'PAY-2026-002'.padEnd(20, ' ')}20260912000000000420000${' '.repeat(100)}00\r\n` +
    `34100015000001000000000000420000\r\n3419999900001000005`;

  const actor = { name: 'Operador de Retorno', role: 'OPERADOR_FINANCEIRO' };
  const res = await treasuryGateway.processCnabRetorno('RETORNO_341.RET', simulatedRetorno, actor);

  assert(res.ok, 'Retorno deve ser processado');
  assert(res.data.totalOccurrences >= 1, 'Deve ler ocorrência bancária');
  assert.strictEqual(res.data.settledAmount, 4200.00);

  // Verifica que o pagamento foi baixado para SETTLED
  const p = await treasuryGateway.getPayments({ producerId: 'prod-1' });
  const settledPayment = p.data.find(pay => pay.id === 'PAY-2026-002');
  assert.strictEqual(settledPayment.status, 'SETTLED');
});

// -------------------------------------------------------------------------
// 7. TRILHA DE AUDITORIA APPEND-ONLY DA TESOURARIA
// -------------------------------------------------------------------------
console.log('\n7. Trilha de Auditoria Append-Only:');

await itAsync('Auditoria contém logs de contas, alterações de alto risco, PIX e CNAB', async () => {
  const auditRes = await treasuryGateway.getTreasuryAuditLog();
  assert(auditRes.ok, 'Auditoria deve retornar ok');
  assert(auditRes.data.length >= 6, 'Deve haver registros para todas as etapas da tesouraria');

  const actions = auditRes.data.map(a => a.action);
  assert(actions.includes('ACCOUNT_CREATED'), 'Deve auditar ACCOUNT_CREATED');
  assert(actions.includes('CHANGE_REQUESTED'), 'Deve auditar CHANGE_REQUESTED');
  assert(actions.includes('CHANGE_APPROVED'), 'Deve auditar CHANGE_APPROVED');
  assert(actions.includes('PIX_CREATED'), 'Deve auditar PIX_CREATED');
  assert(actions.includes('PIX_SETTLED'), 'Deve auditar PIX_SETTLED');
  assert(actions.includes('CNAB_REMESSA_GENERATED'), 'Deve auditar CNAB_REMESSA_GENERATED');
  assert(actions.includes('CNAB_RETORNO_PROCESSED'), 'Deve auditar CNAB_RETORNO_PROCESSED');
});

console.log('\n================================================================');
console.log(` SUCESSO: ${passedTests}/${totalTests} TESTES APROVADOS COM 100% DE ÊXITO!`);
console.log('================================================================\n');
