/**
 * ============================================================================
 * DISK — IMPLANTAÇÃO 5.4: MATRIZ DE TAXAS DE GATEWAYS, ADQUIRENTES E BANDEIRAS
 * (src/services/gatewayFeeMatrixService.js)
 * 
 * Separação Inviolável:
 * 1. Custo Disk (Taxa da Adquirente): MDR + tarifa fixa + custo de antecipação
 * 2. Taxa Comercial Aplicada: Condição comercial acordada
 * 3. Responsável pela Taxa (Fee Bearer): PRODUTOR | CLIENTE_FINAL | DISK | DIVIDIDO
 * 4. Margem Operacional: Taxa comercial - Custo Disk (sem presumir lucro contábil direto)
 * 5. Vigência Imutável: Versionamento de regras sem jamais sobrescrever histórico passado
 * 6. Resolução Hierárquica: REGRA GLOBAL DISK -> PRODUTOR -> EVENTO -> CANAL ->
 *                           ADQUIRENTE -> BANDEIRA -> MODALIDADE / PARCELAMENTO
 * ============================================================================
 */

export const FEE_BEARERS = {
  PRODUTOR: { key: 'PRODUTOR', label: 'Produtor', description: 'Deduzido na composição financeira do evento.' },
  CLIENTE_FINAL: { key: 'CLIENTE_FINAL', label: 'Cliente Final', description: 'Acrescido e detalhado no checkout.' },
  DISK: { key: 'DISK', label: 'Absorvido pela Disk', description: 'Absorvido como despesa de processamento.' },
  DIVIDIDO: { key: 'DIVIDIDO', label: 'Dividido (Produtor + Cliente)', description: 'Rateio proporcional entre as partes.' }
};

export const SETTLEMENT_STATUSES = {
  CONCILIADO: { key: 'CONCILIADO', label: 'Conciliado', badgeClass: 'bg-success text-white' },
  DIVERGENCIA_MDR: { key: 'DIVERGENCIA_MDR', label: 'Divergência de MDR', badgeClass: 'bg-warning text-dark' },
  DIVERGENCIA_TARIFA: { key: 'DIVERGENCIA_TARIFA', label: 'Divergência de Tarifa', badgeClass: 'bg-warning text-dark' },
  DIVERGENCIA_VALOR: { key: 'DIVERGENCIA_VALOR', label: 'Divergência de Valor', badgeClass: 'bg-danger text-white' },
  LIQUIDACAO_NAO_LOCALIZADA: { key: 'LIQUIDACAO_NAO_LOCALIZADA', label: 'Liquidação Não Localizada', badgeClass: 'bg-secondary text-white' },
  LIQUIDACAO_PARCIAL: { key: 'LIQUIDACAO_PARCIAL', label: 'Liquidação Parcial', badgeClass: 'bg-info text-dark' },
  TRANSACAO_NAO_LOCALIZADA: { key: 'TRANSACAO_NAO_LOCALIZADA', label: 'Transação Não Localizada', badgeClass: 'bg-danger text-white' },
  ESTORNO_PENDENTE: { key: 'ESTORNO_PENDENTE', label: 'Estorno Pendente', badgeClass: 'bg-primary text-white' },
  CHARGEBACK: { key: 'CHARGEBACK', label: 'Chargeback', badgeClass: 'bg-dark text-white' },
  DIVERGENCIA_DATA: { key: 'DIVERGENCIA_DATA', label: 'Divergência de Data', badgeClass: 'bg-light text-dark border' }
};

export const RULE_STATUSES = {
  RASCUNHO: 'RASCUNHO',
  PENDENTE_APROVACAO: 'PENDENTE_APROVACAO',
  APROVADO: 'APROVADO',
  REPROVADO: 'REPROVADO',
  AGUARDANDO_VIGENCIA: 'AGUARDANDO_VIGENCIA',
  ATIVA: 'ATIVA',
  EXPIRADA: 'EXPIRADA'
};

export const PAYMENT_MODALITIES = [
  'DEBITO',
  'CREDITO_1X',
  'CREDITO_2X',
  'CREDITO_3X',
  'CREDITO_4X',
  'CREDITO_5X',
  'CREDITO_6X',
  'CREDITO_7_12X',
  'PIX'
];

export const ACQUIRERS_CATALOG = [
  { id: 'cielo', name: 'Cielo', status: 'ATIVO', settlementDays: 'D+30 (Crédito) / D+1 (PIX)', activeTransactions: 15420 },
  { id: 'rede', name: 'Rede', status: 'ATIVO', settlementDays: 'D+30 (Crédito) / D+2 (Débito)', activeTransactions: 8930 },
  { id: 'stone', name: 'Stone (POS/Bilheteria)', status: 'ATIVO', settlementDays: 'D+1 (Débito e POS)', activeTransactions: 6410 },
  { id: 'pagbank', name: 'PagBank', status: 'ATIVO', settlementDays: 'D+14 / D+30', activeTransactions: 3120 }
];

// Trilha Imutável de Auditoria (Implantação 5.4.21)
let AUDIT_LOG_STORE = [
  { id: 'AUD-001', timestamp: '2026-01-01T08:00:00Z', event: 'GATEWAY_CREATED', details: 'Homologação e ativação inicial da Cielo REST API v2', actor: 'Carlos Lima (Financeiro)' },
  { id: 'AUD-002', timestamp: '2026-01-01T08:15:00Z', event: 'MDR_RULE_ACTIVATED', details: 'Regra Cielo Visa 3x ativada com MDR 2.25% e Comercial 3.20%', actor: 'Carlos Lima (Financeiro)' },
  { id: 'AUD-003', timestamp: '2026-09-25T14:35:00Z', event: 'PAYMENT_FEE_CALCULATED', details: 'Snapshot imutável de taxas registrado para transação TX-5096-01', actor: 'Checkout Engine' },
  { id: 'AUD-004', timestamp: '2026-09-26T10:00:00Z', event: 'SETTLEMENT_DIVERGENCE_FOUND', details: 'Divergência de R$ 0,23 no MDR Cielo apurada na conciliação bancária', actor: 'Conciliação Automática' }
];

