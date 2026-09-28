/**
 * ============================================================================
 * MEGA PACOTE 1 — AUTENTICAÇÃO + GERENCIAMENTO DE ACESSO (RBAC & ESCOPOS)
 * Tipos Oficiais TypeScript (src/services/accessControl.types.ts)
 * ============================================================================
 */

export type UserType = 'INTERNO_DISK' | 'PRODUTOR';

export type UserStatus = 'ATIVO' | 'BLOQUEADO' | 'PENDENTE_ATIVACAO';

export type UserProfileRole =
  | 'ADMINISTRADOR'
  | 'FINANCEIRO'
  | 'GESTOR_FINANCEIRO'
  | 'PRODUTOR_ADMINISTRADOR'
  | 'PRODUTOR_FINANCEIRO'
  | 'PRODUTOR_OPERACIONAL'
  | 'MARKETING'
  | 'ATENDIMENTO_SAC'
  | 'DEVELOPER';

export type PermissionAction =
  | 'visualizar'
  | 'consultar'
  | 'criar'
  | 'solicitar'
  | 'editar'
  | 'excluir'
  | 'aprovar'
  | 'rejeitar'
  | 'devolver'
  | 'administrar'
  | 'exportar';

export type PermissionModule =
  | 'acesso'
  | 'dashboard'
  | 'eventos'
  | 'comercial'
  | 'financeiro'
  | 'marketing'
  | 'atendimento'
  | 'contabilidade'
  | 'configuracoes';

export interface ScopeAuthorization {
  allProducers: boolean;
  producerIds: string[];
  allEvents: boolean;
  eventIds: Array<string | number>;
}

export interface UserThresholds {
  transferLimit: number;          // Limite máximo para transferência entre eventos
  payoutLimit: number;            // Limite máximo para aprovação de repasse
  paymentLimit: number;           // Limite máximo para pagamento a fornecedores
  refundLimit: number;            // Limite máximo para estorno
  canApproveBankDetails: boolean; // Autorizado a aprovar alteração de conta/PIX
  canApproveAnticipation: boolean;// Autorizado a aprovar antecipação de recebíveis
  maxApprovalLevel: 'NIVEL_1' | 'NIVEL_2' | 'DIRETORIA';
}

export interface UserSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  ip: string;
  userAgent: string;
  active: boolean;
}

export interface AccessAuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  targetUserId?: string;
  targetUserName?: string;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'LOGIN_FAIL'
    | 'USER_CREATE'
    | 'USER_UPDATE'
    | 'USER_BLOCK'
    | 'USER_UNBLOCK'
    | 'PASSWORD_RESET'
    | 'ROLE_CHANGE'
    | 'PERMISSION_CHANGE'
    | 'SCOPE_CHANGE'
    | 'THRESHOLD_CHANGE'
    | 'SESSION_REVOKE';
  details: string;
  previousValue?: any;
  newValue?: any;
  ip: string;
  sessionId?: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  status: UserStatus;
  userType: UserType;
  producerId?: string | null;
  producerName?: string | null;
  profile: UserProfileRole;
  profileLabelPtBr: string;
  directPermissions: string[]; // Permissões concedidas a mais que o perfil padrão
  deniedPermissions: string[]; // Permissões expressamente revogadas
  scope: ScopeAuthorization;
  thresholds: UserThresholds;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  lastIp: string | null;
  failedLoginAttempts: number;
  createdAt: string;
  updatedAt: string;
}
