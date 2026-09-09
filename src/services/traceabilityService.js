/**
 * Fase 26.17.8.3 — Rastreabilidade Financeiro → Contábil
 * Serviço de Rastreabilidade 360º de Pedidos e Transações
 *
 * Endpoints cobertos:
 * - GET  /api/accounting/traceability/search
 * - GET  /api/accounting/traceability/orders/:orderId
 * - GET  /api/accounting/traceability/orders/:orderId/timeline
 * - GET  /api/accounting/traceability/orders/:orderId/accounting-entries
 * - GET  /api/accounting/traceability/orders/:orderId/audit-log
 * - POST /api/accounting/traceability/orders/:orderId/audit-log
 */

const STORAGE_ORDERS_KEY = 'accounting_traceability_orders_v1';
const STORAGE_AUDIT_KEY = 'accounting_traceability_audit_v1';

const INITIAL_TRACEABILITY_ORDERS = [
  {
    orderId: "#123456",
    producerId: "prod-001",
    createdAt: "2026-09-08T14:30:00Z",
    eventName: "Festival de Verão Pedreira 2026",
    producerName: "Live Entretenimento Ltda",
    customerName: "Lucas Martins Silveira",
    paymentMethod: "Cartão de Crédito (Stone)",
    gateway: "Stone / Pagar.me",
    transactionId: "TRX-928183",
    nsu: "0491823",
    tid: "STN-928183019",
    financialStatus: "Liquidado",
    reconciliationStatus: "Conciliado com Ressalva",
    accountingStatus: "Postado",
    composition: {
      ticketFaceValue: 150.00,
      convenienceFee: 15.00,
      discounts: 0.00,
      additions: 0.00,
      totalPaid: 165.00,
      gatewayFee: 4.95,
      acquiringFee: 0.00,
      antifraudFee: 0.00,
      anticipationFee: 0.00,
      diskRevenue: 10.05,
      producerAmount: 150.00,
      taxes: 1.25,
      netAmount: 158.80
    },
    timeline: [
      { id: "tl-1", label: "Pedido Criado no PDT", occurredAt: "2026-09-08T14:30:12Z", status: "CONCLUIDO", source: "PDT Checkout", referenceId: "#123456", amount: 165.00, description: "Compra de 1x Pista Premium realizada pelo cliente Lucas Martins" },
      { id: "tl-2", label: "Pagamento Autorizado e Capturado", occurredAt: "2026-09-08T14:30:18Z", status: "CONCLUIDO", source: "Gateway Stone", referenceId: "TRX-928183", amount: 165.00, description: "Autorização NSU 0491823 aprovada via antifraude score 98/100" },
      { id: "tl-3", label: "Liquidação Bancária Confirmada (D+1)", occurredAt: "2026-09-09T08:15:00Z", status: "CONCLUIDO", source: "Extrato Itaú", referenceId: "EXT-89210-4", amount: 160.05, description: "Depósito líquido recebido após desconto MDR Stone de R$ 4,95" },
      { id: "tl-4", label: "Split de Pagamento Calculado", occurredAt: "2026-09-09T08:16:30Z", status: "CONCLUIDO", source: "Motor de Split PDT", referenceId: "SPLIT-123456", amount: 160.05, description: "Segregação: R$ 150,00 Passivo Produtor | R$ 10,05 Receita Própria Disk" },
      { id: "tl-5", label: "Receita Disk Reconhecida (Competência)", occurredAt: "2026-09-09T08:17:00Z", status: "CONCLUIDO", source: "Módulo Contábil", referenceId: "REC-2026-09-881", amount: 10.05, description: "Lançamento a crédito na Conta 3.1.01 (Receita Taxa Conveniência)" },
      { id: "tl-6", label: "Provisão de Repasse Programada", occurredAt: "2026-09-09T08:18:00Z", status: "PROCESSANDO", source: "Módulo Financeiro", referenceId: "PAYOUT-PROV-901", amount: 150.00, description: "Agendado para D+2 após encerramento do evento conforme contrato" }
    ],
    accountingEntries: [
      {
        id: "acc-entry-1",
        occurredAt: "2026-09-08T14:30:18Z",
        debitAccount: "1.1.02.01",
        debitAccountName: "Adquirentes / Gateways a Liquidar",
        creditAccount: "2.1.03.01",
        creditAccountName: "Recursos de Terceiros - Repasses a Produtores",
        history: "Reconhecimento do valor nominal de ingressos de terceiros - Pedido #123456",
        documentReference: "PED-#123456",
        costCenter: "CC-102 Eventos Próprios / Pedreira",
        eventName: "Festival de Verão Pedreira 2026",
        producerName: "Live Entretenimento Ltda",
        amount: 150.00,
        status: "POSTADO"
      },
      {
        id: "acc-entry-2",
        occurredAt: "2026-09-08T14:30:18Z",
        debitAccount: "1.1.02.01",
        debitAccountName: "Adquirentes / Gateways a Liquidar",
        creditAccount: "3.1.01.01",
        creditAccountName: "Receita Bruta de Serviços - Taxa de Conveniência",
        history: "Apropriação de taxa de conveniência DiskIngressos - Pedido #123456",
        documentReference: "PED-#123456",
        costCenter: "CC-201 Plataforma Digital Disk",
        eventName: "Festival de Verão Pedreira 2026",
        producerName: "Live Entretenimento Ltda",
        amount: 15.00,
        status: "POSTADO"
      },
      {
        id: "acc-entry-3",
        occurredAt: "2026-09-09T08:15:00Z",
        debitAccount: "1.1.01.02",
        debitAccountName: "Banco Itaú C/C 89210-4",
        creditAccount: "1.1.02.01",
        creditAccountName: "Adquirentes / Gateways a Liquidar",
        history: "Liquidação financeira Stone na conta corrente bancária",
        documentReference: "EXT-89210-4",
        costCenter: "CC-001 Tesouraria Central",
        eventName: "Festival de Verão Pedreira 2026",
        producerName: "Live Entretenimento Ltda",
        amount: 160.05,
        status: "CONCILIADO"
      },
      {
        id: "acc-entry-4",
        occurredAt: "2026-09-09T08:15:00Z",
        debitAccount: "4.1.01.01",
        debitAccountName: "Custos Financeiros - Tarifas de Adquirência / MDR",
        creditAccount: "1.1.02.01",
        creditAccountName: "Adquirentes / Gateways a Liquidar",
        history: "Desconto contratual de tarifa MDR Stone sobre transação",
        documentReference: "EXT-89210-4",
        costCenter: "CC-201 Plataforma Digital Disk",
        eventName: "Festival de Verão Pedreira 2026",
        producerName: "Live Entretenimento Ltda",
        amount: 4.95,
        status: "CONCILIADO"
      },
      {
        id: "acc-entry-5",
        occurredAt: "2026-09-09T08:17:00Z",
        debitAccount: "3.2.01.01",
        debitAccountName: "Deduções da Receita - Provisão ISSQN (5%)",
        creditAccount: "2.1.05.02",
        creditAccountName: "Impostos a Recolher - ISS Retido / Próprio",
        history: "Provisão de tributo municipal sobre receita de conveniência",
        documentReference: "NFSe-PROV-123456",
        costCenter: "CC-201 Plataforma Digital Disk",
        eventName: "Festival de Verão Pedreira 2026",
        producerName: "Live Entretenimento Ltda",
        amount: 0.75,
        status: "POSTADO"
      }
    ]
  },
  {
    orderId: "#123488",
    producerId: "prod-002",
    createdAt: "2026-09-07T18:10:00Z",
    eventName: "Stand-up Comedy Gala",
    producerName: "Opus Promoções Culturais",
    customerName: "Carla P. Fagundes",
    paymentMethod: "Cartão de Débito (Pagar.me)",
    gateway: "Pagar.me / Stone",
    transactionId: "tid_99482103",
    nsu: "0882194",
    tid: "PAG-99482103-X",
    financialStatus: "Aguardando Depósito",
    reconciliationStatus: "Divergente - Sem Liquidação",
    accountingStatus: "Pendente",
    composition: {
      ticketFaceValue: 200.00,
      convenienceFee: 20.00,
      discounts: 0.00,
      additions: 0.00,
      totalPaid: 220.00,
      gatewayFee: 5.80,
      acquiringFee: 0.00,
      antifraudFee: 0.00,
      anticipationFee: 0.00,
      diskRevenue: 14.20,
      producerAmount: 200.00,
      taxes: 1.00,
      netAmount: 213.20
    },
    timeline: [
      { id: "tl-10", label: "Pedido Criado", occurredAt: "2026-09-07T18:10:00Z", status: "CONCLUIDO", source: "PDT", referenceId: "#123488", amount: 220.00, description: "Compra 2x Ingresso Balcão" },
      { id: "tl-11", label: "Autorizado Pagar.me", occurredAt: "2026-09-07T18:10:25Z", status: "CONCLUIDO", source: "Pagar.me", referenceId: "tid_99482103", amount: 220.00, description: "Autorização de débito aprovada" },
      { id: "tl-12", label: "Liquidação Não Localizada no Banco", occurredAt: "2026-09-08T09:00:00Z", status: "DIVERGENTE", source: "Extrato Inter", referenceId: "PEND-EXT", amount: 220.00, description: "Falta crédito bancário na conta Banco Inter" }
    ],
    accountingEntries: [
      {
        id: "acc-entry-88-1",
        occurredAt: "2026-09-07T18:10:25Z",
        debitAccount: "1.1.02.01",
        debitAccountName: "Adquirentes / Gateways a Liquidar",
        creditAccount: "2.1.03.01",
        creditAccountName: "Recursos de Terceiros - Repasses a Produtores",
        history: "Reconhecimento de ingresso de terceiros - Pedido #123488",
        documentReference: "PED-#123488",
        costCenter: "CC-103 Teatro e Stand-up",
        eventName: "Stand-up Comedy Gala",
        producerName: "Opus Promoções Culturais",
        amount: 200.00,
        status: "POSTADO"
      },
      {
        id: "acc-entry-88-2",
        occurredAt: "2026-09-07T18:10:25Z",
        debitAccount: "1.1.02.01",
        debitAccountName: "Adquirentes / Gateways a Liquidar",
        creditAccount: "3.1.01.01",
        creditAccountName: "Receita de Taxa de Conveniência",
        history: "Receita própria Disk - Pedido #123488",
        documentReference: "PED-#123488",
        costCenter: "CC-201 Plataforma Digital Disk",
        eventName: "Stand-up Comedy Gala",
        producerName: "Opus Promoções Culturais",
        amount: 20.00,
        status: "POSTADO"
      }
    ]
  },
  {
    orderId: "#123512",
    producerId: "prod-003",
    createdAt: "2026-09-08T09:12:00Z",
    eventName: "Turnê Arena Rock Brasil",
    producerName: "Mercury Concerts Brasil",
    customerName: "Eduardo Camargo Ramos",
    paymentMethod: "PIX Instantâneo",
    gateway: "Banco Itaú / PIX Direto",
    transactionId: "E6070119020260908091218",
    nsu: "PIX-901824",
    tid: "ITAU-PIX-88120",
    financialStatus: "Liquidado em D+0",
    reconciliationStatus: "Conciliado",
    accountingStatus: "Conciliado",
    composition: {
      ticketFaceValue: 400.00,
      convenienceFee: 50.00,
      discounts: 0.00,
      additions: 0.00,
      totalPaid: 450.00,
      gatewayFee: 0.99,
      acquiringFee: 0.00,
      antifraudFee: 0.00,
      anticipationFee: 0.00,
      diskRevenue: 49.01,
      producerAmount: 400.00,
      taxes: 2.50,
      netAmount: 446.51
    },
    timeline: [
      { id: "tl-20", label: "Pedido Iniciado", occurredAt: "2026-09-08T09:12:00Z", status: "CONCLUIDO", source: "PDT", referenceId: "#123512", amount: 450.00, description: "Compra 1x Pista Premium Rock" },
      { id: "tl-21", label: "PIX Recebido e Liquidado em D+0", occurredAt: "2026-09-08T09:12:18Z", status: "CONCLUIDO", source: "Itaú PIX", referenceId: "E6070119020260908091218", amount: 450.00, description: "End-to-end PIX confirmado" },
      { id: "tl-22", label: "Split Executado", occurredAt: "2026-09-08T09:13:00Z", status: "CONCLUIDO", source: "PDT Engine", referenceId: "SPLIT-123512", amount: 449.01, description: "R$ 400,00 Produtor / R$ 49,01 Disk" },
      { id: "tl-23", label: "Lançamento Contábil Postado", occurredAt: "2026-09-08T09:14:00Z", status: "CONCLUIDO", source: "Contabilidade", referenceId: "LANC-8819", amount: 450.00, description: "Partidas dobradas conciliadas" }
    ],
    accountingEntries: [
      {
        id: "acc-entry-512-1",
        occurredAt: "2026-09-08T09:12:18Z",
        debitAccount: "1.1.01.02",
        debitAccountName: "Banco Itaú - Conta Arrecadação PIX",
        creditAccount: "2.1.03.01",
        creditAccountName: "Recursos de Terceiros - Produtores",
        history: "Arrecadação PIX Arena Rock - Repasse Produtor - Pedido #123512",
        documentReference: "PIX-123512",
        costCenter: "CC-101 Shows e Grandes Festivais",
        eventName: "Turnê Arena Rock Brasil",
        producerName: "Mercury Concerts Brasil",
        amount: 400.00,
        status: "CONCILIADO"
      },
      {
        id: "acc-entry-512-2",
        occurredAt: "2026-09-08T09:12:18Z",
        debitAccount: "1.1.01.02",
        debitAccountName: "Banco Itaú - Conta Arrecadação PIX",
        creditAccount: "3.1.01.01",
        creditAccountName: "Receita de Taxa de Conveniência",
        history: "Receita de conveniência PIX - Pedido #123512",
        documentReference: "PIX-123512",
        costCenter: "CC-201 Plataforma Digital Disk",
        eventName: "Turnê Arena Rock Brasil",
        producerName: "Mercury Concerts Brasil",
        amount: 50.00,
        status: "CONCILIADO"
      },
      {
        id: "acc-entry-512-3",
        occurredAt: "2026-09-08T09:12:18Z",
        debitAccount: "4.1.01.02",
        debitAccountName: "Custos Financeiros - Tarifas Transacionais PIX",
        creditAccount: "1.1.01.02",
        creditAccountName: "Banco Itaú - Conta Arrecadação PIX",
        history: "Tarifa fixa de cobrança PIX API Itaú",
        documentReference: "TAR-PIX-88120",
        costCenter: "CC-201 Plataforma Digital Disk",
        eventName: "Turnê Arena Rock Brasil",
        producerName: "Mercury Concerts Brasil",
        amount: 0.99,
        status: "CONCILIADO"
      }
    ]
  }
];

