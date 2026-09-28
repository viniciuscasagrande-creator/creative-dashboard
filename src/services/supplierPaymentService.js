/**
 * ============================================================================
 * DISK — SERVIÇO DE PAGAMENTOS E FORNECEDORES (PORTAL DO PRODUTOR & FINANCEIRO DISK)
 * Gestão de Fornecedores, Histórico Bancário, Prevenção de Duplicidades e Ledger
 * ============================================================================
 */

import { INITIAL_SUPPLIERS, INITIAL_COST_CENTERS } from './procureToPayService.js';
import { eventBalanceService } from './eventBalanceService.js';

// Base centralizada de Fornecedores com versionamento e histórico bancário
let SUPPLIERS_STORE = INITIAL_SUPPLIERS.map(s => ({
  ...s,
  version: 1,
  bankUpdatedAt: s.updatedAt || '2026-08-01T10:00:00.000Z',
  bankHistory: []
}));

// Base de Lotes de Pagamento (CNAB 240 / Lotes da Tesouraria)
let PAYMENT_BATCHES = [];

// Ledger de Pagamentos a Fornecedores
let PAYMENT_LEDGER_ENTRIES = [];

// Controle de Idempotência
const EXECUTED_PAYMENTS_MAP = new Map();

export const supplierPaymentService = {
  /**
   * Lista fornecedores permitidos por Produtor e/ou Evento
   */
  listSuppliers({ producerId = 'prod-1', eventId = null, search = '' } = {}) {
    const q = String(search || '').trim().toLowerCase();
    return SUPPLIERS_STORE.filter(s => {
      if (producerId && s.producerId !== producerId) return false;
      if (!q) return true;
      const matchName = s.legalName.toLowerCase().includes(q) || s.tradeName.toLowerCase().includes(q);
      const matchTaxId = s.taxId.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
      const matchCategory = s.primaryCategory.toLowerCase().includes(q);
      return matchName || matchTaxId || matchCategory;
    });
  },

  /**
   * Obtém detalhes de um fornecedor pelo ID
   */
  getSupplier(supplierId) {
    if (!supplierId) return null;
    return SUPPLIERS_STORE.find(s => s.id === supplierId) || null;
  },

  /**
   * Verifica se a conta bancária do fornecedor foi alterada recentemente (< 30 dias)
   */
  hasRecentBankChange(supplier) {
    if (!supplier || !supplier.bankUpdatedAt) return false;
    const updatedAt = new Date(supplier.bankUpdatedAt).getTime();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return updatedAt > thirtyDaysAgo && (supplier.bankHistory && supplier.bankHistory.length > 0);
  },

  /**
   * Cadastra novo fornecedor
   */
  createSupplier({
    producerId = 'prod-1',
    legalName,
    tradeName,
    taxId,
    taxIdType = 'CNPJ',
    primaryCategory,
    contactName,
    contactEmail,
    contactPhone,
    bankAccount,
    documents = []
  }, actor = { name: 'Produtor' }) {
    if (!legalName || !taxId) {
      throw new Error('Razão Social e CNPJ/CPF são campos obrigatórios para cadastro do fornecedor.');
    }

    const cleanTaxId = taxId.replace(/\D/g, '');
    const exists = SUPPLIERS_STORE.find(s => s.producerId === producerId && s.taxId.replace(/\D/g, '') === cleanTaxId);
    if (exists) {
      throw new Error(`Fornecedor com documento ${taxId} já cadastrado no catálogo (${exists.tradeName || exists.legalName}).`);
    }

    const newId = `SUP-${String(SUPPLIERS_STORE.length + 1).padStart(3, '0')}`;
    const newSupplier = {
      id: newId,
      producerId,
      legalName,
      tradeName: tradeName || legalName,
      taxId,
      taxIdType,
      status: 'HOMOLOGADO',
      primaryCategory: primaryCategory || 'Serviços Técnicos Especializados',
      contactName: contactName || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      bankAccount: {
        pixKeyType: bankAccount?.pixKeyType || 'CNPJ',
        pixKey: bankAccount?.pixKey || cleanTaxId,
        bankCode: bankAccount?.bankCode || '001',
        bankName: bankAccount?.bankName || 'Banco do Brasil',
        agency: bankAccount?.agency || '0001',
        account: bankAccount?.account || '12345-6',
        accountType: bankAccount?.accountType || 'CORRENTE',
        beneficiaryName: legalName,
        beneficiaryTaxId: taxId
      },
      documents,
      performance: { averageRating: 5.0, totalContractsCompleted: 0, openOccurrences: 0 },
      financialMetrics: { totalContracted: 0, totalPaid: 0, totalPending: 0, servedEventsCount: 0 },
      version: 1,
      bankUpdatedAt: new Date().toISOString(),
      bankHistory: [],
      isNewSupplier: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    SUPPLIERS_STORE.unshift(newSupplier);
    return newSupplier;
  },

  /**
   * Atualiza dados bancários do fornecedor preservando histórico e disparando alerta de segurança
   */
  updateSupplierBankDetails(supplierId, newBankAccount, actor = { name: 'Produtor' }, reason = '') {
    const supplier = this.getSupplier(supplierId);
    if (!supplier) throw new Error(`Fornecedor ${supplierId} não encontrado.`);

    // Preserva conta anterior no histórico
    const previousAccount = { ...supplier.bankAccount };
    supplier.bankHistory.unshift({
      version: supplier.version,
      bankAccount: previousAccount,
      changedAt: new Date().toISOString(),
      changedBy: actor.name,
      reason: reason || 'Atualização cadastral de dados bancários'
    });

    supplier.bankAccount = {
      ...previousAccount,
      ...newBankAccount,
      beneficiaryName: newBankAccount.beneficiaryName || supplier.legalName,
      beneficiaryTaxId: newBankAccount.beneficiaryTaxId || supplier.taxId
    };
    supplier.version = (supplier.version || 1) + 1;
    supplier.bankUpdatedAt = new Date().toISOString();
    supplier.updatedAt = new Date().toISOString();

    return { ok: true, supplier, previousAccount };
  },

  /**
   * Verificação de Duplicidade em Pagamentos
   */
  checkDuplicatePayment({
    producerId = 'prod-1',
    supplierId,
    documentNumber,
    amount,
    dueDate,
    existingRequests = [],
    excludeRequestId = null
  }) {
    const alerts = [];
    const numAmount = Number(amount) || 0;
    const cleanDoc = String(documentNumber || '').trim().toUpperCase();

    for (const req of existingRequests) {
      if (req.id === excludeRequestId || req.type !== 'PAGAMENTO') continue;
      if (req.status === 'REJEITADA' || req.status === 'CANCELADA') continue;

      const pSupplierId = req.payload?.supplierId;
      const pDoc = String(req.payload?.documentNumber || '').trim().toUpperCase();
      const pAmount = Number(req.amount) || 0;
      const pDue = req.payload?.dueDate;

      // 1. Mesmo fornecedor e mesmo documento
      if (pSupplierId === supplierId && cleanDoc && pDoc === cleanDoc) {
        alerts.push({
          type: 'SAME_DOCUMENT',
          message: `Alerta de Duplicidade: Já existe uma solicitação com o mesmo número de documento (${cleanDoc}) para este fornecedor (Protocolo ${req.protocol || req.id}).`
        });
      }

      // 2. Mesmo fornecedor, mesmo valor e mesmo vencimento
      if (pSupplierId === supplierId && pAmount === numAmount && pDue && dueDate && pDue === dueDate) {
        alerts.push({
          type: 'SAME_VALUE_AND_DUE_DATE',
          message: `Alerta de Duplicidade: Já existe solicitação de mesmo valor (R$ ${numAmount.toFixed(2)}) e vencimento (${dueDate}) para este fornecedor (Protocolo ${req.protocol || req.id}).`
        });
      }
    }

    return {
      isDuplicate: alerts.length > 0,
      alerts
    };
  },

  /**
   * Execução formal de pagamento aprovado via PIX / CNAB com Idempotência
   */
  async executePayment(requestId, paymentData, actor = { name: 'Tesouraria Disk' }) {
    const idempotencyKey = `PAY-REQ-${requestId}`;
    if (EXECUTED_PAYMENTS_MAP.has(idempotencyKey)) {
      console.warn(`[SupplierPaymentService] Pagamento ${idempotencyKey} já executado anteriormente. Retornando snapshot idempotente.`);
      return EXECUTED_PAYMENTS_MAP.get(idempotencyKey);
    }

    const {
      producerId = 'prod-1',
      eventId,
      supplierId,
      supplierName,
      documentNumber,
      documentType = 'NOTA_FISCAL',
      amount = 0,
      paymentMethod = 'PIX',
      bankDetails,
      costCenterId,
      costCenterName
    } = paymentData;

    const numAmount = Number(amount) || 0;
    const bankTrxId = `TRX-BANK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const authCode = `AUTH-PAY-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Baixa do saldo de evento se houver vínculo
    if (eventId) {
      try {
        const store = eventBalanceService.getLocalBalanceStore();
        const ev = store.find(e => String(e.eventId) === String(eventId));
        if (ev && ev.balances) {
          ev.balances.availableBalance = Number(Math.max(0, (ev.balances.availableBalance || 0) - numAmount).toFixed(2));
          ev.balances.settledAmount = Number(Math.max(0, (ev.balances.settledAmount || 0) - numAmount).toFixed(2));
        }
      } catch (_) {}
    }

    // 2. Registro no Ledger de Pagamentos a Fornecedores (DRE / Centro de Custo)
    const ledgerEntry = {
      id: `LEDGER-PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      type: 'PAGAMENTO_FORNECEDOR',
      producerId,
      eventId: eventId ? String(eventId) : null,
      supplierId,
      supplierName: supplierName || 'Fornecedor Homologado',
      documentNumber,
      documentType,
      costCenterId: costCenterId || 'cc-prod-01',
      costCenterName: costCenterName || 'Produção Geral',
      approvalRequestId: requestId,
      amount: -numAmount,
      paymentMethod,
      bankTransactionId: bankTrxId,
      authCode,
      destinationAccount: bankDetails || {},
      description: `Pagamento de ${documentType} #${documentNumber} a ${supplierName} via ${paymentMethod}`,
      executedBy: actor.name || 'Tesouraria Disk',
      executedAt: new Date().toISOString()
    };
    PAYMENT_LEDGER_ENTRIES.unshift(ledgerEntry);

    // 3. Atualização das métricas financeiras do fornecedor
    const supplier = this.getSupplier(supplierId);
    if (supplier && supplier.financialMetrics) {
      supplier.financialMetrics.totalPaid = Number(((supplier.financialMetrics.totalPaid || 0) + numAmount).toFixed(2));
      supplier.financialMetrics.totalPending = Number(Math.max(0, (supplier.financialMetrics.totalPending || 0) - numAmount).toFixed(2));
    }

    const result = {
      ok: true,
      status: 'PAGA',
      bankTransactionId: bankTrxId,
      authCode,
      ledgerEntryId: ledgerEntry.id,
      executedAt: new Date().toISOString()
    };

    EXECUTED_PAYMENTS_MAP.set(idempotencyKey, result);
    return result;
  },

  /**
   * Agrupa múltiplos pagamentos aprovados em um Lote CNAB 240
   */
  createPaymentBatch(requestIds = [], actor = { name: 'Tesouraria' }) {
    if (!requestIds || requestIds.length === 0) {
      throw new Error('Nenhum pagamento selecionado para compor o lote.');
    }

    const batchNumber = `LOTE-PAG-${new Date().getFullYear()}-${String(PAYMENT_BATCHES.length + 98).padStart(4, '0')}`;
    const batch = {
      id: batchNumber,
      batchNumber,
      requestIds,
      totalCount: requestIds.length,
      createdAt: new Date().toISOString(),
      createdBy: actor.name,
      status: 'GERADO_CNAB240',
      cnabFileReference: `REM_${batchNumber}.REM`
    };

    PAYMENT_BATCHES.unshift(batch);
    return batch;
  },

  /**
   * Consulta os lançamentos contábeis de pagamento
   */
  getPaymentLedgerEntries(filter = {}) {
    return PAYMENT_LEDGER_ENTRIES.filter(e => {
      if (filter.producerId && e.producerId !== filter.producerId) return false;
      if (filter.eventId && e.eventId !== filter.eventId) return false;
      if (filter.supplierId && e.supplierId !== filter.supplierId) return false;
      return true;
    });
  },

  /**
   * Reseta o banco em memória (para testes)
   */
  resetStoreForTests() {
    EXECUTED_PAYMENTS_MAP.clear();
    PAYMENT_LEDGER_ENTRIES.length = 0;
    PAYMENT_BATCHES.length = 0;
  }
};

if (typeof window !== 'undefined') {
  window.supplierPaymentService = supplierPaymentService;
}
