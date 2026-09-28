/**
 * ============================================================================
 * MEGA PACOTE — PERFIL FINANCEIRO + CENTRAL UNIFICADA DE APROVAÇÕES
 * Tipos Oficiais e Estrutura Canônica de Dados (src/services/financialApproval.types.ts)
 * ============================================================================
 */

export type ApprovalType =
  | 'REPASSE'
  | 'ANTECIPACAO'
  | 'TRANSFERENCIA_EVENTOS'
  | 'PAGAMENTO'
  | 'PAGAMENTO_LOTE'
  | 'PIX'
  | 'ALTERACAO_DADOS_BANCARIOS'
  | 'ESTORNO'
  | 'COMPRA'
  | 'CONTRATO'
  | 'ALTERACAO_TAXA'
  | 'ALTERACAO_REGRA_REPASSE'
  | 'DESPESA_EXTRAORDINARIA';

export type ApprovalStatus =
  | 'RASCUNHO'
  | 'AGUARDANDO_APROVACAO'
  | 'EM_ANALISE'
  | 'DEVOLVIDA'
  | 'REENVIADA'
  | 'APROVADA'
  | 'REJEITADA'
  | 'EM_EXECUCAO'
  | 'CONCLUIDA'
  | 'FALHA_EXECUCAO'
  | 'CANCELADA';

export type ApprovalLevel =
  | 'AUTOMATICA'
  | 'NIVEL_1'
  | 'NIVEL_2'
  | 'DUPLA_APROVACAO'
  | 'DIRETORIA';

export type RiskLevel = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export type SlaStatus = 'NO_PRAZO' | 'ATENCAO' | 'VENCENDO' | 'VENCIDO';

export type UserProfileRole =
  | 'ADMINISTRADOR'
  | 'FINANCEIRO'
  | 'PRODUTOR'
  | 'MARKETING'
  | 'DEVELOPER';

export interface UserActor {
  id: string;
  name: string;
  role: UserProfileRole;
  email: string;
  producerId?: string;
}

export interface ApprovalAuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  previousStatus?: ApprovalStatus;
  newStatus?: ApprovalStatus;
  comment?: string;
  metadata?: Record<string, any>;
  ip?: string;
}

export interface FinancialImpact {
  sourceEventId?: string;
  sourceEventName?: string;
  sourceBalanceBefore?: number;
  sourceAmount?: number;
  sourceBalanceAfter?: number;
  
  targetEventId?: string;
  targetEventName?: string;
  targetBalanceBefore?: number;
  targetAmount?: number;
  targetBalanceAfter?: number;
  
  committedReserveBefore?: number;
  committedReserveAfter?: number;
}

export interface FinancialApprovalRequest {
  id: string;                          // Ex: 'APR-2026-00142'
  type: ApprovalType;
  producerId: string;
  producerName: string;
  eventId?: string;
  eventName?: string;
  amount: number;
  currency: 'BRL';
  
  // Quem solicita vs Quem autoriza (Maker/Checker)
  requestedBy: UserActor;
  assignedToRole?: 'FINANCEIRO' | 'GESTOR_FINANCEIRO' | 'DIRETORIA';
  assignedToUser?: UserActor;
  
  justification: string;
  payload: Record<string, any>;        // Carga de dados específica da operação
  attachments?: Array<{ name: string; url: string; size?: string }>;
  
  // Workflow e Status
  status: ApprovalStatus;
  statusLabelPtBr: string;
  badgeClass: string;
  
  // Nível, Risco e Governança
  approvalLevel: ApprovalLevel;
  approvalLevelLabel: string;
  riskLevel: RiskLevel;
  riskReasons: string[];
  
  // SLA
  slaHours: number;
  slaDeadline: string;                 // ISO Date
  slaStatus: SlaStatus;
  
  // Decisão
  reviewedAt?: string;
  reviewedBy?: UserActor;
  decisionReason?: string;
  returnNotes?: string;                // Orientações para o produtor corrigir
  
  // Dupla Aprovação
  firstLevelApprovedBy?: UserActor;
  firstLevelApprovedAt?: string;
  
  // Execução Pós-Aprovação (Aprovação !== Execução)
  executionStatus: 'PENDENTE' | 'EM_PROCESSAMENTO' | 'CONCLUIDA' | 'FALHA';
  executionResult?: {
    authCode?: string;
    transactionId?: string;
    executedAt?: string;
    receiptUrl?: string;
    errorMessage?: string;
  };
  
  // Impacto Financeiro
  financialImpact?: FinancialImpact;
  
  // Validações Automáticas
  automatedValidations: Array<{
    ruleCode: string;
    ruleTitle: string;
    passed: boolean;
    severity: 'INFO' | 'WARN' | 'BLOCK';
    message: string;
  }>;
  
  // Trilha de Auditoria Append-Only
  auditTrail: ApprovalAuditEntry[];
  
  createdAt: string;
  updatedAt: string;
}

export interface FinancialApprovalNotification {
  id: string;
  recipientRole: UserProfileRole;
  recipientUserId?: string;
  title: string;
  message: string;
  requestId: string;
  requestType: ApprovalType;
  timestamp: string;
  read: boolean;
  actionUrl: string;
  priority: 'ALTA' | 'MEDIA' | 'NORMAL';
}
