/**
 * ============================================================================
 * CONTROLLER: FECHAMENTO FINANCEIRO POR EVENTO (IMPLANTAÇÃO 5.3)
 * src/controllers/financialClosingController.js
 * 
 * Gerencia a visão detalhada de Fechamento Financeiro:
 * - Filtros: Evento, Período, Status
 * - 12 Indicadores Estratégicos
 * - 8 Abas Analíticas com Rastreabilidade
 * - Workflow de Homologação (Disk & Produtor)
 * - Emissão de Relatório Oficial de Fechamento (PDF/Impressão)
 * ============================================================================
 */

import { financialClosingService, CLOSING_STATUSES } from '../services/financialClosingService.js';
import { accessControlService } from '../services/accessControlService.js';

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

export const financialClosingController = {
  initialized: false,
  currentClosingId: 'CLOSE-EV-5096-2026',

  init() {
    if (this.initialized) return;
    this.bindEvents();
    this.initialized = true;
    console.log('[financialClosingController] Inicializado com sucesso.');
  },

  bindEvents() {
    if (typeof document === 'undefined') return;

    const eventSelect = document.getElementById('closing-filter-event');
    if (eventSelect) {
      eventSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const closing = val === 'ALL'
          ? financialClosingService.getClosings()[0]
          : financialClosingService.getClosingByEventId(val);
        if (closing) {
          this.currentClosingId = closing.closingId;
          this.render();
        }
      });
    }

    const btnPrint = document.getElementById('btn-print-closing-report');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => this.printClosingReport());
    }

    const btnDiskApprove = document.getElementById('btn-closing-approve-disk');
    if (btnDiskApprove) {
      btnDiskApprove.addEventListener('click', () => this.handleDiskApprove());
    }

    const btnProducerAccept = document.getElementById('btn-closing-accept-producer');
    if (btnProducerAccept) {
      btnProducerAccept.addEventListener('click', () => this.handleProducerAccept());
    }
  },

  render() {
    const closing = financialClosingService.getClosingById(this.currentClosingId);
    if (!closing) return;

    this.renderHeader(closing);
    this.renderKpis(closing);
    this.renderTabResumo(closing);
    this.renderTabVendas(closing);
    this.renderTabPagamentos(closing);
    this.renderTabTaxas(closing);
    this.renderTabEstornos(closing);
    this.renderTabRepasses(closing);
    this.renderTabConciliacao(closing);
    this.renderTabHistorico(closing);
  },

  renderHeader(closing) {
    const titleEl = document.getElementById('closing-header-title');
    if (titleEl) titleEl.textContent = `Fechamento: ${closing.eventName} (#${closing.eventId})`;

    const periodEl = document.getElementById('closing-header-period');
    if (periodEl) periodEl.textContent = `Período: ${closing.period} • Produtor: ${closing.producerName} • Versão ${closing.version}`;

    const badgeEl = document.getElementById('closing-header-status-badge');
    if (badgeEl) {
      const cfg = CLOSING_STATUSES[closing.status] || { label: closing.status, badgeClass: 'bg-secondary' };
      badgeEl.className = `badge ${cfg.badgeClass} fs-xs px-2 py-1`;
      badgeEl.textContent = cfg.label;
    }

    // Botões de ação
    const btnDisk = document.getElementById('btn-closing-approve-disk');
    if (btnDisk) {
      btnDisk.disabled = closing.approvals.diskApproved;
      btnDisk.innerHTML = closing.approvals.diskApproved
        ? '<i class="ph-check-circle me-1"></i> Aprovado pelo Disk'
        : '<i class="ph-seal-check me-1"></i> Aprovar Fechamento (Disk)';
    }

    const btnProd = document.getElementById('btn-closing-accept-producer');
    if (btnProd) {
      btnProd.disabled = closing.approvals.producerAccepted;
      btnProd.innerHTML = closing.approvals.producerAccepted
        ? '<i class="ph-check-circle me-1"></i> Aceite Confirmado'
        : '<i class="ph-signature me-1"></i> Confirmar Ciência (Produtor)';
    }
  },

  renderKpis(closing) {
    const f = closing.financials;
    const t = closing.tickets;

    const setKpi = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setKpi('closing-kpi-gross', formatCurrency(f.grossSales));
    setKpi('closing-kpi-sold', t.sold.toLocaleString('pt-BR'));
    setKpi('closing-kpi-complimentary', t.complimentary.toLocaleString('pt-BR'));
    setKpi('closing-kpi-tickets-total', t.total.toLocaleString('pt-BR'));

    setKpi('closing-kpi-disk-fee', `-${formatCurrency(f.diskFeeAmount)}`);
    setKpi('closing-kpi-acquiring', `-${formatCurrency(f.acquiringCosts)}`);
    setKpi('closing-kpi-refunds', `-${formatCurrency(f.refunds)}`);
    setKpi('closing-kpi-chargebacks', `-${formatCurrency(f.chargebacks)}`);

    setKpi('closing-kpi-expenses', formatCurrency(f.otherCosts));
    setKpi('closing-kpi-net', formatCurrency(f.producerNetRevenue));
    setKpi('closing-kpi-paid', formatCurrency(f.paidPayouts));
    setKpi('closing-kpi-pending', formatCurrency(f.pendingPayoutBalance));
  },

  renderTabResumo(closing) {
    const tbody = document.getElementById('closing-resumo-tbody');
    if (!tbody) return;

    const f = closing.financials;
    tbody.innerHTML = `
      <tr>
        <td class="fw-bold"><i class="ph-arrow-fat-right text-primary me-2"></i> (+) Vendas Brutas (GMV)</td>
        <td class="text-end fw-bold text-dark fs-6">${formatCurrency(f.grossSales)}</td>
        <td class="text-muted fs-xxs">476 ingressos vendidos + 38 cortesias (514 total)</td>
      </tr>
      <tr class="table-light">
        <td class="ps-4 text-danger">(-) Estornos Efetivamente Processados</td>
        <td class="text-end text-danger">-${formatCurrency(f.refunds)}</td>
        <td class="text-muted fs-xxs">Devoluções processadas via gateway / PIX</td>
      </tr>
      <tr class="table-light">
        <td class="ps-4 text-danger">(-) Chargebacks e Disputas</td>
        <td class="text-end text-danger">-${formatCurrency(f.chargebacks)}</td>
        <td class="text-muted fs-xxs">Nenhuma contestação pendente</td>
      </tr>
      <tr class="table-primary-subtle fw-semibold">
        <td class="ps-2">(=) Base Financeira Ajustada</td>
        <td class="text-end text-primary">${formatCurrency(f.adjustedBase)}</td>
        <td class="text-muted fs-xxs">Vendas deduzidas de reversões</td>
      </tr>
      <tr>
        <td class="ps-4 text-warning fw-semibold">(-) Taxa DiskIngressos (Contrato)</td>
        <td class="text-end text-warning fw-semibold">-${formatCurrency(f.diskFeeAmount)}</td>
        <td class="text-muted fs-xxs">${f.diskFeeRate}% contratual sobre vendas brutas</td>
      </tr>
      <tr>
        <td class="ps-4 text-danger">(-) Custos de Adquirência & Gateway (MDR)</td>
        <td class="text-end text-danger">-${formatCurrency(f.acquiringCosts)}</td>
        <td class="text-muted fs-xxs">Cielo, Rede, Stone (MDR real retido)</td>
      </tr>
      <tr class="table-success-subtle fw-bold">
        <td class="ps-2"><i class="ph-equals me-2 text-success"></i> (=) Valor Líquido do Produtor</td>
        <td class="text-end text-success fs-6">${formatCurrency(f.producerNetRevenue)}</td>
        <td class="text-muted fs-xxs">Resultado líquido disponível do evento</td>
      </tr>
      <tr>
        <td class="ps-4 text-muted">(-) Repasses Bancários Liquidados</td>
        <td class="text-end text-muted">-${formatCurrency(f.paidPayouts)}</td>
        <td class="text-muted fs-xxs">2 lotes liquidados via PIX e TED</td>
      </tr>
      <tr class="table-warning-subtle fw-bold">
        <td class="ps-2"><i class="ph-wallet me-2 text-warning"></i> (=) Saldo a Repassar (Pendente)</td>
        <td class="text-end text-warning fs-6">${formatCurrency(f.pendingPayoutBalance)}</td>
        <td class="text-muted fs-xxs">Saldo em custódia pronto para liquidação</td>
      </tr>
    `;
  },

  renderTabVendas(closing) {
    const tbody = document.getElementById('closing-vendas-tbody');
    if (!tbody) return;

    tbody.innerHTML = closing.tickets.sectors.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td class="text-end">${s.sold}</td>
        <td class="text-end text-warning fw-semibold">${s.complimentary}</td>
        <td class="text-end fw-bold">${s.sold + s.complimentary}</td>
        <td class="text-end">${formatCurrency(s.unitPrice)}</td>
        <td class="text-end fw-bold text-success">${formatCurrency(s.gross)}</td>
      </tr>
    `).join('') + `
      <tr class="table-light fw-bold">
        <td>TOTAL GERAL</td>
        <td class="text-end">${closing.tickets.sold}</td>
        <td class="text-end text-warning">${closing.tickets.complimentary}</td>
        <td class="text-end">${closing.tickets.total}</td>
        <td class="text-end">-</td>
        <td class="text-end text-success">${formatCurrency(closing.financials.grossSales)}</td>
      </tr>
    `;
  },

  renderTabPagamentos(closing) {
    const tbody = document.getElementById('closing-pagamentos-tbody');
    if (!tbody) return;

    tbody.innerHTML = closing.payments.map(p => `
      <tr>
        <td><strong>${p.method}</strong></td>
        <td><span class="badge bg-light text-dark border">${p.channel}</span></td>
        <td><span class="fw-bold text-primary">${p.acquirer}</span></td>
        <td class="text-end">${p.txCount}</td>
        <td class="text-end fw-semibold">${formatCurrency(p.grossAmount)}</td>
        <td class="text-end text-muted">${formatPercent(p.mdrRate)}</td>
        <td class="text-end text-danger">-${formatCurrency(p.mdrCost)}</td>
        <td class="text-end fw-bold text-success">${formatCurrency(p.netReceived)}</td>
        <td class="text-center"><span class="badge bg-success-subtle text-success border border-success-subtle"><i class="ph-check"></i> Conciliado</span></td>
      </tr>
    `).join('');
  },

  renderTabTaxas(closing) {
    const tbody = document.getElementById('closing-taxas-tbody');
    if (!tbody) return;

    const f = closing.financials;
    tbody.innerHTML = `
      <tr>
        <td><strong>Taxa DiskIngressos</strong></td>
        <td><span class="badge bg-primary">Percentual sobre Vendas Brutas</span></td>
        <td class="text-end">${formatCurrency(f.grossSales)}</td>
        <td class="text-end fw-bold">${f.diskFeeRate}%</td>
        <td class="text-end fw-bold text-warning">${formatCurrency(f.diskFeeAmount)}</td>
        <td>Contrato comercial padrão Disk 2026</td>
      </tr>
      <tr>
        <td><strong>Adquirência Cielo (PIX & Crédito)</strong></td>
        <td><span class="badge bg-secondary">MDR Retido</span></td>
        <td class="text-end">${formatCurrency(33160.00)}</td>
        <td class="text-end">2,07% méd.</td>
        <td class="text-end text-danger">-${formatCurrency(687.80)}</td>
        <td>Cielo E-commerce D+1 / D+30</td>
      </tr>
      <tr>
        <td><strong>Adquirência Rede (Crédito à Vista)</strong></td>
        <td><span class="badge bg-secondary">MDR Retido</span></td>
        <td class="text-end">${formatCurrency(14500.00)}</td>
        <td class="text-end">2,80%</td>
        <td class="text-end text-danger">-${formatCurrency(406.00)}</td>
        <td>Rede Cartões D+30</td>
      </tr>
      <tr>
        <td><strong>Adquirência Stone (POS Débito)</strong></td>
        <td><span class="badge bg-secondary">MDR Retido</span></td>
        <td class="text-end">${formatCurrency(2800.00)}</td>
        <td class="text-end">1,50%</td>
        <td class="text-end text-danger">-${formatCurrency(42.00)}</td>
        <td>Maquininha Bilheteria Física D+1</td>
      </tr>
    `;
  },

  renderTabEstornos(closing) {
    const tbody = document.getElementById('closing-estornos-tbody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td><strong>EST-20260918-091</strong></td>
        <td>18/09/2026</td>
        <td>Crédito à Vista</td>
        <td>Cancelamento de 2 ingressos Pista Premium pelo cliente</td>
        <td class="text-end text-danger fw-bold">-${formatCurrency(300.00)}</td>
        <td><span class="badge bg-success-subtle text-success">Estornado no Cartão</span></td>
      </tr>
      <tr>
        <td><strong>EST-20260919-442</strong></td>
        <td>19/09/2026</td>
        <td>PIX Instantâneo</td>
        <td>Devolução de ingresso Área VIP (duplicidade)</td>
        <td class="text-end text-danger fw-bold">-${formatCurrency(500.00)}</td>
        <td><span class="badge bg-success-subtle text-success">Devolvido via PIX</span></td>
      </tr>
    `;
  },

  renderTabRepasses(closing) {
    const tbody = document.getElementById('closing-repasses-tbody');
    if (!tbody) return;

    tbody.innerHTML = closing.payouts.map(p => `
      <tr>
        <td class="font-monospace fw-bold">${p.id}</td>
        <td>${p.date}</td>
        <td>${p.method}</td>
        <td>${p.bank}</td>
        <td class="font-monospace fs-xxs">${p.protocol}</td>
        <td class="text-end fw-bold text-success">${formatCurrency(p.amount)}</td>
        <td class="text-center"><span class="badge bg-success">Liquidado</span></td>
      </tr>
    `).join('') + `
      <tr class="table-warning-subtle fw-bold">
        <td colspan="5">SALDO PENDENTE A REPASSAR</td>
        <td class="text-end text-warning fs-6">${formatCurrency(closing.financials.pendingPayoutBalance)}</td>
        <td class="text-center"><span class="badge bg-warning text-dark">Aguardando Fechamento</span></td>
      </tr>
    `;
  },

  renderTabConciliacao(closing) {
    const tbody = document.getElementById('closing-conciliacao-tbody');
    if (!tbody) return;

    tbody.innerHTML = closing.acquirerSummary.map(a => `
      <tr>
        <td><strong>${a.name}</strong></td>
        <td class="text-end">${formatCurrency(a.gross)}</td>
        <td class="text-end text-danger">-${formatCurrency(a.mdrCalculated)}</td>
        <td class="text-end text-danger">-${formatCurrency(a.mdrRetained)}</td>
        <td class="text-end text-success">${formatCurrency(a.netSettled)}</td>
        <td class="text-center"><span class="badge bg-success-subtle text-success border border-success-subtle"><i class="ph-check"></i> ${a.status}</span></td>
      </tr>
    `).join('');
  },

  renderTabHistorico(closing) {
    const tbody = document.getElementById('closing-historico-tbody');
    if (!tbody) return;

    tbody.innerHTML = closing.history.map(h => `
      <tr>
        <td><span class="badge bg-secondary">v${h.version}</span></td>
        <td>${formatDate(h.timestamp)}</td>
        <td class="fw-semibold">${h.actor}</td>
        <td><code>${h.action}</code></td>
        <td class="fs-xxs text-muted">${h.notes}</td>
      </tr>
    `).join('');
  },

  handleDiskApprove() {
    try {
      financialClosingService.approveByDisk(this.currentClosingId, 'Carlos Lima (Financeiro Disk)', 'Homologação e aprovação de fechamento pelo gestor financeiro.');
      this.render();
      alert('Fechamento aprovado pelo Financeiro Disk com sucesso!');
    } catch (err) {
      alert(err.message);
    }
  },

  handleProducerAccept() {
    try {
      financialClosingService.acceptByProducer(this.currentClosingId, 'Marcos Vinicius (Produtor)', 'Ciência e concordância formal com o fechamento do evento.');
      this.render();
      alert('Ciência e aceite formal do produtor registrados com sucesso!');
    } catch (err) {
      alert(err.message);
    }
  },

  printClosingReport() {
    window.print();
  }
};

if (typeof window !== 'undefined') {
  window.financialClosingController = financialClosingController;
}
