/**
 * Fase 26.17.9.5.1 — Definições de Tipos para Saldo Disponível Real por Evento
 */

export type EventBalanceStatus = "OK" | "DIVERGENTE" | "BLOQUEADO" | "SEM_DADOS";

export interface EventBalanceBreakdown {
  transactedAmount: number;
  settledAmount: number;
  pendingSettlement: number;
  availableBalance: number;
  committedBalance: number;
  blockedBalance: number;
  deficitBalance: number;
}

export interface EventCommitments {
  scheduledPayouts: number;
  advances: number;
  reservedExpenses: number;
  pendingTransfers: number;
  other: number;
}

export interface EventBlocks {
  chargebacks: number;
  refunds: number;
  compliance: number;
  operational: number;
  criticalDivergences: number;
}

export interface EventBalanceIntegrity {
  isBalanced: boolean;
  difference: number;
}

export interface EventBalanceResponse {
  eventId: string;
  producerId: string;
  eventName?: string;
  currency: string;
  calculatedAt: string;
  status: EventBalanceStatus;
  balances: EventBalanceBreakdown;
  commitments: EventCommitments;
  blocks: EventBlocks;
  integrity: EventBalanceIntegrity;
}

export interface BalanceMovement {
  id: string;
  eventId: string;
  producerId: string;
  transferId?: string;
  type:
    | "VENDA_LIQUIDADA"
    | "TAXA_PLATAFORMA"
    | "TAXA_GATEWAY"
    | "REPASSE_PROGRAMADO"
    | "ANTECIPACAO"
    | "DESPESA_RESERVADA"
    | "TRANSFERENCIA_EVENTO_SAIDA"
    | "TRANSFERENCIA_EVENTO_ENTRADA"
    | "ESTORNO_TRANSFERENCIA_SAIDA"
    | "ESTORNO_TRANSFERENCIA_ENTRADA"
    | "CHARGEBACK"
    | "BLOQUEIO_OPERACIONAL"
    | "DESBLOQUEIO"
    | "AJUSTE_CREDOR"
    | "AJUSTE_DEVEDOR";
  description: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  createdBy: string;
  referenceType?: string;
  referenceId?: string;
}
