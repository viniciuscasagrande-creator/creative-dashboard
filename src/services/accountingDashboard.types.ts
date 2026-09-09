export interface AccountingKpis {
  gmv: number;
  thirdPartyFunds: number;
  diskRevenue: number;
  gatewayFees: number;
  provisionedTaxes: number;
  producerPayouts: number;
  operatingResult: number;
  cashAndBanks: number;
}

export interface EvolutionPoint {
  label: string;
  diskRevenue: number;
  producerPayouts: number;
  gatewayFees: number;
  taxes: number;
  result: number;
}

export interface ThirdPartyBreakdown {
  total: number;
  awaitingSettlement: number;
  availableForPayout: number;
  scheduledPayout: number;
  blocked: number;
  inReconciliation: number;
  divergent: number;
}

export interface ReconciliationSummary {
  rate: number;
  reconciled: number;
  pending: number;
  divergent: number;
  notFound: number;
  duplicates: number;
  refunds: number;
  chargebacks: number;
}

export interface RevenueOrigin {
  label: string;
  amount: number;
  percentage: number;
}

export interface GatewaySummary {
  name: string;
  amount: number;
  percentage: number;
}

export interface UpcomingPayout {
  id: string;
  eventName: string;
  producerName: string;
  amount: number;
  date: string;
}

export interface DashboardInsight {
  id: string;
  type: "CRITICO" | "ATENCAO" | "FISCAL" | "OPORTUNIDADE" | "PREVISAO";
  title: string;
  occurredAt?: string;
}

export interface FeaturedEvent {
  id: string;
  eventName: string;
  producerName: string;
  gmv: number;
  diskRevenue: number;
  payout: number;
  reconciliationRate: number;
  status: string;
}

export interface AccountingHealth {
  score: number;
  closingProgress: number;
  balanceIntegrity: boolean;
  criticalIssues: number;
  complianceScore: number;
}

export interface AccountingDashboardData {
  kpis: AccountingKpis;
  evolution: EvolutionPoint[];
  thirdPartyFunds: ThirdPartyBreakdown;
  reconciliation: ReconciliationSummary;
  revenueOrigins: RevenueOrigin[];
  gateways: GatewaySummary[];
  upcomingPayouts: UpcomingPayout[];
  intelligence: DashboardInsight[];
  featuredEvents: FeaturedEvent[];
  health: AccountingHealth;
}
