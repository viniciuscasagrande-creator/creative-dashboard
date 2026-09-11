/**
 * Fase 26.17.9.5.6 — Motor Central de Regras de Repasse e Prioridades Financeiras
 * SafeSaff / PDT (DiskIngressos)
 * 
 * Implementa:
 * - Avaliação de 5 Respostas: ALLOW, ALLOW_WITH_APPROVAL, ALLOW_PARTIAL, HOLD, BLOCK
 * - Políticas dinâmicas sem hardcode (Global, por Produtor e por Evento)
 * - Cálculo de Reservas Mínimas (FIXED, PERCENT, GREATER_OF)
 * - Ordem canônica e configurável de 9 Prioridades Financeiras
 * - Alçadas de Aprovação (Nível 1 Financeiro e Nível 2 Diretoria)
 * - Janelas operacionais de processamento
 * - Checagens de integridade contábil, conciliação e compliance
 * - Sistema de Exceções Temporárias Auditáveis
 * - Simulador de Regras Financeiras sem movimentação
 * - Trilha de Auditoria Append-Only Imutável com correlationId
 */

import { eventBalanceGateway } from './eventBalanceGateway.js';
import { eventBalanceService } from './eventBalanceService.js';

/**
 * 9 Prioridades Financeiras Oficiais (docs/02_PRIORIDADES_FINANCEIRAS.md)
 */
export const INITIAL_PRIORITIES = [
  {
    order: 1,
    code: 'LEGAL_COMPLIANCE_BLOCKS',
    name: 'Bloqueios Legais, Judiciais e Compliance',
    description: 'Bloqueios judiciais, cautelares fiscais e retenções de compliance regulatório.',
    category: 'BLOCK',
    mandatory: true
  },
  {
    order: 2,
    code: 'CHARGEBACKS_REFUNDS_RESERVE',
    name: 'Chargebacks e Estornos Retidos',
    description: 'Fundo garantidor e retenções preventivas para contestações de cartões e estornos.',
    category: 'RESERVE',
    mandatory: true
  },
  {
    order: 3,
    code: 'CONTRACTUAL_MINIMUM_RESERVES',
    name: 'Reservas Mínimas Contratuais',
    description: 'Buffer de segurança operacional contratual fixo ou percentual por evento/produtor.',
    category: 'RESERVE',
    mandatory: true
  },
  {
    order: 4,
    code: 'FEES_GATEWAY_MDR',
    name: 'Taxas DiskIngressos e Tarifas MDR de Gateways',
    description: 'Tarifas de processamento adquirente, antifraude e taxa de conveniência da plataforma.',
    category: 'FEE',
    mandatory: true
  },
  {
    order: 5,
    code: 'APPROVED_PAYOUTS',
    name: 'Repasses Programados e Aprovados',
    description: 'Repasses já homologados em agenda financeira aguardando liquidação bancária.',
    category: 'PAYOUT',
    mandatory: false
  },
  {
    order: 6,
    code: 'ADVANCES_AMORTIZATION',
    name: 'Amortizações de Antecipações',
    description: 'Abatimento de valores de antecipações de recebíveis concedidas anteriormente.',
    category: 'RESERVE',
    mandatory: false
  },
  {
    order: 7,
    code: 'EVENT_TRANSFERS',
    name: 'Transferências entre Eventos do Produtor',
    description: 'Remanejamento de caixa entre eventos do mesmo titular com preservação de saldo.',
    category: 'TRANSFER',
    mandatory: false
  },
  {
    order: 8,
    code: 'CRITICAL_EXPENSES',
    name: 'Despesas Operacionais Críticas',
    description: 'Pagamento de fornecedores prioritários, cachês, ECAD e estrutura essencial do evento.',
    category: 'EXPENSE',
    mandatory: false
  },
  {
    order: 9,
    code: 'GENERAL_EXPENSES_FREE_BALANCE',
    name: 'Demais Despesas e Saldo Livre',
    description: 'Saldo livre remanescente disponível para novas transferências, repasses ou alocações.',
    category: 'FREE',
    mandatory: false
  }
];

/**
 * Políticas Iniciais Configuráveis (docs/03_POLITICA_REPASSE.md & docs/04_RESERVAS_MINIMAS.md)
 */