// Base de Liquidações Previsto x Real (Implantação 5.4.14 e 5.4.15)
let SETTLEMENTS_STORE = [
  {
    transactionId: 'TX-2026-001',
    orderId: 'PED-99120',
    eventId: '5096',
    eventName: 'Festival de Inverno 2026',
    producerId: 'prod-1',
    transactionDate: '2026-09-25T14:32:00Z',
    settlementExpectedDate: '2026-10-25',
    settlementRealDate: '2026-10-25',
    acquirer: 'Cielo',
    brand: 'Visa',
    modality: 'CREDITO_3X',
    installments: 3,
    grossAmount: 1000.00,
    mdrExpectedPercent: 2.25,
    mdrExpectedAmount: 22.50,
    fixedFeeExpected: 0.00,
    netExpectedAmount: 977.50,
    mdrRealPercent: 2.27,
    mdrRealAmount: 22.73,
    fixedFeeReal: 0.00,
    netSettledAmount: 977.27,
    differenceAmount: 0.23,
    reconciliationStatus: 'DIVERGENCIA_MDR',
    reconciliationNotes: 'MDR cobrado da Cielo 2,27% difere de 2,25% contratado (+R$ 0,23)'
  },
  {
    transactionId: 'TX-2026-002',
    orderId: 'PED-99121',
    eventId: '5096',
    eventName: 'Festival de Inverno 2026',
    producerId: 'prod-1',
    transactionDate: '2026-09-25T15:10:00Z',
    settlementExpectedDate: '2026-09-26',
    settlementRealDate: '2026-09-26',
    acquirer: 'Cielo',
    brand: 'PIX',
    modality: 'PIX',
    installments: 1,
    grossAmount: 21960.00,
    mdrExpectedPercent: 0.99,
    mdrExpectedAmount: 217.40,
    fixedFeeExpected: 0.00,
    netExpectedAmount: 21742.60,
    mdrRealPercent: 0.99,
    mdrRealAmount: 217.40,
    fixedFeeReal: 0.00,
    netSettledAmount: 21742.60,
    differenceAmount: 0.00,
    reconciliationStatus: 'CONCILIADO',
    reconciliationNotes: 'Conciliado automaticamente sem divergências'
  },
  {
    transactionId: 'TX-2026-003',
    orderId: 'PED-99122',
    eventId: '5096',
    eventName: 'Festival de Inverno 2026',
    producerId: 'prod-1',
    transactionDate: '2026-09-25T16:00:00Z',
    settlementExpectedDate: '2026-10-25',
    settlementRealDate: '2026-10-25',
    acquirer: 'Rede',
    brand: 'Mastercard',
    modality: 'CREDITO_1X',
    installments: 1,
    grossAmount: 7000.00,
    mdrExpectedPercent: 2.80,
    mdrExpectedAmount: 196.00,
    fixedFeeExpected: 0.39,
    netExpectedAmount: 6803.61,
    mdrRealPercent: 2.80,
    mdrRealAmount: 196.00,
    fixedFeeReal: 0.39,
    netSettledAmount: 6803.61,
    differenceAmount: 0.00,
    reconciliationStatus: 'CONCILIADO',
    reconciliationNotes: 'Conciliado perfeitamente'
  },
  {
    transactionId: 'TX-2026-004',
    orderId: 'PED-99123',
    eventId: '5096',
    eventName: 'Festival de Inverno 2026',
    producerId: 'prod-1',
    transactionDate: '2026-09-25T17:40:00Z',
    settlementExpectedDate: '2026-09-26',
    settlementRealDate: '2026-09-26',
    acquirer: 'Stone',
    brand: 'Multi-Bandeiras',
    modality: 'DEBITO',
    installments: 1,
    grossAmount: 1500.00,
    mdrExpectedPercent: 1.50,
    mdrExpectedAmount: 22.50,
    fixedFeeExpected: 0.15,
    netExpectedAmount: 1477.35,
    mdrRealPercent: 1.50,
    mdrRealAmount: 22.50,
    fixedFeeReal: 0.45,
    netSettledAmount: 1477.05,
    differenceAmount: 0.30,
    reconciliationStatus: 'DIVERGENCIA_TARIFA',
    reconciliationNotes: 'Tarifa fixa cobrada (R$ 0,45) diverge do contratado (R$ 0,15)'
  },
  {
    transactionId: 'TX-2026-005',
    orderId: 'PED-99124',
    eventId: '5096',
    eventName: 'Festival de Inverno 2026',
    producerId: 'prod-1',
    transactionDate: '2026-09-25T18:20:00Z',
    settlementExpectedDate: '2026-10-09',
    settlementRealDate: null,
    acquirer: 'PagBank',
    brand: 'Multi-Bandeiras',
    modality: 'CREDITO_1X',
    installments: 1,
    grossAmount: 3200.00,
    mdrExpectedPercent: 3.20,
    mdrExpectedAmount: 102.40,
    fixedFeeExpected: 0.40,
    netExpectedAmount: 3097.20,
    mdrRealPercent: null,
    mdrRealAmount: null,
    fixedFeeReal: null,
    netSettledAmount: null,
    differenceAmount: 3097.20,
    reconciliationStatus: 'LIQUIDACAO_NAO_LOCALIZADA',
    reconciliationNotes: 'Aguardando extrato de liquidação PagBank para conciliação'
  },
  {
    transactionId: 'TX-2026-006',
    orderId: 'PED-99125',
    eventId: '5096',
    eventName: 'Festival de Inverno 2026',
    producerId: 'prod-1',
    transactionDate: '2026-09-25T19:15:00Z',
    settlementExpectedDate: '2026-10-25',
    settlementRealDate: '2026-10-25',
    acquirer: 'Cielo',
    brand: 'Visa',
    modality: 'CREDITO_2X',
    installments: 2,
    grossAmount: 450.00,
    mdrExpectedPercent: 2.25,
    mdrExpectedAmount: 10.13,
    fixedFeeExpected: 0.00,
    netExpectedAmount: 439.87,
    mdrRealPercent: 2.25,
    mdrRealAmount: 10.13,
    fixedFeeReal: 0.00,
    netSettledAmount: 0.00,
    differenceAmount: 439.87,
    reconciliationStatus: 'CHARGEBACK',
    reconciliationNotes: 'Notificação de contestação de compra recebida pelo gateway'
  }
];

