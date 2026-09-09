
/**
 * Fase 26.17.8.7 — Auditoria & Compliance Contábil
 * Serviço integrado ao PDT atual (JavaScript/DOM).
 * Persistência local temporária até existir backend corporativo de auditoria.
 */
const STORAGE_KEY = 'disk_accounting_audit_compliance_v1';

const DEFAULT_EXCEPTIONS = [
  { id:'exc-001', title:'Reabertura de competência após fechamento', category:'Fechamento', risk:'CRITICO', status:'EM_ANALISE', owner:'Controladoria', dueDate:'12/09/2026', amount:0, description:'Revisar justificativa e lançamentos realizados após reabertura.' },
  { id:'exc-002', title:'Ajuste manual de conciliação acima do limite', category:'Conciliação', risk:'ALTO', status:'ABERTA', owner:'Financeiro', dueDate:'11/09/2026', amount:34210, description:'Validar evidência e aprovação por segundo responsável.' }
];

function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch (_) {}
  return { events: [], exceptions: DEFAULT_EXCEPTIONS };
}
function saveState(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} }

class AuditComplianceService {
  getOverview() {
    const state = loadState();
    const events = state.events || [];
    const exceptions = state.exceptions || [];
    return {
      totalEvents: events.length,
      manualChanges: events.filter(e => /MANUAL|ALTERACAO/.test(e.action || '')).length,
      reopenedPeriods: events.filter(e => e.action === 'REABERTURA_PERIODO').length,
      openExceptions: exceptions.filter(e => e.status !== 'ENCERRADA').length,
      criticalRisks: exceptions.filter(e => e.risk === 'CRITICO' && e.status !== 'ENCERRADA').length,
      pendingApprovals: exceptions.filter(e => e.status === 'EM_ANALISE').length,
      controlsSatisfied: Math.max(0, 100 - exceptions.filter(e => e.status !== 'ENCERRADA').length * 2)
    };
  }
  getEvents() { return loadState().events || []; }
  getExceptions() { return loadState().exceptions || []; }
  appendEvent(event) {
    const state = loadState();
    state.events = state.events || [];
    const record = { id:`aud-${Date.now()}`, occurredAt:new Date().toISOString(), risk:'MEDIO', ...event };
    state.events.unshift(record);
    saveState(state);
    return record;
  }
}
export const auditComplianceService = new AuditComplianceService();
