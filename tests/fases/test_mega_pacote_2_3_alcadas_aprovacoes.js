/**
 * Testes Automatizados — MEGA PACOTE 2 & 3:
 * Alçadas de Aprovação, Segregação de Funções (SoD) e Central Unificada de Aprovações
 * 
 * Validação rigorosa:
 * 1. Princípio Maker / Checker (requestedBy !== approvedBy) transversal a produtores e operadores
 * 2. Matriz de Alçadas e Dupla Aprovação (N1 + N2 com segregação de operadores)
 * 3. Operações críticas de alçada N2 (Alteração de Dados Bancários)
 * 4. Avaliação de Escopo e Não-Repúdio
 * 5. Ciclo Preventivo de Saldos (Reserva -> Devolução/Liberação -> Execução/Baixa)
 * 6. Trilha Imutável de Auditoria (accessAuditService + auditTrail)
 */

import assert from 'assert';
import { accessControlService } from '../../src/services/accessControlService.js';
import { accessAuditService } from '../../src/services/accessAuditService.js';
import { financialApprovalService } from '../../src/services/financialApprovalService.js';
import { financialApprovalRulesService } from '../../src/services/financialApprovalRulesService.js';
import { eventBalanceService } from '../../src/services/eventBalanceService.js';

let totalTests = 0;
let passedTests = 0;

