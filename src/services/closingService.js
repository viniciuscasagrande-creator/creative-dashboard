/**
 * Fase 26.17.8.6 — Fechamento Contábil Mensal
 * Workflow corporativo de Fechamento:
 * PREPARAÇÃO → VALIDAÇÃO → PENDÊNCIAS → APROVAÇÃO → FECHAMENTO → BLOQUEIO
 *
 * Endpoints:
 * - GET  /api/accounting/closing/:period
 * - POST /api/accounting/closing/:period/validate
 * - POST /api/accounting/closing/:period/submit-approval
 * - POST /api/accounting/closing/:period/close
 * - POST /api/accounting/closing/:period/reopen
 */

const STORAGE_CLOSING_KEY = 'accounting_monthly_closing_v1';
const STORAGE_CLOSING_AUDIT_KEY = 'accounting_closing_audit_v1';

const INITIAL_CLOSING_STATE = {
  period: "08/2026",
  status: "AGUARDANDO_APROVACAO",
  progress: 88,
  responsible: "Controladoria & Contabilidade Disk",
  dueDate: "10/09/2026",
  closedAt: null,
  totalChecks: 18,
  approvedChecks: 15,
  pendingChecks: 3,
  criticalIssues: 0,
  financialDivergence: 0.00,
  accountingDivergence: 0.00,
  checks: [
    // Financeiro
    { id: "chk-01", category: "Financeiro", label: "Batimento Adquirentes Stone / Pagar.me (Vendas x Extrato)", severity: "BLOQUEANTE", status: "APROVADO", source: "Centro de Conciliação", amount: 1620000.00 },
    { id: "chk-02", category: "Financeiro", label: "Conciliação Bancária de Contas Correntes (Itaú / Inter)", severity: "BLOQUEANTE", status: "APROVADO", source: "Extratos Bancários OFX", amount: 1420000.00 },
    { id: "chk-03", category: "Financeiro", label: "Liquidações Pendentes e Vendas em Trânsito (D+1/D+2)", severity: "ATENCAO", status: "APROVADO", source: "Gateway Clearing", amount: 31700.00 },
    { id: "chk-04", category: "Financeiro", label: "Estornos e Devoluções CDC Concluídos", severity: "CRITICA", status: "APROVADO", source: "SAC & Reembolsos", amount: 72862.00 },
    { id: "chk-05", category: "Financeiro", label: "Monitoramento de Chargebacks e Pré-Disputas", severity: "ATENCAO", status: "APROVADO", source: "Antifraude ClearSale", amount: 4850.00 },

    // Produtores
    { id: "chk-06", category: "Produtores", label: "Segregação de Valores de Terceiros em Custódia", severity: "BLOQUEANTE", status: "APROVADO", source: "Controle de Borderôs", amount: 2850000.00 },
    { id: "chk-07", category: "Produtores", label: "Conferência de Repasses Executados x Saldo em Aberto", severity: "BLOQUEANTE", status: "APROVADO", source: "Módulo Repasses", amount: 2150000.00 },
    { id: "chk-08", category: "Produtores", label: "Verificação de Retenções Judiciais / Bloqueios de Produtores", severity: "CRITICA", status: "APROVADO", source: "Jurídico Disk", amount: 0.00 },

    // Contabilidade
    { id: "chk-09", category: "Contabilidade", label: "Consistência de Partidas Dobradas (Total Débitos = Total Créditos)", severity: "BLOQUEANTE", status: "APROVADO", source: "Livro Diário", amount: 9700000.00 },
    { id: "chk-10", category: "Contabilidade", label: "Zerar Contas Transitórias de Clearing e Liquidação", severity: "BLOQUEANTE", status: "APROVADO", source: "Plano de Contas", amount: 0.00 },
    { id: "chk-11", category: "Contabilidade", label: "Alocação Integral de Lançamentos em Centros de Custo", severity: "ATENCAO", status: "APROVADO", source: "Controladoria", amount: 612000.00 },

    // Fiscal
    { id: "chk-12", category: "Fiscal", label: "Apuração e Retenção de ISSQN Municipal (5%)", severity: "BLOQUEANTE", status: "APROVADO", source: "Módulo Fiscal / NFS-e", amount: 30600.00 },
    { id: "chk-13", category: "Fiscal", label: "Provisão de PIS / COFINS sobre Receita de Conveniência", severity: "CRITICA", status: "APROVADO", source: "Módulo Fiscal", amount: 22338.00 },
    { id: "chk-14", category: "Fiscal", label: "Conferência de Emissão de NFS-e x Pedidos Faturados", severity: "ATENCAO", status: "APROVADO", source: "Prefeitura / SEFAZ", amount: 612000.00 },

    // Demonstrações
    { id: "chk-15", category: "Demonstrações", label: "Equação Patrimonial: Ativo = Passivo + Patrimônio Líquido", severity: "BLOQUEANTE", status: "APROVADO", source: "Balanço Patrimonial", amount: 4850000.00 },
    { id: "chk-16", category: "Demonstrações", label: "Fechamento da DRE Gerencial x Balanço (Resultado do Período)", severity: "BLOQUEANTE", status: "APROVADO", source: "DRE Gerencial", amount: 139600.00 },
    { id: "chk-17", category: "Demonstrações", label: "Assinatura Digital do Contador Responsável (CRC Ativo)", severity: "CRITICA", status: "PENDENTE", source: "Certificado e-CPF/CRC" },
    { id: "chk-18", category: "Demonstrações", label: "Homologação Final da Diretoria Financeira (CFO)", severity: "CRITICA", status: "PENDENTE", source: "Diretoria Executiva" }
  ]
};

