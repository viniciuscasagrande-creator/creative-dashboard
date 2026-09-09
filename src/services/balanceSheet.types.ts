export interface FinancialPosition {
  cashAndBanks: number;
  gatewayReceivables: number;
  totalAvailability: number;
  thirdPartyFunds: number;
  pendingPayouts: number;
  taxesPayable: number;
  otherLiabilities: number;
  netFinancialPosition: number;
}

export interface BalanceSheetGroup {
  code: string;
  label: string;
  current: number;
  previous: number;
  children?: BalanceSheetGroup[];
}

export interface BalanceSheetData {
  referenceDate: string;
  comparisonDate: string;
  assets: BalanceSheetGroup[];
  liabilities: BalanceSheetGroup[];
  equity: BalanceSheetGroup[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}
