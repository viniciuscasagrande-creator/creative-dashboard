/**
 * ============================================================================
 * DISK — SERVIÇO DE DADOS BANCÁRIOS & VERSIONAMENTO TRANSACIONAL
 * Governança de Domicílio Bancário, Ativação Atômica e Proteção de Snapshot
 * ============================================================================
 */

import { accessAuditService } from './accessAuditService.js';
import { financialApprovalNotificationService } from './financialApprovalNotificationService.js';

// Base de Contas Bancárias por Produtor
let PRODUCER_BANK_ACCOUNTS = [
  {
    id: 'ACC-PROD1-01',
    producerId: 'prod-1',
    producerName: 'DiskIngressos Eventos Ltda',
    bankCode: '001',
    bankName: 'Banco do Brasil',
    agency: '1502-4',
    account: '99201-0',
    accountType: 'Conta Corrente Pessoa Jurídica',
    holderName: 'DiskIngressos Eventos Ltda',
    document: '08.123.456/0001-99',
    pixKey: '08123456000199',
    status: 'ATIVA', // ATIVA | PENDENTE_APROVACAO | INATIVA_HISTORICA | REPROVADA
    isDefault: true,
    version: 1,
    activatedAt: '2026-01-01T00:00:00.000Z',
    activatedBy: 'Sistema Inicial',
    documents: [
      { name: 'Cartao_CNPJ_DiskIngressos.pdf', type: 'application/pdf', uploadedAt: '2026-01-01T00:00:00.000Z' }
    ]
  },
  {
    id: 'ACC-PROD2-01',
    producerId: 'prod-2',
    producerName: 'CWB Brasil Entretenimento',
    bankCode: '033',
    bankName: 'Banco Santander',
    agency: '0082',
    account: '44810-9',
    accountType: 'Conta Corrente Pessoa Jurídica',
    holderName: 'CWB Brasil Entretenimento Ltda',
    document: '12.987.654/0001-00',
    pixKey: '12987654000100',
    status: 'ATIVA',
    isDefault: true,
    version: 1,
    activatedAt: '2026-01-01T00:00:00.000Z',
    activatedBy: 'Sistema Inicial',
    documents: [
      { name: 'Cartao_CNPJ_CWB.pdf', type: 'application/pdf', uploadedAt: '2026-01-01T00:00:00.000Z' }
    ]
  }
];

