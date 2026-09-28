/**
 * ============================================================================
 * MEGA PACOTE — PERFIL FINANCEIRO + CENTRAL UNIFICADA DE APROVAÇÕES
 * Motor de Regras e Alçadas Configuráveis (src/services/financialApprovalRulesService.js)
 * ============================================================================
 */

import { eventBalanceService } from './eventBalanceService.js';

/**
 * Matriz Configurável de Políticas de Aprovação
 */
export const APPROVAL_POLICIES = {
  REPASSE: {
    title: 'Solicitação de Repasse Bancário',
    tiers: [
      { maxAmount: 5000, level: 'NIVEL_1', risk: 'BAIXO', slaHours: 4 },
      { maxAmount: 50000, level: 'NIVEL_1', risk: 'MEDIO', slaHours: 4 },
      { maxAmount: Infinity, level: 'DUPLA_APROVACAO', risk: 'ALTO', slaHours: 2 }
    ]
  },
  TRANSFERENCIA_EVENTOS: {
    title: 'Transferência de Saldo entre Eventos',
    tiers: [
      { maxAmount: 5000, level: 'NIVEL_1', risk: 'BAIXO', slaHours: 4 },
      { maxAmount: 50000, level: 'NIVEL_1', risk: 'MEDIO', slaHours: 4 },
      { maxAmount: Infinity, level: 'DUPLA_APROVACAO', risk: 'ALTO', slaHours: 2 }
    ]
  },
  ALTERACAO_DADOS_BANCARIOS: {
    title: 'Alteração de Dados Bancários / Chave PIX',
    tiers: [
      { maxAmount: Infinity, level: 'NIVEL_2', risk: 'CRITICO', slaHours: 2 }
    ]
  },
  ANTECIPACAO: {
    title: 'Antecipação de Recebíveis',
    tiers: [
      { maxAmount: 20000, level: 'NIVEL_1', risk: 'MEDIO', slaHours: 4 },
      { maxAmount: Infinity, level: 'DUPLA_APROVACAO', risk: 'ALTO', slaHours: 2 }
    ]
  },
  PAGAMENTO_LOTE: {
    title: 'Processamento de Pagamento em Lote',
    tiers: [
      { maxAmount: Infinity, level: 'DUPLA_APROVACAO', risk: 'ALTO', slaHours: 2 }
    ]
  },
  PAGAMENTO: {
    title: 'Pagamento a Fornecedor / Terceiro',
    tiers: [
      { maxAmount: 5000, level: 'NIVEL_1', risk: 'BAIXO', slaHours: 4 },
      { maxAmount: 50000, level: 'NIVEL_1', risk: 'MEDIO', slaHours: 4 },
      { maxAmount: Infinity, level: 'DUPLA_APROVACAO', risk: 'ALTO', slaHours: 2 }
    ]
  },
  PIX: {
    title: 'Transferência Instantânea PIX',
    tiers: [
      { maxAmount: 5000, level: 'NIVEL_1', risk: 'BAIXO', slaHours: 2 },
      { maxAmount: 50000, level: 'NIVEL_1', risk: 'MEDIO', slaHours: 2 },
      { maxAmount: Infinity, level: 'DUPLA_APROVACAO', risk: 'ALTO', slaHours: 1 }
    ]
  },
  ESTORNO: {
    title: 'Estorno Financeiro / Chargeback',
    tiers: [
      { maxAmount: 1000, level: 'NIVEL_1', risk: 'BAIXO', slaHours: 4 },
      { maxAmount: Infinity, level: 'NIVEL_2', risk: 'MEDIO', slaHours: 4 }
    ]
  },
  COMPRA: {
    title: 'Pedido de Compra de Suprimentos',
    tiers: [
      { maxAmount: 10000, level: 'NIVEL_1', risk: 'BAIXO', slaHours: 6 },
      { maxAmount: Infinity, level: 'NIVEL_2', risk: 'MEDIO', slaHours: 4 }
    ]
  },
  CONTRATO: {
    title: 'Aprovação de Contrato de Prestador',
    tiers: [
      { maxAmount: Infinity, level: 'NIVEL_2', risk: 'ALTO', slaHours: 6 }
    ]
  },
  ALTERACAO_TAXA: {
    title: 'Alteração de Taxa Negociada',
    tiers: [
      { maxAmount: Infinity, level: 'DIRETORIA', risk: 'CRITICO', slaHours: 4 }
    ]
  },
  ALTERACAO_REGRA_REPASSE: {
    title: 'Alteração de Regra de Repasse',
    tiers: [
      { maxAmount: Infinity, level: 'DIRETORIA', risk: 'CRITICO', slaHours: 4 }
    ]
  },
  DESPESA_EXTRAORDINARIA: {
    title: 'Despesa Extraordinária não Orçada',
    tiers: [
      { maxAmount: Infinity, level: 'NIVEL_2', risk: 'ALTO', slaHours: 3 }
    ]
  }
};

