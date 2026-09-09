/** Fase 26.17.9.2 — Dashboard sem valores hardcoded. */
import { accountingRealDataGateway } from './accountingRealDataGateway.js';
const EMPTY={period:null,kpis:null,evolution:[],thirdPartyFunds:null,reconciliation:null,revenueOrigins:[],gateways:[],upcomingPayouts:[],intelligence:[],featuredEvents:[],health:null};
function unwrap(x){if(!x)return null;return x.data&&typeof x.data==='object'&&!Array.isArray(x.data)?x.data:x;}
export class AccountingDashboardService{constructor(){this.lastResult=null;}async getDashboardData(params={}){const r=await accountingRealDataGateway.dashboard(params);if(!r.ok){return this.lastResult={status:'SEM_DADOS',source:'api',endpoint:'/api/accounting/dashboard',error:r.error,httpStatus:r.status,data:{...EMPTY}};}const d=unwrap(r.data);return this.lastResult={status:d?'OK':'SEM_DADOS',source:'api',endpoint:'/api/accounting/dashboard',error:null,httpStatus:r.status,data:d||{...EMPTY}};}async refresh(params={}){return this.getDashboardData({...params,_ts:Date.now()});}}
export const accountingDashboardService=new AccountingDashboardService();
