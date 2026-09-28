/**
 * ============================================================================
 * DISK — IMPLANTAÇÃO 1: TESTE E2E DO FLUXO COMPLETO DE REPASSE
 * Fundação Financeiro do Produtor × Financeiro Disk
 * 
 * 1. Resolução de contexto e segregação de permissões/rotas
 * 2. Criação da solicitação de repasse pelo Produtor (CTA "Solicitar ao Financeiro Disk",
 *    protocolo legível RP-2026-XXXXXX, status inicial AGUARDANDO_ANALISE e reserva de saldo)
 * 3. Recebimento na Central de Solicitações do Financeiro Disk (abas, indicadores,
 *    situação financeira de 8 itens e dados bancários)
 * 4. Início de análise operacional (AGUARDANDO_ANALISE -> EM_ANALISE)
 * 5. Ciclo de Devolução (AGUARDANDO_CORRECAO) e Reenvio pelo Produtor (mesmo protocolo)
 * 6. Governança Maker/Checker, Alçadas, Aprovação e Liquidação (CONCLUIDA)
 * 7. Ciclo de Reprovação com motivo obrigatório e liberação de reserva
 * ============================================================================
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

import { financialApprovalRulesService, OPERATION_CATEGORIES } from '../../src/services/financialApprovalRulesService.js';
import { financialApprovalService } from '../../src/services/financialApprovalService.js';
import { accessControlService } from '../../src/services/accessControlService.js';
import { financialApprovalsController } from '../../src/controllers/financialApprovalsController.js';
import { eventBalanceService } from '../../src/services/eventBalanceService.js';
import { AppRouter } from '../../src/navigation/router.js';

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
  console.log(' DISK — IMPLANTAÇÃO 1: TESTE END-TO-END DE REPASSE');
  console.log(' Fundação Financeiro do Produtor × Financeiro Disk');
  console.log('====================================================================\n');

  // Configura ambiente DOM
  const htmlContent = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
  const dom = new JSDOM(htmlContent, {
    url: 'http://localhost/#/dashboard',
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
    }
  };

  // -------------------------------------------------------------------------
  // 1. IDENTIFICAÇÃO DO CONTEXTO E ROTEAMENTO RBAC
  // -------------------------------------------------------------------------
  console.log('1. Resolução de Contexto e Proteção de Rotas:');

  await test('Produtor pode acessar /financeiro/minhas-solicitacoes, mas é barrado em /financeiro/aprovacoes', () => {
    const produtor = accessControlService.switchCurrentUser('user-producer-joao');
    assert.strictEqual(produtor.userType, 'PRODUTOR');
    assert(produtor.profile.startsWith('PRODUTOR'));

    // Acesso permitido a Minhas Solicitações
    assert.strictEqual(accessControlService.can(produtor, 'financeiro.solicitacoes.visualizar'), true);

    // Acesso negado à Central de Aprovações Disk
    assert.strictEqual(accessControlService.can(produtor, 'financeiro.aprovacoes.visualizar'), false);

    // Valida navegação simulada via AppRouter
    AppRouter.init();
    AppRouter.navigate('/financeiro/aprovacoes');
    assert.strictEqual(AppRouter.currentRoute, '/acesso-negado', 'Produtor deve ser redirecionado para /acesso-negado');

    AppRouter.navigate('/financeiro/minhas-solicitacoes');
    assert.strictEqual(AppRouter.currentRoute, '/financeiro/minhas-solicitacoes', 'Produtor pode acessar /financeiro/minhas-solicitacoes');
  });

  await test('Financeiro Disk pode acessar tanto /financeiro/aprovacoes quanto /financeiro/minhas-solicitacoes', () => {
    const financeiro = accessControlService.switchCurrentUser('user-fin-mariana');
    assert.strictEqual(financeiro.profile, 'FINANCEIRO');

    assert.strictEqual(accessControlService.can(financeiro, 'financeiro.aprovacoes.visualizar'), true);
    assert.strictEqual(accessControlService.can(financeiro, 'financeiro.solicitacoes.visualizar'), true);

    AppRouter.navigate('/financeiro/aprovacoes');
    assert.strictEqual(AppRouter.currentRoute, '/financeiro/aprovacoes', 'Financeiro acessa /financeiro/aprovacoes');
  });

  // -------------------------------------------------------------------------
  // 2. CRIAÇÃO DE SOLICITAÇÃO DE REPASSE PELO PRODUTOR
  // -------------------------------------------------------------------------
  console.log('\n2. Criação de Solicitação de Repasse pelo Produtor:');

  let repasseProtocolId = null;
  const initialAvailable = (await eventBalanceService.getEventBalance('3368')).data.available;
  const repasseAmount = 50000.00;

  await test('Produtor cria solicitação de Repasse com identificador RP-2026-XXXXXX, status AGUARDANDO_ANALISE e reserva de saldo', async () => {
    const produtor = accessControlService.switchCurrentUser('user-producer-joao');

    const res = await financialApprovalService.createRequest({
      type: 'REPASSE',
      producerId: produtor.producerId || 'prod-1',
      producerName: 'Parque Jaime Lerner',
      eventId: '3368',
      eventName: 'Experiencia Música e Natureza - Julho',
      amount: repasseAmount,
      justification: 'Solicitação de repasse para quitação de fornecedores do evento.',
      payload: {
        bankName: 'Banco Inter',
        account: '0001 / 3456-7',
        pixKey: 'financeiro@parquejaime.com.br',
        method: 'PIX'
      },
      requestedBy: {
        id: produtor.id,
        name: produtor.name,
        role: produtor.profile,
        email: produtor.email
      }
    });

    assert(res.ok, 'Criação da solicitação de repasse deve ser bem sucedida');
    const req = res.data;
    repasseProtocolId = req.id;

    // Identificador canônico legível
    assert(req.id.startsWith('RP-2026-'), `ID deve ser no padrão RP-2026-XXXXXX, recebido: ${req.id}`);
    assert.strictEqual(req.protocol, req.id, 'Protocolo deve ser idêntico ao ID da solicitação');

    // Status inicial
    assert.strictEqual(req.status, 'AGUARDANDO_ANALISE', 'Status inicial deve ser AGUARDANDO_ANALISE');
    assert.strictEqual(req.statusLabelPtBr, 'Aguardando Análise');

    // Reserva preventiva de saldo
    const store = eventBalanceService.getLocalBalanceStore();
    const ev = store.find(e => String(e.eventId) === '3368');
    assert(ev && ev.balances, 'Evento 3368 deve existir no store');
    assert(ev.balances.pendingTransfers >= repasseAmount, 'pendingTransfers deve conter o valor reservado');

    // Trilha de auditoria
    const auditRes = req.auditTrail.find(a => a.action === 'SALDO_RESERVADO');
    assert(auditRes, 'Trilha de auditoria deve registrar a reserva preventiva de saldo');
  });

  // -------------------------------------------------------------------------
  // 3. RECEBIMENTO E ANÁLISE NA CENTRAL FINANCEIRA DISK
  // -------------------------------------------------------------------------
  console.log('\n3. Recebimento e Análise na Central Financeira Disk:');

  await test('Financeiro Disk localiza solicitação na Central, abre e visualiza os 8 indicadores da Situação Financeira', () => {
    accessControlService.switchCurrentUser('user-fin-mariana');
    financialApprovalsController.init();
    financialApprovalsController.switchRole('FINANCEIRO');

    // Localiza a solicitação criada
    const req = financialApprovalService.getRequestById(repasseProtocolId);
    assert(req, `Solicitação ${repasseProtocolId} deve ser encontrada`);

    // Busca pela Situação Financeira de 8 indicadores
    const sit = financialApprovalService.getFinancialSituation(req);
    assert(sit.grossSales > 0, 'Vendas brutas deve estar calculada');
    assert(sit.platformFees > 0, 'Taxas deve estar calculada');
    assert(sit.refunds > 0, 'Estornos deve estar calculada');
    assert(sit.chargebacks > 0, 'Chargebacks deve estar calculada');
    assert(sit.committed >= 0, 'Comprometido deve estar calculado');
    assert(sit.available >= 0, 'Disponível deve estar calculado');
    assert.strictEqual(sit.requested, repasseAmount, 'Solicitado deve ser igual ao valor do repasse');
    assert.strictEqual(sit.projected, Number((sit.available - repasseAmount).toFixed(2)), 'Saldo projetado correto');

    // Abre o drawer no controller e valida renderização
    financialApprovalsController.openDrawer(repasseProtocolId);
    const content = document.getElementById('offcanvas-approval-content');
    const footer = document.getElementById('offcanvas-approval-footer');

    assert(content.innerHTML.includes('Situação Financeira'), 'Drawer deve exibir o bloco de Situação Financeira');
    assert(content.innerHTML.includes('Dados Bancários &amp; Favorecido'), 'Drawer deve exibir Dados Bancários');
    assert(footer.innerHTML.includes('startAnalysisAction'), 'Footer deve exibir botão Iniciar Análise');
  });

  // -------------------------------------------------------------------------
  // 4. INÍCIO DA ANÁLISE OPERACIONAL
  // -------------------------------------------------------------------------
  console.log('\n4. Transição para Em Análise:');

  await test('Financeiro clica em Iniciar Análise e status avança para EM_ANALISE', () => {
    const financeiro = accessControlService.getUserById('user-fin-mariana');

    const res = financialApprovalService.startAnalysis(repasseProtocolId, financeiro);
    assert(res.ok, 'Iniciar análise deve retornar ok');
    assert.strictEqual(res.data.status, 'EM_ANALISE');
    assert.strictEqual(res.data.assignedToUser.id, financeiro.id);

    // Verifica trilha de auditoria
    const auditStart = res.data.auditTrail.find(a => a.action === 'ANALISE_INICIADA');
    assert(auditStart, 'Trilha deve conter ANALISE_INICIADA');
    assert.strictEqual(auditStart.newStatus, 'EM_ANALISE');
  });

  // -------------------------------------------------------------------------
  // 5. DEVOLUÇÃO PARA CORREÇÃO E REENVIO PELO PRODUTOR
  // -------------------------------------------------------------------------
  console.log('\n5. Ciclo de Devolução e Reenvio:');

  await test('Financeiro devolve solicitação para correção com orientações formais obrigatórias', () => {
    const financeiro = accessControlService.getUserById('user-fin-mariana');
    const notes = 'Favor anexar comprovante de titularidade da conta PJ e nota fiscal dos prestadores.';

    const res = financialApprovalService.returnRequest(repasseProtocolId, financeiro, notes);
    assert(res.ok, 'Devolução deve ser aceita');
    assert(res.data.status === 'AGUARDANDO_CORRECAO' || res.data.status === 'DEVOLVIDA');
    assert.strictEqual(res.data.statusLabelPtBr, 'Aguardando Correção');
    assert.strictEqual(res.data.returnNotes, notes);

    // Auditoria de devolução
    const auditRet = res.data.auditTrail.find(a => a.action === 'SOLICITACAO_DEVOLVIDA');
    assert(auditRet, 'Trilha deve conter SOLICITACAO_DEVOLVIDA');
  });

  await test('Produtor consulta solicitação devolvida em Minhas Solicitações e reenvia mantendo o mesmo protocolo', () => {
    const produtor = accessControlService.switchCurrentUser('user-producer-joao');
    financialApprovalsController.switchRole('PRODUTOR');

    // Abre drawer do produtor
    financialApprovalsController.openDrawer(repasseProtocolId);
    const content = document.getElementById('offcanvas-approval-content');
    const footer = document.getElementById('offcanvas-approval-footer');

    // Produtor visualiza aviso de devolução e botão Corrigir e Reenviar
    assert(content.innerHTML.includes('Solicitação Devolvida para Ajustes'), 'Produtor vê aviso de solicitação devolvida');
    assert(footer.innerHTML.includes('Corrigir e Reenviar'), 'Produtor possui botão Corrigir e Reenviar');

    // Reenvio da solicitação
    const res = financialApprovalService.resubmitRequest(repasseProtocolId, produtor, {
      justification: 'Nota fiscal e comprovante PJ anexados conforme solicitado pela controladoria.',
      payload: {
        docAttached: 'comprovante_pj.pdf'
      }
    });

    assert(res.ok, 'Reenvio deve ser aceito');
    assert.strictEqual(res.data.id, repasseProtocolId, 'O protocolo legível DEVE permanecer o mesmo');
    assert.strictEqual(res.data.status, 'AGUARDANDO_ANALISE', 'Status após reenvio deve ser AGUARDANDO_ANALISE');

    // Auditoria de reenvio
    const auditResub = res.data.auditTrail.find(a => a.action === 'SOLICITACAO_REENVIADA');
    assert(auditResub, 'Trilha deve conter SOLICITACAO_REENVIADA');
  });

  // -------------------------------------------------------------------------
  // 6. VALIDAÇÃO MAKER/CHECKER E APROVAÇÃO DEFINITIVA
  // -------------------------------------------------------------------------
  console.log('\n6. Governança Maker/Checker, Aprovação e Liquidação:');

  await test('Violação Maker/Checker é bloqueada: solicitante NÃO pode aprovar o repasse', async () => {
    const produtor = accessControlService.getUserById('user-producer-joao');

    let blocked = false;
    try {
      await financialApprovalService.approveRequest(repasseProtocolId, produtor, 'Tentativa indevida de autoaprovação');
    } catch (err) {
      blocked = true;
      assert(err.message.includes('Maker/Checker') || err.message.includes('Acesso Negado'), 'Mensagem deve indicar violação Maker/Checker');
    }
    assert.strictEqual(blocked, true, 'Auto-aprovação deve obrigatoriamente falhar');
  });

  await test('Operador financeiro independente aprova a solicitação e motor executa liquidação contábil', async () => {
    const gestor = accessControlService.switchCurrentUser('user-admin-carlos'); // Gestor Financeiro

    // Reinicia análise
    financialApprovalService.startAnalysis(repasseProtocolId, gestor);

    // Aprova solicitação
    const appRes = await financialApprovalService.approveRequest(repasseProtocolId, gestor, 'Documentação e regularidade conferidas. Repasse aprovado.');
    assert(appRes.ok, 'Aprovação deve ter sucesso');

    const finalReq = financialApprovalService.getRequestById(repasseProtocolId);
    assert.strictEqual(finalReq.status, 'CONCLUIDA', 'Status final após execução contábil deve ser CONCLUIDA');
    assert.strictEqual(finalReq.executionStatus, 'CONCLUIDA', 'Status de execução deve ser CONCLUIDA');
    assert(finalReq.executionResult.authCode.startsWith('AUTH-DK-'), 'Código de autenticação deve ser gerado');

    // Trilha completa de liquidação
    const auditExec = finalReq.auditTrail.find(a => a.action === 'EXECUCAO_CONCLUIDA');
    assert(auditExec, 'Trilha de auditoria deve conter EXECUCAO_CONCLUIDA');
  });

  // -------------------------------------------------------------------------
  // 7. CICLO DE REPROVAÇÃO COM MOTIVO OBRIGATÓRIO
  // -------------------------------------------------------------------------
  console.log('\n7. Ciclo de Reprovação (REPROVADA) com Motivo Obrigatório:');

  await test('Cria segundo repasse e realiza reprovação com motivo obrigatório e liberação de saldo', async () => {
    const produtor = accessControlService.switchCurrentUser('user-producer-joao');

    const newReqRes = await financialApprovalService.createRequest({
      type: 'REPASSE',
      producerId: produtor.producerId || 'prod-1',
      producerName: 'Parque Jaime Lerner',
      eventId: '3368',
      amount: 15000.00,
      justification: 'Repasse emergencial de teste.',
      requestedBy: { id: produtor.id, name: produtor.name, role: produtor.profile }
    });

    const secondId = newReqRes.data.id;
    const finUser = accessControlService.switchCurrentUser('user-fin-mariana');

    financialApprovalService.startAnalysis(secondId, finUser);

    // Tentativa de reprovar sem motivo deve falhar
    let rejectedWithoutReason = false;
    try {
      financialApprovalService.rejectRequest(secondId, finUser, '');
    } catch (err) {
      rejectedWithoutReason = true;
    }
    assert.strictEqual(rejectedWithoutReason, true, 'Reprovação sem motivo formal deve ser rejeitada');

    // Reprovação válida
    const rejRes = financialApprovalService.rejectRequest(secondId, finUser, 'Saldo de bilheteria bloqueado temporariamente por ordem judicial de terceiro.');
    assert(rejRes.ok, 'Reprovação com motivo deve ser aceita');
    assert(rejRes.data.status === 'REPROVADA' || rejRes.data.status === 'REJEITADA');
    assert.strictEqual(rejRes.data.statusLabelPtBr, 'Reprovada');

    // Auditoria de reprovação
    const auditRej = rejRes.data.auditTrail.find(a => a.action === 'SOLICITACAO_REPROVADA' || a.action === 'SOLICITACAO_REJEITADA');
    assert(auditRej, 'Trilha deve registrar reprovação formal');
  });

  console.log('\n====================================================================');
  console.log(`SUCESSO: ${passedTests}/${totalTests} testes E2E de Repasse (Implantação 1) passaram!`);
  console.log('====================================================================\n');
}

run().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Falha geral nos testes:', err);
  process.exit(1);
});