/**
 * Mapeamentos Visuais em Português
 */
export const STATUS_MAP = {
  RASCUNHO: { label: 'Rascunho', badgeClass: 'bg-secondary text-white' },
  AGUARDANDO_APROVACAO: { label: 'Aguardando Aprovação', badgeClass: 'bg-warning text-dark' },
  EM_ANALISE: { label: 'Em Análise', badgeClass: 'bg-info text-white' },
  DEVOLVIDA: { label: 'Devolvida p/ Correção', badgeClass: 'bg-warning-subtle text-dark border border-warning' },
  REENVIADA: { label: 'Reenviada pelo Produtor', badgeClass: 'bg-primary-subtle text-primary border border-primary' },
  APROVADA: { label: 'Aprovada', badgeClass: 'bg-success text-white' },
  REJEITADA: { label: 'Rejeitada', badgeClass: 'bg-danger text-white' },
  EM_EXECUCAO: { label: 'Em Execução Bancária', badgeClass: 'bg-primary text-white' },
  CONCLUIDA: { label: 'Concluída / Executada', badgeClass: 'bg-success text-white' },
  FALHA_EXECUCAO: { label: 'Falha na Execução', badgeClass: 'bg-danger text-white' },
  CANCELADA: { label: 'Cancelada', badgeClass: 'bg-dark text-white' }
};

export const LEVEL_MAP = {
  AUTOMATICA: 'Aprovação Automática',
  NIVEL_1: 'Nível 1 (Financeiro Operacional)',
  NIVEL_2: 'Nível 2 (Gestor Financeiro)',
  DUPLA_APROVACAO: 'Dupla Aprovação (Nível 1 + Nível 2)',
  DIRETORIA: 'Alçada Executiva (Diretoria)'
};

export const TYPE_MAP = {
  REPASSE: { label: 'Repasse', icon: 'ph-money', color: 'text-success' },
  ANTECIPACAO: { label: 'Antecipação', icon: 'ph-hand-coins', color: 'text-primary' },
  TRANSFERENCIA_EVENTOS: { label: 'Transf. entre Eventos', icon: 'ph-arrows-left-right', color: 'text-warning' },
  PAGAMENTO: { label: 'Pagamento Fornecedor', icon: 'ph-credit-card', color: 'text-info' },
  PAGAMENTO_LOTE: { label: 'Pagamento em Lote', icon: 'ph-stack', color: 'text-primary' },
  PIX: { label: 'Transferência PIX', icon: 'ph-qr-code', color: 'text-success' },
  ALTERACAO_DADOS_BANCARIOS: { label: 'Alteração Bancária', icon: 'ph-bank', color: 'text-danger' },
  ESTORNO: { label: 'Estorno Financeiro', icon: 'ph-arrow-counter-clockwise', color: 'text-danger' },
  COMPRA: { label: 'Pedido de Compra', icon: 'ph-shopping-cart', color: 'text-secondary' },
  CONTRATO: { label: 'Contrato Fornecedor', icon: 'ph-file-text', color: 'text-secondary' },
  ALTERACAO_TAXA: { label: 'Alteração de Taxa', icon: 'ph-scales', color: 'text-danger' },
  ALTERACAO_REGRA_REPASSE: { label: 'Regra de Repasse', icon: 'ph-gear', color: 'text-danger' },
  DESPESA_EXTRAORDINARIA: { label: 'Despesa Extraordinária', icon: 'ph-warning', color: 'text-danger' }
};

