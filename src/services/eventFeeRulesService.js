/**
 * Implantação 5.1 — Motor de Taxas por Evento
 * Regra versionada por evento/produtor com vigência, memória de cálculo e auditoria local.
 * A persistência local é fallback; backend/Core deve substituir esta camada quando disponível.
 */
const STORAGE_KEY = 'disk:event-fee-rules:v1';
const AUDIT_KEY = 'disk:event-fee-rules:audit:v1';

const round2 = (n) => Number((Number(n || 0)).toFixed(2));
const nowIso = () => new Date().toISOString();

const DEFAULT_RULES = [
  { id:'FEE-3368-V1', eventId:'3368', producerId:'prod-1', type:'PERCENT', value:10, base:'GROSS_SALES', effectiveFrom:'2026-01-01', effectiveTo:null, active:true },
  { id:'FEE-3195-V1', eventId:'3195', producerId:'prod-1', type:'PERCENT', value:10, base:'GROSS_SALES', effectiveFrom:'2026-01-01', effectiveTo:null, active:true },
  { id:'FEE-934-V1', eventId:'934', producerId:'prod-1', type:'PERCENT', value:10, base:'GROSS_SALES', effectiveFrom:'2026-01-01', effectiveTo:null, active:true },
  { id:'FEE-1360-V1', eventId:'1360', producerId:'prod-1', type:'PERCENT', value:10, base:'GROSS_SALES', effectiveFrom:'2026-01-01', effectiveTo:null, active:true },
  { id:'FEE-843-V1', eventId:'843', producerId:'prod-1', type:'PERCENT', value:10, base:'GROSS_SALES', effectiveFrom:'2026-01-01', effectiveTo:null, active:true },
  { id:'FEE-1500-V1', eventId:'1500', producerId:'prod-1', type:'PERCENT', value:10, base:'GROSS_SALES', effectiveFrom:'2026-01-01', effectiveTo:null, active:true },
  { id:'FEE-GLOBAL-V1', eventId:null, producerId:null, type:'PERCENT', value:10, base:'GROSS_SALES', effectiveFrom:'2026-01-01', effectiveTo:null, active:true }
];

function load(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallback)); }
  catch (_) { return JSON.parse(JSON.stringify(fallback)); }
}
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
function dateInRange(rule, at) {
  const d = String(at || new Date().toISOString().slice(0,10)).slice(0,10);
  return (!rule.effectiveFrom || d >= rule.effectiveFrom) && (!rule.effectiveTo || d <= rule.effectiveTo);
}
function specificity(rule, eventId, producerId) {
  if (rule.eventId && String(rule.eventId) === String(eventId)) return 1;
  if (!rule.eventId && rule.producerId && String(rule.producerId) === String(producerId)) return 2;
  if (!rule.eventId && !rule.producerId) return 3;
  return 99;
}
function validate(rule) {
  const types = ['PERCENT','FIXED_PER_TICKET','FIXED_EVENT'];
  if (!types.includes(rule.type)) throw new Error('Tipo de taxa inválido.');
  if (!(Number(rule.value) >= 0)) throw new Error('Valor da taxa inválido.');
  if (rule.type === 'PERCENT' && Number(rule.value) > 100) throw new Error('Percentual não pode ser maior que 100%.');
  if (!rule.effectiveFrom) throw new Error('Data inicial de vigência é obrigatória.');
  if (rule.effectiveTo && rule.effectiveTo < rule.effectiveFrom) throw new Error('Fim da vigência anterior ao início.');
}

export const eventFeeRulesService = {
  list() { return load(STORAGE_KEY, DEFAULT_RULES).sort((a,b)=>String(b.effectiveFrom).localeCompare(String(a.effectiveFrom))); },
  audit() { return load(AUDIT_KEY, []); },
  resolve({ eventId, producerId, at }) {
    return this.list().filter(r => r.active !== false && dateInRange(r, at) && specificity(r,eventId,producerId) < 99)
      .sort((a,b) => specificity(a,eventId,producerId)-specificity(b,eventId,producerId) || String(b.effectiveFrom).localeCompare(String(a.effectiveFrom)))[0] || null;
  },
  calculate({ eventId, producerId, grossSales=0, ticketCount=0, at }) {
    const rule = this.resolve({eventId,producerId,at});
    if (!rule) return { amount:0, rule:null, label:'Sem regra vigente', baseAmount:round2(grossSales) };
    let amount = 0;
    if (rule.type === 'PERCENT') amount = Number(grossSales) * Number(rule.value) / 100;
    if (rule.type === 'FIXED_PER_TICKET') amount = Number(ticketCount) * Number(rule.value);
    if (rule.type === 'FIXED_EVENT') amount = Number(rule.value);
    const label = rule.type === 'PERCENT' ? `${Number(rule.value).toLocaleString('pt-BR')}% sobre vendas` : rule.type === 'FIXED_PER_TICKET' ? `${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(rule.value)} por ingresso` : `${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(rule.value)} fixo por evento`;
    return { amount:round2(amount), rule, label, baseAmount:round2(grossSales), ticketCount:Number(ticketCount||0) };
  },
  upsert(input, actor='Financeiro Disk') {
    validate(input);
    const rules = this.list();
    const scopeEvent = input.eventId ? String(input.eventId) : null;
    const scopeProducer = input.producerId || null;
    // Encerra somente regra ativa do mesmo escopo para preservar histórico.
    rules.forEach(r => {
      if (r.active !== false && String(r.eventId||'') === String(scopeEvent||'') && String(r.producerId||'') === String(scopeProducer||'')) {
        if (r.effectiveFrom <= input.effectiveFrom) { r.effectiveTo = input.effectiveFrom; r.active = false; }
      }
    });
    const created = { ...input, id: input.id || `FEE-${scopeEvent || scopeProducer || 'GLOBAL'}-${Date.now()}`, eventId:scopeEvent, producerId:scopeProducer, value:Number(input.value), active:true, createdAt:nowIso(), createdBy:actor };
    rules.unshift(created); save(STORAGE_KEY,rules);
    const audit = this.audit(); audit.unshift({id:`AUD-FEE-${Date.now()}`,at:nowIso(),actor,action:'FEE_RULE_CREATED',ruleId:created.id,eventId:created.eventId,producerId:created.producerId,type:created.type,value:created.value,effectiveFrom:created.effectiveFrom}); save(AUDIT_KEY,audit);
    return created;
  }
};

if (typeof window !== 'undefined') {
  window.eventFeeRulesService = eventFeeRulesService;
}
