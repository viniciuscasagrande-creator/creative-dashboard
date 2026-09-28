import assert from 'node:assert/strict';
import { eventFeeRulesService } from '../src/services/eventFeeRulesService.js';
const pct = eventFeeRulesService.calculate({eventId:'3368',producerId:'prod-1',grossSales:1000000,ticketCount:10000,at:'2026-09-28'});
assert.equal(pct.amount,100000);
assert.equal(pct.rule.type,'PERCENT');
const fallback = eventFeeRulesService.calculate({eventId:'99999',producerId:'unknown',grossSales:1000000,ticketCount:1,at:'2026-09-28'});
assert.equal(fallback.amount,100000);
console.log('eventFeeRulesService: OK', {percentual: pct.amount, fallbackGlobal: fallback.amount});
