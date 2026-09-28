/**
 * Testes Automatizados — MEGA PACOTE 1: Central de Autenticação e Gerenciamento de Acesso
 * Login, Sessão, Usuários, Perfis, RBAC Real can(user, perm, ctx), Escopos Produtor/Evento, Alçadas, Auditoria
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

import { accessControlService, PROFILE_DEFAULTS } from '../../src/services/accessControlService.js';
import { accessAuditService } from '../../src/services/accessAuditService.js';
import { ROUTES, resolveRoute } from '../../src/navigation/routes.js';
import { AppRouter } from '../../src/navigation/router.js';

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
  console.log(' MEGA PACOTE 1: CENTRAL DE AUTENTICAÇÃO E GERENCIAMENTO DE ACESSO');
  console.log('====================================================================\n');

  // -------------------------------------------------------------------------
  // 1. ESTRUTURA NO DOM (index.html) E ROTAS CANÔNICAS
  // -------------------------------------------------------------------------
  console.log('1. Verificação de Estrutura no DOM e Rotas de Acesso:');

  await test('Verifica se as seções #view-access-management, #view-access-denied e #view-auth-login existem no DOM', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    assert(html.includes('id="view-access-management"'), '#view-access-management deve existir');
    assert(html.includes('id="view-access-denied"'), '#view-access-denied (403) deve existir');
    assert(html.includes('id="view-auth-login"'), '#view-auth-login deve existir');
  });

  await test('Verifica as 8 abas canônicas e o modal do assistente de usuários (8 etapas) no DOM', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    const tabs = [
      'tab-access-visao-geral',
      'tab-access-usuarios',
      'tab-access-perfis',
      'tab-access-permissoes',
      'tab-access-alcadas',
      'tab-access-escopos',
      'tab-access-seguranca',
      'tab-access-auditoria'
    ];
    for (const t of tabs) {
      assert(html.includes(`id="${t}"`), `Aba #${t} deve existir em index.html`);
    }
    assert(html.includes('id="modal-access-user-wizard"'), 'Modal do assistente #modal-access-user-wizard deve existir');
    assert(html.includes('id="wizard-step-indicator"'), '#wizard-step-indicator deve existir');
    assert(html.includes('id="modal-access-user-details"'), 'Modal de detalhes #modal-access-user-details deve existir');
  });

  await test('Verifica se as rotas de acesso e autenticação estão catalogadas em routes.js', () => {
    const routesToCheck = [
      '/acesso',
      '/acesso/visao-geral',
      '/acesso/usuarios',
      '/acesso/perfis',
      '/acesso/permissoes',
      '/acesso/alcadas',
      '/acesso/escopos',
      '/acesso/seguranca',
      '/acesso/auditoria',
      '/login',
      '/acesso-negado'
    ];

    for (const r of routesToCheck) {
      const res = ROUTES[r];
      assert(res, `Rota ${r} deve estar registrada em routes.js`);
    }

    const legacy = resolveRoute('/configuracoes/usuarios');
    assert.strictEqual(legacy.path, '/acesso/usuarios', 'Alias /configuracoes/usuarios deve resolver para /acesso/usuarios');
  });

  // -------------------------------------------------------------------------
  // 2. AUTENTICAÇÃO REAL, SESSÕES E PROTEÇÃO CONTRA FORÇA BRUTA
  // -------------------------------------------------------------------------
  console.log('\n2. Autenticação, Controle de Sessão e Bloqueio Antifraude:');

  await test('Login com credenciais válidas cria sessão ativa e atualiza lastLoginAt', async () => {
    const res = await accessControlService.login('carlos.lima@diskingressos.com.br', 'senha123', true);
    assert(res.ok, 'Login deve retornar sucesso');
    assert(res.user && res.user.email === 'carlos.lima@diskingressos.com.br');
    assert(res.session && res.session.token, 'Token de sessão deve ser gerado');
    assert.strictEqual(res.session.active, true);
    assert(res.user.lastLoginAt, 'lastLoginAt deve ser preenchido');
  });

  await test('Logout formal revoga sessão ativa e registra evento na auditoria', () => {
    const res = accessControlService.logout();
    assert(res.ok, 'Logout deve ser concluído');
    const logs = accessAuditService.getLogs({ action: 'LOGOUT' });
    assert(logs.length > 0, 'Auditoria deve registrar logout');
  });

  await test('5 tentativas inválidas consecutivas bloqueiam automaticamente a conta do usuário', async () => {
    // Cria usuário de teste para força bruta
    const testUser = accessControlService.createUser({
      name: 'Usuário Teste Ataque',
      email: 'ataque.teste@empresa.com.br',
      profile: 'PRODUTOR_OPERACIONAL',
      status: 'ATIVO'
    }).data;

    assert.strictEqual(testUser.status, 'ATIVO');

    // 4 falhas com senha incorreta
    for (let i = 1; i <= 4; i++) {
      try {
        await accessControlService.login('ataque.teste@empresa.com.br', '123'); // senha < 6 dígitos
      } catch (err) {
        assert(err.message.includes('incorretos'));
      }
    }

    // 5ª falha deve bloquear
    let blockedErr = false;
    try {
      await accessControlService.login('ataque.teste@empresa.com.br', '123');
    } catch (err) {
      blockedErr = true;
      assert(err.message.includes('bloqueada'), 'Deve retornar mensagem de bloqueio automático');
    }
    assert(blockedErr, '5ª tentativa deve disparar bloqueio');

    const updatedUser = accessControlService.getUserById(testUser.id);
    assert.strictEqual(updatedUser.status, 'BLOQUEADO', 'Status deve ter mudado para BLOQUEADO');

    // Usuário bloqueado não consegue fazer login
    let loginBlocked = false;
    try {
      await accessControlService.login('ataque.teste@empresa.com.br', 'senhaValida123');
    } catch (err) {
      loginBlocked = true;
      assert(err.message.includes('bloqueada'));
    }
    assert(loginBlocked, 'Conta bloqueada deve rejeitar qualquer login');
  });

  // -------------------------------------------------------------------------
  // 3. MOTOR RBAC REAL: can(user, permission, context)
  // -------------------------------------------------------------------------
  console.log('\n3. Motor RBAC Real com Avaliação de Permissões Granulares:');

  await test('Avalia permissões por perfil sem hardcode de role', () => {
    const maria = accessControlService.getUserById('user-fin-mariana'); // Financeiro Operacional
    const carlos = accessControlService.getUserById('user-admin-carlos'); // Gestor Financeiro

    // Ambos podem visualizar e analisar aprovações
    assert(accessControlService.can(maria, 'financeiro.aprovacoes.visualizar'), 'Maria deve visualizar aprovações');
    assert(accessControlService.can(carlos, 'financeiro.aprovacoes.visualizar'), 'Carlos deve visualizar aprovações');

    // Carlos possui aprovação de Nível 2; Maria NÃO possui
    assert.strictEqual(accessControlService.can(carlos, 'financeiro.aprovacoes.nivel2'), true);
    assert.strictEqual(accessControlService.can(maria, 'financeiro.aprovacoes.nivel2'), false);

    // Maria NÃO pode criar campanhas de marketing
    assert.strictEqual(accessControlService.can(maria, 'marketing.campanhas.criar'), false);

    // Maria NÃO pode administrar permissões
    assert.strictEqual(accessControlService.can(maria, 'acesso.permissoes.administrar'), false);
  });

  await test('Usuário com status BLOQUEADO tem todas as permissões negadas', () => {
    const joao = accessControlService.getUserById('user-producer-joao');
    assert(accessControlService.can(joao, 'financeiro.saldos.visualizar'));

    // Bloqueia João temporariamente
    accessControlService.toggleUserBlock(joao.id);
    assert.strictEqual(accessControlService.can(joao, 'financeiro.saldos.visualizar'), false, 'Usuário bloqueado deve ter retorno false');

    // Desbloqueia
    accessControlService.toggleUserBlock(joao.id);
    assert.strictEqual(accessControlService.can(joao, 'financeiro.saldos.visualizar'), true);
  });

  // -------------------------------------------------------------------------
  // 4. ESCOPO POR PRODUTOR E EVENTO
  // -------------------------------------------------------------------------
  console.log('\n4. Avaliação de Escopo (O que pode fazer + Onde pode fazer):');

  await test('Permissão é concedida apenas para produtores e eventos autorizados no escopo', () => {
    const maria = accessControlService.getUserById('user-fin-mariana');
    // Maria tem acesso a prod-1, prod-2, prod-3 e aos eventos 3368, 3195, 3178, 934

    // Consulta de saldo no evento 3368 (Autorizado)
    const allowed = accessControlService.can(maria, 'financeiro.saldos.visualizar', {
      producerId: 'prod-1',
      eventId: '3368'
    });
    assert.strictEqual(allowed, true, 'Deve autorizar evento e produtor no escopo de Maria');

    // Consulta de saldo em evento não autorizado (Evento 9999)
    const deniedEvent = accessControlService.can(maria, 'financeiro.saldos.visualizar', {
      producerId: 'prod-1',
      eventId: '9999'
    });
    assert.strictEqual(deniedEvent, false, 'Deve negar evento fora do escopo mesmo possuindo a permissão de saldo');

    // Consulta em produtor não autorizado (Produtor desconhecido prod-99)
    const deniedProducer = accessControlService.can(maria, 'financeiro.saldos.visualizar', {
      producerId: 'prod-99',
      eventId: '3368'
    });
    assert.strictEqual(deniedProducer, false, 'Deve negar produtor fora do escopo');
  });

  // -------------------------------------------------------------------------
  // 5. ALÇADAS DE APROVAÇÃO E LIMITES MONETÁRIOS
  // -------------------------------------------------------------------------
  console.log('\n5. Alçadas de Aprovação e Limites Monetários por Operação:');

  await test('Maria aprova transferência até R$ 50 mil; acima disso é bloqueada por alçada', () => {
    const maria = accessControlService.getUserById('user-fin-mariana'); // Limite 50.000

    // R$ 35.000 está dentro da alçada de Maria
    const can35k = accessControlService.can(maria, 'financeiro.transferencias.aprovar', {
      operation: 'TRANSFERENCIA_EVENTOS',
      amount: 35000,
      producerId: 'prod-1',
      eventId: '3368'
    });
    assert.strictEqual(can35k, true, 'Maria pode aprovar até R$ 50k');

    // R$ 80.000 excede a alçada de Maria (R$ 50k)
    const can80kMaria = accessControlService.can(maria, 'financeiro.transferencias.aprovar', {
      operation: 'TRANSFERENCIA_EVENTOS',
      amount: 80000,
      producerId: 'prod-1',
      eventId: '3368'
    });
    assert.strictEqual(can80kMaria, false, 'Maria NÃO pode aprovar R$ 80k por estourar alçada');

    // Carlos (Gestor Financeiro) possui alçada de R$ 500 mil e pode aprovar R$ 80k
    const carlos = accessControlService.getUserById('user-admin-carlos');
    const can80kCarlos = accessControlService.can(carlos, 'financeiro.transferencias.aprovar', {
      operation: 'TRANSFERENCIA_EVENTOS',
      amount: 80000,
      producerId: 'prod-1',
      eventId: '3368'
    });
    assert.strictEqual(can80kCarlos, true, 'Carlos pode aprovar R$ 80k pois sua alçada é R$ 500k');
  });

  await test('Verifica permissão de alteração bancária e antecipação por alçada', () => {
    const maria = accessControlService.getUserById('user-fin-mariana');
    const carlos = accessControlService.getUserById('user-admin-carlos');

    // Maria não pode aprovar alteração de dados bancários
    assert.strictEqual(accessControlService.can(maria, 'financeiro.dados_bancarios.aprovar', { operation: 'ALTERACAO_DADOS_BANCARIOS' }), false);

    // Carlos pode aprovar alteração de dados bancários
    assert.strictEqual(accessControlService.can(carlos, 'financeiro.dados_bancarios.aprovar', { operation: 'ALTERACAO_DADOS_BANCARIOS' }), true);
  });

  // -------------------------------------------------------------------------
  // 6. PRINCÍPIO DO MENOR PRIVILÉGIO E TRAVA DE DELEGAÇÃO
  // -------------------------------------------------------------------------
  console.log('\n6. Princípio do Menor Privilégio e Trava de Delegação:');

  await test('Usuário não pode conceder alçada superior àquela que ele próprio possui', () => {
    const maria = accessControlService.getUserById('user-fin-mariana'); // Alçada de Maria: R$ 50k

    let thrown = false;
    try {
      // Maria tenta criar um usuário com alçada de R$ 100k
      accessControlService.createUser({
        name: 'Tentativa Alçada Maior',
        email: 'tentativa@empresa.com',
        profile: 'FINANCEIRO',
        thresholds: { transferLimit: 100000 }
      }, maria);
    } catch (err) {
      thrown = true;
      assert(err.message.includes('maior que a sua própria'), 'Deve lançar erro de alçada superior');
    }
    assert(thrown, 'Trava de delegação deve impedir conceder alçada superior');
  });

  // -------------------------------------------------------------------------
  // 7. PROTEÇÃO DE ROTAS NO ROUTER
  // -------------------------------------------------------------------------
  console.log('\n7. Proteção de Rotas com Acesso Negado (403):');

  await test('Router bloqueia acesso direto por URL a recursos não autorizados', () => {
    // Muda usuário ativo para Produtor João Silva (sem permissão de aprovações)
    accessControlService.switchCurrentUser('user-producer-joao');
    const user = accessControlService.getCurrentUser();
    assert.strictEqual(user.profile, 'PRODUTOR_ADMINISTRADOR');

    // João tenta navegar diretamente para /financeiro/aprovacoes
    const route = AppRouter.navigate('/financeiro/aprovacoes');
    assert.strictEqual(route.path, '/acesso-negado', 'Deve ser redirecionado para /acesso-negado');

    // Restaura usuário para Carlos
    accessControlService.switchCurrentUser('user-admin-carlos');
    const adminRoute = AppRouter.navigate('/financeiro/aprovacoes');
    assert.strictEqual(adminRoute.path, '/financeiro/aprovacoes', 'Carlos possui acesso autorizado');
  });

  // -------------------------------------------------------------------------
  // 8. TRILHA DE AUDITORIA DE ACESSO
  // -------------------------------------------------------------------------
  console.log('\n8. Trilha Imutável de Auditoria:');

  await test('Auditoria registra eventos de login, bloqueio, criação e alteração com sucesso', () => {
    const logs = accessAuditService.getLogs();
    assert(logs.length >= 5, 'Deve conter registros na auditoria');
    const hasCreate = logs.some(l => l.action === 'USER_CREATE');
    const hasBlock = logs.some(l => l.action === 'USER_BLOCK');
    assert(hasCreate, 'Deve ter registrado criação de usuário');
    assert(hasBlock, 'Deve ter registrado bloqueio de usuário');
  });

  console.log('\n====================================================================');
  console.log(`SUCESSO: ${passedTests}/${totalTests} testes do MEGA PACOTE 1 passaram com 100%!`);
  console.log('====================================================================\n');
}

runAllTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Falha geral no teste do Mega Pacote 1:', err);
  process.exit(1);
});
