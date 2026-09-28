/**
 * ==========================================================================
 * CONTROLLER: CONSOLIDAÇÃO FINANCEIRA, TAXAS E CUSTOS (IMPLANTAÇÃO 5)
 * src/controllers/financialConsolidationController.js
 *
 * Responsável por gerenciar:
 * 1. Posição Financeira Geral (Visão Master Disk Interno)
 * 2. Saldos Consolidados e Detalhamento por Evento (Produtor & Disk)
 * 3. Taxas Disk & Custos de Meios de Pagamento (MDR, Adquirentes, Canais)
 * 4. Simulador de Composição Financeira e Histórico Versionado de Regras
 * ==========================================================================
 */

import { financialConsolidationService } from '../services/financialConsolidationService.js';
import { accessControlService } from '../services/accessControlService.js';
import { AppRouter } from '../navigation/router.js';

function formatCurrency(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(val) {
  const num = Number(val) || 0;
  return num.toFixed(2).replace('.', ',') + '%';
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return isoStr;
  }
}

export const financialConsolidationController = {
  initialized: false,
  currentEventFilter: 'TODOS',

  init() {
    if (this.initialized) return;
    this.bindEvents();
    this.initialized = true;
    console.log('[financialConsolidationController] Inicializado com sucesso.');
  },

  bindEvents() {
    if (typeof document === 'undefined') return;

    // --- POSIÇÃO GERAL ---
    const btnRefreshPosicao = document.getElementById('btn-refresh-posicao');
    if (btnRefreshPosicao) {
      btnRefreshPosicao.addEventListener('click', () => this.renderPosicaoGeral());
    }

    const btnApplyPosicaoFilter = document.getElementById('btn-apply-posicao-filter');
    if (btnApplyPosicaoFilter) {
      btnApplyPosicaoFilter.addEventListener('click', () => {
        const prod = document.getElementById('posicao-filter-producer')?.value || 'TODOS';
        const ev = document.getElementById('posicao-filter-event')?.value || 'TODOS';
        const ch = document.getElementById('posicao-filter-channel')?.value || 'TODOS';
        const pm = document.getElementById('posicao-filter-method')?.value || 'TODOS';
        this.renderPosicaoGeral({ producerId: prod, eventId: ev, channel: ch, paymentMethod: pm });
      });
    }

    const btnExportPosicao = document.getElementById('btn-export-posicao');
    if (btnExportPosicao) {
      btnExportPosicao.addEventListener('click', () => {
        alert('Exportação da Posição Financeira Geral iniciada (formato CSV/Excel).');
      });
    }

    // --- SALDOS ---
    const btnRefreshSaldos = document.getElementById('btn-refresh-saldos');
    if (btnRefreshSaldos) {
      btnRefreshSaldos.addEventListener('click', () => this.renderSaldos(this.currentEventFilter));
    }

    const saldosFilterEvent = document.getElementById('saldos-filter-event');
    if (saldosFilterEvent) {
      saldosFilterEvent.addEventListener('change', (e) => {
        this.currentEventFilter = e.target.value;
        this.renderSaldos(this.currentEventFilter);
      });
    }

    const btnSaldosTransfer = document.getElementById('btn-saldos-transfer');
    if (btnSaldosTransfer) {
      btnSaldosTransfer.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.AppRouter) {
          window.AppRouter.navigate('/financeiro/transferencias');
        }
      });
    }

    const btnSaldosPayout = document.getElementById('btn-saldos-payout');
    if (btnSaldosPayout) {
      btnSaldosPayout.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.AppRouter) {
          window.AppRouter.navigate('/financeiro/repasses');
        }
      });
    }

    const btnSaldosAdvance = document.getElementById('btn-saldos-advance');
    if (btnSaldosAdvance) {
      btnSaldosAdvance.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.AppRouter) {
          window.AppRouter.navigate('/financeiro/antecipacoes');
        }
      });
    }

    // --- TAXAS & CUSTOS ---
    const btnRefreshTaxas = document.getElementById('btn-refresh-taxas');
    if (btnRefreshTaxas) {
      btnRefreshTaxas.addEventListener('click', () => this.renderTaxasCustos());
    }

    const btnOpenFeeModal = document.getElementById('btn-open-fee-modal');
    if (btnOpenFeeModal) {
      btnOpenFeeModal.addEventListener('click', () => this.openConfigureFeeModal());
    }

    const formConfigureFee = document.getElementById('form-configure-fee-rule');
    if (formConfigureFee) {
      formConfigureFee.addEventListener('submit', (e) => this.handleSaveFeeRule(e));
    }

    const btnRunSim = document.getElementById('btn-run-composition-sim');
    if (btnRunSim) {
      btnRunSim.addEventListener('click', () => this.runCompositionSimulation());
    }
  },

  // ==========================================================================
  // 1. POSIÇÃO FINANCEIRA GERAL (VISÃO MASTER DISK INTERNO)
  // ==========================================================================
  renderPosicaoGeral(filters = {}) {
    const master = financialConsolidationService.getDiskMasterPosition(filters);
    if (!master) return;

    // Atualiza KPIs
    const elGross = document.getElementById('posicao-kpi-gross');
    if (elGross) elGross.textContent = formatCurrency(master.totals.grossSales);

    const elDiskRev = document.getElementById('posicao-kpi-disk-revenue');
    if (elDiskRev) elDiskRev.textContent = formatCurrency(master.totals.diskRevenue);

    const elCosts = document.getElementById('posicao-kpi-costs');
    if (elCosts) elCosts.textContent = formatCurrency(master.totals.paymentCosts);

    const elDiskMargin = document.getElementById('posicao-kpi-disk-margin');
    if (elDiskMargin) elDiskMargin.textContent = formatCurrency(master.totals.diskMargin);

    const elLiability = document.getElementById('posicao-kpi-producer-liability');
    if (elLiability) elLiability.textContent = formatCurrency(master.totals.producerFunds - master.totals.paidOut);

    const elReserves = document.getElementById('posicao-kpi-reserves');
    if (elReserves) elReserves.textContent = formatCurrency(master.totals.reserves + master.totals.chargebacks);

    const elCount = document.getElementById('posicao-events-count-badge');
    if (elCount) elCount.textContent = `${master.events.length} evento(s)`;

    // Atualiza Tabela Hierárquica em 3 Níveis (Master Disk -> Produtores -> Eventos)
    const tbody = document.getElementById('posicao-master-tbody');
    if (tbody) {
      if (master.events.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">Nenhum evento localizado com os filtros aplicados.</td></tr>`;
        return;
      }

      const hierarchy = financialConsolidationService.getConsolidatedHierarchy(filters);

      let rowsHtml = '';
      hierarchy.level2_producers.forEach(p => {
        // NÍVEL 2: Produtor (Subtotal Agregado)
        rowsHtml += `
          <tr class="table-light border-top border-primary" style="background-color: #f1f5f9; border-left: 4px solid #3b82f6 !important;">
            <td>
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-primary text-white"><i class="ph-buildings me-1"></i>Produtor</span>
                <span class="fw-bold text-dark">${p.producerName}</span>
                <span class="badge bg-secondary-subtle text-secondary rounded-pill fs-xxs">${p.events.length} evento(s)</span>
              </div>
            </td>
            <td class="text-end fw-bold text-dark">${formatCurrency(p.totals.grossSales)}</td>
            <td class="text-end fw-bold text-danger">-${formatCurrency(p.totals.diskFee)}</td>
            <td class="text-end fw-bold text-danger">-${formatCurrency(p.totals.paymentCosts)}</td>
            <td class="text-end fw-bold text-primary">${formatCurrency(p.totals.diskMargin)}</td>
            <td class="text-end fw-bold text-muted">-${formatCurrency(p.totals.refunds + p.totals.chargebacks)}</td>
            <td class="text-end fw-bold text-muted">-${formatCurrency(p.totals.paidOut)}</td>
            <td class="text-end fw-bold text-success">${formatCurrency(p.totals.availableBalance)}</td>
            <td class="text-center text-muted fs-xxs fw-bold">Subtotal</td>
          </tr>
        `;

        // NÍVEL 3: Eventos do Produtor
        p.events.forEach(ev => {
          const rule = financialConsolidationService.getFeeRule(ev.eventId);
          const badgeText = rule.feeType === 'FIXED_PER_TICKET'
            ? `R$ ${rule.rate.toFixed(2)}/ing`
            : `${rule.rate}%`;

          rowsHtml += `
            <tr class="border-bottom">
              <td style="padding-left: 28px;">
                <div class="d-flex align-items-center gap-1">
                  <span class="text-muted me-1">↳</span>
                  <div>
                    <span class="fw-semibold text-dark">${ev.eventName}</span>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle ms-1 fs-xxs" title="Taxa Disk parametrizada: ${badgeText}">${badgeText}</span>
                    <div class="fs-xxs text-muted">ID: #${ev.eventId} &bull; Status: ${ev.status === 'ACTIVE' ? 'Ativo' : 'Encerrado'}</div>
                  </div>
                </div>
              </td>
              <td class="text-end text-dark">${formatCurrency(ev.grossSales)}</td>
              <td class="text-end text-danger">-${formatCurrency(ev.diskFee)}</td>
              <td class="text-end text-danger">-${formatCurrency(ev.paymentCosts)}</td>
              <td class="text-end fw-semibold text-primary">${formatCurrency(ev.diskMargin)}</td>
              <td class="text-end text-muted">-${formatCurrency(ev.refunds + ev.chargebacks)}</td>
              <td class="text-end text-muted">-${formatCurrency(ev.paidOut)}</td>
              <td class="text-end fw-bold text-success">${formatCurrency(ev.availableBalance)}</td>
              <td class="text-center">
                <button type="button" class="btn btn-xs btn-outline-primary p-1" title="Ver Composição Detalhada" onclick="window.financialConsolidationController.openEventCompositionDrawer('${ev.eventId}')">
                  <i class="ph-tree-structure"></i>
                </button>
              </td>
            </tr>
          `;
        });
      });

      // NÍVEL 1: Master Disk Ingressos (Linha de Fechamento Consolidado)
      rowsHtml += `
        <tr class="table-dark text-white fw-bold border-top border-dark" style="background-color: #0f172a;">
          <td>
            <div class="d-flex align-items-center gap-2">
              <i class="ph-chart-pie-slice fs-5 text-warning"></i>
              <span>TOTAL CONSOLIDADO DISK INGRESSOS (MASTER)</span>
            </div>
          </td>
          <td class="text-end">${formatCurrency(master.totals.grossSales)}</td>
          <td class="text-end text-warning">-${formatCurrency(master.totals.diskRevenue)}</td>
          <td class="text-end text-danger">-${formatCurrency(master.totals.paymentCosts)}</td>
          <td class="text-end text-info">${formatCurrency(master.totals.diskMargin)}</td>
          <td class="text-end text-white-50">-${formatCurrency(master.totals.refunds + master.totals.chargebacks)}</td>
          <td class="text-end text-white-50">-${formatCurrency(master.totals.paidOut)}</td>
          <td class="text-end text-success">${formatCurrency(master.totals.availableBalance)}</td>
          <td class="text-center text-warning fs-xxs">MASTER</td>
        </tr>
      `;

      tbody.innerHTML = rowsHtml;
    }
  },

  // ==========================================================================
  // 2. SALDOS CONSOLIDADOS (PRODUTOR & DISK)
  // ==========================================================================
  renderSaldos(selectedEventId = 'TODOS') {
    const user = accessControlService.getCurrentUser();
    const isProducer = user && (user.profile === 'PRODUTOR_ADMINISTRADOR' || user.profile === 'PRODUTOR_FINANCEIRO');
    const producerId = isProducer ? (user.producerId || 'prod-1') : null;

    // Popula seletor de eventos se necessário
    const sel = document.getElementById('saldos-filter-event');
    if (sel && sel.options.length <= 1) {
      const allEvents = financialConsolidationService.getEventsInScope(producerId);
      sel.innerHTML = `<option value="TODOS">Todos os Eventos (Consolidado)</option>` +
        allEvents.map(e => `<option value="${e.eventId}">#${e.eventId} - ${e.eventName}</option>`).join('');
      sel.value = selectedEventId;
    }

    if (selectedEventId === 'TODOS') {
      const data = financialConsolidationService.getProducerConsolidatedBalance(producerId);

      const elAvail = document.getElementById('saldos-kpi-available');
      if (elAvail) elAvail.textContent = formatCurrency(data.totals.availableBalance);

      const elFuture = document.getElementById('saldos-kpi-future');
      if (elFuture) elFuture.textContent = formatCurrency(data.totals.futureReceivables);

      const elComm = document.getElementById('saldos-kpi-committed');
      if (elComm) elComm.textContent = formatCurrency(data.totals.committedFunds + data.totals.reserves);

      const elPaid = document.getElementById('saldos-kpi-paid');
      if (elPaid) elPaid.textContent = formatCurrency(data.totals.paidOut);

      const elCount = document.getElementById('saldos-events-count-badge');
      if (elCount) elCount.textContent = `${data.events.length} evento(s)`;

      const tbody = document.getElementById('saldos-events-tbody');
      if (tbody) {
        tbody.innerHTML = data.events.map(ev => {
          const rule = financialConsolidationService.getFeeRule(ev.eventId);
          const badgeText = rule.feeType === 'FIXED_PER_TICKET'
            ? `R$ ${rule.rate.toFixed(2)}/ing`
            : `${rule.rate}%`;

          return `
          <tr>
            <td>
              <div class="fw-bold text-dark">${ev.eventName}</div>
              <div class="fs-xxs text-muted">ID: #${ev.eventId} &bull; Produtor: ${ev.producerName}</div>
            </td>
            <td class="text-end">${formatCurrency(ev.grossSales)}</td>
            <td class="text-end text-danger">-${formatCurrency(ev.diskFee)} <span class="badge bg-primary-subtle text-primary border border-primary-subtle ms-1 fs-xxs" title="Taxa Disk: ${badgeText}">${badgeText}</span></td>
            <td class="text-end text-danger">-${formatCurrency(ev.paymentCosts)}</td>
            <td class="text-end text-muted">-${formatCurrency(ev.refunds + ev.chargebacks)}</td>
            <td class="text-end fw-semibold text-primary">${formatCurrency(ev.producerFunds)}</td>
            <td class="text-end text-muted">-${formatCurrency(ev.paidOut)}</td>
            <td class="text-end text-warning">-${formatCurrency(ev.committedFunds + ev.reserves)}</td>
            <td class="text-end fw-bold text-success">${formatCurrency(ev.availableBalance)}</td>
            <td class="text-center">
              <div class="btn-group btn-group-sm">
                <button type="button" class="btn btn-xs btn-outline-secondary p-1" title="Ver Composição" onclick="window.financialConsolidationController.openEventCompositionDrawer('${ev.eventId}')">
                  <i class="ph-list-magnifying-glass"></i>
                </button>
                <button type="button" class="btn btn-xs btn-outline-primary p-1" title="Transferir Saldo" onclick="window.AppRouter.navigate('/financeiro/transferencias')">
                  <i class="ph-arrows-left-right"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
        }).join('');
      }
    } else {
      // Visão de Evento Específico
      const ev = financialConsolidationService.getEventFinancialComposition(selectedEventId);
      if (!ev) return;

      const elAvail = document.getElementById('saldos-kpi-available');
      if (elAvail) elAvail.textContent = formatCurrency(ev.availableBalance);

      const elFuture = document.getElementById('saldos-kpi-future');
      if (elFuture) elFuture.textContent = formatCurrency(ev.futureReceivables);

      const elComm = document.getElementById('saldos-kpi-committed');
      if (elComm) elComm.textContent = formatCurrency(ev.committedFunds + ev.reserves);

      const elPaid = document.getElementById('saldos-kpi-paid');
      if (elPaid) elPaid.textContent = formatCurrency(ev.paidOut);

      const tbody = document.getElementById('saldos-events-tbody');
      if (tbody) {
        tbody.innerHTML = `
          <tr class="table-light">
            <td>
              <div class="fw-bold text-dark">${ev.eventName}</div>
              <div class="fs-xxs text-muted">ID: #${ev.eventId} &bull; Produtor: ${ev.producerName}</div>
            </td>
            <td class="text-end">${formatCurrency(ev.grossSales)}</td>
            <td class="text-end text-danger">-${formatCurrency(ev.diskFee)}</td>
            <td class="text-end text-danger">-${formatCurrency(ev.paymentCosts)}</td>
            <td class="text-end text-muted">-${formatCurrency(ev.refunds + ev.chargebacks)}</td>
            <td class="text-end fw-semibold text-primary">${formatCurrency(ev.producerFunds)}</td>
            <td class="text-end text-muted">-${formatCurrency(ev.paidOut)}</td>
            <td class="text-end text-warning">-${formatCurrency(ev.committedFunds + ev.reserves)}</td>
            <td class="text-end fw-bold text-success">${formatCurrency(ev.availableBalance)}</td>
            <td class="text-center">
              <button type="button" class="btn btn-xs btn-outline-secondary p-1" title="Ver Composição" onclick="window.financialConsolidationController.openEventCompositionDrawer('${ev.eventId}')">
                <i class="ph-list-magnifying-glass"></i>
              </button>
            </td>
          </tr>
        `;
      }
    }
  },

  // ==========================================================================
  // 3. TAXAS DISK & CUSTOS DE PAGAMENTO (DISK INTERNO)
  // ==========================================================================
  renderTaxasCustos() {
    const data = financialConsolidationService.getFeesAndCostsBreakdown();
    if (!data) return;

    // Atualiza KPIs
    const elAvgFee = document.getElementById('taxas-kpi-avg-fee');
    if (elAvgFee) elAvgFee.textContent = formatPercent(data.metrics.avgDiskFee);

    const elAvgCost = document.getElementById('taxas-kpi-avg-cost');
    if (elAvgCost) elAvgCost.textContent = formatPercent(data.metrics.avgPaymentCost);

    const elAvgSpread = document.getElementById('taxas-kpi-avg-spread');
    if (elAvgSpread) elAvgSpread.textContent = formatPercent(data.metrics.avgSpread);

    const elCount = document.getElementById('taxas-kpi-rules-count');
    if (elCount) elCount.textContent = `${data.rules.length} regra(s)`;

    // Tab 1: Regras
    const rulesTbody = document.getElementById('taxas-rules-tbody');
    if (rulesTbody) {
      rulesTbody.innerHTML = data.rules.map(r => `
        <tr>
          <td>
            <div class="fw-bold text-dark">${r.targetId === 'DEFAULT' ? 'Padrão Global Disk' : `Evento #${r.targetId}`}</div>
            <div class="fs-xxs text-muted">Criado por: ${r.updatedBy || 'Sistema'}</div>
          </td>
          <td>
            <span class="badge ${r.feeType === 'PERCENTAGE' || r.feeType === 'PERCENT' ? 'bg-primary' : (r.feeType === 'FIXED_EVENT' ? 'bg-purple text-white' : 'bg-info')}">
              ${r.feeType === 'PERCENTAGE' || r.feeType === 'PERCENT' ? 'Percentual (%)' : (r.feeType === 'FIXED_EVENT' ? 'Fixo por Evento' : 'Fixo por Ingresso')}
            </span>
          </td>
          <td class="text-end fw-bold">
            ${r.feeType === 'PERCENTAGE' || r.feeType === 'PERCENT' ? formatPercent(r.rate) : (r.feeType === 'FIXED_EVENT' ? formatCurrency(r.rate) + ' fixo' : formatCurrency(r.rate) + '/ing')}
          </td>
          <td>${r.calculationBase === 'GROSS_SALES' ? 'Vendas Brutas (GMV)' : 'Vendas Líquidas'}</td>
          <td class="text-muted">Min: ${r.minFee ? formatCurrency(r.minFee) : '-'} | Max: ${r.maxFee ? formatCurrency(r.maxFee) : '-'}</td>
          <td class="text-muted">${formatDate(r.effectiveFrom)}</td>
          <td class="text-center">
            <button class="btn btn-xs btn-outline-secondary p-1" onclick="window.financialConsolidationController.openConfigureFeeModal('${r.targetId}')">
              <i class="ph-pencil"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    // Tab 2: Custos
    const costsTbody = document.getElementById('taxas-costs-tbody');
    if (costsTbody) {
      costsTbody.innerHTML = data.paymentCosts.map(c => `
        <tr>
          <td><span class="badge bg-light text-dark border">${c.channel}</span></td>
          <td class="fw-semibold">${c.method}</td>
          <td><span class="fw-bold text-primary">${c.acquirer}</span></td>
          <td class="text-end">${formatPercent(c.mdr)}</td>
          <td class="text-end">${formatCurrency(c.fixedCost)}</td>
          <td class="text-end">${formatCurrency(c.antifraudCost)}</td>
          <td class="text-end fw-bold text-danger">${formatPercent(c.totalEstimatedPercent)}</td>
        </tr>
      `).join('');
    }

    // Tab 2: Quadro de Adquirência Real (Implantação 5.2: Cielo, Rede, Stone, PagBank)
    const acqTbody = document.getElementById('fin-acquirer-breakdown');
    if (acqTbody) {
      const acquirersData = [
        { name: 'CIELO', tx: 3420, gross: 420000.00, mdrRate: 2.49, mdrCost: 10458.00, netSettled: 409542.00 },
        { name: 'REDE', tx: 2180, gross: 280000.00, mdrRate: 2.80, mdrCost: 7840.00, netSettled: 272160.00 },
        { name: 'STONE', tx: 1650, gross: 190000.00, mdrRate: 2.15, mdrCost: 4085.00, netSettled: 185915.00 },
        { name: 'PAGBANK', tx: 890, gross: 110000.00, mdrRate: 3.20, mdrCost: 3520.00, netSettled: 106480.00 }
      ];
      acqTbody.innerHTML = acquirersData.map(a => `
        <tr>
          <td><strong>${a.name}</strong></td>
          <td class="text-end">${a.tx.toLocaleString('pt-BR')}</td>
          <td class="text-end">${formatCurrency(a.gross)}</td>
          <td class="text-end">${formatPercent(a.mdrRate)}</td>
          <td class="text-end text-danger">-${formatCurrency(a.mdrCost)}</td>
          <td class="text-end fw-bold text-success">${formatCurrency(a.netSettled)}</td>
        </tr>
      `).join('');
    }

    // Tab 4: Histórico
    const histTbody = document.getElementById('taxas-history-tbody');
    if (histTbody) {
      histTbody.innerHTML = data.history.map(h => `
        <tr>
          <td><span class="badge bg-secondary">v${h.version}</span></td>
          <td class="text-muted">${formatDate(h.timestamp)}</td>
          <td class="fw-semibold">${h.actorName}</td>
          <td>${h.targetId === 'DEFAULT' ? 'Global' : `Evento #${h.targetId}`}</td>
          <td>${h.feeType}</td>
          <td class="text-end text-muted">${h.previousRate !== null ? (h.feeType === 'PERCENTAGE' ? formatPercent(h.previousRate) : formatCurrency(h.previousRate)) : '-'}</td>
          <td class="text-end fw-bold text-success">${h.feeType === 'PERCENTAGE' ? formatPercent(h.newRate) : formatCurrency(h.newRate)}</td>
          <td class="fs-xxs text-muted">${h.reason}</td>
        </tr>
      `).join('');
    }

    // Executa simulação inicial
    this.runCompositionSimulation();
  },

  runCompositionSimulation() {
    const eventId = document.getElementById('sim-event-select')?.value || '3368';
    const gross = Number(document.getElementById('sim-gross-amount')?.value) || 1000000;
    const tickets = Number(document.getElementById('sim-ticket-count')?.value) || 10000;
    const refunds = Number(document.getElementById('sim-refunds-amount')?.value) || 30000;
    const chargebacks = Number(document.getElementById('sim-chargeback-amount')?.value) || 5000;

    // Obtém regra da taxa
    const rule = financialConsolidationService.getFeeRule(eventId);
    const feeCalculation = financialConsolidationService.calculateDiskFee(gross, rule, tickets);
    const costsCalc = financialConsolidationService.calculatePaymentCosts(gross, tickets);

    const producerFunds = Math.round((gross - feeCalculation.diskFee - costsCalc.totalCosts - refunds - chargebacks) * 100) / 100;

    const list = document.getElementById('sim-composition-results-list');
    if (list) {
      list.innerHTML = `
        <li class="list-group-item d-flex justify-content-between align-items-center py-2">
          <span><strong>1. Vendas Brutas (GMV):</strong></span>
          <span class="fw-bold text-dark fs-6">${formatCurrency(gross)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center py-2 bg-light">
          <span>(-) Taxa da Plataforma Disk (${rule.feeType === 'PERCENTAGE' || rule.feeType === 'PERCENT' ? formatPercent(rule.rate) : (rule.feeType === 'FIXED_EVENT' ? formatCurrency(rule.rate) + ' fixo' : formatCurrency(rule.rate) + '/ing')}):</span>
          <span class="text-danger fw-semibold">-${formatCurrency(feeCalculation.diskFee)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center py-2 bg-light">
          <span>(-) Custos Meios Pagto (MDR + Gateway + Antifraude):</span>
          <span class="text-danger fw-semibold">-${formatCurrency(costsCalc.totalCosts)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center py-2">
          <span>(-) Estornos Solicitados:</span>
          <span class="text-danger">-${formatCurrency(refunds)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center py-2">
          <span>(-) Chargebacks Registrados:</span>
          <span class="text-danger">-${formatCurrency(chargebacks)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center py-2 table-info">
          <span><strong>(=) Recursos Líquidos do Produtor:</strong></span>
          <span class="fw-bold text-primary fs-6">${formatCurrency(producerFunds)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center py-2 table-success">
          <span><strong>Margem Líquida Disk (Taxa - Custos MDR):</strong></span>
          <span class="fw-bold text-success fs-6">${formatCurrency(feeCalculation.diskFee - costsCalc.totalCosts)} (${formatPercent(((feeCalculation.diskFee - costsCalc.totalCosts) / gross) * 100)})</span>
        </li>
      `;
    }
  },

  openConfigureFeeModal(targetId = 'DEFAULT') {
    const sel = document.getElementById('modal-fee-target');
    if (sel) sel.value = targetId;

    const rule = financialConsolidationService.getFeeRule(targetId);
    const typeInput = document.getElementById('modal-fee-type');
    if (typeInput) typeInput.value = rule.feeType;

    const rateInput = document.getElementById('modal-fee-rate');
    if (rateInput) rateInput.value = rule.rate;

    const baseInput = document.getElementById('modal-fee-base');
    if (baseInput) baseInput.value = rule.calculationBase;

    const reasonInput = document.getElementById('modal-fee-reason');
    if (reasonInput) reasonInput.value = '';

    if (typeof window !== 'undefined' && window.bootstrap && window.bootstrap.Modal) {
      const modalEl = document.getElementById('modal-configure-fee-rule');
      if (modalEl) {
        const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    }
  },

  handleSaveFeeRule(e) {
    if (e && e.preventDefault) e.preventDefault();

    const targetId = document.getElementById('modal-fee-target')?.value || 'DEFAULT';
    const feeType = document.getElementById('modal-fee-type')?.value || 'PERCENTAGE';
    const rate = Number(document.getElementById('modal-fee-rate')?.value) || 15;
    const calculationBase = document.getElementById('modal-fee-base')?.value || 'GROSS_SALES';
    const reason = document.getElementById('modal-fee-reason')?.value || 'Ajuste manual de taxa comercial';

    const user = accessControlService.getCurrentUser();
    const result = financialConsolidationService.setFeeRule({
      targetId,
      feeType,
      rate,
      calculationBase,
      reason,
      actor: user || { id: 'usr-admin', name: 'Administrador' }
    });

    if (result && result.ok) {
      if (typeof window !== 'undefined' && window.bootstrap && window.bootstrap.Modal) {
        const modalEl = document.getElementById('modal-configure-fee-rule');
        if (modalEl) {
          const modal = window.bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }
      }
      alert(`Regra de taxa salva com sucesso para ${targetId === 'DEFAULT' ? 'o padrão da plataforma' : `o evento #${targetId}`}!`);
      this.renderTaxasCustos();
      this.renderPosicaoGeral();
    }
  },

  openEventCompositionDrawer(eventId) {
    const comp = financialConsolidationService.getEventFinancialComposition(eventId);
    if (!comp) return;

    const drawerTitle = document.getElementById('composition-drawer-title');
    if (drawerTitle) drawerTitle.textContent = `Composição: #${comp.eventId} - ${comp.eventName}`;

    const badge = document.getElementById('comp-rule-badge');
    if (badge) {
      badge.textContent = comp.feeRule.feeType === 'PERCENTAGE' 
        ? `Taxa ${formatPercent(comp.feeRule.rate)}` 
        : `Taxa Fixa ${formatCurrency(comp.feeRule.rate)}/ing`;
    }

    const setRow = (id, val, isNeg = false) => {
      const el = document.getElementById(id);
      if (el) el.textContent = (isNeg ? '- ' : '') + formatCurrency(val);
    };

    setRow('comp-row-gross', comp.grossSales);
    setRow('comp-row-disk-fee', comp.diskFee, true);
    setRow('comp-row-costs', comp.paymentCosts, true);
    setRow('comp-row-refunds', comp.refunds, true);
    setRow('comp-row-chargebacks', comp.chargebacks, true);
    setRow('comp-row-producer-funds', comp.producerFunds);
    setRow('comp-row-paid', comp.paidOut, true);
    setRow('comp-row-reserves', comp.reserves, true);
    setRow('comp-row-committed', comp.committedFunds, true);
    setRow('comp-row-available', comp.availableBalance);

    if (typeof window !== 'undefined' && window.bootstrap && window.bootstrap.Modal) {
      const modalEl = document.getElementById('modal-financial-composition-drawer');
      if (modalEl) {
        const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.financialConsolidationController = financialConsolidationController;
}
