/**
 * Bateria de Testes Automatizados — Fase 26.17.9.4.5
 * Procure-to-Pay do SafeSaff / PDT: Fornecedores + Compras + Contratos + Aprovação Financeira
 */

import assert from 'node:assert';
import { procureToPayService } from '../../src/services/procureToPayService.js';
import { procureToPayGateway } from '../../src/services/procureToPayGateway.js';

let passed = 0;
let total = 0;

async function it(desc, fn) {
  total++;
  try {
    await fn();
    console.log(`  [PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}`);
    console.error(err);
    throw err;
  }
}

async function run() {
  console.log('=== INICIANDO BATERIA DE TESTES — FASE 26.17.9.4.5 (PROCURE-TO-PAY) ===\n');

  // =========================================================================
  // CENÁRIO 1: Cadastro de Fornecedor e Visão 360°
  // =========================================================================
  console.log('--- CENÁRIO 1: Central de Fornecedores & Visão 360° ---');
  await it('Deve listar fornecedores homologados com dados bancários completos e PIX', async () => {
    const res = await procureToPayService.getSuppliers({ producerId: 'prod-1' });
    assert.ok(res.ok, 'Resposta deve ser ok');
    assert.ok(res.data.length >= 3, 'Deve conter os fornecedores iniciais cadastrados');

    const lumina = res.data.find(s => s.id === 'SUP-001');
    assert.ok(lumina, 'Lumina Pro deve estar cadastrada');
    assert.strictEqual(lumina.status, 'HOMOLOGADO');
    assert.ok(lumina.bankAccount.pixKey, 'Chave PIX deve estar cadastrada');
    assert.strictEqual(lumina.bankAccount.bankCode, '001');
  });

  await it('Deve carregar a Visão 360° do fornecedor com contratos e métricas financeiras consolidadas', async () => {
    const res = await procureToPayService.getSupplierById('SUP-001');
    assert.ok(res.ok);
    const view360 = res.data;
    assert.strictEqual(view360.tradeName, 'Lumina Event Pro');
    assert.ok(view360.financialMetrics.totalContracted > 0, 'Deve computar total contratado');
    assert.ok(Array.isArray(view360.relatedContracts), 'Deve listar contratos relacionados');
    assert.ok(Array.isArray(view360.relatedPayables), 'Deve listar contas a pagar');
  });

  await it('Deve rejeitar cadastro de fornecedor com CNPJ duplicado', async () => {
    await assert.rejects(async () => {
      await procureToPayService.createSupplier({
        legalName: 'Outra Empresa de Som',
        tradeName: 'Lumina Clone',
        taxId: '18.234.567/0001-89', // Mesmo CNPJ da Lumina
        producerId: 'prod-1'
      });
    }, /já cadastrado/, 'Deve impedir duplicidade de documento');
  });

  // =========================================================================
  // CENÁRIO 2: Documentos e Certidões (CNDs)
  // =========================================================================
  console.log('\n--- CENÁRIO 2: Conformidade Regulatória e Documentos ---');
  await it('Deve identificar certidões vencidas e suspender homologação para PENDENTE_DOCS', async () => {
    const starCatering = (await procureToPayService.getSupplierById('SUP-004')).data;
    assert.strictEqual(starCatering.status, 'PENDENTE_DOCS', 'Fornecedor com documento vencido deve estar como PENDENTE_DOCS');
    const expired = starCatering.documents.find(d => d.status === 'EXPIRADO');
    assert.ok(expired, 'Deve acusar CND vencida');
  });

  // =========================================================================
  // CENÁRIO 3: Taxonomia e Categorias para Eventos
  // =========================================================================
  console.log('\n--- CENÁRIO 3: Taxonomia Especializada em Eventos ---');
  await it('Deve conter as 23 categorias especializadas de compras de eventos', async () => {
    const categories = procureToPayService.getTaxonomyCategories();
    assert.strictEqual(categories.length, 23, 'Deve conter as 23 categorias oficiais');
    assert.ok(categories.includes('Iluminação Cênica'));
    assert.ok(categories.includes('Sonorização (PA/Delay)'));
    assert.ok(categories.includes('Licenças, Alvarás e ECAD'));
  });

  // =========================================================================
  // CENÁRIO 4: Solicitação de Compra (Purchase Request)
  // =========================================================================
  console.log('\n--- CENÁRIO 4: Solicitação de Compra ---');
  let createdRequestId = '';
  await it('Deve criar solicitação de compra em rascunho com múltiplos itens e cálculo de valor total', async () => {
    const res = await procureToPayService.createPurchaseRequest({
      producerId: 'prod-1',
      eventId: '3368',
      eventName: 'Música e Natureza',
      costCenterId: 'cc-prod-02',
      description: 'Locação de microfones sem fio de alta fidelidade',
      items: [
        { description: 'Microfone Shure Axient Digital', quantity: 4, estimatedUnitPrice: 500.00 },
        { description: 'Sistema In-Ear PSM 1000', quantity: 2, estimatedUnitPrice: 800.00 }
      ]
    }, { id: 'usr-oper-99', name: 'Técnico de Áudio', role: 'OPERADOR_EVENTO' });

    assert.ok(res.ok);
    assert.strictEqual(res.data.status, 'DRAFT');
    assert.strictEqual(res.data.estimatedTotalAmount, 3600.00);
    createdRequestId = res.data.id;
  });

  await it('Deve submeter solicitação para aprovação e enfileirar na Central de Aprovações', async () => {
    const res = await procureToPayService.submitPurchaseRequest(createdRequestId, {
      id: 'usr-oper-99',
      name: 'Técnico de Áudio',
      role: 'OPERADOR_EVENTO'
    });

    assert.strictEqual(res.data.status, 'PENDING_APPROVAL');
    
    // Verifica se caiu na Inbox de aprovação
    const inbox = await procureToPayService.getApprovalInbox({ producerId: 'prod-1' });
    const found = inbox.data.find(i => i.entityId === createdRequestId);
    assert.ok(found, 'Solicitação submetida deve figurar na fila de aprovações');
  });

  // =========================================================================
  // CENÁRIO 5: Cotações Multi-Propostas e Escolha Ponderada
  // =========================================================================
  console.log('\n--- CENÁRIO 5: Cotações e Multi-Propostas ---');
  let quoteId = '';
  await it('Deve abrir cotação para solicitação e registrar propostas concorrentes', async () => {
    const qRes = await procureToPayService.createQuotation({
      purchaseRequestId: createdRequestId,
      producerId: 'prod-1',
      eventId: '3368',
      costCenterId: 'cc-prod-02'
    }, { name: 'Comprador Rogério', role: 'COMPRAS' });

    quoteId = qRes.data.id;

    // Proposta 1: Menor preço, prazo maior
    await procureToPayService.addQuotationProposal(quoteId, {
      supplierId: 'SUP-002',
      totalAmount: 3200.00,
      deliveryDays: 7,
      score: 75,
      notes: 'Equipamentos padrão'
    });

    // Proposta 2: Preço um pouco maior, entrega em 24h e equipamentos rider homologados
    const prop2Res = await procureToPayService.addQuotationProposal(quoteId, {
      supplierId: 'SUP-001',
      totalAmount: 3500.00,
      deliveryDays: 1,
      score: 95,
      notes: 'Equipamentos topo de linha com técnico de plantão'
    });

    const quoteAfter = (await procureToPayService.getQuotations({ requestId: createdRequestId })).data[0];
    assert.strictEqual(quoteAfter.proposals.length, 2);
    assert.strictEqual(quoteAfter.status, 'EM_ANALISE');
  });

  await it('Deve permitir seleção de proposta com justificativa técnica formal (não apenas menor preço)', async () => {
    const quote = (await procureToPayService.getQuotations({ requestId: createdRequestId })).data[0];
    const winningProp = quote.proposals.find(p => p.supplierId === 'SUP-001');

    const res = await procureToPayService.selectWinningProposal(
      quoteId,
      winningProp.id,
      'Selecionada proposta da Lumina Pro devido ao prazo imediato de 24h e homologação do rider pelo artista.',
      'Rogério Medeiros',
      { name: 'Rogério Medeiros', role: 'COMPRAS' }
    );

    assert.ok(res.ok);
    assert.strictEqual(res.data.status, 'FINALIZADA');
    assert.strictEqual(res.data.selectedProposalId, winningProp.id);
  });

  // =========================================================================
  // CENÁRIO 6: Pedido de Compra e Comprometimento Orçamentário
  // =========================================================================
  console.log('\n--- CENÁRIO 6: Pedido de Compra & Comprometimento Orçamentário ---');
  await it('Deve emitir pedido de compra #PC-XXXXXX e registrar comprometimento no orçamento do evento', async () => {
    const budgetBefore = procureToPayService.getEventBudgets({ producerId: 'prod-1', eventId: '3368' })
      .find(b => b.costCenterId === 'cc-prod-02');
    const commitedBefore = budgetBefore.committedAmount;

    const poRes = await procureToPayService.createPurchaseOrder({
      purchaseRequestId: createdRequestId,
      producerId: 'prod-1',
      eventId: '3368',
      eventName: 'Música e Natureza',
      costCenterId: 'cc-prod-02',
      supplierId: 'SUP-001',
      totalAmount: 3500.00
    }, { name: 'Comprador Rogério', role: 'COMPRAS' });

    assert.ok(poRes.ok);
    assert.ok(poRes.data.id.startsWith('PC-'));
    assert.strictEqual(poRes.data.isBudgetCommitted, true, 'Comprometimento deve estar ativo');

    const budgetAfter = procureToPayService.getEventBudgets({ producerId: 'prod-1', eventId: '3368' })
      .find(b => b.costCenterId === 'cc-prod-02');
    assert.strictEqual(budgetAfter.committedAmount, Number((commitedBefore + 3500.00).toFixed(2)), 'Deve adicionar ao saldo comprometido');
  });

  // =========================================================================
  // CENÁRIO 7: Gestão de Contratos e Parcelamento no Contas a Pagar
  // =========================================================================
  console.log('\n--- CENÁRIO 7: Gestão de Contratos & Parcelamento Automático ---');
  await it('Deve criar contrato formal e gerar automaticamente as previsões no Contas a Pagar', async () => {
    const payablesBefore = (await procureToPayService.getPayables({ producerId: 'prod-1' })).data.length;

    const ctRes = await procureToPayService.createContract({
      producerId: 'prod-1',
      supplierId: 'SUP-002',
      totalAmount: 18000.00,
      installmentsCount: 3,
      objectDescription: 'Locação contínua de geradores para temporada',
      allocations: [
        { eventId: '3368', eventName: 'Música e Natureza', percentage: 60.00 },
        { eventId: '3178', eventName: 'Feijoada PET', percentage: 40.00 }
      ]
    }, { name: 'Vinicius Casagrande', role: 'DIRETORIA' });

    assert.ok(ctRes.ok);
    assert.strictEqual(ctRes.data.installments.length, 3);

    const payablesAfter = (await procureToPayService.getPayables({ producerId: 'prod-1' })).data.length;
    assert.strictEqual(payablesAfter, payablesBefore + 3, 'Deve gerar exatamente 3 parcelas no Contas a Pagar');
  });

  // =========================================================================
  // CENÁRIO 8: Validação Rígida de Rateio Multi-Evento (Regra dos 100%)
  // =========================================================================
  console.log('\n--- CENÁRIO 8: Validação Rígida de Rateio Multi-Evento (100%) ---');
  await it('Deve rejeitar criação de contrato se a soma dos percentuais de rateio diferir de 100%', async () => {
    await assert.rejects(async () => {
      await procureToPayService.createContract({
        producerId: 'prod-1',
        supplierId: 'SUP-001',
        totalAmount: 10000.00,
        allocations: [
          { eventId: '3368', percentage: 50.00 },
          { eventId: '3178', percentage: 30.00 } // Totaliza 80% (Incompleto!)
        ]
      });
    }, /Rateio Violada|RIGOROSAMENTE 100/, 'Deve rejeitar rateio diferente de 100%');
  });

  // =========================================================================
  // CENÁRIO 9: Segregação de Funções (Maker / Checker)
  // =========================================================================
  console.log('\n--- CENÁRIO 9: Segregação de Funções (Maker / Checker) ---');
  await it('Deve barrar autoaprovação quando o solicitante tenta aprovar seu próprio pedido', async () => {
    // Busca a solicitação APP-0001 (solicitante: Matheus Brandão)
    const inbox = (await procureToPayService.getApprovalInbox({ producerId: 'prod-1' })).data;
    const item = inbox.find(i => i.requesterName.includes('Matheus Brandão'));
    assert.ok(item, 'Item de Matheus deve estar na fila');

    await assert.rejects(async () => {
      await procureToPayService.processApprovalDecision({
        inboxItemId: item.id,
        decision: 'APPROVED',
        actor: { name: 'Matheus Brandão', role: 'GESTOR_EVENTO' } // Tentativa de autoaprovação!
      });
    }, /Maker\/Checker/, 'Deve impedir autoaprovação com erro de Maker/Checker');
  });

  // =========================================================================
  // CENÁRIO 10: Controle Orçamentário Prévio
  // =========================================================================
  console.log('\n--- CENÁRIO 10: Controle Orçamentário Prévio ---');
  await it('Deve diagnosticar estouro de orçamento disponível antes da contratação', async () => {
    const check = procureToPayService.checkBudgetAvailability({
      producerId: 'prod-1',
      eventId: '3178',
      costCenterId: 'cc-prod-03',
      amount: 99999.00 // Valor muito acima do disponível
    });

    assert.strictEqual(check.isOverbudget, true, 'Deve apontar estouro de orçamento');
    assert.ok(check.difference > 90000, 'Diferença deve apontar déficit orçamentário');
  });

  // =========================================================================
  // CENÁRIO 11: Conferência Tríplice 3-Way Match
  // =========================================================================
  console.log('\n--- CENÁRIO 11: Conferência 3-Way Match ---');
  await it('Deve bloquear liberação de pagamento se a Nota Fiscal apresentar divergência de valor com o Pedido', async () => {
    const matchRes = procureToPayService.executeThreeWayMatch({
      purchaseOrderId: 'PC-000101', // Valor R$ 6.400,00
      invoiceAmount: 7200.00,        // Divergência de R$ 800,00
      invoiceNumber: 'NF-1234'
    });

    assert.strictEqual(matchRes.data.isClearedForPayment, false, 'Não deve liberar pagamento com divergência de valor');
    assert.strictEqual(matchRes.data.matchStatus, 'PRICE_DISCREPANCY');
    assert.strictEqual(matchRes.data.amountDifference, 800.00);
  });

  await it('Deve aprovar conferência e liberar pagamento quando Pedido x Recebimento x NF conferem 100%', async () => {
    const matchRes = procureToPayService.executeThreeWayMatch({
      purchaseOrderId: 'PC-000101',
      invoiceAmount: 6400.00,
      invoiceNumber: 'NF-1234'
    });

    assert.strictEqual(matchRes.data.isClearedForPayment, true, 'Deve liberar pagamento quando 100% conferido');
    assert.strictEqual(matchRes.data.matchStatus, 'MATCHED');
  });

  // =========================================================================
  // CENÁRIO 12: Central de Aprovações (Inbox)
  // =========================================================================
  console.log('\n--- CENÁRIO 12: Central de Aprovações Unificada ---');
  await it('Deve aprovar item por aprovador autorizado e atualizar status em cascata', async () => {
    const inbox = (await procureToPayService.getApprovalInbox({ producerId: 'prod-1' })).data;
    const item = inbox[0];

    const res = await procureToPayService.processApprovalDecision({
      inboxItemId: item.id,
      decision: 'APPROVED',
      justification: 'Aprovado dentro da alçada financeira regular.',
      actor: { name: 'Diretoria Executiva', role: 'DIRETORIA' }
    });

    assert.ok(res.ok);
    assert.strictEqual(res.data.status, 'APPROVED');
  });

  // =========================================================================
  // CENÁRIO 13: Trilha de Auditoria Append-Only
  // =========================================================================
  console.log('\n--- CENÁRIO 13: Trilha de Auditoria Imutável Append-Only ---');
  await it('Deve conter registros de auditoria com correlationId e imutabilidade', async () => {
    const auditLogs = procureToPayService.getProcureAuditLog();
    assert.ok(auditLogs.length >= 8, 'Deve conter histórico de auditoria acumulado');
    const last = auditLogs[0];
    assert.ok(last.correlationId.startsWith('P2P-'), 'CorrelationId deve conter prefixo P2P');
    assert.ok(last.timestamp);
    assert.ok(last.actor.name);
  });

  // =========================================================================
  // CENÁRIO 14: Alertas Operacionais Proativos
  // =========================================================================
  console.log('\n--- CENÁRIO 14: Alertas Operacionais Proativos ---');
  await it('Deve gerar alertas proativos de fornecedores com CNDs expiradas e contas a pagar', async () => {
    const res = await procureToPayService.getOperationalAlerts('prod-1');
    const alerts = res.data || res || [];
    assert.ok(alerts.length >= 1, 'Deve emitir alertas operacionais ativos');
    assert.ok(alerts.some(a => a.type === 'SUPPLIER_DOC_EXPIRED' || a.type === 'PENDING_APPROVAL'));
  });

  console.log('\n======================================================');
  console.log(`BATERIA FINALIZADA: ${passed} / ${total} TESTES PASSARAM COM SUCESSO (100%)`);
  console.log('======================================================\n');
}

run().catch(err => {
  console.error('\n[ERRO CRÍTICO NA EXECUÇÃO DOS TESTES]:', err);
  process.exit(1);
});
