/**
 * Fase 26.17.9.5.6 — Tipos do Motor de Regras de Repasse e Prioridades Financeiras
 * SafeSaff / PDT (DiskIngressos)
 */

export type FinancialOperationType =
  | "PAYOUT"
  | "EVENT_TRANSFER"
  | "ADVANCE"
  | "EXPENSE"
  | "REVERSAL"
  | "MANUAL_ADJUSTMENT"
  | "RELEASE_BLOCK";

export type FinancialRuleDecision =
  | "ALLOW"
  | "ALLOW_WITH_APPROVAL"
  | "ALLOW_PARTIAL"
  | "HOLD"
  | "BLOCK";

export type PolicyScope = "GLOBAL" | "PRODUCER" | "EVENT";

export type ReserveRuleType = "GREATER_OF" | "FIXED" | "PERCENT";

export interface OperationalWindowConfig {
  enabled: boolean;
  startHour: number; // Ex: 8 (08:00)
  endHour: number;   // Ex: 18 (18:00)
  daysOfWeek: number[]; // 1 = Segunda, ..., 5 = Sexta
}

export interface FinancialPolicyConfig {
  id: string;
  name: string;
  scope: PolicyScope;
  targetId?: string; // producerId ou eventId quando scope != GLOBAL
  priority: number;  // 1 = Maior precedência
  minReserveFixed: number;
  minReservePercent: number;
  reserveRule: ReserveRuleType;
  maxReleasePercent: number;
  maxWithoutApproval: number;
  twoLevelApprovalThreshold: number;
  requireReconciliationDone: boolean;
  blockOnDivergence: boolean;
  blockOnCriticalChargeback: boolean;
  blockOnPendingCompliance: boolean;
  operationalWindow: OperationalWindowConfig;
  allowPartialPayout: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialPriorityItem {
  order: number;
  code: string;
  name: string;
  description: string;
  category: "BLOCK" | "RESERVE" | "FEE" | "PAYOUT" | "TRANSFER" | "EXPENSE" | "FREE";
  mandatory: boolean;
}

export interface FinancialException {
  id: string;
  scope: PolicyScope | "OPERATION";
  targetId?: string;
  operationType?: FinancialOperationType;
  ruleToBypass: "DIVERGENCIA_CONTABIL" | "RESERVA_MINIMA" | "JANELA_OPERACIONAL" | "CONCILIACAO_PENDENTE" | "CHARGEBACK_CRITICO" | "COMPLIANCE_PENDENTE";
  justification: string;
  approvedBy: string;
  actorRole: string;
  validUntil: string;
  createdAt: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  correlationId: string;
}

export interface FinancialRuleEvaluationInput {
  operationType: FinancialOperationType;
  producerId: string;
  eventId?: string;
  amount: number;
  actor?: {
    id?: string;
    name?: string;
    role?: string;
  };
  now?: Date | string;
}

export interface FinancialRuleEvaluation {
  decision: FinancialRuleDecision;
  maxAllowedAmount: number;
  reserveAmount: number;
  requiresApproval: boolean;
  approvalLevel?: string | null; // "NIVEL_1_FINANCEIRO" | "NIVEL_2_DIRETORIA" | null
  blockedReasons: string[];
  warnings: string[];
  appliedPolicies: Array<{ id: string; name: string; result: string }>;
  appliedExceptions?: Array<{ id: string; ruleToBypass: string; justification: string }>;
  correlationId: string;
  calculatedAt: string;
  input?: FinancialRuleEvaluationInput;
}

export interface FinancialRuleAuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: "EVALUATION" | "SIMULATION" | "POLICY_CREATE" | "POLICY_UPDATE" | "EXCEPTION_CREATE" | "EXCEPTION_REVOKE";
  operationType?: FinancialOperationType;
  producerId?: string;
  eventId?: string;
  amount?: number;
  decision?: FinancialRuleDecision;
  details: string;
  correlationId: string;
}
