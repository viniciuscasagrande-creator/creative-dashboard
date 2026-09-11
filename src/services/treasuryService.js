/**
 * Fase 26.17.9.4.6 — Serviço Central de Tesouraria Operacional
 * Contas Bancárias Reais, Pagamentos PIX, CNAB 240/400, Pagamentos em Lote, Idempotência e Conciliação.
 */

// Contas Bancárias Oficiais Iniciais
export const INITIAL_BANK_ACCOUNTS = [
  {
    id: 'BACC-001',
    producerId: 'prod-1',
    producerName: 'DiskIngressos Eventos Ltda',
    bankCode: '001',
    bankName: 'Banco do Brasil',
    agency: '1502-4',
    account: '99201',
    accountDigit: '0',
    type: 'CORRENTE',
    purpose: 'REPASSES',
    holderName: 'DiskIngressos Eventos Ltda',
    holderTaxId: '08.123.456/0001-99',
    pixKey: '08123456000199',
    pixKeyType: 'CNPJ',
    currentBalance: 185400.00,
    availableBalance: 172400.00,
    blockedBalance: 13000.00,
    status: 'ATIVA',
    isMain: true,
    maskedAccount: '99***-0',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-09-10T18:00:00.000Z'
  },
  {
    id: 'BACC-002',
    producerId: 'prod-1',
    producerName: 'DiskIngressos Eventos Ltda',
    bankCode: '341',
    bankName: 'Itaú Unibanco',
    agency: '0340',
    account: '44810',
    accountDigit: '9',
    type: 'CORRENTE',
    purpose: 'OPERACIONAL',
    holderName: 'DiskIngressos Eventos Ltda',
    holderTaxId: '08.123.456/0001-99',
    pixKey: 'financeiro@diskingressos.com.br',
    pixKeyType: 'EMAIL',
    currentBalance: 240500.00,
    availableBalance: 235000.00,
    blockedBalance: 5500.00,
    status: 'ATIVA',
    isMain: false,
    maskedAccount: '44***-9',
    createdAt: '2026-01-15T11:00:00.000Z',
    updatedAt: '2026-09-10T18:00:00.000Z'
  },
  {
    id: 'BACC-003',
    producerId: 'prod-1',
    producerName: 'DiskIngressos Eventos Ltda',
    bankCode: '237',
    bankName: 'Bradesco',
    agency: '2240',
    account: '10045',
    accountDigit: '8',
    type: 'CORRENTE',
    purpose: 'ARRECADACAO',
    holderName: 'DiskIngressos Eventos Ltda',
    holderTaxId: '08.123.456/0001-99',
    pixKey: '+5541999998888',
    pixKeyType: 'PHONE',
    currentBalance: 98200.00,
    availableBalance: 98200.00,
    blockedBalance: 0.00,
    status: 'ATIVA',
    isMain: false,
    maskedAccount: '10***-8',
    createdAt: '2026-02-01T09:00:00.000Z',
    updatedAt: '2026-09-10T18:00:00.000Z'
  },
  {
    id: 'BACC-004',
    producerId: 'prod-2',
    producerName: 'CWB Brasil Entretenimento',
    bankCode: '033',
    bankName: 'Santander',
    agency: '1102',
    account: '33902',
    accountDigit: '1',
    type: 'CORRENTE',
    purpose: 'OPERACIONAL',
    holderName: 'CWB Brasil Entretenimento Ltda',
    holderTaxId: '12.987.654/0001-00',
    pixKey: '12987654000100',
    pixKeyType: 'CNPJ',
    currentBalance: 115000.00,
    availableBalance: 110000.00,
    blockedBalance: 5000.00,
    status: 'ATIVA',
    isMain: true,
    maskedAccount: '33***-1',
    createdAt: '2026-02-15T14:00:00.000Z',
    updatedAt: '2026-09-10T18:00:00.000Z'
  }
];

