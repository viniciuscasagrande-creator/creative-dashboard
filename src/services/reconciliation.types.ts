export type ReconciliationStatus =
  | "CONCILIADO"
  | "PENDENTE"
  | "DIVERGENTE"
  | "BLOQUEADO"
  | "EM_ANALISE"
  | "RESOLVIDO_MANUALMENTE";

export type DivergenceType =
  | "VALOR_GATEWAY"
  | "VALOR_BANCO"
  | "TAXA_GATEWAY"
  | "LIQUIDACAO_NAO_LOCALIZADA"
  | "PEDIDO_NAO_LOCALIZADO"
  | "TRANSACAO_DUPLICADA"
  | "SPLIT_DIVERGENTE"
  | "REPASSE_DIVERGENTE"
  | "ESTORNO_NAO_REFLETIDO"
  | "CHARGEBACK_NAO_REFLETIDO"
  | "RECEITA_DISK_DIVERGENTE"
  | "LANCAMENTO_CONTABIL_AUSENTE"
  | "LANCAMENTO_CONTABIL_DIVERGENTE";

export interface ReconciliationOverview {
  reconciliationRate: number;
  totalProcessed: number;
  totalReconciled: number;
  totalPending: number;
  totalDivergent: number;
  divergentAmount: number;
  chargebacks: number;
  refunds: number;
  duplicates: number;
  notFound: number;
  gatewayFeeDifferences: number;
  payoutDifferences: number;
}

export interface ReconciliationItem {
  id: string;
  orderId: string;
  eventName: string;
  producerName: string;
  gateway: string;
  transactionId: string;
  expectedAmount: number;
  settledAmount: number;
  differenceAmount: number;
  status: ReconciliationStatus;
  divergenceType?: DivergenceType;
  occurredAt: string;
}