class TraceabilityService {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    if (typeof window === 'undefined') return;
    try {
      if (!localStorage.getItem(STORAGE_ORDERS_KEY)) {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(INITIAL_TRACEABILITY_ORDERS));
      }
      if (!localStorage.getItem(STORAGE_AUDIT_KEY)) {
        localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify([]));
      }
    } catch (e) {
      console.warn('LocalStorage error in TraceabilityService:', e);
    }
  }

  getOrders() {
    if (typeof window === 'undefined') return INITIAL_TRACEABILITY_ORDERS;
    try {
      const data = localStorage.getItem(STORAGE_ORDERS_KEY);
      return data ? JSON.parse(data) : INITIAL_TRACEABILITY_ORDERS;
    } catch (e) {
      return INITIAL_TRACEABILITY_ORDERS;
    }
  }

  saveOrders(orders) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders in TraceabilityService:', e);
    }
  }

  /**
   * Busca pedidos com suporte a permissões RBAC:
   * - ADMIN / FINANCEIRO: acesso a todos os pedidos.
   * - PRODUTOR: restrito estritamente a pedidos com seu producerId.
   */
  searchOrders(query = '', userRole = 'ADMIN', userProducerId = null) {
    const orders = this.getOrders();
    const q = (query || '').trim().toLowerCase();

    return orders.filter(order => {
      // Regra de segurança obrigatória: isolamento por produtor
      if (userRole === 'PRODUTOR' && userProducerId && order.producerId !== userProducerId) {
        return false;
      }

      if (!q) return true;

      return (
        order.orderId.toLowerCase().includes(q) ||
        (order.transactionId && order.transactionId.toLowerCase().includes(q)) ||
        (order.nsu && order.nsu.toLowerCase().includes(q)) ||
        (order.tid && order.tid.toLowerCase().includes(q)) ||
        order.eventName.toLowerCase().includes(q) ||
        order.producerName.toLowerCase().includes(q) ||
        (order.customerName && order.customerName.toLowerCase().includes(q)) ||
        order.gateway.toLowerCase().includes(q)
      );
    });
  }

  /**
   * Obtém os detalhes completos de rastreabilidade de um pedido
   */
  getOrderTraceability(orderId, userRole = 'ADMIN', userProducerId = null) {
    const orders = this.getOrders();
    const cleanId = (orderId || '').trim();
    const found = orders.find(o => o.orderId.toLowerCase() === cleanId.toLowerCase() || o.transactionId.toLowerCase() === cleanId.toLowerCase());

    if (!found) {
      return { success: false, error: `Pedido ou transação ${cleanId} não encontrado no sistema contábil.` };
    }

    if (userRole === 'PRODUTOR' && userProducerId && found.producerId !== userProducerId) {
      return { success: false, error: 'Acesso não autorizado: Você só pode consultar pedidos de seus eventos.' };
    }

    return { success: true, data: found };
  }

  /**
   * Registra ação de auditoria imutável vinculada ao pedido
   */
  addAuditLog(orderId, action, actor = 'Administrador Contábil', details = '') {
    if (typeof window === 'undefined') return;
    try {
      const logs = JSON.parse(localStorage.getItem(STORAGE_AUDIT_KEY) || '[]');
      const newEntry = {
        id: 'trace-audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        orderId,
        action,
        actor,
        details,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newEntry);
      localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(logs));
      return newEntry;
    } catch (e) {
      console.error('Audit log save error:', e);
    }
  }

  getAuditLogs(orderId = null) {
    if (typeof window === 'undefined') return [];
    try {
      const logs = JSON.parse(localStorage.getItem(STORAGE_AUDIT_KEY) || '[]');
      if (orderId) {
        return logs.filter(l => l.orderId === orderId);
      }
      return logs;
    } catch (e) {
      return [];
    }
  }
}

export const traceabilityService = new TraceabilityService();
if (typeof window !== 'undefined') {
  window.traceabilityService = traceabilityService;
}
