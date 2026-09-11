/**
 * Fase 26.17.9.4.6 — Tipos e Contratos da Tesouraria Operacional
 * Separação estrita entre Conta Contábil (Ledger), Conta Bancária Física e Saldo por Evento.
 */

export type BankAccountType = 'CORRENTE' | 'POUPANCA' | 'PAGAMENTO';

export type BankAccountPurpose = 'OPERACIONAL' | 'REPASSES' | 'ARRECADACAO' | 'RESERVA';

export type BankAccountStatus = 'ATIVA' | 'INATIVA' | 'BLOQUEADA' | 'PENDENTE_VALIDACAO';

export interface BankAccount {
  id: string;
  producerId: string;
  producerName: string;
  bankCode: string; // Ex: '001', '341', '237', '033', '077', '208'
  bankName: string; // Ex: 'Banco do Brasil', 'Itaú Unibanco', 'Bradesco', 'Santander', 'Inter', 'BTG Pactual'
  agency: string;
  agencyDigit?: string;
  account: string;
  accountDigit: string;
  type: BankAccountType;
  purpose: BankAccountPurpose;
  holderName: string;
  holderTaxId: string;
  pixKey?: string;
  pixKeyType?: PixKeyType;
  currentBalance: number;
  availableBalance: number;
  blockedBalance: number;
  status: BankAccountStatus;
  isMain: boolean;
  maskedAccount: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountChangeRequest {
  id: string;
  bankAccountId: string;
  producerId: string;
  requestedChanges: Partial<BankAccount>;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'PENDENTE' | 'APROVADA' | 'REJEITADA';
  riskLevel: 'ALTO' | 'CRITICO';
  securityToken?: string;
  createdAt: string;
  resolvedAt?: string;
}

export type PaymentMethod = 'PIX' | 'TED' | 'BOLETO' | 'TRANSFERENCIA_INTERNA';

export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';

export type TreasuryPaymentStatus =
  | 'CREATED'
  | 'VALIDATING'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'SETTLED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCELLED';

export interface TreasuryPayment {
  id: string;
  producerId: string;
  eventId?: string;
  eventName?: string;
  costCenterId?: string;
  purchaseOrderId?: string;
  originBankAccountId: string;
  destinationAccount: {
    holderName: string;
    holderTaxId: string;
    bankCode?: string;
    agency?: string;
    account?: string;
    pixKey?: string;
    pixKeyType?: PixKeyType;
  };
  method: PaymentMethod;
  amount: number;
  description: string;
  status: TreasuryPaymentStatus;
  idempotencyKey: string;
  correlationId: string;
  externalTransactionId?: string;
  endToEndId?: string; // Para PIX E2E
  priority: 'NORMAL' | 'ALTA' | 'URGENTE';
  scheduledDate: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  submittedAt?: string;
  settledAt?: string;
  failureCode?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type TreasuryBatchStatus =
  | 'RASCUNHO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADO'
  | 'ENVIADO_BANCO'
  | 'PROCESSADO'
  | 'PARCIAL'
  | 'CANCELADO';

export interface TreasuryPaymentBatch {
  id: string;
  producerId: string;
  title: string;
  scheduledDate: string;
  originBankAccountId: string;
  originBankName: string;
  method: PaymentMethod;
  totalItems: number;
  totalAmount: number;
  approvedAmount: number;
  settledAmount: number;
  status: TreasuryBatchStatus;
  idempotencyKey: string;
  items: TreasuryPayment[];
  cnabFileId?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CnabType = 'CNAB240' | 'CNAB400';

export interface CnabFile {
  id: string;
  type: CnabType;
  bankCode: string;
  bankName: string;
  filename: string;
  generationDate: string;
  sequenceNumber: number;
  totalRecords: number;
  totalAmount: number;
  content: string;
  status: 'GERADO' | 'ENVIADO' | 'PROCESSADO' | 'CONCILIADO';
  batchId?: string;
  occurrences: Array<{
    itemIndex: number;
    code: string;
    description: string;
    settled: boolean;
  }>;
  createdAt: string;
}

export interface TreasuryKpiSummary {
  totalBankBalance: number;
  availableBankBalance: number;
  blockedBankBalance: number;
  todayProjectedOutflow: number;
  pendingPixCount: number;
  pendingPixAmount: number;
  pendingCnabBatchesCount: number;
  activeAccountsCount: number;
}
