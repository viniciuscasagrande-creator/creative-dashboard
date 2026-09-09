export type ThirdPartyFunds = {
  total: number;
  awaitingSettlement: number;
  availableForPayout: number;
  scheduledPayout: number;
  blockedPayout: number;
  reconciling: number;
  divergent: number;
};

export type DiskRevenue = {
  total: number;
  convenienceFee: number;
  commission: number;
  services: number;
  other: number;
};

export type FinancialCosts = {
  gatewayFees: number;
  acquiringFees: number;
  antifraud: number;
  anticipation: number;
  other: number;
};

export type AccountingOverview = {
  period: {
    start: string;
    end: string;
    label: string;
  };
  grossTransactionValue: number;
  thirdPartyFunds: ThirdPartyFunds;
  diskRevenue: DiskRevenue;
  financialCosts: FinancialCosts;
  taxes: {
    provisioned: number;
    paid: number;
  };
  payouts: {
    pending: number;
    paid: number;
  };
  netRevenue: number;
  operatingResult: number;
  reconciliation: {
    rate: number;
    divergentItems: number;
    divergentAmount: number;
  };
};

export type AccountingOverviewFilter = {
  period?: 'hoje' | '7d' | '30d' | 'mes' | 'ano' | 'personalizado';
  producerId?: string | number;
  eventId?: string | number;
  gatewayId?: string;
  start?: string;
  end?: string;
};