class ClosingService {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    if (typeof window === 'undefined') return;
    try {
      if (!localStorage.getItem(STORAGE_CLOSING_KEY)) {
        localStorage.setItem(STORAGE_CLOSING_KEY, JSON.stringify(INITIAL_CLOSING_STATE));
      }
      if (!localStorage.getItem(STORAGE_CLOSING_AUDIT_KEY)) {
        localStorage.setItem(STORAGE_CLOSING_AUDIT_KEY, JSON.stringify([]));
      }
    } catch (e) {
      console.warn('LocalStorage error in ClosingService:', e);
    }
  }

  getClosingState() {
    if (typeof window === 'undefined') return INITIAL_CLOSING_STATE;
    try {
      const data = localStorage.getItem(STORAGE_CLOSING_KEY);
      return data ? JSON.parse(data) : INITIAL_CLOSING_STATE;
    } catch (e) {
      return INITIAL_CLOSING_STATE;
    }
  }

  saveClosingState(state) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_CLOSING_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving closing state:', e);
    }
  }

  runValidation() {
    const state = this.getClosingState();
    let approved = 0;
    let pending = 0;
    let critical = 0;

    state.checks.forEach(chk => {
      if (chk.status === 'APROVADO') approved++;
      else {
        pending++;
        if (chk.severity === 'BLOQUEANTE' || chk.severity === 'CRITICA') critical++;
      }
    });

    state.approvedChecks = approved;
    state.pendingChecks = pending;
    state.criticalIssues = critical;
    state.progress = Math.round((approved / state.totalChecks) * 100);

    this.saveClosingState(state);
    this.addAudit('VALIDACAO_AUTOMATICA', 'Controlador do Sistema', `Executada rotina de checagem. ${approved}/${state.totalChecks} itens aprovados.`);
    return state;
  }

  submitApproval() {
    const state = this.getClosingState();
    state.status = "AGUARDANDO_APROVACAO";
    this.saveClosingState(state);
    this.addAudit('SUBMISSAO_APROVACAO', 'Diretor Contábil', 'Competência enviada para homologação executiva final.');
    return state;
  }

  closePeriod() {
    const state = this.getClosingState();
    const blocking = state.checks.filter(x => x.severity === 'BLOQUEANTE' && x.status !== 'APROVADO' && x.status !== 'JUSTIFICADO');
    if (blocking.length > 0) {
      return { success: false, error: `Existem ${blocking.length} verificações bloqueantes não resolvidas.` };
    }

    state.checks.forEach(c => c.status = 'APROVADO');
    state.approvedChecks = state.totalChecks;
    state.pendingChecks = 0;
    state.criticalIssues = 0;
    state.progress = 100;
    state.status = "FECHADO";
    state.closedAt = new Date().toISOString();

    this.saveClosingState(state);
    this.addAudit('FECHAMENTO_COMPETENCIA', 'CFO / Diretoria Financeira', 'Competência 08/2026 fechada e lançamentos contábeis bloqueados contra alterações retroativas.');
    return { success: true, state };
  }

  reopenPeriod(reason) {
    if (!reason || reason.trim().length < 10) {
      return { success: false, error: 'Justificativa obrigatória (mínimo 10 caracteres) para reabrir competência fechada.' };
    }
    const state = this.getClosingState();
    state.status = "REABERTO";
    this.saveClosingState(state);
    this.addAudit('REABERTURA_EXCEPCIONAL', 'Auditor Geral', `Reabertura autorizada: ${reason}`);
    return { success: true, state };
  }

  addAudit(action, actor, details) {
    if (typeof window === 'undefined') return;
    try {
      const logs = JSON.parse(localStorage.getItem(STORAGE_CLOSING_AUDIT_KEY) || '[]');
      logs.unshift({
        id: 'closing-log-' + Date.now(),
        action,
        actor,
        details,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_CLOSING_AUDIT_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
  }

  getAuditLogs() {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_CLOSING_AUDIT_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }
}

export const closingService = new ClosingService();
if (typeof window !== 'undefined') {
  window.closingService = closingService;
}
