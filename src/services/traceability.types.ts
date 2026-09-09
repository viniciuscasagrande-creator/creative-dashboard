export type TraceStatus =
  | "PENDENTE"
  | "PROCESSANDO"
  | "CONCLUIDO"
  | "DIVERGENTE"
  | "BLOQUEADO"
  | "ESTORNADO";

export interface TimelineEvent {
  id: string;
  label: string;
  occurredAt: string;
  status: TraceStatus;
  source: string;
  referenceId?: string;
  amount?: number;
  description?: string;
}

export interface AccountingEntry {
  id: string;
  occurredAt: string;
  debitAccount: string;
  debitAccountName: string;
  creditAccount: string;
  creditAccountName: string;
  history: string;
  documentReference: string;
  costCenter?: string;
  eventName?: string;
  producerName?: string;
  amount: number;
  status: "PENDENTE" | "POSTADO" | "CONCILIADO" | "ESTORNADO";
}

export interface FinancialComposition {
  ticketFaceValue: number;
  convenienceFee: number;
  discounts: number;
  additions: number;
  totalPaid: number;
  gatewayFee: number;
  acquiringFee: number;
  antifraudFee: number;
  anticipationFee: number;
  diskRevenue: number;
  producerAmount: number;
  taxes: number;
  netAmount: number;
}

export interface TraceabilityData {
  orderId: string;
  createdAt: string;
  eventName: string;
  producerName: string;
  customerName?: string;
  paymentMethod: string;
  gateway: string;
  transactionId: string;
  financialStatus: string;
  reconciliationStatus: string;
  accountingStatus: string;
  composition: FinancialComposition;
  timeline: TimelineEvent[];
  accountingEntries: AccountingEntry[];
}
