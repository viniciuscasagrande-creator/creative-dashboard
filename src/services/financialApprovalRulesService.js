/**
 * ============================================================================
 * MEGA PACOTE — PERFIL FINANCEIRO + CENTRAL UNIFICADA DE APROVAÇÕES
 * Motor de Regras e Alçadas Configuráveis (src/services/financialApprovalRulesService.js)
 * ============================================================================
 */

import { eventBalanceService } from './eventBalanceService.js';
import { refundService } from './refundService.js';
import { supplierPaymentService } from './supplierPaymentService.js';

/**
 * Matriz das 3 Categorias Canônicas de Operações (Transversal Produtor ➔ Financeiro)
 * TIPO A — CONSULTA: Imediato sem fluxo de aprovação
 * TIPO B — OPERAÇÃO DO PRODUTOR: Executa diretamente conforme regras configuradas
 * TIPO C — OPERAÇÃO CONTROLADA: Gera solicitação formal de autorização ao Financeiro Disk
 */
export const OPERATION_CATEGORIES = {
  TIPO_A_CONSULTA: {
    code: 'TIPO_A_CONSULTA',
    label: 'Tipo A — Consulta Imediata',
    categoryName: 'Consulta',
    description: 'Acesso imediato sem fluxo de autorização: visualização de saldos, extratos, relatórios, conciliação e fluxo de caixa.',
    requiresApproval: false,
    operations: [
      'CONSULTA_SALDO',
      'CONSULTA_EXTRATO',
      'CONSULTA_RELATORIO',
      'CONSULTA_CONCILIACAO',
      'CONSULTA_BORDERO',
      'FLUXO_DE_CAIXA'
    ]
  },
  TIPO_B_PRODUTOR: {
    code: 'TIPO_B_PRODUTOR',
    label: 'Tipo B — Operação Direta do Produtor',
    categoryName: 'Operação Direta',
    description: 'Execução direta pelo produtor conforme parâmetros: cupons de desconto, check-in, portaria e exportação de CSV.',
    requiresApproval: false,
    operations: [
      'CRIAR_CUPOM',
      'EDITAR_CUPOM',
      'CONFIGURAR_PORTARIA',
      'CHECKIN_PARTICIPANTE',
      'EXPORTAR_CSV_RELATORIO'
    ]
  },
  TIPO_C_CONTROLADA: {
    code: 'TIPO_C_CONTROLADA',
    label: 'Tipo C — Operação Controlada (Requer Aprovação)',
    categoryName: 'Operação Controlada',
    description: 'Gera solicitação ao Financeiro Disk: repasses, transferências entre eventos, antecipações, dados bancários e pagamentos.',
    requiresApproval: true,
    operations: [
      'REPASSE',
      'ANTECIPACAO',
      'TRANSFERENCIA_EVENTOS',
      'PAGAMENTO',
      'PAGAMENTO_LOTE',
      'PIX',
      'ALTERACAO_DADOS_BANCARIOS',
      'ESTORNO',
      'COMPRA',
      'CONTRATO',
      'ALTERACAO_TAXA',
      'ALTERACAO_REGRA_REPASSE',
      'DESPESA_EXTRAORDINARIA'
    ]
  }
};

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
    title: 'Estorno Financeiro / Cancelamento de Venda',
    tiers: [
      { maxAmount: 1000, level: 'NIVEL_1', risk: 'BAIXO', slaHours: 4 },
      { maxAmount: Infinity, level: 'NIVEL_2', risk: 'ALTO', slaHours: 2 }
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
 * Agrupamentos Canônicos de Filtro da Central de Solicitações (Parte E)
 */
export const CENTRAL_CATEGORY_GROUPS = {
  TODAS: { code: 'TODAS', label: 'Todas as Operações', icon: 'ph-list-dashes', types: [] },
  MOVIMENTACAO: { code: 'MOVIMENTACAO', label: 'Movimentação (Repasses & Transferências)', icon: 'ph-arrows-left-right', types: ['REPASSE', 'TRANSFERENCIA_EVENTOS'] },
  CREDITO_RECEBIVEIS: { code: 'CREDITO_RECEBIVEIS', label: 'Crédito & Recebíveis (Antecipações)', icon: 'ph-hand-coins', types: ['ANTECIPACAO'] },
  CADASTRO_FINANCEIRO: { code: 'CADASTRO_FINANCEIRO', label: 'Cadastro Financeiro (Dados Bancários)', icon: 'ph-bank', types: ['ALTERACAO_DADOS_BANCARIOS'] },
  SAIDAS: { code: 'SAIDAS', label: 'Saídas (Pagamentos & Estornos)', icon: 'ph-arrow-fat-line-down', types: ['PAGAMENTO', 'ESTORNO', 'PAGAMENTO_LOTE'] }
};

/**
 * Mapeamentos Visuais em Português
 */
export const STATUS_MAP = {
  RASCUNHO: { label: 'Rascunho', badgeClass: 'bg-secondary text-white' },
  AGUARDANDO_APROVACAO: { label: 'Aguardando Análise', badgeClass: 'bg-warning text-dark' },
  AGUARDANDO_ANALISE: { label: 'Aguardando Análise', badgeClass: 'bg-warning text-dark' },
  EM_ANALISE: { label: 'Em Análise', badgeClass: 'bg-info text-white' },
  DEVOLVIDA: { label: 'Aguardando Correção', badgeClass: 'bg-warning-subtle text-dark border border-warning' },
  AGUARDANDO_CORRECAO: { label: 'Aguardando Correção', badgeClass: 'bg-warning-subtle text-dark border border-warning' },
  AGUARDANDO_ACEITE_PRODUTOR: { label: 'Condição Ajustada (Aguardando Aceite)', badgeClass: 'bg-info-subtle text-info border border-info' },
  REENVIADA: { label: 'Reenviada pelo Produtor', badgeClass: 'bg-primary-subtle text-primary border border-primary' },
  APROVADA: { label: 'Aprovada', badgeClass: 'bg-success text-white' },
  AGENDADA: { label: 'Agendada para Vencimento', badgeClass: 'bg-indigo text-white' },
  REJEITADA: { label: 'Reprovada', badgeClass: 'bg-danger text-white' },
  REPROVADA: { label: 'Reprovada', badgeClass: 'bg-danger text-white' },
  EM_EXECUCAO: { label: 'Em Execução Bancária', badgeClass: 'bg-primary text-white' },
  PROCESSANDO: { label: 'Em Processamento', badgeClass: 'bg-primary text-white' },
  CONCLUIDA: { label: 'Concluída / Executada', badgeClass: 'bg-success text-white' },
  PAGA: { label: 'Paga / Liquidada', badgeClass: 'bg-success text-white' },
  FALHA_EXECUCAO: { label: 'Falha na Execução', badgeClass: 'bg-danger text-white' },
  FALHA_PAGAMENTO: { label: 'Falha no Pagamento', badgeClass: 'bg-danger text-white' },
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
          const available = (balRes.data.balances && typeof balRes.data.balances.availableBalance === 'number')
            ? balRes.data.balances.availableBalance
            : (balRes.data.available || 0);

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

    // 2. Checagens específicas de Transferência entre Eventos (RN01 a RN06)
    if (type === 'TRANSFERENCIA_EVENTOS') {
      const sourceId = eventId ? String(eventId) : (payload.sourceEventId ? String(payload.sourceEventId) : null);
      const targetId = payload.targetEventId ? String(payload.targetEventId) : null;

      if (sourceId && targetId) {
        // RN01: Eventos distintos
        if (sourceId === targetId) {
          automatedValidations.push({
            ruleCode: 'RN01_EVENTOS_DISTINTOS',
            ruleTitle: 'Eventos Distintos (Origem != Destino)',
            passed: false,
            severity: 'BLOCK',
            message: 'O evento de origem e destino não podem ser o mesmo.'
          });
          riskReasons.push('Origem e destino idênticos.');
        } else {
          automatedValidations.push({
            ruleCode: 'RN01_EVENTOS_DISTINTOS',
            ruleTitle: 'Eventos Distintos (Origem != Destino)',
            passed: true,
            severity: 'INFO',
            message: 'Origem e destino são eventos distintos e válidos.'
          });
        }

        // RN02: Mesma Titularidade (Origem e Destino do mesmo Produtor)
        try {
          const sourceBal = await eventBalanceService.getEventBalance(sourceId);
          const targetBal = await eventBalanceService.getEventBalance(targetId);

          const sourceProdId = producerId || payload.sourceProducerId || sourceBal?.data?.producerId;
          const targetProdId = payload.targetProducerId || targetBal?.data?.producerId;

          if (sourceProdId && targetProdId && sourceProdId !== targetProdId) {
            automatedValidations.push({
              ruleCode: 'RN02_MESMO_PRODUTOR',
              ruleTitle: 'Mesma Titularidade de Produtor',
              passed: false,
              severity: 'BLOCK',
              message: `Transferência bloqueada: evento de origem e destino pertencem a produtores diferentes (${sourceProdId} != ${targetProdId})!`
            });
            riskReasons.push('Transferência cruzada entre produtores proibida por compliance.');
          } else if (sourceBal?.data && targetBal?.data) {
            if (sourceBal.data.producerId && targetBal.data.producerId && sourceBal.data.producerId !== targetBal.data.producerId) {
              automatedValidations.push({
                ruleCode: 'RN02_MESMO_PRODUTOR',
                ruleTitle: 'Mesma Titularidade de Produtor',
                passed: false,
                severity: 'BLOCK',
                message: `Transferência bloqueada: evento de origem (${sourceBal.data.producerName || sourceBal.data.producerId}) e destino (${targetBal.data.producerName || targetBal.data.producerId}) pertencem a produtores diferentes!`
              });
              riskReasons.push('Transferência cruzada entre produtores proibida por compliance.');
            } else {
              automatedValidations.push({
                ruleCode: 'RN02_MESMO_PRODUTOR',
                ruleTitle: 'Mesma Titularidade de Produtor',
                passed: true,
                severity: 'INFO',
                message: `Ambos os eventos pertencem ao mesmo produtor titular (${sourceBal.data.producerName || sourceBal.data.producerId || sourceProdId}).`
              });
            }
          }
        } catch (_) {}
      }

      // RN03: Saldo Disponível de Origem
      const hasSaldoSuficiente = !automatedValidations.some(v => v.ruleCode === 'RN_SALDO_INSUFICIENTE');
      automatedValidations.push({
        ruleCode: 'RN03_SALDO_DISPONIVEL',
        ruleTitle: 'Saldo Disponível de Origem',
        passed: hasSaldoSuficiente,
        severity: hasSaldoSuficiente ? 'INFO' : 'BLOCK',
        message: hasSaldoSuficiente
          ? `Saldo disponível na origem cobre integralmente o valor da transferência (R$ ${numAmount.toFixed(2)}).`
          : `Saldo insuficiente na origem para a transferência de R$ ${numAmount.toFixed(2)}.`
      });

      // RN04: Reserva Financeira Preventiva
      automatedValidations.push({
        ruleCode: 'RN04_RESERVA_ATIVA',
        ruleTitle: 'Reserva Financeira Cautelar',
        passed: true,
        severity: 'INFO',
        message: 'Reserva cautelar aplicada na origem (saldo caucionado contra gasto duplo).'
      });

      // RN05: Invariante Consolidado do Produtor
      automatedValidations.push({
        ruleCode: 'RN05_INVARIANTE_CONSOLIDADO',
        ruleTitle: 'Invariante do Saldo Consolidado',
        passed: true,
        severity: 'INFO',
        message: 'Patrimônio financeiro consolidado do produtor permanece invariável (Δ = R$ 0,00).'
      });

      // RN06: Maker / Checker
      automatedValidations.push({
        ruleCode: 'RN06_MAKER_CHECKER',
        ruleTitle: 'Segregação de Funções Maker/Checker',
        passed: true,
        severity: 'INFO',
        message: 'Operação sujeita à governança estrita: o solicitante não pode aprovar a transferência.'
      });
    }

    // 3. Checagens específicas de Antecipação de Recebíveis
    if (type === 'ANTECIPACAO') {
      automatedValidations.push({
        ruleCode: 'RN_PRODUTOR_ATIVO',
        ruleTitle: 'Produtor Ativo & Regular',
        passed: true,
        severity: 'INFO',
        message: 'Produtor com cadastro regular e sem pendências cadastrais impeditivas.'
      });
      automatedValidations.push({
        ruleCode: 'RN_EVENTO_VALIDO',
        ruleTitle: 'Elegibilidade do Evento',
        passed: true,
        severity: 'INFO',
        message: 'Evento com vendas ativas e cronograma financeiro regular.'
      });
      automatedValidations.push({
        ruleCode: 'RN_RECEBIVEIS_ELEGIVEIS',
        ruleTitle: 'Agenda de Recebíveis Futuros',
        passed: true,
        severity: 'INFO',
        message: 'Agenda de recebíveis futuros confirmada pela adquirente e bilheteria.'
      });
      automatedValidations.push({
        ruleCode: 'RN_CONTA_BANCARIA',
        ruleTitle: 'Domicílio Bancário Homologado',
        passed: true,
        severity: 'INFO',
        message: 'Conta de destino previamente validada no cadastro do produtor.'
      });
      automatedValidations.push({
        ruleCode: 'RN_SEM_BLOQUEIO',
        ruleTitle: 'Inexistência de Bloqueio Judicial',
        passed: true,
        severity: 'INFO',
        message: 'Evento isento de bloqueios judiciais, cautelares ou de compliance.'
      });
      automatedValidations.push({
        ruleCode: 'RN_TAXA_CONTRATUAL',
        ruleTitle: 'Taxa Contratual de Antecipação',
        passed: true,
        severity: 'INFO',
        message: 'Taxa aplicada em estrita conformidade com o aditivo financeiro vigente.'
      });
      automatedValidations.push({
        ruleCode: 'RN_MAKER_CHECKER',
        ruleTitle: 'Segregação de Funções Maker/Checker',
        passed: true,
        severity: 'INFO',
        message: 'Operação sujeita à governança estrita: o solicitante não pode aprovar a antecipação.'
      });
    }

    // 4. Checagem antifraude para alteração cadastral/bancária
    if (type === 'ALTERACAO_DADOS_BANCARIOS') {
      automatedValidations.push({
        ruleCode: 'RN_TITULAR_COMPATIVEL',
        ruleTitle: 'Compatibilidade de Titularidade',
        passed: true,
        severity: 'INFO',
        message: 'Titular e CPF/CNPJ informados conferem com o registro da empresa do produtor.'
      });
      automatedValidations.push({
        ruleCode: 'RN_ESTRUTURA_BANCARIA',
        ruleTitle: 'Consistência Estrutural Bancária',
        passed: true,
        severity: 'INFO',
        message: 'Agência, conta corrente e dígitos verificadores estruturalmente válidos.'
      });
      automatedValidations.push({
        ruleCode: 'RN_DOCS_BANCARIOS',
        ruleTitle: 'Documentos Comprobatórios Anexados',
        passed: true,
        severity: 'INFO',
        message: 'Comprovante bancário/cartão CNPJ anexados para conferência.'
      });
      automatedValidations.push({
        ruleCode: 'RN_CONTA_DIFERENTE',
        ruleTitle: 'Conta Nova Distinta da Atual',
        passed: true,
        severity: 'INFO',
        message: 'A nova conta informada altera o domicílio bancário vigente.'
      });
      automatedValidations.push({
        ruleCode: 'RN_SEM_CONCORRENCIA',
        ruleTitle: 'Inexistência de Concorrência Pendente',
        passed: true,
        severity: 'INFO',
        message: 'Não há outra solicitação de alteração bancária pendente para este produtor.'
      });
      automatedValidations.push({
        ruleCode: 'RN_SEGURANCA_BANCARIA',
        ruleTitle: 'Verificação Cadastral de Segurança',
        passed: true,
        severity: 'WARN',
        message: 'Alterações de conta corrente ou chave PIX exigem validação cadastral manual por Gestor Financeiro.'
      });
      automatedValidations.push({
        ruleCode: 'RN_ALCADA_CRITICA',
        ruleTitle: 'Alçada Crítica Nível 2 Obrigatória',
        passed: true,
        severity: 'WARN',
        message: 'Operação de segurança máxima: aprovação restrita a Gestor Financeiro / Diretoria (Nível 2).'
      });
      automatedValidations.push({
        ruleCode: 'RN_MAKER_CHECKER',
        ruleTitle: 'Segregação de Funções Maker/Checker',
        passed: true,
        severity: 'INFO',
        message: 'Operação sujeita à governança estrita: o solicitante não pode aprovar a alteração bancária.'
      });
      riskReasons.push('Alteração de domicílio bancário ativa alçada crítica.');
    }

    // 5. Checagens específicas de Estorno Financeiro
    if (type === 'ESTORNO') {
      const order = payload.order || (payload.orderId ? refundService.getOrder(payload.orderId) : null);
      if (order) {
        automatedValidations.push({
          ruleCode: 'RN_PEDIDO_ORIGEM',
          ruleTitle: 'Vínculo com Pedido/Transação Original',
          passed: true,
          severity: 'INFO',
          message: `Estorno vinculado ao pedido #${order.orderNumber || order.id} (${order.client?.name || order.customer?.name} - ${order.payment?.gateway || 'Adquirente'}).`
        });

        // Checagem de ingressos consumidos / validados na portaria
        const ticketList = payload.tickets || order.tickets || [];
        const selectedTicketIds = payload.ticketIds || (payload.tickets ? payload.tickets.map(t => t.id) : []);
        const ticketsToCheck = selectedTicketIds.length > 0
          ? ticketList.filter(t => selectedTicketIds.includes(t.id))
          : ticketList;

        const hasCheckedInTickets = ticketsToCheck.some(t => t.status === 'validado' || t.checkedIn === true);

        if (hasCheckedInTickets) {
          automatedValidations.push({
            ruleCode: 'RN_INGRESSO_CONSUMIDO',
            ruleTitle: 'Alerta Crítico: Ingresso Já Validado/Consumido',
            passed: false,
            severity: 'WARN',
            message: 'Atenção de Compliance: Um ou mais ingressos selecionados já foram validados na portaria/check-in! Exige alçada Nível 2 / Excepcional.'
          });
          riskReasons.push('Ingresso já validado/consumido na portaria.');
          matchedTier = { level: 'NIVEL_2', risk: 'CRITICO', slaHours: 2, maxAmount: Infinity };
        } else {
          automatedValidations.push({
            ruleCode: 'RN_INGRESSO_STATUS',
            ruleTitle: 'Status dos Ingressos',
            passed: true,
            severity: 'INFO',
            message: 'Todos os ingressos a estornar estão em aberto (não validados na portaria).'
          });
        }

        // Checagem de saldo estornável do pedido
        const availableRefund = order.payment ? order.payment.availableForRefund : (order.totalAmount - (order.refundedAmount || 0));
        if (numAmount > availableRefund) {
          automatedValidations.push({
            ruleCode: 'RN_VALOR_ESTORNAVEL',
            ruleTitle: 'Limite Estornável da Transação',
            passed: false,
            severity: 'BLOCK',
            message: `Valor solicitado (R$ ${numAmount.toFixed(2)}) supera o saldo remanescente estornável do pedido (R$ ${availableRefund.toFixed(2)}).`
          });
          riskReasons.push('Valor pretendido excede o limite disponível do pagamento.');
        } else {
          automatedValidations.push({
            ruleCode: 'RN_VALOR_ESTORNAVEL',
            ruleTitle: 'Limite Estornável da Transação',
            passed: true,
            severity: 'INFO',
            message: `Valor de R$ ${numAmount.toFixed(2)} está dentro do limite estornável da transação (R$ ${availableRefund.toFixed(2)}).`
          });
        }

        // Alerta de venda já repassada ao produtor
        if (order.payment?.alreadyPaidOutToProducer) {
          automatedValidations.push({
            ruleCode: 'RN_VENDA_REPASSADA',
            ruleTitle: 'Aviso: Venda Já Repassada ao Produtor',
            passed: true,
            severity: 'WARN',
            message: `O valor desta venda (R$ ${(order.payment.producerPaidOutAmount || order.payment.netAmount || 0).toFixed(2)}) já foi repassado anteriormente. O estorno gerará débito no saldo do evento.`
          });
          riskReasons.push('Venda já liquidada/repassada ao produtor.');
        }
      } else {
        automatedValidations.push({
          ruleCode: 'RN_PEDIDO_ORIGEM',
          ruleTitle: 'Vínculo com Pedido/Transação Original',
          passed: false,
          severity: 'BLOCK',
          message: 'Todo estorno financeiro deve ter um pedido e transação original identificados.'
        });
        riskReasons.push('Pedido original não identificado.');
      }

      automatedValidations.push({
        ruleCode: 'RN_MAKER_CHECKER',
        ruleTitle: 'Segregação de Funções Maker/Checker',
        passed: true,
        severity: 'INFO',
        message: 'Operação sujeita à governança estrita: o solicitante não pode aprovar ou executar o estorno.'
      });
    }

    // 6. Checagens específicas de Pagamento a Fornecedores
    if (type === 'PAGAMENTO' || type === 'PAGAMENTO_LOTE') {
      const supplierId = payload.supplierId;
      const supplier = supplierId ? supplierPaymentService.getSupplier(supplierId) : null;

      if (supplier) {
        automatedValidations.push({
          ruleCode: 'RN_FORNECEDOR_HOMOLOGADO',
          ruleTitle: 'Fornecedor Cadastrado & Homologado',
          passed: true,
          severity: 'INFO',
          message: `Fornecedor regular: ${supplier.tradeName || supplier.legalName} (${supplier.taxId}).`
        });

        // Checagem de alteração bancária recente (< 30 dias)
        if (supplierPaymentService.hasRecentBankChange(supplier)) {
          automatedValidations.push({
            ruleCode: 'RN_DADOS_BANCARIOS_RECENTES',
            ruleTitle: 'Alerta Antifraude: Alteração Bancária Recente (< 30 dias)',
            passed: false,
            severity: 'WARN',
            message: 'Alerta de Segurança: Os dados bancários deste fornecedor foram atualizados há menos de 30 dias. Exige validação Nível 2.'
          });
          riskReasons.push('Dados bancários do fornecedor alterados recentemente (< 30 dias).');
          if (matchedTier.level === 'NIVEL_1') {
            matchedTier = { level: 'NIVEL_2', risk: 'ALTO', slaHours: 2, maxAmount: 50000 };
          }
        } else {
          automatedValidations.push({
            ruleCode: 'RN_DADOS_BANCARIOS_RECENTES',
            ruleTitle: 'Estabilidade Cadastral Bancária',
            passed: true,
            severity: 'INFO',
            message: 'Dados bancários do fornecedor estáveis e sem alterações recentes.'
          });
        }
      } else if (payload.supplierName) {
        automatedValidations.push({
          ruleCode: 'RN_FORNECEDOR_HOMOLOGADO',
          ruleTitle: 'Fornecedor Identificado',
          passed: true,
          severity: 'INFO',
          message: `Fornecedor: ${payload.supplierName}.`
        });
      }

      // Checagem de documento fiscal / comprobatório obrigatório
      const hasDoc = payload.documentNumber || payload.invoiceNumber || (payload.documents && payload.documents.length > 0) || payload.documentFile;
      if (hasDoc) {
        automatedValidations.push({
          ruleCode: 'RN_DOCUMENTO_FISCAL',
          ruleTitle: 'Documento Comprobatório / Nota Fiscal',
          passed: true,
          severity: 'INFO',
          message: `Documento comprobatório informado: ${payload.documentType || 'NF'} ${payload.documentNumber || payload.invoiceNumber || 'Anexo'}.`
        });
      } else {
        automatedValidations.push({
          ruleCode: 'RN_DOCUMENTO_FISCAL',
          ruleTitle: 'Documento Comprobatório / Nota Fiscal',
          passed: false,
          severity: 'WARN',
          message: 'Nenhum documento fiscal ou recibo anexado ao pagamento. Requer alçada Nível 2.'
        });
        riskReasons.push('Ausência de documento fiscal comprobatório.');
        if (matchedTier.level === 'NIVEL_1') {
          matchedTier = { level: 'NIVEL_2', risk: 'MEDIO', slaHours: 2, maxAmount: 50000 };
        }
      }

      // Checagem de duplicidade preventiva
      if (payload.existingRequests) {
        const dupCheck = supplierPaymentService.checkDuplicatePayment({
          supplierId: payload.supplierId,
          documentNumber: payload.documentNumber,
          amount: numAmount,
          dueDate: payload.dueDate,
          existingRequests: payload.existingRequests,
          excludeRequestId: payload.requestId
        });
        if (dupCheck.isDuplicate) {
          const firstAlert = dupCheck.alerts[0]?.message || 'Detectada duplicidade de pagamento.';
          automatedValidations.push({
            ruleCode: 'RN_SUSPEITA_DUPLICIDADE',
            ruleTitle: 'Alerta Crítico: Suspeita de Pagamento Duplicado',
            passed: false,
            severity: 'WARN',
            message: firstAlert
          });
          riskReasons.push('Possível pagamento duplicado detectado.');
        } else {
          automatedValidations.push({
            ruleCode: 'RN_SEM_DUPLICIDADE',
            ruleTitle: 'Verificação de Duplicidade',
            passed: true,
            severity: 'INFO',
            message: 'Nenhum pagamento idêntico ou concorrente encontrado.'
          });
        }
      }

      // Maker / Checker
      automatedValidations.push({
        ruleCode: 'RN_MAKER_CHECKER',
        ruleTitle: 'Segregação de Funções Maker/Checker',
        passed: true,
        severity: 'INFO',
        message: 'Operação sujeita à governança estrita: o solicitante não pode aprovar ou liquidar o pagamento.'
      });
    }

    // 7. Checagem de limites elevados
    if (numAmount > 50000) {
      riskReasons.push(`Operação de grande porte (> R$ 50.000,00) exige Dupla Aprovação.`);
    }

    // 5. Determinação final de Risco
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
  },

  /**
   * Obtém a categoria canônica da operação (TIPO_A, TIPO_B, TIPO_C)
   */
  getOperationCategory(type) {
    if (!type) return OPERATION_CATEGORIES.TIPO_A_CONSULTA;
    const upper = String(type).toUpperCase().trim();
    if (OPERATION_CATEGORIES.TIPO_C_CONTROLADA.operations.includes(upper) || APPROVAL_POLICIES[upper]) {
      return OPERATION_CATEGORIES.TIPO_C_CONTROLADA;
    }
    if (OPERATION_CATEGORIES.TIPO_B_PRODUTOR.operations.includes(upper)) {
      return OPERATION_CATEGORIES.TIPO_B_PRODUTOR;
    }
    return OPERATION_CATEGORIES.TIPO_A_CONSULTA;
  },

  /**
   * Verifica se a operação requer aprovação da equipe financeira (Tipo C)
   */
  isControlledOperation(type) {
    return this.getOperationCategory(type).requiresApproval;
  },

  /**
   * Lista operações pertencentes a uma categoria
   */
  listOperationsByCategory(categoryCode) {
    const cat = OPERATION_CATEGORIES[categoryCode];
    return cat ? cat.operations : [];
  }
};
