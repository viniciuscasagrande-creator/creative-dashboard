/**
 * ==========================================================================
 * FASE 28.15.4 — CONTROLADOR UNIFICADO DA CONTABILIDADE (src/accounting/accounting-controller.js)
 * Orquestra painéis, abas internas, breadcrumbs e renderizadores da view-accounting-disk
 * ==========================================================================
 */

import { ACCOUNTING_TAB_TO_ROUTE, ACCOUNTING_ROUTE_TO_TAB } from '../navigation/accounting-routes.js';

export const TAB_PANE_MAP = {
  'dashboard': 'dashboard',
  'inteligencia': 'inteligencia-contabil',
  'inteligencia-contabil': 'inteligencia-contabil',
  'conciliacao': 'conciliacao',
  'rastreabilidade': 'lancamentos',
  'dre': 'relatorios-dre',
  'relatorios-dre': 'relatorios-dre',
  'balanco': 'relatorios-balanco',
  'relatorios-balanco': 'relatorios-balanco',
  'fechamento': 'cont-fechamento',
  'cont-fechamento': 'cont-fechamento',
  'plano-de-contas': 'plano-contas',
  'plano-contas': 'plano-contas',
  'lancamentos': 'lancamentos',
  'documentos': 'fiscal-nfe',
  'fiscal-nfe': 'fiscal-nfe',
  'nfe': 'fiscal-nfe',
  'fiscal': 'impostos',
  'impostos': 'impostos',
  'relatorios': 'demonstracoes',
  'demonstracoes': 'demonstracoes',
  'auditoria': 'auditoria',
  'configuracoes': 'config-plano',
  'config-plano': 'config-plano',
  'diario': 'diario',
  'razao': 'razao',
  'custos': 'custos',
  'receber': 'receber',
  'pagar': 'pagar',
  'caixa': 'caixa',
  'repasses': 'repasses',
  'simulador': 'simulador'
};

export const TAB_TITLES = {
  'dashboard': 'Visão Geral',
  'inteligencia': 'Inteligência Contábil',
  'inteligencia-contabil': 'Inteligência Contábil',
  'conciliacao': 'Centro de Conciliação',
  'rastreabilidade': 'Rastreabilidade 360º',
  'dre': 'DRE Gerencial',
  'relatorios-dre': 'DRE Gerencial',
  'balanco': 'Balanço Patrimonial',
  'relatorios-balanco': 'Balanço Patrimonial',
  'fechamento': 'Fechamento Mensal',
  'cont-fechamento': 'Fechamento Mensal',
  'plano-de-contas': 'Plano de Contas',
  'plano-contas': 'Plano de Contas',
  'lancamentos': 'Livro de Lançamentos',
  'documentos': 'Documentos Fiscais & Contábeis',
  'fiscal-nfe': 'Documentos Fiscais & Contábeis',
  'nfe': 'Documentos Fiscais & Contábeis',
  'fiscal': 'Gestão Fiscal & Tributos',
  'impostos': 'Gestão Fiscal & Tributos',
  'relatorios': 'Relatórios & Demonstrações',
  'demonstracoes': 'Relatórios & Demonstrações',
  'auditoria': 'Auditoria & Compliance',
  'configuracoes': 'Configurações Contábeis',
  'config-plano': 'Configurações Contábeis',
  'diario': 'Livro Diário',
  'razao': 'Livro Razão',
  'custos': 'Centros de Custos',
  'receber': 'Contas a Receber',
  'pagar': 'Contas a Pagar',
  'caixa': 'Fluxo de Caixa',
  'repasses': 'Repasses a Produtores',
  'simulador': 'Simulador de Ciclo'
};