export const INITIAL_POLICIES = [
  {
    id: 'POL-GLOBAL-DEFAULT',
    name: 'Política Financeira Global DiskIngressos',
    scope: 'GLOBAL',
    targetId: null,
    priority: 100, // Menor precedência que políticas específicas
    minReserveFixed: 1500.00,
    minReservePercent: 10.0, // 10%
    reserveRule: 'GREATER_OF',
    maxReleasePercent: 90.0, // Máximo 90% do saldo liquidado
    maxWithoutApproval: 10000.00, // Acima de 10k exige alçada Nível 1
    twoLevelApprovalThreshold: 50000.00, // Acima de 50k exige alçada Nível 2 (Diretoria)
    requireReconciliationDone: true,
    blockOnDivergence: true,
    blockOnCriticalChargeback: false,
    blockOnPendingCompliance: true,
    operationalWindow: {
      enabled: true,
      startHour: 8,  // 08:00
      endHour: 18,   // 18:00
      daysOfWeek: [1, 2, 3, 4, 5] // Seg a Sex
    },
    allowPartialPayout: true,
    active: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-10T12:00:00.000Z'
  },
  {
    id: 'POL-PROD-CWB',
    name: 'Política Especial Produtor CWB Brasil',
    scope: 'PRODUCER',
    targetId: 'prod-2',
    priority: 50,
    minReserveFixed: 3000.00,
    minReservePercent: 12.0,
    reserveRule: 'GREATER_OF',
    maxReleasePercent: 85.0,
    maxWithoutApproval: 15000.00,
    twoLevelApprovalThreshold: 75000.00,
    requireReconciliationDone: true,
    blockOnDivergence: true,
    blockOnCriticalChargeback: false,
    blockOnPendingCompliance: true,
    operationalWindow: {
      enabled: true,
      startHour: 8,
      endHour: 18,
      daysOfWeek: [1, 2, 3, 4, 5]
    },
    allowPartialPayout: true,
    active: true,
    createdAt: '2026-09-05T00:00:00.000Z',
    updatedAt: '2026-09-10T12:00:00.000Z'
  },
  {
    id: 'POL-EV-3042',
    name: 'Política Específica Festival Rock Curitiba 2026',
    scope: 'EVENT',
    targetId: '3042',
    priority: 10, // Maior precedência para o evento 3042
    minReserveFixed: 5000.00,
    minReservePercent: 15.0,
    reserveRule: 'GREATER_OF',
    maxReleasePercent: 80.0,
    maxWithoutApproval: 20000.00,
    twoLevelApprovalThreshold: 100000.00,
    requireReconciliationDone: true,
    blockOnDivergence: true,
    blockOnCriticalChargeback: false,
    blockOnPendingCompliance: true,
    operationalWindow: {
      enabled: true,
      startHour: 7,
      endHour: 19,
      daysOfWeek: [1, 2, 3, 4, 5]
    },
    allowPartialPayout: true,
    active: true,
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-10T12:00:00.000Z'
  }
];

/**
 * Armazenamento Local Integrado e Reativo
 */
let LOCAL_POLICIES = JSON.parse(JSON.stringify(INITIAL_POLICIES));
let LOCAL_PRIORITIES = JSON.parse(JSON.stringify(INITIAL_PRIORITIES));
let LOCAL_EXCEPTIONS = [];
let LOCAL_RULES_AUDIT = [];

function generateCorrelationId(prefix = 'CORR') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

/**
 * Gera log de auditoria append-only
 */