export const INITIAL_PAYMENTS = [
  {
    id: 'PAY-2026-001',
    producerId: 'prod-1',
    eventId: '3368',
    eventName: 'Experiencia Música e Natureza - Julho',
    costCenterId: 'CC-01',
    purchaseOrderId: 'PC-2026-001',
    originBankAccountId: 'BACC-002',
    destinationAccount: {
      holderName: 'Som & Luz Pro Audio Ltda',
      holderTaxId: '11.222.333/0001-44',
      pixKey: '11222333000144',
      pixKeyType: 'CNPJ',
      bankCode: '341',
      agency: '1234',
      account: '56789-0'
    },
    method: 'PIX',
    amount: 8500.00,
    description: 'Pagamento Sonorização Palco Principal - NF 44102',
    status: 'SETTLED',
    idempotencyKey: 'IDEMP-PAY-2026-001',
    correlationId: 'CORR-PAY-001',
    externalTransactionId: 'BK-PIX-998811',
    endToEndId: 'E34100188292026090812000001',
    priority: 'ALTA',
    scheduledDate: '2026-09-08',
    createdBy: 'Operador Financeiro',
    approvedBy: 'Controladoria SafeSaff',
    approvedAt: '2026-09-08T09:30:00.000Z',
    submittedAt: '2026-09-08T10:00:00.000Z',
    settledAt: '2026-09-08T10:00:15.000Z',
    createdAt: '2026-09-08T09:00:00.000Z',
    updatedAt: '2026-09-08T10:00:15.000Z'
  },
  {
    id: 'PAY-2026-002',
    producerId: 'prod-1',
    eventId: '3178',
    eventName: 'Feijoada e Costela assada - PETFRIENDLY',
    costCenterId: 'CC-03',
    purchaseOrderId: 'PC-2026-002',
    originBankAccountId: 'BACC-001',
    destinationAccount: {
      holderName: 'Segurança Total Vigilância Ltda',
      holderTaxId: '44.555.666/0001-77',
      pixKey: 'financeiro@segurancatotal.com',
      pixKeyType: 'EMAIL',
      bankCode: '001',
      agency: '1502',
      account: '11223-4'
    },
    method: 'PIX',
    amount: 4200.00,
    description: 'Vigilância e Portaria Evento PET - 1ª Parcela',
    status: 'APPROVED',
    idempotencyKey: 'IDEMP-PAY-2026-002',
    correlationId: 'CORR-PAY-002',
    priority: 'NORMAL',
    scheduledDate: '2026-09-12',
    createdBy: 'Operador Financeiro',
    approvedBy: 'Gerente Financeiro',
    approvedAt: '2026-09-10T14:00:00.000Z',
    createdAt: '2026-09-10T11:00:00.000Z',
    updatedAt: '2026-09-10T14:00:00.000Z'
  },
  {
    id: 'PAY-2026-003',
    producerId: 'prod-1',
    eventId: '3195',
    eventName: '9º Knife Show Curitiba',
    costCenterId: 'CC-02',
    originBankAccountId: 'BACC-002',
    destinationAccount: {
      holderName: 'Gráfica e Cenografia Rápida Ltda',
      holderTaxId: '55.666.777/0001-88',
      pixKey: '55666777000188',
      pixKeyType: 'CNPJ'
    },
    method: 'PIX',
    amount: 12500.00,
    description: 'Impressão Banners, Crachás e Sinalização do Pavilhão',
    status: 'AWAITING_APPROVAL',
    idempotencyKey: 'IDEMP-PAY-2026-003',
    correlationId: 'CORR-PAY-003',
    priority: 'ALTA',
    scheduledDate: '2026-09-13',
    createdBy: 'Assistente Financeiro',
    createdAt: '2026-09-11T08:30:00.000Z',
    updatedAt: '2026-09-11T08:30:00.000Z'
  }
];

// Estado reativo em memória
let LOCAL_ACCOUNTS = JSON.parse(JSON.stringify(INITIAL_BANK_ACCOUNTS));
let LOCAL_CHANGE_REQUESTS = [];
let LOCAL_PAYMENTS = JSON.parse(JSON.stringify(INITIAL_PAYMENTS));
let LOCAL_BATCHES = [];
let LOCAL_CNAB_FILES = [];
let LOCAL_IDEMPOTENCY_STORE = new Map();
let LOCAL_TREASURY_AUDIT = [];

function generateCorrelationId(prefix = 'TRZ') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

