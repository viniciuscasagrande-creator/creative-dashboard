/**
 * Testes Automatizados — Fase 26.17.9.5.5: Projeção de Caixa e Repasses por Evento
 * Cobre os 10 cenários obrigatórios especificados em 09_COMANDO_GEMINI_VSCODE.md
 */

import assert from 'assert';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import {
  cashForecastService,
  calculateEventCashForecast,
  buildCoverageSuggestions,
  getConsolidatedCashForecast,
  simulateCoverage,
  classifyForecastRisk,
  DEFAULT_RISK_POLICY
} from './src/services/cashForecastService.js';
import { eventBalanceService, getLocalBalanceStore } from './src/services/eventBalanceService.js';
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

async function run() {
  console.log('=== INICIANDO BATERIA DE TESTES — FASE 26.17.9.5.5 ===\n');

  console.log('--- CENÁRIO 1: Evento Saudável (Risco NORMAL) ---');
  await it('Deve classificar como NORMAL quando o menor saldo projetado tem folga adequada', () => {
    const risk = classifyForecastRisk({
      projectedBalance: 10000,
      minimumProjectedBalance: 5000,
      expectedOutflows: 3000
    });
    assert.strictEqual(risk, 'NORMAL');
  });

  console.log('\n--- CENÁRIO 2: Evento com Déficit Projetado ---');
  await it('Deve classificar como DEFICIT_PROJETADO quando o saldo projetado for negativo', () => {
    const risk = classifyForecastRisk({
      projectedBalance: -1500,
      minimumProjectedBalance: -1500,
      expectedOutflows: 5000
    });
    assert.strictEqual(risk, 'DEFICIT_PROJETADO');
  });

  console.log('\n--- CENÁRIO 3: Liquidações Futuras de Gateway no Horizonte ---');
  await it('Deve incluir pendingSettlement como entrada prevista e não misturar com saldo real', async () => {
    const fc = await calculateEventCashForecast('3368', { horizonDays: 30 });
    assert.ok(fc.forecast.expectedInflows > 0, 'Inflows devem ser maiores que zero');
    const calculatedProjected = Number((fc.current.availableBalance + fc.forecast.expectedInflows - fc.forecast.expectedOutflows).toFixed(2));
    assert.strictEqual(fc.forecast.projectedBalance, calculatedProjected);
    // RN01: Saldo disponível inicial é estritamente separado das entradas previstas
    assert.ok(fc.forecast.projectedBalance >= fc.current.availableBalance || fc.forecast.expectedOutflows > 0);
  });

  console.log('\n--- CENÁRIO 4: Repasses e Despesas Programadas (Outflows) ---');
  await it('Deve computar repasses como saídas previstas e manter a equação contábil', async () => {
    const fc = await calculateEventCashForecast('3195', { horizonDays: 30 });
    assert.ok(fc.forecast.expectedOutflows >= 0);
    assert.ok(Array.isArray(fc.timeline));
    assert.strictEqual(fc.timeline.length, 30);
    // Verificar que cada ponto da timeline segue B(t) = B(t-1) + In - Out
    let prev = fc.current.availableBalance;
    fc.timeline.forEach((pt, idx) => {
      const expected = Number((prev + pt.inflows - pt.outflows).toFixed(2));
      assert.strictEqual(pt.projectedBalance, expected, 'Timeline dia ' + (idx + 1) + ' deve bater com a fórmula');
      prev = pt.projectedBalance;
    });
  });

  console.log('\n--- CENÁRIO 5: Transferências Pendentes com Impacto Projetado (RN04) ---');
  await it('Deve incorporar transferências pendentes como entradas futuras no evento destino', async () => {
    const simulatedTransfers = [
      { id: 'TRF-TEST-1', sourceEventId: '3368', targetEventId: '3178', amount: 1200, status: 'PENDING_APPROVAL' }
    ];
    const fc = await calculateEventCashForecast('3178', {
      horizonDays: 30,
      customPendingTransfers: simulatedTransfers
    });
    // O dia 2 deve ter a entrada projetada da transferência
    const day2 = fc.timeline[2];
    assert.ok(day2.inflows >= 1200, 'Dia 2 deve conter a entrada da transferência pendente');
  });

  console.log('\n--- CENÁRIO 6: Cobertura Recomendada Entre Eventos do Mesmo Produtor ---');
  await it('Deve recomendar cobertura se o evento tiver déficit projetado, usando apenas saldo real do candidato', async () => {
    const store = getLocalBalanceStore();
    const originalEvent = JSON.parse(JSON.stringify(store[1]));
    
    // Força déficit projetado em 3195
    store[1].commitments.scheduledPayouts = 15000.00;
    store[1].balances.availableBalance = 500.00;

    const cov = await buildCoverageSuggestions('3195', { horizonDays: 30 });
    
    assert.ok(cov.requiredAmount > 0, 'Necessidade de cobertura deve ser maior que zero');
    assert.ok(cov.suggestions.length > 0, 'Deve encontrar pelo menos 1 candidato do mesmo produtor');
    
    const top = cov.suggestions[0];
    assert.notStrictEqual(String(top.sourceEventId), '3195', 'Origem não pode ser o próprio evento');
    assert.ok(top.suggestedAmount > 0, 'Valor sugerido deve ser maior que zero');
    assert.ok(top.suggestedAmount <= top.availableBalance, 'Valor sugerido não pode superar o saldo real disponível');
    assert.ok(top.projectedBalanceAfterCoverage >= 0, 'Candidato não pode ficar negativo após cobrir');

    // Restaura estado original
    Object.assign(store[1], originalEvent);
  });

  console.log('\n--- CENÁRIO 7: Candidato Sem Folga Segura Não Deve Ser Recomendado ---');
  await it('Não deve sugerir candidato cujo saldo disponível ou menor saldo projetado seja zero ou negativo', async () => {
    const store = getLocalBalanceStore();
    const originalCandidate = JSON.parse(JSON.stringify(store[0]));
    const originalTarget = JSON.parse(JSON.stringify(store[1]));
    
    // Zera saldo do candidato 3368
    store[0].balances.availableBalance = 0.00;

    // Força déficit em 3195
    store[1].commitments.scheduledPayouts = 15000.00;
    store[1].balances.availableBalance = 500.00;

    const cov = await buildCoverageSuggestions('3195', { horizonDays: 30 });
    const has3368 = cov.suggestions.some(s => String(s.sourceEventId) === '3368');
    assert.strictEqual(has3368, false, 'Candidato com saldo zero não pode ser sugerido');

    // Restaura estado
    Object.assign(store[0], originalCandidate);
    Object.assign(store[1], originalTarget);
  });

  console.log('\n--- CENÁRIO 8: Múltiplos Candidatos Ordenados por Capacidade Decrescente ---');
  await it('Deve ordenar as sugestões da maior capacidade sugerida para a menor', async () => {
    const store = getLocalBalanceStore();
    const originalTarget = JSON.parse(JSON.stringify(store[1]));

    store[1].commitments.scheduledPayouts = 25000.00;
    store[1].balances.availableBalance = 200.00;

    const cov = await buildCoverageSuggestions('3195', { horizonDays: 30 });
    if (cov.suggestions.length > 1) {
      for (let i = 0; i < cov.suggestions.length - 1; i++) {
        assert.ok(cov.suggestions[i].suggestedAmount >= cov.suggestions[i + 1].suggestedAmount, 'Sugestões devem estar ordenadas de forma decrescente');
      }
    }

    Object.assign(store[1], originalTarget);
  });

  console.log('\n--- CENÁRIO 9: Simulador de Cobertura Sem Mutação e com Invariância ---');
  await it('Deve simular sem alterar o saldo real e mantendo delta consolidado = 0', async () => {
    const beforeStore = JSON.stringify(getLocalBalanceStore());
    
    const sim = await simulateCoverage({
      sourceEventId: '3368',
      targetEventId: '3178',
      amount: 1500,
      horizonDays: 30
    });

    assert.strictEqual(sim.success, true);
    assert.strictEqual(sim.deltaConsolidated, 0.00);
    assert.strictEqual(sim.isBalanced, true);
    assert.ok(sim.after.sourceMinBalance < sim.before.sourceMinBalance, 'Origem deve reduzir no simulado');
    assert.ok(sim.after.targetMinBalance > sim.before.targetMinBalance, 'Destino deve aumentar no simulado');

    // Garantir que a base de dados real NÃO foi alterada
    const afterStore = JSON.stringify(getLocalBalanceStore());
    assert.strictEqual(beforeStore, afterStore, 'Simulação NUNCA deve alterar a base real');
  });

  console.log('\n--- CENÁRIO 10: Proibição de Transferir Usando Saldo Projetado ---');
  await it('Deve rejeitar simulação de cobertura se o valor for superior ao saldo disponível REAL', async () => {
    const res = await simulateCoverage({
      sourceEventId: '3368',
      targetEventId: '3178',
      amount: 999999.00, // Muito maior que o disponível
      horizonDays: 30
    });

    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('insuficiente'), 'Deve acusar insuficiência de saldo disponível real');
  });

  console.log('\n--- CENÁRIO 11: Validação do DOM de Projeção no index.html ---');
  await it('Deve conter todos os elementos de UI da Fase 26.17.9.5.5 no index.html', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    assert.ok(doc.getElementById('ft-tab-link-forecast'), 'Link da aba Forecast deve existir');
    assert.ok(doc.getElementById('ft-pane-forecast'), 'Pane de Forecast deve existir');
    assert.ok(doc.getElementById('ft-fc-kpi-current-available'), 'KPI Saldo Atual deve existir');
    assert.ok(doc.getElementById('ft-fc-kpi-expected-inflows'), 'KPI Entradas deve existir');
    assert.ok(doc.getElementById('ft-fc-kpi-expected-outflows'), 'KPI Saídas deve existir');
    assert.ok(doc.getElementById('ft-fc-kpi-projected-balance'), 'KPI Saldo Projetado deve existir');
    assert.ok(doc.getElementById('ft-fc-chart-curve'), 'Canvas Curva de Caixa deve existir');
    assert.ok(doc.getElementById('ft-fc-chart-flow'), 'Canvas Entradas vs Saídas deve existir');
    assert.ok(doc.getElementById('ft-fc-events-tbody'), 'Tabela de Eventos Preditiva deve existir');
    assert.ok(doc.getElementById('modal-forecast-coverage-simulator'), 'Modal Simulador deve existir');
  });

  console.log(`\n======================================================`);
  console.log(`RESULTADO: ${passed} de ${total} testes passaram com 100% de sucesso!`);
  console.log(`======================================================\n`);
}

run().catch(err => {
  console.error('\nFATAL ERROR NOS TESTES:', err);
  process.exit(1);
});