function recordAudit({
  actor = 'Sistema Financeiro',
  actorRole = 'CONTROLADORIA',
  action,
  operationType,
  producerId,
  eventId,
  amount,
  decision,
  details,
  correlationId
}) {
  const record = {
    id: `AUD-RUL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    actor,
    actorRole,
    action,
    operationType,
    producerId,
    eventId,
    amount: amount !== undefined ? Number(amount) : undefined,
    decision,
    details,
    correlationId: correlationId || generateCorrelationId('AUD')
  };
  LOCAL_RULES_AUDIT.unshift(record);
  return record;
}

/**
 * Motor Central de Decisão e Regras Financeiras (financialRulesEngine)
 */
export const financialRulesEngine = {
  /**
   * Obtém as políticas aplicáveis para um contexto, ordenadas por precedência
   */
  findApplicablePolicies({ producerId, eventId }) {
    const applicable = LOCAL_POLICIES.filter(policy => {
      if (!policy.active) return false;
      if (policy.scope === 'GLOBAL') return true;
      if (policy.scope === 'PRODUCER' && policy.targetId === producerId) return true;
      if (policy.scope === 'EVENT' && String(policy.targetId) === String(eventId)) return true;
      return false;
    });

    // Ordena: menor prioridade numérica = maior precedência
    return applicable.sort((a, b) => a.priority - b.priority);
  },

  /**
   * Busca exceções ativas vigentes para a operação/regra
   */
  findActiveExceptions({ producerId, eventId, operationType, now = new Date() }) {
    const nowDate = new Date(now);
    return LOCAL_EXCEPTIONS.filter(exc => {
      if (exc.status !== 'ACTIVE') return false;
      if (new Date(exc.validUntil) < nowDate) {
        exc.status = 'EXPIRED';
        return false;
      }
      if (exc.operationType && exc.operationType !== operationType) return false;
      if (exc.scope === 'GLOBAL') return true;
      if (exc.scope === 'PRODUCER' && exc.targetId === producerId) return true;
      if (exc.scope === 'EVENT' && String(exc.targetId) === String(eventId)) return true;
      return true;
    });
  },

  /**
   * Valida permissões RBAC para avaliação/aprovação
   */
  assertRbac(actor, operationType) {
    if (!actor) return { allowed: true, role: 'OPERADOR_FINANCEIRO' };

    const role = (actor.role || 'OPERADOR_FINANCEIRO').toUpperCase();
    const authorizedRoles = ['ADMIN', 'DIRETORIA', 'CONTROLADORIA', 'GERENTE_FINANCEIRO', 'ANALISTA_FINANCEIRO', 'OPERADOR_FINANCEIRO', 'OPERADOR', 'PRODUTOR', 'SISTEMA', 'CHECKER', 'CHECKER_DIRETORIA', 'BANCO'];

    if (!authorizedRoles.includes(role)) {
      throw new Error(`Acesso negado: Perfil "${role}" não possui autorização para operar o motor financeiro.`);
    }

    return { allowed: true, role };
  },

  /**
   * Constrói o contexto financeiro real a partir dos saldos do evento
   */
  async buildFinancialContext({ producerId, eventId }) {
    if (!eventId) {
      // Se não houver eventId específico, soma saldos dos eventos do produtor
      const allEventsRes = await eventBalanceService.getEvents(producerId);
      const events = allEventsRes.data || [];
      const settledBase = events.reduce((acc, ev) => acc + Number(ev.balances?.settledAmount || ev.balances?.settledBase || 0), 0);
      const availableBalance = events.reduce((acc, ev) => acc + Number(ev.balances?.availableBalance || 0), 0);
      const committed = events.reduce((acc, ev) => acc + Number(ev.balances?.committedBalance || 0), 0);
      const blocked = events.reduce((acc, ev) => acc + Number(ev.balances?.blockedBalance || 0), 0);
      const isBalanced = events.every(ev => ev.integrity?.isBalanced);
      const criticalDivergences = events.reduce((acc, ev) => acc + Number(ev.blocks?.criticalDivergences || ev.balances?.divergencesBlocked || 0), 0);
      const chargebacks = events.reduce((acc, ev) => acc + Number(ev.blocks?.chargebacks || ev.balances?.chargebacksBlocked || 0), 0);
      const refunds = events.reduce((acc, ev) => acc + Number(ev.blocks?.refunds || ev.balances?.refundsBlocked || 0), 0);
      const complianceBlocks = events.reduce((acc, ev) => acc + Number(ev.blocks?.compliance || ev.balances?.complianceBlocked || 0), 0);

      return {
        producerId,
        eventId: null,
        eventName: 'Consolidado Produtor',
        availableBalance,
        settledBase,
        committed,
        blocked,
        isBalanced,
        criticalDivergences,
        chargebacks,
        refunds,
        complianceBlocks,
        reconciliationCompleted: true
      };
    }

    const eventBalRes = await eventBalanceService.getEventBalance(eventId);
    if (!eventBalRes.ok || !eventBalRes.data) {
      throw new Error(`Evento "${eventId}" não encontrado no sistema financeiro.`);
    }

    const ev = eventBalRes.data;
    return {
      producerId: ev.producerId,
      eventId: String(ev.eventId),
      eventName: ev.eventName,
      availableBalance: Number(ev.balances?.availableBalance || 0),
      settledBase: Number(ev.balances?.settledAmount || ev.balances?.settledBase || 0),
      committed: Number(ev.balances?.committedBalance || 0),
      blocked: Number(ev.balances?.blockedBalance || 0),
      isBalanced: Boolean(ev.integrity?.isBalanced ?? true),
      criticalDivergences: Number(ev.blocks?.criticalDivergences || ev.balances?.divergencesBlocked || 0),
      chargebacks: Number(ev.blocks?.chargebacks || ev.balances?.chargebacksBlocked || 0),
      refunds: Number(ev.blocks?.refunds || ev.balances?.refundsBlocked || 0),
      complianceBlocks: Number(ev.blocks?.compliance || ev.balances?.complianceBlocked || 0),
      reconciliationCompleted: Boolean(ev.integrity?.isBalanced ?? true)
    };
  },

  /**
   * Avalia uma operação financeira contra o conjunto de regras
   * Retorna uma das 5 decisões: ALLOW, ALLOW_WITH_APPROVAL, ALLOW_PARTIAL, HOLD, BLOCK
   */
  async evaluateFinancialOperation(input, { isSimulation = false } = {}) {
    const {
      operationType = 'PAYOUT',
      producerId,
      eventId,
      amount = 0,
      actor = { id: 'usr-default', name: 'Operador Financeiro', role: 'OPERADOR_FINANCEIRO' },
      now = new Date()
    } = input;

    const reqAmount = Number(amount) || 0;
    const correlationId = generateCorrelationId(isSimulation ? 'SIM' : 'EVAL');
    const nowDate = new Date(now);

    // 1. RBAC check
    this.assertRbac(actor, operationType);

    // 2. Políticas e Exceções aplicáveis
    const policies = this.findApplicablePolicies({ producerId, eventId });
    if (policies.length === 0) {
      throw new Error("Nenhuma política financeira aplicável ativa encontrada para este produtor/evento.");
    }

    const exceptions = this.findActiveExceptions({ producerId, eventId, operationType, now: nowDate });

    // 3. Constrói contexto financeiro real
    const context = await this.buildFinancialContext({ producerId, eventId });

    let decision = "ALLOW";
    let maxAllowedAmount = context.availableBalance;
    let reserveAmount = 0;
    let requiresApproval = false;
    let approvalLevel = null;
    let holdReason = null;
    const blockedReasons = [];
    const warnings = [];
    const appliedPolicies = [];
    const appliedExceptions = [];

    // Helper para checar se regra foi contornada por exceção
    const hasExceptionFor = (ruleKey) => {
      const exc = exceptions.find(e => e.ruleToBypass === ruleKey);
      if (exc) {
        appliedExceptions.push({ id: exc.id, ruleToBypass: exc.ruleToBypass, justification: exc.justification });
        return true;
      }
      return false;
    };

    // 4. Itera pelas políticas (da mais prioritária para a menos prioritária)
    for (const policy of policies) {
      let policyResult = "PASS";

      // A) Janela Operacional (Gera HOLD)
      if (policy.operationalWindow && policy.operationalWindow.enabled) {
        const dayOfWeek = nowDate.getDay(); // 0 = Domingo, 6 = Sábado
        const hour = nowDate.getHours();

        const isAllowedDay = policy.operationalWindow.daysOfWeek.includes(dayOfWeek);
        const isAllowedHour = hour >= policy.operationalWindow.startHour && hour < policy.operationalWindow.endHour;

        if ((!isAllowedDay || !isAllowedHour) && !hasExceptionFor('JANELA_OPERACIONAL')) {
          decision = (decision === 'BLOCK') ? 'BLOCK' : 'HOLD';
          holdReason = `Operação fora da janela bancária autorizada (${policy.operationalWindow.startHour}:00h às ${policy.operationalWindow.endHour}:00h em dias úteis). Agendada para retenção temporária.`;
          warnings.push(holdReason);
          policyResult = "HOLD_WINDOW";
        }
      }

      // B) Conciliação pendente (Gera HOLD ou BLOCK)
      if (policy.requireReconciliationDone && !context.reconciliationCompleted) {
        if (!hasExceptionFor('CONCILIACAO_PENDENTE')) {
          decision = (decision === 'BLOCK') ? 'BLOCK' : 'HOLD';
          const msg = "Aguardando conclusão da conciliação bancária do lote diário.";
          holdReason = holdReason || msg;
          warnings.push(msg);
          policyResult = "HOLD_RECONCILIATION";
        }
      }

      // C) Divergência contábil no evento (Gera BLOCK estrito)
      if (policy.blockOnDivergence && !context.isBalanced) {
        if (!hasExceptionFor('DIVERGENCIA_CONTABIL')) {
          decision = "BLOCK";
          blockedReasons.push("Divergência contábil ativa no evento. Bloqueio preventivo conforme política financeira.");
          policyResult = "BLOCK_DIVERGENCE";
        }
      }

      // D) Chargeback crítico (Gera BLOCK se não contornado)
      if (policy.blockOnCriticalChargeback && context.chargebacks > 0) {
        if (!hasExceptionFor('CHARGEBACK_CRITICO')) {
          decision = "BLOCK";
          blockedReasons.push(`Existe volume retido de chargeback em contestação (R$ ${context.chargebacks.toFixed(2)}). Operação bloqueada.`);
          policyResult = "BLOCK_CHARGEBACK";
        }
      }

      // E) Compliance / Documentação pendente
      if (policy.blockOnPendingCompliance && context.complianceBlocks > 0) {
        if (!hasExceptionFor('COMPLIANCE_PENDENTE')) {
          decision = "BLOCK";
          blockedReasons.push(`Existem bloqueios de compliance regulatório ou documentação pendente (R$ ${context.complianceBlocks.toFixed(2)}).`);
          policyResult = "BLOCK_COMPLIANCE";
        }
      }

      // F) Cálculo de Reserva Mínima Contratual
      let currentPolicyReserve = 0;
      if (!hasExceptionFor('RESERVA_MINIMA')) {
        const fixedRes = policy.minReserveFixed || 0;
        const percentRes = Number((context.settledBase * ((policy.minReservePercent || 0) / 100)).toFixed(2));

        if (policy.reserveRule === 'FIXED') {
          currentPolicyReserve = fixedRes;
        } else if (policy.reserveRule === 'PERCENT') {
          currentPolicyReserve = percentRes;
        } else {
          // 'GREATER_OF'
          currentPolicyReserve = Math.max(fixedRes, percentRes);
        }
      }
      reserveAmount = Math.max(reserveAmount, currentPolicyReserve);

      // G) Percentual Máximo Liberável
      if (policy.maxReleasePercent && policy.maxReleasePercent < 100) {
        const maxByPercent = Number((context.settledBase * (policy.maxReleasePercent / 100)).toFixed(2));
        maxAllowedAmount = Math.min(maxAllowedAmount, maxByPercent);
      }

      // H) Alçadas de Aprovação (avaliadas com base na política de maior precedência)
      if (policy.id === policies[0].id) {
        if (reqAmount > policy.twoLevelApprovalThreshold) {
          requiresApproval = true;
          approvalLevel = 'NIVEL_2_DIRETORIA';
        } else if (reqAmount > policy.maxWithoutApproval) {
          requiresApproval = true;
          approvalLevel = 'NIVEL_1_FINANCEIRO';
        }
      }

      appliedPolicies.push({
        id: policy.id,
        name: policy.name,
        result: policyResult
      });
    }

    // 5. Capacidade Líquida Liberável (deduzindo a reserva mínima do limite permitido)
    const netCapacity = Number(Math.max(0, maxAllowedAmount - reserveAmount).toFixed(2));

    // 6. Decisão Final baseada em saldo e alçadas
    if (!['BLOCK', 'HOLD'].includes(decision)) {
      if (reqAmount <= 0) {
        decision = "BLOCK";
        blockedReasons.push("O valor da operação deve ser maior que R$ 0,00.");
      } else if (reqAmount > netCapacity) {
        // Excede a capacidade líquida disponível
        const allowsPartial = policies.some(p => p.allowPartialPayout);
        if (netCapacity > 0 && allowsPartial) {
          decision = "ALLOW_PARTIAL";
          warnings.push(`Valor solicitado (R$ ${reqAmount.toFixed(2)}) excede a capacidade líquida liberável após reservas mínimas. Liberado parcialmente R$ ${netCapacity.toFixed(2)}.`);
          maxAllowedAmount = netCapacity;
        } else {
          decision = "BLOCK";
          blockedReasons.push(`Saldo insuficiente após dedução das reservas mínimas. Capacidade líquida: R$ ${netCapacity.toFixed(2)}, Solicitado: R$ ${reqAmount.toFixed(2)}.`);
        }
      } else if (requiresApproval) {
        decision = "ALLOW_WITH_APPROVAL";
      } else {
        decision = "ALLOW";
      }
    }

    maxAllowedAmount = netCapacity;

    const evaluation = {
      decision,
      maxAllowedAmount,
      reserveAmount,
      requiresApproval,
      approvalLevel,
      blockedReasons,
      warnings,
      appliedPolicies,
      appliedExceptions: appliedExceptions.length > 0 ? appliedExceptions : undefined,
      correlationId,
      calculatedAt: new Date().toISOString(),
      input: {
        operationType,
        producerId,
        eventId,
        amount: reqAmount
      }
    };

    // 7. Registro de Auditoria Append-Only
    recordAudit({
      actor: actor.name || 'Operador Financeiro',
      actorRole: actor.role || 'CONTROLADORIA',
      action: isSimulation ? 'SIMULATION' : 'EVALUATION',
      operationType,
      producerId,
      eventId,
      amount: reqAmount,
      decision,
      details: `Avaliação do motor concluída: Decisão=${decision}, Máximo=${maxAllowedAmount}, Reserva=${reserveAmount}, Alçada=${approvalLevel || 'AUTOMATICA'}.`,
      correlationId
    });

    return evaluation;
  },

  /**
   * Simulação de Regras Financeiras (sem efetuar movimentação no ledger)
   */
  async simulateFinancialOperation(input) {
    return this.evaluateFinancialOperation(input, { isSimulation: true });
  },

  /**
   * CRUD de Políticas
   */
  getPolicies() {
    return JSON.parse(JSON.stringify(LOCAL_POLICIES));
  },

  getPolicyById(id) {
    return LOCAL_POLICIES.find(p => p.id === id) || null;
  },

  createPolicy(policyData, actor = { name: 'Admin Financeiro', role: 'DIRETORIA' }) {
    if (!policyData.name || policyData.name.trim().length < 3) {
      throw new Error("O nome da política é obrigatório (mínimo 3 caracteres).");
    }

    const newPolicy = {
      id: policyData.id || `POL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      name: policyData.name.trim(),
      scope: policyData.scope || 'GLOBAL',
      targetId: policyData.targetId || null,
      priority: Number(policyData.priority) || 50,
      minReserveFixed: Number(policyData.minReserveFixed) || 0,
      minReservePercent: Number(policyData.minReservePercent) || 0,
      reserveRule: policyData.reserveRule || 'GREATER_OF',
      maxReleasePercent: Number(policyData.maxReleasePercent) || 100,
      maxWithoutApproval: Number(policyData.maxWithoutApproval) || 10000,
      twoLevelApprovalThreshold: Number(policyData.twoLevelApprovalThreshold) || 50000,
      requireReconciliationDone: Boolean(policyData.requireReconciliationDone),
      blockOnDivergence: Boolean(policyData.blockOnDivergence),
      blockOnCriticalChargeback: Boolean(policyData.blockOnCriticalChargeback),
      blockOnPendingCompliance: Boolean(policyData.blockOnPendingCompliance),
      operationalWindow: policyData.operationalWindow || {
        enabled: true,
        startHour: 8,
        endHour: 18,
        daysOfWeek: [1, 2, 3, 4, 5]
      },
      allowPartialPayout: policyData.allowPartialPayout !== false,
      active: policyData.active !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    LOCAL_POLICIES.push(newPolicy);

    recordAudit({
      actor: actor.name,
      actorRole: actor.role,
      action: 'POLICY_CREATE',
      details: `Política "${newPolicy.name}" (${newPolicy.id}) criada com escopo ${newPolicy.scope}.`
    });

    return newPolicy;
  },

  updatePolicy(id, updates, actor = { name: 'Admin Financeiro', role: 'DIRETORIA' }) {
    const policy = LOCAL_POLICIES.find(p => p.id === id);
    if (!policy) throw new Error(`Política "${id}" não encontrada.`);

    Object.assign(policy, updates, { updatedAt: new Date().toISOString() });

    recordAudit({
      actor: actor.name,
      actorRole: actor.role,
      action: 'POLICY_UPDATE',
      details: `Política "${policy.name}" (${id}) atualizada.`
    });

    return policy;
  },

  /**
   * Gestão de Prioridades Financeiras
   */
  getPriorities() {
    return JSON.parse(JSON.stringify(LOCAL_PRIORITIES.sort((a, b) => a.order - b.order)));
  },

  updatePriorities(newPriorities, actor = { name: 'Diretoria Financeira', role: 'DIRETORIA' }) {
    if (!Array.isArray(newPriorities) || newPriorities.length !== 9) {
      throw new Error("As 9 prioridades financeiras devem ser fornecidas para reordenação.");
    }

    LOCAL_PRIORITIES = JSON.parse(JSON.stringify(newPriorities));

    recordAudit({
      actor: actor.name,
      actorRole: actor.role,
      action: 'POLICY_UPDATE',
      details: `Ordem das 9 prioridades financeiras atualizada e persistida.`
    });

    return LOCAL_PRIORITIES;
  },

  /**
   * Gestão de Exceções Auditáveis
   */
  getExceptions() {
    return JSON.parse(JSON.stringify(LOCAL_EXCEPTIONS));
  },

  createException({
    scope = 'GLOBAL',
    targetId,
    operationType,
    ruleToBypass,
    justification,
    approvedBy = 'Controladoria Financeira',
    actorRole = 'CONTROLADORIA',
    validUntil
  }) {
    if (!justification || justification.trim().length < 5) {
      throw new Error("Justificativa formal é obrigatória para cadastro de exceção (mínimo 5 caracteres).");
    }
    if (!ruleToBypass) {
      throw new Error("A regra a ser contornada deve ser informada.");
    }
    if (!validUntil) {
      throw new Error("Data de expiração da vigência da exceção é obrigatória.");
    }

    const validDate = new Date(validUntil);
    if (validDate <= new Date()) {
      throw new Error("A vigência da exceção deve expirar no futuro.");
    }

    const exception = {
      id: `EXC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      scope,
      targetId: targetId || null,
      operationType: operationType || null,
      ruleToBypass,
      justification: justification.trim(),
      approvedBy,
      actorRole,
      validUntil: validDate.toISOString(),
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      correlationId: generateCorrelationId('EXC')
    };

    LOCAL_EXCEPTIONS.push(exception);

    recordAudit({
      actor: approvedBy,
      actorRole,
      action: 'EXCEPTION_CREATE',
      operationType,
      producerId: scope === 'PRODUCER' ? targetId : undefined,
      eventId: scope === 'EVENT' ? targetId : undefined,
      details: `Exceção criada para contornar "${ruleToBypass}". Justificativa: ${justification}. Vigência até ${validUntil}.`,
      correlationId: exception.correlationId
    });

    return exception;
  },

  revokeException(id, actor = { name: 'Controladoria', role: 'CONTROLADORIA' }) {
    const exc = LOCAL_EXCEPTIONS.find(e => e.id === id);
    if (!exc) throw new Error("Exceção não encontrada.");

    exc.status = 'REVOKED';

    recordAudit({
      actor: actor.name,
      actorRole: actor.role,
      action: 'EXCEPTION_REVOKE',
      details: `Exceção "${id}" revogada manualmente.`
    });

    return exc;
  },

  /**
   * Consulta a Trilha de Auditoria
   */
  getAuditLog() {
    return JSON.parse(JSON.stringify(LOCAL_RULES_AUDIT));
  },

  /**
   * Reset para testes unitários automatizados
   */
  resetToInitialState() {
    LOCAL_POLICIES = JSON.parse(JSON.stringify(INITIAL_POLICIES));
    LOCAL_PRIORITIES = JSON.parse(JSON.stringify(INITIAL_PRIORITIES));
    LOCAL_EXCEPTIONS = [];
    LOCAL_RULES_AUDIT = [];
  }
};

/**
 * Serviços exportados para consumo na UI e testes
 */
export const evaluateFinancialOperation = (input) => financialRulesEngine.evaluateFinancialOperation(input);
export const simulateFinancialOperation = (input) => financialRulesEngine.simulateFinancialOperation(input);
export const getFinancialPolicies = () => financialRulesEngine.getPolicies();
export const getFinancialPriorities = () => financialRulesEngine.getPriorities();
export const getFinancialExceptions = () => financialRulesEngine.getExceptions();
export const getFinancialRulesAuditLog = () => financialRulesEngine.getAuditLog();
export const createFinancialException = (data) => financialRulesEngine.createException(data);
