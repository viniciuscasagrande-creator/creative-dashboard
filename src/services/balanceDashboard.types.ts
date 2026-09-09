/**
 * Fase 26.17.9.5.4 — Tipos do Dashboard Executivo de Gestão de Saldos
 */

export interface BalanceDashboardSummary {
  totalBalance: number;
  availableBalance: number;
  committedBalance: number;
  blockedBalance: number;
  pendingSettlement: number;
  deficitBalance: number;
}

export interface BalanceDashboardOperations {
  transfersCount: number;
  transferredAmount: number;
  pendingApprovals: number;
  reversalsCount: number;
  activeReservations: number;
  divergencesCount: number;
}

export interface BalanceDashboardRatios {
  availabilityRate: number;
  commitmentRate: number;
  blockedRate: number;
}

export interface BalanceDashboardAlert {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  eventId?: string;
  producerId?: string;
  impactedAmount?: number;
}

export interface BalanceDashboardResponse {
  calculatedAt: string;
  currency: string;
  summary: BalanceDashboardSummary;
  operations: BalanceDashboardOperations;
  ratios: BalanceDashboardRatios;
  charts: {
    composition: Array<{ label: string; value: number; color?: string }>;
    byEvent: Array<{ eventId: string; eventName: string; available: number; committed: number; blocked: number }>;
    scheduledPayouts: Array<{ date: string; amount: number; eventName: string }>;
  };
  alerts: BalanceDashboardAlert[];
  topEvents: Array<{ id: string; name: string; available: number; total: number }>;
}
