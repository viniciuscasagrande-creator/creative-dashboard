/**
 * ============================================================================
 * TESTES AUTOMATIZADOS — PORTAL DO PRODUTOR VS BACKOFFICE FINANCEIRO DISK
 * Matriz das 3 Categorias (A, B, C), Segregação Produtor / Financeiro,
 * Situação Financeira Completa, Dados Bancários e Ciclo de Ações Exclusivas.
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
import { MenuStateManager } from '../../src/navigation/menu-state.js';
import { resolveRoute, isDiskOnlyRoute } from '../../src/navigation/routes.js';

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
  console.log(' TESTE: PORTAL DO PRODUTOR VS BACKOFFICE FINANCEIRO DISK');
  console.log('====================================================================\n');

  // Configura ambiente JSDOM com o index.html real
  const htmlContent = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
  const dom = new JSDOM(htmlContent, {
    url: 'http://localhost/#/financeiro/aprovacoes',
    runScripts: 'dangerously'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.bootstrap = {
    Offcanvas: {
      getOrCreateInstance: (el) => ({
        show: () => { el.classList.add('show'); el.style.visibility = 'visible'; },
        hide: () => { el.classList.remove('show'); el.style.visibility = 'hidden'; }
      })
    },
    Modal: {
      getOrCreateInstance: (el) => ({
        show: () => { el.classList.add('show'); el.style.display = 'block'; },
        hide: () => { el.classList.remove('show'); el.style.display = 'none'; }
      })
    }
  };

  // -------------------------------------------------------------------------
  // 1. MATRIZ CANÔNICA DE 3 CATEGORIAS (TIPO A, TIPO B, TIPO C)
  // -------------------------------------------------------------------------
  console.log('1. Matriz de Categorias de Operações (Tipo A, B e C):');

  await test('Verifica formalização das 3 categorias em OPERATION_CATEGORIES', () => {
    assert(OPERATION_CATEGORIES.TIPO_A_CONSULTA, 'Categoria TIPO_A_CONSULTA deve existir');
    assert.strictEqual(OPERATION_CATEGORIES.TIPO_A_CONSULTA.requiresApproval, false);

    assert(OPERATION_CATEGORIES.TIPO_B_PRODUTOR, 'Categoria TIPO_B_PRODUTOR deve existir');
    assert.strictEqual(OPERATION_CATEGORIES.TIPO_B_PRODUTOR.requiresApproval, false);

    assert(OPERATION_CATEGORIES.TIPO_C_CONTROLADA, 'Categoria TIPO_C_CONTROLADA deve existir');
    assert.strictEqual(OPERATION_CATEGORIES.TIPO_C_CONTROLADA.requiresApproval, true);
  });

  await test('Verifica categorização automática e helpers de consulta', () => {
    // TIPO A — CONSULTA
    const catSaldo = financialApprovalRulesService.getOperationCategory('CONSULTA_SALDO');
    assert.strictEqual(catSaldo.code, 'TIPO_A_CONSULTA');
    assert.strictEqual(financialApprovalRulesService.isControlledOperation('CONSULTA_SALDO'), false);

    // TIPO B — OPERAÇÃO DIRETA
    const catCupom = financialApprovalRulesService.getOperationCategory('CRIAR_CUPOM');
    assert.strictEqual(catCupom.code, 'TIPO_B_PRODUTOR');
    assert.strictEqual(financialApprovalRulesService.isControlledOperation('CRIAR_CUPOM'), false);

    // TIPO C — OPERAÇÕES CONTROLADAS (REQUER APROVAÇÃO)
    const controlledOps = ['REPASSE', 'ANTECIPACAO', 'TRANSFERENCIA_EVENTOS', 'PAGAMENTO', 'ALTERACAO_DADOS_BANCARIOS'];
    for (const op of controlledOps) {
      const cat = financialApprovalRulesService.getOperationCategory(op);
      assert.strictEqual(cat.code, 'TIPO_C_CONTROLADA', `${op} deve ser Tipo C`);
      assert.strictEqual(financialApprovalRulesService.isControlledOperation(op), true, `${op} deve requerer aprovação`);
    }
  });

  // -------------------------------------------------------------------------
  // 2. PERFIS RBAC E SEGREGAÇÃO DE AUTORIZAÇÕES
  // -------------------------------------------------------------------------
  console.log('\n2. Segregação RBAC: Produtor vs Financeiro Disk:');

  await test('Produtor possui permissão para solicitar e corrigir, mas NUNCA aprovar ou executar', () => {
    const produtor = accessControlService.getUserById('user-producer-joao');
    assert(produtor, 'Usuário produtor deve existir');

    // Permissões permitidas ao produtor
    assert.strictEqual(accessControlService.can(produtor, 'financeiro.solicitacoes.visualizar'), true);
    assert.strictEqual(accessControlService.can(produtor, 'financeiro.solicitacoes.solicitar'), true);
    assert.strictEqual(accessControlService.can(produtor, 'financeiro.solicitacoes.corrigir'), true);

    // Ações administrativas e de decisão estritamente bloqueadas
    assert.strictEqual(accessControlService.can(produtor, 'financeiro.aprovacoes.aprovar'), false);
    assert.strictEqual(accessControlService.can(produtor, 'financeiro.aprovacoes.rejeitar'), false);
    assert.strictEqual(accessControlService.can(produtor, 'financeiro.aprovacoes.devolver'), false);
    assert.strictEqual(accessControlService.can(produtor, 'financeiro.operacoes.executar'), false);
  });

  await test('Financeiro Disk possui permissões de análise, aprovação, reprovação, devolução e execução', () => {
    const financeiro = accessControlService.getUserById('user-fin-mariana');
    assert(financeiro, 'Usuário financeiro deve existir');

    assert.strictEqual(accessControlService.can(financeiro, 'financeiro.solicitacoes.visualizar'), true);
    assert.strictEqual(accessControlService.can(financeiro, 'financeiro.solicitacoes.analisar'), true);
    assert.strictEqual(accessControlService.can(financeiro, 'financeiro.solicitacoes.devolver'), true);
    assert.strictEqual(accessControlService.can(financeiro, 'financeiro.solicitacoes.reprovar'), true);
    assert.strictEqual(accessControlService.can(financeiro, 'financeiro.aprovacoes.aprovar'), true);
    assert.strictEqual(accessControlService.can(financeiro, 'financeiro.operacoes.executar'), true);
  });

  // -------------------------------------------------------------------------
  // 3. SITUAÇÃO FINANCEIRA COMPLETA E DADOS BANCÁRIOS
  // -------------------------------------------------------------------------
  console.log('\n3. Situação Financeira Completa e Domicílio Bancário:');

  await test('Gera extrato completo de situação financeira com 8 indicadores canônicos', () => {
    const sit = financialApprovalService.getFinancialSituation('APR-2026-00142');
    assert(sit, 'Situação financeira deve ser retornada');
    assert(sit.grossSales > 0, 'Vendas brutas deve ser > 0');
    assert(sit.platformFees > 0, 'Taxas deve ser > 0');
    assert(sit.refunds > 0, 'Estornos deve ser > 0');
    assert(sit.chargebacks > 0, 'Chargebacks deve ser > 0');
    assert(sit.committed >= 0, 'Valores comprometidos deve ser >= 0');
    assert(sit.available > 0, 'Saldo disponível deve ser > 0');
    assert.strictEqual(sit.requested, 35000, 'Valor solicitado deve corresponder ao da APR-2026-00142');
    assert.strictEqual(sit.projected, Number((sit.available - sit.requested).toFixed(2)), 'Saldo projetado deve ser disponível - solicitado');
  });

  await test('Retorna dados bancários estruturados e validados para liquidação', () => {
    const bank = financialApprovalService.getBankDetails('APR-2026-00142');
    assert(bank, 'Dados bancários devem existir');
    assert(bank.holderName, 'Titular deve estar preenchido');
    assert(bank.document, 'CNPJ/CPF deve estar preenchido');
    assert(bank.bankName, 'Instituição financeira deve estar preenchida');
    assert(bank.agency, 'Agência deve estar preenchida');
    assert(bank.account, 'Conta corrente deve estar preenchida');
    assert.strictEqual(bank.complianceStatus, 'VALIDADO_COMPLIANCE');
  });

  // -------------------------------------------------------------------------
  // 4. PORTAL DO PRODUTOR: ACOMPANHAMENTO E REENVIO SEM PERDER PROTOCOLO
  // -------------------------------------------------------------------------
  console.log('\n4. Dinâmica do Portal do Produtor no Controller:');

  await test('Alterna para modo Produtor: altera título, tabela e oculta botões administrativos no drawer', () => {
    financialApprovalsController.init();
    financialApprovalsController.switchRole('PRODUTOR');

    // 1. Título do Header contextual
    const headerTitle = document.getElementById('approval-header-main-text');
    assert(headerTitle && headerTitle.textContent.includes('Portal do Produtor'), 'Título deve indicar Portal do Produtor');

    // 2. Ações na tabela
    const tbody = document.getElementById('table-financial-approvals-body');
    assert(tbody.innerHTML.includes('Ver Protocolo'), 'Botão na tabela do produtor deve ser "Ver Protocolo"');
    assert(!tbody.innerHTML.includes('Analisar'), 'Produtor não deve ver botão "Analisar" na tabela');

    // 3. Simula uma solicitação devolvida
    const devolvidaReq = financialApprovalService.getRequestById('APR-2026-00142');
    devolvidaReq.status = 'DEVOLVIDA';
    devolvidaReq.statusLabelPtBr = 'Devolvida p/ Correção';
    devolvidaReq.returnNotes = 'Favor anexar comprovante de CNPJ e nota de prestação.';

    financialApprovalsController.openDrawer('APR-2026-00142');

    const drawerContent = document.getElementById('offcanvas-approval-content');
    const drawerFooter = document.getElementById('offcanvas-approval-footer');

    // Produtor vê o motivo da devolução
    assert(drawerContent.innerHTML.includes('Solicitação Devolvida para Ajustes'), 'Deve exibir card de devolução');
    assert(drawerContent.innerHTML.includes('Favor anexar comprovante de CNPJ'), 'Deve exibir nota da controladoria');

    // Produtor tem botão para Corrigir e Reenviar
    assert(drawerFooter.innerHTML.includes('Corrigir e Reenviar'), 'Footer do produtor deve conter botão "Corrigir e Reenviar"');

    // Produtor NÃO possui botões de Aprovar, Reprovar ou Devolver
    assert(!drawerFooter.innerHTML.includes('openApproveDecisionModal'), 'Produtor NUNCA pode ter botão de aprovar');
    assert(!drawerFooter.innerHTML.includes('openRejectDecisionModal'), 'Produtor NUNCA pode ter botão de rejeitar');
    assert(!drawerFooter.innerHTML.includes('openReturnDecisionModal'), 'Produtor NUNCA pode ter botão de devolver');
  });

  // -------------------------------------------------------------------------
  // 5. BACKOFFICE FINANCEIRO DISK: DECISÃO, SITUAÇÃO E EXECUÇÃO
  // -------------------------------------------------------------------------
  console.log('\n5. Dinâmica do Backoffice Financeiro Disk no Controller:');

  await test('Alterna para modo Financeiro Disk: exibe Situação Financeira e botões de decisão', () => {
    financialApprovalsController.switchRole('FINANCEIRO');

    // 1. Título do Header contextual
    const headerTitle = document.getElementById('approval-header-main-text');
    assert(headerTitle && headerTitle.textContent.includes('Central de Solicitações Financeiras'), 'Título deve indicar Central de Solicitações');

    // 2. Ações na tabela
    const tbody = document.getElementById('table-financial-approvals-body');
    assert(tbody.innerHTML.includes('Analisar'), 'Financeiro Disk deve ver botão "Analisar" na tabela');

    // 3. Abre uma solicitação nova aguardando aprovação
    const reqNova = financialApprovalService.getRequestById('APR-2026-00140');
    reqNova.status = 'AGUARDANDO_APROVACAO';

    financialApprovalsController.openDrawer('APR-2026-00140');

    const drawerContent = document.getElementById('offcanvas-approval-content');
    const drawerFooter = document.getElementById('offcanvas-approval-footer');

    // Financeiro vê o card de Situação Financeira Completa
    assert(drawerContent.innerHTML.includes('Situação Financeira'), 'Drawer deve exibir card de Situação Financeira');
    assert(drawerContent.innerHTML.includes('Vendas brutas'), 'Situação deve listar Vendas brutas');
    assert(drawerContent.innerHTML.includes('Saldo disponível'), 'Situação deve listar Saldo disponível');
    assert(drawerContent.innerHTML.includes('Saldo projetado'), 'Situação deve listar Saldo projetado');

    // Financeiro vê os Dados Bancários
    assert(drawerContent.innerHTML.includes('Dados Bancários &amp; Favorecido'), 'Drawer deve exibir Dados Bancários');

    // Financeiro possui os botões de ação administrativa
    assert(drawerFooter.innerHTML.includes('startAnalysisAction'), 'Financeiro possui botão Iniciar Análise');
    assert(drawerFooter.innerHTML.includes('openReturnDecisionModal'), 'Financeiro possui botão Devolver');
    assert(drawerFooter.innerHTML.includes('openRejectDecisionModal'), 'Financeiro possui botão Reprovar');
    assert(drawerFooter.innerHTML.includes('openApproveDecisionModal'), 'Financeiro possui botão Aprovar');
  });

  // -------------------------------------------------------------------------
  // 6. SEGREGAÇÃO DO MENU LATERAL E GUARDA DE ROTAS (PRODUTOR VS FINANCEIRO DISK)
  // -------------------------------------------------------------------------
  console.log('\n6. Segregação do Menu Lateral e Guarda de Rotas:');

  await test('Sidebar contém exatamente os 8 itens canônicos do Portal do Produtor', () => {
    const finGroup = document.querySelector('#main-sidebar-nav [data-menu-group="financeiro"]');
    assert(finGroup, 'Grupo financeiro deve existir na sidebar');

    const producerLinks = Array.from(finGroup.querySelectorAll('.producer-submenu-link'));
    assert.strictEqual(producerLinks.length, 8, `Esperado exatamente 8 itens de produtor, encontrados ${producerLinks.length}`);

    const expectedRoutes = [
      '/financeiro/dashboard',
      '/financeiro/meus-saldos',
      '/financeiro/solicitar-repasse',
      '/financeiro/solicitar-antecipacao',
      '/financeiro/transferir-eventos',
      '/financeiro/minhas-solicitacoes',
      '/financeiro/extrato',
      '/financeiro/dados-bancarios'
    ];

    expectedRoutes.forEach(route => {
      const match = producerLinks.find(link => link.getAttribute('data-route') === route);
      assert(match, `Item de rota "${route}" ausente no menu do produtor`);
    });
  });

  await test('MenuStateManager.updateRole("PRODUTOR") exibe apenas os 8 itens próprios e oculta backoffice Disk', () => {
    MenuStateManager.updateRole('PRODUTOR');

    const finGroup = document.querySelector('#main-sidebar-nav [data-menu-group="financeiro"]');
    const producerItems = finGroup.querySelectorAll('.menu-financeiro-produtor-item');
    producerItems.forEach(el => {
      assert.strictEqual(el.style.display, '', 'Itens do produtor devem estar visíveis');
    });

    const diskItems = finGroup.querySelectorAll('#menu-sub-financeiro > li:not(.menu-financeiro-produtor-item)');
    assert(diskItems.length > 0, 'Itens da Disk devem existir');
    diskItems.forEach(el => {
      assert.strictEqual(el.style.display, 'none', 'Itens internos da Disk devem estar ocultos para o produtor');
    });
  });

  await test('Guarda de Rota bloqueia todas as rotas exclusivas do Financeiro Disk quando usuário for PRODUTOR', () => {
    global.window.currentRole = 'PRODUTOR';
    global.window.isProducerRole = true;

    const blockedRoutes = [
      '/financeiro/aprovacoes',
      '/financeiro/gateways-adquirentes',
      '/financeiro/fechamento',
      '/financeiro/posicao-geral',
      '/financeiro/taxas-custos',
      '/financeiro/tesouraria',
      '/financeiro/conciliacao',
      '/financeiro/cnab',
      '/financeiro/pix',
      '/contabilidade/dashboard'
    ];

    blockedRoutes.forEach(path => {
      const resolved = resolveRoute(path);
      assert.strictEqual(resolved.path, '/acesso-negado', `Produtor tentando acessar "${path}" deve ser redirecionado para /acesso-negado`);
      assert.strictEqual(resolved.view, 'access-denied', `View da rota "${path}" deve ser access-denied`);
    });
  });

  await test('Guarda de Rota permite acesso irrestrito às 8 rotas canônicas do PRODUTOR', () => {
    global.window.currentRole = 'PRODUTOR';
    global.window.isProducerRole = true;

    const allowed = [
      { path: '/financeiro/dashboard', view: 'financial-dashboard' },
      { path: '/financeiro/meus-saldos', view: 'financial-saldos' },
      { path: '/financeiro/solicitar-repasse', view: 'financial-repass' },
      { path: '/financeiro/solicitar-antecipacao', view: 'financial-advance' },
      { path: '/financeiro/transferir-eventos', view: 'financial-event-transfers' },
      { path: '/financeiro/minhas-solicitacoes', view: 'financial-approvals' },
      { path: '/financeiro/extrato', view: 'financial-statement' },
      { path: '/financeiro/dados-bancarios', view: 'financial-accounts' }
    ];

    allowed.forEach(target => {
      const resolved = resolveRoute(target.path);
      assert.strictEqual(resolved.path, target.path, `Produtor deve acessar ${target.path}`);
      assert.strictEqual(resolved.view, target.view, `View de ${target.path} deve ser ${target.view}`);
    });
  });

  await test('Alternância para FINANCEIRO_DISK restaura o menu completo e libera rotas administrativas', () => {
    global.window.currentRole = 'FINANCEIRO';
    global.window.isProducerRole = false;
    MenuStateManager.updateRole('FINANCEIRO');

    const finGroup = document.querySelector('#main-sidebar-nav [data-menu-group="financeiro"]');
    const producerItems = finGroup.querySelectorAll('.menu-financeiro-produtor-item');
    producerItems.forEach(el => {
      assert.strictEqual(el.style.display, 'none', 'Itens do produtor devem estar ocultos para financeiro disk');
    });

    const diskItems = finGroup.querySelectorAll('#menu-sub-financeiro > li:not(.menu-financeiro-produtor-item)');
    diskItems.forEach(el => {
      assert.strictEqual(el.style.display, '', 'Itens internos da Disk devem estar visíveis');
    });

    // Rotas liberadas
    const resAprov = resolveRoute('/financeiro/aprovacoes');
    assert.strictEqual(resAprov.path, '/financeiro/aprovacoes');
    assert.strictEqual(resAprov.view, 'financial-approvals');

    const resGw = resolveRoute('/financeiro/gateways-adquirentes');
    assert.strictEqual(resGw.path, '/financeiro/gateways-adquirentes');
    assert.strictEqual(resGw.view, 'financial-gateways-adquirentes');

    const resFech = resolveRoute('/financeiro/fechamento');
    assert.strictEqual(resFech.path, '/financeiro/fechamento');
    assert.strictEqual(resFech.view, 'financial-fechamento');
  });

  console.log('\n====================================================================');
  console.log(`SUCESSO: ${passedTests}/${totalTests} testes de Portal do Produtor vs Financeiro Disk passaram!`);
  console.log('====================================================================\n');
}

run().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Falha geral na suíte:', err);
  process.exit(1);
});