export const producerBankAccountService = {
  /**
   * Obtém a lista de todas as contas cadastradas para o produtor
   */
  getAccountsByProducer(producerId = 'prod-1') {
    return PRODUCER_BANK_ACCOUNTS.filter(a => a.producerId === producerId);
  },

  /**
   * Obtém a conta principal atualmente ATIVA do produtor
   */
  getActiveAccount(producerId = 'prod-1') {
    return PRODUCER_BANK_ACCOUNTS.find(a => a.producerId === producerId && a.status === 'ATIVA') || null;
  },

  /**
   * Obtém alteração pendente de aprovação se houver
   */
  getPendingAccount(producerId = 'prod-1') {
    return PRODUCER_BANK_ACCOUNTS.find(a => a.producerId === producerId && a.status === 'PENDENTE_APROVACAO') || null;
  },

  /**
   * Busca conta por ID
   */
  getAccountById(accountId) {
    return PRODUCER_BANK_ACCOUNTS.find(a => a.id === accountId) || null;
  },

  /**
   * Mascaramento de dados sensíveis na interface (LGPD & Segurança Bancária)
   */
  maskAccount(accountStr) {
    if (!accountStr) return '•••••-•';
    const clean = String(accountStr).trim();
    if (clean.length <= 4) return '••••' + clean;
    return '•••••-' + clean.slice(-4);
  },

  maskDocument(docStr) {
    if (!docStr) return '***.***.***-**';
    const clean = String(docStr).replace(/\D/g, '');
    if (clean.length === 11) {
      // CPF: ***.456.789-**
      return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
    }
    if (clean.length === 14) {
      // CNPJ: 08.***.***/0001-99
      return `${clean.slice(0, 2)}.***.***/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
    }
    return '***.***.***-**';
  },

  /**
   * Solicita alteração de dados bancários (Gera versão PENDENTE_APROVACAO sem sobrescrever conta ativa)
   */
  requestAccountChange({
    producerId = 'prod-1',
    producerName = 'DiskIngressos Eventos Ltda',
    bankCode,
    bankName,
    agency,
    account,
    accountType = 'Conta Corrente Pessoa Jurídica',
    holderName,
    document,
    pixKey,
    documents = [],
    requestedBy = { id: 'user-producer-joao', name: 'João Silva', role: 'PRODUTOR' },
    justification = ''
  }) {
    // 1. Regra contra solicitações concorrentes
    const existingPending = this.getPendingAccount(producerId);
    if (existingPending) {
      throw new Error(`Transferência/Alteração bloqueada: já existe uma alteração bancária em andamento para este produtor (Protocolo ${existingPending.relatedRequestId || existingPending.id}). Aguarde a análise para submeter nova alteração.`);
    }

    const currentActive = this.getActiveAccount(producerId);
    if (currentActive && currentActive.account === account && currentActive.agency === agency && currentActive.bankCode === bankCode) {
      throw new Error('A nova conta bancária informada é idêntica à conta ativa atual.');
    }

    const newId = `ACC-${producerId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const newVersion = (currentActive?.version || 1) + 1;

    const newAccountEntry = {
      id: newId,
      producerId,
      producerName: producerName || currentActive?.producerName,
      bankCode: String(bankCode || '001'),
      bankName: bankName || 'Instituição Financeira',
      agency: String(agency || '').trim(),
      account: String(account || '').trim(),
      accountType,
      holderName: holderName || currentActive?.holderName,
      document: document || currentActive?.document,
      pixKey: pixKey || '',
      status: 'PENDENTE_APROVACAO',
      isDefault: false,
      version: newVersion,
      requestedAt: new Date().toISOString(),
      requestedBy,
      justification,
      documents: documents.length > 0 ? documents : [
        { name: 'Comprovante_Titularidade_Bancaria.pdf', type: 'application/pdf', uploadedAt: new Date().toISOString() }
      ],
      history: []
    };

    PRODUCER_BANK_ACCOUNTS.unshift(newAccountEntry);

    // Auditoria
    accessAuditService.log({
      actorId: requestedBy.id,
      actorName: requestedBy.name,
      actorRole: requestedBy.role || 'PRODUTOR',
      action: 'BANK_CHANGE_REQUESTED',
      details: `Solicitada alteração de dados bancários para o Produtor ${producerId} (Nova conta: ${this.maskAccount(account)} / Banco: ${bankCode}).`
    });

    // Alerta de Segurança (Notificação para administradores do Produtor)
    financialApprovalNotificationService.notifyNewRequest({
      id: newId,
      type: 'ALTERACAO_DADOS_BANCARIOS',
      producerName: producerName || currentActive?.producerName,
      amount: 0,
      urgent: true,
      customMessage: `ALERTA DE SEGURANÇA: Foi solicitada uma alteração nos dados bancários do Produtor em ${new Date().toLocaleString('pt-BR')}. Se não reconhecer esta ação, contate imediatamente o suporte.`
    });

    return newAccountEntry;
  },

  /**
   * Ativação Atômica da Nova Conta (Após aprovação definitiva pelo Financeiro Disk)
   * Regra: Conta antiga -> INATIVA_HISTORICA; Nova conta -> ATIVA.
   */
  activateAccount(producerId, newAccountId, approver = { id: 'user-fin-mariana', name: 'Mariana Controladoria' }) {
    const newAccount = PRODUCER_BANK_ACCOUNTS.find(a => a.id === newAccountId && a.producerId === producerId);
    if (!newAccount) {
      throw new Error(`Conta proposta ${newAccountId} não encontrada para o produtor ${producerId}.`);
    }

    const currentActive = this.getActiveAccount(producerId);

    // Transação Atômica em Memória
    const nowIso = new Date().toISOString();

    if (currentActive) {
      currentActive.status = 'INATIVA_HISTORICA';
      currentActive.isDefault = false;
      currentActive.deactivatedAt = nowIso;
      currentActive.deactivatedBy = approver;

      accessAuditService.log({
        actorId: approver.id,
        actorName: approver.name,
        actorRole: 'FINANCEIRO',
        action: 'OLD_BANK_ACCOUNT_DEACTIVATED',
        details: `Conta anterior ${currentActive.id} (${this.maskAccount(currentActive.account)}) desativada e arquivada no histórico.`
      });
    }

    newAccount.status = 'ATIVA';
    newAccount.isDefault = true;
    newAccount.activatedAt = nowIso;
    newAccount.activatedBy = approver;

    accessAuditService.log({
      actorId: approver.id,
      actorName: approver.name,
      actorRole: 'FINANCEIRO',
      action: 'NEW_BANK_ACCOUNT_ACTIVATED',
      details: `Nova conta bancária ${newAccount.id} (${this.maskAccount(newAccount.account)}) ativada como domicílio oficial do produtor ${producerId}.`
    });

    return { ok: true, activeAccount: newAccount, previousAccount: currentActive };
  },

  /**
   * Reprovação da Alteração Bancária (Conta proposta -> REPROVADA; Conta anterior permanece ATIVA)
   */
  rejectAccountChange(producerId, newAccountId, approver, reason = '') {
    const newAccount = PRODUCER_BANK_ACCOUNTS.find(a => a.id === newAccountId && a.producerId === producerId);
    if (!newAccount) return false;

    newAccount.status = 'REPROVADA';
    newAccount.rejectionReason = reason;
    newAccount.rejectedAt = new Date().toISOString();
    newAccount.rejectedBy = approver;

    accessAuditService.log({
      actorId: approver.id,
      actorName: approver.name,
      actorRole: 'FINANCEIRO',
      action: 'BANK_CHANGE_REJECTED',
      details: `Solicitação de alteração bancária ${newAccountId} reprovada. Motivo: ${reason}`
    });

    return true;
  }
};
