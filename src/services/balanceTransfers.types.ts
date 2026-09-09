/**
 * Fase 26.17.9.5 — Definições de Tipos para Transferência entre Eventos
 */

export type BalanceTransferStatus =
  | "PENDENTE"
  | "EM_APROVACAO"
  | "PROCESSANDO"
  | "CONCLUIDA"
  | "REJEITADA"
  | "CANCELADA"
  | "ESTORNADA";

export interface EventFinancialBalance {
  eventId: string;
  eventName: string;
  producerId: string;
  producerName: string;
  totalBalance: number;
  availableBalance: number;
  committedBalance: number;
  blockedBalance: number;
  pendingSettlement: number;
  updatedAt?: string;
  status?: string;
}

export interface BalanceTransfer {
  id: string;
  producerId: string;
  producerName?: string;
  sourceEventId: string;
  sourceEventName?: string;
  targetEventId: string;
  targetEventName?: string;
  amount: number;
  reason: string;
  notes?: string;
  costCenter?: string;
  status: BalanceTransferStatus;
  requestedBy: string;
  approvedBy?: string;
  createdAt: string;
  processedAt?: string;
  reversedTransferId?: string;
  correlationId: string;
  sourceBefore?: number;
  sourceAfter?: number;
  targetBefore?: number;
  targetAfter?: number;
  producerTotalBefore?: number;
  producerTotalAfter?: number;
}

export interface BalanceTransferRequest {
  sourceEventId: string;
  targetEventId: string;
  amount: number;
  reason: string;
  notes?: string;
  costCenter?: string;
  idempotencyKey?: string;
}
