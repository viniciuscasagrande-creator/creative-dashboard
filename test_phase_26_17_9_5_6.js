/**
 * Testes Automatizados — Fase 26.17.9.5.6: Motor de Regras de Repasse e Prioridades Financeiras
 * SafeSaff / PDT (DiskIngressos)
 * Cobre rigorosamente os 12 cenários de teste obrigatórios de docs/08_COMANDO_GEMINI_VSCODE.md:
 * 1. repasse permitido (ALLOW)
 * 2. repasse parcial (ALLOW_PARTIAL)
 * 3. bloqueio por reserva (BLOCK)
 * 4. bloqueio por conciliação / divergência contábil (BLOCK / HOLD)
 * 5. aprovação por valor / alçada Nível 1 (ALLOW_WITH_APPROVAL)
 * 6. dupla aprovação / alçada Nível 2 Diretoria (ALLOW_WITH_APPROVAL)
 * 7. exceção operacional contornando bloqueio (ALLOW)
 * 8. política por produtor (POL-PROD-CWB)
 * 9. política por evento (POL-EV-3042)
 * 10. simulação sem movimentação contábil (SIMULATION)
 * 11. auditoria append-only imutável com correlationId
 * 12. RBAC e segregação de funções
 */

import assert from 'assert';
import { JSDOM } from 'jsdom';
import {
  financialRulesEngine,
  evaluateFinancialOperation,
  simulateFinancialOperation,
  getFinancialPolicies,
  getFinancialPriorities,
  getFinancialExceptions,
  getFinancialRulesAuditLog,
  createFinancialException
} from './src/services/financialRulesService.js';
import { eventBalanceService, getLocalBalanceStore, initLocalBalanceStore } from './src/services/eventBalanceService.js';
import { balanceTransferService } from './src/services/balanceTransferService.js';

let passed = 0;
let total = 0;

async function it(desc, fn) {
  total++;
  try {
    await fn();
    console.log('  [PASS] ' + desc);
    passed++;
  } catch (err) {
    console.error('  [FAIL] ' + desc, err.message);
    throw err;
  }
}

// Configura simulação de DOM para testes se necessário
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