// Matriz de Regras de Tarifação com Vigências
let GATEWAY_RULES_STORE = [
  // CIELO - Regras Globais
  {
    id: 'RULE-CIELO-PIX-GLOBAL',
    scope: 'GLOBAL',
    targetId: null,
    acquirer: 'Cielo',
    channel: 'ONLINE',
    brand: 'PIX',
    modality: 'PIX',
    installments: 1,
    acquirerMdr: 0.99,
    commercialFee: 0.99,
    fixedCost: 0.00,
    anticipationCost: 0.00,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    version: 1,
    active: true,
    history: [
      { version: 1, effectiveFrom: '2026-01-01', acquirerMdr: 0.99, commercialFee: 0.99, actor: 'Carlos Lima', reason: 'Contrato comercial 2026' }
    ]
  },
  {
    id: 'RULE-CIELO-VISA-DEB-GLOBAL',
    scope: 'GLOBAL',
    targetId: null,
    acquirer: 'Cielo',
    channel: 'ONLINE',
    brand: 'Visa',
    modality: 'DEBITO',
    installments: 1,
    acquirerMdr: 0.89,
    commercialFee: 1.50,
    fixedCost: 0.00,
    anticipationCost: 0.00,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    version: 1,
    active: true,
    history: [
      { version: 1, effectiveFrom: '2026-01-01', acquirerMdr: 0.89, commercialFee: 1.50, actor: 'Carlos Lima', reason: 'Contrato padrão Cielo 2026' }
    ]
  },
  {
    id: 'RULE-CIELO-VISA-CRED1X-GLOBAL',
    scope: 'GLOBAL',
    targetId: null,
    acquirer: 'Cielo',
    channel: 'ONLINE',
    brand: 'Visa',
    modality: 'CREDITO_1X',
    installments: 1,
    acquirerMdr: 1.79,
    commercialFee: 2.50,
    fixedCost: 0.39,
    anticipationCost: 0.00,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    version: 1,
    active: true,
    history: [
      { version: 1, effectiveFrom: '2026-01-01', acquirerMdr: 1.79, commercialFee: 2.50, actor: 'Carlos Lima', reason: 'Tabela Padrão' }
    ]
  },
  {
    id: 'RULE-CIELO-VISA-CRED2X-GLOBAL',
    scope: 'GLOBAL',
    targetId: null,
    acquirer: 'Cielo',
    channel: 'ONLINE',
    brand: 'Visa',
    modality: 'CREDITO_2X',
    installments: 2,
    acquirerMdr: 2.10,
    commercialFee: 2.90,
    fixedCost: 0.39,
    anticipationCost: 0.00,
    feeBearer: 'CLIENTE_FINAL',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    version: 1,
    active: true,
    history: [
      { version: 1, effectiveFrom: '2026-01-01', acquirerMdr: 2.10, commercialFee: 2.90, actor: 'Carlos Lima', reason: 'Repasse parcelamento cliente' }
    ]
  },
  {
    id: 'RULE-CIELO-VISA-CRED3X-GLOBAL',
    scope: 'GLOBAL',
    targetId: null,
    acquirer: 'Cielo',
    channel: 'ONLINE',
    brand: 'Visa',
    modality: 'CREDITO_3X',
    installments: 3,
    acquirerMdr: 2.25,
    commercialFee: 3.20,
    fixedCost: 0.39,
    anticipationCost: 0.00,
    feeBearer: 'CLIENTE_FINAL',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    version: 1,
    active: true,
    history: [
      { version: 1, effectiveFrom: '2026-01-01', acquirerMdr: 2.25, commercialFee: 3.20, actor: 'Carlos Lima', reason: 'Repasse parcelamento cliente' }
    ]
  },
  {
    id: 'RULE-CIELO-MASTER-CRED1X-GLOBAL',
    scope: 'GLOBAL',
    targetId: null,
    acquirer: 'Cielo',
    channel: 'ONLINE',
    brand: 'Mastercard',
    modality: 'CREDITO_1X',
    installments: 1,
    acquirerMdr: 1.79,
    commercialFee: 2.50,
    fixedCost: 0.39,
    anticipationCost: 0.00,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    version: 1,
    active: true,
    history: [
      { version: 1, effectiveFrom: '2026-01-01', acquirerMdr: 1.79, commercialFee: 2.50, actor: 'Carlos Lima', reason: 'Tabela Padrão Mastercard' }
    ]
  },

  // REDE - Regras Globais
  {
    id: 'RULE-REDE-VISA-CRED1X-GLOBAL',
    scope: 'GLOBAL',
    targetId: null,
    acquirer: 'Rede',
    channel: 'ONLINE',
    brand: 'Visa',
    modality: 'CREDITO_1X',
    installments: 1,
    acquirerMdr: 2.80,
    commercialFee: 3.20,
    fixedCost: 0.39,
    anticipationCost: 0.00,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    version: 1,
    active: true,
    history: [
      { version: 1, effectiveFrom: '2026-01-01', acquirerMdr: 2.80, commercialFee: 3.20, actor: 'Carlos Lima', reason: 'Contrato Rede 2026' }
    ]
  },
  {
    id: 'RULE-REDE-ELO-CRED1X-GLOBAL',
    scope: 'GLOBAL',
    targetId: null,
    acquirer: 'Rede',
    channel: 'ONLINE',
    brand: 'Elo',
    modality: 'CREDITO_1X',
    installments: 1,
    acquirerMdr: 2.95,
    commercialFee: 3.50,
    fixedCost: 0.39,
    anticipationCost: 0.00,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    version: 1,
    active: true,
    history: [
      { version: 1, effectiveFrom: '2026-01-01', acquirerMdr: 2.95, commercialFee: 3.50, actor: 'Carlos Lima', reason: 'Tabela Elo Rede' }
    ]
  },

  // STONE - POS / Maquininha Bilheteria Física
  {
    id: 'RULE-STONE-POS-DEB-GLOBAL',
    scope: 'GLOBAL',
    targetId: null,
    acquirer: 'Stone',
    channel: 'POS_FISICO',
    brand: 'Multi-Bandeiras',
    modality: 'DEBITO',
    installments: 1,
    acquirerMdr: 1.50,
    commercialFee: 1.80,
    fixedCost: 0.15,
    anticipationCost: 0.00,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    version: 1,
    active: true,
    history: [
      { version: 1, effectiveFrom: '2026-01-01', acquirerMdr: 1.50, commercialFee: 1.80, actor: 'Carlos Lima', reason: 'Bilheteria POS Stone' }
    ]
  },
  {
    id: 'RULE-STONE-POS-CRED1X-GLOBAL',
    scope: 'GLOBAL',
    targetId: null,
    acquirer: 'Stone',
    channel: 'POS_FISICO',
    brand: 'Multi-Bandeiras',
    modality: 'CREDITO_1X',
    installments: 1,
    acquirerMdr: 2.30,
    commercialFee: 2.80,
    fixedCost: 0.15,
    anticipationCost: 0.00,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    version: 1,
    active: true,
    history: [
      { version: 1, effectiveFrom: '2026-01-01', acquirerMdr: 2.30, commercialFee: 2.80, actor: 'Carlos Lima', reason: 'Bilheteria POS Stone Crédito' }
    ]
  },

  // PAGBANK - Pontos de Venda / Agência
  {
    id: 'RULE-PAGBANK-CRED-GLOBAL',
    scope: 'GLOBAL',
    targetId: null,
    acquirer: 'PagBank',
    channel: 'AGENCIA_PDV',
    brand: 'Multi-Bandeiras',
    modality: 'CREDITO_1X',
    installments: 1,
    acquirerMdr: 3.20,
    commercialFee: 3.90,
    fixedCost: 0.40,
    anticipationCost: 0.00,
    feeBearer: 'PRODUTOR',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    version: 1,
    active: true,
    history: [
      { version: 1, effectiveFrom: '2026-01-01', acquirerMdr: 3.20, commercialFee: 3.90, actor: 'Carlos Lima', reason: 'Parceiro PDV PagBank' }
    ]
  }
];

