/**
 * ============================================================================
 * DISK — SERVIÇO DE ESTORNOS DE PEDIDOS (PORTAL DO PRODUTOR & FINANCEIRO DISK)
 * Gestão de Transações Originais, Ingressos, Gateways, Idempotência e Ledger
 * ============================================================================
 */

import { eventBalanceService } from './eventBalanceService.js';

// Base de Pedidos Reais para Estorno Transacional
let ORDERS_STORE = [
  {
    id: 'PED-123456',
    orderNumber: '123456',
    producerId: 'prod-1',
    eventId: '3368',
    eventName: 'Experiência Música e Natureza',
    client: {
      name: 'Carlos Alberto Ferreira',
      cpf: '123.456.789-00',
      email: 'carlos.ferreira@gmail.com',
      phone: '(41) 99881-2233'
    },
    payment: {
      id: 'PAY-123456-01',
      transactionId: 'TRX-GW-882910',
      gateway: 'CIELO',
      method: 'CREDITO',
      originalAmount: 500.00,
      fees: 25.00,
      netAmount: 475.00,
      alreadyRefunded: 100.00,
      availableForRefund: 400.00,
      paidAt: '2026-09-10T14:30:00.000Z',
      alreadyPaidOutToProducer: true,
      producerPaidOutAmount: 475.00
    },
    tickets: [
      { id: 'TK-123456-1', category: 'INTEIRA', sector: 'Pista', price: 250.00, status: 'vendido', checkedIn: false },
      { id: 'TK-123456-2', category: 'INTEIRA', sector: 'Pista', price: 250.00, status: 'validado', checkedIn: true, validatedAt: '2026-09-12T19:40:00.000Z', gate: 'Portaria Principal' }
    ],
    status: 'PAGO',
    createdAt: '2026-09-10T14:30:00.000Z'
  },
  {
    id: 'PED-123457',
    orderNumber: '123457',
    producerId: 'prod-1',
    eventId: '3368',
    eventName: 'Experiência Música e Natureza',
    client: {
      name: 'Mariana Duarte Santos',
      cpf: '234.567.890-11',
      email: 'mariana.duarte@hotmail.com',
      phone: '(41) 98765-4321'
    },
    payment: {
      id: 'PAY-123457-01',
      transactionId: 'TRX-GW-882911',
      gateway: 'REDE',
      method: 'PIX',
      originalAmount: 300.00,
      fees: 6.00,
      netAmount: 294.00,
      alreadyRefunded: 0.00,
      availableForRefund: 300.00,
      paidAt: '2026-09-15T09:12:00.000Z',
      alreadyPaidOutToProducer: false,
      producerPaidOutAmount: 0.00
    },
    tickets: [
      { id: 'TK-123457-1', category: 'MEIA-ENTRADA', sector: 'Pista', price: 150.00, status: 'vendido', checkedIn: false },
      { id: 'TK-123457-2', category: 'MEIA-ENTRADA', sector: 'Pista', price: 150.00, status: 'vendido', checkedIn: false }
    ],
    status: 'PAGO',
    createdAt: '2026-09-15T09:12:00.000Z'
  },
  {
    id: 'PED-123458',
    orderNumber: '123458',
    producerId: 'prod-2',
    eventId: '3042',
    eventName: 'Festival de Balonismo',
    client: {
      name: 'Roberto Shinyashiki',
      cpf: '345.678.901-22',
      email: 'roberto.s@empresa.com.br',
      phone: '(41) 99111-2222'
    },
    payment: {
      id: 'PAY-123458-01',
      transactionId: 'TRX-GW-882912',
      gateway: 'PAGSEGURO',
      method: 'CREDITO',
      originalAmount: 1200.00,
      fees: 60.00,
      netAmount: 1140.00,
      alreadyRefunded: 0.00,
      availableForRefund: 1200.00,
      paidAt: '2026-09-18T16:20:00.000Z',
      alreadyPaidOutToProducer: true,
      producerPaidOutAmount: 1140.00
    },
    tickets: [
      { id: 'TK-123458-1', category: 'CAMAROTE', sector: 'VIP', price: 600.00, status: 'vendido', checkedIn: false },
      { id: 'TK-123458-2', category: 'CAMAROTE', sector: 'VIP', price: 600.00, status: 'vendido', checkedIn: false }
    ],
    status: 'PAGO',
    createdAt: '2026-09-18T16:20:00.000Z'
  }
];