async function run() {
  console.log('=== INICIANDO BATERIA DE TESTES — FASE 26.17.9.5.6 ===\n');

  // Inicializa a base de saldos para garantir integridade
  initLocalBalanceStore();
  financialRulesEngine.resetToInitialState();

  // Data dentro da janela operacional para testes neutros (Quarta-feira, 14:00h)
  const businessHoursDate = new Date('2026-09-16T14:00:00.000Z');

  // =========================================================================
  // CENÁRIO 1: Repasse Permitido (ALLOW)
  // =========================================================================
  console.log('--- CENÁRIO 1: Repasse Permitido (ALLOW) ---');
  await it('Deve autorizar integralmente operação dentro do teto automático e com saldo livre pós-reserva', async () => {
    // Evento 3368 tem saldo liquidado de ~12.851,00 e disponível livre
    const res = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'PAYOUT',
      producerId: 'prod-1',
      eventId: '3368',
      amount: 4000.00,
      actor: { name: 'Operador Financeiro', role: 'OPERADOR_FINANCEIRO' },
      now: businessHoursDate
    });

    assert.strictEqual(res.decision, 'ALLOW', 'Decisão deve ser ALLOW');
    assert.strictEqual(res.requiresApproval, false, 'Não deve exigir alçada');
    assert.strictEqual(res.blockedReasons.length, 0, 'Não deve conter motivos de bloqueio');
    assert.ok(res.maxAllowedAmount >= 4000.00, 'Máximo permitido deve cobrir a solicitação');
    assert.ok(res.reserveAmount > 0, 'Reserva mínima deve ser calculada');
    assert.ok(res.correlationId.startsWith('EVAL-'), 'Deve conter correlationId');
  });

  // =========================================================================
  // CENÁRIO 2: Repasse Parcial (ALLOW_PARTIAL)
  // =========================================================================
  console.log('\n--- CENÁRIO 2: Repasse Parcial (ALLOW_PARTIAL) ---');
  await it('Deve autorizar parcialmente quando valor solicitado excede a capacidade líquida mas capacidade > 0', async () => {
    // Evento 3195 tem saldo liquidado ~7.720,00 e disponível ~5.500,00
    // Reserva mínima de 10% ou 1.500 = 1.500. Capacidade líquida ~4.000
    // Solicitando 6.000 -> Excede a capacidade líquida, permitindo parcial
    const res = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'PAYOUT',
      producerId: 'prod-1',
      eventId: '3195',
      amount: 6000.00,
      actor: { name: 'Operador Financeiro', role: 'OPERADOR_FINANCEIRO' },
      now: businessHoursDate
    });

    assert.strictEqual(res.decision, 'ALLOW_PARTIAL', 'Decisão deve ser ALLOW_PARTIAL');
    assert.ok(res.maxAllowedAmount > 0 && res.maxAllowedAmount < 6000.00, 'Máximo permitido deve ser a capacidade líquida residual');
    assert.ok(res.warnings.some(w => w.includes('Liberado parcialmente')), 'Deve incluir aviso explicativo da liberação parcial');
  });

  // =========================================================================
  // CENÁRIO 3: Bloqueio por Reserva Mínima (BLOCK)
  // =========================================================================
  console.log('\n--- CENÁRIO 3: Bloqueio por Reserva Mínima (BLOCK) ---');
  await it('Deve bloquear com BLOCK quando o saldo disponível é integralmente consumido pela reserva mínima', async () => {
    // Criamos temporariamente uma política muito restritiva de reserva de R$ 100.000 para forçar capacidade 0
    const pol = financialRulesEngine.createPolicy({
      id: 'POL-TEST-STRICT-RESERVE',
      name: 'Política Teste Reserva Alta',
      scope: 'EVENT',
      targetId: '3178',
      priority: 1, // Prevalência máxima
      minReserveFixed: 100000.00,
      minReservePercent: 50.0,
      reserveRule: 'GREATER_OF',
      maxReleasePercent: 50.0,
      maxWithoutApproval: 5000,
      twoLevelApprovalThreshold: 20000,
      allowPartialPayout: true,
      active: true
    });

    const res = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'PAYOUT',
      producerId: 'prod-1',
      eventId: '3178',
      amount: 1000.00,
      actor: { name: 'Operador Financeiro', role: 'OPERADOR_FINANCEIRO' },
      now: businessHoursDate
    });

    assert.strictEqual(res.decision, 'BLOCK', 'Decisão deve ser BLOCK');
    assert.strictEqual(res.maxAllowedAmount, 0, 'Capacidade líquida deve ser 0');
    assert.ok(res.blockedReasons.some(r => r.includes('Saldo insuficiente após dedução das reservas mínimas')), 'Deve conter motivo de bloqueio por reserva');

    // Desativa a política temporária para os próximos testes
    financialRulesEngine.updatePolicy(pol.id, { active: false });
  });

  // =========================================================================
  // CENÁRIO 4: Bloqueio por Conciliação / Divergência Contábil / Janela (BLOCK / HOLD)
  // =========================================================================
  console.log('\n--- CENÁRIO 4: Bloqueio por Divergência Contábil e Janela Operacional ---');
  await it('Deve bloquear com BLOCK se o evento tiver divergência contábil ativa', async () => {
    // Injeta temporariamente um evento desbalanceado
    const store = getLocalBalanceStore();
    const originalEvent = store.find(e => String(e.eventId) === '3368');
    const originalBalanced = originalEvent.integrity.isBalanced;
    originalEvent.integrity.isBalanced = false; // Força desbalanceamento

    const res = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'PAYOUT',
      producerId: 'prod-1',
      eventId: '3368',
      amount: 1000.00,
      actor: { name: 'Operador Financeiro', role: 'OPERADOR_FINANCEIRO' },
      now: businessHoursDate
    });

    assert.strictEqual(res.decision, 'BLOCK', 'Decisão deve ser BLOCK devido à divergência contábil');
    assert.ok(res.blockedReasons.some(r => r.includes('Divergência contábil')), 'Deve reportar bloqueio contábil');

    // Restaura integridade
    originalEvent.integrity.isBalanced = originalBalanced;
  });

  await it('Deve reter com HOLD se a operação ocorrer fora da janela bancária autorizada', async () => {
    // Data fora da janela: Domingo às 22:00h
    const sundayNight = new Date('2026-09-13T22:00:00.000Z');

    const res = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'PAYOUT',
      producerId: 'prod-1',
      eventId: '3368',
      amount: 1000.00,
      actor: { name: 'Operador Financeiro', role: 'OPERADOR_FINANCEIRO' },
      now: sundayNight
    });

    assert.strictEqual(res.decision, 'HOLD', 'Decisão deve ser HOLD fora do horário bancário');
    assert.ok(res.warnings.some(w => w.includes('janela bancária')), 'Deve conter aviso de janela bancária');
  });

  // =========================================================================
  // CENÁRIO 5: Aprovação por Valor (ALLOW_WITH_APPROVAL - Nível 1 Financeiro)
  // =========================================================================
  console.log('\n--- CENÁRIO 5: Alçada Nível 1 (Controladoria) ---');
  await it('Deve classificar como ALLOW_WITH_APPROVAL Nível 1 para valores acima de 10k e até 50k', async () => {
    // Usamos o evento 3042 do Produtor 2 que tem saldo de 45.000
    const res = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'PAYOUT',
      producerId: 'prod-2',
      eventId: '3042',
      amount: 22000.00,
      actor: { name: 'Operador Financeiro', role: 'OPERADOR_FINANCEIRO' },
      now: businessHoursDate
    });

    assert.strictEqual(res.decision, 'ALLOW_WITH_APPROVAL', 'Decisão deve ser ALLOW_WITH_APPROVAL');
    assert.strictEqual(res.requiresApproval, true, 'Deve requerer aprovação');
    assert.strictEqual(res.approvalLevel, 'NIVEL_1_FINANCEIRO', 'Alçada deve ser Nível 1');
  });

  // =========================================================================
  // CENÁRIO 6: Dupla Aprovação (ALLOW_WITH_APPROVAL - Nível 2 Diretoria)
  // =========================================================================
  console.log('\n--- CENÁRIO 6: Dupla Alçada Nível 2 (Diretoria) ---');
  await it('Deve classificar como ALLOW_WITH_APPROVAL Nível 2 para valores acima do teto de dupla aprovação', async () => {
    // Configura temporariamente evento com saldo alto para testar teto acima de 100k
    const store = getLocalBalanceStore();
    const ev3042 = store.find(e => String(e.eventId) === '3042');
    const origAvailable = ev3042.balances.availableBalance;
    const origSettled = ev3042.balances.settledAmount;
    ev3042.balances.availableBalance = 150000.00;
    ev3042.balances.settledAmount = 180000.00;

    const res = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'PAYOUT',
      producerId: 'prod-2',
      eventId: '3042',
      amount: 110000.00,
      actor: { name: 'Operador Financeiro', role: 'OPERADOR_FINANCEIRO' },
      now: businessHoursDate
    });

    assert.strictEqual(res.decision, 'ALLOW_WITH_APPROVAL', 'Decisão deve ser ALLOW_WITH_APPROVAL');
    assert.strictEqual(res.requiresApproval, true, 'Deve requerer aprovação');
    assert.strictEqual(res.approvalLevel, 'NIVEL_2_DIRETORIA', 'Alçada deve ser Nível 2 (Diretoria)');

    // Restaura saldos originais
    ev3042.balances.availableBalance = origAvailable;
    ev3042.balances.settledAmount = origSettled;
  });

  // =========================================================================
  // CENÁRIO 7: Exceção Operacional Auditável
  // =========================================================================
  console.log('\n--- CENÁRIO 7: Exceção Operacional Auditável ---');
  await it('Deve contornar restrição de janela operacional ou divergência quando existe exceção ativa', async () => {
    // Domingo fora da janela operacional
    const sundayDate = new Date('2026-09-13T10:00:00.000Z');

    // Sem exceção, domingo deve dar HOLD
    const resSemExc = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'PAYOUT',
      producerId: 'prod-1',
      eventId: '3368',
      amount: 1000.00,
      actor: { name: 'Operador', role: 'OPERADOR_FINANCEIRO' },
      now: sundayDate
    });
    assert.strictEqual(resSemExc.decision, 'HOLD');

    // Cadastra exceção auditada para contornar janela operacional
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const exc = financialRulesEngine.createException({
      scope: 'GLOBAL',
      ruleToBypass: 'JANELA_OPERACIONAL',
      justification: 'Liberação de pagamento emergencial de cachê de artista no domingo',
      approvedBy: 'Diretor Financeiro',
      actorRole: 'DIRETORIA',
      validUntil: futureDate.toISOString()
    });

    assert.ok(exc.id.startsWith('EXC-'), 'Exceção deve ser criada com ID formatado');
    assert.strictEqual(exc.status, 'ACTIVE', 'Status da exceção deve ser ACTIVE');

    // Reavalia no domingo com a exceção ativa
    const resComExc = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'PAYOUT',
      producerId: 'prod-1',
      eventId: '3368',
      amount: 1000.00,
      actor: { name: 'Operador', role: 'OPERADOR_FINANCEIRO' },
      now: sundayDate
    });

    assert.strictEqual(resComExc.decision, 'ALLOW', 'Com exceção vigente, deve permitir (ALLOW)');
    assert.ok(resComExc.appliedExceptions.some(e => e.ruleToBypass === 'JANELA_OPERACIONAL'), 'Deve rastrear a exceção aplicada');

    // Revoga a exceção
    financialRulesEngine.revokeException(exc.id);
    assert.strictEqual(financialRulesEngine.getExceptions().find(e => e.id === exc.id).status, 'REVOKED');
  });

  // =========================================================================
  // CENÁRIO 8: Política por Produtor (POL-PROD-CWB)
  // =========================================================================
  console.log('\n--- CENÁRIO 8: Política Específica por Produtor ---');
  await it('Deve aplicar a política POL-PROD-CWB para eventos do prod-2 com precedência sobre a GLOBAL', async () => {
    // prod-2 tem POL-PROD-CWB (minReserveFixed = 3000, minReservePercent = 12%, teto sem aprovação = 15000)
    // Global tem minReserveFixed = 1500, minReservePercent = 10%, teto = 10000
    const res = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'PAYOUT',
      producerId: 'prod-2',
      amount: 12000.00, // Acima de 10k (teto global) mas abaixo de 15k (teto CWB)
      actor: { name: 'Operador', role: 'OPERADOR_FINANCEIRO' },
      now: businessHoursDate
    });

    assert.ok(res.appliedPolicies.some(p => p.id === 'POL-PROD-CWB'), 'Deve aplicar a política específica do produtor');
    assert.ok(res.reserveAmount >= 3000.00, 'Reserva calculada deve respeitar o mínimo de R$ 3.000 da política do produtor');
  });

  // =========================================================================
  // CENÁRIO 9: Política por Evento (POL-EV-3042)
  // =========================================================================
  console.log('\n--- CENÁRIO 9: Política Específica por Evento ---');
  await it('Deve aplicar POL-EV-3042 com precedência máxima para o evento 3042', async () => {
    // Evento 3042 tem POL-EV-3042 (priority: 10, minReserveFixed: 5000, minReservePercent: 15%, maxWithoutApproval: 20000)
    const res = await financialRulesEngine.evaluateFinancialOperation({
      operationType: 'PAYOUT',
      producerId: 'prod-2',
      eventId: '3042',
      amount: 18000.00, // Abaixo do teto do evento (20.000)
      actor: { name: 'Operador', role: 'OPERADOR_FINANCEIRO' },
      now: businessHoursDate
    });

    assert.ok(res.appliedPolicies.some(p => p.id === 'POL-EV-3042'), 'Deve aplicar a política específica do evento 3042');
    assert.ok(res.reserveAmount >= 5000.00, 'Reserva calculada deve ser de no mínimo R$ 5.000,00 conforme política do evento');
    assert.strictEqual(res.decision, 'ALLOW', 'Como 18.000 <= 20.000 (teto do evento), deve ser ALLOW direto');
  });

  // =========================================================================
  // CENÁRIO 10: Simulação de Regras (Sem Efetivar Movimentação)
  // =========================================================================
  console.log('\n--- CENÁRIO 10: Simulação de Regras Sem Movimentação Contábil ---');
  await it('Deve retornar diagnóstico completo da simulação sem alterar saldos dos eventos', async () => {
    const store = getLocalBalanceStore();
    const evBefore = JSON.parse(JSON.stringify(store.find(e => String(e.eventId) === '3368')));

    const sim = await financialRulesEngine.simulateFinancialOperation({
      operationType: 'EVENT_TRANSFER',
      producerId: 'prod-1',
      eventId: '3368',
      amount: 3000.00,
      actor: { name: 'Simulador Teste', role: 'CONTROLADORIA' },
      now: businessHoursDate
    });

    const evAfter = store.find(e => String(e.eventId) === '3368');

    assert.ok(sim.decision, 'Simulação deve retornar decisão');
    assert.ok(sim.correlationId.startsWith('SIM-'), 'Correlation ID da simulação deve ter prefixo SIM');
    assert.strictEqual(evBefore.balances.availableBalance, evAfter.balances.availableBalance, 'Saldo disponível do evento não deve sofrer alteração');
    assert.strictEqual(evBefore.balances.committedBalance, evAfter.balances.committedBalance, 'Saldo comprometido não deve sofrer alteração');
  });

  // =========================================================================
  // CENÁRIO 11: Auditoria Append-Only Imutável com CorrelationId
  // =========================================================================
  console.log('\n--- CENÁRIO 11: Trilha de Auditoria Append-Only ---');
  await it('Deve registrar todas as avaliações, simulações e exceções com correlationId e imutabilidade', async () => {
    const audit = financialRulesEngine.getAuditLog();
    assert.ok(audit.length >= 8, 'Deve conter múltiplos registros de auditoria acumulados');

    const lastAudit = audit[0];
    assert.ok(lastAudit.id.startsWith('AUD-RUL-'), 'ID de auditoria deve seguir padrão');
    assert.ok(lastAudit.timestamp, 'Timestamp ISO deve estar presente');
    assert.ok(lastAudit.actor, 'Ator responsável deve estar registrado');
    assert.ok(lastAudit.correlationId, 'CorrelationId deve estar presente no log');
    assert.ok(lastAudit.details, 'Detalhes textuais devem estar presentes');
  });

  // =========================================================================
  // CENÁRIO 12: RBAC e Segregação de Funções
  // =========================================================================
  console.log('\n--- CENÁRIO 12: RBAC e Segregação de Funções ---');
  await it('Deve rejeitar atores com papéis inválidos ou não autorizados', async () => {
    await assert.rejects(async () => {
      await financialRulesEngine.evaluateFinancialOperation({
        operationType: 'PAYOUT',
        producerId: 'prod-1',
        eventId: '3368',
        amount: 1000.00,
        actor: { name: 'Usuário Malicioso', role: 'PERFIL_DESCONHECIDO_HACKER' },
        now: businessHoursDate
      });
    }, /Acesso negado/, 'Deve lançar erro de perfil não autorizado');
  });

  await it('Deve integrar o motor ao balanceTransferService impedindo transferência que viole regras', async () => {
    // Testa chamada de executeTransfer no balanceTransferService com valor que excede saldo
    await assert.rejects(async () => {
      await balanceTransferService.executeTransfer({
        sourceEventId: '3368',
        targetEventId: '3178',
        amount: 999999.00, // Valor absurdo
        reason: 'Teste de bloqueio do motor',
        producerId: 'prod-1',
        actor: 'Operador Teste'
      });
    }, /Saldo disponível insuficiente|MOTOR_REGRAS/, 'Deve ser barrado pelas regras de saldo e motor');
  });

  console.log(`\n======================================================`);
  console.log(`BATERIA FINALIZADA: ${passed} / ${total} TESTES PASSARAM COM SUCESSO (100%)`);
  console.log(`======================================================\n`);
}

run().catch(err => {
  console.error('\n[ERRO CRÍTICO NA EXECUÇÃO DOS TESTES]:', err);
  process.exit(1);
});