export const ACCOUNTING_CATEGORY_MAP = {
  'dashboard': 'visao-geral',
  'inteligencia': 'visao-geral',
  'inteligencia-contabil': 'visao-geral',
  'simulador': 'visao-geral',
  'plano-contas': 'contabilidade',
  'plano-de-contas': 'contabilidade',
  'diario': 'contabilidade',
  'razao': 'contabilidade',
  'lancamentos': 'contabilidade',
  'rastreabilidade': 'contabilidade',
  'custos': 'contabilidade',
  'cont-hist': 'contabilidade',
  'relatorios-diario': 'contabilidade',
  'relatorios-razao': 'contabilidade',
  'conciliacao': 'conciliacao',
  'repasses-extratos': 'conciliacao',
  'receber': 'conciliacao',
  'pagar': 'conciliacao',
  'repasses': 'conciliacao',
  'repasses-pix': 'conciliacao',
  'repasses-ted': 'conciliacao',
  'repasses-hist': 'conciliacao',
  'caixa': 'conciliacao',
  'fin-bancos': 'conciliacao',
  'fin-movs': 'conciliacao',
  'demonstracoes': 'demonstracoes',
  'relatorios': 'demonstracoes',
  'relatorios-dre': 'demonstracoes',
  'dre': 'demonstracoes',
  'relatorios-balanco': 'demonstracoes',
  'balanco': 'demonstracoes',
  'relatorios-fluxo': 'demonstracoes',
  'relatorios-balancete': 'demonstracoes',
  'impostos': 'fiscal-controle',
  'fiscal': 'fiscal-controle',
  'auditoria': 'fiscal-controle',
  'cont-fechamento': 'fiscal-controle',
  'fechamento': 'fiscal-controle',
  'documentos': 'fiscal-controle',
  'fiscal-nfse': 'fiscal-controle',
  'fiscal-nfe': 'fiscal-controle',
  'nfe': 'fiscal-controle',
  'fiscal-sped': 'fiscal-controle',
  'fiscal-obrigacoes': 'fiscal-controle',
  'config-empresas': 'fiscal-controle',
  'config-plano': 'fiscal-controle',
  'config-users': 'fiscal-controle',
  'config-perms': 'fiscal-controle',
  'config-integracoes': 'fiscal-controle',
  'config-automacoes': 'fiscal-controle'
};

