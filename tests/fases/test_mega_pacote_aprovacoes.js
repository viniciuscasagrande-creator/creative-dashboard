/**
 * Testes Automatizados — MEGA PACOTE: Perfil Financeiro + Central Unificada de Aprovações
 * Workflow Transversal Produtor ➔ Financeiro (Controladoria)
 * Governança Maker/Checker, Alçadas, SLA, Notificações Internas, Segurança de Saldo
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

import { financialApprovalRulesService } from '../../src/services/financialApprovalRulesService.js';
import { financialApprovalService } from '../../src/services/financialApprovalService.js';
import { financialApprovalNotificationService } from '../../src/services/financialApprovalNotificationService.js';
import { ROUTES } from '../../src/navigation/routes.js';

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

async function runAllTests() {
  console.log('====================================================================');
  console.log(' MEGA PACOTE: CENTRAL UNIFICADA DE APROVAÇÕES (PRODUTOR -> FINANCEIRO)');
  console.log('====================================================================\n');

  // -------------------------------------------------------------------------
  // 1. ESTRUTURA NO DOM (index.html) E ROTAS
  // -------------------------------------------------------------------------
  console.log('1. Verificação de Estrutura no DOM e Rotas:');

  await test('Verifica container principal #view-financial-approvals e submenu com badge', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    assert(html.includes('id="view-financial-approvals"'), 'Seção #view-financial-approvals deve existir');
    assert(html.includes('id="fin-nav-approvals-badge"'), 'Badge de aprovações #fin-nav-approvals-badge deve existir no menu lateral');
    assert(html.includes('Central Unificada de Aprovações Financeiras'), 'Título da tela deve estar presente');
  });

  await test('Verifica os 5 Cards de KPIs Superiores no DOM', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    assert(html.includes('id="kpi-appr-pending-count"'), '#kpi-appr-pending-count deve existir');
    assert(html.includes('id="kpi-appr-pending-amount"'), '#kpi-appr-pending-amount deve existir');
    assert(html.includes('id="kpi-appr-urgent-count"'), '#kpi-appr-urgent-count deve existir');
    assert(html.includes('id="kpi-appr-sla-expiring"'), '#kpi-appr-sla-expiring deve existir');
    assert(html.includes('id="kpi-appr-approved-today"'), '#kpi-appr-approved-today deve existir');
  });

  await test('Verifica seletor de perfil (Produtor vs Financeiro vs Admin) e abas de filtro', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    assert(html.includes('id="btn-profile-produtor"'), 'Botão perfil Produtor deve existir');
    assert(html.includes('id="btn-profile-financeiro"'), 'Botão perfil Financeiro deve existir');
    assert(html.includes('id="btn-profile-admin"'), 'Botão perfil Admin deve existir');
    assert(html.includes('id="tab-appr-todas"'), 'Aba Todas deve existir');
    assert(html.includes('id="tab-appr-pendentes"'), 'Aba Pendentes deve existir');
    assert(html.includes('id="tab-appr-devolvidas"'), 'Aba Devolvidas deve existir');
    assert(html.includes('id="tab-appr-aprovadas"'), 'Aba Aprovadas deve existir');
    assert(html.includes('id="tab-appr-rejeitadas"'), 'Aba Rejeitadas deve existir');
    assert(html.includes('id="table-financial-approvals-body"'), 'Tabela #table-financial-approvals-body deve existir');
  });

  await test('Verifica Offcanvas de Decisão e os 4 Modais Operacionais no DOM', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    assert(html.includes('id="offcanvas-approval-decision"'), 'Offcanvas #offcanvas-approval-decision deve existir');
    assert(html.includes('id="offcanvas-approval-content"'), '#offcanvas-approval-content deve existir');
    assert(html.includes('id="offcanvas-approval-footer"'), '#offcanvas-approval-footer deve existir');
    assert(html.includes('id="modal-approval-confirm-approve"'), 'Modal de aprovação deve existir');
    assert(html.includes('id="modal-approval-confirm-reject"'), 'Modal de rejeição deve existir');
    assert(html.includes('id="modal-approval-confirm-return"'), 'Modal de devolução deve existir');
    assert(html.includes('id="modal-approval-resubmit"'), 'Modal de reenvio do produtor deve existir');
  });

  await test('Verifica se a rota /financeiro/aprovacoes está mapeada para a view financial-approvals', () => {
    const route = ROUTES['/financeiro/aprovacoes'];
    assert(route, 'Rota /financeiro/aprovacoes deve estar definida em routes.js');
    assert.strictEqual(route.view, 'financial-approvals', 'View deve ser financial-approvals');
  });

  // -------------------------------------------------------------------------
  // 2. MOTOR DE REGRAS, ALÇADAS E POLÍTICAS
  // -------------------------------------------------------------------------
  console.log('\n2. Motor de Regras de Aprovação e Alçadas (financialApprovalRulesService):');

  await test('Verifica que todas as 11+ operações possuem políticas registradas', () => {
    const operations = [
      'REPASSE',
      'ANTECIPACAO',
      'TRANSFERENCIA_EVENTOS',
      'PAGAMENTO',
      'PAGAMENTO_LOTE',
      'PIX',
      'ALTERACAO_DADOS_BANCARIOS',
      'ESTORNO',
      'COMPRA',
      'CONTRATO',
      'ALTERACAO_TAXA',
      'ALTERACAO_REGRA_REPASSE',
      'DESPESA_EXTRAORDINARIA'
    ];

    for (const op of operations) {
      const meta = financialApprovalRulesService.getTypeMeta(op);
      assert(meta && meta.label, `Operação ${op} deve ter metadados definidos`);
    }
  });

  await test('Verifica escalonamento de alçadas por valor e tipo', async () => {
    // Repasse até 5k => Nível 1, Risco Baixo
    const r1 = await financialApprovalRulesService.evaluateApprovalRequirement({ type: 'REPASSE', amount: 4000 });
    assert.strictEqual(r1.approvalLevel, 'NIVEL_1');
    assert.strictEqual(r1.riskLevel, 'BAIXO');

    // Repasse entre 5k e 50k => Nível 1 (Financeiro responsável)
    const r2 = await financialApprovalRulesService.evaluateApprovalRequirement({ type: 'REPASSE', amount: 35000 });
    assert.strictEqual(r2.approvalLevel, 'NIVEL_1');
    assert.strictEqual(r2.riskLevel, 'MEDIO');

    // Repasse acima de 50k => Dupla Aprovação
    const r3 = await financialApprovalRulesService.evaluateApprovalRequirement({ type: 'REPASSE', amount: 80000 });
    assert.strictEqual(r3.approvalLevel, 'DUPLA_APROVACAO');
    assert.strictEqual(r3.riskLevel, 'ALTO');

    // Alteração de dados bancários => sempre aprovação crítica obrigatória
    const rBank = await financialApprovalRulesService.evaluateApprovalRequirement({ type: 'ALTERACAO_DADOS_BANCARIOS', amount: 0 });
    assert.strictEqual(rBank.requiresApproval, true);
    assert.strictEqual(rBank.approvalLevel, 'NIVEL_2');
    assert.strictEqual(rBank.riskLevel, 'CRITICO');
  });

  await test('Calcula status de SLA e metadados visuais com precisão', () => {
    const expired = financialApprovalRulesService.calculateSlaStatus(new Date(Date.now() - 3600000).toISOString(), 'PENDENTE');
    assert.strictEqual(expired, 'VENCIDO');

    const inTime = financialApprovalRulesService.calculateSlaStatus(new Date(Date.now() + 10800000).toISOString(), 'PENDENTE');
    assert.strictEqual(inTime, 'NO_PRAZO');

    const metaRepasse = financialApprovalRulesService.getTypeMeta('REPASSE');
    assert.strictEqual(metaRepasse.label, 'Repasse');
    assert(metaRepasse.icon);
  });

  // -------------------------------------------------------------------------
  // 3. FLUXO TRANSVERSAL DE APROVAÇÃO E GOVERNANÇA MAKER/CHECKER
  // -------------------------------------------------------------------------
  console.log('\n3. Workflow Transversal Produtor ➔ Financeiro (financialApprovalService):');

  await test('Verifica o carregamento dos dados de demonstração (17 pendentes, modelo APR-2026-00142)', () => {
    const stats = financialApprovalService.getStats();
    assert(stats.pendingCount >= 10, 'Deve ter fila inicial de pendências');
    assert(stats.pendingAmount > 100000, 'Volume pendente deve ser relevante');

    const modelReq = financialApprovalService.getRequestById('APR-2026-00142');
    assert(modelReq, 'Solicitação modelo APR-2026-00142 (Parque Jaime Lerner - R$ 35.000) deve existir');
    assert.strictEqual(modelReq.producerName, 'Parque Jaime Lerner');
    assert.strictEqual(modelReq.amount, 35000);
    assert.strictEqual(modelReq.type, 'TRANSFERENCIA_EVENTOS');
  });

  await test('Garante cumprimento rigoroso do princípio Maker/Checker (solicitante não pode aprovar)', async () => {
    // Cria solicitação feita pelo produtor João Silva
    const createRes = await financialApprovalService.createRequest({
      type: 'REPASSE',
      producerId: 'prod-teste',
      producerName: 'Produtor Teste MakerChecker',
      eventId: 3368,
      eventName: 'Evento Teste',
      amount: 5000,
      requestedBy: {
        id: 'user-producer-joao',
        name: 'João Silva',
        role: 'PRODUTOR',
        email: 'joao@teste.com'
      },
      justification: 'Solicitação de repasse quinzenal'
    });

    const newReq = createRes.data;
    assert(newReq && newReq.id, 'Solicitação deve ser gerada');

    // Tentativa do PRÓPRIO João Silva aprovar deve falhar por Maker/Checker
    let thrown = false;
    try {
      await financialApprovalService.approveRequest(newReq.id, {
        id: 'user-producer-joao',
        name: 'João Silva',
        role: 'PRODUTOR'
      }, 'Auto-aprovação indevida');
    } catch (err) {
      thrown = true;
      assert(err.message.includes('Maker/Checker'), 'Deve rejeitar com mensagem de violação Maker/Checker');
    }
    assert(thrown, 'O solicitante NÃO pode aprovar sua própria solicitação');
  });

  await test('Ciclo completo: Criação ➔ Análise ➔ Aprovação ➔ Execução Contábil', async () => {
    // 1. Criação
    const createRes = await financialApprovalService.createRequest({
      type: 'PAGAMENTO',
      producerId: 'prod-festival',
      producerName: 'Festival Summer 2026',
      eventId: 3368,
      eventName: 'Experiência Música e Natureza',
      amount: 8000,
      requestedBy: {
        id: 'user-producer-marcos',
        name: 'Marcos Produtor',
        role: 'PRODUTOR',
        email: 'marcos@festival.com'
      },
      financialImpact: {
        sourceBalanceBefore: 50000,
        sourceBalanceAfter: 42000,
        sourceAmount: -8000
      },
      justification: 'Pagamento de som e iluminação do palco principal',
      payload: { documentNumber: 'NF-10492' }
    });

    const req = createRes.data;
    assert.ok(req.status === 'AGUARDANDO_APROVACAO' || req.status === 'AGUARDANDO_ANALISE', `Status inicial deve ser aguardando análise/aprovação: ${req.status}`);

    // 2. Início de Análise pelo Financeiro
    const analiseRes = financialApprovalService.startAnalysis(req.id, {
      id: 'user-fin-mariana',
      name: 'Mariana Controladoria',
      role: 'FINANCEIRO'
    });
    assert.strictEqual(analiseRes.data.status, 'EM_ANALISE');

    // 3. Aprovação pelo Financeiro (Checker)
    const aprovacaoRes = await financialApprovalService.approveRequest(req.id, {
      id: 'user-fin-mariana',
      name: 'Mariana Controladoria',
      role: 'FINANCEIRO'
    }, 'NF e contrato conferidos');

    const aprovacao = aprovacaoRes.data;
    assert.strictEqual(aprovacao.status, 'CONCLUIDA', 'Operação de nível 1 deve avançar para CONCLUIDA após execução automática');
    assert(aprovacao.executionResult && aprovacao.executionResult.executedAt, 'Data de execução deve estar preenchida');
    assert(aprovacao.auditTrail.length >= 3, 'Deve conter registros na trilha de auditoria');
  });

  // -------------------------------------------------------------------------
  // 4. CICLO DE DEVOLUÇÃO E REENVIO (SEM PERDER O PROTOCOLO)
  // -------------------------------------------------------------------------
  console.log('\n4. Ciclo de Devolução (Return) e Reenvio pelo Produtor:');

  await test('Devolve solicitação para ajustes e produtor reenvia mantendo ID e histórico', async () => {
    const createRes = await financialApprovalService.createRequest({
      type: 'ALTERACAO_DADOS_BANCARIOS',
      producerId: 'prod-art',
      producerName: 'Arte & Cultura Produções',
      amount: 0,
      requestedBy: {
        id: 'user-prod-pedro',
        name: 'Pedro Cultural',
        role: 'PRODUTOR'
      },
      justification: 'Alteração de domicílio bancário para nova chave CNPJ'
    });

    const req = createRes.data;

    // 1. Financeiro devolve solicitando comprovante
    const returnedRes = financialApprovalService.returnRequest(req.id, {
      id: 'user-fin-mariana',
      name: 'Mariana Controladoria',
      role: 'FINANCEIRO'
    }, 'Por favor anexar o cartão CNPJ atualizado e extrato bancário com a nova chave');

    const returned = returnedRes.data;
    assert.strictEqual(returned.status, 'DEVOLVIDA');
    assert(returned.returnNotes.includes('cartão CNPJ'), 'Deve salvar nota de devolução');

    // 2. Produtor corrige e reenvia a MESMA solicitação
    const resubmittedRes = financialApprovalService.resubmitRequest(req.id, {
      id: 'user-prod-pedro',
      name: 'Pedro Cultural',
      role: 'PRODUTOR'
    }, {
      justification: 'Anexado extrato de conta corrente emitido hoje com chave CNPJ validada.'
    });

    const resubmitted = resubmittedRes.data;
    assert.strictEqual(resubmitted.id, req.id, 'Deve preservar exatamente o mesmo ID');
    assert.strictEqual(resubmitted.status, 'AGUARDANDO_APROVACAO', 'Deve retornar para a fila de aprovação');
    assert(resubmitted.auditTrail.some(a => a.action === 'SOLICITACAO_REENVIADA'), 'Auditoria deve registrar reenvio');
  });

  // -------------------------------------------------------------------------
  // 5. CICLO DE REJEIÇÃO FORMAL
  // -------------------------------------------------------------------------
  console.log('\n5. Ciclo de Rejeição Formal:');

  await test('Rejeita formalmente a solicitação com motivo obrigatório e arquiva', async () => {
    const createRes = await financialApprovalService.createRequest({
      type: 'DESPESA_EXTRAORDINARIA',
      producerId: 'prod-shows',
      producerName: 'Shows Brasil Produções',
      amount: 15000,
      requestedBy: {
        id: 'user-prod-carlos',
        name: 'Carlos Produtor',
        role: 'PRODUTOR'
      },
      justification: 'Taxa extraordinária não prevista'
    });

    const req = createRes.data;

    const rejectedRes = financialApprovalService.rejectRequest(req.id, {
      id: 'user-fin-mariana',
      name: 'Mariana Controladoria',
      role: 'FINANCEIRO'
    }, 'Despesa não compatível com o contrato de coprodução assinado.');

    const rejected = rejectedRes.data;
    assert.strictEqual(rejected.status, 'REJEITADA');
    assert.strictEqual(rejected.decisionReason, 'Despesa não compatível com o contrato de coprodução assinado.');
  });

  // -------------------------------------------------------------------------
  // 6. SISTEMA DE NOTIFICAÇÕES INTERNAS (SINO DO DISK)
  // -------------------------------------------------------------------------
  console.log('\n6. Sistema de Notificações Internas:');

  await test('Dispara e recupera notificações para Financeiro e Produtor', () => {
    const notif = financialApprovalNotificationService.notifyNewRequest({
      id: 'APR-TESTE-NOTIF-01',
      producerName: 'Teatro Positivo',
      type: 'REPASSE',
      amount: 45000
    });

    assert(notif && notif.id, 'Notificação deve ser criada');

    const finNotifs = financialApprovalNotificationService.getNotifications('FINANCEIRO');
    assert(finNotifs.length > 0, 'Financeiro deve receber notificação de nova solicitação');

    // Marca como lida
    financialApprovalNotificationService.markAsRead(notif.id, 'FINANCEIRO');
    const readNotif = finNotifs.find(n => n.id === notif.id);
    assert(readNotif && readNotif.read, 'Notificação deve estar marcada como lida');
  });

  console.log('\n====================================================================');
  console.log(`SUCESSO: ${passedTests}/${totalTests} testes do Mega Pacote de Aprovações passaram!`);
  console.log('====================================================================\n');
}

runAllTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Falha geral na execução dos testes:', err);
  process.exit(1);
});