async function test(desc, fn) {
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

async function run() {
  console.log('====================================================================');
  console.log(' MEGA PACOTE 2 & 3: ALÇADAS, SEGREGAÇÃO DE FUNÇÕES E APROVAÇÕES');
  console.log('====================================================================\n');

  // -------------------------------------------------------------------------
  // 1. MAKER / CHECKER E SEGREGAÇÃO DE FUNÇÕES TRANSVERSAL
  // -------------------------------------------------------------------------
  console.log('1. Governança Maker / Checker e Segregação de Funções:');

  await test('Produtor não pode aprovar solicitação criada por ele mesmo (Maker/Checker)', async () => {
    const reqRes = await financialApprovalService.createRequest({
      type: 'REPASSE',
      producerId: 'prod-1',
      producerName: 'Parque Jaime Lerner',
      eventId: '3368',
      amount: 15000,
      requestedBy: {
        id: 'user-producer-joao',
        name: 'João Silva',
        email: 'joao.silva@parquejlerner.com.br',
        role: 'PRODUTOR'
      },
      justification: 'Repasse operacional da quinzena'
    });

    const req = reqRes.data;
    assert(req && req.id);

    let thrown = false;
    try {
      await financialApprovalService.approveRequest(req.id, {
        id: 'user-producer-joao',
        name: 'João Silva',
        email: 'joao.silva@parquejlerner.com.br',
        role: 'PRODUTOR'
      }, 'Tentativa de auto-aprovação');
    } catch (err) {
      thrown = true;
      assert(err.message.includes('Maker/Checker') || err.message.includes('Acesso Negado'));
    }
    assert(thrown, 'O solicitante NÃO pode auto-aprovar sua solicitação');
  });

  await test('Operador financeiro que solicita operação interna não pode aprová-la', async () => {
    const reqRes = await financialApprovalService.createRequest({
      type: 'ANTECIPACAO',
      producerId: 'prod-1',
      producerName: 'Parque Jaime Lerner',
      eventId: '3368',
      amount: 20000,
      requestedBy: {
        id: 'user-fin-mariana',
        name: 'Maria Souza',
        email: 'maria.souza@diskingressos.com.br',
        role: 'FINANCEIRO'
      },
      justification: 'Antecipação solicitada pelo analista'
    });

    const req = reqRes.data;

    let thrown = false;
    try {
      await financialApprovalService.approveRequest(req.id, {
        id: 'user-fin-mariana',
        name: 'Maria Souza',
        email: 'maria.souza@diskingressos.com.br',
        role: 'FINANCEIRO'
      }, 'Auto-aprovação financeira indevida');
    } catch (err) {
      thrown = true;
      assert(err.message.includes('Maker/Checker'));
    }
    assert(thrown, 'Maker financeiro não pode ser o Checker da mesma operação');
  });

  // -------------------------------------------------------------------------
  // 2. DUPLA APROVAÇÃO (N1 + N2) E SEGREGAÇÃO ENTRE APROVADORES
  // -------------------------------------------------------------------------
  console.log('\n2. Dupla Aprovação (Nível 1 + Nível 2) com Segregação de Operadores:');

  await test('Operação de grande porte (> R$ 50k) exige dupla aprovação', async () => {
    const reqRes = await financialApprovalService.createRequest({
      type: 'REPASSE',
      producerId: 'prod-1',
      producerName: 'Parque Jaime Lerner',
      eventId: '3368',
      amount: 120000, // Acima de 50k -> Dupla aprovação
      requestedBy: {
        id: 'user-producer-joao',
        name: 'João Silva',
        email: 'joao.silva@parquejlerner.com.br',
        role: 'PRODUTOR'
      },
      justification: 'Fechamento de bilheteria e repasse expressivo'
    });

    const req = reqRes.data;
    assert.strictEqual(req.approvalLevel, 'DUPLA_APROVACAO', 'Deve exigir Dupla Aprovação para valores > 50k');

    // 1º Nível: Maria Souza (Financeiro Operacional N1) aprova
    const app1Res = await financialApprovalService.approveRequest(req.id, {
      id: 'user-fin-mariana',
      name: 'Maria Souza',
      email: 'maria.souza@diskingressos.com.br',
      role: 'FINANCEIRO'
    }, '1º Nível validado documentalmente');

    assert.strictEqual(app1Res.requiresSecondLevel, true, 'Deve indicar necessidade de 2º nível');
    assert.strictEqual(app1Res.data.status, 'EM_ANALISE');
    assert.strictEqual(app1Res.data.statusLabelPtBr, 'Aguardando 2º Nível');
    assert(app1Res.data.firstLevelApprovedBy);

    // Violação de Segregação N1 x N2: A própria Maria NÃO PODE dar o 2º nível
    let n2SameActorFailed = false;
    try {
      await financialApprovalService.approveRequest(req.id, {
        id: 'user-fin-mariana',
        name: 'Maria Souza',
        email: 'maria.souza@diskingressos.com.br',
        role: 'FINANCEIRO'
      }, 'Tentativa de dar a 2ª aprovação pelo mesmo operador');
    } catch (err) {
      n2SameActorFailed = true;
      assert(err.message.includes('Segregação de Funções') || err.message.includes('Nível 1'));
    }
    assert(n2SameActorFailed, 'O mesmo operador que aprovou N1 não pode conceder N2');

    // 2º Nível: Carlos Lima (Gestor Financeiro N2) concede aprovação final
    const app2Res = await financialApprovalService.approveRequest(req.id, {
      id: 'user-admin-carlos',
      name: 'Carlos Lima',
      email: 'carlos.lima@diskingressos.com.br',
      role: 'GESTOR_FINANCEIRO'
    }, '2º Nível homologado pela Diretoria');

    assert.strictEqual(app2Res.data.status, 'CONCLUIDA');
    assert(app2Res.data.executionResult && app2Res.data.executionResult.authCode);
  });

  // -------------------------------------------------------------------------
  // 3. OPERAÇÃO CRÍTICA DE ALÇADA N2 (ALTERAÇÃO DE DADOS BANCÁRIOS)
  // -------------------------------------------------------------------------
  console.log('\n3. Operação Crítica de Alçada N2 (Alteração de Domicílio Bancário):');

  await test('Alteração bancária exige Nível 2 / Gestor Financeiro', async () => {
    const reqRes = await financialApprovalService.createRequest({
      type: 'ALTERACAO_DADOS_BANCARIOS',
      producerId: 'prod-1',
      producerName: 'Parque Jaime Lerner',
      amount: 0,
      requestedBy: {
        id: 'user-producer-joao',
        name: 'João Silva',
        email: 'joao.silva@parquejlerner.com.br',
        role: 'PRODUTOR'
      },
      justification: 'Alteração de chave PIX de CNPJ para Banco Itaú',
      payload: {
        newBank: '341 - Itaú Unibanco',
        newAgency: '0057',
        newAccount: '12345-6',
        pixKey: '08123456000199'
      }
    });

    const req = reqRes.data;
    assert.strictEqual(req.approvalLevel, 'NIVEL_2');

    // Carlos Lima (Gestor Financeiro com canApproveBankDetails: true) aprova com êxito
    const appRes = await financialApprovalService.approveRequest(req.id, {
      id: 'user-admin-carlos',
      name: 'Carlos Lima',
      email: 'carlos.lima@diskingressos.com.br',
      role: 'GESTOR_FINANCEIRO'
    }, 'Comprovante bancário e cartão CNPJ verificados');

    assert.strictEqual(appRes.data.status, 'CONCLUIDA');
  });

  // -------------------------------------------------------------------------
  // 4. CICLO DE RESERVA, DEVOLUÇÃO E LIBERAÇÃO PREVENTIVA DE SALDO
  // -------------------------------------------------------------------------
  console.log('\n4. Ciclo Preventivo de Saldos e Liberação em Caso de Rejeição/Devolução:');

  await test('Reserva saldo na criação, libera na devolução e reaplica no reenvio', async () => {
    const store = eventBalanceService.getLocalBalanceStore();
    const ev = store.find(e => String(e.eventId) === '3368');
    const initialPending = ev ? (ev.balances.pendingTransfers || 0) : 0;

    // 1. Cria solicitação de R$ 8.000
    const reqRes = await financialApprovalService.createRequest({
      type: 'REPASSE',
      producerId: 'prod-1',
      producerName: 'Parque Jaime Lerner',
      eventId: '3368',
      amount: 8000,
      requestedBy: {
        id: 'user-producer-joao',
        name: 'João Silva',
        email: 'joao.silva@parquejlerner.com.br',
        role: 'PRODUTOR'
      },
      justification: 'Repasse de ingressos antecipados'
    });

    const req = reqRes.data;
    assert(ev.balances.pendingTransfers >= initialPending + 8000, 'Saldo deve ser preventivamente reservado');

    // 2. Financeiro devolve para ajustes
    financialApprovalService.returnRequest(req.id, {
      id: 'user-fin-mariana',
      name: 'Maria Souza',
      email: 'maria.souza@diskingressos.com.br',
      role: 'FINANCEIRO'
    }, 'Por favor anexar a nota fiscal com o CNPJ do evento');

    assert(ev.balances.pendingTransfers <= initialPending + 0.01, 'Saldo reservado deve ser liberado enquanto aguarda correção');

    // 3. Produtor reenvia com nota fiscal
    financialApprovalService.resubmitRequest(req.id, {
      id: 'user-producer-joao',
      name: 'João Silva',
      email: 'joao.silva@parquejlerner.com.br',
      role: 'PRODUTOR'
    }, { justification: 'Nota fiscal anexada com sucesso.' });

    assert(ev.balances.pendingTransfers >= initialPending + 8000, 'Saldo deve ser reservado novamente no reenvio');

    // 4. Financeiro aprova
    const appRes = await financialApprovalService.approveRequest(req.id, {
      id: 'user-fin-mariana',
      name: 'Maria Souza',
      email: 'maria.souza@diskingressos.com.br',
      role: 'FINANCEIRO'
    }, 'NF homologada');

    assert.strictEqual(appRes.data.status, 'CONCLUIDA');
  });

  // -------------------------------------------------------------------------
  // 5. TRILHA IMUTÁVEL DE AUDITORIA DE ACESSO E GOVERNANÇA
  // -------------------------------------------------------------------------
  console.log('\n5. Trilha de Auditoria Append-Only e Não-Repúdio:');

  await test('Auditoria corporativa registra eventos de Nível 1, Nível 2 e Execução', () => {
    const logs = accessAuditService.getLogs();
    assert(logs.length > 0, 'Deve conter registros na auditoria corporativa');

    const hasL1 = logs.some(l => l.action === 'APPROVAL_LEVEL1');
    const hasExecuted = logs.some(l => l.action === 'APPROVAL_LEVEL2' || l.action === 'APPROVAL_GRANTED');
    const hasResubmit = logs.some(l => l.action === 'APPROVAL_RESUBMITTED');

    assert(hasL1, 'Auditoria deve registrar APPROVAL_LEVEL1');
    assert(hasExecuted, 'Auditoria deve registrar APPROVAL_LEVEL2 ou APPROVAL_GRANTED');
    assert(hasResubmit, 'Auditoria deve registrar APPROVAL_RESUBMITTED');
  });

  console.log('\n====================================================================');
  console.log(`SUCESSO: ${passedTests}/${totalTests} testes dos MEGA PACOTES 2 & 3 passaram com 100%!`);
  console.log('====================================================================\n');
}

run().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Falha crítica na suíte dos Mega Pacotes 2 & 3:', err);
  process.exit(1);
});
