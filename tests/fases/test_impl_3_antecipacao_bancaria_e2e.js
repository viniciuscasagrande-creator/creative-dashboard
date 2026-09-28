/**
 * ============================================================================
 * DISK — IMPLANTAÇÃO 3: TESTE END-TO-END DE ANTECIPAÇÃO & DADOS BANCÁRIOS
 * Antecipação de Recebíveis + Alteração de Dados Bancários + Snapshot Imutável
 * 
 * FLUXOS COBERTOS:
 * 1. Base Elegível e Simulação Oficial de Antecipação
 * 2. Solicitação de Antecipação pelo Produtor (Protocolo ANT-2026-XXXXXX e Bloqueio de Recebíveis)
 * 3. Validações Automáticas e Análise no Drawer do Financeiro Disk
 * 4. Workflow de Contraproposta / Condição Ajustada (Ajuste, Aceite e Recusa)
 * 5. Governança Maker/Checker e Aprovação da Antecipação com Liquidação no Ledger
 * 6. Visualização e Mascaramento LGPD de Dados Bancários Ativos
 * 7. Bloqueio de Solicitações Concorrentes de Alteração Bancária
 * 8. Solicitação de Alteração Bancária (BAN-2026-XXXXXX, Conta Ativa Mantida, Nova Pendente)
 * 9. Drawer com Comparativo Cadastral Lado a Lado (Conta Vigente vs Nova Proposta)
 * 10. Bloqueio de Aprovação por Operador N1 (Exige Nível 2 / Gestor Financeiro)
 * 11. Aprovação Atômica por Gestor Financeiro N2 (Antiga -> INATIVA_HISTORICA, Nova -> ATIVA)
 * 12. Regra Crítica de Imutabilidade do Snapshot: Repasse anterior mantém dados congelados
 * 13. Reprovação de Alteração Bancária: Proposta rejeitada e Conta Ativa preservada
 * ============================================================================
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

import { receivableAnticipationService } from '../../src/services/receivableAnticipationService.js';
import { producerBankAccountService } from '../../src/services/producerBankAccountService.js';
import { financialApprovalRulesService } from '../../src/services/financialApprovalRulesService.js';
import { financialApprovalService } from '../../src/services/financialApprovalService.js';
import { accessControlService } from '../../src/services/accessControlService.js';
import { eventBalanceService } from '../../src/services/eventBalanceService.js';
import { financialApprovalsController } from '../../src/controllers/financialApprovalsController.js';
import { receivableAnticipationController } from '../../src/controllers/receivableAnticipationController.js';
import { producerBankAccountController } from '../../src/controllers/producerBankAccountController.js';

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
  console.log(' DISK — IMPLANTAÇÃO 3: TESTE E2E ANTECIPAÇÃO & DADOS BANCÁRIOS');
  console.log(' Recebíveis + Simulação + Workflow Bancário + Snapshot Imutável');
  console.log('====================================================================\n');

  // Configura ambiente DOM com index.html
  const htmlPath = path.resolve(__dirname, '../../index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const dom = new JSDOM(htmlContent, { url: 'http://localhost:3000' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.alert = (msg) => console.log('    [UI Alert]:', msg);

  // Inicializa controllers
  financialApprovalsController.init();
  receivableAnticipationController.init();
  producerBankAccountController.init();

  // -------------------------------------------------------------------------
  console.log('PARTE A: ANTECIPAÇÃO DE RECEBÍVEIS\n');
  console.log('1. Base Elegível e Simulação Financeira:');

  await test('Calcula base elegível respeitando recebíveis futuros, reservas e retenções', async () => {
    const baseInfo = await receivableAnticipationService.calculateEligibleBase('3368', 'prod-1');
    assert(baseInfo.futureReceivables >= 100000, 'Deve apurar recebíveis futuros previstos');
    assert(baseInfo.eligibleBase > 0, 'Base elegível deve ser maior que zero');
    assert(baseInfo.contractRate === 2.5, 'Taxa contratual deve ser a configurada (2.5%)');
    assert(baseInfo.receivablesList.length >= 3, 'Deve listar parcelas futuras da agenda');
  });

  await test('Gera simulação oficial com disclaimer e detalhamento financeiro', async () => {
    const sim = await receivableAnticipationService.simulateAnticipation({
      eventId: '3368',
      producerId: 'prod-1',
      requestedAmount: 20000.00
    });

    assert.strictEqual(sim.requestedAmount, 20000.00);
    assert.strictEqual(sim.contractRate, 2.5);
    assert.strictEqual(sim.estimatedCost, 500.00, 'Custo estimado de 2.5% sobre 20.000 deve ser 500.00');
    assert.strictEqual(sim.estimatedNet, 19500.00, 'Líquido estimado deve ser 19.500,00');
    assert(sim.disclaimer.includes('Esta é uma simulação'), 'Deve conter disclaimer obrigatório');
    assert(sim.allocatedSchedule.length > 0, 'Deve alocar nas parcelas da agenda');
  });

  // -------------------------------------------------------------------------
  console.log('\n2. Criação da Solicitação de Antecipação pelo Produtor:');

  let anticipationRequestId = null;

  await test('Cria solicitação ANT-2026-XXXXXX com status AGUARDANDO_ANALISE e bloqueia recebíveis', async () => {
    const producerUser = accessControlService.getUserById('user-producer-joao');
    const res = await financialApprovalService.createRequest({
      type: 'ANTECIPACAO',
      producerId: 'prod-1',
      producerName: 'DiskIngressos Eventos Ltda',
      eventId: '3368',
      eventName: 'Experiência Música & Natureza',
      requestedBy: producerUser,
      amount: 20000.00,
      justification: 'Antecipação para quitação de fornecedores de montagem.'
    });

    assert(res.ok && res.data, 'Solicitação deve ser criada com sucesso');
    anticipationRequestId = res.data.id;
    assert(anticipationRequestId.startsWith('ANT-2026-'), `ID deve possuir prefixo ANT-2026-: ${anticipationRequestId}`);
    assert.strictEqual(res.data.status, 'AGUARDANDO_ANALISE', 'Status inicial deve ser AGUARDANDO_ANALISE');

    // Valida que os recebíveis foram bloqueados
    const baseInfo = await receivableAnticipationService.calculateEligibleBase('3368', 'prod-1');
    const locked = baseInfo.receivablesList.filter(r => r.status === 'BLOQUEADO_ANTECIPACAO' && r.lockedByRequestId === anticipationRequestId);
    assert(locked.length > 0, 'Recebíveis devem estar bloqueados com o ID da solicitação');
  });

  // -------------------------------------------------------------------------
  console.log('\n3. Análise pelo Financeiro Disk e Validações Automáticas:');

  await test('Drawer renderiza card de análise financeira e agenda de recebíveis considerados', () => {
    financialApprovalsController.switchRole('FINANCEIRO');
    financialApprovalsController.openDrawer(anticipationRequestId);

    const drawerContent = document.getElementById('offcanvas-approval-content');
    assert(drawerContent.innerHTML.includes('Análise Financeira da Antecipação'), 'Deve exibir card de Análise da Antecipação');
    assert(drawerContent.innerHTML.includes('Taxa Contratual'), 'Deve exibir taxa contratual');
    assert(drawerContent.innerHTML.includes('Valor Líquido Estimado'), 'Deve exibir valor líquido estimado');
    assert(drawerContent.innerHTML.includes('Agenda de Recebíveis Considerados'), 'Deve exibir tabela da agenda');
    assert(drawerContent.innerHTML.includes('Bloqueado'), 'Parcelas devem constar como Bloqueadas');
  });

  await test('Verifica presença das 7 validações automáticas do motor de regras', () => {
    const req = financialApprovalService.getRequestById(anticipationRequestId);
    const codes = req.automatedValidations.map(v => v.ruleCode);

    assert(codes.includes('RN_PRODUTOR_ATIVO'), 'Deve validar RN_PRODUTOR_ATIVO');
    assert(codes.includes('RN_EVENTO_VALIDO'), 'Deve validar RN_EVENTO_VALIDO');
    assert(codes.includes('RN_RECEBIVEIS_ELEGIVEIS'), 'Deve validar RN_RECEBIVEIS_ELEGIVEIS');
    assert(codes.includes('RN_CONTA_BANCARIA'), 'Deve validar RN_CONTA_BANCARIA');
    assert(codes.includes('RN_SEM_BLOQUEIO'), 'Deve validar RN_SEM_BLOQUEIO');
    assert(codes.includes('RN_TAXA_CONTRATUAL'), 'Deve validar RN_TAXA_CONTRATUAL');
    assert(codes.includes('RN_MAKER_CHECKER'), 'Deve validar RN_MAKER_CHECKER');
  });

  // -------------------------------------------------------------------------
  console.log('\n4. Workflow de Contraproposta / Condição Ajustada:');

  await test('Financeiro Disk propõe condição ajustada e status transiciona para AGUARDANDO_ACEITE_PRODUTOR', () => {
    const finActor = accessControlService.getUserById('user-admin-carlos');
    const res = financialApprovalService.adjustConditions(anticipationRequestId, finActor, {
      approvedAmount: 18000.00,
      approvedRate: 2.8,
      reason: 'Volume ajustado à alçada de risco da adquirente.'
    });

    assert(res.ok);
    const req = res.data;
    assert.strictEqual(req.status, 'AGUARDANDO_ACEITE_PRODUTOR');
    assert.strictEqual(req.adjustedCondition.approvedAmount, 18000.00);
    assert.strictEqual(req.adjustedCondition.approvedRate, 2.8);
  });

  await test('Produtor visualiza botões de aceite e aceita a condição ajustada', () => {
    financialApprovalsController.switchRole('PRODUTOR');
    financialApprovalsController.openDrawer(anticipationRequestId);

    const drawerFooter = document.getElementById('offcanvas-approval-footer');
    assert(drawerFooter.innerHTML.includes('acceptAdjustedConditionAction'), 'Produtor deve ver botão Aceitar Condição');
    assert(drawerFooter.innerHTML.includes('cancelAdjustedConditionAction'), 'Produtor deve ver botão Recusar / Cancelar');

    const producerUser = accessControlService.getUserById('user-producer-joao');
    const acceptRes = financialApprovalService.acceptAdjustedCondition(anticipationRequestId, producerUser);
    assert(acceptRes.ok);
    assert.strictEqual(acceptRes.data.amount, 18000.00, 'Valor da solicitação deve ser ajustado para 18.000');
    assert.strictEqual(acceptRes.data.status, 'AGUARDANDO_ANALISE');
  });

  // -------------------------------------------------------------------------
  console.log('\n5. Maker/Checker, Aprovação e Liquidação no Ledger:');

  await test('Maker/Checker impede que o produtor solicitante aprove a antecipação', async () => {
    const producerUser = accessControlService.getUserById('user-producer-joao');
    await assert.rejects(async () => {
      await financialApprovalService.approveRequest(anticipationRequestId, producerUser, 'Tentando autoaprovar');
    }, /Maker\/Checker/i);
  });

  await test('Gestor Financeiro aprova a antecipação: liquida no Ledger e marca recebíveis como ANTECIPADO', async () => {
    financialApprovalsController.switchRole('FINANCEIRO');
    const finActor = accessControlService.getUserById('user-admin-carlos');

    const approveRes = await financialApprovalService.approveRequest(anticipationRequestId, finActor, 'Operação conferida e autorizada.');
    assert(approveRes.ok);
    assert.strictEqual(approveRes.data.status, 'CONCLUIDA');
    assert.strictEqual(approveRes.data.executionStatus, 'CONCLUIDA');

    // Valida que os recebíveis passaram para ANTECIPADO
    const baseInfo = await receivableAnticipationService.calculateEligibleBase('3368', 'prod-1');
    const settledReceivables = baseInfo.receivablesList.filter(r => r.lockedByRequestId === anticipationRequestId);
    assert(settledReceivables.every(r => r.status === 'ANTECIPADO'), 'Todos os recebíveis alocados devem estar marcados como ANTECIPADO');

    // Valida lançamento contábil no Ledger do evento
    const movements = eventBalanceService.getMovements('3368');
    const antMovement = movements.find(m => m.type === 'ANTECIPACAO_LIQUIDADA' && m.referenceId === anticipationRequestId);
    assert(antMovement, 'Deve existir movimentação de ANTECIPACAO_LIQUIDADA no Ledger');
    assert(antMovement.amount > 0, 'Valor creditado deve ser positivo');
    assert.strictEqual(antMovement.grossAmount, 18000.00, 'Valor bruto deve ser 18.000,00');
  });

  // -------------------------------------------------------------------------
  console.log('\nPARTE B: ALTERAÇÃO DE DADOS BANCÁRIOS\n');
  console.log('6. Consulta e Mascaramento LGPD:');

  await test('Retorna dados bancários ativos com mascaramento de segurança', () => {
    const active = producerBankAccountService.getActiveAccount('prod-1');
    assert(active, 'Produtor prod-1 deve ter conta ativa');
    assert.strictEqual(active.status, 'ATIVA');
    assert.strictEqual(active.isDefault, true);

    const maskedAcc = producerBankAccountService.maskAccount(active.account);
    assert(maskedAcc.startsWith('•••••-'), `Conta deve ser mascarada: ${maskedAcc}`);
    assert(maskedAcc.endsWith(active.account.slice(-4)), 'Deve exibir apenas os últimos 4 dígitos');

    const maskedDoc = producerBankAccountService.maskDocument(active.document);
    assert(maskedDoc.includes('***'), `Documento deve ser mascarado: ${maskedDoc}`);
  });

  // -------------------------------------------------------------------------
  console.log('\n7. Snapshot Imutável de Repasses Pré-existentes:');

  let oldPayoutRequestId = null;

  await test('Cria repasse vinculado à conta ativa atual e captura snapshot imutável', async () => {
    const producerUser = accessControlService.getUserById('user-producer-joao');
    const res = await financialApprovalService.createRequest({
      type: 'REPASSE',
      producerId: 'prod-1',
      producerName: 'DiskIngressos Eventos Ltda',
      eventId: '3368',
      eventName: 'Experiência Música & Natureza',
      requestedBy: producerUser,
      amount: 15000.00,
      justification: 'Repasse programado com domicílio bancário Banco do Brasil.'
    });

    assert(res.ok);
    oldPayoutRequestId = res.data.id;
    assert(res.data.payload.bankAccountSnapshot, 'Repasse deve conter snapshot imutável da conta ativa no momento da criação');
    assert.strictEqual(res.data.payload.bankAccountSnapshot.bankCode, '001', 'Snapshot deve registrar Banco do Brasil (001)');
  });

  // -------------------------------------------------------------------------
  console.log('\n8. Solicitação de Alteração Bancária e Concorrência:');

  let bankChangeRequestId = null;

  await test('Produtor solicita alteração: gera protocolo BAN-2026-XXXXXX, mantém conta ativa e nova PENDENTE_APROVACAO', async () => {
    const producerUser = accessControlService.getUserById('user-producer-joao');
    const res = await financialApprovalService.createRequest({
      type: 'ALTERACAO_DADOS_BANCARIOS',
      producerId: 'prod-1',
      producerName: 'DiskIngressos Eventos Ltda',
      requestedBy: producerUser,
      amount: 0,
      justification: 'Transferência de domicílio para Banco Santander para centralização financeira.',
      payload: {
        bankCode: '033',
        bankName: 'Banco Santander',
        agency: '0082',
        account: '44810-9',
        accountType: 'Conta Corrente Pessoa Jurídica',
        holderName: 'DiskIngressos Eventos Ltda',
        document: '08.123.456/0001-99',
        pixKey: '12987654000100'
      }
    });

    assert(res.ok);
    bankChangeRequestId = res.data.id;
    assert(bankChangeRequestId.startsWith('BAN-2026-'), `Protocolo deve começar com BAN-2026-: ${bankChangeRequestId}`);
    assert.strictEqual(res.data.status, 'AGUARDANDO_ANALISE');

    // REGRA CRÍTICA: Conta antiga DEVE PERMANECER ATIVA!
    const activeAcc = producerBankAccountService.getActiveAccount('prod-1');
    assert.strictEqual(activeAcc.bankCode, '001', 'Conta Banco do Brasil deve permanecer ATIVA durante a análise');
    assert.strictEqual(activeAcc.status, 'ATIVA');

    // Nova conta deve estar PENDENTE_APROVACAO
    const pendingAcc = producerBankAccountService.getPendingAccount('prod-1');
    assert(pendingAcc, 'Deve existir conta com status PENDENTE_APROVACAO');
    assert.strictEqual(pendingAcc.bankCode, '033', 'Conta pendente deve ser Santander (033)');
  });

  await test('Bloqueia criação de solicitação bancária concorrente para o mesmo produtor', async () => {
    const producerUser = accessControlService.getUserById('user-producer-joao');
    await assert.rejects(async () => {
      await financialApprovalService.createRequest({
        type: 'ALTERACAO_DADOS_BANCARIOS',
        producerId: 'prod-1',
        producerName: 'DiskIngressos Eventos Ltda',
        requestedBy: producerUser,
        amount: 0,
        justification: 'Segunda tentativa simultânea.',
        payload: {
          bankCode: '237',
          agency: '1111',
          account: '22222-3'
        }
      });
    }, /já existe uma.*alteração bancária em andamento/i);
  });

  // -------------------------------------------------------------------------
  console.log('\n9. Drawer do Financeiro com Comparativo Cadastral Lado a Lado:');

  await test('Drawer renderiza comparativo DADOS ATUAIS vs DADOS SOLICITADOS e documentos anexados', () => {
    financialApprovalsController.switchRole('FINANCEIRO');
    financialApprovalsController.openDrawer(bankChangeRequestId);

    const drawerContent = document.getElementById('offcanvas-approval-content');
    assert(drawerContent.innerHTML.includes('Comparativo Cadastral — Alteração de Dados Bancários'), 'Deve exibir título de comparativo');
    assert(drawerContent.innerHTML.includes('DADOS ATUAIS (Conta Vigente)'), 'Deve exibir coluna de Dados Atuais');
    assert(drawerContent.innerHTML.includes('DADOS SOLICITADOS (Proposta)'), 'Deve exibir coluna de Dados Solicitados');
    assert(drawerContent.innerHTML.includes('Banco do Brasil (001)'), 'Conta atual deve ser Banco do Brasil');
    assert(drawerContent.innerHTML.includes('Banco Santander (033)'), 'Conta proposta deve ser Santander');
    assert(drawerContent.innerHTML.includes('Comprovante de Titularidade'), 'Deve exibir validação de comprovante anexado');
  });

  // -------------------------------------------------------------------------
  console.log('\n10. Restrição de Alçada Nível 2 / Gestor Financeiro:');

  await test('Operador de Nível 1 (Financeiro Operacional) é bloqueado ao tentar aprovar alteração bancária', async () => {
    const opLevel1 = accessControlService.getUserById('user-fin-mariana'); // Profile FINANCEIRO (Nível 1)
    await assert.rejects(async () => {
      await financialApprovalService.approveRequest(bankChangeRequestId, opLevel1, 'Tentando aprovar sem alçada N2');
    }, /Alçada Insuficiente/i);
  });

  // -------------------------------------------------------------------------
  console.log('\n11. Aprovação Atômica por Gestor Financeiro N2:');

  await test('Gestor Financeiro N2 aprova: ativa Santander como ATIVA e arquiva Banco do Brasil como INATIVA_HISTORICA', async () => {
    const gestorFinN2 = accessControlService.getUserById('user-admin-carlos'); // GESTOR_FINANCEIRO (Nível 2)

    const approveRes = await financialApprovalService.approveRequest(bankChangeRequestId, gestorFinN2, 'Documentos bancários conferidos com cartão CNPJ.');
    assert(approveRes.ok);
    assert.strictEqual(approveRes.data.status, 'CONCLUIDA');
    assert.strictEqual(approveRes.data.executionStatus, 'CONCLUIDA');

    // Valida a transição atômica
    const newActive = producerBankAccountService.getActiveAccount('prod-1');
    assert.strictEqual(newActive.bankCode, '033', 'Conta ATIVA agora deve ser Santander (033)');
    assert.strictEqual(newActive.status, 'ATIVA');
    assert.strictEqual(newActive.isDefault, true);

    const accounts = producerBankAccountService.getAccountsByProducer('prod-1');
    const oldAccount = accounts.find(a => a.bankCode === '001');
    assert.strictEqual(oldAccount.status, 'INATIVA_HISTORICA', 'Conta antiga deve estar INATIVA_HISTORICA');
    assert.strictEqual(oldAccount.isDefault, false, 'Conta antiga não deve ser default');
  });

  // -------------------------------------------------------------------------
  console.log('\n12. Proteção Absoluta de Snapshot Imutável de Repasses Existentes:');

  await test('Repasse pré-existente (criado antes da alteração) continua apontando para a conta antiga (Banco do Brasil 001)', () => {
    const oldReq = financialApprovalService.getRequestById(oldPayoutRequestId);
    assert(oldReq, 'Solicitação antiga deve existir');

    const bankDetails = financialApprovalService.getBankDetails(oldReq);
    assert.strictEqual(bankDetails.bankCode, '001', 'Repasse antigo DEVE continuar apontando para Banco do Brasil (001)');
    assert.strictEqual(bankDetails.account, '99201-0');
    assert.strictEqual(bankDetails.complianceStatus, 'CONTA_CONGELADA_SNAPSHOT');
  });

  await test('Novo repasse criado após a ativação bancária aponta para a nova conta ativa (Santander 033)', async () => {
    const producerUser = accessControlService.getUserById('user-producer-joao');
    const newPayoutRes = await financialApprovalService.createRequest({
      type: 'REPASSE',
      producerId: 'prod-1',
      producerName: 'DiskIngressos Eventos Ltda',
      eventId: '3368',
      eventName: 'Experiência Música & Natureza',
      requestedBy: producerUser,
      amount: 5000.00,
      justification: 'Novo repasse pós-ativação bancária.'
    });

    assert(newPayoutRes.ok);
    const bankDetails = financialApprovalService.getBankDetails(newPayoutRes.data);
    assert.strictEqual(bankDetails.bankCode, '033', 'Novo repasse deve apontar para o novo domicílio bancário (Santander 033)');
    assert.strictEqual(bankDetails.agency, '0082');
  });

  // -------------------------------------------------------------------------
  console.log('\n13. Reprovação de Alteração Bancária:');

  await test('Solicitação de alteração bancária reprovada marca conta proposta como REPROVADA e mantém a ativa', async () => {
    const producerUser = accessControlService.getUserById('user-producer-joao');
    const bankReq2 = await financialApprovalService.createRequest({
      type: 'ALTERACAO_DADOS_BANCARIOS',
      producerId: 'prod-1',
      producerName: 'DiskIngressos Eventos Ltda',
      requestedBy: producerUser,
      amount: 0,
      justification: 'Segunda alteração para teste de reprovação.',
      payload: {
        bankCode: '237',
        bankName: 'Banco Bradesco',
        agency: '3322',
        account: '55443-2',
        accountType: 'Conta Corrente Pessoa Jurídica',
        holderName: 'DiskIngressos Eventos Ltda',
        document: '08.123.456/0001-99'
      }
    });

    const gestorFinN2 = accessControlService.getUserById('user-admin-carlos');
    const rejRes = financialApprovalService.rejectRequest(bankReq2.data.id, gestorFinN2, 'Comprovante ilegível ou divergente do CNPJ.');
    assert(rejRes.ok);
    assert.strictEqual(rejRes.data.status, 'REJEITADA');

    // Conta ativa continua sendo Santander
    const currentActive = producerBankAccountService.getActiveAccount('prod-1');
    assert.strictEqual(currentActive.bankCode, '033', 'Conta ativa permanece Santander');
    assert.strictEqual(currentActive.status, 'ATIVA');

    // Conta proposta deve ser REPROVADA
    const accounts = producerBankAccountService.getAccountsByProducer('prod-1');
    const rejectedAcc = accounts.find(a => a.bankCode === '237');
    assert.strictEqual(rejectedAcc.status, 'REPROVADA');
    assert.strictEqual(rejectedAcc.rejectionReason, 'Comprovante ilegível ou divergente do CNPJ.');
  });

  console.log('\n====================================================================');
  console.log(`SUCESSO: ${passedTests}/${totalTests} testes de Antecipação e Dados Bancários passaram!`);
  console.log('====================================================================\n');
}

run().catch((err) => {
  console.error('\nFalha geral na suíte de testes:', err);
  process.exit(1);
});