function logTreasuryAudit({ correlationId, actor, entityType, entityId, action, summary, details = {} }) {
  const entry = {
    id: `AUD-TRZ-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    correlationId: correlationId || generateCorrelationId(),
    timestamp: new Date().toISOString(),
    actor: actor || { id: 'usr-sys', name: 'Tesouraria Automática', role: 'SISTEMA' },
    entityType,
    entityId,
    action,
    summary,
    details: JSON.parse(JSON.stringify(details))
  };
  LOCAL_TREASURY_AUDIT.unshift(entry);
  return entry;
}

export const treasuryService = {
  // =========================================================================
  // 1. GESTÃO DE CONTAS BANCÁRIAS REAIS (FÍSICAS)
  // =========================================================================
  async getBankAccounts({ producerId = 'prod-1', purpose, status } = {}) {
    let list = LOCAL_ACCOUNTS.filter(a => !producerId || a.producerId === producerId);
    if (purpose) list = list.filter(a => a.purpose === purpose);
    if (status) list = list.filter(a => a.status === status);
    return { ok: true, data: list };
  },

  async getBankAccountById(id) {
    const acc = LOCAL_ACCOUNTS.find(a => a.id === id);
    if (!acc) return { ok: false, error: 'Conta bancária não localizada.' };
    return { ok: true, data: acc };
  },

  async createBankAccount(data, actor) {
    if (!data.bankCode || !data.agency || !data.account || !data.holderName || !data.holderTaxId) {
      throw new Error('Banco, agência, conta, titular e CPF/CNPJ são obrigatórios.');
    }

    const id = `BACC-${String(LOCAL_ACCOUNTS.length + 1).padStart(3, '0')}`;
    const maskedAccount = data.account.length > 2
      ? `${data.account.slice(0, 2)}***-${data.accountDigit || '0'}`
      : `***-${data.accountDigit || '0'}`;

    const newAcc = {
      id,
      producerId: data.producerId || 'prod-1',
      producerName: data.producerName || 'DiskIngressos Eventos Ltda',
      bankCode: data.bankCode,
      bankName: data.bankName || `Banco ${data.bankCode}`,
      agency: data.agency,
      agencyDigit: data.agencyDigit || '',
      account: data.account,
      accountDigit: data.accountDigit || '0',
      type: data.type || 'CORRENTE',
      purpose: data.purpose || 'OPERACIONAL',
      holderName: data.holderName,
      holderTaxId: data.holderTaxId,
      pixKey: data.pixKey || '',
      pixKeyType: data.pixKeyType || 'CNPJ',
      currentBalance: Number(data.initialBalance || 0),
      availableBalance: Number(data.initialBalance || 0),
      blockedBalance: 0.00,
      status: 'ATIVA',
      isMain: Boolean(data.isMain),
      maskedAccount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (newAcc.isMain) {
      LOCAL_ACCOUNTS.filter(a => a.producerId === newAcc.producerId).forEach(a => a.isMain = false);
    }

    LOCAL_ACCOUNTS.push(newAcc);

    logTreasuryAudit({
      actor,
      entityType: 'BANK_ACCOUNT',
      entityId: id,
      action: 'ACCOUNT_CREATED',
      summary: `Conta bancária ${newAcc.bankName} Ag: ${newAcc.agency} Cc: ${newAcc.maskedAccount} cadastrada.`,
      details: newAcc
    });

    return { ok: true, data: newAcc };
  },

  /**
   * Alteração de Alto Risco de Domicílio Bancário ou Chave PIX
   * Exige solicitação formal com aprovação de alçada de segurança (Maker/Checker)
   */
  async requestBankAccountChange({ bankAccountId, requestedChanges, reason }, actor) {
    const acc = LOCAL_ACCOUNTS.find(a => a.id === bankAccountId);
    if (!acc) throw new Error('Conta bancária não localizada.');

    const requestId = `CRQ-${Date.now().toString(36).toUpperCase()}`;
    const changeReq = {
      id: requestId,
      bankAccountId,
      producerId: acc.producerId,
      requestedChanges,
      reason: reason || 'Alteração cadastral solicitada pela diretoria',
      requestedBy: actor?.name || 'Operador Financeiro',
      status: 'PENDENTE',
      riskLevel: requestedChanges.pixKey || requestedChanges.account ? 'CRITICO' : 'ALTO',
      securityToken: `SEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      createdAt: new Date().toISOString()
    };

    LOCAL_CHANGE_REQUESTS.unshift(changeReq);

    logTreasuryAudit({
      actor,
      entityType: 'BANK_ACCOUNT_CHANGE',
      entityId: requestId,
      action: 'CHANGE_REQUESTED',
      summary: `Solicitação de alteração de alto risco na conta ${acc.maskedAccount}: ${changeReq.reason}`,
      details: changeReq
    });

    return { ok: true, data: changeReq };
  },

  async approveBankAccountChange(requestId, actor) {
    const req = LOCAL_CHANGE_REQUESTS.find(r => r.id === requestId);
    if (!req) throw new Error('Solicitação de alteração não localizada.');
    if (req.status !== 'PENDENTE') throw new Error(`Solicitação já resolvida com status ${req.status}.`);

    // Regra Maker/Checker
    if (actor && actor.name && req.requestedBy && actor.name.toLowerCase() === req.requestedBy.toLowerCase()) {
      throw new Error('Violação de Maker/Checker: O usuário solicitante não pode aprovar a alteração de dados bancários.');
    }

    const acc = LOCAL_ACCOUNTS.find(a => a.id === req.bankAccountId);
    if (!acc) throw new Error('Conta bancária de destino não localizada.');

    // Aplica as alterações aprovadas
    Object.assign(acc, req.requestedChanges);
    acc.updatedAt = new Date().toISOString();

    req.status = 'APROVADA';
    req.approvedBy = actor?.name || 'Diretoria Financeira';
    req.resolvedAt = new Date().toISOString();

    logTreasuryAudit({
      actor,
      entityType: 'BANK_ACCOUNT_CHANGE',
      entityId: requestId,
      action: 'CHANGE_APPROVED',
      summary: `Alteração aprovada na conta ${acc.maskedAccount} por ${req.approvedBy}.`,
      details: { req, updatedAccount: acc }
    });

    return { ok: true, data: acc, request: req };
  },

  // =========================================================================
  // 2. MÓDULO PIX DE PAGAMENTOS (CICLO FORMAL & ANTI-DUPLICIDADE)
  // =========================================================================
  async getPayments({ producerId = 'prod-1', method, status, date } = {}) {
    let list = LOCAL_PAYMENTS.filter(p => !producerId || p.producerId === producerId);
    if (method) list = list.filter(p => p.method === method);
    if (status) list = list.filter(p => p.status === status);
    if (date) list = list.filter(p => p.scheduledDate === date);

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { ok: true, data: list };
  },

  async createPixPayment(data, actor) {
    if (!data.originBankAccountId || !data.amount || data.amount <= 0 || !data.destinationAccount?.pixKey) {
      throw new Error('Conta de origem, valor maior que zero e chave PIX de destino são obrigatórios.');
    }

    const scheduledDate = data.scheduledDate || new Date().toISOString().split('T')[0];

    // MOTOR ANTI-DUPLICIDADE RIGOROSO:
    // Bloqueia pagamento no mesmo dia com mesmo valor e mesma chave PIX
    const isDuplicate = LOCAL_PAYMENTS.some(p =>
      p.originBankAccountId === data.originBankAccountId &&
      p.destinationAccount?.pixKey === data.destinationAccount.pixKey &&
      Number(p.amount) === Number(data.amount) &&
      p.scheduledDate === scheduledDate &&
      ['CREATED', 'VALIDATING', 'AWAITING_APPROVAL', 'APPROVED', 'SUBMITTED', 'PROCESSING', 'SETTLED'].includes(p.status)
    );

    if (isDuplicate) {
      throw new Error(`Tentativa de Pagamento Duplicado Detectada: Já existe um pagamento de R$ ${Number(data.amount).toFixed(2)} programado para a chave PIX "${data.destinationAccount.pixKey}" na data ${scheduledDate}.`);
    }

    const id = `PAY-${new Date().getFullYear()}-${String(LOCAL_PAYMENTS.length + 1).padStart(4, '0')}`;
    const correlationId = generateCorrelationId('PIX');
    const idempotencyKey = `IDEMP-PIX-${id}-${Date.now()}`;

    // Alçada automática: acima de R$ 10.000 exige aprovação de alçada
    const requiresApproval = Number(data.amount) > 10000;
    const initialStatus = requiresApproval ? 'AWAITING_APPROVAL' : 'APPROVED';

    const newPayment = {
      id,
      producerId: data.producerId || 'prod-1',
      eventId: data.eventId,
      eventName: data.eventName,
      costCenterId: data.costCenterId,
      purchaseOrderId: data.purchaseOrderId,
      originBankAccountId: data.originBankAccountId,
      destinationAccount: data.destinationAccount,
      method: 'PIX',
      amount: Number(data.amount),
      description: data.description || 'Pagamento PIX Tesouraria',
      status: initialStatus,
      idempotencyKey,
      correlationId,
      priority: data.priority || 'NORMAL',
      scheduledDate,
      createdBy: actor?.name || 'Operador Financeiro',
      approvedBy: requiresApproval ? undefined : 'Auto-Aprovado (Dentro da Alçada)',
      approvedAt: requiresApproval ? undefined : new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    LOCAL_PAYMENTS.unshift(newPayment);

    logTreasuryAudit({
      actor,
      entityType: 'PAYMENT',
      entityId: id,
      action: 'PIX_CREATED',
      summary: `Pagamento PIX ${id} criado no valor de R$ ${newPayment.amount.toFixed(2)} para ${newPayment.destinationAccount.holderName}. Status: ${newPayment.status}`,
      details: newPayment
    });

    return { ok: true, data: newPayment };
  },

  async approvePayment(paymentId, actor) {
    const payment = LOCAL_PAYMENTS.find(p => p.id === paymentId);
    if (!payment) throw new Error('Pagamento não localizado.');
    if (payment.status !== 'AWAITING_APPROVAL') {
      throw new Error(`Pagamento com status ${payment.status} não está aguardando aprovação.`);
    }

    // Segregação de Funções Maker/Checker
    if (actor && actor.name && payment.createdBy && actor.name.toLowerCase() === payment.createdBy.toLowerCase()) {
      throw new Error('Violação de Maker/Checker: Quem criou a ordem de pagamento não pode ser o aprovador.');
    }

    payment.status = 'APPROVED';
    payment.approvedBy = actor?.name || 'Gerente de Tesouraria';
    payment.approvedAt = new Date().toISOString();
    payment.updatedAt = new Date().toISOString();

    logTreasuryAudit({
      actor,
      entityType: 'PAYMENT',
      entityId: paymentId,
      action: 'PAYMENT_APPROVED',
      summary: `Pagamento ${paymentId} de R$ ${payment.amount.toFixed(2)} homologado por ${payment.approvedBy}.`,
      details: payment
    });

    return { ok: true, data: payment };
  },

  async submitPixPayment(paymentId, { idempotencyKey, actor } = {}) {
    const payment = LOCAL_PAYMENTS.find(p => p.id === paymentId);
    if (!payment) throw new Error('Pagamento não localizado.');

    const idempKey = idempotencyKey || payment.idempotencyKey;

    // Idempotência Bancária Garantida
    if (LOCAL_IDEMPOTENCY_STORE.has(idempKey)) {
      const cached = LOCAL_IDEMPOTENCY_STORE.get(idempKey);
      return { ok: true, isIdempotentReplay: true, data: cached };
    }

    if (!['APPROVED'].includes(payment.status)) {
      throw new Error(`Pagamento ${paymentId} deve estar no status APPROVED (atual: ${payment.status}).`);
    }

    // Valida saldo disponível na conta bancária física
    const bankAcc = LOCAL_ACCOUNTS.find(a => a.id === payment.originBankAccountId);
    if (!bankAcc) throw new Error('Conta bancária de débito não encontrada.');

    if (bankAcc.availableBalance < payment.amount) {
      payment.status = 'FAILED';
      payment.failureCode = 'INSUFFICIENT_BANK_FUNDS';
      payment.failureReason = `Saldo bancário insuficiente na conta ${bankAcc.bankName} (Disponível: R$ ${bankAcc.availableBalance.toFixed(2)}).`;
      throw new Error(payment.failureReason);
    }

    payment.status = 'PROCESSING';
    payment.submittedAt = new Date().toISOString();

    // Débito físico na conta bancária
    bankAcc.currentBalance = Number((bankAcc.currentBalance - payment.amount).toFixed(2));
    bankAcc.availableBalance = Number((bankAcc.availableBalance - payment.amount).toFixed(2));
    bankAcc.updatedAt = new Date().toISOString();

    // Liquidação PIX Instantânea (Simulada com geração de E2E bancário)
    const dateFormatted = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const e2e = `E${bankAcc.bankCode.padStart(8, '0')}${dateFormatted}${Math.floor(10000000 + Math.random() * 90000000)}`;
    const txId = `BK-PIX-${Math.floor(100000 + Math.random() * 900000)}`;

    payment.status = 'SETTLED';
    payment.settledAt = new Date().toISOString();
    payment.endToEndId = e2e;
    payment.externalTransactionId = txId;
    payment.updatedAt = new Date().toISOString();

    const responseData = {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      endToEndId: payment.endToEndId,
      bankTransactionId: payment.externalTransactionId,
      settledAt: payment.settledAt
    };

    LOCAL_IDEMPOTENCY_STORE.set(idempKey, responseData);

    logTreasuryAudit({
      actor,
      entityType: 'PAYMENT',
      entityId: paymentId,
      action: 'PIX_SETTLED',
      summary: `PIX liquidado: R$ ${payment.amount.toFixed(2)} debitados da conta ${bankAcc.bankName}. E2E: ${e2e}`,
      details: responseData
    });

    return { ok: true, isIdempotentReplay: false, data: payment };
  },

  // =========================================================================
  // 3. PAGAMENTOS EM LOTE & CENTRAL CNAB 240 / 400
  // =========================================================================
  async getPaymentBatches({ producerId = 'prod-1' } = {}) {
    const list = LOCAL_BATCHES.filter(b => !producerId || b.producerId === producerId);
    return { ok: true, data: list };
  },

  async createPaymentBatch({ producerId = 'prod-1', originBankAccountId, paymentIds, title, scheduledDate }, actor) {
    if (!paymentIds || paymentIds.length === 0) {
      throw new Error('Selecione ao menos um pagamento para o lote.');
    }

    const bankAcc = LOCAL_ACCOUNTS.find(a => a.id === originBankAccountId);
    if (!bankAcc) throw new Error('Conta bancária de origem é obrigatória.');

    const batchId = `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(LOCAL_BATCHES.length + 1).padStart(3, '0')}`;
    const items = [];
    let totalAmount = 0;

    for (const pId of paymentIds) {
      const p = LOCAL_PAYMENTS.find(pay => pay.id === pId);
      if (p) {
        p.originBankAccountId = originBankAccountId;
        items.push(p);
        totalAmount += p.amount;
      }
    }

    const newBatch = {
      id: batchId,
      producerId,
      title: title || `Lote de Pagamentos CNAB — ${bankAcc.bankName}`,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      originBankAccountId,
      originBankName: bankAcc.bankName,
      method: 'TED',
      totalItems: items.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      approvedAmount: 0,
      settledAmount: 0,
      status: 'AGUARDANDO_APROVACAO',
      idempotencyKey: `IDEMP-${batchId}`,
      items,
      createdBy: actor?.name || 'Operador de Caixa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    LOCAL_BATCHES.unshift(newBatch);

    logTreasuryAudit({
      actor,
      entityType: 'PAYMENT_BATCH',
      entityId: batchId,
      action: 'BATCH_CREATED',
      summary: `Lote ${batchId} criado com ${items.length} pagamentos (Total: R$ ${totalAmount.toFixed(2)})`,
      details: newBatch
    });

    return { ok: true, data: newBatch };
  },

  async approvePaymentBatch(batchId, actor) {
    const batch = LOCAL_BATCHES.find(b => b.id === batchId);
    if (!batch) throw new Error('Lote não localizado.');

    // Maker / Checker
    if (actor && actor.name && batch.createdBy && actor.name.toLowerCase() === batch.createdBy.toLowerCase()) {
      throw new Error('Violação de Maker/Checker: O criador do lote de pagamentos não pode homologá-lo.');
    }

    batch.status = 'APROVADO';
    batch.approvedAmount = batch.totalAmount;
    batch.approvedBy = actor?.name || 'Diretoria Financeira';
    batch.approvedAt = new Date().toISOString();
    batch.updatedAt = new Date().toISOString();

    logTreasuryAudit({
      actor,
      entityType: 'PAYMENT_BATCH',
      entityId: batchId,
      action: 'BATCH_APPROVED',
      summary: `Lote ${batchId} homologado por ${batch.approvedBy}. Liberado para geração de remessa CNAB.`,
      details: batch
    });

    return { ok: true, data: batch };
  },

  /**
   * Gerador Extensível de Remessa CNAB 240
   * Cria os Segmentos A e B para remessa bancária com layout FEBRABAN
   */
  async generateCnab240Remessa(batchId, actor) {
    const batch = LOCAL_BATCHES.find(b => b.id === batchId);
    if (!batch) throw new Error('Lote não localizado.');
    if (batch.status !== 'APROVADO') {
      throw new Error(`Lote ${batchId} precisa estar no status APROVADO para gerar remessa.`);
    }

    const bankAcc = LOCAL_ACCOUNTS.find(a => a.id === batch.originBankAccountId);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = LOCAL_CNAB_FILES.length + 1;
    const filename = `CB${dateStr.slice(4)}_${String(seq).padStart(2, '0')}.REM`;

    // Geração textual das linhas padrão FEBRABAN 240
    let lines = [];
    // 1. Header de Arquivo (Registro 0)
    lines.push(`${bankAcc.bankCode.padStart(3, '0')}00000002${bankAcc.holderTaxId.replace(/\D/g, '').padStart(14, '0')}${bankAcc.holderName.padEnd(30, ' ').slice(0, 30)}${bankAcc.bankName.padEnd(30, ' ').slice(0, 30)}${dateStr}${String(seq).padStart(6, '0')}084`);
    // 2. Header de Lote (Registro 1)
    lines.push(`${bankAcc.bankCode.padStart(3, '0')}00011C2001040${bankAcc.holderTaxId.replace(/\D/g, '').padStart(14, '0')}${bankAcc.agency.replace(/\D/g, '').padStart(5, '0')}${bankAcc.account.replace(/\D/g, '').padStart(12, '0')}${batch.title.padEnd(30, ' ').slice(0, 30)}`);

    // 3. Detalhe: Segmento A e Segmento B para cada item
    let recordIndex = 1;
    batch.items.forEach(item => {
      // Segmento A
      const amtCents = Math.round(item.amount * 100).toString().padStart(15, '0');
      const destBank = (item.destinationAccount?.bankCode || '001').padStart(3, '0');
      const destAg = (item.destinationAccount?.agency || '0001').replace(/\D/g, '').padStart(5, '0');
      const destCc = (item.destinationAccount?.account || '00000').replace(/\D/g, '').padStart(12, '0');
      const destName = (item.destinationAccount?.holderName || 'FAVORECIDO').padEnd(30, ' ').slice(0, 30);

      lines.push(`${bankAcc.bankCode.padStart(3, '0')}00013${String(recordIndex++).padStart(5, '0')}A00000${destBank}${destAg}${destCc}${destName}${item.id.padEnd(20, ' ')}${dateStr}${amtCents}`);

      // Segmento B (Documento e Chave PIX se houver)
      const doc = (item.destinationAccount?.holderTaxId || '00000000000').replace(/\D/g, '').padStart(14, '0');
      lines.push(`${bankAcc.bankCode.padStart(3, '0')}00013${String(recordIndex++).padStart(5, '0')}B001${doc}${(item.description || 'PAGAMENTO').padEnd(60, ' ').slice(0, 60)}`);
    });

    // 4. Trailer de Lote e Trailer de Arquivo
    lines.push(`${bankAcc.bankCode.padStart(3, '0')}00015${String(batch.items.length).padStart(6, '0')}${Math.round(batch.totalAmount * 100).toString().padStart(18, '0')}`);
    lines.push(`${bankAcc.bankCode.padStart(3, '0')}9999900001${String(lines.length + 1).padStart(6, '0')}`);

    const cnabContent = lines.join('\r\n');
    const cnabId = `CNAB-${dateStr}-${String(seq).padStart(3, '0')}`;

    const cnabFile = {
      id: cnabId,
      type: 'CNAB240',
      bankCode: bankAcc.bankCode,
      bankName: bankAcc.bankName,
      filename,
      generationDate: new Date().toISOString(),
      sequenceNumber: seq,
      totalRecords: lines.length,
      totalAmount: batch.totalAmount,
      content: cnabContent,
      status: 'GERADO',
      batchId,
      occurrences: [],
      createdAt: new Date().toISOString()
    };

    LOCAL_CNAB_FILES.unshift(cnabFile);
    batch.status = 'ENVIADO_BANCO';
    batch.cnabFileId = cnabId;
    batch.updatedAt = new Date().toISOString();

    logTreasuryAudit({
      actor,
      entityType: 'CNAB_FILE',
      entityId: cnabId,
      action: 'CNAB_REMESSA_GENERATED',
      summary: `Arquivo de remessa CNAB 240 ${filename} gerado para o lote ${batchId}. Total: R$ ${batch.totalAmount.toFixed(2)}`,
      details: { cnabFile, batch }
    });

    return { ok: true, data: cnabFile, batch };
  },

  /**
   * Processador de Arquivo Retorno CNAB 240 / 400
   * Lê as ocorrências de liquidação, debita conta bancária e concilia pagamentos
   */
  async processCnabRetorno(filename, fileContent, actor) {
    if (!fileContent) throw new Error('Conteúdo do arquivo retorno CNAB não informado.');

    const lines = fileContent.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 3) throw new Error('Arquivo de retorno CNAB inválido ou vazio.');

    const occurrences = [];
    let settledSum = 0;
    let rejectedCount = 0;

    lines.forEach((line, idx) => {
      if (line.length >= 50 && (line.includes('PAY-') || (line.substring(7, 8) === '3' && line.substring(13, 14) === 'A'))) {
        const payMatch = line.match(/PAY-\d{4}-\d{3,4}/);
        const itemTxId = payMatch ? payMatch[0] : line.substring(73, 93).trim();
        const occurrenceCode = (line.slice(-2) === '00' || line.endsWith('00')) ? '00' : (line.substring(230, 232) || '00');
        const isSettled = occurrenceCode === '00' || occurrenceCode === 'BD';

        const payment = LOCAL_PAYMENTS.find(p => p.id === itemTxId || p.correlationId === itemTxId);
        if (payment) {
          if (isSettled) {
            payment.status = 'SETTLED';
            payment.settledAt = new Date().toISOString();
            settledSum += payment.amount;

            // Débito bancário na conciliação do retorno
            const bankAcc = LOCAL_ACCOUNTS.find(a => a.id === payment.originBankAccountId);
            if (bankAcc) {
              bankAcc.currentBalance = Number((bankAcc.currentBalance - payment.amount).toFixed(2));
              bankAcc.availableBalance = Number((bankAcc.availableBalance - payment.amount).toFixed(2));
            }
          } else {
            payment.status = 'REJECTED';
            payment.failureCode = `CNAB_ERR_${occurrenceCode}`;
            payment.failureReason = `Rejeição bancária código ${occurrenceCode} no retorno CNAB.`;
            rejectedCount++;
          }
        }

        occurrences.push({
          itemIndex: idx,
          itemTxId,
          code: occurrenceCode,
          description: isSettled ? 'Liquidação confirmada pelo banco' : 'Rejeitado por dados bancários inválidos',
          settled: isSettled
        });
      }
    });

    const cnabRetId = `RET-${Date.now().toString(36).toUpperCase()}`;
    const retRecord = {
      id: cnabRetId,
      filename: filename || 'RETORNO.RET',
      processedAt: new Date().toISOString(),
      totalOccurrences: occurrences.length,
      settledAmount: Number(settledSum.toFixed(2)),
      rejectedCount,
      occurrences
    };

    logTreasuryAudit({
      actor,
      entityType: 'CNAB_RETORNO',
      entityId: cnabRetId,
      action: 'CNAB_RETORNO_PROCESSED',
      summary: `Retorno CNAB ${retRecord.filename} processado: ${occurrences.length} ocorrências (R$ ${settledSum.toFixed(2)} liquidados).`,
      details: retRecord
    });

    return { ok: true, data: retRecord };
  },

  // =========================================================================
  // 4. DASHBOARD DA TESOURARIA & POSIÇÃO DE CAIXA
  // =========================================================================
  async getTreasuryDashboard(producerId = 'prod-1') {
    const accounts = LOCAL_ACCOUNTS.filter(a => !producerId || a.producerId === producerId);
    const payments = LOCAL_PAYMENTS.filter(p => !producerId || p.producerId === producerId);
    const batches = LOCAL_BATCHES.filter(b => !producerId || b.producerId === producerId);

    const totalBankBalance = accounts.reduce((acc, a) => acc + a.currentBalance, 0);
    const availableBankBalance = accounts.reduce((acc, a) => acc + a.availableBalance, 0);
    const blockedBankBalance = accounts.reduce((acc, a) => acc + a.blockedBalance, 0);

    const today = new Date().toISOString().split('T')[0];
    const todayPayments = payments.filter(p => p.scheduledDate === today);
    const todayProjectedOutflow = todayPayments.reduce((acc, p) => acc + p.amount, 0);

    const pendingPix = payments.filter(p => p.method === 'PIX' && ['CREATED', 'AWAITING_APPROVAL', 'APPROVED'].includes(p.status));
    const pendingCnabBatches = batches.filter(b => ['AGUARDANDO_APROVACAO', 'APROVADO', 'ENVIADO_BANCO'].includes(b.status)).length;

    // Agenda Próximos 30 dias
    const scheduleUpcoming = {
      today: todayPayments,
      next7Days: payments.filter(p => {
        const d = p.scheduledDate;
        const limit = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        return d >= today && d <= limit;
      }),
      next30Days: payments.filter(p => {
        const d = p.scheduledDate;
        const limit = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        return d >= today && d <= limit;
      })
    };

    const kpis = {
      totalBankBalance: Number(totalBankBalance.toFixed(2)),
      availableBankBalance: Number(availableBankBalance.toFixed(2)),
      blockedBankBalance: Number(blockedBankBalance.toFixed(2)),
      todayProjectedOutflow: Number(todayProjectedOutflow.toFixed(2)),
      pendingPixCount: pendingPix.length,
      pendingPixAmount: Number(pendingPix.reduce((acc, p) => acc + p.amount, 0).toFixed(2)),
      pendingCnabBatchesCount: pendingCnabBatches,
      activeAccountsCount: accounts.filter(a => a.status === 'ATIVA').length
    };

    return {
      ok: true,
      data: {
        kpis,
        accounts,
        recentPayments: payments.slice(0, 10),
        batches,
        scheduleUpcoming
      }
    };
  },

  // =========================================================================
  // 5. AUDITORIA
  // =========================================================================
  getTreasuryAuditLog() {
    return [...LOCAL_TREASURY_AUDIT];
  }
};
