/**
 * ============================================================================
 * CONTROLLER: GATEWAYS, ADQUIRENTES E MOTOR DE TAXAS (IMPLANTAÇÃO 5.4)
 * src/controllers/gatewayFeeMatrixController.js
 * 
 * Gerencia a tela única em 5 abas:
 * 1. Visão Geral
 * 2. Operadoras
 * 3. Bandeiras e Taxas (Custo Disk)
 * 4. Regras Comerciais (Quem suporta a taxa: Produtor, Cliente, Disk, Dividido)
 * 5. Histórico Versionado de Vigências
 * ============================================================================
 */

import { gatewayFeeMatrixService, FEE_BEARERS } from '../services/gatewayFeeMatrixService.js';

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
    return d.toLocaleDateString('pt-BR');
  } catch (e) {
    return isoStr;
  }
}

export const gatewayFeeMatrixController = {
  initialized: false,

  init() {
    if (this.initialized) return;
    this.bindEvents();
    this.initialized = true;
    console.log('[gatewayFeeMatrixController] Inicializado com sucesso.');
  },

  bindEvents() {
    if (typeof document === 'undefined') return;

    const selAcquirer = document.getElementById('gw-filter-acquirer');
    if (selAcquirer) {
      selAcquirer.addEventListener('change', () => this.renderTabBandeiras());
    }

    const selChannel = document.getElementById('gw-filter-channel');
    if (selChannel) {
      selChannel.addEventListener('change', () => this.renderTabBandeiras());
    }

    const btnSimulate = document.getElementById('btn-gw-simulate-pricing');
    if (btnSimulate) {
      btnSimulate.addEventListener('click', () => this.runSimulation());
    }

    const btnSaveVigency = document.getElementById('btn-gw-save-vigency');
    if (btnSaveVigency) {
      btnSaveVigency.addEventListener('click', () => this.handleSaveVigency());
    }

    const btnSaveAcquirer = document.getElementById('btn-gw-save-acquirer');
    if (btnSaveAcquirer) {
      btnSaveAcquirer.addEventListener('click', () => this.handleSaveAcquirer());
    }

    const btnSaveRule = document.getElementById('btn-gw-save-rule');
    if (btnSaveRule) {
      btnSaveRule.addEventListener('click', () => this.handleSaveRule());
    }

    const selLiqAcq = document.getElementById('gw-filter-liq-acquirer');
    if (selLiqAcq) {
      selLiqAcq.addEventListener('change', () => this.renderTabLiquidacoes());
    }

    const selLiqStatus = document.getElementById('gw-filter-liq-status');
    if (selLiqStatus) {
      selLiqStatus.addEventListener('change', () => this.renderTabLiquidacoes());
    }
  },

  render() {
    this.populateAcquirerSelects();
    this.renderVisaoGeral();
    this.renderTabOperadoras();
    this.renderTabBandeiras();
    this.renderTabComercial();
    this.renderTabLiquidacoes();
    this.renderTabHistorico();
    this.runSimulation();
  },

  populateAcquirerSelects() {
    if (typeof document === 'undefined') return;
    const acquirers = gatewayFeeMatrixService.getAcquirers();

    // 1. Filtro na aba Bandeiras (#gw-filter-acquirer)
    const selFilter = document.getElementById('gw-filter-acquirer');
    if (selFilter) {
      const currentVal = selFilter.value;
      selFilter.innerHTML = `<option value="TODOS">Todas as Adquirentes</option>` +
        acquirers.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
      if (currentVal && Array.from(selFilter.options).some(o => o.value === currentVal)) {
        selFilter.value = currentVal;
      }
    }

    // 2. Select no Simulador (#sim-gw-acquirer)
    const selSim = document.getElementById('sim-gw-acquirer');
    if (selSim) {
      const currentVal = selSim.value;
      selSim.innerHTML = acquirers.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
      if (currentVal && Array.from(selSim.options).some(o => o.value === currentVal)) {
        selSim.value = currentVal;
      }
    }

    // 3. Select no Modal de Nova Regra (#modal-rule-acquirer)
    const selModal = document.getElementById('modal-rule-acquirer');
    if (selModal) {
      const currentVal = selModal.value;
      selModal.innerHTML = acquirers.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
      if (currentVal && Array.from(selModal.options).some(o => o.value === currentVal)) {
        selModal.value = currentVal;
      }
    }

    // 4. Filtro na aba Liquidações (#gw-filter-liq-acquirer)
    const selLiq = document.getElementById('gw-filter-liq-acquirer');
    if (selLiq) {
      const currentVal = selLiq.value;
      selLiq.innerHTML = `<option value="TODOS">Todas as Adquirentes</option>` +
        acquirers.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
      if (currentVal && Array.from(selLiq.options).some(o => o.value === currentVal)) {
        selLiq.value = currentVal;
      }
    }
  },

  renderVisaoGeral() {
    const acquirers = gatewayFeeMatrixService.getAcquirers();
    const rules = gatewayFeeMatrixService.getRules();

    const avgMdr = rules.reduce((acc, r) => acc + r.acquirerMdr, 0) / (rules.length || 1);
    const avgCom = rules.reduce((acc, r) => acc + r.commercialFee, 0) / (rules.length || 1);
    const avgSpread = avgCom - avgMdr;

    const elMdr = document.getElementById('gw-kpi-avg-mdr');
    if (elMdr) elMdr.textContent = formatPercent(avgMdr);

    const elCom = document.getElementById('gw-kpi-avg-commercial');
    if (elCom) elCom.textContent = formatPercent(avgCom);

    const elSpread = document.getElementById('gw-kpi-avg-spread');
    if (elSpread) elSpread.textContent = formatPercent(avgSpread);

    const elCount = document.getElementById('gw-kpi-acquirers-count');
    if (elCount) elCount.textContent = `${acquirers.length} ativas`;

    const summaryTbody = document.getElementById('gw-overview-summary-tbody');
    if (summaryTbody) {
      summaryTbody.innerHTML = acquirers.map(a => `
        <tr>
          <td><strong class="text-primary">${a.name}</strong></td>
          <td><span class="badge bg-success-subtle text-success border border-success-subtle">${a.status}</span></td>
          <td>${a.settlementDays}</td>
          <td class="text-end fw-semibold">${a.activeTransactions.toLocaleString('pt-BR')}</td>
          <td class="text-center">
            <button class="btn btn-xs btn-outline-primary" onclick="window.gatewayFeeMatrixController.filterByAcquirer('${a.name}')">
              Ver Taxas
            </button>
          </td>
        </tr>
      `).join('');
    }
  },

  renderTabOperadoras() {
    const tbody = document.getElementById('gw-operadoras-tbody');
    if (!tbody) return;

    const acquirers = gatewayFeeMatrixService.getAcquirers();

    const badgeCount = document.getElementById('gw-operadoras-badge-count');
    if (badgeCount) {
      badgeCount.textContent = `${acquirers.length} operadoras ativas`;
    }
    tbody.innerHTML = acquirers.map(a => `
      <tr>
        <td>
          <div class="fw-bold text-dark fs-6">${a.name}</div>
          <div class="fs-xxs text-muted">ID: ${a.id} • Protocolo API REST v2</div>
        </td>
        <td><span class="badge bg-success">HOMOLOGADA & ATIVA</span></td>
        <td><code>${a.settlementDays}</code></td>
        <td class="text-end fw-bold">${a.activeTransactions.toLocaleString('pt-BR')}</td>
        <td><span class="badge bg-light text-dark border">Produção Oficial</span></td>
        <td class="text-center">
          <button class="btn btn-xs btn-outline-secondary p-1" title="Configurações de Conexão">
            <i class="ph-gear"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderTabBandeiras() {
    const tbody = document.getElementById('gw-bandeiras-tbody');
    if (!tbody) return;

    const acq = document.getElementById('gw-filter-acquirer')?.value || 'TODOS';
    const ch = document.getElementById('gw-filter-channel')?.value || 'TODOS';

    const rules = gatewayFeeMatrixService.getRules({ acquirer: acq, channel: ch });

    tbody.innerHTML = rules.map(r => `
      <tr>
        <td><strong class="text-primary">${r.acquirer}</strong></td>
        <td><span class="badge bg-light text-dark border">${r.brand}</span></td>
        <td><code>${r.modality}</code></td>
        <td><span class="badge bg-secondary-subtle text-secondary">${r.channel}</span></td>
        <td class="text-end fw-bold text-danger">${formatPercent(r.acquirerMdr)}</td>
        <td class="text-end">${formatCurrency(r.fixedCost)}</td>
        <td class="text-muted fs-xxs">${formatDate(r.effectiveFrom)}</td>
        <td class="text-center">
          <button class="btn btn-xs btn-outline-primary p-1" title="Nova Vigência" onclick="window.gatewayFeeMatrixController.openNewVigencyModal('${r.id}')">
            <i class="ph-calendar-plus"></i> Nova Vigência
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderTabComercial() {
    const tbody = document.getElementById('gw-comercial-tbody');
    if (!tbody) return;

    const rules = gatewayFeeMatrixService.getRules();

    tbody.innerHTML = rules.map(r => {
      const spread = Math.round((r.commercialFee - r.acquirerMdr) * 100) / 100;
      const bearerCfg = FEE_BEARERS[r.feeBearer] || { label: r.feeBearer };
      const bearerBadge = r.feeBearer === 'CLIENTE_FINAL' ? 'bg-info text-dark' : (r.feeBearer === 'PRODUTOR' ? 'bg-primary' : 'bg-warning text-dark');

      return `
        <tr>
          <td>
            <strong>${r.acquirer}</strong> - ${r.brand}
            <div class="fs-xxs text-muted">${r.modality} (${r.channel})</div>
          </td>
          <td class="text-end text-danger">${formatPercent(r.acquirerMdr)}</td>
          <td class="text-end fw-bold text-success">${formatPercent(r.commercialFee)}</td>
          <td class="text-end fw-semibold text-primary">+${formatPercent(spread)}</td>
          <td>
            <span class="badge ${bearerBadge}" title="${bearerCfg.description || ''}">${bearerCfg.label}</span>
          </td>
          <td class="fs-xxs text-muted">${r.scope === 'GLOBAL' ? 'Padrão Disk' : (r.scope === 'PRODUCER' ? 'Por Produtor' : 'Por Evento')}</td>
        </tr>
      `;
    }).join('');
  },

  renderTabLiquidacoes() {
    const tbody = document.getElementById('gw-liquidacoes-tbody');
    if (!tbody) return;

    const acquirer = document.getElementById('gw-filter-liq-acquirer')?.value || 'TODOS';
    const status = document.getElementById('gw-filter-liq-status')?.value || 'TODOS';

    const settlements = gatewayFeeMatrixService.getSettlements({ acquirer, status });
    const summary = gatewayFeeMatrixService.getSettlementsSummary({ acquirer, status });

    // Atualiza KPIs
    const elGross = document.getElementById('gw-liq-kpi-total-gross');
    if (elGross) elGross.textContent = formatCurrency(summary.totalGross);

    const elCompare = document.getElementById('gw-liq-kpi-mdr-compare');
    if (elCompare) elCompare.textContent = `${formatCurrency(summary.totalExpectedMdr)} / ${formatCurrency(summary.totalRealMdr)}`;

    const elDiv = document.getElementById('gw-liq-kpi-divergence');
    if (elDiv) elDiv.textContent = formatCurrency(summary.totalDivergence);

    const elRate = document.getElementById('gw-liq-kpi-rate');
    if (elRate) elRate.textContent = `${summary.reconciliationRate}%`;

    tbody.innerHTML = settlements.map(s => {
      const isReconciled = s.reconciliationStatus === 'CONCILIADO';
      const statusBadge = isReconciled
        ? 'bg-success-subtle text-success border border-success-subtle'
        : (s.reconciliationStatus === 'CHARGEBACK' ? 'bg-dark text-white' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle');

      return `
        <tr>
          <td>
            <strong class="text-dark">${s.transactionId}</strong>
            <div class="fs-xxs text-muted">${s.orderId} • ${s.eventName}</div>
          </td>
          <td>
            <strong>${s.acquirer}</strong>
            <span class="badge bg-light text-dark border ms-1">${s.brand}</span>
          </td>
          <td><code>${s.modality}</code></td>
          <td class="fs-xxs text-muted">${formatDate(s.transactionDate)}</td>
          <td class="fs-xxs">${s.settlementRealDate ? formatDate(s.settlementRealDate) : '<span class="text-danger">Pendente</span>'}</td>
          <td class="text-end fw-semibold">${formatCurrency(s.grossAmount)}</td>
          <td class="text-end text-primary font-monospace">${formatCurrency(s.mdrExpectedAmount)} <span class="fs-xxs">(${s.mdrExpectedPercent}%)</span></td>
          <td class="text-end font-monospace ${isReconciled ? 'text-success' : 'text-danger fw-bold'}">
            ${s.mdrRealAmount !== null ? `${formatCurrency(s.mdrRealAmount)} <span class="fs-xxs">(${s.mdrRealPercent}%)</span>` : '-'}
          </td>
          <td class="text-end font-monospace ${s.differenceAmount > 0 ? 'text-danger fw-bold' : 'text-muted'}">
            ${s.differenceAmount > 0 ? `+${formatCurrency(s.differenceAmount)}` : 'R$ 0,00'}
          </td>
          <td>
            <span class="badge ${statusBadge}" title="${s.reconciliationNotes || ''}">
              ${s.reconciliationStatus.replace(/_/g, ' ')}
            </span>
          </td>
          <td class="text-center">
            ${isReconciled ? '<span class="text-success fs-xs fw-semibold"><i class="ph-check-circle"></i> OK</span>' : `
              <button class="btn btn-xs btn-outline-primary" onclick="window.gatewayFeeMatrixController.handleReconcilePrompt('${s.transactionId}')">
                Conciliar
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');
  },

  handleReconcilePrompt(transactionId) {
    const reason = prompt('Informe a justificativa contábil para aprovar e conciliar esta liquidação:', 'Divergência de MDR aceita conforme aditivo contratual Cielo');
    if (reason) {
      gatewayFeeMatrixService.reconcileSettlement(transactionId, { notes: reason, actor: 'Carlos Lima (Financeiro Disk)' });
      this.renderTabLiquidacoes();
      alert('Transação conciliada com sucesso e registrada na trilha de auditoria!');
    }
  },

  renderTabHistorico() {
    const tbody = document.getElementById('gw-historico-tbody');
    if (tbody) {
      const rules = gatewayFeeMatrixService.getRules();
      const allHistory = rules.flatMap(r => (r.history || []).map(h => ({ ...h, acquirer: r.acquirer, brand: r.brand, modality: r.modality })));

      tbody.innerHTML = allHistory.map(h => `
        <tr>
          <td><span class="badge bg-secondary">v${h.version}</span></td>
          <td><strong>${h.acquirer}</strong> - ${h.brand} (${h.modality})</td>
          <td>${formatDate(h.effectiveFrom)} ${h.effectiveTo ? `até ${formatDate(h.effectiveTo)}` : '(Vigente)'}</td>
          <td class="text-end text-danger">${formatPercent(h.acquirerMdr)}</td>
          <td class="text-end text-success">${formatPercent(h.commercialFee)}</td>
          <td><span class="badge bg-light text-dark border">${h.feeBearer || 'PRODUTOR'}</span></td>
          <td class="fw-semibold">${h.actor || 'Administrador'}</td>
          <td class="fs-xxs text-muted">${h.reason || '-'}</td>
        </tr>
      `).join('');
    }

    const auditTbody = document.getElementById('gw-audit-tbody');
    if (auditTbody) {
      const logs = gatewayFeeMatrixService.getAuditLog();
      auditTbody.innerHTML = logs.map(l => `
        <tr>
          <td><code>${l.id}</code></td>
          <td class="text-muted fs-xxs">${formatDate(l.timestamp)}</td>
          <td><span class="badge bg-secondary-subtle text-secondary border">${l.event}</span></td>
          <td>${l.details}</td>
          <td class="fw-semibold text-dark">${l.actor}</td>
        </tr>
      `).join('');
    }
  },

  runSimulation() {
    const amount = Number(document.getElementById('sim-gw-amount')?.value || 100);
    const acquirer = document.getElementById('sim-gw-acquirer')?.value || 'Cielo';
    const brand = document.getElementById('sim-gw-brand')?.value || 'Visa';
    const modality = document.getElementById('sim-gw-modality')?.value || 'CREDITO_3X';

    const result = gatewayFeeMatrixService.calculateTransactionPricing({ amount, acquirer, brand, modality });

    const resEl = document.getElementById('sim-gw-result-box');
    if (!resEl) return;

    resEl.innerHTML = `
      <div class="row g-2 fs-xs">
        <div class="col-6"><strong>Valor Transacionado:</strong></div>
        <div class="col-6 text-end fw-bold">${formatCurrency(result.amount)}</div>

        <div class="col-6 text-muted">Regra Aplicada (Hierarquia):</div>
        <div class="col-6 text-end"><span class="badge bg-secondary-subtle text-secondary border">${result.rule.ruleOrigin || result.rule.scope}</span> <code class="fs-xxs">v${result.rule.version || 1}</code></div>

        <div class="col-6 text-danger">Custo Adquirente (${result.rule.acquirer} - ${formatPercent(result.rule.acquirerMdr)}):</div>
        <div class="col-6 text-end text-danger fw-semibold">-${formatCurrency(result.acquirerCostMdr)}</div>

        <div class="col-6 text-success">Taxa Comercial Aplicada (${formatPercent(result.rule.commercialFee)}):</div>
        <div class="col-6 text-end text-success fw-bold">${formatCurrency(result.commercialFeeAmount)}</div>

        <div class="col-6 text-primary">Margem / Spread Operacional:</div>
        <div class="col-6 text-end text-primary fw-bold">+${formatCurrency(result.operationalSpreadAmount)}</div>

        <hr class="my-1">

        <div class="col-6"><strong>Quem Suporta a Taxa:</strong></div>
        <div class="col-6 text-end"><span class="badge bg-primary">${result.breakdown.feeBearer}</span></div>

        <div class="col-6">Cobrado do Cliente no Checkout:</div>
        <div class="col-6 text-end fw-bold text-dark">+${formatCurrency(result.breakdown.chargedFromCustomer)}</div>

        <div class="col-6">Total Pago pelo Cliente:</div>
        <div class="col-6 text-end fw-bold text-primary">${formatCurrency(result.breakdown.totalCustomerPays)}</div>

        <div class="col-6">Líquido do Produtor:</div>
        <div class="col-6 text-end fw-bold text-success">${formatCurrency(result.breakdown.netToProducer)}</div>
      </div>
    `;
  },

  filterByAcquirer(acquirerName) {
    const sel = document.getElementById('gw-filter-acquirer');
    if (sel) {
      sel.value = acquirerName;
      const tabLink = document.getElementById('tab-gw-bandeiras');
      if (tabLink && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
        bootstrap.Tab.getOrCreateInstance(tabLink).show();
      }
      this.renderTabBandeiras();
    }
  },

  openNewVigencyModal(ruleId) {
    const rule = gatewayFeeMatrixService.getRules().find(r => r.id === ruleId);
    if (!rule) return;

    document.getElementById('modal-vigency-rule-id').value = rule.id;
    document.getElementById('modal-vigency-title').textContent = `${rule.acquirer} - ${rule.brand} (${rule.modality})`;
    document.getElementById('modal-vigency-cost').value = rule.acquirerMdr;
    document.getElementById('modal-vigency-commercial').value = rule.commercialFee;
    document.getElementById('modal-vigency-bearer').value = rule.feeBearer;
    document.getElementById('modal-vigency-from').value = new Date().toISOString().slice(0, 10);

    const modalEl = document.getElementById('modal-gw-new-vigency');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
  },

  handleSaveVigency() {
    try {
      const ruleId = document.getElementById('modal-vigency-rule-id').value;
      const acquirerMdr = Number(document.getElementById('modal-vigency-cost').value);
      const commercialFee = Number(document.getElementById('modal-vigency-commercial').value);
      const feeBearer = document.getElementById('modal-vigency-bearer').value;
      const effectiveFrom = document.getElementById('modal-vigency-from').value;
      const reason = document.getElementById('modal-vigency-reason').value;

      gatewayFeeMatrixService.addNewVigency({
        ruleId,
        acquirerMdr,
        commercialFee,
        feeBearer,
        effectiveFrom,
        actorName: 'Carlos Lima (Financeiro Disk)',
        reason
      });

      const modalEl = document.getElementById('modal-gw-new-vigency');
      if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        bootstrap.Modal.getInstance(modalEl)?.hide();
      }

      this.render();
      alert('Nova vigência cadastrada com sucesso sem alterar o histórico anterior!');
    } catch (err) {
      alert(err.message);
    }
  },

  openNewAcquirerModal() {
    if (typeof document === 'undefined') return;
    const nameInput = document.getElementById('modal-acquirer-name');
    if (nameInput) nameInput.value = '';
    const settInput = document.getElementById('modal-acquirer-settlement');
    if (settInput) settInput.value = 'D+30 (Crédito) / D+1 (PIX)';
    const statusInput = document.getElementById('modal-acquirer-status');
    if (statusInput) statusInput.value = 'ATIVO';

    const modalEl = document.getElementById('modal-gw-new-acquirer');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
  },

  handleSaveAcquirer() {
    try {
      const nameInput = document.getElementById('modal-acquirer-name');
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        alert('Por favor, informe o nome da operadora/adquirente.');
        return;
      }

      const settlementDays = document.getElementById('modal-acquirer-settlement')?.value?.trim() || 'D+30';
      const status = document.getElementById('modal-acquirer-status')?.value || 'ATIVO';

      const newAcquirer = gatewayFeeMatrixService.createAcquirer({
        name,
        settlementDays,
        status,
        activeTransactions: 0
      });

      this.populateAcquirerSelects();

      const modalEl = document.getElementById('modal-gw-new-acquirer');
      if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        bootstrap.Modal.getInstance(modalEl)?.hide();
      }

      this.render();
      alert(`Adquirente "${newAcquirer.name}" cadastrada com sucesso! Agora você já pode configurar suas bandeiras e taxas.`);
    } catch (err) {
      alert('Erro ao salvar adquirente: ' + err.message);
    }
  },

  openNewRuleModal(defaultAcquirer) {
    if (typeof document === 'undefined') return;
    this.populateAcquirerSelects();

    const selAcq = document.getElementById('modal-rule-acquirer');
    if (selAcq && defaultAcquirer) {
      selAcq.value = defaultAcquirer;
    }

    const brandInput = document.getElementById('modal-rule-brand');
    if (brandInput) brandInput.value = '';
    const mdrInput = document.getElementById('modal-rule-acquirer-mdr');
    if (mdrInput) mdrInput.value = '2.15';
    const fixInput = document.getElementById('modal-rule-fixed-cost');
    if (fixInput) fixInput.value = '0.00';
    const comInput = document.getElementById('modal-rule-commercial-fee');
    if (comInput) comInput.value = '2.99';
    const dateInput = document.getElementById('modal-rule-effective-from');
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
    const reasonInput = document.getElementById('modal-rule-reason');
    if (reasonInput) reasonInput.value = '';

    const modalEl = document.getElementById('modal-gw-new-rule');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
  },

  handleSaveRule() {
    try {
      const acquirer = document.getElementById('modal-rule-acquirer')?.value;
      const brand = document.getElementById('modal-rule-brand')?.value?.trim();
      const modality = document.getElementById('modal-rule-modality')?.value || 'CREDITO_1X';
      const channel = document.getElementById('modal-rule-channel')?.value || 'ONLINE';
      const scope = document.getElementById('modal-rule-scope')?.value || 'GLOBAL';
      const acquirerMdr = Number(document.getElementById('modal-rule-acquirer-mdr')?.value || 0);
      const fixedCost = Number(document.getElementById('modal-rule-fixed-cost')?.value || 0);
      const commercialFee = Number(document.getElementById('modal-rule-commercial-fee')?.value || 0);
      const feeBearer = document.getElementById('modal-rule-fee-bearer')?.value || 'PRODUTOR';
      const effectiveFrom = document.getElementById('modal-rule-effective-from')?.value || new Date().toISOString().slice(0, 10);
      const reason = document.getElementById('modal-rule-reason')?.value?.trim() || 'Cadastro de taxa por bandeira';

      if (!acquirer) {
        alert('Selecione uma adquirente.');
        return;
      }
      if (!brand) {
        alert('Informe a bandeira do cartão ou meio de pagamento (ex: Visa, Mastercard, Elo).');
        return;
      }

      gatewayFeeMatrixService.createRule({
        acquirer,
        brand,
        modality,
        channel,
        scope,
        acquirerMdr,
        fixedCost,
        commercialFee,
        feeBearer,
        effectiveFrom,
        reason,
        actor: 'Carlos Lima (Financeiro Disk)'
      });

      const modalEl = document.getElementById('modal-gw-new-rule');
      if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        bootstrap.Modal.getInstance(modalEl)?.hide();
      }

      this.render();
      alert(`Nova regra para ${acquirer} - ${brand} (${modality}) cadastrada com sucesso! Vigência iniciada em ${formatDate(effectiveFrom)}.`);
    } catch (err) {
      alert('Erro ao salvar regra: ' + err.message);
    }
  }
};

if (typeof window !== 'undefined') {
  window.gatewayFeeMatrixController = gatewayFeeMatrixController;
}