export const AccountingController = {
  currentTab: null,

  /**
   * Ativa uma aba e painel específicos dentro de view-accounting-disk
   * @param {string} rawTabName - Identificador da aba ou subrota
   * @returns {boolean} Sucesso da ativação
   */
  activateTab(rawTabName) {
    if (typeof document === 'undefined') return false;

    // 1. Sanitizar tabName para evitar undefined ou null
    let tabName = String(rawTabName || 'dashboard').trim();
    if (!tabName || tabName === 'undefined' || tabName === 'null') {
      tabName = 'dashboard';
    }

    const targetPane = TAB_PANE_MAP[tabName] || tabName;
    const category = ACCOUNTING_CATEGORY_MAP[tabName] || ACCOUNTING_CATEGORY_MAP[targetPane] || 'visao-geral';

    const root = document.getElementById('view-accounting-disk');
    if (!root) return false;

    // Garantir que view-accounting-disk esteja visível
    if (root.style.display === 'none') {
      root.style.display = 'block';
    }

    // 2. Alternar visibilidade dos painéis (.accounting-pane)
    root.querySelectorAll('.accounting-pane').forEach(pane => {
      pane.style.display = 'none';
      pane.classList.remove('active');
    });

    const activePane = document.getElementById(`accpane-${targetPane}`);
    if (activePane) {
      activePane.style.display = 'block';
      activePane.classList.add('active');
    }

    // Suporte a atributos data-accounting-panel para arquitetura Enterprise declarativa
    root.querySelectorAll('[data-accounting-panel]').forEach(panel => {
      const isMatch = panel.dataset.accountingPanel === tabName || panel.dataset.accountingPanel === targetPane;
      panel.hidden = !isMatch;
      panel.classList.toggle('active', isMatch);
      if (isMatch) panel.style.display = 'block';
    });

    // 3. Atualizar botões de abas internas e atributos aria-selected
    root.querySelectorAll('[data-accounting-tab]').forEach(tab => {
      const isMatch = tab.dataset.accountingTab === tabName || tab.dataset.accountingTab === targetPane;
      tab.classList.toggle('active', isMatch);
      tab.setAttribute('aria-selected', String(isMatch));
    });

    // 4. Atualizar Breadcrumb e botão de voltar
    const breadcrumbLabel = document.getElementById('acc-breadcrumb-current-label');
    const backBtnContainer = document.getElementById('acc-subpane-back-btn-container');

    if (breadcrumbLabel) {
      breadcrumbLabel.textContent = TAB_TITLES[tabName] || TAB_TITLES[targetPane] || 'Visão Geral';
    }
    if (backBtnContainer) {
      backBtnContainer.style.display = (targetPane === 'dashboard') ? 'none' : 'block';
    }

    // 5. Atualizar botões de categoria (pilares)
    document.querySelectorAll('#accounting-category-nav .accounting-pillar-btn, #accounting-category-nav .nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-category') === category);
    });

    // 6. Atualizar grupos subnav contextuais
    document.querySelectorAll('.accounting-subnav-group').forEach(grp => {
      if (grp.id === `subnav-group-${category}`) {
        grp.classList.remove('d-none');
        grp.classList.add('d-flex');
      } else {
        grp.classList.remove('d-flex');
        grp.classList.add('d-none');
      }
    });

    // 7. Destacar botão ativo no subnav
    document.querySelectorAll('.accounting-subnav-group button[data-tab]').forEach(btn => {
      const btnTab = btn.getAttribute('data-tab');
      const isMatch = btnTab === tabName || btnTab === targetPane;
      if (isMatch) {
        btn.classList.remove('btn-outline-secondary', 'btn-light');
        btn.classList.add('btn-primary', 'text-white', 'shadow-xs');
      } else {
        btn.classList.remove('btn-primary', 'text-white', 'shadow-xs');
        btn.classList.add('btn-outline-secondary');
      }
    });

    // 8. Executar renderizadores específicos da aba
    try {
      if (targetPane === 'dashboard' && typeof window.renderAccountingDashboard === 'function') {
        window.renderAccountingDashboard();
      } else if (targetPane === 'inteligencia-contabil' && typeof window.renderAccountingIntelligence === 'function') {
        window.renderAccountingIntelligence();
      } else if (targetPane === 'conciliacao' && typeof window.renderConciliacao === 'function') {
        window.renderConciliacao();
      } else if (targetPane === 'lancamentos') {
        if (typeof window.renderLancamentos === 'function') window.renderLancamentos();
        if ((tabName === 'rastreabilidade' || targetPane === 'lancamentos') && typeof window.renderTraceability === 'function') {
          window.renderTraceability();
        }
      } else if (targetPane === 'relatorios-dre' && typeof window.renderDre === 'function') {
        window.renderDre();
      } else if (targetPane === 'relatorios-balanco' && typeof window.renderBalanceSheet === 'function') {
        window.renderBalanceSheet();
      } else if (targetPane === 'cont-fechamento') {
        if (typeof window.renderClosing === 'function') window.renderClosing();
        if (typeof window.renderCustos === 'function') window.renderCustos();
      } else if (targetPane === 'plano-contas' && typeof window.renderPlanoContas === 'function') {
        window.renderPlanoContas();
      } else if (targetPane === 'fiscal-nfe' || targetPane === 'nfe') {
        if (typeof window.renderNfe === 'function') window.renderNfe();
      } else if (targetPane === 'impostos' && typeof window.renderImpostos === 'function') {
        window.renderImpostos();
      } else if (targetPane === 'auditoria') {
        if (typeof window.renderAuditCompliance === 'function') window.renderAuditCompliance();
        if (typeof window.renderAudit === 'function') window.renderAudit();
      } else if (targetPane === 'diario' && typeof window.renderDiario === 'function') {
        window.renderDiario();
      } else if (targetPane === 'razao' && typeof window.renderRazao === 'function') {
        window.renderRazao();
      } else if (targetPane === 'custos' && typeof window.renderCustos === 'function') {
        window.renderCustos();
      }

      if (targetPane === 'demonstracoes' || tabName === 'demonstracoes') {
        const isExp = window.currentAccountingMode === 'expert';
        const divider = document.getElementById('acc-demo-actions-divider');
        const expertActions = document.getElementById('acc-demo-expert-actions');
        if (divider) divider.style.display = isExp ? 'block' : 'none';
        if (expertActions) expertActions.style.display = isExp ? 'flex' : 'none';
      }

      if (typeof window.logAudit === 'function') {
        window.logAudit('Navegação Contábil', 'Mudar Aba', `Acessou aba ${targetPane} (Pilar: ${category})`);
      }
    } catch (renderErr) {
      console.warn('[AccountingController] Aviso na execução do renderizador da aba:', renderErr);
    }

    this.currentTab = tabName;
    return true;
  }
};

if (typeof window !== 'undefined') {
  window.AccountingController = AccountingController;
  window.ACCOUNTING_TAB_TO_ROUTE = ACCOUNTING_TAB_TO_ROUTE;
  window.ACCOUNTING_ROUTE_TO_TAB = ACCOUNTING_ROUTE_TO_TAB;
}
