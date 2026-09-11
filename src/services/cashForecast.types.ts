export type ForecastRiskStatus =
  | "NORMAL"
  | "ATENCAO"
  | "CRITICO"
  | "DEFICIT_PROJETADO";

export interface ForecastTimelinePoint {
  date: string;
  inflows: number;
  outflows: number;
  projectedBalance: number;
}

export interface CoverageSuggestion {
  sourceEventId: string;
  sourceEventName: string;
  availableBalance: number;
  projectedBalanceAfterCoverage: number;
  suggestedAmount: number;
  riskAfterCoverage: ForecastRiskStatus;
}

export interface EventCashForecast {
  calculatedAt: string;
  eventId: string;
  eventName?: string;
  producerId: string;
  currency: string;
  current: {
    availableBalance: number;
    committedBalance: number;
    blockedBalance: number;
  };
  forecast: {
    expectedInflows: number;
    expectedOutflows: number;
    projectedBalance: number;
    minimumProjectedBalance: number;
    minimumProjectedDate?: string;
    riskStatus: ForecastRiskStatus;
  };
  timeline: ForecastTimelinePoint[];
  coverage: {
    requiredAmount: number;
    suggestions: CoverageSuggestion[];
  };
}
