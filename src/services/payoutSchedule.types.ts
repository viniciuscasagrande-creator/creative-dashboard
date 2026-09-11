/**
 * Fase 26.17.9.5.7 — Tipos Oficiais da Agenda Financeira, Lotes e Repasse Automático
 */

export type PayoutBatchStatus =
  | 'RASCUNHO'
  | 'EM_VALIDACAO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADO'
  | 'EM_PROCESSAMENTO'
  | 'ENVIADO_BANCO'
  | 'PARCIAL'
  | 'CONCLUIDO'
  | 'FALHA'
  | 'CANCELADO';

export type PayoutItemStatus =
  | 'AGENDADO'
  | 'VALIDANDO'
  | 'APROVADO'
  | 'REJEITADO'
  | 'BLOQUEADO'
  | 'RETIDO_HOLD'
  | 'ENVIADO_BANCO'
  | 'PAGO'
  | 'FALHA_TECNICA'
  | 'CANCELADO';

export type BankReturnStatus =
  | 'RECEBIDO'
  | 'ACEITO'
  | 'PROCESSANDO'
  | 'PAGO'
  | 'REJEITADO'
  | 'DEVOLVIDO'
  | 'CANCELADO';

export interface PayoutBatchItem {
  id: string; // PIT-0001
  batchId?: string;
  scheduleId?: string;
  producerId: string;
  producerName?: string;
  eventId?: string;
  eventName?: string;
  amount: number;
  authorizedAmount?: number;
  dueDate: string;
  status: PayoutItemStatus;
  ruleDecision?: 'ALLOW' | 'ALLOW_WITH_APPROVAL' | 'ALLOW_PARTIAL' | 'HOLD' | 'BLOCK';
  ruleReasons?: string[];
  bankStatus?: BankReturnStatus;
  bankTransactionId?: string;
  bankErrorCode?: string;
  bankErrorMessage?: string;
  idempotencyKey?: string;
  retryCount: number;
  maxRetries: number;
  isRetryable: boolean;
  correlationId: string;
  beneficiaryAccount?: {
    pixKey?: string;
    bankCode?: string;
    agency?: string;
    account?: string;
    taxId?: string;
  };
  processedAt?: string;
}

export interface PayoutBatch {
  id: string; // LOTE-20260911-001
  producerId: string;
  title: string;
  scheduledDate: string;
  status: PayoutBatchStatus;
  totalItems: number;
  totalAmount: number;
  approvedAmount: number;
  settledAmount: number;
  failedAmount: number;
  currency: string;
  items: PayoutBatchItem[];
  idempotencyKey: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  processedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutScheduleItem {
  id: string; // SCH-0001
  producerId: string;
  producerName: string;
  eventId: string;
  eventName: string;
  type: 'PAYOUT_AUTOMATIC' | 'PAYOUT_MANUAL' | 'ADVANCE_SETTLEMENT' | 'TRANSFER_INTER_EVENT';
  dueDate: string;
  amount: number;
  priority: 'NORMAL' | 'ALTA' | 'CRITICA';
  status: 'AGENDADO' | 'EM_LOTE' | 'CONCLUIDO' | 'CANCELADO';
  approvalStatus: 'PENDENTE' | 'APROVADO' | 'DISPENSADO' | 'REJEITADO';
  batchId?: string;
  bankStatus?: BankReturnStatus;
  correlationId: string;
  createdAt: string;
}

export interface BankReturnWebhookPayload {
  bankTransactionId: string;
  idempotencyKey: string;
  payoutItemId: string;
  batchId?: string;
  status: BankReturnStatus;
  settledAmount: number;
  settledAt?: string;
  errorCode?: string;
  errorMessage?: string;
}
