/**
 * Fase 26.17.9.5.2 — Tipos para Transferência com Aprovação e Reserva de Saldo
 */

export type TransferStatus =
  | "PENDENTE"
  | "EM_APROVACAO"
  | "APROVADA"
  | "PROCESSANDO"
  | "CONCLUIDA"
  | "REJEITADA"
  | "CANCELADA"
  | "ESTORNADA"
  | "FALHA";

export interface TransferApprovalStep {
  id: string;
  order: number;
  role: string;
  status: "PENDENTE" | "APROVADA" | "REJEITADA";
  approvedBy?: string;
  approvedAt?: string;
  comment?: string;
}

export interface BalanceTransferDetail {
  id: string;
  producerId: string;
  sourceEventId: string;
  sourceEventName: string;
  targetEventId: string;
  targetEventName: string;
  amount: number;
  currency: string;
  reason: string;
  notes?: string;
  status: TransferStatus;
  requestedBy: string;
  createdAt: string;
  reservedAt?: string;
  processedAt?: string;
  reversalOfTransferId?: string;
  correlationId: string;
  approvals: TransferApprovalStep[];
}