export const financialApprovalRulesService = {
  /**
   * Avalia a operação contra a matriz de alçadas e regras
   */
  async evaluateApprovalRequirement({ type, amount = 0, producerId, eventId, payload = {} }) {
    const policy = APPROVAL_POLICIES[type] || APPROVAL_POLICIES.REPASSE;
    const numAmount = Number(amount) || 0;

    // Localiza tier correspondente
    let matchedTier = policy.tiers[0];
    for (const tier of policy.tiers) {
      if (numAmount <= tier.maxAmount) {
        matchedTier = tier;
        break;
      }
    }

    const automatedValidations = [];
    const riskReasons = [];

    // 1. Checagem de Saldo Real Disponível se houver evento de origem
    if (eventId) {
      try {
        const balRes = await eventBalanceService.getEventBalance(eventId);
        if (balRes && balRes.data) {
          const available = balRes.data.available || 0;
          if (numAmount > available) {
            automatedValidations.push({
              ruleCode: 'RN_SALDO_INSUFICIENTE',
              ruleTitle: 'Saldo Disponível Real',
              passed: false,
              severity: 'BLOCK',
              message: `Valor solicitado (R$ ${numAmount.toFixed(2)}) supera o saldo disponível real (R$ ${available.toFixed(2)}).`
            });
            riskReasons.push('Tentativa de operação sem saldo suficiente disponível.');
          } else {
            automatedValidations.push({
              ruleCode: 'RN_SALDO_DISPONIVEL_OK',
              ruleTitle: 'Saldo Disponível Real',
              passed: true,
              severity: 'INFO',
              message: `Saldo disponível (R$ ${available.toFixed(2)}) cobre integralmente o valor de R$ ${numAmount.toFixed(2)}.`
            });
          }
        }
      } catch (_) {}
    }

    // 2. Checagem antifraude para alteração cadastral/bancária
    if (type === 'ALTERACAO_DADOS_BANCARIOS') {
      automatedValidations.push({
        ruleCode: 'RN_SEGURANCA_BANCARIA',
        ruleTitle: 'Verificação Cadastral de Segurança',
        passed: false,
        severity: 'WARN',
        message: 'Alterações de conta corrente ou chave PIX exigem validação cadastral manual por Gestor Financeiro.'
      });
      riskReasons.push('Alteração de domicílio bancário ativa alçada crítica.');
    }

    // 3. Checagem de limites elevados
    if (numAmount > 50000) {
      riskReasons.push(`Operação de grande porte (> R$ 50.000,00) exige Dupla Aprovação.`);
    }

    // 4. Determinação final de Risco
    let finalRisk = matchedTier.risk;
    if (riskReasons.length > 1 || automatedValidations.some(v => v.severity === 'BLOCK')) {
      finalRisk = 'ALTO';
    }
    if (type === 'ALTERACAO_DADOS_BANCARIOS') {
      finalRisk = 'CRITICO';
    }

    // 5. Cálculo do SLA
    const slaHours = matchedTier.slaHours;
    const slaDeadline = new Date(Date.now() + slaHours * 3600000).toISOString();

    return {
      requiresApproval: matchedTier.level !== 'AUTOMATICA',
      approvalLevel: matchedTier.level,
      approvalLevelLabel: LEVEL_MAP[matchedTier.level] || matchedTier.level,
      riskLevel: finalRisk,
      riskReasons,
      slaHours,
      slaDeadline,
      automatedValidations
    };
  },

  /**
   * Calcula o status atual do SLA
   */
  calculateSlaStatus(slaDeadline, currentStatus) {
    if (currentStatus === 'CONCLUIDA' || currentStatus === 'REJEITADA' || currentStatus === 'CANCELADA') {
      return 'NO_PRAZO';
    }

    const now = Date.now();
    const deadline = new Date(slaDeadline).getTime();
    const diffMs = deadline - now;
    const diffHours = diffMs / 3600000;

    if (diffMs < 0) return 'VENCIDO';
    if (diffHours <= 1) return 'VENCENDO';
    if (diffHours <= 2) return 'ATENCAO';
    return 'NO_PRAZO';
  },

  /**
   * Retorna metadados visuais de status
   */
  getStatusMeta(status) {
    return STATUS_MAP[status] || { label: status, badgeClass: 'bg-secondary text-white' };
  },

  /**
   * Retorna metadados de tipo
   */
  getTypeMeta(type) {
    return TYPE_MAP[type] || { label: type, icon: 'ph-file', color: 'text-primary' };
  }
};
