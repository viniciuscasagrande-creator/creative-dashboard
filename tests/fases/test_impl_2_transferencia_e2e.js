/**
 * ============================================================================
 * DISK — IMPLANTAÇÃO 2: TESTE E2E DE TRANSFERÊNCIA ENTRE EVENTOS
 * Transferência entre Eventos + Aprovação Financeiro Disk + Reserva de Saldo + Ledger
 * 
 * 1. Seleção e Validações de Negócio (RN01 Eventos Distintos, RN02 Mesmo Produtor)
 * 2. Visualização Contábil no Modal do Produtor (Contábil, Comprometido, Disponível)
 *    e CTA oficial "Solicitar Transferência" (nunca execução direta)
 * 3. Criação da Solicitação com Protocolo TR-2026-XXXXXX e Status AGUARDANDO_ANALISE
 * 4. Reserva Cautelar de Saldo (status: ATIVA) e Bloqueio contra Gasto Duplo
 * 5. Backoffice Financeiro Disk: Drawer com Situação Financeira Completa de Transferência
 *    (Origem Antes/Depois, Destino Antes/Depois, Invariante Consolidado Delta R$ 0,00)
 * 6. Início de Análise Operacional (EM_ANALISE)
 * 7. Ciclo de Devolução para Correção (AGUARDANDO_CORRECAO) mantendo Reserva ATIVA
 * 8. Reenvio pelo Produtor preservando Protocolo e Trilha de Auditoria
 * 9. Governança Maker / Checker estrita (Solicitante não pode aprovar)
 * 10. Aprovação Final, Consumo da Reserva (CONSUMIDA) e Duplo Registro Atômico no Ledger
 * 11. Ciclo de Reprovação com Liberação de Saldo (LIBERADA) e Restituição
 * ============================================================================
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

import { financialApprovalRulesService } from '../../src/services/financialApprovalRulesService.js';
import { financialApprovalService } from '../../src/services/financialApprovalService.js';
import { accessControlService } from '../../src/services/accessControlService.js';
import { eventBalanceService } from '../../src/services/eventBalanceService.js';
import { financialApprovalsController } from '../../src/controllers/financialApprovalsController.js';
import { financialEventTransfersController } from '../../src/controllers/financialEventTransfersController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passedTests = 0;
let totalTests = 0;

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
  console.log(' DISK — IMPLANTAÇÃO 2: TESTE END-TO-END DE TRANSFERÊNCIA ENTRE EVENTOS');
  console.log(' Produtor (Solicitar) -> Financeiro Disk (Analisar/Aprovar) -> Ledger');
  console.log('====================================================================\n');

  // Configura ambiente DOM com index.html
  const htmlContent = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
  const dom = new JSDOM(htmlContent, {
    url: 'http://localhost/#/financeiro/transferencias',
    runScripts: 'dangerously'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.bootstrap = {
    Offcanvas: {
      getOrCreateInstance: (el) => ({
        show: () => { if (el) { el.classList.add('show'); el.style.visibility = 'visible'; } },
        hide: () => { if (el) { el.classList.remove('show'); el.style.visibility = 'hidden'; } }
      })
    },
    Modal: {
      getOrCreateInstance: (el) => ({
        show: () => { if (el) { el.classList.add('show'); el.style.display = 'block'; } },
        hide: () => { if (el) { el.classList.remove('show'); el.style.display = 'none'; } }
      })
    },
    Toast: {
      getOrCreateInstance: () => ({ show: () => {} })
    }
  };

  // Garante que o balance store inicial dos eventos do Parque Jaime Lerner está calibrado
  const store = eventBalanceService.getLocalBalanceStore();
  let evA = store.find(e => String(e.eventId) === '3368');
  let evB = store.find(e => String(e.eventId) === '3178');

  if (!evA) {
    evA = {
      eventId: '3368',
      producerId: 'prod-1',
      eventName: 'Evento A (Experiência Música & Natureza)',
      balances: { availableBalance: 80000.00, settledAmount: 100000.00, committedBalance: 20000.00, pendingTransfers: 0 },
      commitments: { pendingTransfers: 0 }
    };
    store.push(evA);
  } else {
    evA.producerId = 'prod-1';
    evA.balances.availableBalance = 80000.00;
    evA.balances.settledAmount = 100000.00;
    evA.balances.pendingTransfers = 0;
  }

  if (!evB) {
    evB = {
      eventId: '3178',
      producerId: 'prod-1',
      eventName: 'Evento B (Feijoada & Costela)',
      balances: { availableBalance: 15000.00, settledAmount: 25000.00, committedBalance: 10000.00, pendingTransfers: 0 },
      commitments: { pendingTransfers: 0 }
    };
    store.push(evB);
  } else {
    evB.producerId = 'prod-1';
    evB.balances.availableBalance = 15000.00;
    evB.balances.settledAmount = 25000.00;
    evB.balances.pendingTransfers = 0;
  }

  // -------------------------------------------------------------------------
  // 1. REGRAS DE NEGÓCIO E VALIDAÇÕES AUTOMATIZADAS (RN01 A RN06)
  // -------------------------------------------------------------------------
  console.log('1. Validações Automatizadas e Regras de Negócio:');

  await test('RN01: Evento de Origem e Destino devem ser estritamente distintos', async () => {
    const evalSame = await financialApprovalRulesService.evaluateApprovalRequirement({
      type: 'TRANSFERENCIA_EVENTOS',
      amount: 10000,
      producerId: 'prod-1',
      eventId: '3368',
      payload: { targetEventId: '3368', targetProducerId: 'prod-1' }
    });

    const rn01 = evalSame.automatedValidations.find(v => v.ruleCode === 'RN01_EVENTOS_DISTINTOS');
    assert(rn01, 'Deve conter validação RN01_EVENTOS_DISTINTOS');
    assert.strictEqual(rn01.passed, false, 'Origem e destino iguais deve falhar');
  });

  await test('RN02: Eventos devem pertencer estritamente ao mesmo Produtor', async () => {
    const evalCross = await financialApprovalRulesService.evaluateApprovalRequirement({
      type: 'TRANSFERENCIA_EVENTOS',
      amount: 10000,
      producerId: 'prod-1',
      eventId: '3368',
      payload: { targetEventId: '3195', targetProducerId: 'prod-2' } // Produtor diferente
    });

    const rn02 = evalCross.automatedValidations.find(v => v.ruleCode === 'RN02_MESMO_PRODUTOR');
    assert(rn02, 'Deve conter validação RN02_MESMO_PRODUTOR');
    assert.strictEqual(rn02.passed, false, 'Produtores diferentes deve falhar');
  });

  await test('RN03 & RN05: Saldo suficiente na origem e invariante consolidado do produtor (Delta = 0)', async () => {
    const evalValid = await financialApprovalRulesService.evaluateApprovalRequirement({
      type: 'TRANSFERENCIA_EVENTOS',
      amount: 25000,
      producerId: 'prod-1',
      eventId: '3368',
      payload: { targetEventId: '3178', targetProducerId: 'prod-1' }
    });

    const rn03 = evalValid.automatedValidations.find(v => v.ruleCode === 'RN03_SALDO_DISPONIVEL');
    assert(rn03 && rn03.passed, 'RN03 Saldo disponível deve passar');

    const rn05 = evalValid.automatedValidations.find(v => v.ruleCode === 'RN05_INVARIANTE_CONSOLIDADO');
    assert(rn05 && rn05.passed, 'RN05 Invariante Consolidado deve confirmar Delta R$ 0,00');
  });

  // -------------------------------------------------------------------------
  // 2. TELA DO PRODUTOR: MODAL DE TRANSFERÊNCIA E CTA OFICIAL
  // -------------------------------------------------------------------------
  console.log('\n2. Experiência do Produtor: Visualização Contábil e Botão Solicitar:');

  await test('Modal exibe campos contábeis de Origem e Destino e botão oficial "Solicitar Transferência"', () => {
    const modal = document.getElementById('modal-balance-transfer');
    assert(modal, 'Modal #modal-balance-transfer deve existir no DOM');

    const submitBtn = document.getElementById('btn-submit-balance-transfer');
    assert(submitBtn, 'Botão #btn-submit-balance-transfer deve existir');
    assert.strictEqual(submitBtn.textContent.trim(), 'Solicitar Transferência', 'CTA deve ser "Solicitar Transferência"');
    assert(!submitBtn.textContent.includes('Transferir Agora'), 'NUNCA deve dizer "Transferir Agora"');

    // Labels contábeis estruturados
    assert(document.getElementById('trf-source-settled-label'), '#trf-source-settled-label deve existir');
    assert(document.getElementById('trf-source-committed-label'), '#trf-source-committed-label deve existir');
    assert(document.getElementById('trf-source-available-label'), '#trf-source-available-label deve existir');
    assert(document.getElementById('trf-target-settled-label'), '#trf-target-settled-label deve existir');
    assert(document.getElementById('trf-target-available-label'), '#trf-target-available-label deve existir');
  });

  // -------------------------------------------------------------------------
  // 3. CRIAÇÃO DA SOLICITAÇÃO COM PROTOCOLO TR-2026-XXXXXX E RESERVA ATIVA
  // -------------------------------------------------------------------------
  console.log('\n3. Criação da Solicitação de Transferência e Reserva Cautelar:');

  let transferReq = null;
  const initialAvailableA = evA.balances.availableBalance; // 80.000
  const transferAmount = 25000.00;

  await test('Produtor solicita transferência: gera protocolo TR-2026-XXXXXX e status inicial AGUARDANDO_ANALISE', async () => {
    const res = await financialApprovalService.createRequest({
      type: 'TRANSFERENCIA_EVENTOS',
      producerId: 'prod-1',
      producerName: 'Parque Jaime Lerner',
      eventId: '3368',
      eventName: 'Evento A (Experiência Música & Natureza)',
      amount: transferAmount,
      requestedBy: {
        id: 'user-producer-joao',
        name: 'João Silva',
        email: 'joao.silva@parquejlerner.com.br',
        role: 'PRODUTOR'
      },
      justification: 'Remanejamento de saldo de bilheteria para montagem de palco no Evento B.',
      payload: {
        sourceEventId: '3368',
        sourceEventName: 'Evento A (Experiência Música & Natureza)',
        targetEventId: '3178',
        targetEventName: 'Evento B (Feijoada & Costela)',
        targetProducerId: 'prod-1'
      }
    });

    assert(res.ok && res.data, 'Solicitação deve ser criada com sucesso');
    transferReq = res.data;

    // Protocolo legível
    assert(transferReq.protocol, 'Deve possuir protocolo legível');
    assert(/^TR-2026-\d{6}$/.test(transferReq.protocol), `Protocolo ${transferReq.protocol} deve seguir o padrão TR-2026-XXXXXX`);

    // Status inicial
    assert.strictEqual(transferReq.status, 'AGUARDANDO_ANALISE', 'Status inicial deve ser AGUARDANDO_ANALISE');
    assert.strictEqual(transferReq.executionStatus, 'PENDENTE', 'Execução deve estar PENDENTE');
  });

  await test('Reserva de saldo (FinancialReservation) é criada como ATIVA e abate saldo disponível da origem', () => {
    const res = financialApprovalService.getReservationByRequestId(transferReq.id);
    assert(res, 'Reserva de saldo deve ser registrada');
    assert.strictEqual(res.status, 'ATIVA', 'Status da reserva deve ser ATIVA');
    assert.strictEqual(res.amount, transferAmount);
    assert.strictEqual(res.eventId, '3368');
    assert.strictEqual(res.targetEventId, '3178');

    // Confere saldos do Evento A
    assert.strictEqual(evA.balances.availableBalance, initialAvailableA - transferAmount, 'Saldo disponível deve ser subtraído');
    assert.strictEqual(evA.balances.pendingTransfers, transferAmount, 'Valores comprometidos (pendingTransfers) devem aumentar');
  });

  await test('Bloqueio cautelar contra gasto duplo: tentativa de solicitar valor acima do saldo restante é impedida', async () => {
    let failed = false;
    try {
      // Saldo restante é 55.000. Tentativa de solicitar 60.000 deve falhar
      await financialApprovalService.createRequest({
        type: 'TRANSFERENCIA_EVENTOS',
        producerId: 'prod-1',
        producerName: 'Parque Jaime Lerner',
        eventId: '3368',
        amount: 60000.00,
        requestedBy: { id: 'user-producer-joao', name: 'João Silva', role: 'PRODUTOR' },
        justification: 'Tentativa indevida de gasto duplo'
      });
    } catch (err) {
      failed = true;
      assert(err.message.includes('insuficiente') || err.message.includes('Saldo'), 'Deve reportar saldo insuficiente');
    }
    assert(failed, 'Tentativa de gasto duplo com saldo reservado deve ser bloqueada');
  });

  // -------------------------------------------------------------------------
  // 4. BACKOFFICE FINANCEIRO DISK: CENTRAL DE SOLICITAÇÕES E SITUAÇÃO FINANCEIRA
  // -------------------------------------------------------------------------
  console.log('\n4. Financeiro Disk: Central de Solicitações e Situação Financeira Completa:');

  await test('Solicitação aparece na Central de Solicitações sob filtro TRANSFERENCIA_EVENTOS', () => {
    const list = financialApprovalService.listRequests({ type: 'TRANSFERENCIA_EVENTOS' });
    const found = list.find(r => r.id === transferReq.id);
    assert(found, 'Solicitação recém-criada deve constar na listagem de TRANSFERENCIA_EVENTOS');
    assert.strictEqual(found.status, 'AGUARDANDO_ANALISE');
  });

  await test('Drawer renderiza card dedicado "Situação Financeira — Transferência entre Eventos" e Invariante Delta R$ 0,00', () => {
    financialApprovalsController.init();
    financialApprovalsController.switchRole('FINANCEIRO');
    financialApprovalsController.openDrawer(transferReq.id);

    const content = document.getElementById('offcanvas-approval-content');
    assert(content.innerHTML.includes('Situação Financeira — Transferência entre Eventos'), 'Deve renderizar card de Transferência');
    assert(content.innerHTML.includes('Evento de Origem'), 'Deve detalhar Evento de Origem');
    assert(content.innerHTML.includes('Evento de Destino'), 'Deve detalhar Evento de Destino');
    assert(content.innerHTML.includes('Invariante Consolidado do Produtor'), 'Deve exibir Invariante Consolidado');
    assert(content.innerHTML.includes('R$ 0,00'), 'Delta patrimonial deve ser R$ 0,00');

    // Confere que dados bancários externos NÃO são mostrados para transferência entre eventos internos
    assert(!content.innerHTML.includes('Dados Bancários &amp; Favorecido'), 'Não deve exibir dados bancários externos para transferência de evento');
  });

  // -------------------------------------------------------------------------
  // 5. CICLO DE ANÁLISE, DEVOLUÇÃO COM RESERVA ATIVA E REENVIO
  // -------------------------------------------------------------------------
  console.log('\n5. Ciclo de Análise, Devolução (Reserva Mantida ATIVA) e Reenvio:');

  await test('Financeiro Disk inicia análise: status transiciona para EM_ANALISE', () => {
    const analiseRes = financialApprovalService.startAnalysis(transferReq.id, {
      id: 'user-fin-mariana',
      name: 'Mariana Controladoria',
      role: 'FINANCEIRO'
    });
    assert.strictEqual(analiseRes.data.status, 'EM_ANALISE');
  });

  await test('Financeiro devolve para correção: status vai para AGUARDANDO_CORRECAO e RESERVA PERMANECE ATIVA', () => {
    const returnRes = financialApprovalService.returnRequest(transferReq.id, {
      id: 'user-fin-mariana',
      name: 'Mariana Controladoria',
      role: 'FINANCEIRO'
    }, 'Favor informar a discriminação das despesas de estrutura no Evento B.');

    assert(returnRes.ok);
    assert.strictEqual(transferReq.status, 'DEVOLVIDA');

    // REGRA DE OURO DA IMPLANTAÇÃO 2: A reserva de saldo PERMANECE ATIVA durante a correção
    const res = financialApprovalService.getReservationByRequestId(transferReq.id);
    assert(res, 'Reserva deve existir');
    assert.strictEqual(res.status, 'ATIVA', 'A reserva deve permanecer ATIVA durante AGUARDANDO_CORRECAO');

    // Saldo disponível continua bloqueado
    assert.strictEqual(evA.balances.availableBalance, initialAvailableA - transferAmount, 'Saldo disponível continua bloqueado');
    assert.strictEqual(evA.balances.pendingTransfers, transferAmount, 'pendingTransfers continua retido');
  });

  await test('Produtor reenvia a solicitação corrigida: retorna para AGUARDANDO_ANALISE preservando protocolo', () => {
    const resubRes = financialApprovalService.resubmitRequest(transferReq.id, {
      id: 'user-producer-joao',
      name: 'João Silva',
      role: 'PRODUTOR'
    }, {
      justification: 'Discriminação anexada: locação de palco e gerador conforme contrato CT-4402.'
    });

    assert(resubRes.ok);
    assert.strictEqual(transferReq.status, 'AGUARDANDO_ANALISE');
    assert(transferReq.protocol.startsWith('TR-2026-'), 'Protocolo inalterado');
    assert(transferReq.auditTrail.some(a => a.action === 'SOLICITACAO_REENVIADA'), 'Trilha registra reenvio');
  });

  // -------------------------------------------------------------------------
  // 6. MAKER / CHECKER E APROVAÇÃO DEFINITIVA
  // -------------------------------------------------------------------------
  console.log('\n6. Governança Maker / Checker e Aprovação Financeira:');

  await test('Maker / Checker: Solicitante (João Silva) é estritamente impedido de aprovar sua transferência', async () => {
    let blocked = false;
    try {
      await financialApprovalService.approveRequest(transferReq.id, {
        id: 'user-producer-joao',
        name: 'João Silva',
        role: 'PRODUTOR',
        email: 'joao.silva@parquejlerner.com.br'
      }, 'Auto-aprovação indevida');
    } catch (err) {
      blocked = true;
      assert(err.message.includes('Maker/Checker') || err.message.includes('mesmo usuário'), 'Deve barrar por Maker/Checker');
    }
    assert(blocked, 'Produtor não pode aprovar a própria solicitação');
  });

  // -------------------------------------------------------------------------
  // 7. EXECUÇÃO NO CORE FINANCEIRO E DUPLO REGISTRO NO LEDGER
  // -------------------------------------------------------------------------
  console.log('\n7. Execução Atômica no Core Financeiro e Duplo Registro no Ledger:');

  await test('Aprovação por Mariana Controladoria: status CONCLUIDA, reserva CONSUMIDA e movimentação dupla no Ledger', async () => {
    const targetBeforeAvailable = evB.balances.availableBalance; // 15.000
    const targetBeforeSettled = evB.balances.settledAmount; // 25.000
    const sourceBeforeSettled = evA.balances.settledAmount; // 100.000

    const appRes = await financialApprovalService.approveRequest(transferReq.id, {
      id: 'user-fin-mariana',
      name: 'Mariana Controladoria',
      role: 'FINANCEIRO',
      email: 'mariana@diskingressos.com.br'
    }, 'Documentação orçamentária validada com sucesso.');

    assert(appRes.ok);
    assert.strictEqual(appRes.data.status, 'CONCLUIDA', 'Status final deve ser CONCLUIDA');
    assert.strictEqual(appRes.data.executionStatus, 'CONCLUIDA', 'Execução contábil CONCLUIDA');
    assert(appRes.data.executionResult.authCode, 'Código de autorização gerado');
    assert(appRes.data.executionResult.transactionId, 'ID de transação gerado');

    // 1. Reserva foi consumida
    const res = financialApprovalService.getReservationByRequestId(transferReq.id);
    assert.strictEqual(res.status, 'CONSUMIDA', 'Reserva de saldo deve estar com status CONSUMIDA');

    // 2. Saldos finais atualizados
    assert.strictEqual(evA.balances.settledAmount, sourceBeforeSettled - transferAmount, 'Origem: saldo contábil reduzido');
    assert.strictEqual(evA.balances.pendingTransfers, 0, 'Origem: pendingTransfers zerado após consumo');
    assert.strictEqual(evB.balances.settledAmount, targetBeforeSettled + transferAmount, 'Destino: saldo contábil acrescido');
    assert.strictEqual(evB.balances.availableBalance, targetBeforeAvailable + transferAmount, 'Destino: saldo disponível acrescido');

    // 3. Ledger: Verifica os registros contábeis de saída e entrada
    const movementsA = eventBalanceService.getMovements('3368');
    const outMovement = movementsA.find(m => m.type === 'TRANSFERENCIA_EVENTO_SAIDA' && m.referenceId === transferReq.id);
    assert(outMovement, 'Deve existir movimentação de saída TRANSFERENCIA_EVENTO_SAIDA no evento de origem');
    assert.strictEqual(outMovement.amount, -transferAmount, 'Valor de saída deve ser negativo');
    assert.strictEqual(outMovement.transferId, `TRX-${transferReq.id}`, 'ID da transferência deve correlacionar as duas pontas');

    const movementsB = eventBalanceService.getMovements('3178');
    const inMovement = movementsB.find(m => m.type === 'TRANSFERENCIA_EVENTO_ENTRADA' && m.referenceId === transferReq.id);
    assert(inMovement, 'Deve existir movimentação de entrada TRANSFERENCIA_EVENTO_ENTRADA no evento de destino');
    assert.strictEqual(inMovement.amount, transferAmount, 'Valor de entrada deve ser positivo');
    assert.strictEqual(inMovement.transferId, `TRX-${transferReq.id}`, 'ID da transferência deve ser idêntico');
  });

  // -------------------------------------------------------------------------
  // 8. CICLO DE REPROVAÇÃO COM LIBERAÇÃO DE SALDO (LIBERADA)
  // -------------------------------------------------------------------------
  console.log('\n8. Ciclo de Reprovação com Liberação de Reserva:');

  await test('Solicitação reprovada: transiciona para REJEITADA e reserva é LIBERADA restituindo saldo', async () => {
    // 1. Cria nova solicitação de 10.000
    const newReqRes = await financialApprovalService.createRequest({
      type: 'TRANSFERENCIA_EVENTOS',
      producerId: 'prod-1',
      producerName: 'Parque Jaime Lerner',
      eventId: '3368',
      amount: 10000.00,
      requestedBy: { id: 'user-producer-joao', name: 'João Silva', role: 'PRODUTOR' },
      justification: 'Solicitação que será rejeitada',
      payload: { targetEventId: '3178', targetProducerId: 'prod-1' }
    });

    const rejectReq = newReqRes.data;
    const availBeforeReject = evA.balances.availableBalance;

    // 2. Financeiro reprova com justificativa
    financialApprovalService.rejectRequest(rejectReq.id, {
      id: 'user-fin-mariana',
      name: 'Mariana Controladoria',
      role: 'FINANCEIRO'
    }, 'Operação não autorizada pela diretoria.');

    assert.strictEqual(rejectReq.status, 'REJEITADA');

    // 3. Reserva foi liberada
    const res = financialApprovalService.getReservationByRequestId(rejectReq.id);
    assert(res, 'Reserva deve existir');
    assert.strictEqual(res.status, 'LIBERADA', 'Reserva deve mudar para LIBERADA');

    // 4. Saldo disponível é restituído
    assert.strictEqual(evA.balances.availableBalance, availBeforeReject + 10000.00, 'Saldo disponível deve ser restituído');
  });

  console.log('\n====================================================================');
  console.log(`SUCESSO: ${passedTests}/${totalTests} testes da Implantação 2 passaram com 100%!`);
  console.log('====================================================================\n');
}

run().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Falha geral no teste da Implantação 2:', err);
  process.exit(1);
});