export const gatewayFeeMatrixService = {
  /**
   * Obtém todas as operadoras/adquirentes cadastradas
   */
  getAcquirers() {
    return [...ACQUIRERS_CATALOG];
  },

  /**
   * Obtém regras de taxas filtradas por escopo, canal ou adquirente
   */
  getRules(filters = {}) {
    let list = [...GATEWAY_RULES_STORE];
    if (filters.acquirer && filters.acquirer !== 'TODOS') {
      list = list.filter(r => r.acquirer.toLowerCase() === filters.acquirer.toLowerCase());
    }
    if (filters.channel && filters.channel !== 'TODOS') {
      list = list.filter(r => r.channel.toLowerCase() === filters.channel.toLowerCase());
    }
    if (filters.feeBearer && filters.feeBearer !== 'TODOS') {
      list = list.filter(r => r.feeBearer === filters.feeBearer);
    }
    if (filters.scope && filters.scope !== 'TODOS') {
      list = list.filter(r => r.scope === filters.scope);
    }
    return list;
  },

  /**
   * Resolução Hierárquica Estrita:
   * REGRA GLOBAL -> PRODUTOR -> EVENTO -> CANAL -> ADQUIRENTE -> BANDEIRA -> MODALIDADE
   */
  resolvePricingRule({ producerId, eventId, channel = 'ONLINE', acquirer = 'Cielo', brand = 'Visa', modality = 'CREDITO_1X', atDate = null }) {
    const targetDate = atDate ? new Date(atDate) : new Date();

    // Filtra regras que estão em vigência para a data (considerando vigência ativa e histórico versionado)
    const activeRules = [];
    for (const r of GATEWAY_RULES_STORE) {
      if (!r.active) continue;
      const currentFrom = new Date(r.effectiveFrom);
      const currentTo = r.effectiveTo ? new Date(r.effectiveTo) : null;

      if (currentFrom <= targetDate && (!currentTo || currentTo >= targetDate)) {
        activeRules.push(r);
      } else if (currentFrom > targetDate && Array.isArray(r.history)) {
        // Buscar no histórico a versão que vigorava na targetDate
        const histMatch = r.history.find(h => {
          const hFrom = new Date(h.effectiveFrom);
          const hTo = h.effectiveTo ? new Date(h.effectiveTo) : null;
          return hFrom <= targetDate && (!hTo || hTo >= targetDate);
        });
        if (histMatch) {
          activeRules.push({
            ...r,
            version: histMatch.version,
            acquirerMdr: histMatch.acquirerMdr,
            commercialFee: histMatch.commercialFee,
            feeBearer: histMatch.feeBearer || r.feeBearer,
            effectiveFrom: histMatch.effectiveFrom,
            effectiveTo: histMatch.effectiveTo
          });
        }
      }
    }

    // Ordem de especificidade:
    // 1. Regra específica do Evento (targetId === eventId)
    // 2. Regra específica do Produtor (targetId === producerId)
    // 3. Regra Global (scope === 'GLOBAL')
    const candidates = activeRules.filter(r => {
      const matchAcquirer = !r.acquirer || r.acquirer.toLowerCase() === acquirer.toLowerCase();
      const matchBrand = !r.brand || r.brand === 'Multi-Bandeiras' || r.brand.toLowerCase() === brand.toLowerCase();
      const matchModality = !r.modality || r.modality === modality;
      const matchChannel = !r.channel || r.channel === channel;

      if (!matchAcquirer || !matchBrand || !matchModality || !matchChannel) return false;

      const isEvt = r.scope === 'EVENT' || r.scope === 'EVENTO';
      const isProd = r.scope === 'PRODUCER' || r.scope === 'PRODUTOR';
      const rTarget = String(r.targetId || r.eventId || r.producerId || '');

      // Regra de evento só é candidata se o eventId bater
      if (isEvt && (!eventId || rTarget !== String(eventId))) return false;

      // Regra de produtor só é candidata se o producerId bater
      if (isProd && (!producerId || rTarget !== String(producerId))) return false;

      return true;
    });

    // Score de hierarquia: Evento (100) > Produtor (50) > Global (10)
    const scored = candidates.map(r => {
      let score = 0;
      const isEvt = r.scope === 'EVENT' || r.scope === 'EVENTO';
      const isProd = r.scope === 'PRODUCER' || r.scope === 'PRODUTOR';

      if (isEvt) score += 100;
      else if (isProd) score += 50;
      else score += 10;

      if (r.brand && r.brand !== 'Multi-Bandeiras') score += 5;
      return { rule: r, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const resolved = scored[0]?.rule || null;

    if (!resolved) {
      // Fallback de segurança: Regra genérica padrão Disk
      return {
        scope: 'FALLBACK_GLOBAL',
        ruleOrigin: 'GLOBAL',
        acquirer,
        brand,
        modality,
        acquirerMdr: 2.50,
        commercialFee: 2.99,
        fixedCost: 0.39,
        anticipationCost: 0.00,
        feeBearer: 'PRODUTOR',
        operationalSpread: 0.49,
        effectiveFrom: '2026-01-01',
        version: 1
      };
    }

    const operationalSpread = Math.round((resolved.commercialFee - resolved.acquirerMdr) * 100) / 100;
    const isEvt = resolved.scope === 'EVENT' || resolved.scope === 'EVENTO';
    const isProd = resolved.scope === 'PRODUCER' || resolved.scope === 'PRODUTOR';
    const ruleOrigin = isEvt ? 'EVENTO' : (isProd ? 'PRODUTOR' : 'GLOBAL');
    return {
      ...resolved,
      ruleOrigin,
      operationalSpread
    };
  },

  /**
   * Simula a precificação exata de uma transação para o Checkout ou Fechamento
   */
  calculateTransactionPricing({ amount = 100, producerId = null, eventId = null, channel = 'ONLINE', acquirer = 'Cielo', brand = 'Visa', modality = 'CREDITO_3X', splitProducerPercent = undefined, splitCustomerPercent = undefined }) {
    const val = Number(amount) || 0;
    const rule = this.resolvePricingRule({ producerId, eventId, channel, acquirer, brand, modality });

    const acquirerCostMdr = Math.round((val * (rule.acquirerMdr / 100)) * 100) / 100;
    const commercialFeeAmount = Math.round((val * (rule.commercialFee / 100)) * 100) / 100;
    const operationalSpreadAmount = Math.round((commercialFeeAmount - acquirerCostMdr) * 100) / 100;

    let chargedFromCustomer = 0;
    let deductedFromProducer = 0;
    let absorbedByDisk = 0;

    switch (rule.feeBearer) {
      case 'CLIENTE_FINAL':
        chargedFromCustomer = commercialFeeAmount;
        deductedFromProducer = 0;
        absorbedByDisk = 0;
        break;
      case 'PRODUTOR':
        chargedFromCustomer = 0;
        deductedFromProducer = commercialFeeAmount;
        absorbedByDisk = 0;
        break;
      case 'DISK':
        absorbedByDisk = acquirerCostMdr;
        chargedFromCustomer = 0;
        deductedFromProducer = 0;
        break;
      case 'DIVIDIDO':
        if (splitProducerPercent !== undefined && splitCustomerPercent !== undefined) {
          const pProd = Number(splitProducerPercent);
          const pCust = Number(splitCustomerPercent);
          // Se somar aproximadamente 100 (ex: 37.5% e 62.5%), é fatia da taxa comercial calculada
          if (Math.abs((pProd + pCust) - 100) < 0.1) {
            chargedFromCustomer = Math.round((commercialFeeAmount * (pCust / 100)) * 100) / 100;
            deductedFromProducer = Math.round((commercialFeeAmount - chargedFromCustomer) * 100) / 100;
          } else {
            // Caso contrário, são taxas nominais (ex: 1.20% produtor e 2.00% cliente = 3.20%)
            chargedFromCustomer = Math.round((val * (pCust / 100)) * 100) / 100;
            deductedFromProducer = Math.round((val * (pProd / 100)) * 100) / 100;
          }
        } else {
          chargedFromCustomer = Math.round((commercialFeeAmount / 2) * 100) / 100;
          deductedFromProducer = Math.round((commercialFeeAmount - chargedFromCustomer) * 100) / 100;
        }
        break;
      default:
        deductedFromProducer = commercialFeeAmount;
    }

    return {
      amount: val,
      rule,
      acquirerCostMdr,
      commercialFeeAmount,
      operationalSpreadAmount,
      breakdown: {
        feeBearer: rule.feeBearer,
        chargedFromCustomer,
        deductedFromProducer,
        absorbedByDisk,
        netToProducer: Math.round((val - deductedFromProducer) * 100) / 100,
        totalCustomerPays: Math.round((val + chargedFromCustomer) * 100) / 100
      }
    };
  },

  /**
   * Snapshot Imutável da Transação (Implantação 5.4.9)
   * Registrado no ato da venda e gravado no Ledger
   */
  createPaymentFeeSnapshot({ transactionId = null, orderId = null, amount = 100, producerId = null, eventId = null, channel = 'ONLINE', acquirer = 'Cielo', brand = 'Visa', modality = 'CREDITO_1X', transactionDate = null, splitProducerPercent = undefined, splitCustomerPercent = undefined }) {
    const pricing = this.calculateTransactionPricing({
      amount,
      producerId,
      eventId,
      channel,
      acquirer,
      brand,
      modality,
      splitProducerPercent,
      splitCustomerPercent
    });

    const rule = pricing.rule;
    const nowIso = new Date().toISOString();
    const txDate = transactionDate || nowIso;
    const txId = transactionId || `TX-${Date.now()}`;

    const snapshot = {
      snapshotId: `SNP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      transactionId: txId,
      orderId: orderId || null,
      eventId: eventId || null,
      producerId: producerId || null,
      createdAt: nowIso,
      timestamp: nowIso,
      transactionDate: txDate,
      adquirente: rule.acquirer,
      acquirer: rule.acquirer,
      bandeira: rule.brand,
      brand: rule.brand,
      modalidade: rule.modality,
      modality: rule.modality,
      parcelas: rule.installments || 1,
      installments: rule.installments || 1,
      channel: rule.channel || channel,
      mdrPercent: rule.acquirerMdr,
      tarifaFixa: rule.fixedCost || 0,
      fixedCost: rule.fixedCost || 0,
      regraComercialPercent: rule.commercialFee,
      commercialFee: rule.commercialFee,
      regraComercialFixa: rule.fixedCost || 0,
      responsavelCobranca: rule.feeBearer,
      feeBearer: rule.feeBearer,
      amount: pricing.amount,
      valorBruto: pricing.amount,
      acquirerCostMdr: pricing.acquirerCostMdr,
      custoAdquirenciaPrevisto: pricing.acquirerCostMdr,
      commercialFeeAmount: pricing.commercialFeeAmount,
      taxaComercialCalculada: pricing.commercialFeeAmount,
      operationalSpread: pricing.operationalSpreadAmount,
      operationalSpreadAmount: pricing.operationalSpreadAmount,
      ruleId: rule.id,
      ruleVersion: rule.version,
      ruleScope: rule.scope,
      ruleOrigin: rule.ruleOrigin || ((rule.scope === 'EVENT' || rule.scope === 'EVENTO') ? 'EVENTO' : ((rule.scope === 'PRODUCER' || rule.scope === 'PRODUTOR') ? 'PRODUTOR' : 'GLOBAL')),
      contractId: rule.contractId || `CTR-${(rule.acquirer || 'ACQ').toUpperCase()}-2026`,
      vigencia: rule.effectiveFrom,
      breakdown: { ...pricing.breakdown },
      immutable: true
    };

    this.logAuditEvent({
      event: 'PAYMENT_FEE_CALCULATED',
      action: 'SNAPSHOT_CRIADO',
      details: {
        snapshotId: snapshot.snapshotId,
        transactionId: snapshot.transactionId,
        amount: snapshot.amount,
        text: `Snapshot ${snapshot.snapshotId} gerado para ${snapshot.adquirente} ${snapshot.bandeira} (${snapshot.modalidade}): Bruto R$ ${snapshot.valorBruto.toFixed(2)}, MDR Previsto R$ ${snapshot.custoAdquirenciaPrevisto.toFixed(2)}`
      },
      actor: 'Checkout Payment Engine'
    });

    return snapshot;
  },

  /**
   * Adiciona nova vigência (NUNCA sobrescreve histórico passado)
   */
  addNewVigency({ ruleId, acquirerMdr, commercialFee, feeBearer, effectiveFrom, actorName = 'Carlos Lima', reason = '' }) {
    const existing = GATEWAY_RULES_STORE.find(r => r.id === ruleId);
    if (!existing) throw new Error(`Regra ${ruleId} não encontrada.`);

    // Encerra a vigência anterior
    existing.effectiveTo = effectiveFrom;
    existing.version += 1;
    existing.history.unshift({
      version: existing.version,
      effectiveFrom: existing.effectiveFrom,
      effectiveTo: effectiveFrom,
      acquirerMdr: existing.acquirerMdr,
      commercialFee: existing.commercialFee,
      feeBearer: existing.feeBearer,
      actor: actorName,
      reason: reason || 'Atualização de vigência contratual'
    });

    // Atualiza com os novos valores a partir da nova data
    existing.acquirerMdr = Number(acquirerMdr);
    existing.commercialFee = Number(commercialFee);
    if (feeBearer) existing.feeBearer = feeBearer;
    existing.effectiveFrom = effectiveFrom;
    existing.effectiveTo = null;

    this.logAuditEvent({
      event: 'MDR_RULE_ACTIVATED',
      details: `Nova vigência ativada para regra ${existing.id} (v${existing.version}) a partir de ${effectiveFrom}: MDR ${existing.acquirerMdr}%, Comercial ${existing.commercialFee}%`,
      actor: actorName
    });

    return existing;
  },

  /**
   * Cria nova regra (Global, Produtor ou Evento)
   */
  createRule(newRuleData) {
    const id = `RULE-${(newRuleData.acquirer || 'ACQ').toUpperCase()}-${(newRuleData.brand || 'ALL').toUpperCase()}-${Date.now()}`;
    const targetId = newRuleData.targetId || newRuleData.eventId || newRuleData.producerId || null;
    const rule = {
      id,
      scope: newRuleData.scope || 'GLOBAL',
      targetId,
      eventId: newRuleData.eventId || (newRuleData.scope === 'EVENT' || newRuleData.scope === 'EVENTO' ? targetId : null),
      producerId: newRuleData.producerId || (newRuleData.scope === 'PRODUCER' || newRuleData.scope === 'PRODUTOR' ? targetId : null),
      acquirer: newRuleData.acquirer || 'Cielo',
      channel: newRuleData.channel || 'ONLINE',
      brand: newRuleData.brand || 'Visa',
      modality: newRuleData.modality || 'CREDITO_1X',
      installments: Number(newRuleData.installments) || 1,
      acquirerMdr: Number(newRuleData.acquirerMdr) || 2.0,
      commercialFee: Number(newRuleData.commercialFee) || 2.5,
      fixedCost: Number(newRuleData.fixedCost) || 0.0,
      anticipationCost: Number(newRuleData.anticipationCost) || 0.0,
      feeBearer: newRuleData.feeBearer || 'PRODUTOR',
      effectiveFrom: newRuleData.effectiveFrom || new Date().toISOString().slice(0, 10),
      effectiveTo: null,
      version: 1,
      active: newRuleData.status !== 'REPROVADO',
      status: newRuleData.status || 'ATIVA',
      history: [
        { version: 1, effectiveFrom: newRuleData.effectiveFrom || new Date().toISOString().slice(0, 10), acquirerMdr: newRuleData.acquirerMdr, commercialFee: newRuleData.commercialFee, actor: newRuleData.actor || 'Administrador', reason: newRuleData.reason || 'Criação inicial da regra' }
      ]
    };

    GATEWAY_RULES_STORE.push(rule);

    this.logAuditEvent({
      event: 'MDR_RULE_CREATED',
      details: `Regra ${rule.id} criada para ${rule.acquirer} ${rule.brand} (${rule.modality}): MDR ${rule.acquirerMdr}%, Comercial ${rule.commercialFee}%`,
      actor: newRuleData.actor || 'Administrador'
    });

    return rule;
  },

  /**
   * Governança: Submete regra para aprovação do Financeiro Disk (Implantação 5.4.20)
   */
  submitRuleForApproval(ruleId, actorName = 'Gestor Comercial') {
    const rule = GATEWAY_RULES_STORE.find(r => r.id === ruleId);
    if (!rule) throw new Error(`Regra ${ruleId} não encontrada.`);
    rule.status = 'PENDENTE_APROVACAO';
    rule.history.unshift({
      version: rule.version,
      action: 'SUBMITTED_FOR_APPROVAL',
      actor: actorName,
      timestamp: new Date().toISOString(),
      reason: 'Regra enviada para aprovação do Financeiro Disk'
    });
    this.logAuditEvent({
      event: 'MDR_RULE_SUBMITTED',
      details: `Regra ${rule.id} enviada para aprovação`,
      actor: actorName
    });
    return rule;
  },

  /**
   * Governança: Aprova regra comercial e MDR (Implantação 5.4.20)
   */
  approveRule(ruleId, approverName = 'Carlos Lima (Financeiro Disk)', notes = '') {
    const rule = GATEWAY_RULES_STORE.find(r => r.id === ruleId);
    if (!rule) throw new Error(`Regra ${ruleId} não encontrada.`);
    rule.status = 'ATIVA';
    rule.active = true;
    rule.approvedBy = approverName;
    rule.approvedAt = new Date().toISOString();
    rule.history.unshift({
      version: rule.version,
      action: 'APPROVED',
      actor: approverName,
      timestamp: new Date().toISOString(),
      reason: notes || 'Regra comercial aprovada pela Gestão Financeira Disk'
    });
    this.logAuditEvent({
      event: 'MDR_RULE_APPROVED',
      action: 'REGRA_APROVADA',
      details: `Regra ${rule.id} aprovada por ${approverName}`,
      actor: approverName
    });
    return rule;
  },

  /**
   * Governança: Reprova regra comercial (Implantação 5.4.20)
   */
  rejectRule(ruleId, rejecterName = 'Carlos Lima (Financeiro Disk)', reason = '') {
    const rule = GATEWAY_RULES_STORE.find(r => r.id === ruleId);
    if (!rule) throw new Error(`Regra ${ruleId} não encontrada.`);
    rule.status = 'REPROVADO';
    rule.active = false;
    rule.rejectedBy = rejecterName;
    rule.rejectedAt = new Date().toISOString();
    rule.history.unshift({
      version: rule.version,
      action: 'REJECTED',
      actor: rejecterName,
      timestamp: new Date().toISOString(),
      reason: reason || 'Condição comercial reprovada'
    });
    this.logAuditEvent({
      event: 'MDR_RULE_REJECTED',
      action: 'REGRA_REPROVADA',
      details: `Regra ${rule.id} reprovada por ${rejecterName}: ${reason}`,
      actor: rejecterName
    });
    return rule;
  },

  /**
   * Adiciona nova operadora/adquirente no catálogo
   */
  createAcquirer(acquirerData) {
    const id = (acquirerData.id || acquirerData.name || 'acq').toLowerCase().replace(/\s+/g, '-');
    const acquirer = {
      id,
      name: acquirerData.name || 'Nova Adquirente',
      status: acquirerData.status || 'ATIVO',
      settlementDays: acquirerData.settlementDays || 'D+30',
      activeTransactions: Number(acquirerData.activeTransactions) || 0
    };
    ACQUIRERS_CATALOG.push(acquirer);

    this.logAuditEvent({
      event: 'GATEWAY_CREATED',
      details: `Nova operadora ${acquirer.name} homologada no sistema com prazo ${acquirer.settlementDays}`,
      actor: 'Carlos Lima (Financeiro)'
    });

    return acquirer;
  },

  /**
   * Liquidações: Obtém base de liquidações Previsto x Real (Implantação 5.4.15)
   */
  getSettlements(filters = {}) {
    let list = SETTLEMENTS_STORE.map(s => ({
      ...s,
      estimatedMdr: s.mdrExpectedAmount,
      actualMdr: s.mdrRealAmount,
      differenceMdr: s.differenceAmount,
      status: s.reconciliationStatus
    }));
    if (filters.acquirer && filters.acquirer !== 'TODOS') {
      list = list.filter(s => s.acquirer.toLowerCase() === filters.acquirer.toLowerCase());
    }
    if (filters.status && filters.status !== 'TODOS') {
      list = list.filter(s => s.reconciliationStatus === filters.status || s.status === filters.status);
    }
    if (filters.eventId && filters.eventId !== 'TODOS') {
      list = list.filter(s => String(s.eventId) === String(filters.eventId));
    }
    return list;
  },

  /**
   * Liquidações: Consolida KPIs analíticos de liquidação e conciliação
   */
  getSettlementsSummary(filters = {}) {
    const list = this.getSettlements(filters);
    const totalGross = list.reduce((acc, s) => acc + (s.grossAmount || 0), 0);
    const totalExpectedMdr = list.reduce((acc, s) => acc + (s.mdrExpectedAmount || 0), 0);
    const totalRealMdr = list.reduce((acc, s) => acc + (s.mdrRealAmount || 0), 0);
    const totalDivergence = list.reduce((acc, s) => acc + (s.differenceAmount || 0), 0);
    const reconciledCount = list.filter(s => s.reconciliationStatus === 'CONCILIADO').length;
    const divergenceCount = list.filter(s => s.reconciliationStatus !== 'CONCILIADO').length;
    const reconciliationRate = list.length > 0 ? Math.round((reconciledCount / list.length) * 100) : 100;

    return {
      totalTransactions: list.length,
      totalGross,
      totalExpectedMdr,
      totalRealMdr,
      totalDivergence,
      reconciledCount,
      divergenceCount,
      reconciliationRate
    };
  },

  /**
   * Conciliação manual de liquidação com divergência (Implantação 5.4.16)
   */
  reconcileSettlement(transactionId, optionsOrStatus, justification = '', auditorName = 'Carlos Lima') {
    let opts = {};
    if (typeof optionsOrStatus === 'string') {
      opts = { status: optionsOrStatus, notes: justification, actor: auditorName };
    } else if (typeof optionsOrStatus === 'object') {
      opts = optionsOrStatus || {};
    }
    const item = SETTLEMENTS_STORE.find(s => s.transactionId === transactionId);
    if (!item) throw new Error(`Transação ${transactionId} não encontrada nas liquidações.`);

    if (opts.adjustedMdr !== undefined) {
      item.mdrRealAmount = Number(opts.adjustedMdr);
      item.differenceAmount = Math.round(Math.abs(item.mdrExpectedAmount - item.mdrRealAmount) * 100) / 100;
    }

    item.reconciliationStatus = opts.status || 'CONCILIADO';
    item.status = item.reconciliationStatus;
    item.reconciliationNotes = opts.notes || justification || 'Conciliado manualmente pelo Financeiro Disk';
    item.reconciledBy = opts.actor || auditorName || 'Carlos Lima';
    item.reconciledAt = new Date().toISOString();
    item.estimatedMdr = item.mdrExpectedAmount;
    item.actualMdr = item.mdrRealAmount;
    item.differenceMdr = item.differenceAmount;

    this.logAuditEvent({
      event: 'SETTLEMENT_RECONCILED',
      action: 'LIQUIDACAO_CONCILIADA',
      details: {
        transactionId,
        notes: item.reconciliationNotes,
        reconciledBy: item.reconciledBy
      },
      actor: item.reconciledBy
    });

    return item;
  },

  /**
   * Auditoria: Retorna trilha imutável de eventos (Implantação 5.4.21)
   */
  getAuditLog(filters = {}) {
    let list = [...AUDIT_LOG_STORE];
    if (filters.action) {
      list = list.filter(e => e.action === filters.action || e.event === filters.action);
    }
    if (filters.event) {
      list = list.filter(e => e.event === filters.event);
    }
    if (filters.actor) {
      list = list.filter(e => e.actor && e.actor.toLowerCase().includes(filters.actor.toLowerCase()));
    }
    return list;
  },

  /**
   * Auditoria: Registra evento na trilha imutável
   */
  logAuditEvent({ event, action, details, actor = 'Sistema' }) {
    const entry = {
      id: `AUD-${String(AUDIT_LOG_STORE.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      event,
      action: action || event,
      details,
      actor
    };
    AUDIT_LOG_STORE.unshift(entry);
    return entry;
  }
};

if (typeof window !== 'undefined') {
  window.gatewayFeeMatrixService = gatewayFeeMatrixService;
}
