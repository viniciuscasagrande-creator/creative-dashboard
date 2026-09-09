
/**
 * Fase 26.17.8.8 — Disk Intelligence Contábil
 * Motor híbrido: regras determinísticas + recomendações explicáveis.
 * Não executa automaticamente repasse, estorno, fechamento ou lançamento crítico.
 */
import reconciliationService from './reconciliationService.js';
import { closingService } from './closingService.js';
import { balanceSheetService } from './balanceSheetService.js';
import { auditComplianceService } from './auditComplianceService.js';

class AccountingIntelligenceService {
  async getOverview() {
    const reconciliation = await reconciliationService.getOverview();
    const closing = closingService.getClosingState();
    const balance = balanceSheetService.getBalanceSheet('ADMIN');
    const compliance = auditComplianceService.getOverview();
    const divergentAmount = reconciliation?.divergentAmount || 0;
    const criticalIssues = closing?.checks ? closing.checks.filter(c => c.status === 'PENDENTE' && ['BLOQUEANTE','CRITICA'].includes(c.severity)).length : 0;
    const insights = [];

    if (divergentAmount > 0) insights.push({
      id:'intel-recon', type:divergentAmount > 30000 ? 'CRITICO' : 'ATENCAO',
      priority:divergentAmount > 30000 ? 'CRITICA' : 'ALTA',
      title:'Divergências financeiras exigem análise',
      description:`Há ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(divergentAmount)} em divergências no Centro de Conciliação.`,
      confidence:1, financialImpact:divergentAmount, sourceModules:['Centro de Conciliação'],
      recommendedAction:'Abrir o Centro de Conciliação e tratar as divergências antes do próximo ciclo de repasse.'
    });

    if (criticalIssues > 0) insights.push({
      id:'intel-close', type:'CRITICO', priority:'CRITICA',
      title:'Fechamento com pendências críticas',
      description:`${criticalIssues} item(ns) crítico(s) ainda impedem um fechamento seguro.`,
      confidence:1, financialImpact:0, sourceModules:['Fechamento Contábil'],
      recommendedAction:'Revisar o checklist do fechamento e resolver itens bloqueantes.'
    });

    if (balance && balance.success && !balance.isBalanced) insights.push({
      id:'intel-balance', type:'CONTABIL', priority:'CRITICA',
      title:'Balanço patrimonial fora de integridade',
      description:'Ativo difere de Passivo + Patrimônio Líquido.',
      confidence:1, financialImpact:Math.abs(balance.difference || 0), sourceModules:['Balanço Patrimonial'],
      recommendedAction:'Abrir o Balanço Patrimonial e localizar a origem da diferença.'
    });

    if ((compliance.criticalRisks || 0) > 0) insights.push({
      id:'intel-compliance', type:'ATENCAO', priority:'ALTA',
      title:'Exceções críticas de compliance abertas',
      description:`Existem ${compliance.criticalRisks} exceção(ões) crítica(s) de compliance sem encerramento.`,
      confidence:1, financialImpact:0, sourceModules:['Auditoria & Compliance'],
      recommendedAction:'Abrir Auditoria & Compliance e revisar as exceções.'
    });

    if (!insights.length) insights.push({
      id:'intel-ok', type:'OPORTUNIDADE', priority:'BAIXA',
      title:'Nenhuma anomalia crítica detectada pelas regras atuais',
      description:'Os controles determinísticos não encontraram condição crítica neste momento.',
      confidence:1, financialImpact:0, sourceModules:['Conciliação','Fechamento','Balanço','Compliance'],
      recommendedAction:'Manter o acompanhamento dos indicadores e do fechamento.'
    });

    const penalty = Math.min(35, (reconciliation?.totalDivergent ? 8 : 0) + criticalIssues*8 + (compliance.criticalRisks || 0)*5);
    return {
      activeAlerts:insights.filter(i=>i.type!=='OPORTUNIDADE').length,
      criticalRisks:insights.filter(i=>i.priority==='CRITICA').length,
      financialValueAtRisk:insights.reduce((s,i)=>s+(i.financialImpact||0),0),
      predictedDivergences:reconciliation?.divergentAmount ? Math.max(1,Math.round(reconciliation.divergentAmount/2500)) : 0,
      suggestedReconciliations:reconciliation?.totalDivergent || 0,
      pendingEntries:criticalIssues,
      payoutsAtRisk:reconciliation?.payoutDifferences || 0,
      accountingHealthScore:Math.max(0,100-penalty),
      insights
    };
  }
}
export const accountingIntelligenceService = new AccountingIntelligenceService();
