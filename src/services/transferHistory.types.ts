/**
 * Fase 26.17.9.5.3 — Tipos para Histórico, Timeline Append-Only e Auditoria de Estornos
 */

export interface TransferHistoryItem {
  id: string;
  createdAt: string;
  producerId: string;
  producerName: string;
  sourceEventId: string;
  sourceEventName: string;
  targetEventId: string;
  targetEventName: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  requestedBy: string;
  approvedBy?: string[];
  reversed: boolean;
  reversalTransferId?: string;
  correlationId: string;
}

export interface TransferTimelineEvent {
  id: string;
  transferId: string;
  type: string;
  occurredAt: string;
  actorName?: string;
  actorRole?: string;
  description: string;
  previousStatus?: string;
  newStatus?: string;
  correlationId: string;
}
