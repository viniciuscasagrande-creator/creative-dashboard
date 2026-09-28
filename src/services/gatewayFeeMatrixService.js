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

    // Filtra regras que estão em vigência para a data
    const activeRules = GATEWAY_RULES_STORE.filter(r => {
      if (!r.active) return false;
      const from = new Date(r.effectiveFrom);
      const to = r.effectiveTo ? new Date(r.effectiveTo) : null;
      if (from > targetDate) return false;
      if (to && to < targetDate) return false;
      return true;
    });

    // Ordem de especificidade:
    // 1. Regra específica do Evento (targetId === eventId)
    // 2. Regra específica do Produtor (targetId === producerId)
    // 3. Regra Global (scope === 'GLOBAL')
    const candidates = activeRules.filter(r => {
      const matchAcquirer = !r.acquirer || r.acquirer.toLowerCase() === acquirer.toLowerCase();
      const matchBrand = !r.brand || r.brand === 'Multi-Bandeiras' || r.brand.toLowerCase() === brand.toLowerCase();
      const matchModality = !r.modality || r.modality === modality;
      const matchChannel = !r.channel || r.channel === channel;
      return matchAcquirer && matchBrand && matchModality && matchChannel;
    });

    // Score de hierarquia
    const scored = candidates.map(r => {
      let score = 0;
      if (r.scope === 'EVENT' && String(r.targetId) === String(eventId)) score += 100;
      else if (r.scope === 'PRODUCER' && String(r.targetId) === String(producerId)) score += 50;
      else if (r.scope === 'GLOBAL') score += 10;
      if (r.brand && r.brand !== 'Multi-Bandeiras') score += 5;
      return { rule: r, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const resolved = scored[0]?.rule || null;

    if (!resolved) {
      // Fallback de segurança: Regra genérica padrão Disk
      return {
        scope: 'FALLBACK_GLOBAL',
        acquirer,
        brand,
        modality,
        acquirerMdr: 2.50,
        commercialFee: 2.99,
        fixedCost: 0.39,
        anticipationCost: 0.00,
        feeBearer: 'PRODUTOR',
        operationalSpread: 0.49,
        effectiveFrom: '2026-01-01'
      };
    }

    const operationalSpread = Math.round((resolved.commercialFee - resolved.acquirerMdr) * 100) / 100;
    return {
      ...resolved,
      operationalSpread
    };
  },

  /**
   * Simula a precificação exata de uma transação para o Checkout ou Fechamento
   */
  calculateTransactionPricing({ amount = 100, producerId = null, eventId = null, channel = 'ONLINE', acquirer = 'Cielo', brand = 'Visa', modality = 'CREDITO_3X' }) {
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
        break;
      case 'PRODUTOR':
        deductedFromProducer = commercialFeeAmount;
        break;
      case 'DISK':
        absorbedByDisk = acquirerCostMdr;
        break;
      case 'DIVIDIDO':
        chargedFromCustomer = Math.round((commercialFeeAmount / 2) * 100) / 100;
        deductedFromProducer = Math.round((commercialFeeAmount - chargedFromCustomer) * 100) / 100;
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

    return existing;
  },

  /**
   * Cria nova regra (Global, Produtor ou Evento)
   */
  createRule(newRuleData) {
    const id = `RULE-${(newRuleData.acquirer || 'ACQ').toUpperCase()}-${(newRuleData.brand || 'ALL').toUpperCase()}-${Date.now()}`;
    const rule = {
      id,
      scope: newRuleData.scope || 'GLOBAL',
      targetId: newRuleData.targetId || null,
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
      active: true,
      history: [
        { version: 1, effectiveFrom: newRuleData.effectiveFrom || new Date().toISOString().slice(0, 10), acquirerMdr: newRuleData.acquirerMdr, commercialFee: newRuleData.commercialFee, actor: newRuleData.actor || 'Administrador', reason: newRuleData.reason || 'Criação inicial da regra' }
      ]
    };

    GATEWAY_RULES_STORE.push(rule);
    return rule;
  }
};

if (typeof window !== 'undefined') {
  window.gatewayFeeMatrixService = gatewayFeeMatrixService;
}
