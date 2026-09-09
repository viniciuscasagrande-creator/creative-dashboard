export type ClosingStatus =
  | "ABERTO"
  | "EM_PREPARACAO"
  | "EM_VALIDACAO"
  | "COM_PENDENCIAS"
  | "AGUARDANDO_APROVACAO"
  | "FECHADO"
  | "REABERTO";

export type CheckSeverity =
  | "INFORMATIVA"
  | "ATENCAO"
  | "CRITICA"
  | "BLOQUEANTE";

export type CheckStatus =
  | "PENDENTE"
  | "VALIDANDO"
  | "APROVADO"
  | "DIVERGENTE"
  | "JUSTIFICADO";

export interface ClosingCheck {
  id: string;
  category: string;
  label: string;
  description?: string;
  severity: CheckSeverity;
  status: CheckStatus;
  source?: string;
  amount?: number;
}

export interface AccountingClosing {
  period: string;
  status: ClosingStatus;
  progress: number;
  responsible: string;
  dueDate?: string;
  closedAt?: string;
  totalChecks: number;
  approvedChecks: number;
  pendingChecks: number;
  criticalIssues: number;
  financialDivergence: number;
  accountingDivergence: number;
  checks: ClosingCheck[];
}