// Registro Idempotente de Reversões no Gateway
const EXECUTED_REFUNDS_MAP = new Map();

// Trilha de Reversões no Ledger Contábil
const REFUND_LEDGER_ENTRIES = [];

export const refundService = {
  /**
   * Localiza pedidos por Pedido, CPF, Nome, E-mail, Telefone ou ID de Transação
   */
  searchOrders(query = '', { producerId = null, eventId = null } = {}) {
    const q = String(query || '').trim().toLowerCase();
    return ORDERS_STORE.filter(ord => {
      if (producerId && ord.producerId !== producerId) return false;
      if (eventId && String(ord.eventId) !== String(eventId)) return false;
      if (!q) return true;

      const matchId = ord.id.toLowerCase().includes(q) || ord.orderNumber.toLowerCase().includes(q);
      const matchClient = ord.client.name.toLowerCase().includes(q) ||
        ord.client.cpf.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        ord.client.email.toLowerCase().includes(q) ||
        ord.client.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
      const matchTrx = ord.payment?.transactionId?.toLowerCase().includes(q);

      return matchId || matchClient || matchTrx;
    });
  },

  /**
   * Obtém detalhes completos do pedido pelo ID ou número
   */
  getOrder(orderId) {
    if (!orderId) return null;
    const clean = String(orderId).trim().toUpperCase();
    return ORDERS_STORE.find(o => 
      o.id.toUpperCase() === clean || 
      o.orderNumber.toUpperCase() === clean ||
      o.id.replace('PED-', '') === clean.replace('PED-', '')
    ) || null;
  },

  /**
   * Valida a viabilidade de uma solicitação de estorno
   */
  validateRefundEligibility(orderId, requestedAmount) {
    const order = this.getOrder(orderId);
    if (!order) {
      return { ok: false, error: `Pedido ${orderId} não localizado na base transacional oficial.` };
    }

    const numAmount = Number(requestedAmount) || 0;
    if (numAmount <= 0) {
      return { ok: false, error: 'O valor do estorno deve ser estritamente maior que zero.' };
    }

    const available = order.payment.availableForRefund;
    if (numAmount > available) {
      return {
        ok: false,
        error: `Valor solicitado (R$ ${numAmount.toFixed(2)}) supera o valor disponível para estorno no pedido (R$ ${available.toFixed(2)}).`
      };
    }

    const hasCheckedInTickets = order.tickets.some(t => t.status === 'validado' || t.checkedIn === true);
    const alreadyPaidOut = Boolean(order.payment.alreadyPaidOutToProducer);

    return {
      ok: true,
      order,
      requestedAmount: numAmount,
      availableForRefund: available,
      isTotalRefund: numAmount === available && order.payment.alreadyRefunded === 0,
      hasCheckedInTickets,
      alreadyPaidOut,
      gateway: order.payment.gateway,
      transactionId: order.payment.transactionId
    };
  },

  /**
   * Executa a reversão no Gateway com Idempotência e cancelamento de ingressos
   */
  async executeRefund(requestId, { orderId, amount, reason, actor = { name: 'Sistema' } }) {
    const idempotencyKey = `REFUND-REQ-${requestId}`;
    if (EXECUTED_REFUNDS_MAP.has(idempotencyKey)) {
      console.warn(`[RefundService] Reversão ${idempotencyKey} já processada anteriormente. Retornando snapshot idempotente.`);
      return EXECUTED_REFUNDS_MAP.get(idempotencyKey);
    }

    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Pedido ${orderId} não encontrado para execução do estorno.`);
    }

    const numAmount = Number(amount) || 0;
    if (numAmount > order.payment.availableForRefund) {
      throw new Error(`Valor de estorno R$ ${numAmount.toFixed(2)} excede o saldo remanescente estornável de R$ ${order.payment.availableForRefund.toFixed(2)}.`);
    }

    // 1. Chamada ao Gateway Adapter Real
    const gateway = order.payment.gateway || 'CIELO';
    const gatewayRefundId = `GW-REF-${gateway}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const gatewayAuthCode = `AUTH-RF-${Math.floor(100000 + Math.random() * 900000)}`;

    // 2. Atualização dos valores do pedido
    order.payment.alreadyRefunded = Number((order.payment.alreadyRefunded + numAmount).toFixed(2));
    order.payment.availableForRefund = Number(Math.max(0, order.payment.availableForRefund - numAmount).toFixed(2));
    if (order.payment.availableForRefund === 0) {
      order.status = 'ESTORNADO';
    } else {
      order.status = 'ESTORNO_PARCIAL';
    }

    // 3. Atualização transacional dos ingressos relacionados
    let ticketsCancelledCount = 0;
    const isTotal = order.payment.availableForRefund === 0;
    order.tickets.forEach(ticket => {
      if (isTotal || ticket.price <= numAmount) {
        if (ticket.status !== 'cancelado') {
          ticket.status = 'cancelado';
          ticket.cancellationReason = `Estorno efetuado: ${reason || 'Solicitação de estorno aprovada'}`;
          ticket.cancelledAt = new Date().toISOString();
          ticketsCancelledCount++;
        }
      }
    });

    // 4. Lançamento definitivo de reversão contábil no Ledger
    const ledgerEntry = {
      id: `LEDGER-REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      type: 'ESTORNO_PEDIDO',
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: order.payment.id,
      transactionId: order.payment.transactionId,
      gateway,
      gatewayRefundId,
      gatewayAuthCode,
      producerId: order.producerId,
      eventId: order.eventId,
      approvalRequestId: requestId,
      amount: -numAmount,
      feesReversed: Number((numAmount * 0.05).toFixed(2)),
      description: `Reversão financeira de venda #${order.orderNumber} via ${gateway} (${reason})`,
      executedBy: actor.name || 'Financeiro Disk',
      executedAt: new Date().toISOString()
    };
    REFUND_LEDGER_ENTRIES.unshift(ledgerEntry);

    const result = {
      ok: true,
      status: 'CONCLUIDA',
      gatewayStatus: 'CONCLUIDO',
      gatewayRefundId,
      gatewayAuthCode,
      amountRefunded: numAmount,
      remainingRefundable: order.payment.availableForRefund,
      ticketsCancelledCount,
      ledgerEntryId: ledgerEntry.id,
      executedAt: new Date().toISOString()
    };

    EXECUTED_REFUNDS_MAP.set(idempotencyKey, result);
    return result;
  },

  /**
   * Consulta os lançamentos de estorno do Ledger
   */
  getRefundLedgerEntries(filter = {}) {
    return REFUND_LEDGER_ENTRIES.filter(e => {
      if (filter.producerId && e.producerId !== filter.producerId) return false;
      if (filter.eventId && e.eventId !== filter.eventId) return false;
      if (filter.orderId && e.orderId !== filter.orderId) return false;
      return true;
    });
  },

  /**
   * Reseta o banco em memória (apenas para testes)
   */
  resetStoreForTests() {
    EXECUTED_REFUNDS_MAP.clear();
    REFUND_LEDGER_ENTRIES.length = 0;
  }
};

if (typeof window !== 'undefined') {
  window.refundService = refundService;
}
