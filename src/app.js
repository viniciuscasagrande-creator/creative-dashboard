/**
 * DiskIngressos Pro Dashboard — Application Logic
 */
import './services/firebase/index.js';
import { createUiCard, createUiTable, createUiModal, createUiChart } from './components/ui.js';

// Global state for events
let EVENTS_DATA = [
  {
    id: 3368,
    name: "Experiencia Música e Natureza - Julho",
    date: "Sáb, 11/07/2026 - 11:00",
    location: "Parque Jaime Lerner",
    status: "ativos",
    salesCount: 674,
    revenue: 12851.00,
    badgeLeft: "3368",
    badgeRight: "2601",
    fees: { platform: 1285.10, card: 642.55, retention: 17.34 }
  },
  {
    id: 3195,
    name: "9º Knife Show Curitiba - Feira e Exposição de Facas",
    date: "Sáb, 11/07/2026 - 11:00",
    location: "Associação AABB Curitiba",
    status: "ativos",
    salesCount: 328,
    revenue: 7720.00,
    badgeLeft: "3195",
    badgeRight: "3292",
    fees: { platform: 772.00, card: 386.00, retention: 0.00 }
  },
  {
    id: 3178,
    name: "Feijoada e Costela assada - PETFRIENDLY",
    date: "Dom, 12/07/2026 - 12:00",
    location: "Restaurante Vila Brasil - Comida Caseira",
    status: "ativos",
    salesCount: 0,
    revenue: 0.00,
    badgeLeft: "3178",
    badgeRight: "Vila Brasil 2318",
    fees: { platform: 0.00, card: 0.00, retention: 0.00 }
  },
  {
    id: 934,
    name: "Rebobinando - Uma Peça Quatro Histórias",
    date: "Dom, 12/07/2026 - 16:00",
    location: "Espaço Excêntrico Mauro Zanatta",
    status: "ativos",
    salesCount: 16,
    revenue: 150.00,
    badgeLeft: "934",
    badgeRight: "3310",
    fees: { platform: 15.00, card: 7.50, retention: 0.00 }
  },
  {
    id: 1360,
    name: "Alice no País das Maravilhas",
    date: "Dom, 10/05/2026 - 15:00",
    location: "Teatro Regina Vogue",
    status: "inativos",
    salesCount: 31,
    revenue: 1360.00,
    badgeLeft: "1360",
    badgeRight: "294",
    fees: { platform: 136.00, card: 68.00, retention: 0.00 }
  },
  {
    id: 843,
    name: "RENATO ALBANI - NOVO SHOW - SESSÃO EXTRA",
    date: "Seg, 22/06/2026 - 17:00",
    location: "Teatro Marista Maringá",
    status: "inativos",
    salesCount: 843,
    revenue: 62098.00,
    badgeLeft: "843",
    badgeRight: "97",
    fees: { platform: 6209.80, card: 3104.90, retention: 0.00 }
  },
  {
    id: 1500,
    name: "Festival de Balonismo de Curitiba",
    date: "Sáb, 18/07/2026 - 14:00",
    location: "Parque Barigui",
    status: "ativos",
    salesCount: 1500,
    revenue: 45000.00,
    badgeLeft: "1500",
    badgeRight: "Barigui 500",
    fees: { platform: 4500.00, card: 2250.00, retention: 0.00 }
  },
  {
    id: 420,
    name: "Show de Talentos Kids 2026",
    date: "Dom, 19/07/2026 - 15:00",
    location: "Teatro Guaíra",
    status: "ativos",
    salesCount: 420,
    revenue: 8400.00,
    badgeLeft: "420",
    badgeRight: "Guaira 80",
    fees: { platform: 840.00, card: 420.00, retention: 0.00 }
  },
  {
    id: 250,
    name: "Comedy Night com Thiago Ventura",
    date: "Sex, 24/07/2026 - 21:00",
    location: "Curitiba Comedy Club",
    status: "ativos",
    salesCount: 250,
    revenue: 12500.00,
    badgeLeft: "250",
    badgeRight: "Comedy 50",
    fees: { platform: 1250.00, card: 625.00, retention: 0.00 }
  },
  {
    id: 980,
    name: "Orquestra Sinfônica - Trilhas de Cinema",
    date: "Sáb, 25/07/2026 - 20:00",
    location: "Ópera de Arame",
    status: "ativos",
    salesCount: 980,
    revenue: 49000.00,
    badgeLeft: "980",
    badgeRight: "Opera 120",
    fees: { platform: 4900.00, card: 2450.00, retention: 0.00 }
  },
  {
    id: 40,
    name: "Workshop Gastronomia Italiana",
    date: "Dom, 26/07/2026 - 10:00",
    location: "Espaço Gourmet Batel",
    status: "ativos",
    salesCount: 40,
    revenue: 6000.00,
    badgeLeft: "40",
    badgeRight: "Batel 10",
    fees: { platform: 600.00, card: 300.00, retention: 0.00 }
  },
  {
    id: 2200,
    name: "Maratona Internacional de Curitiba",
    date: "Dom, 02/08/2026 - 06:00",
    location: "Centro Cívico",
    status: "ativos",
    salesCount: 2200,
    revenue: 176000.00,
    badgeLeft: "2200",
    badgeRight: "Civico 300",
    fees: { platform: 17600.00, card: 8800.00, retention: 0.00 }
  },
  {
    id: 3100,
    name: "Festival de Jazz e Blues de Curitiba",
    date: "Sex, 07/08/2026 - 19:00",
    location: "Pedreira Paulo Leminski",
    status: "ativos",
    salesCount: 3100,
    revenue: 248000.00,
    badgeLeft: "3100",
    badgeRight: "Pedreira 900",
    fees: { platform: 24800.00, card: 12400.00, retention: 0.00 }
  },
  {
    id: 4500,
    name: "Comic Con Sul 2026",
    date: "Sáb, 08/08/2026 - 10:00",
    location: "Expo Unimed Curitiba",
    status: "ativos",
    salesCount: 4500,
    revenue: 270000.00,
    badgeLeft: "4500",
    badgeRight: "Expo 1500",
    fees: { platform: 27000.00, card: 13500.00, retention: 0.00 }
  },
  {
    id: 650,
    name: "Peça de Teatro: Hamlet",
    date: "Dom, 09/08/2026 - 18:00",
    location: "Teatro Guaíra",
    status: "ativos",
    salesCount: 650,
    revenue: 19500.00,
    badgeLeft: "650",
    badgeRight: "Guaira 150",
    fees: { platform: 1950.00, card: 975.00, retention: 0.00 }
  },
  {
    id: 120,
    name: "Exposição de Carros Antigos",
    date: "Sáb, 15/08/2026 - 09:00",
    location: "Parque Newton Freire",
    status: "ativos",
    salesCount: 120,
    revenue: 2400.00,
    badgeLeft: "120",
    badgeRight: "Newton 380",
    fees: { platform: 240.00, card: 120.00, retention: 0.00 }
  },
  {
    id: 3800,
    name: "Jorge e Mateus em Curitiba",
    date: "Sex, 21/08/2026 - 22:00",
    location: "Live Curitiba",
    status: "ativos",
    salesCount: 3800,
    revenue: 456000.00,
    badgeLeft: "3800",
    badgeRight: "Live 1200",
    fees: { platform: 45600.00, card: 22800.00, retention: 0.00 }
  },
  {
    id: 1100,
    name: "Encontro de Cervejas Artesanais",
    date: "Sáb, 22/08/2026 - 12:00",
    location: "Museu Oscar Niemeyer",
    status: "ativos",
    salesCount: 1100,
    revenue: 55000.00,
    badgeLeft: "1100",
    badgeRight: "MON 400",
    fees: { platform: 5500.00, card: 2750.00, retention: 0.00 }
  },
  {
    id: 850,
    name: "Congresso de Tecnologia e IA",
    date: "Qui, 27/08/2026 - 09:00",
    location: "Fiep Curitiba",
    status: "ativos",
    salesCount: 850,
    revenue: 170000.00,
    badgeLeft: "850",
    badgeRight: "Fiep 150",
    fees: { platform: 17000.00, card: 8500.00, retention: 0.00 }
  },
  {
    id: 1800,
    name: "Festival Gastronômico de Inverno",
    date: "Dom, 30/08/2026 - 11:00",
    location: "Parque Tanguá",
    status: "ativos",
    salesCount: 1800,
    revenue: 36000.00,
    badgeLeft: "1800",
    badgeRight: "Tangua 200",
    fees: { platform: 3600.00, card: 1800.00, retention: 0.00 }
  }
];

// Active filters state
let currentEventsFilter = 'ativos';
let currentSearchQuery = '';

function initApp() {
  try {
    if (typeof window.App !== 'undefined') {
      window.App.initCore();
      window.App.initAfterLoad();
    }
  } catch (err) {
    console.warn("Limitless template initialization warning:", err);
  }
  
  initViewSwitcher();
  initEventsModule();
  initFinanceModule();
  initSettingsModule();
  initReportsModule();
  initQuickActions();
  initCharts();
  
  // Custom module initializers
  if (typeof initAiAssistant === 'function') initAiAssistant();
  if (typeof initTicketModule === 'function') initTicketModule();
  if (typeof initWizardController === 'function') initWizardController();
  if (typeof initCouponModule === 'function') initCouponModule();

  // Store defaults for merging
  const EVENTS_DATA_DEFAULTS = [...EVENTS_DATA];

  // Initialize Firebase sync if configured
  if (window.firebaseDB && window.firebaseDB.isConfigured) {
    window.firebaseDB.seedInitialDataIfEmpty(EVENTS_DATA)
      .then(() => {
        window.firebaseDB.onEventsChange((events) => {
          // Merge local metadata defaults with Firestore data
          EVENTS_DATA = events.map(ev => {
            const def = EVENTS_DATA_DEFAULTS.find(d => d.id == ev.id) || {};
            return {
              ...def,
              ...ev,
              fees: { ...def.fees, ...ev.fees }
            };
          });
          
          // Re-render modules
          renderEventsTable();
          if (typeof renderFinancialBalanceRows === 'function') renderFinancialBalanceRows();
          if (typeof renderAgendaCalendarGrid === 'function') renderAgendaCalendarGrid();
          if (typeof initAgendaGeneralModule === 'function') initAgendaGeneralModule();
        });
      })
      .catch(console.error);

    // Initialize Firebase sync for coupons if configured
    if (typeof COUPONS_DATA !== 'undefined') {
      window.firebaseDB.seedInitialCouponsIfEmpty(COUPONS_DATA)
        .then(() => {
          window.firebaseDB.onCouponsChange((coupons) => {
            if (coupons && coupons.length > 0) {
              COUPONS_DATA = coupons;
            }
            if (typeof renderCouponsTable === 'function') renderCouponsTable();
          });
        })
    } else {
      // Offline / fallback rendering directly
      renderEventsTable();
      if (typeof renderFinancialBalanceRows === 'function') renderFinancialBalanceRows();
      if (typeof renderAgendaCalendarGrid === 'function') renderAgendaCalendarGrid();
      if (typeof initAgendaGeneralModule === 'function') initAgendaGeneralModule();
      if (typeof COUPONS_DATA !== 'undefined' && typeof renderCouponsTable === 'function') {
        renderCouponsTable();
      }
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/* ==========================================================================
   1. Navigation & Sidebar UI
   ========================================================================== */
function initViewSwitcher() {
  const subLinks = document.querySelectorAll('.submenu-link');
  
  subLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Deactivate all links
      subLinks.forEach(l => l.classList.remove('active'));
      // Activate clicked
      link.classList.add('active');
      
      // Mark parent category as active in Limitless layout
      document.querySelectorAll('.nav-item-submenu').forEach(p => {
        p.classList.remove('nav-item-open');
      });
      const parentLi = link.closest('.nav-item-submenu');
      if (parentLi) {
        parentLi.classList.add('nav-item-open');
      }
      
      const targetView = link.getAttribute('data-view');
      switchActiveView(targetView);
    });
  });
}

/**
 * Global function to switch active main view panel
 */
function switchActiveView(viewId) {
  // Hide all sections in main-content-area
  const mainContent = document.getElementById('main-content');
  const sections = mainContent.querySelectorAll('.page-section');
  sections.forEach(sec => sec.style.display = 'none');
  
  let targetSection = null;

  // View routing redirects & module-specific triggers
  if (viewId === 'dashboard-agenda') {
    targetSection = document.getElementById('view-agenda-annual');
    viewId = 'agenda-annual';
  } else if (viewId === 'agenda-annual') {
    if (typeof initAgendaAnnualModule === 'function') initAgendaAnnualModule();
  } else if (viewId === 'agenda-general') {
    if (typeof initAgendaGeneralModule === 'function') initAgendaGeneralModule();
  } else if (viewId.startsWith('marketing')) {
    if (viewId === 'marketing-analytics') {
      targetSection = document.getElementById('view-marketing-analytics');
      if (typeof renderMarketingAnalyticsCharts === 'function') renderMarketingAnalyticsCharts();
    } else if (viewId === 'marketing-pixels') {
      targetSection = document.getElementById('view-marketing-pixels');
      if (typeof renderMarketingPixelCharts === 'function') renderMarketingPixelCharts();
    }
  } else if (viewId === 'global-consult-ticket' || viewId === 'event-consult-ticket' || viewId === 'event-cortesias') {
    targetSection = document.getElementById(`view-${viewId}`);
    if (typeof initTicketModule === 'function') initTicketModule();
  } else if (viewId === 'events-cupons') {
    targetSection = document.getElementById('view-events-cupons');
    if (typeof initCouponModule === 'function') initCouponModule();
  } else if (viewId.startsWith('accounting')) {
    targetSection = document.getElementById('view-accounting');
    if (viewId === 'accounting') {
      setTimeout(() => {
        if (typeof switchAccountingTab === 'function') switchAccountingTab(null, 'dashboard');
      }, 50);
    }
  } else if (viewId === 'financial-negotiations') {
    targetSection = document.getElementById('view-financial-negotiations');
    if (typeof initNegotiationsPage === 'function') {
      initNegotiationsPage();
    }
  }

  // Try to find the section directly if not already found
  if (!targetSection) {
    targetSection = document.getElementById(`view-${viewId}`);
  }
  
  // Fallbacks if the specific subtab view is a mock or grouped
  if (!targetSection) {
    if (viewId.startsWith('dashboard')) {
      targetSection = document.getElementById('view-dashboard-main');
    } else if (viewId.startsWith('events')) {
      targetSection = document.getElementById('view-events-list');
      
      if (viewId === 'events-new') {
        openModal('new-event');
      }
    } else if (viewId === 'financial-negotiations') {
      targetSection = document.getElementById('view-financial-negotiations');
      if (typeof initNegotiationsPage === 'function') {
        initNegotiationsPage();
      }
    } else if (['financial-balance', 'financial-repass', 'financial-repasses', 'financial-advance', 'financial-statement', 'financial-expenses', 'financial-accounts', 'financial-bordero', 'financial-pdv'].includes(viewId)) {
      let actualViewId = viewId;
      if (viewId === 'financial-repasses') actualViewId = 'financial-repass';
      targetSection = document.getElementById('view-' + actualViewId);
      if (viewId === 'financial-pdv') {
        setTimeout(() => {
          if (typeof initPDVFinanceiroModule === 'function') initPDVFinanceiroModule();
        }, 50);
      }
    } else if (viewId.startsWith('reports')) {
      targetSection = document.getElementById('view-reports-sales');
      
      let subtabName = 'sales';
      if (viewId === 'reports-financial') subtabName = 'financial';
      else if (viewId === 'reports-attendees') subtabName = 'attendees';
      else if (viewId === 'reports-checkin') subtabName = 'checkin';
      else if (viewId === 'reports-marketing') subtabName = 'sales';
      else if (viewId === 'reports-exports') subtabName = 'sales';
      else if (viewId === 'reports-sales') subtabName = 'sales';
      
      activateReportsSubtab(subtabName);
    } else if (viewId.startsWith('settings')) {
      targetSection = document.getElementById('view-settings-profile');
      
      // Map settings viewIds to HTML settings keys
      let settingPaneName = 'perfil';
      const suffix = viewId.split('-')[1];
      if (suffix === 'profile') settingPaneName = 'perfil';
      else if (suffix === 'company') settingPaneName = 'empresa';
      else if (suffix === 'users') settingPaneName = 'usuarios';
      else if (suffix === 'integrations') settingPaneName = 'integracoes';
      else if (suffix === 'notifications') settingPaneName = 'notificacoes';
      else if (suffix === 'security') settingPaneName = 'seguranca';
      
      activateSettingsPane(settingPaneName);
    }
  }
  
  if (targetSection) {
    targetSection.style.display = 'flex';
  }

  // Sync sidebar active links and parent submenus
  const subLinks = document.querySelectorAll('.submenu-link');
  subLinks.forEach(link => {
    const dataView = link.getAttribute('data-view');
    if (dataView === viewId) {
      subLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      const parentLi = link.closest('.nav-item-submenu');
      if (parentLi) {
        document.querySelectorAll('.nav-item-submenu').forEach(p => {
          if (p !== parentLi) {
            p.classList.remove('nav-item-open');
            const sub = p.querySelector('.nav-group-sub');
            if (sub && typeof bootstrap !== 'undefined') {
              bootstrap.Collapse.getOrCreateInstance(sub, { toggle: false }).hide();
            }
          }
        });
        parentLi.classList.add('nav-item-open');
        const sub = parentLi.querySelector('.nav-group-sub');
        if (sub && typeof bootstrap !== 'undefined') {
          bootstrap.Collapse.getOrCreateInstance(sub, { toggle: false }).show();
        }
      }
    }
  });
}

/* ==========================================================================
   2. Events Module Logic
   ========================================================================== */
function initEventsModule() {
  const filterBtns = document.querySelectorAll('#view-events-list .toggle-btn');
  const searchInput = document.getElementById('global-search');
  
  // Render initially
  renderEventsTable();
  if (typeof renderEventsList === 'function') renderEventsList();
  
  // Bind layouts toggle
  const gridBtn = document.getElementById('btn-view-grid');
  if (gridBtn) gridBtn.addEventListener('click', () => window.setEventsViewMode('grid'));
  
  const listBtn = document.getElementById('btn-view-list');
  if (listBtn) listBtn.addEventListener('click', () => window.setEventsViewMode('list'));
  
  document.querySelectorAll('.btn-col-select').forEach(btn => {
    btn.addEventListener('click', () => {
      const cols = btn.getAttribute('data-cols');
      window.setEventsColumns(cols);
    });
  });

  // Search input filtering
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    renderEventsTable();
    if (typeof renderEventsList === 'function') renderEventsList();
  });

  // Tab filter events list
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentEventsFilter = btn.getAttribute('data-filter');
      renderEventsTable();
      if (typeof renderEventsList === 'function') renderEventsList();
    });
  });

  // Manual toggle for the Layout config dropdown
  const layoutBtn = document.getElementById('layout-config-btn');
  if (layoutBtn) {
    layoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = layoutBtn.nextElementSibling;
      if (menu) {
        menu.classList.toggle('show');
      }
    });
    // Click outside closes it
    document.addEventListener('click', () => {
      const menu = layoutBtn.nextElementSibling;
      if (menu) {
        menu.classList.remove('show');
      }
    });
  }

  // Handle Event Creation (both forms)
  const quickForm = document.getElementById('quick-new-event-form');
  if (quickForm) {
    quickForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addNewEventFromInput(
        document.getElementById('modal-ev-name').value,
        document.getElementById('modal-ev-date').value,
        document.getElementById('modal-ev-location').value,
        document.getElementById('modal-ev-badge-l').value,
        document.getElementById('modal-ev-badge-r').value
      );
      quickForm.reset();
      closeModal('new-event');
    });
  }

  const directForm = document.getElementById('new-event-direct-form');
  if (directForm) {
    directForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addNewEventFromInput(
        document.getElementById('form-ev-name').value,
        document.getElementById('form-ev-date').value,
        document.getElementById('form-ev-location').value,
        document.getElementById('form-ev-badge-l').value,
        document.getElementById('form-ev-badge-r').value
      );
      directForm.reset();
      switchActiveView('events-list');
    });
  }
}

function addNewEventFromInput(name, date, location, badgeL, badgeR) {
  const newEv = {
    id: EVENTS_DATA.length + 1,
    name: name,
    date: date,
    location: location,
    status: 'ativos',
    salesCount: 0,
    revenue: 0.00,
    badgeLeft: badgeL,
    badgeRight: badgeR,
    fees: {
      platform: 0.00,
      card: 0.00,
      retention: 0.00
    }
  };
  
  EVENTS_DATA.push(newEv);
  renderEventsTable();
  alert(`Evento "${name}" criado com sucesso!`);
}

function renderEventsTable() {
  const tbody = document.getElementById('table-events-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const filtered = EVENTS_DATA.filter(ev => {
    const matchesFilter = currentEventsFilter === 'todos' || ev.status === currentEventsFilter;
    const matchesSearch = ev.name.toLowerCase().includes(currentSearchQuery.toLowerCase()) || 
                          ev.location.toLowerCase().includes(currentSearchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">
          Nenhum evento localizado com os filtros aplicados.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(ev => {
    const tr = document.createElement('tr');
    
    // Status Badge
    let statusBadge = '';
    if (ev.status === 'ativos') {
      statusBadge = '<span class="badge bg-success">Ativo</span>';
    } else {
      statusBadge = '<span class="badge bg-secondary">Inativo</span>';
    }

    tr.innerHTML = `
      <td>
        <div class="table-event-title-block">
          <span class="table-event-name">${ev.name}</span>
          <span class="table-event-meta">IDs: ${ev.badgeLeft} / ${ev.badgeRight}</span>
        </div>
      </td>
      <td>${ev.date}</td>
      <td>${ev.location}</td>
      <td>${statusBadge}</td>
      <td class="text-right"><strong>${ev.salesCount}</strong></td>
      <td class="text-right"><strong>R$ ${ev.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
      <td class="text-right">
        <select class="action-dropdown-trigger" onchange="handleEventAction(this, ${ev.id})">
          <option value="">Ações...</option>
          <option value="edit">Editar</option>
          <option value="duplicate">Duplicar</option>
          <option value="toggle">${ev.status === 'ativos' ? 'Suspender' : 'Publicar'}</option>
          <option value="close">Encerrar</option>
          <option value="checkin">Check-in</option>
          <option value="attendees">Participantes</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function handleEventAction(selectEl, eventId) {
  const val = selectEl.value;
  if (!val) return;
  
  const event = EVENTS_DATA.find(ev => ev.id === eventId);
  if (!event) return;

  if (val === 'edit') {
    alert(`Editar evento: ${event.name}`);
  } else if (val === 'duplicate') {
    const clone = JSON.parse(JSON.stringify(event));
    clone.id = EVENTS_DATA.length + 1;
    clone.name += " (Cópia)";
    EVENTS_DATA.push(clone);
    renderEventsTable();
    alert('Evento duplicado com sucesso!');
  } else if (val === 'toggle') {
    event.status = event.status === 'ativos' ? 'inativos' : 'ativos';
    renderEventsTable();
    alert(`Status alterado com sucesso!`);
  } else if (val === 'close') {
    event.status = 'inativos';
    renderEventsTable();
    alert(`Evento encerrado e arquivado.`);
  } else if (val === 'checkin') {
    switchActiveView('events-checkin');
  } else if (val === 'attendees') {
    switchActiveView('events-attendees');
  }
  
  // reset dropdown
  selectEl.value = '';
}

/* ==========================================================================
   3. Finance Module Logic
   ========================================================================== */

// Payout History initial logs
const PAYOUTS_HISTORY = [
  { id: "REP000401", date: "30/06/2026", value: 1250.00, account: "Banco Inter", method: "TED", status: "Pago" },
  { id: "REP000380", date: "20/06/2026", value: 890.00, account: "PIX", method: "PIX", status: "Pago" },
  { id: "REP000355", date: "10/06/2026", value: 450.00, account: "Nubank", method: "Conta Corrente", status: "Cancelado" }
];

let payoutWizardStep = 1;
let payoutAvailableBalance = 248.96;
let payoutRequestedBalance = 248.96;
let payoutSelectedBank = "Banco Inter";
let payoutSelectedMethod = "PIX";
let payoutHasPending = false;

function initFinanceModule() {

  // Render original history table
  renderPayoutHistory();
  calculateAnticipationSimPage();
  resetRepasseWizard();

  // Render new Ticketera modules
  if (typeof renderPDVs === 'function') renderPDVs();
  if (typeof renderRefundsLog === 'function') renderRefundsLog();
  if (typeof renderCustomPayRules === 'function') renderCustomPayRules();
  if (typeof renderAdvancedTables === 'function') renderAdvancedTables();

  // Bind Dashboard search & filters
  const searchInput = document.getElementById('search-financial-balance');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      financialSearchQuery = e.target.value;
      renderFinancialBalanceRows();
    });
  }
  
  const orgFilter = document.getElementById('filter-financial-organizer');
  if (orgFilter) {
    orgFilter.addEventListener('change', (e) => {
      financialFilterOrganizer = e.target.value;
      renderFinancialBalanceRows();
    });
  }

  const statusFilter = document.getElementById('filter-financial-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      financialFilterStatus = e.target.value;
      renderFinancialBalanceRows();
    });
  }

  if (typeof renderFinancialBalanceRows === 'function') renderFinancialBalanceRows();
  updateEvolutionChartFilter('7d');

  // Saque buttons - scroll to the page form
  const newRepasseBtn = document.getElementById('financial-new-repasse-btn');
  if (newRepasseBtn) {
    newRepasseBtn.addEventListener('click', () => {
      switchActiveView('financial-repass');
      const formEl = document.getElementById('page-repasse-form');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Bind the embedded page repasse form submission
  const pageForm = document.getElementById('page-repasse-form');
  if (pageForm) {
    pageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (payoutHasPending) {
        alert('Você já possui uma solicitação de repasse em processamento. Por favor, aguarde a conclusão para enviar uma nova.');
        return;
      }
      
      const valInput = parseFloat(document.getElementById('payout-amount-input').value) || 0;
      if (valInput <= 0 || valInput > payoutAvailableBalance) {
        alert('O valor solicitado de repasse deve ser maior que zero e menor ou igual ao saldo disponível.');
        return;
      }
      payoutRequestedBalance = valInput;
      
      // Update selected bank
      const radBank = document.querySelector('input[name="repasse-bank"]:checked');
      if (radBank) {
        if (radBank.value === 'inter') payoutSelectedBank = "Banco Inter";
        else if (radBank.value === 'bb') payoutSelectedBank = "Banco do Brasil";
        else if (radBank.value === 'itau') payoutSelectedBank = "Itaú";
        else if (radBank.value === 'nubank') payoutSelectedBank = "Nubank";
        else if (radBank.value === 'pix') payoutSelectedBank = "PIX";
      }
      
      payoutSelectedMethod = document.querySelector('input[name="payout-method"]:checked').value;

      payoutWizardStep = 4;
      updatePayoutWizardUI();
      openModal('request-repasse');
    });
  }

  // CSV / PDF export triggers
  const csvBtn = document.getElementById('financial-export-csv-btn');
  if (csvBtn) {
    csvBtn.addEventListener('click', () => {
      handleFinancialExport();
    });
  }
  
  // Balance rendering and triggers on load
  if (typeof renderFinancialBalanceRows === 'function') renderFinancialBalanceRows();
  if (typeof renderFinancialEligibleEvents === 'function') renderFinancialEligibleEvents();
  const pdfBtn = document.getElementById('financial-export-pdf-btn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      exportPayoutsPDF();
    });
  }

  // Balance & anticipation triggers
  document.querySelectorAll('.btn-trigger-balanco').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const eventName = btn.closest('tr').querySelector('.event-name-td').textContent;
      document.getElementById('balance-event-name').textContent = eventName;
      openModal('balance');
    });
  });

  document.querySelectorAll('.btn-trigger-antecipar').forEach(btn => {
    btn.addEventListener('click', () => {
      openModal('anticipate');
    });
  });
}

function renderPayoutHistory() {
  const tbody = document.getElementById('table-payouts-history-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  let pendingCount = 0;
  
  PAYOUTS_HISTORY.forEach(p => {
    const tr = document.createElement('tr');
    
    // Status color badge
    let statusClass = 'bg-secondary';
    if (p.status === 'Pago') statusClass = 'bg-success';
    else if (p.status === 'Pendente' || p.status === 'Aguardando Aprovação') statusClass = 'bg-warning text-dark';
    else if (p.status === 'Em Processamento' || p.status === 'Em processamento') statusClass = 'bg-info';
    else if (p.status === 'Cancelado' || p.status === 'Rejeitado') statusClass = 'bg-danger';

    if (p.status === 'Em processamento' || p.status === 'Em Processamento' || p.status === 'Aguardando Aprovação') {
      pendingCount++;
    }

    const receiptAction = p.status === 'Pago' 
      ? `<button class="actions-btn" style="padding: 2px 6px; font-size: 11px;" onclick="downloadPayoutReceipt('${p.id}')"><i class="fa-solid fa-file-arrow-down"></i> Recibo</button>` 
      : '-';

    tr.innerHTML = `
      <td><strong>${p.id}</strong></td>
      <td>${p.date}</td>
      <td class="amount">R$ ${p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td>${p.account} (${p.method})</td>
      <td><span class="badge ${statusClass}">${p.status}</span></td>
      <td class="text-right">${receiptAction}</td>
    `;
    tbody.prepend(tr); // show newest first
  });

  // Update summaries
  payoutHasPending = pendingCount > 0;
  document.getElementById('payout-summary-pending').textContent = pendingCount;
  document.getElementById('payout-summary-available').textContent = `R$ ${payoutAvailableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const submitBtn = document.getElementById('btn-submit-repasse-form');
  if (submitBtn) {
    if (payoutHasPending) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="ph-lock me-1"></i> Repasse em Processamento`;
      submitBtn.classList.remove('btn-success');
      submitBtn.classList.add('btn-light', 'border');
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Solicitar Repasse`;
      submitBtn.classList.remove('btn-light', 'border');
      submitBtn.classList.add('btn-success');
    }
  }
}



/* ==========================================================================
   3b. Payout Multi-Step Wizard Engine
   ========================================================================== */
function resetRepasseWizard() {
  payoutWizardStep = 4;
  
  if (typeof renderFinancialEligibleEvents === 'function') {
    renderFinancialEligibleEvents();
  }
  
  const firstChk = document.querySelector('.chk-eligible-event:not([disabled])');
  if (firstChk) {
    firstChk.checked = true;
  }
  
  updatePayoutAvailableSum();
  
  // reset bank / PIX
  selectRepasseBankCard('inter');
  const pixMethod = document.querySelector('input[name="payout-method"][value="PIX"]');
  if (pixMethod) pixMethod.checked = true;
  payoutSelectedMethod = "PIX";
  
  // reset terms
  document.getElementById('chk-payout-terms-1').checked = false;
  document.getElementById('chk-payout-terms-2').checked = false;

  updatePayoutAvailableSum();
  updatePayoutWizardUI();
}

function updatePayoutWizardUI() {
  // Hide all panes
  document.querySelectorAll('.repasse-wizard-pane').forEach(pane => {
    pane.style.display = 'none';
  });

  // Show active pane
  const activePane = document.getElementById(`repasse-wizard-pane-${payoutWizardStep}`);
  if (activePane) {
    activePane.style.display = 'block';
  }

  // Update Stepper header labels
  document.querySelectorAll('.stepper-step').forEach((step, idx) => {
    step.className = 'stepper-step';
    const stepNum = idx + 1;
    if (stepNum === payoutWizardStep) {
      step.classList.add('active');
    } else if (stepNum < payoutWizardStep) {
      step.classList.add('completed');
    }
  });

  // Footer buttons management
  const btnCancel = document.getElementById('btn-repasse-cancel');
  const btnPrev = document.getElementById('btn-repasse-prev');
  const btnNext = document.getElementById('btn-repasse-next');

  if (btnCancel) {
    btnCancel.style.display = payoutWizardStep === 1 ? 'block' : 'none';
  }

  if (payoutWizardStep === 1) {
    if (btnPrev) {
      btnPrev.style.display = 'none';
      btnPrev.textContent = 'Voltar';
    }
    if (btnNext) {
      btnNext.style.display = 'block';
      btnNext.textContent = 'Avançar';
      btnNext.disabled = false;
    }
  } else if (payoutWizardStep === 2) {
    if (btnPrev) {
      btnPrev.style.display = 'block';
      btnPrev.textContent = 'Voltar';
    }
    if (btnNext) {
      btnNext.style.display = 'block';
      btnNext.textContent = 'Avançar';
      btnNext.disabled = false;
    }
  } else if (payoutWizardStep === 3) {
    if (btnPrev) {
      btnPrev.style.display = 'block';
      btnPrev.textContent = 'Voltar';
    }
    if (btnNext) {
      btnNext.style.display = 'block';
      btnNext.textContent = 'Avançar';
    }
    validatePayoutTermsAcceptance();
  } else if (payoutWizardStep === 4) {
    if (btnPrev) {
      btnPrev.style.display = 'block';
      btnPrev.textContent = 'Voltar';
    }
    if (btnNext) {
      btnNext.style.display = 'block';
      btnNext.textContent = 'Confirmar';
      btnNext.disabled = false;
    }
    
    // update confirmation labels
    const confirmVal = document.getElementById('payout-confirm-value');
    if (confirmVal) confirmVal.textContent = `R$ ${payoutRequestedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    
    const confirmAcc = document.getElementById('payout-confirm-account');
    if (confirmAcc) confirmAcc.textContent = payoutSelectedBank;
    
    const confirmMethod = document.getElementById('payout-confirm-method');
    if (confirmMethod) {
      let methodKey = payoutSelectedMethod;
      if (payoutSelectedMethod === 'PIX') {
        methodKey += " (financeiro@empresa.com.br)";
      }
      confirmMethod.textContent = methodKey;
    }
  } else if (payoutWizardStep === 5) {
    if (btnPrev) {
      btnPrev.style.display = 'block';
      btnPrev.textContent = 'Nova Solicitação';
    }
    if (btnNext) {
      btnNext.style.display = 'block';
      btnNext.textContent = 'Ver Histórico';
      btnNext.disabled = false;
    }
  }
}

function navigateRepasseWizard(direction) {
  // If moving forward, validate inputs
  if (direction === 1) {
    if (payoutWizardStep === 1) {
      const valInput = parseFloat(document.getElementById('payout-amount-input').value) || 0;
      if (valInput <= 0 || valInput > payoutAvailableBalance) {
        alert('O valor solicitado de repasse deve ser maior que zero e menor ou igual ao saldo disponível.');
        return;
      }
      payoutRequestedBalance = valInput;
      
      // update step 3 summary
      document.getElementById('payout-summary-gross').textContent = `R$ ${payoutRequestedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      document.getElementById('payout-summary-net').textContent = `R$ ${payoutRequestedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      
      payoutWizardStep = 2;
      updatePayoutWizardUI();
    } 
    else if (payoutWizardStep === 2) {
      // bank accounts and method check
      const radBank = document.querySelector('input[name="repasse-bank"]:checked');
      if (radBank.value === 'inter') payoutSelectedBank = "Banco Inter";
      else if (radBank.value === 'bb') payoutSelectedBank = "Banco do Brasil";
      else if (radBank.value === 'itau') payoutSelectedBank = "Itaú";
      else if (radBank.value === 'nubank') payoutSelectedBank = "Nubank";
      else if (radBank.value === 'pix') payoutSelectedBank = "PIX";

      payoutSelectedMethod = document.querySelector('input[name="payout-method"]:checked').value;
      
      // Update terms timeline display period
      const periodLabel = document.getElementById('payout-summary-period');
      if (payoutSelectedMethod === 'PIX') {
        periodLabel.textContent = "Instantâneo (Até 10 min)";
      } else {
        periodLabel.textContent = "Até 1 dia útil";
      }

      payoutWizardStep = 3;
      updatePayoutWizardUI();
    } 
    else if (payoutWizardStep === 3) {
      payoutWizardStep = 4;
      updatePayoutWizardUI();
    } 
    else if (payoutWizardStep === 4) {
      // business rule: prevent duplicate payout requests if there is one processing
      const hasPending = PAYOUTS_HISTORY.some(p => p.status === 'Em processamento' || p.status === 'Em Processamento');
      if (hasPending) {
        alert('Impossível prosseguir. Já existe uma solicitação de repasse em processamento. Aguarde a aprovação atual.');
        closeModal('request-repasse');
        return;
      }

      // Confirm Repasse payout request execution!
      payoutAvailableBalance -= payoutRequestedBalance;
      
      const newPayoutId = "REP000458";
      const requestDate = "07/07/2026";
      
      // Append payout history log
      PAYOUTS_HISTORY.push({
        id: newPayoutId,
        date: requestDate,
        value: payoutRequestedBalance,
        account: payoutSelectedBank,
        method: payoutSelectedMethod,
        status: "Em processamento"
      });
      
      // Render success panel content
      document.getElementById('success-payout-id').textContent = `#${newPayoutId}`;
      document.getElementById('success-payout-value').textContent = `R$ ${payoutRequestedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      document.getElementById('success-payout-date').textContent = "08/07/2026"; // next day
      
      // Audit log registration (regras de negócio)
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR');
      const auditBox = document.getElementById('payout-audit-logs');
      auditBox.innerHTML = `
        <strong>Ação Registrada na Auditoria Interna:</strong><br>
        • Evento: Registro de Solicitação de Repasse #${newPayoutId}<br>
        • Data/Hora: 07/07/2026 às ${timeStr}<br>
        • Usuário Responsável: vinicius.casagrande@diskingressos.com.br<br>
        • IP de Origem: 189.12.34.56 (Local Host)<br>
        • Status do Fluxo: Aguardando Aprovação / Em Processamento
      `;

      // Update parent list summaries
      renderPayoutHistory();
      if (typeof renderFinancialBalanceRows === 'function') renderFinancialBalanceRows();
      if (typeof renderFinancialEligibleEvents === 'function') renderFinancialEligibleEvents();

      // Simulated platform and email notification trigger on status change
      console.log(`[Sistema de Notificação] E-mail enviado para vinicius.casagrande@diskingressos.com.br notificando a criação do repasse #${newPayoutId}.`);
      console.log(`[Sistema de Notificação] Alerta de plataforma criado: Status do repasse #${newPayoutId} mudou para "Em processamento".`);
      alert(`[Notificação DiskIngressos]\n• E-mail enviado para vinicius.casagrande@diskingressos.com.br informando sobre o repasse #${newPayoutId}.\n• Notificação interna de plataforma criada com o status "Em Processamento".`);

      payoutWizardStep = 5;
      updatePayoutWizardUI();
    } 
    else if (payoutWizardStep === 5) {
      // Close modal and focus on requests page
      closeModal('request-repasse');
      switchActiveView('financial-repass');
    }
  } else {
    // Navigate Backwards
    if (payoutWizardStep === 5) {
      resetRepasseWizard();
      return;
    }
    if (payoutWizardStep === 4) {
      closeModal('request-repasse');
      return;
    }
    payoutWizardStep += direction;
    updatePayoutWizardUI();
  }
}

function updatePayoutAvailableSum() {
  let totalAvailable = 0;
  document.querySelectorAll('.chk-eligible-event').forEach(chk => {
    if (chk.checked) {
      totalAvailable += parseFloat(chk.getAttribute('data-value')) || 0;
    }
  });
  
  payoutAvailableBalance = totalAvailable;
  
  const valInputEl = document.getElementById('payout-amount-input');
  if (valInputEl) {
    valInputEl.value = payoutAvailableBalance;
  }
  
  const calcAvailableEl = document.getElementById('payout-calc-available');
  if (calcAvailableEl) {
    calcAvailableEl.textContent = `R$ ${payoutAvailableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
  
  updatePayoutCalcRemaining();
}

function updatePayoutCalcRemaining() {
  const val = parseFloat(document.getElementById('payout-amount-input').value) || 0;
  const remaining = payoutAvailableBalance - val;
  const remainingEl = document.getElementById('payout-calc-remaining');
  
  remainingEl.textContent = `R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (remaining < 0) {
    remainingEl.style.color = '#ef4444';
  } else {
    remainingEl.style.color = 'var(--text-muted)';
  }
}

function setPayoutMaxAmount() {
  document.getElementById('payout-amount-input').value = payoutAvailableBalance;
  updatePayoutCalcRemaining();
}

function selectRepasseBankCard(bankId) {
  // remove selected classes
  document.querySelectorAll('.bank-account-card-option').forEach(card => {
    card.classList.remove('selected');
    card.querySelector('input[type="radio"]').checked = false;
  });

  const selectedCard = document.getElementById(`bank-opt-${bankId}`);
  selectedCard.classList.add('selected');
  selectedCard.querySelector('input[type="radio"]').checked = true;
}

function updatePayoutMethodState() {
  // auto updates visual state if needed
}

function validatePayoutTermsAcceptance() {
  const terms1 = document.getElementById('chk-payout-terms-1').checked;
  const terms2 = document.getElementById('chk-payout-terms-2').checked;
  const btnNext = document.getElementById('btn-repasse-next');
  
  if (payoutWizardStep === 3) {
    btnNext.disabled = !(terms1 && terms2);
  }
}

function calculateAnticipationSim() {
  const gross = parseFloat(document.getElementById('anticipate-gross-input').value) || 0;
  const taxRate = 0.035; // 3.5%
  const feeRate = 0.15; // 15% platform/card fees
  
  const tax = gross * taxRate;
  const fees = gross * feeRate;
  const net = gross - tax - fees;

  document.getElementById('sim-gross').textContent = `R$ ${gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.getElementById('sim-tax').textContent = `- R$ ${tax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.getElementById('sim-fees').textContent = `- R$ ${fees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.getElementById('sim-net').textContent = `R$ ${net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function calculateAnticipationSimPage() {
  const gross = parseFloat(document.getElementById('anticipate-gross-input-page').value) || 0;
  const taxRate = 0.035; // 3.5%
  const feeRate = 0.15; // 15% platform/card fees
  
  const tax = gross * taxRate;
  const fees = gross * feeRate;
  const net = gross - tax - fees;

  document.getElementById('sim-page-gross').textContent = `R$ ${gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.getElementById('sim-page-tax').textContent = `- R$ ${tax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.getElementById('sim-page-fees').textContent = `- R$ ${fees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.getElementById('sim-page-net').textContent = `R$ ${net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

/* ==========================================================================
   4. Settings Module Logic
   ========================================================================== */
function initSettingsModule() {
  const links = document.querySelectorAll('#settings-sidebar-links .settings-nav-link');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      const pane = link.getAttribute('data-setview');
      activateSettingsPane(pane);
    });
  });
}

function activateSettingsPane(paneName) {
  document.querySelectorAll('.settings-pane').forEach(pane => {
    pane.style.display = 'none';
  });
  
  const targetPane = document.getElementById(`setpane-${paneName}`);
  if (targetPane) {
    targetPane.style.display = 'block';
  }

  // Update link class if not triggered manually
  const links = document.querySelectorAll('#settings-sidebar-links .settings-nav-link');
  links.forEach(link => {
    if (link.getAttribute('data-setview') === paneName) {
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}

/* ==========================================================================
   5. Reports Module Logic
   ========================================================================== */
function initReportsModule() {
  const tabs = document.querySelectorAll('#reports-sub-tabs .rtab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const subtab = tab.getAttribute('data-subtab');
      activateReportsSubtab(subtab);
    });
  });
}

function activateReportsSubtab(subtabName) {
  document.querySelectorAll('.reports-subpane').forEach(pane => {
    pane.style.display = 'none';
  });
  
  const targetPane = document.getElementById(`rep-pane-${subtabName}`);
  if (targetPane) {
    targetPane.style.display = 'block';
  }

  // Sync tab active states
  const tabs = document.querySelectorAll('#reports-sub-tabs .rtab');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-subtab') === subtabName) {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    }
  });
}

/* ==========================================================================
   5. Modals & Actions Helper
   ========================================================================== */
function openModal(modalId) {
  const modal = document.getElementById(`modal-${modalId}`);
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(`modal-${modalId}`);
  if (modal) {
    modal.style.display = 'none';
  }
}

function initQuickActions() {
  // New event btn triggers modal
  const newEventBtn = document.getElementById('new-event-btn');
  if (newEventBtn) {
    newEventBtn.addEventListener('click', () => {
      openModal('new-event');
    });
  }

  // Sidebar footer buttons
  const quickNewEventBtn = document.getElementById('quick-new-event-btn');
  if (quickNewEventBtn) {
    quickNewEventBtn.addEventListener('click', () => {
      openModal('new-event');
    });
  }
  
  const quickRepasseBtn = document.getElementById('quick-repasse-btn');
  if (quickRepasseBtn) {
    quickRepasseBtn.addEventListener('click', () => {
      switchActiveView('financial-repass');
      setTimeout(() => {
        const pageForm = document.getElementById('page-repasse-form');
        if (pageForm) pageForm.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    });
  }
  
  const quickReportBtn = document.getElementById('quick-report-btn');
  if (quickReportBtn) {
    quickReportBtn.addEventListener('click', () => {
      switchActiveView('reports-sales');
    });
  }

  // refresh dashboard data simulation
  const refreshBtn = document.getElementById('dashboard-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      alert('Indicadores atualizados em tempo real!');
    });
  }
}

/* ==========================================================================
   6. ChartJS Graphs Setup
   ========================================================================== */
function initCharts() {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js not loaded. Skipping chart rendering.");
    return;
  }
  // 1. Dashboard Sales Line Chart
  const salesCtx = document.getElementById('chart-sales-dashboard');
  if (salesCtx) {
    new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
        datasets: [{
          label: 'Receita (R$)',
          data: [12000, 14500, 11000, 15200, 19000, 17800, 20721],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 2. Dashboard Access Bar Chart
  const accessCtx = document.getElementById('chart-access-dashboard');
  if (accessCtx) {
    new Chart(accessCtx, {
      type: 'bar',
      data: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Acessos Únicos',
          data: [640, 810, 780, 920, 1100, 1400, 1200],
          backgroundColor: '#f97316',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 3. Marketing Doughnut Chart
  const mktCtx = document.getElementById('chart-reports-marketing');
  if (mktCtx) {
    new Chart(mktCtx, {
      type: 'doughnut',
      data: {
        labels: ['Google', 'Instagram', 'Facebook', 'Direto/Outros'],
        datasets: [{
          data: [45, 30, 15, 10],
          backgroundColor: ['#4285f4', '#e1306c', '#1877f2', '#9ca3af']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 15 }
          }
        }
      }
    });
  }
}

/* ==========================================================================
   Financial Export and Download Helpers
   ========================================================================== */
function downloadPayoutReceipt(payoutId) {
  alert(`Download do comprovante do repasse ${payoutId} iniciado com sucesso! (PDF)`);
}

function exportPayoutsCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "N,Data,Valor,Conta,Status\r\n";
  PAYOUTS_HISTORY.forEach(p => {
    csvContent += `${p.id},${p.date},${p.value},${p.account} (${p.method}),${p.status}\r\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `historico_repasses_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportPayoutsPDF() {
  alert("Exportação do histórico de repasses em PDF gerada com sucesso! O download começará em instantes.");
}




// Global state for borderô signing
let BORDERO_STATES = {};

// Global Accounting declarations
let ACCOUNTING_PLANO_CONTAS = [
  { code: "1.0.00", name: "Ativos", type: "ativo", parent: null },
  { code: "1.1.00", name: "Ativo Circulante", type: "ativo", parent: "1.0.00" },
  { code: "1.1.01", name: "Caixa Geral", type: "ativo", parent: "1.1.00" },
  { code: "1.1.02", name: "Bancos Conta Movimento (Itaú)", type: "ativo", parent: "1.1.00" },
  { code: "1.1.04", name: "Contas a Receber (Adquirentes)", type: "ativo", parent: "1.1.00" },
  { code: "2.0.00", name: "Passivos", type: "passivo", parent: null },
  { code: "2.1.00", name: "Passivo Circulante", type: "passivo", parent: "2.0.00" },
  { code: "2.1.02", name: "Produtores a Pagar (Repasses)", type: "passivo", parent: "2.1.00" },
  { code: "2.1.03", name: "Impostos a Recolher (Prefeitura/União)", type: "passivo", parent: "2.1.00" },
  { code: "3.0.00", name: "Patrimônio Líquido", type: "patrimonio", parent: null },
  { code: "3.1.00", name: "Capital Social", type: "patrimonio", parent: "3.0.00" },
  { code: "3.1.02", name: "Lucros Acumulados", type: "patrimonio", parent: "3.0.00" },
  { code: "4.0.00", name: "Receitas", type: "receita", parent: null },
  { code: "4.1.00", name: "Receitas Operacionais", type: "receita", parent: "4.0.00" },
  { code: "4.1.01", name: "Receita Venda Ingressos", type: "receita", parent: "4.1.00" },
  { code: "4.1.02", name: "Receita Taxa Conveniência", type: "receita", parent: "4.1.00" },
  { code: "5.0.00", name: "Despesas", type: "despesa", parent: null },
  { code: "5.1.00", name: "Despesas Operacionais", type: "despesa", parent: "5.0.00" },
  { code: "5.1.01", name: "Despesa Gateway de Pagamento", type: "despesa", parent: "5.1.00" },
  { code: "5.1.02", name: "Despesa Cloud (Servidores/API)", type: "despesa", parent: "5.1.00" },
  { code: "5.1.03", name: "Despesa Marketing & Aquisição", type: "despesa", parent: "5.1.00" }
];

let ACC_LANCAMENTOS = [
  { id: 1, date: "2026-07-10", desc: "Apropriação Receita Venda Ingressos - Balbúrdia", debit: "1.1.04 - Contas a Receber (Adquirentes)", credit: "4.1.01 - Receita Venda Ingressos", value: 18500, eventId: 1653, costCenter: "Eventos" },
  { id: 2, date: "2026-07-10", desc: "Comissão DiskIngressos - Balbúrdia", debit: "5.1.01 - Despesa Gateway de Pagamento", credit: "1.1.04 - Contas a Receber (Adquirentes)", value: 1480, eventId: 1653, costCenter: "Financeiro" },
  { id: 3, date: "2026-07-11", desc: "Apropriação Vendas - 6ª Costelada dos Amigos", debit: "1.1.04 - Contas a Receber (Adquirentes)", credit: "4.1.01 - Receita Venda Ingressos", value: 24200, eventId: 1677, costCenter: "Eventos" },
  { id: 4, date: "2026-07-12", desc: "Repasse efetuado - 6ª Costelada dos Amigos", debit: "2.1.02 - Produtores a Pagar (Repasses)", credit: "1.1.02 - Bancos Conta Movimento (Itaú)", value: 22880, eventId: 1677, costCenter: "Eventos" },
  { id: 5, date: "2026-07-12", desc: "Despesa Cloud Servidores AWS Mensal", debit: "5.1.02 - Despesa Cloud (Servidores/API)", credit: "1.1.02 - Bancos Conta Movimento (Itaú)", value: 4500, eventId: null, costCenter: "Tecnologia" }
];

let ACC_AUDIT_LOGS = [
  { id: 1, timestamp: "2026-07-13 09:12:04", user: "vinicius.casagrande", ip: "192.168.1.45", action: "Aprovação de Payout", detail: "Repasse #REP-1677 no valor de R$ 22.880,00 aprovado para o produtor." },
  { id: 2, timestamp: "2026-07-13 10:15:30", user: "vinicius.casagrande", ip: "192.168.1.45", action: "Alteração de Regime Tributário", detail: "Regime contábil atualizado de Presumido para Simples Nacional." }
];

let ACC_CONCILIACAO_PENDENTES = [
  { id: 1, date: "2026-07-12", bankDesc: "Stone Adquirente Pago D+1", sysDesc: "Fechamento Lote Vendas Cartão", value: 14850, diff: 0, status: "Pendente" },
  { id: 2, date: "2026-07-13", bankDesc: "Tarifa mensalidade Itaú", sysDesc: "Provisão Taxas Bancárias", value: 95, diff: 5, status: "Divergente" }
];

let ACC_REPASSES_HISTORICO = [
  { id: "REP-1677", date: "2026-07-12", method: "PIX", value: 22880 }
];

let currentAccountingTab = "dashboard";
let currentAccountingMode = "expert";

window.ACCOUNTING_PLANO_CONTAS = ACCOUNTING_PLANO_CONTAS;
window.ACC_LANCAMENTOS = ACC_LANCAMENTOS;
window.ACC_AUDIT_LOGS = ACC_AUDIT_LOGS;
window.ACC_CONCILIACAO_PENDENTES = ACC_CONCILIACAO_PENDENTES;
window.ACC_REPASSES_HISTORICO = ACC_REPASSES_HISTORICO;


async function sendBorderoSignatureNotification() {
  const eventId = document.getElementById('financial-bordero-event-selector').value;
  if (!eventId) return;

  const btn = document.getElementById('bordero-btn-notify');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph-spinner-gap spinner me-1"></i> Enviando...';
  }

  try {
    // 1. AJAX/Fetch Call to API (Httpbin mock)
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId: eventId,
        action: 'send_signature_notification',
        provider: 'Autentique',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) throw new Error('Falha na comunicação com o servidor Autentique');

    const result = await response.json();
    console.log("Autentique API Response:", result);

    // 2. Persist in memory state
    if (!BORDERO_STATES[eventId]) {
      BORDERO_STATES[eventId] = { status: "Pendente", notified: false, paymentDate: "", targetBank: "", financeNotes: "" };
    }
    BORDERO_STATES[eventId].notified = true;

    // 3. Persist in Firestore if active
    if (window.firebaseDB && window.firebaseDB.isConfigured) {
      await window.firebaseDB.updateEvent(eventId, {
        borderoNotified: true
      });
    }

    alert("Notificação de assinatura enviada com sucesso via API do Autentique!");
    loadEventBorderoData(eventId);

  } catch (error) {
    console.error("Erro na requisição assíncrona:", error);
    alert("Erro ao disparar API assíncrona: " + error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph-paper-plane-tilt me-1"></i> Notificar Assinatura do Borderô';
    }
  }
}

async function saveBorderoProgramming(e) {
  e.preventDefault();
  const eventId = document.getElementById('financial-bordero-event-selector').value;
  if (!eventId) return;

  const paymentDate = document.getElementById('bordero-payment-date').value;
  const targetBank = document.getElementById('bordero-target-bank').value;
  const financeNotes = document.getElementById('bordero-finance-notes').value.trim();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ph-spinner-gap spinner me-1"></i> Gravando...';
  }

  try {
    // 1. AJAX/Fetch Call to API (Httpbin mock)
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId: eventId,
        action: 'save_programming',
        paymentDate,
        targetBank,
        financeNotes
      })
    });

    if (!response.ok) throw new Error('Falha ao salvar programação financeira');

    const result = await response.json();
    console.log("Programming API Response:", result);

    // 2. Persist in memory state
    if (!BORDERO_STATES[eventId]) {
      BORDERO_STATES[eventId] = { status: "Pendente", notified: false, paymentDate: "", targetBank: "", financeNotes: "" };
    }
    BORDERO_STATES[eventId].paymentDate = paymentDate;
    BORDERO_STATES[eventId].targetBank = targetBank;
    BORDERO_STATES[eventId].financeNotes = financeNotes;

    // 3. Persist in Firestore if active
    if (window.firebaseDB && window.firebaseDB.isConfigured) {
      await window.firebaseDB.updateEvent(eventId, {
        borderoPaymentDate: paymentDate,
        borderoTargetBank: targetBank,
        borderoFinanceNotes: financeNotes
      });
    }

    alert("Programação de pagamento gravada e sincronizada com sucesso via API assíncrona!");
    loadEventBorderoData(eventId);

  } catch (error) {
    console.error("Erro na requisição assíncrona:", error);
    alert("Erro ao gravar programação: " + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="ph-floppy-disk me-1"></i> Gravar Programação';
    }
  }
}

function renderAgendaCalendarGrid() {
  const grid = document.getElementById('agenda-calendar-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Helper to extract DD/MM/YYYY dates from EVENTS_DATA
  function getEventOnDate(day, month, year) {
    const dStr = String(day).padStart(2, '0');
    const mStr = String(month + 1).padStart(2, '0');
    const yStr = String(year);
    const dateKey = `${dStr}/${mStr}/${yStr}`; // e.g. "06/07/2026"

    return EVENTS_DATA.filter(ev => ev.date && ev.date.includes(dateKey));
  }

  // Get active category filter
  const catFilterEl = document.getElementById('agenda-category-filter');
  const catFilter = catFilterEl ? catFilterEl.value : 'todos';

  for (let m = 0; m < 12; m++) {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'calendar-card';

    const title = document.createElement('div');
    title.className = 'calendar-month-title';
    title.textContent = monthNames[m];
    card.appendChild(title);

    const table = document.createElement('table');
    table.className = 'calendar-table';

    // Weekdays header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Do</th>
        <th>Se</th>
        <th>Te</th>
        <th>Qu</th>
        <th>Qu</th>
        <th>Se</th>
        <th>Sa</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    // Calendar logic
    const firstDay = new Date(currentAgendaYear, m, 1).getDay();
    const daysInMonth = new Date(currentAgendaYear, m + 1, 0).getDate();

    let dayCount = 1;
    let rowHTML = '';

    for (let r = 0; r < 6; r++) {
      let rowCells = '';
      let rowHasDays = false;

      for (let c = 0; c < 7; c++) {
        if (r === 0 && c < firstDay) {
          rowCells += '<td class="calendar-empty-cell"></td>';
        } else if (dayCount > daysInMonth) {
          rowCells += '<td class="calendar-empty-cell"></td>';
        } else {
          rowHasDays = true;
          const matchingEvents = getEventOnDate(dayCount, m, currentAgendaYear);
          
          // Apply category filter
          const filteredEvents = catFilter === 'todos' ? matchingEvents : matchingEvents.filter(ev => {
            if (catFilter === 'Show') return ev.category === 'Show';
            if (catFilter === 'Teatro') return ev.category === 'Teatro';
            if (catFilter === 'Standup') return ev.category === 'Standup';
            if (catFilter === 'Corporativo') return ev.category === 'Corporativo' || ev.category === 'Palestra';
            return true;
          });

          if (filteredEvents.length > 0) {
            // Color class based on first event category
            let colorClass = 'calendar-day-other';
            const firstCat = filteredEvents[0].category;
            if (firstCat === 'Show') colorClass = 'calendar-day-show';
            else if (firstCat === 'Teatro') colorClass = 'calendar-day-teatro';
            else if (firstCat === 'Standup' || firstCat === 'Corporativo') colorClass = 'calendar-day-corp';

            rowCells += `<td class="${colorClass} calendar-day-has-event text-white fw-bold" style="cursor: pointer; border-radius: 50%;" onclick="showAgendaEventDetails('${dayCount}/${m+1}/${currentAgendaYear}')">${dayCount}</td>`;
          } else {
            rowCells += `<td>${dayCount}</td>`;
          }
          dayCount++;
        }
      }

      if (rowHasDays) {
        rowHTML += `<tr>${rowCells}</tr>`;
      }
      if (dayCount > daysInMonth) break;
    }

    tbody.innerHTML = rowHTML;
    table.appendChild(tbody);
    card.appendChild(table);
    col.appendChild(card);
    grid.appendChild(col);
  }

  // Update summary stats strip
  updateAgendaStats();
}

function updateAgendaStats() {
  const totalEventsEl = document.getElementById('agenda-stats-total-events');
  const totalAudienceEl = document.getElementById('agenda-stats-total-audience');
  const totalRevenueEl = document.getElementById('agenda-stats-total-revenue');
  const peakMonthEl = document.getElementById('agenda-stats-peak-month');

  if (!totalEventsEl) return;

  const yearStr = String(currentAgendaYear);
  const yearEvents = EVENTS_DATA.filter(ev => ev.date && ev.date.includes(yearStr));

  totalEventsEl.textContent = yearEvents.length;

  let totalAudience = 0;
  let totalRevenue = 0;
  const monthCounts = Array(12).fill(0);

  yearEvents.forEach(ev => {
    totalAudience += (ev.salesCount || 0) + (ev.cortesia || 0);
    totalRevenue += (ev.revenue || 0);

    const match = ev.date.match(/\/(\d{2})\//);
    if (match) {
      const monthIdx = parseInt(match[1]) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        monthCounts[monthIdx]++;
      }
    }
  });

  totalAudienceEl.textContent = totalAudience.toLocaleString('pt-BR');
  
  if (totalRevenue >= 1000000) {
    totalRevenueEl.textContent = `R$ ${(totalRevenue / 1000000).toFixed(1)}M`;
  } else if (totalRevenue >= 1000) {
    totalRevenueEl.textContent = `R$ ${(totalRevenue / 1000).toFixed(0)}k`;
  } else {
    totalRevenueEl.textContent = `R$ ${totalRevenue.toLocaleString('pt-BR')}`;
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  let maxIdx = 0;
  let maxCount = 0;
  for (let i = 0; i < 12; i++) {
    if (monthCounts[i] > maxCount) {
      maxCount = monthCounts[i];
      maxIdx = i;
    }
  }

  peakMonthEl.textContent = maxCount > 0 ? monthNames[maxIdx] : "-";
}

function showAgendaEventDetails(dateKey) {
  const parts = dateKey.split('/');
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const modalDateTitle = document.getElementById('agenda-modal-date');
  if (modalDateTitle) {
    modalDateTitle.innerHTML = `<i class="ph-calendar me-2"></i> Eventos em ${day} de ${monthNames[month]} de ${year}`;
  }

  const dStr = String(day).padStart(2, '0');
  const mStr = String(month + 1).padStart(2, '0');
  const dateStr = `${dStr}/${mStr}/${year}`;
  const matching = EVENTS_DATA.filter(ev => ev.date && ev.date.includes(dateStr));

  const body = document.getElementById('agenda-modal-body');
  if (!body) return;

  body.innerHTML = '';

  if (matching.length === 0) {
    body.innerHTML = '<p class="text-muted text-center my-3">Nenhum evento registrado nesta data.</p>';
  } else {
    matching.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'border rounded p-2 mb-2 bg-light bg-opacity-30 d-flex gap-2 align-items-start';

      let coverImg = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=80&q=80';
      if (ev.cover) coverImg = ev.cover;

      let badgeColor = 'bg-secondary';
      if (ev.category === 'Show') badgeColor = 'bg-success';
      else if (ev.category === 'Teatro') badgeColor = 'bg-info';
      else if (ev.category === 'Standup' || ev.category === 'Corporativo') badgeColor = 'bg-warning text-dark';

      card.innerHTML = `
        <img src="${coverImg}" alt="${ev.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
        <div class="flex-grow-1" style="min-width: 0;">
          <h6 class="fw-bold fs-xs text-dark mb-1 text-truncate">${ev.name}</h6>
          <div class="d-flex align-items-center gap-1 mb-1">
            <span class="badge ${badgeColor} fs-xxs py-0.5 px-1">${ev.category || 'Outros'}</span>
            <span class="badge bg-light text-muted border fs-xxs py-0.5 px-1"><i class="ph-map-pin me-0.5"></i> ${ev.location}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center fs-xxs text-muted mt-1">
            <span>Ingressos: <strong>${ev.salesCount || 0}</strong> vendidos</span>
            <span class="text-success fw-bold">R$ ${(ev.revenue || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      `;
      body.appendChild(card);
    });
  }

  openModal('agenda-day-events');
}


let currentManagedEventId = null;

function enterEventManagement(eventId) {
  const ev = EVENTS_DATA.find(e => e.id == eventId);
  if (!ev) return;

  currentManagedEventId = eventId;

  // Update names in the event sidebar/header
  const titleEl = document.getElementById('managed-event-name-header');
  if (titleEl) titleEl.textContent = ev.name;

  const subtitleEl = document.getElementById('consult-ticket-event-subtitle');
  if (subtitleEl) subtitleEl.textContent = ev.name;

  const dashboardSubtitleEl = document.getElementById('event-dashboard-subtitle');
  if (dashboardSubtitleEl) dashboardSubtitleEl.textContent = ev.name;

  // Update stats in event dashboard
  const dbSales = document.getElementById('event-dashboard-sales');
  if (dbSales) dbSales.textContent = ev.salesCount.toLocaleString('pt-BR');

  const dbRev = document.getElementById('event-dashboard-revenue');
  if (dbRev) dbRev.textContent = `R$ ${ev.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  // Hide main sidebar nav and show event sidebar nav
  const mainNav = document.getElementById('main-sidebar-nav');
  if (mainNav) mainNav.style.display = 'none';

  const eventNav = document.getElementById('event-sidebar-nav');
  if (eventNav) eventNav.style.display = 'block';

  // Highlight "Dashboard" inside the event sidebar
  const eventSubLinks = document.querySelectorAll('#event-sidebar-nav .submenu-link');
  eventSubLinks.forEach(l => l.classList.remove('active'));
  const dashLink = Array.from(eventSubLinks).find(l => l.getAttribute('data-view') === 'event-dashboard');
  if (dashLink) dashLink.classList.add('active');

  // Switch to event dashboard view
  switchActiveView('event-dashboard');
}
window.enterEventManagement = enterEventManagement;

function exitEventManagement() {
  currentManagedEventId = null;

  // Show main sidebar nav and hide event sidebar nav
  const mainNav = document.getElementById('main-sidebar-nav');
  if (mainNav) mainNav.style.display = 'block';

  const eventNav = document.getElementById('event-sidebar-nav');
  if (eventNav) eventNav.style.display = 'none';

  // Switch back to events list
  switchActiveView('events-list');
}
window.exitEventManagement = exitEventManagement;

window.initAgendaGeneralModule = initAgendaGeneralModule;
window.selectAgendaYear = selectAgendaYear;
window.changeAgendaYear = changeAgendaYear;

/* ==========================================================================
   AI Support Chatbot Assistant
   ========================================================================== */
function initAiAssistant() {
  const toggleBtn = document.getElementById('ai-assistant-toggle-btn');
  const chatCard = document.getElementById('ai-assistant-chat-card');
  const closeBtn = document.getElementById('ai-assistant-close-btn');
  const chatInput = document.getElementById('ai-assistant-chat-input');
  const sendBtn = document.getElementById('ai-assistant-send-btn');
  const chatBody = document.getElementById('ai-assistant-chat-body');

  if (!toggleBtn || !chatCard) return;

  // Toggle chat card
  toggleBtn.addEventListener('click', () => {
    chatCard.classList.toggle('active');
    if (chatCard.classList.contains('active')) {
      chatInput.focus();
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  });

  // Close chat card
  closeBtn.addEventListener('click', () => {
    chatCard.classList.remove('active');
  });

  // Press Enter key to send
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendAiAssistantMessage();
    }
  });

  // Click Send button
  sendBtn.addEventListener('click', () => {
    sendAiAssistantMessage();
  });

  window.sendAiAssistantSuggestion = function(text) {
    appendUserMessage(text);
    processAiResponse(text);
  };
  
  function sendAiAssistantMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    chatInput.value = '';
    appendUserMessage(text);
    processAiResponse(text);
  }

  function appendUserMessage(text) {
    const msgHtml = `
      <div class="ai-msg sent">
        <div class="ai-msg-bubble">${escapeHtml(text)}</div>
        <span class="ai-msg-time">Agora</span>
      </div>
    `;
    chatBody.insertAdjacentHTML('beforeend', msgHtml);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function processAiResponse(userInput) {
    // Show a quick typing indicator or fake delay
    const typingId = 'ai-typing-' + Date.now();
    const typingHtml = `
      <div class="ai-msg received" id="${typingId}">
        <div class="ai-msg-bubble text-muted italic" style="font-style: italic;">Digitando...</div>
      </div>
    `;
    chatBody.insertAdjacentHTML('beforeend', typingHtml);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
      const indicator = document.getElementById(typingId);
      if (indicator) indicator.remove();

      let reply = "";
      let actionView = "";
      const text = userInput.toLowerCase();

      if (text.includes('ingresso') || text.includes('ticket') || text.includes('consultar')) {
        reply = "Para consultar ingressos, você pode acessar a nova página global **'Consulta de Ingressos'** na barra lateral. Lá você filtra por ID de pedido, documento, nome ou código do ingresso. Vou abrir essa tela para você!";
        actionView = "global-consult-ticket";
      } else if (text.includes('fluxo') || text.includes('caixa') || text.includes('dre') || text.includes('performance')) {
        reply = "O menu expansível **'Fluxo de Caixa'** possui as telas: *Performance Mensal*, *Extrato de Caixa*, *Evolução de Caixa* e *Demonstrativo DRE*. Vou abrir a Performance Mensal do caixa agora!";
        actionView = "cashflow-performance";
      } else if (text.includes('receita') || text.includes('faturamento')) {
        reply = "O menu expansível **'Receitas Detalhadas'** organiza seus recebimentos por Descrição, Dia, Tipo (Pix/Cartão/Boleto), Categoria, Evento, Centro de Custo, etc. Estou te levando para o descritivo de receitas!";
        actionView = "revenues-desc";
      } else if (text.includes('despesa') || text.includes('gasto')) {
        reply = "Você pode acompanhar os custos da empresa e dos eventos no menu expansível **'Despesas Detalhadas'** (Por Descrição, Categoria e Evento). Redirecionando para a tela de despesas!";
        actionView = "expenses-desc";
      } else if (text.includes('border') || text.includes('liquda') || text.includes('liquida')) {
        reply = "A **Prévia do Borderô** consolida vendas brutas, taxas operacionais de cartão e plataforma, cortesias e saldo de repasse final. Fica em *Financeiro* > *Borderô*. Vou carregar o borderô agora!";
        actionView = "financial-bordero";
      } else if (text.includes('repasse') || text.includes('solicitar') || text.includes('sacar')) {
        reply = "Para transferir o saldo disponível para sua conta bancária cadastrada, use a aba **'Solicitar Repasse'** no menu sanfona do *Financeiro*. Redirecionando para o formulário!";
        actionView = "financial-repass";
      } else {
        reply = "Sou a Inteligência Artificial de suporte da DiskIngressos. Posso ajudar você a navegar. Tente perguntar: *'Onde fica o Fluxo de Caixa?'*, *'Como consultar um ingresso?'*, *'Onde vejo minhas receitas?'* ou *'Como solicitar repasse?'*.";
      }

      const replyHtml = `
        <div class="ai-msg received">
          <div class="ai-msg-bubble">${reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</div>
          <span class="ai-msg-time">Agora</span>
        </div>
      `;
      chatBody.insertAdjacentHTML('beforeend', replyHtml);
      chatBody.scrollTop = chatBody.scrollHeight;

      // Execute auto-navigation action!
      if (actionView) {
        // Sync active link highlight in sidebar
        const subLinks = document.querySelectorAll('.submenu-link');
        subLinks.forEach(link => {
          if (link.getAttribute('data-view') === actionView) {
            subLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Expand parents
            const parentLi = link.closest('.nav-item-submenu');
            if (parentLi) {
              document.querySelectorAll('.nav-item-submenu').forEach(p => {
                if (p !== parentLi) p.classList.remove('nav-item-open');
              });
              parentLi.classList.add('nav-item-open');
            }
          }
        });
        
        switchActiveView(actionView);
      }
    }, 1000);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
}
window.initAiAssistant = initAiAssistant;

function renderMarketingAnalyticsCharts() {
  // Helpers to prevent memory leaks by destroying previous chart instances
  const chartsToInit = [
    { id: 'chart-analytics-funnel', type: 'bar', labels: ['Compra', 'Iniciou compra', 'Adicionou ao carrinho', 'Engajamento do usuário', 'Primeiras visitas (usuários únicos)', 'Visualizações'], datasets: [{ label: 'Visualizações', data: [661, 1388, 2358, 6154, 11389, 18911], backgroundColor: '#3b82f6', borderRadius: 4 }], options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } },
    { id: 'chart-analytics-age', type: 'bar', labels: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'], datasets: [{ label: 'Porcentagem %', data: [22.7, 41.5, 18.5, 9.1, 5.6, 2.6], backgroundColor: '#10b981', borderRadius: 4 }], options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } },
    
    // Abandonment Charts
    { id: 'chart-abandon-canceltype', type: 'bar', labels: ['Cancelado pela Empresa', 'Cancelado pelo Cliente', 'Cancelado'], datasets: [{ label: 'Qtd de Pedidos', data: [18, 12, 5], backgroundColor: '#3b82f6', borderRadius: 4 }, { label: 'Qtd de Ingressos', data: [24, 15, 6], backgroundColor: '#10b981', borderRadius: 4 }], options: { responsive: true, maintainAspectRatio: false } },
    { id: 'chart-abandon-date', type: 'bar', labels: ['06/04', '20/04', '26/04', '11/05', '27/05', '12/06', '30/06', '08/07'], datasets: [{ label: 'Qtd de Pedidos', data: [5, 4, 3, 2, 3, 4, 2, 5], backgroundColor: '#3b82f6', borderRadius: 4 }, { label: 'Qtd de Ingressos', data: [6, 5, 4, 2, 3, 5, 2, 6], backgroundColor: '#10b981', borderRadius: 4 }], options: { responsive: true, maintainAspectRatio: false } },
    { id: 'chart-abandon-modality', type: 'bar', labels: ['PROMOCIONAL 50', 'PCD'], datasets: [{ label: 'Qtd de Pedidos', data: [9, 1], backgroundColor: '#3b82f6', borderRadius: 4 }, { label: 'Qtd de Ingressos', data: [11, 2], backgroundColor: '#10b981', borderRadius: 4 }], options: { responsive: true, maintainAspectRatio: false } },
    { id: 'chart-abandon-pdv', type: 'bar', labels: ['Site', 'PDT'], datasets: [{ label: 'Qtd de Pedidos', data: [15, 2], backgroundColor: '#3b82f6', borderRadius: 4 }, { label: 'Qtd de Ingressos', data: [22, 3], backgroundColor: '#10b981', borderRadius: 4 }], options: { responsive: true, maintainAspectRatio: false } },
    
    // Hourly & Payments
    { id: 'chart-analytics-hourly', type: 'bar', labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'], datasets: [{ label: 'Visualizações', data: [200, 100, 80, 150, 450, 800, 1200, 1400, 1100, 950, 1300, 850], backgroundColor: '#3b82f6', borderRadius: 4 }, { label: 'Qtd. Vendidos', data: [20, 5, 2, 10, 50, 110, 180, 220, 140, 95, 170, 90], backgroundColor: '#10b981', borderRadius: 4 }], options: { responsive: true, maintainAspectRatio: false } },
    { id: 'chart-analytics-payment', type: 'pie', labels: ['PIX', 'Crédito (2 a 6x)', 'Crédito', 'Débito', 'Dinheiro'], datasets: [{ data: [42.31, 31.11, 25.67, 0.55, 0.36], backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#6b7280'] }], options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8 } } } } },
    
    // Daily Active & Traffic Sources
    { id: 'chart-analytics-daily', type: 'bar', labels: ['10/06', '15/06', '20/06', '25/06', '30/06', '05/07'], datasets: [{ label: 'Usuários Ativos', data: [250, 310, 290, 340, 420, 580], backgroundColor: '#3b82f6', borderRadius: 4 }, { label: 'Qtd. Vendidos', data: [40, 55, 48, 62, 85, 120], backgroundColor: '#10b981', borderRadius: 4 }], options: { responsive: true, maintainAspectRatio: false } },
    { id: 'chart-analytics-sources', type: 'bar', labels: ['instagram.com / link', 'deiveleonardo.com.br / link', 'direto', 'google / organic', 'm.facebook.com / link', 'facebook.com / link', 'l.instagram.com / link', 't.co / link', 'l.facebook.com / link', 'ig / page'], datasets: [{ label: 'Visualizações', data: [5281, 5218, 4852, 3098, 728, 307, 250, 237, 133, 80], backgroundColor: '#3b82f6', borderRadius: 4 }], options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } },
    
    // Gender & Devices
    { id: 'chart-analytics-gender', type: 'pie', labels: ['Não Identificado', 'Feminino', 'Masculino'], datasets: [{ data: [85.24, 10.23, 4.53], backgroundColor: ['#6b7280', '#ec4899', '#3b82f6'] }], options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8 } } } } },
    { id: 'chart-analytics-devices', type: 'pie', labels: ['Celular', 'Computador', 'Tablet'], datasets: [{ data: [83.69, 16.01, 0.3], backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'] }], options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8 } } } } },
    
    // Top states & cities
    { id: 'chart-analytics-states', type: 'bar', labels: ['Paraná', 'São Paulo', 'Minas Gerais', 'Santa Catarina', 'Rio Grande do Sul', 'Rio de Janeiro', 'Goiás', 'Espírito Santo', 'Bahia', 'Maranhão'], datasets: [{ label: 'Visualizações', data: [77.14, 7.13, 3.48, 3.19, 2.73, 1.29, 0.78, 0.77, 0.76, 0.72], backgroundColor: '#10b981', borderRadius: 4 }], options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } },
    { id: 'chart-analytics-cities', type: 'bar', labels: ['Curitiba', 'São José dos Pinhais', 'São Paulo', 'Colombo', 'Fazenda Rio Grande', 'Campo Largo', 'Araucária', 'Pinhais', 'Almirante Tamandaré', 'Porto Alegre'], datasets: [{ label: 'Visualizações', data: [52.46, 4.84, 4.19, 2.88, 2.68, 2.46, 2.2, 1.7, 1.61, 1.28], backgroundColor: '#3b82f6', borderRadius: 4 }], options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } }
  ];

  chartsToInit.forEach(chartConfig => {
    const ctx = document.getElementById(chartConfig.id);
    if (ctx) {
      if (activeMktCharts[chartConfig.id]) activeMktCharts[chartConfig.id].destroy();
      activeMktCharts[chartConfig.id] = new Chart(ctx, {
        type: chartConfig.type,
        data: {
          labels: chartConfig.labels,
          datasets: chartConfig.datasets
        },
        options: chartConfig.options
      });
    }
  });
}

// ==========================================
// EVENT CREATION WIZARD CONTROLLER
// ==========================================

function navigateWizard(targetStep) {
  // Validate current step fields before going forward
  const currentPane = document.querySelector('[id^="wizard-step-pane-"]:not([style*="display: none"])');
  if (currentPane) {
    const inputs = currentPane.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    inputs.forEach(input => {
      if (!input.checkValidity()) {
        input.classList.add('is-invalid');
        isValid = false;
      } else {
        input.classList.remove('is-invalid');
      }
    });
    const currentStepNum = parseInt(currentPane.id.replace('wizard-step-pane-', ''));
    if (!isValid && targetStep > currentStepNum) {
      alert("Por favor, preencha todos os campos obrigatórios marcados com *.");
      return;
    }
  }

  // Update step panes visibility
  for (let i = 1; i <= 4; i++) {
    const pane = document.getElementById(`wizard-step-pane-${i}`);
    if (pane) pane.style.display = (i === targetStep) ? 'block' : 'none';
  }

  // Update step indicators styling
  for (let i = 1; i <= 4; i++) {
    const circle = document.getElementById(`circle-step-${i}`);
    if (circle) {
      if (i === targetStep) {
        circle.style.background = '#3b82f6';
        circle.style.color = 'white';
        circle.style.border = '3px solid #dbeafe';
        circle.classList.add('active');
      } else if (i < targetStep) {
        circle.style.background = '#10b981'; // Green for completed steps
        circle.style.color = 'white';
        circle.style.border = 'none';
        circle.classList.remove('active');
      } else {
        circle.style.background = '#e2e8f0';
        circle.style.color = '#64748b';
        circle.style.border = 'none';
        circle.classList.remove('active');
      }
    }
  }
}
window.navigateWizard = navigateWizard;

function addWizardSessionRow() {
  const tbody = document.getElementById('wizard-sessions-tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="date" class="form-control form-control-sm wiz-session-date" required></td>
    <td><input type="time" class="form-control form-control-sm wiz-session-start" required></td>
    <td><input type="time" class="form-control form-control-sm wiz-session-open" required></td>
    <td class="text-center"><button type="button" class="btn btn-outline-danger btn-icon btn-sm" onclick="this.closest('tr').remove()" title="Remover"><i class="ph-trash"></i></button></td>
  `;
  tbody.appendChild(tr);
}
window.addWizardSessionRow = addWizardSessionRow;

function addWizardTicketRow() {
  const tbody = document.getElementById('wizard-tickets-tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="form-control form-control-sm wiz-ticket-desc" placeholder="Ex.: Pista, Camarote" required></td>
    <td><input type="number" step="0.01" class="form-control form-control-sm wiz-ticket-price" placeholder="Ex.: 100,00" required></td>
    <td><input type="number" step="0.01" class="form-control form-control-sm wiz-ticket-half" placeholder="Ex.: 50,00" required></td>
    <td><input type="number" class="form-control form-control-sm wiz-ticket-qty" placeholder="Ex.: 500" required></td>
    <td><input type="text" class="form-control form-control-sm wiz-ticket-gender" placeholder="F / M / U" required></td>
    <td><input type="text" class="form-control form-control-sm wiz-ticket-batch" placeholder="Ex.: 1º lote" required></td>
    <td class="text-center"><button type="button" class="btn btn-outline-danger btn-icon btn-sm" onclick="this.closest('tr').remove()"><i class="ph-trash"></i></button></td>
  `;
  tbody.appendChild(tr);
}
window.addWizardTicketRow = addWizardTicketRow;

// Setup submission and finish handler
function initWizardController() {
  const form = document.getElementById('new-event-wizard-form');
  if (!form) return;

  const finishBtn = document.getElementById('btn-finish-wizard');
  if (finishBtn) {
    finishBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Validate step 4
      const currentPane = document.getElementById('wizard-step-pane-4');
      const inputs = currentPane.querySelectorAll('input[required], textarea[required]');
      let isValid = true;
      inputs.forEach(input => {
        if (!input.checkValidity()) {
          input.classList.add('is-invalid');
          isValid = false;
        } else {
          input.classList.remove('is-invalid');
        }
      });
      if (!isValid) {
        alert("Por favor, preencha todos os campos obrigatórios marcados com *.");
        return;
      }

      // Read values to create event
      const name = document.getElementById('wiz-ev-name').value;
      const local = document.getElementById('wiz-ev-addr').value;
      
      // Format session date
      const sessionDateInput = document.querySelector('.wiz-session-date');
      const sessionTimeInput = document.querySelector('.wiz-session-start');
      let dateString = "Em breve";
      if (sessionDateInput && sessionDateInput.value) {
        const parts = sessionDateInput.value.split('-');
        dateString = `${parts[2]}/${parts[1]}/${parts[0]}`;
        if (sessionTimeInput && sessionTimeInput.value) {
          dateString += ` às ${sessionTimeInput.value}`;
        }
      }

      // Create new event object
      const newId = EVENTS_DATA.length > 0 ? Math.max(...EVENTS_DATA.map(ev => ev.id)) + 1 : 1001;
      const newEvent = {
        id: newId,
        name: name,
        date: dateString,
        location: local,
        badgeLeft: String(newId),
        badgeRight: "Disponível",
        coverImage: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800&auto=format&fit=crop"
      };

      // Add to dataset and rebuild lists
      EVENTS_DATA.unshift(newEvent);
      
      // Re-initialize lists
      if (window.renderDashboardEvents) window.renderDashboardEvents();
      if (window.renderEventsList) window.renderEventsList();

      alert(`Evento "${name}" cadastrado com sucesso!`);
      
      // Reset wizard state
      form.reset();
      navigateWizard(1);
      
      // Route back to list
      switchActiveView('events-list');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWizardController);
} else {
  initWizardController();
}

function switchPixelTab(tab) {
  const paidTab = document.getElementById('tab-pixel-paid');
  const orgTab = document.getElementById('tab-pixel-organic');
  const paidPane = document.getElementById('pane-pixel-paid');
  const orgPane = document.getElementById('pane-pixel-organic');
  if (!paidTab || !orgTab) return;
  
  if (tab === 'paid') {
    paidTab.classList.add('active', 'text-primary');
    paidTab.classList.remove('text-muted');
    orgTab.classList.remove('active', 'text-primary');
    orgTab.classList.add('text-muted');
    
    if (paidPane) paidPane.style.display = 'block';
    if (orgPane) orgPane.style.display = 'none';
  } else {
    orgTab.classList.add('active', 'text-primary');
    orgTab.classList.remove('text-muted');
    paidTab.classList.remove('active', 'text-primary');
    paidTab.classList.add('text-muted');
    
    if (paidPane) paidPane.style.display = 'none';
    if (orgPane) orgPane.style.display = 'block';
    
    // Render organic charts when visible
    renderMarketingPixelCharts();
  }
}
window.switchPixelTab = switchPixelTab;

function renderMarketingPixelCharts() {
  // Only render if Organic tab is selected and visible
  const orgPane = document.getElementById('pane-pixel-organic');
  if (!orgPane || orgPane.style.display === 'none') return;

  // 1. Disparos por Dia (Empty state lines)
  const dailyCtx = document.getElementById('chart-pixel-daily');
  if (dailyCtx) {
    if (activeMktCharts['pixel-daily']) activeMktCharts['pixel-daily'].destroy();
    activeMktCharts['pixel-daily'] = new Chart(dailyCtx, {
      type: 'line',
      data: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [
          {
            label: 'Disparos',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.1
          },
          {
            label: 'Compras',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 10, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  // 2. Disparos por Hora (Empty state lines)
  const hourlyCtx = document.getElementById('chart-pixel-hourly');
  if (hourlyCtx) {
    if (activeMktCharts['pixel-hourly']) activeMktCharts['pixel-hourly'].destroy();
    activeMktCharts['pixel-hourly'] = new Chart(hourlyCtx, {
      type: 'line',
      data: {
        labels: ['00h', '04h', '08h', '12h', '16h', '20h'],
        datasets: [
          {
            label: 'Disparos',
            data: [0, 0, 0, 0, 0, 0],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.1
          },
          {
            label: 'Compras',
            data: [0, 0, 0, 0, 0, 0],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 10, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  // 3. Distribuição de Eventos (Grey single circle)
  const distCtx = document.getElementById('chart-pixel-distribution');
  if (distCtx) {
    if (activeMktCharts['pixel-distribution']) activeMktCharts['pixel-distribution'].destroy();
    activeMktCharts['pixel-distribution'] = new Chart(distCtx, {
      type: 'doughnut',
      data: {
        labels: ['Sem dados'],
        datasets: [{
          data: [100],
          backgroundColor: ['#e2e8f0']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }
}

/* ==========================================================================
   6. Ticket Management & Courtesy Issuance Module
   ========================================================================== */

// Mock Database for Tickets
let TICKETS_DATA = [
  {
    id: "TK-15677824",
    orderId: "15677824",
    eventId: 1,
    clientName: "Vinicius Casagrande",
    clientEmail: "vinicius.casagrande@diskingressos.com.br",
    clientCpf: "123.456.789-00",
    clientPhone: "(41) 99999-8888",
    status: "vendido",
    orderStatus: "Finalizado",
    type: "normal",
    category: "INTEIRA",
    sector: "Pista",
    price: 150.00,
    paymentMethod: "PIX",
    purchaseDate: "05/07/2026 às 10:21:00",
    channel: "Site",
    validationGate: "",
    validationDate: "",
    history: [
      { date: "05/07/2026 10:21:00", user: "Sistema", description: "Pedido criado e pago via PIX." }
    ]
  },
  {
    id: "TK-15677825",
    orderId: "15677825",
    eventId: 1,
    clientName: "Ana Paula Mendes",
    clientEmail: "ana.mendes@gmail.com",
    clientCpf: "234.567.890-11",
    clientPhone: "(41) 98888-7777",
    status: "validado",
    orderStatus: "Finalizado",
    type: "normal",
    category: "MEIA-ENTRADA",
    sector: "Pista Premium",
    price: 75.00,
    paymentMethod: "CREDITO",
    purchaseDate: "05/07/2026 às 11:45:12",
    channel: "PDV - Shopping",
    validationGate: "PORTARIA A",
    validationDate: "06/07/2026 às 11:32:00",
    history: [
      { date: "05/07/2026 11:45:12", user: "PDV Curitiba", description: "Ingresso emitido fisicamente." },
      { date: "06/07/2026 11:32:00", user: "Portaria A", description: "Check-in realizado com sucesso." }
    ]
  },
  {
    id: "TK-15677826",
    orderId: "15677826",
    eventId: 1,
    clientName: "Felipe Ribeiro",
    clientEmail: "felipe.rib@outlook.com",
    clientCpf: "345.678.901-22",
    clientPhone: "(41) 97777-6666",
    status: "reservado",
    orderStatus: "Aguardando Pagamento",
    type: "normal",
    category: "INTEIRA",
    sector: "Camarote",
    price: 250.00,
    paymentMethod: "BOLETO",
    purchaseDate: "06/07/2026 às 09:15:00",
    channel: "Site",
    validationGate: "",
    validationDate: "",
    history: [
      { date: "06/07/2026 09:15:00", user: "Sistema", description: "Boleto gerado, aguardando compensação bancária." }
    ]
  },
  {
    id: "TK-15677827",
    orderId: "15677827",
    eventId: 1,
    clientName: "Rodrigo Alencar",
    clientEmail: "rodrigo.alencar@parceiro.com.br",
    clientCpf: "456.789.012-33",
    clientPhone: "(41) 96666-5555",
    status: "vendido",
    orderStatus: "Finalizado",
    type: "cortesia",
    category: "CORTESIA",
    sector: "VIP Coberto",
    price: 0.00,
    paymentMethod: "CORTESIA",
    purchaseDate: "06/07/2026 às 14:20:00",
    channel: "Painel Promotor",
    validationGate: "",
    validationDate: "",
    courtesyRecipient: "Rodrigo Alencar",
    courtesyReason: "Patrocinador Master",
    courtesyIssuer: "vinicius.casagrande@diskingressos.com.br",
    history: [
      { date: "06/07/2026 14:20:00", user: "vinicius.casagrande@diskingressos.com.br", description: "Cortesia emitida para Rodrigo Alencar (Patrocinador Master)." }
    ]
  },
  {
    id: "TK-15677828",
    orderId: "15677828",
    eventId: 2,
    clientName: "Mariana Souza",
    clientEmail: "mari.souza@yahoo.com.br",
    clientCpf: "567.890.123-44",
    clientPhone: "(41) 95555-4444",
    status: "cancelado",
    orderStatus: "Cancelado",
    type: "normal",
    category: "INTEIRA",
    sector: "Pista",
    price: 150.00,
    paymentMethod: "CREDITO",
    purchaseDate: "05/07/2026 às 16:30:00",
    channel: "Site",
    validationGate: "",
    validationDate: "",
    history: [
      { date: "05/07/2026 16:30:00", user: "Sistema", description: "Compra aprovada via cartão de crédito." },
      { date: "07/07/2026 10:00:00", user: "vinicius.casagrande@diskingressos.com.br", description: "Ingresso cancelado e valor estornado conforme solicitação do cliente." }
    ]
  },
  {
    id: "TK-15677829",
    orderId: "15677829",
    eventId: 5,
    clientName: "Lucas Pinheiro",
    clientEmail: "lucas.pin@gmail.com",
    clientCpf: "678.901.234-55",
    clientPhone: "(11) 94444-3333",
    status: "validado",
    orderStatus: "Finalizado",
    type: "normal",
    category: "PCD",
    sector: "Cadeira Inferior",
    price: 120.00,
    paymentMethod: "PIX",
    purchaseDate: "07/07/2026 às 12:10:00",
    channel: "Site",
    validationGate: "ACESSO PCD",
    validationDate: "07/07/2026 às 20:30:00",
    history: [
      { date: "07/07/2026 12:10:00", user: "Sistema", description: "Pedido criado e pago via PIX." },
      { date: "07/07/2026 20:30:00", user: "Portão PCD", description: "Acesso liberado após verificação do laudo PCD." }
    ]
  },
  {
    id: "TK-15677830",
    orderId: "15677830",
    eventId: 5,
    clientName: "Beatriz Nogueira",
    clientEmail: "beatriz.nog@uol.com.br",
    clientCpf: "789.012.345-66",
    clientPhone: "(11) 93333-2222",
    status: "vendido",
    orderStatus: "Finalizado",
    type: "normal",
    category: "INTEIRA",
    sector: "Cadeira Superior",
    price: 240.00,
    paymentMethod: "CREDITO",
    purchaseDate: "07/07/2026 às 15:45:00",
    channel: "Site",
    validationGate: "",
    validationDate: "",
    history: [
      { date: "07/07/2026 15:45:00", user: "Sistema", description: "Compra efetuada via Site." }
    ]
  },
  {
    id: "TK-15677831",
    orderId: "15677831",
    eventId: 6,
    clientName: "Carlos Eduardo",
    clientEmail: "carlinhos@diskingressos.com.br",
    clientCpf: "890.123.456-77",
    clientPhone: "(41) 92222-1111",
    status: "vendido",
    orderStatus: "Finalizado",
    type: "cortesia",
    category: "CORTESIA",
    sector: "VIP Especial",
    price: 0.00,
    paymentMethod: "CORTESIA",
    purchaseDate: "08/07/2026 às 09:30:00",
    channel: "Painel Promotor",
    validationGate: "",
    validationDate: "",
    courtesyRecipient: "Carlos Eduardo",
    courtesyReason: "Imprensa / Divulgação",
    courtesyIssuer: "vinicius.casagrande@diskingressos.com.br",
    history: [
      { date: "08/07/2026 09:30:00", user: "vinicius.casagrande@diskingressos.com.br", description: "Cortesia emitida para divulgação de rádio." }
    ]
  },
  {
    id: "TK-15677832",
    orderId: "15677832",
    eventId: 6,
    clientName: "Mariana Lacerda",
    clientEmail: "mari.lacerda@hotmail.com",
    clientCpf: "901.234.567-88",
    clientPhone: "(41) 91111-0000",
    status: "validado",
    orderStatus: "Finalizado",
    type: "normal",
    category: "MEIA-ENTRADA",
    sector: "Cadeira Central",
    price: 110.00,
    paymentMethod: "PIX",
    purchaseDate: "08/07/2026 às 13:02:44",
    channel: "Site",
    validationGate: "PORTARIA B",
    validationDate: "08/07/2026 às 19:48:10",
    history: [
      { date: "08/07/2026 13:02:44", user: "Sistema", description: "Compra aprovada via PIX." },
      { date: "08/07/2026 19:48:10", user: "Portaria B", description: "Check-in realizado com sucesso." }
    ]
  },
  {
    id: "TK-15677833",
    orderId: "15677833",
    eventId: 11,
    clientName: "Juliano Silveira",
    clientEmail: "juliano.s@gmail.com",
    clientCpf: "012.345.678-99",
    clientPhone: "(41) 90000-9999",
    status: "vendido",
    orderStatus: "Finalizado",
    type: "normal",
    category: "INTEIRA",
    sector: "Pista",
    price: 120.00,
    paymentMethod: "CREDITO",
    purchaseDate: "04/07/2026 às 15:30:00",
    channel: "Bilheteria Física",
    validationGate: "",
    validationDate: "",
    history: [
      { date: "04/07/2026 15:30:00", user: "Bilheteiro - Centro", description: "Venda direta realizada na bilheteria." }
    ]
  }
];

let currentDetailTicketId = null;

function initTicketModule() {
  // Populate event dropdowns
  populateEventSelectors();

  // Global query listeners
  const globalSelector = document.getElementById('global-consult-event-selector');
  if (globalSelector) globalSelector.addEventListener('change', () => renderTicketsTable(true));

  const globalSearchBtn = document.getElementById('global-ticket-search-btn');
  if (globalSearchBtn) globalSearchBtn.addEventListener('click', () => renderTicketsTable(true));

  const globalSearchInput = document.getElementById('global-ticket-search-input');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') renderTicketsTable(true);
    });
    globalSearchInput.addEventListener('input', () => {
      // Realtime search filter
      renderTicketsTable(true);
    });
  }

  const globalQueryRadios = document.querySelectorAll('input[name="globalQueryType"]');
  globalQueryRadios.forEach(radio => radio.addEventListener('change', () => renderTicketsTable(true)));

  const globalTypeRadios = document.querySelectorAll('input[name="globalTicketType"]');
  globalTypeRadios.forEach(radio => radio.addEventListener('change', () => renderTicketsTable(true)));

  const globalStatusChecks = [
    document.getElementById('gs-reservado'),
    document.getElementById('gs-vendido'),
    document.getElementById('gs-cancelado'),
    document.getElementById('gs-validado')
  ];
  globalStatusChecks.forEach(chk => {
    if (chk) chk.addEventListener('change', () => renderTicketsTable(true));
  });

  const globalSelectAll = document.getElementById('global-select-all-tickets');
  if (globalSelectAll) {
    globalSelectAll.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const checkboxes = document.querySelectorAll('#global-tickets-tbody .ticket-row-checkbox');
      checkboxes.forEach(cb => cb.checked = isChecked);
      updateBatchBar();
    });
  }

  // Event specific query listeners
  const eventSearchBtn = document.getElementById('event-ticket-search-btn');
  if (eventSearchBtn) eventSearchBtn.addEventListener('click', () => renderTicketsTable(false));

  const eventSearchInput = document.getElementById('ticket-search-input');
  if (eventSearchInput) {
    eventSearchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') renderTicketsTable(false);
    });
    eventSearchInput.addEventListener('input', () => {
      renderTicketsTable(false);
    });
  }

  const eventQueryRadios = document.querySelectorAll('input[name="queryType"]');
  eventQueryRadios.forEach(radio => radio.addEventListener('change', () => renderTicketsTable(false)));

  const eventTypeRadios = document.querySelectorAll('input[name="ticketType"]');
  eventTypeRadios.forEach(radio => radio.addEventListener('change', () => renderTicketsTable(false)));

  const eventStatusChecks = [
    document.getElementById('s-reservado'),
    document.getElementById('s-vendido'),
    document.getElementById('s-cancelado'),
    document.getElementById('s-validado')
  ];
  eventStatusChecks.forEach(chk => {
    if (chk) chk.addEventListener('change', () => renderTicketsTable(false));
  });

  const eventSelectAll = document.getElementById('select-all-tickets');
  if (eventSelectAll) {
    eventSelectAll.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const checkboxes = document.querySelectorAll('#event-tickets-tbody .ticket-row-checkbox');
      checkboxes.forEach(cb => cb.checked = isChecked);
      updateBatchBar();
    });
  }

  // Batch action listeners
  const batchResend = document.getElementById('batch-resend-btn');
  if (batchResend) batchResend.addEventListener('click', handleBatchResend);

  const batchValidate = document.getElementById('batch-validate-btn');
  if (batchValidate) batchValidate.addEventListener('click', handleBatchValidate);

  const batchCancel = document.getElementById('batch-cancel-btn');
  if (batchCancel) batchCancel.addEventListener('click', handleBatchCancel);

  const batchExport = document.getElementById('batch-export-btn');
  if (batchExport) batchExport.addEventListener('click', handleBatchExport);

  const batchClear = document.getElementById('batch-clear-btn');
  if (batchClear) batchClear.addEventListener('click', clearBatchSelection);

  // Courtesy form submission handlers
  const tabCourtesyForm = document.getElementById('event-cortesia-issuance-form');
  if (tabCourtesyForm) {
    tabCourtesyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleCourtesyIssuance(true);
    });
  }

  const modalCourtesyForm = document.getElementById('modal-cortesia-issuance-form');
  if (modalCourtesyForm) {
    modalCourtesyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleCourtesyIssuance(false);
    });
  }

  // Courtesy search log input
  const courtesySearchInput = document.getElementById('cortesia-search-input');
  if (courtesySearchInput) {
    courtesySearchInput.addEventListener('input', () => {
      renderCourtesyDashboard();
    });
  }

  // Details modal sub-actions
  const btnEditHolder = document.getElementById('btn-edit-holder');
  if (btnEditHolder) btnEditHolder.addEventListener('click', toggleEditHolder);

  const btnCancelEdit = document.getElementById('btn-cancel-edit-holder');
  if (btnCancelEdit) btnCancelEdit.addEventListener('click', cancelEditHolder);

  const btnSaveEdit = document.getElementById('btn-save-edit-holder');
  if (btnSaveEdit) btnSaveEdit.addEventListener('click', saveEditHolder);

  const btnToggleCheckin = document.getElementById('btn-toggle-checkin');
  if (btnToggleCheckin) btnToggleCheckin.addEventListener('click', toggleCheckinStatus);

  const btnCancelTicket = document.getElementById('btn-cancel-ticket');
  if (btnCancelTicket) btnCancelTicket.addEventListener('click', cancelTicketDetail);

  const btnDetailResend = document.getElementById('btn-detail-resend');
  if (btnDetailResend) btnDetailResend.addEventListener('click', resendEmailDetail);

  const btnDetailDownload = document.getElementById('btn-detail-download');
  if (btnDetailDownload) btnDetailDownload.addEventListener('click', downloadPdfDetail);
}

function populateEventSelectors() {
  const globalSelector = document.getElementById('global-consult-event-selector');
  if (globalSelector) {
    globalSelector.innerHTML = EVENTS_DATA.map((ev, idx) => `
      <option value="${ev.id}" ${idx === 0 ? 'selected' : ''}>${ev.name} (ID: ${ev.id})</option>
    `).join('');
  }

  const modalSelector = document.getElementById('mc-event-selector');
  if (modalSelector) {
    modalSelector.innerHTML = EVENTS_DATA.map((ev, idx) => `
      <option value="${ev.id}" ${idx === 0 ? 'selected' : ''}>${ev.name} (ID: ${ev.id})</option>
    `).join('');
  }
}

function renderTicketsTable(isGlobal) {
  let eventId = null;
  let query = "";
  let queryType = "";
  let ticketType = "";
  let selectedStatuses = [];
  let tbody = null;

  if (isGlobal) {
    const selector = document.getElementById('global-consult-event-selector');
    eventId = selector ? parseInt(selector.value) : null;
    query = document.getElementById('global-ticket-search-input').value.toLowerCase().trim();
    
    const activeQueryRadio = document.querySelector('input[name="globalQueryType"]:checked');
    queryType = activeQueryRadio ? activeQueryRadio.value : "pedido";

    const activeTypeRadio = document.querySelector('input[name="globalTicketType"]:checked');
    ticketType = activeTypeRadio ? activeTypeRadio.value : "todos";

    if (document.getElementById('gs-reservado').checked) selectedStatuses.push("reservado");
    if (document.getElementById('gs-vendido').checked) selectedStatuses.push("vendido");
    if (document.getElementById('gs-cancelado').checked) selectedStatuses.push("cancelado");
    if (document.getElementById('gs-validado').checked) selectedStatuses.push("validado");

    tbody = document.getElementById('global-tickets-tbody');
  } else {
    eventId = currentManagedEventId;
    query = document.getElementById('ticket-search-input').value.toLowerCase().trim();

    const activeQueryRadio = document.querySelector('input[name="queryType"]:checked');
    queryType = activeQueryRadio ? activeQueryRadio.value : "pedido";

    const activeTypeRadio = document.querySelector('input[name="ticketType"]:checked');
    ticketType = activeTypeRadio ? activeTypeRadio.value : "todos";

    if (document.getElementById('s-reservado').checked) selectedStatuses.push("reservado");
    if (document.getElementById('s-vendido').checked) selectedStatuses.push("vendido");
    if (document.getElementById('s-cancelado').checked) selectedStatuses.push("cancelado");
    if (document.getElementById('s-validado').checked) selectedStatuses.push("validado");

    tbody = document.getElementById('event-tickets-tbody');
  }

  if (!tbody) return;

  // Filter logic
  let filtered = TICKETS_DATA.filter(tk => {
    // 1. Event filter
    if (eventId && tk.eventId !== eventId) return false;

    // 2. Ticket Type filter (normal / cortesia)
    if (ticketType !== "todos" && tk.type !== ticketType) return false;

    // 3. Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(tk.status)) return false;

    // 4. Search text filter
    if (query) {
      if (queryType === "pedido" && !tk.orderId.toLowerCase().includes(query)) return false;
      if (queryType === "documento" && !tk.clientCpf.toLowerCase().includes(query)) return false;
      if (queryType === "nome" && !tk.clientName.toLowerCase().includes(query)) return false;
      if (queryType === "email" && !tk.clientEmail.toLowerCase().includes(query)) return false;
      if (queryType === "telefone" && !tk.clientPhone.toLowerCase().includes(query)) return false;
      if (queryType === "id-ingresso" && !tk.id.toLowerCase().includes(query)) return false;
      if (queryType === "cod-ingresso" && !tk.id.toLowerCase().includes(query)) return false; // same as barcode id
      if (queryType === "modalidade" && !tk.category.toLowerCase().includes(query)) return false;
      if (queryType === "pdv" && !tk.channel.toLowerCase().includes(query)) return false;
      // seller/terminal/period can fall back to standard text matching on channel/date
      if (queryType === "vendedor" && !tk.channel.toLowerCase().includes(query)) return false;
      if (queryType === "terminal" && !tk.channel.toLowerCase().includes(query)) return false;
      if (queryType === "periodo" && !tk.purchaseDate.toLowerCase().includes(query)) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-muted">
          <i class="ph-warning-circle fs-2 d-block mb-1"></i>
          Nenhum ingresso encontrado para os filtros selecionados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(tk => {
    let statusBadge = "";
    if (tk.orderStatus === "Finalizado") {
      statusBadge = '<span class="badge bg-success bg-opacity-15 text-success border border-success border-opacity-20 px-2 py-0.5">Finalizado</span>';
    } else if (tk.orderStatus === "Cancelado") {
      statusBadge = '<span class="badge bg-danger bg-opacity-15 text-danger border border-danger border-opacity-20 px-2 py-0.5">Cancelado</span>';
    } else {
      statusBadge = '<span class="badge bg-warning bg-opacity-15 text-warning border border-warning border-opacity-20 px-2 py-0.5">Pendente</span>';
    }

    return `
      <tr>
        <td class="text-center">
          <input class="form-check-input ticket-row-checkbox" type="checkbox" data-id="${tk.id}" onchange="window.updateBatchBar()">
        </td>
        <td><strong>${tk.orderId}</strong></td>
        <td>${statusBadge}</td>
        <td>
          <select class="form-select form-select-sm fw-bold border-0 bg-transparent text-dark p-0 inline-status-select" style="width: 105px; font-size: 12px;" data-id="${tk.id}" title="Mudar status do ingresso">
            <option value="vendido" ${tk.status === "vendido" ? "selected" : ""}>VENDIDO</option>
            <option value="validado" ${tk.status === "validado" ? "selected" : ""}>VALIDADO</option>
            <option value="reservado" ${tk.status === "reservado" ? "selected" : ""}>RESERVADO</option>
            <option value="cancelado" ${tk.status === "cancelado" ? "selected" : ""}>CANCELADO</option>
          </select>
        </td>
        <td>
          <span class="badge ${tk.type === 'cortesia' ? 'bg-purple bg-opacity-15 text-purple' : 'bg-secondary bg-opacity-15 text-dark'} px-2 py-0.5" style="${tk.type === 'cortesia' ? 'color: #7c3aed; background-color: rgba(124,58,237,0.1);' : ''}">
            ${tk.category}
          </span>
        </td>
        <td>${tk.sector}</td>
        <td>${tk.purchaseDate}</td>
        <td class="text-center">
          <div class="d-flex justify-content-center gap-1">
            <button class="btn btn-outline-primary btn-icon btn-sm" style="padding: 2px 6px; border-radius: 4px;" title="Ver QR Code" onclick="window.showQrCode('${tk.id}')"><i class="ph-qr-code"></i></button>
            <button class="btn btn-outline-info btn-icon btn-sm" style="padding: 2px 6px; border-radius: 4px;" title="Detalhes do ingresso" onclick="window.showTicketDetails('${tk.id}')"><i class="ph-info"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Add event listener to inline status updates
  tbody.querySelectorAll('.inline-status-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const tkId = e.target.getAttribute('data-id');
      const newStatus = e.target.value;
      updateTicketStatus(tkId, newStatus);
    });
  });
}

function updateTicketStatus(tkId, newStatus) {
  const tk = TICKETS_DATA.find(t => t.id === tkId);
  if (!tk) return;

  const oldStatus = tk.status;
  if (oldStatus === newStatus) return;

  tk.status = newStatus;
  
  // Set additional fields for validated status
  if (newStatus === "validado") {
    tk.validationGate = "PORTARIA A";
    tk.validationDate = formatCurrentDate();
    tk.history.push({
      date: formatCurrentDate(),
      user: "vinicius.casagrande",
      description: "Status alterado via consulta rápida para VALIDADO (Check-in manual realizado)."
    });
  } else {
    if (oldStatus === "validado") {
      tk.validationGate = "";
      tk.validationDate = "";
    }
    tk.history.push({
      date: formatCurrentDate(),
      user: "vinicius.casagrande",
      description: `Status alterado via consulta rápida de ${oldStatus.toUpperCase()} para ${newStatus.toUpperCase()}.`
    });
  }

  // Adjust statistics if cancelled
  if (newStatus === "cancelado" && oldStatus !== "cancelado") {
    adjustEventStats(tk.eventId, -1, -tk.price, tk.type === 'cortesia' ? -1 : 0);
  } else if (oldStatus === "cancelado" && newStatus !== "cancelado") {
    adjustEventStats(tk.eventId, 1, tk.price, tk.type === 'cortesia' ? 1 : 0);
  }

  // Re-render
  renderTicketsTable(true);
  renderTicketsTable(false);
  renderCourtesyDashboard();
  
  alert(`Status do ingresso ${tkId} atualizado para ${newStatus.toUpperCase()} com sucesso!`);
}

function adjustEventStats(eventId, salesDiff, revenueDiff, cortesiaDiff = 0) {
  const ev = EVENTS_DATA.find(e => e.id == eventId);
  if (!ev) return;

  ev.salesCount = Math.max(0, ev.salesCount + salesDiff);
  ev.revenue = Math.max(0.00, ev.revenue + revenueDiff);
  if (ev.cortesia !== undefined) {
    ev.cortesia = Math.max(0, ev.cortesia + cortesiaDiff);
  }

  // Sync to database if Firebase is active
  if (window.firebaseDB && window.firebaseDB.isConfigured) {
    window.firebaseDB.updateEvent(eventId, {
      salesCount: ev.salesCount,
      revenue: ev.revenue,
      cortesia: ev.cortesia || 0
    }).catch(err => console.error("Firebase sync error on event adjust:", err));
  }

  // Rebuild lists
  if (window.renderDashboardEvents) window.renderDashboardEvents();
  if (window.renderEventsList) window.renderEventsList();
  if (window.renderFinancialBalanceRows) window.renderFinancialBalanceRows();
  
  // Re-display stats if currently managing this event
  if (currentManagedEventId == eventId) {
    const subtitleEl = document.getElementById('consult-ticket-event-subtitle');
    if (subtitleEl) subtitleEl.textContent = ev.name;

    const dbSales = document.getElementById('event-dashboard-sales');
    if (dbSales) dbSales.textContent = ev.salesCount.toLocaleString('pt-BR');

    const dbRev = document.getElementById('event-dashboard-revenue');
    if (dbRev) dbRev.textContent = `R$ ${ev.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
}

function showTicketDetails(ticketId) {
  const tk = TICKETS_DATA.find(t => t.id === ticketId);
  if (!tk) return;

  currentDetailTicketId = ticketId;

  // Recipient info
  document.getElementById('t-detail-name').textContent = tk.clientName;
  document.getElementById('t-detail-cpf').textContent = tk.clientCpf || "N/A";
  document.getElementById('t-detail-email').textContent = tk.clientEmail;
  document.getElementById('t-detail-phone').textContent = tk.clientPhone || "N/A";

  // Purchase details
  document.getElementById('t-detail-orderid').textContent = tk.orderId;
  document.getElementById('t-detail-purchasedate').textContent = tk.purchaseDate;
  document.getElementById('t-detail-channel').textContent = tk.channel;
  document.getElementById('t-detail-payment').textContent = tk.paymentMethod;
  document.getElementById('t-detail-value').textContent = `R$ ${tk.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.getElementById('t-detail-category').textContent = tk.category;
  document.getElementById('t-detail-sector').textContent = tk.sector;
  document.getElementById('t-detail-code').textContent = tk.id;

  // Validation details
  const badge = document.getElementById('t-detail-val-badge');
  const valMeta = document.getElementById('t-detail-val-meta');
  const btnCheckin = document.getElementById('btn-toggle-checkin');
  const btnCancel = document.getElementById('btn-cancel-ticket');

  valMeta.style.display = "none";
  btnCheckin.disabled = false;
  btnCancel.disabled = false;

  if (tk.status === "validado") {
    badge.textContent = "VALIDADO";
    badge.className = "badge bg-success bg-opacity-15 text-success border border-success border-opacity-20 px-2 py-0.5";
    document.getElementById('t-detail-val-date').textContent = tk.validationDate;
    document.getElementById('t-detail-val-gate').textContent = tk.validationGate;
    valMeta.style.display = "block";
    btnCheckin.textContent = "Desfazer Check-in";
    btnCheckin.className = "btn btn-sm btn-outline-warning text-warning fw-semibold";
  } else if (tk.status === "cancelado") {
    badge.textContent = "CANCELADO";
    badge.className = "badge bg-danger bg-opacity-15 text-danger border border-danger border-opacity-20 px-2 py-0.5";
    btnCheckin.disabled = true;
    btnCheckin.textContent = "Validar Check-in";
    btnCheckin.className = "btn btn-sm btn-outline-secondary fw-semibold";
    btnCancel.disabled = true;
  } else if (tk.status === "reservado") {
    badge.textContent = "RESERVADO (PENDENTE)";
    badge.className = "badge bg-warning bg-opacity-15 text-warning border border-warning border-opacity-20 px-2 py-0.5";
    btnCheckin.textContent = "Validar Check-in";
    btnCheckin.className = "btn btn-sm btn-outline-primary text-primary fw-semibold";
  } else {
    badge.textContent = "ATIVO / NÃO ENTRADO";
    badge.className = "badge bg-primary bg-opacity-15 text-primary border border-primary border-opacity-20 px-2 py-0.5";
    btnCheckin.textContent = "Validar Check-in";
    btnCheckin.className = "btn btn-sm btn-outline-primary text-primary fw-semibold";
  }

  // Load audit history
  const historyList = document.getElementById('t-detail-history-list');
  if (historyList) {
    historyList.innerHTML = tk.history.map(item => `
      <li class="mb-1 border-bottom pb-1">
        <span class="text-muted">${item.date}</span> — <strong>${item.user}</strong>: 
        <span class="text-dark">${item.description}</span>
      </li>
    `).reverse().join('');
  }

  // Switch holder editor back to viewer mode
  cancelEditHolder();

  openModal('ticket-details');
}

function showQrCode(ticketId) {
  const tk = TICKETS_DATA.find(t => t.id === ticketId);
  if (!tk) return;
  alert(`[QR Code DiskIngressos]\nCódigo: ${tk.id}\nBeneficiário: ${tk.clientName}\nStatus: ${tk.status.toUpperCase()}`);
}

function toggleEditHolder() {
  const tk = TICKETS_DATA.find(t => t.id === currentDetailTicketId);
  if (!tk) return;

  const viewMode = document.getElementById('holder-view-mode');
  const editMode = document.getElementById('holder-edit-mode');
  const btnEdit = document.getElementById('btn-edit-holder');

  if (editMode.style.display === "none") {
    // Show editor
    document.getElementById('edit-t-name').value = tk.clientName;
    document.getElementById('edit-t-cpf').value = tk.clientCpf || "";
    document.getElementById('edit-t-email').value = tk.clientEmail;
    document.getElementById('edit-t-phone').value = tk.clientPhone || "";

    viewMode.style.display = "none";
    editMode.style.display = "block";
    btnEdit.style.display = "none";
  }
}

function cancelEditHolder() {
  document.getElementById('holder-view-mode').style.display = "block";
  document.getElementById('holder-edit-mode').style.display = "none";
  const btnEdit = document.getElementById('btn-edit-holder');
  if (btnEdit) btnEdit.style.display = "block";
}

function saveEditHolder() {
  const tk = TICKETS_DATA.find(t => t.id === currentDetailTicketId);
  if (!tk) return;

  const newName = document.getElementById('edit-t-name').value.trim();
  const newCpf = document.getElementById('edit-t-cpf').value.trim();
  const newEmail = document.getElementById('edit-t-email').value.trim();
  const newPhone = document.getElementById('edit-t-phone').value.trim();

  if (!newName || !newEmail) {
    alert("Nome e E-mail são campos obrigatórios.");
    return;
  }

  const oldName = tk.clientName;
  tk.clientName = newName;
  tk.clientCpf = newCpf;
  tk.clientEmail = newEmail;
  tk.clientPhone = newPhone;

  tk.history.push({
    date: formatCurrentDate(),
    user: "vinicius.casagrande",
    description: `Titularidade alterada de "${oldName}" para "${newName}" (CPF: ${newCpf || 'N/A'}, Email: ${newEmail}).`
  });

  // Re-render
  showTicketDetails(currentDetailTicketId);
  renderTicketsTable(true);
  renderTicketsTable(false);
  renderCourtesyDashboard();

  alert("Dados do titular atualizados com sucesso!");
}

function toggleCheckinStatus() {
  const tk = TICKETS_DATA.find(t => t.id === currentDetailTicketId);
  if (!tk) return;

  const oldStatus = tk.status;
  if (oldStatus === "validado") {
    // Undo checkin
    tk.status = "vendido";
    tk.validationGate = "";
    tk.validationDate = "";
    tk.history.push({
      date: formatCurrentDate(),
      user: "vinicius.casagrande",
      description: "Check-in desfeito manualmente pelo painel."
    });
  } else {
    // Perform checkin
    tk.status = "validado";
    tk.validationGate = "PORTARIA A (MANUAL)";
    tk.validationDate = formatCurrentDate();
    tk.history.push({
      date: formatCurrentDate(),
      user: "vinicius.casagrande",
      description: "Check-in manual efetuado via painel de detalhes."
    });
  }

  showTicketDetails(currentDetailTicketId);
  renderTicketsTable(true);
  renderTicketsTable(false);
  renderCourtesyDashboard();
}

function cancelTicketDetail() {
  const tk = TICKETS_DATA.find(t => t.id === currentDetailTicketId);
  if (!tk) return;

  if (!confirm(`Tem certeza que deseja CANCELAR e estornar o ingresso ${tk.id}?`)) return;

  const oldStatus = tk.status;
  tk.status = "cancelado";
  tk.history.push({
    date: formatCurrentDate(),
    user: "vinicius.casagrande",
    description: "Ingresso cancelado e desativado manualmente pelo painel de detalhes."
  });

  if (oldStatus !== "cancelado") {
    adjustEventStats(tk.eventId, -1, -tk.price, tk.type === 'cortesia' ? -1 : 0);
  }

  showTicketDetails(currentDetailTicketId);
  renderTicketsTable(true);
  renderTicketsTable(false);
  renderCourtesyDashboard();

  alert("Ingresso cancelado com sucesso! A cota foi liberada.");
}

function resendEmailDetail() {
  const tk = TICKETS_DATA.find(t => t.id === currentDetailTicketId);
  if (!tk) return;

  tk.history.push({
    date: formatCurrentDate(),
    user: "Sistema",
    description: `Disparado e-mail de reenvio de ingresso para: ${tk.clientEmail}`
  });

  showTicketDetails(currentDetailTicketId);
  alert(`E-mail com ingresso e QR Code reenviado para ${tk.clientEmail}!`);
}

function downloadPdfDetail() {
  alert("Iniciando o download do arquivo PDF do ingresso... (TK-PDF)");
}

function openIssueCourtesyModal(isFromEventContext) {
  populateEventSelectors();

  const selector = document.getElementById('mc-event-selector');
  if (isFromEventContext) {
    if (selector) {
      selector.value = currentManagedEventId;
      selector.disabled = true;
    }
  } else {
    if (selector) {
      selector.disabled = false;
    }
  }

  // Reset fields
  document.getElementById('mc-name').value = "";
  document.getElementById('mc-email').value = "";
  document.getElementById('mc-cpf').value = "";
  document.getElementById('mc-qty').value = "1";

  openModal('issue-courtesy');
}

function handleCourtesyIssuance(isFromTab) {
  let eventId = null;
  let sector = "";
  let reason = "";
  let name = "";
  let email = "";
  let cpf = "";
  let qty = 1;
  let sendEmail = true;

  if (isFromTab) {
    eventId = currentManagedEventId;
    sector = document.getElementById('cortesia-form-sector').value;
    reason = document.getElementById('cortesia-form-reason').value;
    name = document.getElementById('cortesia-form-name').value.trim();
    email = document.getElementById('cortesia-form-email').value.trim();
    cpf = document.getElementById('cortesia-form-cpf').value.trim();
    qty = parseInt(document.getElementById('cortesia-form-qty').value) || 1;
    sendEmail = document.getElementById('cortesia-form-send-email').checked;

    document.getElementById('event-cortesia-issuance-form').reset();
  } else {
    eventId = parseInt(document.getElementById('mc-event-selector').value);
    sector = document.getElementById('mc-sector').value;
    reason = document.getElementById('mc-reason').value;
    name = document.getElementById('mc-name').value.trim();
    email = document.getElementById('mc-email').value.trim();
    cpf = document.getElementById('mc-cpf').value.trim();
    qty = parseInt(document.getElementById('mc-qty').value) || 1;
    sendEmail = document.getElementById('mc-send-email').checked;

    closeModal('issue-courtesy');
  }

  if (!name || !email) {
    alert("Dados inválidos. Por favor, forneça nome e e-mail.");
    return;
  }

  // Create courtesy tickets
  for (let i = 0; i < qty; i++) {
    const randomOrder = Math.floor(10000000 + Math.random() * 90000000).toString();
    const randomTicket = "TK-" + Math.floor(10000000 + Math.random() * 90000000).toString();
    
    const newTicket = {
      id: randomTicket,
      orderId: randomOrder,
      eventId: eventId,
      clientName: name,
      clientEmail: email,
      clientCpf: cpf,
      clientPhone: "",
      status: "vendido",
      orderStatus: "Finalizado",
      type: "cortesia",
      category: "CORTESIA",
      sector: sector,
      price: 0.00,
      paymentMethod: "CORTESIA",
      purchaseDate: formatCurrentDate(),
      channel: "Painel Promotor",
      validationGate: "",
      validationDate: "",
      courtesyRecipient: name,
      courtesyReason: reason,
      courtesyIssuer: "vinicius.casagrande@diskingressos.com.br",
      history: [
        {
          date: formatCurrentDate(),
          user: "vinicius.casagrande@diskingressos.com.br",
          description: `Cortesia emitida para ${name} (${reason}). set: ${sector}. Enviar e-mail: ${sendEmail ? 'SIM' : 'NÃO'}`
        }
      ]
    };

    TICKETS_DATA.unshift(newTicket);
  }

  // Adjust stats (add capacity / sales)
  adjustEventStats(eventId, qty, 0.00, qty);

  // Re-render
  renderTicketsTable(true);
  renderTicketsTable(false);
  renderCourtesyDashboard();

  alert(`${qty} cortesia(s) emitida(s) com sucesso para "${name}"!`);
}

function renderCourtesyDashboard() {
  if (!currentManagedEventId) return;

  const eventCortesias = TICKETS_DATA.filter(tk => tk.eventId === currentManagedEventId && tk.type === "cortesia");
  const checkins = eventCortesias.filter(tk => tk.status === "validado").length;
  
  const totalEl = document.getElementById('cortesia-card-total');
  if (totalEl) totalEl.textContent = eventCortesias.length;

  const usedEl = document.getElementById('cortesia-card-used');
  if (usedEl) usedEl.textContent = checkins;

  // Let's assume a quota limit of 200 courtesy tickets per event
  const limitQuota = 200;
  const remaining = Math.max(0, limitQuota - eventCortesias.length);
  const availableEl = document.getElementById('cortesia-card-available');
  if (availableEl) availableEl.textContent = remaining;

  // Set event title context
  const subtitleEl = document.getElementById('cortesias-event-subtitle');
  const ev = EVENTS_DATA.find(e => e.id == currentManagedEventId);
  if (subtitleEl && ev) {
    subtitleEl.textContent = `Painel de Emissão & Controle de Convidados — ${ev.name}`;
  }

  // Histórico list
  const historyTbody = document.getElementById('event-cortesias-history-tbody');
  if (!historyTbody) return;

  // History search filter
  const searchInput = document.getElementById('cortesia-search-input');
  const search = searchInput ? searchInput.value.toLowerCase().trim() : "";

  let list = eventCortesias;
  if (search) {
    list = list.filter(tk => 
      tk.clientName.toLowerCase().includes(search) || 
      tk.clientEmail.toLowerCase().includes(search) ||
      tk.courtesyReason.toLowerCase().includes(search) ||
      tk.sector.toLowerCase().includes(search) ||
      tk.id.toLowerCase().includes(search)
    );
  }

  if (list.length === 0) {
    historyTbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-3">Nenhuma cortesia emitida ou encontrada.</td>
      </tr>
    `;
    return;
  }

  historyTbody.innerHTML = list.map(tk => {
    let statusClass = "bg-primary bg-opacity-15 text-primary";
    let statusText = "ATIVO";
    
    if (tk.status === "validado") {
      statusClass = "bg-success bg-opacity-15 text-success";
      statusText = "VALIDADO";
    } else if (tk.status === "cancelado") {
      statusClass = "bg-danger bg-opacity-15 text-danger";
      statusText = "CANCELADO";
    }

    return `
      <tr>
        <td>
          <strong>${tk.clientName}</strong>
          <span style="font-size: 10px; display: block; color: var(--text-muted);">${tk.clientEmail}</span>
        </td>
        <td>
          <strong>${tk.sector}</strong>
          <span style="font-size: 10px; display: block; color: var(--primary);">${tk.courtesyReason}</span>
        </td>
        <td><span class="badge ${statusClass} px-2 py-0.5" style="font-size: 10px;">${statusText}</span></td>
        <td class="text-center">
          <div class="d-flex justify-content-center gap-1">
            <button class="btn btn-outline-primary btn-sm px-1.5 py-0.5" style="border-radius: 4px; font-size: 11px;" title="Reenviar Ingresso" onclick="window.resendCourtesyDetail('${tk.id}')"><i class="ph-paper-plane-tilt"></i></button>
            <button class="btn btn-outline-info btn-sm px-1.5 py-0.5" style="border-radius: 4px; font-size: 11px;" title="Detalhes" onclick="window.showTicketDetails('${tk.id}')"><i class="ph-info"></i></button>
            <button class="btn btn-outline-danger btn-sm px-1.5 py-0.5" style="border-radius: 4px; font-size: 11px;" title="Cancelar Cortesia" onclick="window.cancelCourtesyDetail('${tk.id}')"><i class="ph-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.resendCourtesyDetail = function(tkId) {
  const tk = TICKETS_DATA.find(t => t.id === tkId);
  if (!tk) return;
  alert(`Reenviando e-mail de cortesia para ${tk.clientName} (${tk.clientEmail})!`);
};

window.cancelCourtesyDetail = function(tkId) {
  const tk = TICKETS_DATA.find(t => t.id === tkId);
  if (!tk) return;

  if (confirm(`Tem certeza que deseja cancelar a cortesia de ${tk.clientName}?`)) {
    const oldStatus = tk.status;
    tk.status = "cancelado";
    tk.history.push({
      date: formatCurrentDate(),
      user: "vinicius.casagrande",
      description: "Cortesia cancelada pelo promotor no painel de Cortesias."
    });

    if (oldStatus !== "cancelado") {
      adjustEventStats(tk.eventId, -1, 0, -1);
    }

    renderCourtesyDashboard();
    renderTicketsTable(true);
    renderTicketsTable(false);
    alert("Cortesia cancelada e desativada com sucesso.");
  }
};

// Batch Action Utilities
function updateBatchBar() {
  const viewId = document.querySelector('.page-section[style*="display: flex"]') || document.querySelector('.page-section[style*="display: block"]');
  if (!viewId) return;

  const currentTabId = viewId.getAttribute('id');
  let checkedCheckboxes = [];

  if (currentTabId === "view-global-consult-ticket") {
    checkedCheckboxes = document.querySelectorAll('#global-tickets-tbody .ticket-row-checkbox:checked');
  } else if (currentTabId === "view-event-consult-ticket") {
    checkedCheckboxes = document.querySelectorAll('#event-tickets-tbody .ticket-row-checkbox:checked');
  }

  const bar = document.getElementById('floating-batch-bar');
  const countSpan = document.getElementById('batch-selected-count');

  if (checkedCheckboxes.length > 0) {
    if (countSpan) countSpan.textContent = checkedCheckboxes.length;
    if (bar) bar.style.display = "block";
  } else {
    if (bar) bar.style.display = "none";
  }
}
window.updateBatchBar = updateBatchBar;

function getSelectedTicketIds() {
  const viewId = document.querySelector('.page-section[style*="display: flex"]') || document.querySelector('.page-section[style*="display: block"]');
  if (!viewId) return [];

  const currentTabId = viewId.getAttribute('id');
  let checkedCheckboxes = [];

  if (currentTabId === "view-global-consult-ticket") {
    checkedCheckboxes = document.querySelectorAll('#global-tickets-tbody .ticket-row-checkbox:checked');
  } else if (currentTabId === "view-event-consult-ticket") {
    checkedCheckboxes = document.querySelectorAll('#event-tickets-tbody .ticket-row-checkbox:checked');
  }

  return Array.from(checkedCheckboxes).map(cb => cb.getAttribute('data-id'));
}

function handleBatchResend() {
  const ids = getSelectedTicketIds();
  if (ids.length === 0) return;

  ids.forEach(id => {
    const tk = TICKETS_DATA.find(t => t.id === id);
    if (tk) {
      tk.history.push({
        date: formatCurrentDate(),
        user: "Sistema (Lote)",
        description: "Reenvio de voucher disparado via ação em lote."
      });
    }
  });

  alert(`E-mail com ingresso reenviado para os ${ids.length} contatos selecionados!`);
  clearBatchSelection();
}

function handleBatchValidate() {
  const ids = getSelectedTicketIds();
  if (ids.length === 0) return;

  let validatedCount = 0;
  ids.forEach(id => {
    const tk = TICKETS_DATA.find(t => t.id === id);
    if (tk && tk.status !== "validado" && tk.status !== "cancelado") {
      tk.status = "validado";
      tk.validationGate = "PORTARIA B (LOTE)";
      tk.validationDate = formatCurrentDate();
      tk.history.push({
        date: formatCurrentDate(),
        user: "vinicius.casagrande (Lote)",
        description: "Check-in realizado em massa via ação em lote."
      });
      validatedCount++;
    }
  });

  renderTicketsTable(true);
  renderTicketsTable(false);
  renderCourtesyDashboard();
  
  alert(`Check-in em massa realizado para ${validatedCount} ingressos com sucesso!`);
  clearBatchSelection();
}

function handleBatchCancel() {
  const ids = getSelectedTicketIds();
  if (ids.length === 0) return;

  if (!confirm(`Tem certeza que deseja CANCELAR em massa os ${ids.length} ingressos selecionados?`)) return;

  let cancelledCount = 0;
  ids.forEach(id => {
    const tk = TICKETS_DATA.find(t => t.id === id);
    if (tk && tk.status !== "cancelado") {
      const oldStatus = tk.status;
      tk.status = "cancelado";
      tk.history.push({
        date: formatCurrentDate(),
        user: "vinicius.casagrande (Lote)",
        description: "Ingresso cancelado e cota estornada via ação em lote."
      });
      adjustEventStats(tk.eventId, -1, -tk.price, tk.type === 'cortesia' ? -1 : 0);
      cancelledCount++;
    }
  });

  renderTicketsTable(true);
  renderTicketsTable(false);
  renderCourtesyDashboard();

  alert(`${cancelledCount} ingresso(s) cancelado(s) com sucesso.`);
  clearBatchSelection();
}

function handleBatchExport() {
  const ids = getSelectedTicketIds();
  if (ids.length === 0) return;

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "ID Ingresso,Pedido,Cliente,E-mail,CPF,Setor,Status,Tipo,Data Compra\r\n";

  ids.forEach(id => {
    const tk = TICKETS_DATA.find(t => t.id === id);
    if (tk) {
      const row = `"${tk.id}","${tk.orderId}","${tk.clientName}","${tk.clientEmail}","${tk.clientCpf}","${tk.sector}","${tk.status.toUpperCase()}","${tk.type.toUpperCase()}","${tk.purchaseDate}"`;
      csvContent += row + "\r\n";
    }
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `export_ingressos_selecionados_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  clearBatchSelection();
}

function clearBatchSelection() {
  const checkboxes = document.querySelectorAll('.ticket-row-checkbox');
  checkboxes.forEach(cb => cb.checked = false);

  const globalSelectAll = document.getElementById('global-select-all-tickets');
  if (globalSelectAll) globalSelectAll.checked = false;

  const eventSelectAll = document.getElementById('select-all-tickets');
  if (eventSelectAll) eventSelectAll.checked = false;

  updateBatchBar();
}

// Helpers
function formatCurrentDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${dateStr} às ${timeStr}`;
}

// Expose globally
window.openIssueCourtesyModal = openIssueCourtesyModal;
window.showQrCode = showQrCode;
window.showTicketDetails = showTicketDetails;
window.renderTicketsTable = renderTicketsTable;
window.renderCourtesyDashboard = renderCourtesyDashboard;
window.toggleEditHolder = toggleEditHolder;
window.cancelEditHolder = cancelEditHolder;
window.saveEditHolder = saveEditHolder;
window.toggleCheckinStatus = toggleCheckinStatus;
window.cancelTicketDetail = cancelTicketDetail;
window.resendEmailDetail = resendEmailDetail;
window.downloadPdfDetail = downloadPdfDetail;
window.updateBatchBar = updateBatchBar;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWizardController);
} else {
  initWizardController();
}



/* --- switchAccountingTab --- */
function switchAccountingTab(e,t){e&&e.preventDefault(),currentAccountingTab=t;let n=document.querySelectorAll(`#accounting-nav-pills .nav-link`);n.forEach(e=>e.classList.remove(`active`));let r=Array.from(n).find(e=>{let n=e.getAttribute(`onclick`)||``;return n.includes(`'${t}'`)||n.includes(`"${t}"`)});r&&r.classList.add(`active`),document.querySelectorAll(`.accounting-pane`).forEach(e=>e.style.display=`none`);let i=document.getElementById(`accpane-${t}`);if(i&&(i.style.display=`block`),t===`dashboard`?renderAccountingDashboard():t===`plano-contas`?renderPlanoContas():t===`diario`?renderDiario():t===`razao`?renderRazao():t===`lancamentos`?renderLancamentos():t===`custos`?renderCustos():t===`conciliacao`?renderConciliacao():t===`receber`?renderContasReceber():t===`pagar`?renderContasPagar():t===`repasses`&&renderRepasses(),t===`demonstracoes`){let e=currentAccountingMode===`expert`,t=document.getElementById(`acc-demo-actions-divider`),n=document.getElementById(`acc-demo-expert-actions`);t&&(t.style.display=e?`block`:`none`),n&&(n.style.display=e?`flex`:`none`)}logAudit(`Navegação de Tab`,`Tab anterior`,`Entrou na aba ${t}`)}

/* --- switchAccountingMode --- */
function switchAccountingMode(e){currentAccountingMode=e,[`standard`,`advanced`,`expert`].forEach(t=>{let n=document.getElementById(`btn-mode-${t}`);n&&(t===e?n.classList.add(`active`):n.classList.remove(`active`))}),typeof Zy==`function`&&Zy(e),addSystemNotification(`info`,`Módulo de Contabilidade`,`Modo do painel contábil alterado para ${e.toUpperCase()} com sucesso.`),switchAccountingTab(null,currentAccountingTab)}

/* --- showAddAccountModal --- */
function showAddAccountModal(){let e=prompt(`Digite o código da nova conta contábil (Ex: 5.1.04):`);if(!e)return;let t=prompt(`Digite o nome da conta (Ex: Despesa de Comunicação):`);if(!t)return;let n=prompt(`Digite o tipo da conta (ativo, passivo, patrimonio, receita, despesa):`).toLowerCase();ACCOUNTING_PLANO_CONTAS.push({code:e,name:t,type:n,parent:e.split(`.`).slice(0,-1).join(`.`)+`.00`}),renderPlanoContas(),logAudit(`Plano de Contas`,`Inclusão de Conta`,`Adicionou conta ${e} - ${t}`),addSystemNotification(`success`,`Plano de Contas`,`Conta ${e} adicionada com sucesso.`)}

/* --- filterLivroRazao --- */
function filterLivroRazao(){let e=document.getElementById(`acc-razao-tbody`);if(!e)return;let t=document.getElementById(`acc-razao-filter-account`).value,n=document.getElementById(`acc-razao-filter-cost`).value,r=document.getElementById(`acc-razao-filter-event`).value,i=0,a=ACC_LANCAMENTOS.filter(e=>{let i=!0;t!==`todos`&&(t===`bancos`?i=e.debit.includes(`Bancos`)||e.credit.includes(`Bancos`):t===`receber`?i=e.debit.includes(`Receber`)||e.credit.includes(`Receber`):t===`produtores`?i=e.debit.includes(`Produtores`)||e.credit.includes(`Produtores`):t===`venda-ingressos`?i=e.debit.includes(`Ingressos`)||e.credit.includes(`Ingressos`):t===`despesa-gateway`&&(i=e.debit.includes(`Gateway`)||e.credit.includes(`Gateway`)));let a=!0;n!==`todos`&&(a=e.costCenter.toLowerCase().includes(n.toLowerCase()));let o=!0;return r!==`todos`&&(o=e.eventId===parseInt(r)),i&&a&&o});e.innerHTML=a.map(e=>{let n=e.date.split(`-`).reverse().join(`/`),r=!1;return t===`todos`?r=!0:(t===`bancos`&&e.debit.includes(`Bancos`)&&(r=!0),t===`receber`&&e.debit.includes(`Receber`)&&(r=!0),t===`produtores`&&e.debit.includes(`Produtores`)&&(r=!0),t===`venda-ingressos`&&e.debit.includes(`Ingressos`)&&(r=!0),t===`despesa-gateway`&&e.debit.includes(`Gateway`)&&(r=!0)),r?i+=e.value:i-=e.value,`
      <tr>
        <td class="font-monospace text-muted">${n}</td>
        <td><span class="badge bg-light text-dark font-monospace">${r?e.debit.split(` `)[0]:e.credit.split(` `)[0]}</span></td>
        <td><span class="fs-xxs text-uppercase text-muted fw-bold">${e.costCenter}</span>${e.eventId?`<span class="badge bg-light-soft text-primary ms-1" style="font-size: 9px;">EV-${e.eventId}</span>`:``}</td>
        <td><strong>${e.desc}</strong></td>
        <td class="text-end font-monospace text-success">${r?`R$ ${e.value.toLocaleString(`pt-BR`)}`:`-`}</td>
        <td class="text-end font-monospace text-danger">${r?`-`:`R$ ${e.value.toLocaleString(`pt-BR`)}`}</td>
        <td class="text-end font-monospace fw-bold ${i>=0?`text-success`:`text-danger`}">R$ ${i.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}</td>
      </tr>
    `}).join(``),a.length===0&&(e.innerHTML=`<tr><td colspan="7" class="text-center ACCOUNTING_PLANO_CONTAS-4 text-muted">Nenhum lançamento corresponde aos filtros.</td></tr>`)}

/* --- clearRazaoFilters --- */
function clearRazaoFilters(){document.getElementById(`acc-razao-filter-account`).value=`todos`,document.getElementById(`acc-razao-filter-cost`).value=`todos`,document.getElementById(`acc-razao-filter-event`).value=`todos`,filterLivroRazao()}

/* --- saveManualAccountingEntry --- */
function saveManualAccountingEntry(e){e&&e.preventDefault();let t=document.getElementById(`acc-man-debit`).value,n=document.getElementById(`acc-man-credit`).value,r=parseFloat(document.getElementById(`acc-man-value`).value),i=document.getElementById(`acc-man-cost`).value,a=document.getElementById(`acc-man-desc`).value,o=document.getElementById(`acc-man-date`).value||new Date().toISOString().split(`T`)[0];ACC_LANCAMENTOS.unshift({id:Date.now(),date:o,desc:a,debit:t,credit:n,value:r,eventId:null,costCenter:i}),logAudit(`Lançamento Manual`,`Vazio`,`Novo lançamento no valor de R$ ${r.toLocaleString(`pt-BR`)} gravado.`),document.getElementById(`acc-manual-entry-form`).reset(),renderDiario(),addSystemNotification(`success`,`Lançamento Contábil`,`Lançamento manual inserido no Livro Diário.`),alert(`Lançamento Contábil registrado com sucesso!`)}

/* --- applyRateioRule --- */
function applyRateioRule(){let e=document.getElementById(`acc-rateio-event-select`).value,t=document.getElementById(`acc-rateio-percentage-input`).value,n=Array.from(document.getElementById(`acc-rateio-event-select`).options).find(t=>t.value===e).textContent;logAudit(`Centro de Custos`,`Regra de Rateio`,`Aplicou rateio de ${t}% no evento ${n}`),addSystemNotification(`info`,`Regra de Rateio`,`Aplicado rateio de ${t}% no evento ${n}.`),alert(`Regra de Rateio de ${t}% gravada com sucesso no borderô do evento:\n\n${n}`)}

/* --- simulateImportOFX --- */
function simulateImportOFX(){ACC_CONCILIACAO_PENDENTES=[{id:1,date:`2026-07-12`,bankDesc:`Stone Adquirente Pago D+1`,sysDesc:`Fechamento Lote Vendas Cartão`,value:14850,diff:0,status:`Pendente`},{id:2,date:`2026-07-13`,bankDesc:`Tarifa mensalidade Itaú`,sysDesc:`Provisão Taxas Bancárias`,value:95,diff:5,status:`Divergente`},{id:3,date:`2026-07-13`,bankDesc:`PIX Recebido Venda Ingressos`,sysDesc:`Apropriação Ingressos PIX`,value:185,diff:0,status:`Pendente`}],renderConciliacao(),logAudit(`Conciliação Bancária`,`Importação de OFX`,`Arquivo de extrato simulado OFX importado. 3 lançamentos confrontados.`),addSystemNotification(`success`,`Extrato OFX Importado`,`Processamento de conciliação finalizado. 3 batimentos pendentes.`),alert(`Batimento concluído!

Extrato bancário OFX processado. 3 lançamentos mapeados requerem batimento.`)}

/* --- conciliarManual --- */
function conciliarManual(e){let t=ACC_CONCILIACAO_PENDENTES.find(t=>t.id===e);t&&(t.status=`Conciliado`,t.diff=0,renderConciliacao(),logAudit(`Conciliação Bancária`,`Batimento manual`,`Lançamento id ${e} conciliado manualmente.`),addSystemNotification(`success`,`Conciliado`,`Lançamento "${t.bankDesc}" conciliado.`))}

/* --- requestAccountingPayout --- */
function requestAccountingPayout(e){e&&e.preventDefault();let t=parseFloat(document.getElementById(`acc-repass-value-input`).value),n=document.getElementById(`acc-repass-method`).value;if(t>32550){alert(`Saldo insuficiente para efetuar o repasse.`);return}let r=document.getElementById(`acc-repass-disponivel`),i=32550-t;r&&(r.textContent=`R$ ${i.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}`);let a=`REP-${Math.floor(1e3+Math.random()*9e3)}`;ACC_REPASSES_HISTORICO.unshift({id:a,date:new Date().toISOString().split(`T`)[0],method:n.toUpperCase(),value:t}),ACC_LANCAMENTOS.unshift({id:Date.now(),date:new Date().toISOString().split(`T`)[0],desc:`Solicitação de Repasse Produtor - ${a}`,debit:`2.1.02 - Produtores a Pagar (Repasses)`,credit:`1.1.02 - Bancos Conta Movimento (Itaú)`,value:t,eventId:null,costCenter:`Eventos`}),renderRepasses(),logAudit(`Repasse para Produtores`,`Transferência efetuada`,`Efetuou saque de R$ ${t.toLocaleString(`pt-BR`)} via ${n}`),addSystemNotification(`success`,`Repasse Efetuado`,`Transferência ${a} enviada via ${n.toUpperCase()}.`),alert(`Solicitação de Payout enviada com sucesso!\n\nID: ${a}\nValor: R$ ${t.toLocaleString(`pt-BR`)}`)}

/* --- recalculateTaxes --- */
function recalculateTaxes(){let e=document.getElementById(`acc-tax-regime`).value,t=document.getElementById(`acc-tax-calc-base`),n=document.getElementById(`acc-tax-calc-iss`),r=document.getElementById(`acc-tax-calc-piscofins`),i=document.getElementById(`acc-tax-calc-total`),a=64981.9,o=a*.05,s=0,c=0;e===`simples`?(s=a*.015,c=a*.065):e===`presumido`?(s=a*.0365,o=a*.05,c=a*.1633):(s=a*.0925,o=a*.05,c=a*.24),t&&(t.textContent=`R$ ${a.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}`),n&&(n.textContent=`- R$ ${o.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}`),r&&(r.textContent=`- R$ ${s.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}`),i&&(i.textContent=`- R$ ${c.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}`);let l=document.getElementById(`acc-dre-deducoes`);l&&(l.textContent=`- R$ ${c.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}`)}

/* --- switchDemoReport --- */
function switchDemoReport(e){let t=document.getElementById(`btn-demo-dre`),n=document.getElementById(`btn-demo-bp`),r=document.getElementById(`acc-demo-dre-panel`),i=document.getElementById(`acc-demo-bp-panel`);e===`dre`?(t&&t.classList.add(`active`),n&&n.classList.remove(`active`),r&&(r.style.display=`block`),i&&(i.style.display=`none`)):(t&&t.classList.remove(`active`),n&&n.classList.add(`active`),r&&(r.style.display=`none`),i&&(i.style.display=`block`))}

/* --- renderAudit --- */
function renderAudit(){let e=document.getElementById(`acc-audit-tbody`);e&&(e.innerHTML=ACC_AUDIT_LOGS.map(e=>`
      <tr>
        <td class="text-muted font-monospace">${e.timestamp}</td>
        <td><strong class="text-dark">${e.user}</strong></td>
        <td class="font-monospace">${e.ip}</td>
        <td><span class="badge bg-light text-primary fw-bold font-monospace">${e.action}</span></td>
        <td><span class="text-muted">${e.detail}</span></td>
      </tr>
    `).join(``))}

/* --- toggleContaAzulSync --- */
function toggleContaAzulSync(){let e=localStorage.getItem(`ca_connected`)===`true`,t=document.getElementById(`ca-status-badge`),n=document.querySelector(`#conta-azul-card-status button`);if(e){n&&(n.innerHTML=`<i class="ph-arrows-clockwise spinner me-1"></i> Sincronizando...`),setTimeout(()=>{n&&(n.innerHTML=`<i class="ph-arrows-clockwise me-1"></i> Sincronizar Lançamentos`),logAudit(`Integração Conta Azul`,`Sincronização ERP`,`Exportação incremental de 4 novos lançamentos e 1 contas a pagar concluída.`),addSystemNotification(`success`,`Conta Azul ERP`,`Lançamentos contábeis sincronizados com sucesso.`),alert(`Lançamentos sincronizados com o Conta Azul ERP!`)},1500);return}alert(`Redirecionando para autorização Conta Azul API OAuth 2.0...`),t&&(t.textContent=`CONECTANDO...`,t.className=`badge bg-info font-monospace text-white`),n&&(n.innerHTML=`<i class="ph-circle-notch spinner me-1"></i> Autorizando API...`),setTimeout(()=>{localStorage.setItem(`ca_connected`,`true`),t&&(t.textContent=`CONECTADO`,t.className=`badge bg-success font-monospace text-white`),n&&(n.innerHTML=`<i class="ph-arrows-clockwise me-1"></i> Sincronizar Lançamentos`),logAudit(`Integração Conta Azul`,`Conexão Estabelecida`,`Token OAuth 2.0 ativado. Sincronização automática em segundo plano ativada.`),addSystemNotification(`success`,`Conta Azul ERP`,`Integração Conta Azul conectada com sucesso! Importação inicial de lançamentos concluída.`),alert(`Integração Conta Azul conectada e sincronizada com sucesso!`),renderAccountingDashboard()},2e3)}

/* --- emitirGuiaTributaria --- */
function emitirGuiaTributaria(){let e=document.getElementById(`acc-tax-regime`)?.value||`simples`,t=64981.9,n=0,r=``,i=``;e===`simples`?(n=t*.065,r=`Documento de Arrecadação do Simples Nacional (DAS)`,i=`Simples Nacional DAS`):e===`presumido`?(n=t*.1633,r=`Documento de Arrecadação de Receitas Federais (DARF)`,i=`2372 - PIS/COFINS/ISS Cons.`):(n=t*.24,r=`Documento de Arrecadação de Receitas Federais (DARF)`,i=`5952 - IRRF/CSLL/PIS/COFINS`);let a=`acc-tax-modal`,o=document.getElementById(a);o||(o=document.createElement(`div`),o.id=a,o.className=`modal fade show`,o.style.display=`block`,o.style.backgroundColor=`rgba(0,0,0,0.5)`,o.style.zIndex=`99999`,document.body.appendChild(o)),o.innerHTML=`
    <div class="modal-dialog modal-dialog-centered" style="max-width: 600px;">
      <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; overflow: hidden;">
        <div class="modal-header bg-dark text-white ACCOUNTING_PLANO_CONTAS-3 border-0">
          <h6 class="modal-title fw-bold m-0"><i class="ph-file-text me-1"></i> Emissão de Guia de Impostos</h6>
          <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('${a}').remove()"></button>
        </div>
        <div class="modal-body p-4 bg-light">
          <div class="bg-white border rounded p-4 font-monospace shadow-sm text-start" style="font-size: 11px; line-height: 1.4; color: #222;">
            <div class="text-center border-bottom pb-2 mb-3">
              <strong style="font-size: 13px;">MINISTÉRIO DA FAZENDA</strong><br>
              <span>SECRETARIA DA RECEITA FEDERAL DO BRASIL</span><br>
              <strong class="text-primary d-block mt-1">${r}</strong>
            </div>
            <div class="row g-2 mb-3">
              <div class="col-6 border-end">
                <span class="text-muted d-block" style="font-size: 9px;">01. NOME / TELEFONE:</span>
                <strong>DISK INGRESSOS LTDA - (41) 3315-0808</strong>
              </div>
              <div class="col-6">
                <span class="text-muted d-block" style="font-size: 9px;">02. PERÍODO DE APURAÇÃO:</span>
                <strong>06/2026</strong>
              </div>
            </div>
            <div class="row g-2 mb-3 border-top pt-2">
              <div class="col-6 border-end">
                <span class="text-muted d-block" style="font-size: 9px;">03. NÚMERO DO CNPJ:</span>
                <strong>12.345.678/0001-90</strong>
              </div>
              <div class="col-6">
                <span class="text-muted d-block" style="font-size: 9px;">04. CÓDIGO DA RECEITA:</span>
                <strong>${i}</strong>
              </div>
            </div>
            <div class="row g-2 mb-3 border-top pt-2">
              <div class="col-6 border-end">
                <span class="text-muted d-block" style="font-size: 9px;">05. NÚMERO DE REFERÊNCIA:</span>
                <strong>2026.06.8872.1</strong>
              </div>
              <div class="col-6">
                <span class="text-muted d-block" style="font-size: 9px;">06. DATA DE VENCIMENTO:</span>
                <strong class="text-danger">20/07/2026</strong>
              </div>
            </div>
            <div class="border-top pt-3 text-end" style="font-size: 13px;">
              <span class="text-muted me-2" style="font-size: 10px;">07. VALOR TOTAL DA GUIA:</span>
              <strong class="text-dark bg-warning bg-opacity-25 px-2 ACCOUNTING_PLANO_CONTAS-1 rounded">R$ ${n.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}</strong>
            </div>
            <div class="text-center mt-4 border-top pt-3">
              <span class="text-muted d-block mb-1" style="font-size: 8px;">CÓDIGO DE BARRAS / LINHA DIGITÁVEL</span>
              <div class="bg-light p-2 rounded text-center border font-monospace select-all" style="font-size: 10px; letter-spacing: 1px;">
                85610000005 6 62090280260 7 71300000000 8
              </div>
              <span class="text-muted mt-1 d-block" style="font-size: 8px;">Via integrada via API da Receita Federal - Emissão Oficial</span>
            </div>
          </div>
        </div>
        <div class="modal-footer bg-light ACCOUNTING_PLANO_CONTAS-2 border-0 justify-content-between">
          <button class="btn btn-xs btn-outline-secondary fw-bold text-dark border" onclick="alert('Guia impressa com sucesso!')"><i class="ph-printer me-1"></i> Imprimir</button>
          <div class="d-flex gap-2">
            <button class="btn btn-xs btn-light border fw-bold text-dark" onclick="document.getElementById('${a}').remove()">Fechar</button>
            <button class="btn btn-xs btn-primary fw-bold text-white" onclick="window.baixarGuiaPDF('${e}', ${n})"><i class="ph-download-simple me-1"></i> Baixar Guia (PDF)</button>
          </div>
        </div>
      </div>
    </div>
  `,logAudit(`Emissão Fiscal`,`Guia de Impostos`,`Guia ${e.toUpperCase()} no valor de R$ ${n.toFixed(2)} gerada.`),addSystemNotification(`info`,`Faturamento Fiscal`,`Guia tributária (${e.toUpperCase()}) emitida com vencimento para 20/07/2026.`)}

/* --- baixarGuiaPDF --- */
function baixarGuiaPDF(e,t){let n=`GUIA DE TRIBUTO FEDERAL - RECEITA FEDERAL DO BRASIL\n\nContribuinte: DISK INGRESSOS LTDA\nCNPJ: 12.345.678/0001-90\n\nRegime Tributário: ${e.toUpperCase()}\nPeríodo: 06/2026\nVencimento: 20/07/2026\nValor Total: R$ ${t.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}\n\nLinha Digitável: 85610000005 6 62090280260 7 71300000000 8\n\nDocumento gerado automaticamente pelo Módulo de Contabilidade DiskIngressos.`,r=new Blob([n],{type:`text/plain;charset=utf-8`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`Guia_Imposto_${e.toUpperCase()}_06_2026.pdf`,a.click(),URL.revokeObjectURL(i)}

/* --- sincronizarPrefeitura --- */
function sincronizarPrefeitura(){let e=document.querySelector(`[onclick="window.sincronizarPrefeitura()"]`);if(!e)return;let t=e.innerHTML;e.innerHTML=`<i class="ph-arrows-clockwise spinner me-1"></i> Sincronizando...`,e.disabled=!0,setTimeout(()=>{e.innerHTML=t,e.disabled=!1;let n=document.getElementById(`acc-invoice-table-body`);n&&n.insertAdjacentHTML(`afterbegin`,`
        <tr>
          <td><strong>NFS-e #2026047</strong></td>
          <td>RODRIGO MOREIRA ALVES</td>
          <td><span class="badge bg-success text-white">Emitida</span></td>
          <td>13/07/2026</td>
          <td class="text-end">
            <button class="btn btn-xxs btn-light border" onclick="window.baixarNFEPdf('2026047', 'Rodrigo Moreira Alves')"><i class="ph-download-simple"></i> PDF</button>
            <button class="btn btn-xxs btn-light border" onclick="window.baixarNFEXml('2026047', 'Rodrigo Moreira Alves')"><i class="ph-code"></i> XML</button>
          </td>
        </tr>
        <tr>
          <td><strong>NFS-e #2026048</strong></td>
          <td>BEATRIZ M. DE OLIVEIRA</td>
          <td><span class="badge bg-success text-white">Emitida</span></td>
          <td>13/07/2026</td>
          <td class="text-end">
            <button class="btn btn-xxs btn-light border" onclick="window.baixarNFEPdf('2026048', 'Beatriz Oliveira')"><i class="ph-download-simple"></i> PDF</button>
            <button class="btn btn-xxs btn-light border" onclick="window.baixarNFEXml('2026048', 'Beatriz Oliveira')"><i class="ph-code"></i> XML</button>
          </td>
        </tr>
      `),logAudit(`Sincronização Prefeitura`,`NFS-e Ginfes`,`Sincronização efetuada com sucesso. 2 novas NFS-e emitidas.`),addSystemNotification(`success`,`Faturamento NFS-e`,`Lote de Notas Fiscais eletrônicas de serviço (NFS-e) sincronizado com a prefeitura municipal.`),alert(`Notas fiscais de serviço (NFS-e) sincronizadas com sucesso com o portal Ginfes da prefeitura!`)},2e3)}

/* --- baixarNFEPdf --- */
function baixarNFEPdf(e,t){let n=`NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFS-e\nNúmero: ${e}\nEmissor: DISK INGRESSOS LTDA\nCNPJ Emissor: 12.345.678/0001-90\n\nTomador de Serviço: ${t.toUpperCase()}\n\nDescrição do Serviço:\nIntermediação de Venda de Ingressos e Taxa de Conveniência referente a eventos do DiskIngressos.\n\nValor Total do Serviço: R$ 45,00\nISS Retido: R$ 2,25 (5%)\nStatus: EMITIDA / CONFIRMADA\nPrefeitura Municipal de Curitiba - Ginfes`,r=new Blob([n],{type:`text/plain;charset=utf-8`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`NFSe_${e}_${t.replace(/\s+/g,`_`)}.pdf`,a.click(),URL.revokeObjectURL(i),logAudit(`Download Arquivo`,`NFS-e PDF`,`Download do PDF da NFS-e #${e} (${t}) efetuado.`)}

/* --- baixarNFEXml --- */
function baixarNFEXml(e,t){let n=`<?xml version="1.0" encoding="UTF-8"?>\n<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">\n  <NFe>\n    <infNFe Id="NFe41260712345678000190550010000${e}">\n      <ide>\n        <cUF>41</cUF>\n        <cNF>${e}</cNF>\n        <natOp>Prestacao de Servicos</natOp>\n      </ide>\n      <emit>\n        <CNPJ>12345678000190</CNPJ>\n        <xNome>DISK INGRESSOS LTDA</xNome>\n      </emit>\n      <dest>\n        <xNome>${t.toUpperCase()}</xNome>\n      </dest>\n      <total>\n        <vServ>45.00</vServ>\n        <vISS>2.25</vISS>\n      </total>\n    </infNFe>\n  </NFe>\n</nfeProc>`,r=new Blob([n],{type:`text/xml;charset=utf-8`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`NFSe_${e}_${t.replace(/\s+/g,`_`)}.xml`,a.click(),URL.revokeObjectURL(i),logAudit(`Download Arquivo`,`NFS-e XML`,`Download do XML da NFS-e #${e} (${t}) efetuado.`)}

/* --- exportarSPED --- */
function exportarSPED(){let e=new Blob([`|0000|LECD|002|1|DISK INGRESSOS LTDA|12345678000190|41|4106902||01062026|30062026|G|1||
|0007|01|PR|4112345600|
|I010|G||
|I030|LIVRO DIARIO|1|10||01062026|30062026|CURITIBA|||
|I050|01062026|01|A|1|1.1|ATIVO||
|I050|01062026|01|A|2|1.1.01|DISPONIBILIDADES||
|I150|30062026||
|I155|1.1.01|PR-CURITIBA|32550.00|D|64981.90|32431.90|65100.00|D|
|9999|9|`],{type:`text/plain;charset=utf-8`}),t=URL.createObjectURL(e),n=document.createElement(`a`);n.href=t,n.download=`SPED_ECD_ECF_DiskIngressos_06_2026.txt`,n.click(),URL.revokeObjectURL(t),logAudit(`Exportação Fiscal`,`SPED ECD/ECF`,`Arquivo validador do SPED Contábil gerado.`),addSystemNotification(`success`,`Integração Fiscal`,`Arquivo SPED Contábil gerado com sucesso. Pronto para validação no PVA da Receita Federal.`),alert(`SPED Contábil (ECD/ECF) gerado e baixado no formato validador do governo (PVA)!`)}

/* --- exportarERPExtract --- */
function exportarERPExtract(){let e=`Data,Conta Debito,Conta Credito,Valor,Historico,Centro de Custo
`;ACC_LANCAMENTOS.forEach(t=>{e+=`"${t.date}","${t.debit}","${t.credit}",${t.value},"${t.history}","${t.costCenter||`Geral`}"\n`});let t=new Blob([e],{type:`text/csv;charset=utf-8`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`Extrato_ERP_Integracao_DiskIngressos_06_2026.csv`,r.click(),URL.revokeObjectURL(n),logAudit(`Exportação ERP`,`Extrato Unificado`,`Extrato consolidado gerado no formato para Conta Azul, TOTVS e SAP.`),addSystemNotification(`success`,`Sincronização ERP`,`Arquivo de integração de lançamentos unificado exportado com sucesso.`),alert(`Extrato de Integração ERP unificado (Conta Azul / SAP / TOTVS) baixado com sucesso!`)}

/* --- runAccountingSimulation --- */
function runAccountingSimulation(){let e=parseFloat(document.getElementById(`sim-ticket-price`).value)||0,t=parseFloat(document.getElementById(`sim-ticket-tax`).value)||0,n=document.getElementById(`sim-gateway-type`).value,r=parseFloat(document.getElementById(`sim-commission-pct`).value)||10,i=e+t,a=0;a=n===`cc`?i*.025+.5:i*.0099;let o=r/100*e+t,s=o*.065,c=e-r/100*e,l=i-a,u=o-a-s,d=e=>`R$ `+e.toLocaleString(`pt-BR`,{minimumFractionDigits:2,maximumFractionDigits:2});document.getElementById(`sim-res-rec-ingressos`).textContent=d(e),document.getElementById(`sim-res-rec-taxas`).textContent=d(t),document.getElementById(`sim-res-c-gateway`).textContent=d(a),document.getElementById(`sim-res-comissao`).textContent=d(o),document.getElementById(`sim-res-imposto`).textContent=d(s),document.getElementById(`sim-res-receber`).textContent=d(i),document.getElementById(`sim-res-liq-banco`).textContent=d(l),document.getElementById(`sim-res-prov-repasse`).textContent=d(c),document.getElementById(`sim-res-dre-liq`).textContent=d(u),document.getElementById(`sim-flow-val-venda`).textContent=d(i),document.getElementById(`sim-flow-val-gateway`).textContent=d(l),document.getElementById(`sim-flow-val-financeiro`).textContent=d(i),document.getElementById(`sim-flow-val-contabil`).textContent=d(o),document.getElementById(`sim-flow-val-conciliacao`).textContent=d(l),document.getElementById(`sim-flow-val-repasse`).textContent=d(c),[`venda`,`gateway`,`financeiro`,`contabil`,`conciliacao`,`repasse`].forEach((e,t)=>{let n=document.getElementById(`step-sim-${e}`);n&&(n.style.transition=`all 0.3s ease`,setTimeout(()=>{n.style.backgroundColor=`#d1e7dd`,n.style.borderColor=`#0f5132`},t*150),setTimeout(()=>{n.style.backgroundColor=`white`,n.style.borderColor=`#dee2e6`},t*150+1200))});let f=new Date().toISOString().split(`T`)[0],p=9999;ACC_LANCAMENTOS.unshift({id:Date.now(),date:f,desc:`[Simulação] Venda Ingresso & Taxa Conveniência`,debit:`1.1.04 - Contas a Receber (Adquirentes)`,credit:`4.1.01 - Receita Venda Ingressos`,value:i,eventId:p,costCenter:`Eventos`}),ACC_LANCAMENTOS.unshift({id:Date.now()+1,date:f,desc:`[Simulação] Custo Processamento Gateway`,debit:`5.1.01 - Despesa Gateway de Pagamento`,credit:`1.1.04 - Contas a Receber (Adquirentes)`,value:a,eventId:p,costCenter:`Financeiro`}),ACC_LANCAMENTOS.unshift({id:Date.now()+2,date:f,desc:`[Simulação] Provisão Repasse - Produtor`,debit:`4.1.01 - Receita Venda Ingressos`,credit:`2.1.02 - Produtores a Pagar (Repasses)`,value:c,eventId:p,costCenter:`Eventos`}),ACC_LANCAMENTOS.unshift({id:Date.now()+3,date:f,desc:`[Simulação] Apuração Imposto Simples Nacional (6.5%)`,debit:`5.1.00 - Despesa Tributária`,credit:`2.1.03 - Impostos a Recolher`,value:s,eventId:p,costCenter:`Financeiro`}),ACC_LANCAMENTOS.unshift({id:Date.now()+4,date:f,desc:`[Simulação] Liquidação Líquida Adquirente p/ Banco`,debit:`1.1.02 - Bancos Conta Movimento (Itaú)`,credit:`1.1.04 - Contas a Receber (Adquirentes)`,value:l,eventId:p,costCenter:`Financeiro`}),ACC_LANCAMENTOS.unshift({id:Date.now()+5,date:f,desc:`[Simulação] Payout Pago via Pix p/ Produtor`,debit:`2.1.02 - Produtores a Pagar (Repasses)`,credit:`1.1.02 - Bancos Conta Movimento (Itaú)`,value:c,eventId:p,costCenter:`Eventos`});let m=document.getElementById(`acc-conciliacao-tbody`);if(m){let e=document.createElement(`tr`);e.innerHTML=`
      <td>${f.split(`-`).reverse().join(`/`)}</td>
      <td><span class="badge bg-success">SIMULADO</span></td>
      <td>[Simulação] Liquidação Líquida Venda</td>
      <td class="font-monospace">Itaú Movimento</td>
      <td class="text-end fw-bold font-monospace text-success">${d(l)}</td>
      <td><span class="badge bg-success font-monospace">CONCILIADO</span></td>
    `,m.prepend(e)}let h=document.getElementById(`acc-kpi-receita-bruta`),g=document.getElementById(`acc-kpi-receita-liquida`),ee=document.getElementById(`acc-kpi-taxas`),te=document.getElementById(`acc-kpi-repasses`);h&&(h.textContent=d((parseFloat(h.textContent.replace(/[R$\s.]/g,``).replace(`,`,`.`))||0)+i)),g&&(g.textContent=d((parseFloat(g.textContent.replace(/[R$\s.]/g,``).replace(`,`,`.`))||0)+u)),ee&&(ee.textContent=d((parseFloat(ee.textContent.replace(/[R$\s.]/g,``).replace(`,`,`.`))||0)+a+s)),te&&(te.textContent=d((parseFloat(te.textContent.replace(/[R$\s.]/g,``).replace(`,`,`.`))||0)+c)),logAudit(`Simulação Ciclo`,`Venda Simulação`,`Ciclo contábil completo simulado para venda de ${d(i)}`),window.renderDiario&&window.renderDiario(),window.renderRazao&&window.renderRazao(),typeof Zy==`function`&&Zy(currentAccountingMode),document.getElementById(`sim-results-container`).style.display=`block`}

/* --- updateInteligenciaCard --- */
function updateInteligenciaCard(e){let t=document.getElementById(`acc-intelligence-body`);t&&(e===`standard`?t.innerHTML=`
      <div class="alert alert-info ACCOUNTING_PLANO_CONTAS-2 px-3 mb-0 fs-xxs">
        <i class="ph-info me-1"></i> Mude para o <strong>Modo Expert</strong> para ativar o Motor de IA e Simulações de Projeções Fiscais.
      </div>
    `:t.innerHTML=`
      <div class="d-flex flex-column gap-2" style="max-height: 250px; overflow-y: auto;">
        <div class="p-2 border border-danger rounded bg-danger bg-opacity-10 text-start">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <strong class="text-danger fs-xxs"><i class="ph-shield-warning text-danger me-1"></i> Divergência de Caixa</strong>
            <span class="badge bg-danger text-white" style="font-size: 8px;">Alta</span>
          </div>
          <span class="fs-xxs text-dark d-block mb-1">Diferença de R$ 1.480,00 entre o Extrato do Banco Inter e as apropriações do Gateway.</span>
          <span class="fs-xxs text-muted"><strong>Sugestão:</strong> Revisar taxa do dia 10/07/2026.</span>
        </div>
        
        ${ACC_LANCAMENTOS.some(e=>e.eventId===9999)?`
      <div class="p-2 border border-warning rounded bg-warning bg-opacity-10 text-start mt-2">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <strong class="text-warning fs-xxs"><i class="ph-warning text-warning me-1"></i> Lançamento Duplicado</strong>
          <span class="badge bg-warning text-white" style="font-size: 8px;">Média</span>
        </div>
        <span class="fs-xxs text-dark d-block mb-1">Lançamentos de ID #9999 possuem valores idênticos. Verifique se houve duplicidade no gateway.</span>
        <span class="fs-xxs text-muted"><strong>Sugestão:</strong> Mesclar lançamentos ou estornar um deles.</span>
      </div>
    `:``}

        <div class="p-2 border border-warning rounded bg-warning bg-opacity-10 text-start">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <strong class="text-warning fs-xxs"><i class="ph-warning text-warning me-1"></i> Gateway Divergente</strong>
            <span class="badge bg-warning text-white" style="font-size: 8px;">Média</span>
          </div>
          <span class="fs-xxs text-dark d-block mb-1">Taxa retida da Stone (2.8%) difere do contrato padrão parametrizado (2.5%).</span>
          <span class="fs-xxs text-muted"><strong>Sugestão:</strong> Ajustar regras ou renegociar taxas.</span>
        </div>

        <div class="p-2 border border-info rounded bg-info bg-opacity-10 text-start">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <strong class="text-info fs-xxs"><i class="ph-info text-info me-1"></i> Conciliação Pendente</strong>
            <span class="badge bg-info text-white" style="font-size: 8px;">Baixa</span>
          </div>
          <span class="fs-xxs text-dark d-block mb-1">Há recebimentos do dia 13/07/2026 pendentes de conciliação automática.</span>
          <span class="fs-xxs text-muted"><strong>Sugestão:</strong> Processar lote de conciliação bancária.</span>
        </div>
      </div>
    `)}

/* --- syncAccountingData --- */
function syncAccountingData(){let e=document.getElementById(`btn-sync-accounting-data`),t=e.innerHTML;e.disabled=!0,e.innerHTML=`<i class="ph-spinner spinner me-1"></i> Sincronizando...`,setTimeout(()=>{e.innerHTML=`<i class="ph-spinner spinner me-1"></i> Processando...`,setTimeout(()=>{e.innerHTML=`<i class="ph-check-circle me-1"></i> Concluído`,e.classList.remove(`btn-outline-primary`),e.classList.add(`btn-success`);let n=new Date().toISOString().split(`T`)[0];ACC_LANCAMENTOS.unshift({id:Date.now(),date:n,desc:`Sincronização Automática - Vendas Balbúrdia (Yii DB)`,debit:`1.1.04 - Contas a Receber (Adquirentes)`,credit:`4.1.01 - Receita Venda Ingressos`,value:5200,eventId:1653,costCenter:`Eventos`}),ACC_LANCAMENTOS.unshift({id:Date.now()+1,date:n,desc:`Sincronização Automática - Taxa Gateway Stone`,debit:`5.1.01 - Despesa Gateway de Pagamento`,credit:`1.1.04 - Contas a Receber (Adquirentes)`,value:130,eventId:1653,costCenter:`Financeiro`}),renderAccountingDashboard(),window.renderDiario&&window.renderDiario(),window.renderRazao&&window.renderRazao(),logAudit(`Sincronização`,`Vendas & Gateway`,`Sincronização forçada efetuada com sucesso.`),addSystemNotification(`success`,`Sincronização Concluída`,`Todos os indicadores do painel contábil foram atualizados.`),setTimeout(()=>{e.disabled=!1,e.innerHTML=t,e.classList.remove(`btn-success`),e.classList.add(`btn-outline-primary`)},2e3)},1500)},1500)}

/* --- renderAccountingDashboard --- */
function renderAccountingDashboard(){let e=0,t=0,n=0;ACC_LANCAMENTOS.forEach(r=>{r.credit===`4.1.01 - Receita Venda Ingressos`&&(e+=r.value),(r.debit===`5.1.01 - Despesa Gateway de Pagamento`||r.debit===`5.1.01 - Despesa Gateway`)&&(t+=r.value),r.debit===`2.1.02 - Produtores a Pagar (Repasses)`&&(n+=r.value)});let r=e-t,i=document.getElementById(`acc-kpi-receita-bruta`),a=document.getElementById(`acc-kpi-receita-liquida`),o=document.getElementById(`acc-kpi-taxas`),s=document.getElementById(`acc-kpi-repasses`);i&&(i.textContent=`R$ ${e.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}`),a&&(a.textContent=`R$ ${r.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}`),o&&(o.textContent=`R$ ${t.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}`),s&&(s.textContent=`R$ ${n.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}`);let c=document.getElementById(`acc-dashboard-events-tbody`);c&&EVENTS_DATA&&TICKETS_DATA&&(c.innerHTML=EVENTS_DATA.map(e=>{let t=TICKETS_DATA.filter(t=>t.eventId===e.id||t.eventId===e.id.toString()),n=t.length,r=0;t.forEach(e=>{let t=parseFloat(e.price)||0;r+=t}),r===0&&(r=e.id===1653?18500:e.id===1677?24200:e.id===1545?12900:2500);let i=r*.08,a=r-i;return`
        <tr>
          <td><span class="badge bg-light text-dark font-monospace">${e.id}</span></td>
          <td><strong>${e.name}</strong></td>
          <td><i class="ph-map-pin me-1 opacity-70"></i> ${e.location}</td>
          <td class="text-center font-monospace">${n||12}</td>
          <td class="text-end fw-bold font-monospace text-dark">R$ ${r.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}</td>
          <td class="text-end text-danger font-monospace">R$ ${i.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}</td>
          <td class="text-end text-success fw-bold font-monospace">R$ ${a.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}</td>
        </tr>
      `}).join(``))}

/* --- renderPlanoContas --- */
function renderPlanoContas(){let e=document.getElementById(`acc-plano-contas-tree`);e&&(e.innerHTML=ACCOUNTING_PLANO_CONTAS.map(e=>{let t=`ps-0`,n=e.parent===null,r=e.code.split(`.`).length>2;return r?t=`ps-4`:n||(t=`ps-3`),`
      <div class="d-flex justify-content-between align-items-center ${n?`bg-light fw-bold ACCOUNTING_PLANO_CONTAS-2 border-bottom`:`ACCOUNTING_PLANO_CONTAS-1.5 border-bottom border-light`} ${t}" style="font-size: 12.5px;">
        <div class="d-flex align-items-center gap-2">
          <i class="${n?`ph-folder-simple-open text-primary`:r?`ph-file text-muted`:`ph-folder text-warning`} fs-6"></i>
          <span class="font-monospace fw-semibold text-muted">${e.code}</span>
          <span class="${n?`text-dark`:`text-muted-dark`}">${e.name}</span>
        </div>
        <div>
          <span class="badge bg-light-soft text-uppercase fs-xxs" style="font-size: 9px;">${e.type}</span>
        </div>
      </div>
    `}).join(``))}

/* --- renderDiario --- */
function renderDiario(){let e=document.getElementById(`acc-diario-tbody`);e&&(e.innerHTML=ACC_LANCAMENTOS.map(e=>`
      <tr>
        <td class="font-monospace text-muted">${e.date.split(`-`).reverse().join(`/`)}</td>
        <td><strong>${e.desc}</strong></td>
        <td class="text-primary font-monospace">${e.debit}</td>
        <td class="text-danger font-monospace">${e.credit}</td>
        <td class="text-end fw-bold font-monospace">R$ ${e.value.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}</td>
      </tr>
    `).join(``))}

/* --- renderRazao --- */
function renderRazao(){let e=document.getElementById(`acc-razao-filter-event`);e&&e.children.length===0&&EVENTS_DATA&&(e.innerHTML=`<option value="todos" selected>Todos os Eventos</option>`+EVENTS_DATA.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``)),filterLivroRazao()}

/* --- renderLancamentos --- */
function renderLancamentos(){let e=document.getElementById(`acc-automatic-logs-container`);e&&(e.innerHTML=[{type:`venda`,title:`Integração Módulo Vendas`,desc:`Contabilização automática de 12 ingressos vendidos.`,value:1450,time:`há 5 min`},{type:`gateway`,title:`Liquidação Adquirente (Stone)`,desc:`Batimento e desconto de MDR sobre vendas de ontem.`,value:120.45,time:`há 20 min`},{type:`cancelamento`,title:`Cancelamento de Pedido #3536487`,desc:`Estorno tributário ISS proporcional efetuado.`,value:150,time:`há 1 hora`},{type:`repasses`,title:`Fechamento Lote Repasses`,desc:`Apropriação contábil do repasse de Luciano Reis.`,value:22880,time:`há 3 horas`}].map(e=>{let t=`ph-ticket text-success`;return e.type===`gateway`&&(t=`ph-credit-card text-primary`),e.type===`cancelamento`&&(t=`ph-arrow-counter-clockwise text-danger`),e.type===`repasses`&&(t=`ph-hand-coins text-warning`),`
      <div class="list-group-item d-flex justify-content-between align-items-center ACCOUNTING_PLANO_CONTAS-2.5">
        <div class="d-flex align-items-center gap-2">
          <div class="fs-4"><i class="${t}"></i></div>
          <div>
            <strong class="text-dark d-block" style="font-size: 11.5px;">${e.title}</strong>
            <span class="text-muted d-block" style="font-size: 10.5px;">${e.desc}</span>
          </div>
        </div>
        <div class="text-end">
          <span class="fw-bold font-monospace d-block text-dark" style="font-size: 11px;">R$ ${e.value.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}</span>
          <span class="text-muted d-block" style="font-size: 9px;">${e.time}</span>
        </div>
      </div>
    `}).join(``))}

/* --- renderCustos --- */
function renderCustos(){let e=document.getElementById(`acc-custos-departamentos-list`);if(!e)return;let t={Eventos:0,Financeiro:0,Tecnologia:0,Marketing:0};ACC_LANCAMENTOS.forEach(e=>{t[e.costCenter]!==void 0&&(t[e.costCenter]+=e.value)}),e.innerHTML=Object.entries(t).map(([e,t])=>{let n=`bg-primary`;return e===`Financeiro`&&(n=`bg-info`),e===`Tecnologia`&&(n=`bg-warning`),e===`Marketing`&&(n=`bg-danger`),`
      <div class="p-2.5 border rounded d-flex justify-content-between align-items-center text-start">
        <div class="d-flex align-items-center gap-2">
          <span class="avatar-circle rounded-circle ${n} text-white d-flex align-items-center justify-content-center" style="width: 24px; height: 24px; font-size: 10px; font-weight: bold;">${e[0]}</span>
          <div>
            <strong class="text-dark fs-xxs text-uppercase d-block">${e}</strong>
            <span class="text-muted" style="font-size: 10.5px;">Rateio administrativo organizacional</span>
          </div>
        </div>
        <strong class="font-monospace text-dark" style="font-size: 11.5px;">R$ ${t.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}</strong>
      </div>
    `}).join(``);let n=document.getElementById(`acc-rateio-event-select`);n&&n.children.length===0&&EVENTS_DATA&&(n.innerHTML=EVENTS_DATA.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``))}

/* --- renderConciliacao --- */
function renderConciliacao(){let e=document.getElementById(`acc-conciliacao-tbody`),t=document.getElementById(`acc-concil-pending-badge`);if(!e)return;let n=ACC_CONCILIACAO_PENDENTES.filter(e=>e.status!==`Conciliado`);t&&(t.textContent=`${n.length} Pendentes`,t.className=n.length>0?`badge bg-danger rounded-pill fs-xxs`:`badge bg-success rounded-pill fs-xxs`),e.innerHTML=ACC_CONCILIACAO_PENDENTES.map(e=>{let t=`text-warning`;return e.status===`Conciliado`&&(t=`text-success fw-bold`),e.status===`Divergente`&&(t=`text-danger fw-bold`),`
      <tr>
        <td class="font-monospace text-muted">${e.date.split(`-`).reverse().join(`/`)}</td>
        <td><strong>${e.bankDesc}</strong><br><span class="text-muted">R$ ${e.value.toLocaleString(`pt-BR`)}</span></td>
        <td><strong>${e.sysDesc}</strong></td>
        <td class="font-monospace fw-bold ${e.diff===0?`text-success`:`text-danger`}">R$ ${e.diff.toLocaleString(`pt-BR`)}</td>
        <td class="text-center">
          ${e.status===`Conciliado`?`
            <span class="${t}"><i class="ph-check-circle"></i> Fechado</span>
          `:`
            <button class="btn btn-xxs btn-success text-white fw-bold ACCOUNTING_PLANO_CONTAS-0.5 px-1.5" onclick="window.conciliarManual(${e.id})"><i class="ph-check"></i> Conciliar</button>
          `}
        </td>
      </tr>
    `}).join(``)}

/* --- renderContasReceber --- */
function renderContasReceber(){let e=document.getElementById(`acc-receber-tbody`);e&&(e.innerHTML=[{id:`3536487`,client:`Artur H. de S. Figueiredo`,method:`Cartão de Crédito (Stone)`,date:`29/09/2021`,status:`Pago`,value:150},{id:`3536573`,client:`Consumidor Final`,method:`PIX Itaú (D+0)`,date:`30/09/2021`,status:`Pago`,value:35},{id:`3536580`,client:`Maria Medeiros`,method:`Boleto Bancário (Inter)`,date:`15/07/2026`,status:`Pendente`,value:540},{id:`3536600`,client:`João de Souza`,method:`Cartão de Crédito D+30`,date:`12/08/2026`,status:`Pendente`,value:1200}].map(e=>{let t=`bg-success`;return e.status===`Pendente`&&(t=`bg-warning`),e.status===`Atrasado`&&(t=`bg-danger`),`
      <tr>
        <td class="font-monospace text-muted">#${e.id}</td>
        <td><strong>${e.client}</strong></td>
        <td><i class="ph-credit-card me-1 opacity-70"></i> ${e.method}</td>
        <td class="font-monospace">${e.date}</td>
        <td><span class="badge ${t}">${e.status}</span></td>
        <td class="text-end fw-bold font-monospace">R$ ${e.value.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}</td>
      </tr>
    `}).join(``))}

/* --- renderContasPagar --- */
function renderContasPagar(){let e=document.getElementById(`acc-pagar-tbody`);e&&(e.innerHTML=[{supplier:`Amazon Web Services (AWS)`,desc:`Cloud Hosting e Servidores`,date:`12/07/2026`,method:`Cartão Corporativo`,status:`Pago`,value:4500},{supplier:`Luciano Reis (Produtor)`,desc:`Repasse das Vendas Luciano Reis`,date:`15/07/2026`,method:`TED / PIX`,status:`Pendente`,value:22880},{supplier:`Receita Federal (DAS)`,desc:`DAS Simples Nacional`,date:`20/07/2026`,method:`DARF Bancário`,status:`Pendente`,value:5620.94}].map(e=>{let t=`bg-success`;return e.status===`Pendente`&&(t=`bg-warning`),e.status===`Vencido`&&(t=`bg-danger`),`
      <tr>
        <td><strong>${e.supplier}</strong></td>
        <td><span class="text-muted">${e.desc}</span></td>
        <td class="font-monospace">${e.date}</td>
        <td>${e.method}</td>
        <td><span class="badge ${t}">${e.status}</span></td>
        <td class="text-end fw-bold font-monospace">R$ ${e.value.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}</td>
      </tr>
    `}).join(``))}

/* --- renderRepasses --- */
function renderRepasses(){let e=document.getElementById(`acc-repasses-history-tbody`);e&&(e.innerHTML=ACC_REPASSES_HISTORICO.map(e=>{let t=e.date.split(`-`).reverse().join(`/`);return`
      <tr>
        <td class="font-monospace fw-bold text-muted">${e.id}</td>
        <td class="font-monospace">${t}</td>
        <td><span class="badge bg-light text-dark font-monospace">${e.method}</span></td>
        <td class="text-end fw-bold font-monospace text-success">R$ ${e.value.toLocaleString(`pt-BR`,{minimumFractionDigits:2})}</td>
      </tr>
    `}).join(``))}

/* --- logAudit --- */
function logAudit(e,t,n){ACC_AUDIT_LOGS.unshift({id:Date.now(),timestamp:new Date().toISOString().replace(`T`,` `).substring(0,19),user:`vinicius.casagrande`,ip:`192.168.1.45`,action:e,detail:n}),renderAudit()}


/* ==========================================================================
   10. Coupons Management Module
   ========================================================================== */

let COUPONS_DATA = [
  {
    id: 1,
    code: "DESCONTO10",
    type: "code",
    discountType: "percentage",
    discountValue: 10,
    limit: 100,
    used: 42,
    validity: "2026-07-30",
    linkUrl: ""
  },
  {
    id: 2,
    code: "influencer-promo",
    type: "link",
    discountType: "fixed",
    discountValue: 15,
    limit: 50,
    used: 12,
    validity: "2026-08-15",
    linkUrl: "https://diskingressos.com.br/evento/experiencia-musica-e-natureza?cupom=influencer-promo"
  }
];

function renderCouponsTable() {
  const tbody = document.getElementById("coupons-table-body");
  if (!tbody) return;

  tbody.innerHTML = COUPONS_DATA.map(coupon => {
    const isLink = coupon.type === "link";
    const typeBadge = isLink 
      ? `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20"><i class="ph-link me-1"></i> Link</span>`
      : `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20"><i class="ph-ticket me-1"></i> Código</span>`;
    
    const valueStr = coupon.discountType === "percentage"
      ? `${coupon.discountValue}%`
      : `R$ ${coupon.discountValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    const dateParts = coupon.validity.split("-");
    let formattedDate = coupon.validity;
    if (dateParts.length === 3) {
      formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }

    const copyBtn = isLink
      ? `<button class="btn btn-outline-success btn-xs fw-bold me-1 py-1 px-2 border" style="font-size: 11px; border-radius: 4px;" onclick="window.copyCouponLink('${coupon.linkUrl}')" title="Copiar Link"><i class="ph-copy me-1"></i> Copiar Link</button>`
      : "";

    return `
      <tr id="coupon-row-${coupon.id}">
        <td>
          <strong class="text-uppercase text-dark">${coupon.code}</strong>
          ${isLink ? `<div class="text-muted font-monospace fs-xxs mt-0.5 break-all text-truncate" style="max-width: 250px;" title="${coupon.linkUrl}">${coupon.linkUrl}</div>` : ""}
        </td>
        <td>${typeBadge}</td>
        <td>${valueStr}</td>
        <td>${coupon.limit}</td>
        <td>${coupon.used}</td>
        <td>${formattedDate}</td>
        <td class="text-right">
          ${copyBtn}
          <button class="btn btn-outline-danger btn-xs border text-danger py-1 px-2" style="font-size: 11px; border-radius: 4px;" onclick="window.deleteCoupon('${coupon.id}')" title="Excluir Cupom"><i class="ph-trash"></i></button>
        </td>
      </tr>
    `;
  }).join("");
}
window.renderCouponsTable = renderCouponsTable;

function copyCouponLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert("Link do cupom copiado para a área de transferência!");
  });
}
window.copyCouponLink = copyCouponLink;

function deleteCoupon(id) {
  if (!confirm("Tem certeza que deseja excluir este cupom?")) return;

  if (window.firebaseDB && window.firebaseDB.isConfigured) {
    window.firebaseDB.deleteCoupon(id).then(() => {
      console.log("Coupon deleted from Firebase successfully");
    }).catch(err => {
      console.error("Error deleting coupon from Firebase:", err);
      alert("Erro ao excluir do Firebase: " + err.message);
    });
  } else {
    COUPONS_DATA = COUPONS_DATA.filter(c => c.id.toString() !== id.toString());
    renderCouponsTable();
  }
}
window.deleteCoupon = deleteCoupon;

function updateLinkPreview() {
  const eventSelect = document.getElementById("cl-event");
  const slugInput = document.getElementById("cl-slug");
  const previewSpan = document.getElementById("cl-link-preview");
  
  if (eventSelect && slugInput && previewSpan) {
    const selectedOption = eventSelect.options[eventSelect.selectedIndex];
    const eventSlug = selectedOption ? selectedOption.getAttribute("data-slug") : "evento";
    const slug = slugInput.value.trim() || "slug-parceiro";
    previewSpan.textContent = `https://diskingressos.com.br/evento/${eventSlug}?cupom=${slug}`;
  }
}
window.updateLinkPreview = updateLinkPreview;

function initCouponModule() {
  console.log("Initializing Coupons Module...");
  const form = document.getElementById("modal-create-coupon-form");
  if (form) {
    const eventSelect = document.getElementById("cl-event");
    const slugInput = document.getElementById("cl-slug");
    
    if (eventSelect) eventSelect.addEventListener("change", updateLinkPreview);
    if (slugInput) slugInput.addEventListener("input", updateLinkPreview);
    
    form.addEventListener("submit", e => {
      e.preventDefault();
      try {
        console.log("Coupon form submit triggered");
        const typeRadio = document.querySelector('input[name="coupon-type"]:checked');
        const type = typeRadio ? typeRadio.value : "code";
        const discountType = document.getElementById("cc-discount-type").value;
        const discountValue = parseFloat(document.getElementById("cc-discount-value").value);
        const limit = parseInt(document.getElementById("cc-limit").value);
        const validity = document.getElementById("cc-expiry").value;
        
        let code = "";
        let linkUrl = "";
        
        if (type === "code") {
          code = document.getElementById("cc-code").value.trim();
        } else {
          code = document.getElementById("cl-slug").value.trim();
          const selectedOption = eventSelect.options[eventSelect.selectedIndex];
          const eventSlug = selectedOption ? selectedOption.getAttribute("data-slug") : "evento";
          linkUrl = `https://diskingressos.com.br/evento/${eventSlug}?cupom=${code}`;
        }
        
        const newCoupon = {
          id: Date.now().toString(),
          code: code,
          type: type,
          discountType: discountType,
          discountValue: discountValue,
          limit: limit,
          used: 0,
          validity: validity,
          linkUrl: linkUrl
        };
        
        if (window.firebaseDB && window.firebaseDB.isConfigured) {
          window.firebaseDB.saveCoupon(newCoupon).then(() => {
            console.log("Coupon saved to Firebase successfully");
          }).catch(err => {
            console.error("Error saving coupon to Firebase:", err);
          });
        } else {
          COUPONS_DATA.push(newCoupon);
          renderCouponsTable();
        }
        
        closeModal("create-coupon");
        form.reset();
        alert("Cupom criado com sucesso!");
      } catch (err) {
        console.error("Error creating coupon:", err);
        alert("Erro ao criar cupom: " + err.message);
      }
    });
  } else {
    console.warn("Coupon creation form not found in the DOM.");
  }
  
  renderCouponsTable();
}
window.initCouponModule = initCouponModule;



/* ==========================================================================
   11. Agenda Management Module
   ========================================================================== */

let currentAgendaYear = 2026;

function initAgendaAnnualModule() {
  if (typeof renderAgendaCalendarGrid === 'function') renderAgendaCalendarGrid();
}
window.initAgendaAnnualModule = initAgendaAnnualModule;

function selectAgendaYear(year) {
  currentAgendaYear = year;
  [2024, 2025, 2026, 2027, 2028].forEach(y => {
    let n = document.getElementById("year-label-" + y);
    if (n) {
      if (y === year) {
        n.className = "fs-5 fw-bold text-primary border-bottom border-primary border-3 pb-1 cursor-pointer";
      } else {
        n.className = "fs-sm text-muted cursor-pointer";
      }
    }
  });
  if (typeof renderAgendaCalendarGrid === 'function') renderAgendaCalendarGrid();
}
window.selectAgendaYear = selectAgendaYear;

function changeAgendaYear(diff) {
  let nextYear = currentAgendaYear + diff;
  if (nextYear >= 2024 && nextYear <= 2028) {
    selectAgendaYear(nextYear);
  }
}
window.changeAgendaYear = changeAgendaYear;

function initAgendaGeneralModule() {
  const tbody = document.getElementById('agenda-general-rows');
  if (!tbody) return;

  tbody.innerHTML = '';

  // Sort events by date
  function parseEventDate(ev) {
    if (!ev.date) return new Date();
    const match = ev.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      return new Date(match[3], match[2] - 1, match[1]);
    }
    return new Date();
  }

  const sortedEvents = [...EVENTS_DATA].sort((a, b) => parseEventDate(a) - parseEventDate(b));

  sortedEvents.forEach(ev => {
    const tr = document.createElement('tr');
    
    // Parse formatted time
    let timeStr = "Horário a definir";
    const timeMatch = ev.date ? ev.date.match(/-\s*(\d{2}:\d{2})/) : null;
    if (timeMatch) timeStr = timeMatch[1];

    tr.innerHTML = `
      <td>
        <span class="fw-bold text-dark d-block">${ev.date ? ev.date.split('-')[0].trim() : ''}</span>
        <span class="text-muted fs-xs"><i class="ph-clock me-1"></i> ${timeStr}</span>
      </td>
      <td><strong>${ev.name}</strong></td>
      <td><span class="text-muted fs-xs"><i class="ph-map-pin me-1"></i> ${ev.location}</span></td>
      <td>
        <span class="badge ${ev.status === 'ativos' ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}">
          ${ev.status === 'ativos' ? 'Ativo / Confirmado' : 'Concluído'}
        </span>
      </td>
      <td>
        <button class="btn btn-outline-light text-dark btn-sm border" onclick="switchActiveView('events'); setTimeout(() => { alert('Filtrando evento: ${ev.name}'); }, 150);">
          Ver Evento
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
window.initAgendaGeneralModule = initAgendaGeneralModule;



// Bind all accounting functions to window
window.switchAccountingTab = switchAccountingTab;
window.switchAccountingMode = switchAccountingMode;
window.showAddAccountModal = showAddAccountModal;
window.filterLivroRazao = filterLivroRazao;
window.clearRazaoFilters = clearRazaoFilters;
window.saveManualAccountingEntry = saveManualAccountingEntry;
window.applyRateioRule = applyRateioRule;
window.simulateImportOFX = simulateImportOFX;
window.conciliarManual = conciliarManual;
window.requestAccountingPayout = requestAccountingPayout;
window.recalculateTaxes = recalculateTaxes;
window.switchDemoReport = switchDemoReport;
window.renderAudit = renderAudit;
window.toggleContaAzulSync = toggleContaAzulSync;
window.emitirGuiaTributaria = emitirGuiaTributaria;
window.baixarGuiaPDF = baixarGuiaPDF;
window.sincronizarPrefeitura = sincronizarPrefeitura;
window.baixarNFEPdf = baixarNFEPdf;
window.baixarNFEXml = baixarNFEXml;
window.exportarSPED = exportarSPED;
window.exportarERPExtract = exportarERPExtract;
window.runAccountingSimulation = runAccountingSimulation;
window.updateInteligenciaCard = updateInteligenciaCard;
window.syncAccountingData = syncAccountingData;
window.renderAccountingDashboard = renderAccountingDashboard;
window.renderPlanoContas = renderPlanoContas;
window.renderDiario = renderDiario;
window.renderRazao = renderRazao;
window.renderLancamentos = renderLancamentos;
window.renderCustos = renderCustos;
window.renderConciliacao = renderConciliacao;
window.renderContasReceber = renderContasReceber;
window.renderContasPagar = renderContasPagar;
window.renderRepasses = renderRepasses;
window.logAudit = logAudit;


/* ==========================================================================
   DiskIngressos Custom Saldo/Balance Tab Features
   ========================================================================== */
window.financialShowClosed = false;

window.financialShowClosed = false;
let financialSearchQuery = '';
let financialFilterOrganizer = 'all';
let financialFilterStatus = 'all';
let currentEvolutionPeriod = '7d';

window.financialEvolutionChart = null;
window.financialDistributionChart = null;

function renderFinancialBalanceRows() {
  const tbody = document.getElementById('financial-balance-rows');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const filteredEvents = EVENTS_DATA.filter(ev => {
    // Search filter
    const matchesSearch = !financialSearchQuery || 
      ev.name.toLowerCase().includes(financialSearchQuery.toLowerCase()) ||
      (ev.location && ev.location.toLowerCase().includes(financialSearchQuery.toLowerCase())) ||
      (ev.id && ev.id.toString().includes(financialSearchQuery));

    // Organizer filter
    let matchesOrganizer = true;
    if (financialFilterOrganizer !== 'all') {
      if (financialFilterOrganizer === 'Vila Brasil') {
        matchesOrganizer = ev.location && ev.location.includes('Vila Brasil');
      } else if (financialFilterOrganizer === 'PM Curitiba') {
        matchesOrganizer = ev.location && (ev.location.includes('Parque') || ev.location.includes('Teatro'));
      } else {
        matchesOrganizer = !ev.location || (!ev.location.includes('Vila Brasil') && !ev.location.includes('Parque'));
      }
    }

    // Status filter
    let matchesStatus = true;
    if (financialFilterStatus !== 'all') {
      matchesStatus = ev.status === financialFilterStatus;
    }
    
    return matchesSearch && matchesOrganizer && matchesStatus;
  });
  
  if (filteredEvents.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-3">Nenhum saldo encontrado para os filtros selecionados.</td></tr>';
    
    // Clear KPIs as well
    ['kpi-available-balance', 'kpi-releasing-balance', 'kpi-blocked-balance', 'kpi-next-repasse-value', 'kpi-gross-revenue', 'kpi-net-revenue', 'kpi-total-fees', 'kpi-meta-achieved'].forEach(k => {
      const el = document.getElementById(k);
      if (el) el.textContent = 'R$ 0,00';
    });
    const metaPercentEl = document.getElementById('kpi-meta-percent');
    if (metaPercentEl) metaPercentEl.textContent = '0%';
    const metaProgressEl = document.getElementById('kpi-meta-progress');
    if (metaProgressEl) metaProgressEl.style.width = '0%';
    return;
  }
  
  let grossRevenueTotal = 0;
  let feesTotal = 0;
  let netRevenueTotal = 0;
  let availableTotal = 0;
  let releasingTotal = 0;
  let blockedTotal = 0;
  let paidRepassesTotal = 0;
  let pendingRepassesTotal = 0;

  filteredEvents.forEach(ev => {
    const platformFee = ev.fees?.platform || 0;
    const cardFee = ev.fees?.card || 0;
    const retention = ev.fees?.retention || 0;
    const fees = platformFee + cardFee + retention;
    const net = Math.max(0, ev.revenue - fees);
    
    const evRepasses = PAYOUTS_HISTORY.filter(p => p.eventId === ev.id || (ev.id === 3368 && !p.eventId));
    const paid = evRepasses.filter(p => p.status === 'Pago').reduce((sum, p) => sum + p.value, 0);
    const pending = evRepasses.filter(p => p.status === 'Pendente' || p.status === 'Em Processamento' || p.status === 'Em processamento' || p.status === 'Aguardando Aprovação').reduce((sum, p) => sum + p.value, 0);
    
    const releasing = ev.status === 'ativos' ? net * 0.15 : 0;
    const blocked = ev.status === 'ativos' ? net * 0.02 : 0;
    const available = Math.max(0, net - paid - pending - releasing - blocked);
    
    grossRevenueTotal += ev.revenue;
    feesTotal += fees;
    netRevenueTotal += net;
    availableTotal += available;
    releasingTotal += releasing;
    blockedTotal += blocked;
    paidRepassesTotal += paid;
    pendingRepassesTotal += pending;

    // Organizer name
    let organizer = 'DiskIngressos';
    if (ev.location && ev.location.includes('Vila Brasil')) organizer = 'Vila Brasil';
    else if (ev.location && (ev.location.includes('Parque') || ev.location.includes('Teatro'))) organizer = 'PM Curitiba';

    // Status badge
    const statusClass = ev.status === 'ativos' ? 'bg-success' : 'bg-secondary';
    const statusText = ev.status === 'ativos' ? 'Ativo' : 'Encerrado';

    const rowHtml = `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            <div class="symbol-circle me-2" style="background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
              <i class="ph-wallet" style="font-size: 14px;"></i>
            </div>
            <div>
              <span class="fw-semibold text-dark d-block event-name-td" style="font-size: 12.5px;">${ev.name}</span>
              <span class="text-muted fs-xxs">${ev.date}</span>
            </div>
          </div>
        </td>
        <td><span class="badge bg-light text-dark fw-bold">${organizer}</span></td>
        <td class="text-end font-monospace">R$ ${ev.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="text-end text-muted font-monospace">R$ ${fees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="text-end font-monospace fw-semibold text-dark">R$ ${net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="text-end font-monospace text-success fw-bold">R$ ${available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="text-end font-monospace text-primary">R$ ${releasing.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="text-end font-monospace text-warning">R$ ${(available * 0.22).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="text-center"><span class="badge ${statusClass} bg-opacity-10 text-${ev.status === 'ativos' ? 'success' : 'muted'}">${statusText}</span></td>
        <td class="text-center">
          <div class="dropdown">
            <button class="btn btn-outline-light border text-dark btn-xs" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="padding: 2px 6px;">
              <i class="ph-dots-three-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-lg" style="font-size: 12.5px; border-radius: 8px;">
              <li><a class="dropdown-item fw-semibold text-success" href="#" onclick="window.requestRepasseForEvent(${ev.id})"><i class="ph-hand-coins me-2"></i> Solicitar Repasse</a></li>
              <li><a class="dropdown-item fw-semibold" href="#" onclick="window.viewEventFinancialDetails(${ev.id})"><i class="ph-eye me-2"></i> Ver Detalhes</a></li>
            </ul>
          </div>
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', rowHtml);
  });

  // Update KPIs
  const availableKpi = document.getElementById('kpi-available-balance');
  if (availableKpi) availableKpi.textContent = 'R$ ' + availableTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  
  const releasingKpi = document.getElementById('kpi-releasing-balance');
  if (releasingKpi) releasingKpi.textContent = 'R$ ' + releasingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  
  const blockedKpi = document.getElementById('kpi-blocked-balance');
  if (blockedKpi) blockedKpi.textContent = 'R$ ' + blockedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  
  const nextRepasseKpi = document.getElementById('kpi-next-repasse-value');
  if (nextRepasseKpi) nextRepasseKpi.textContent = 'R$ ' + (availableTotal * 0.22).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  
  const grossKpi = document.getElementById('kpi-gross-revenue');
  if (grossKpi) grossKpi.textContent = 'R$ ' + grossRevenueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  
  const netKpi = document.getElementById('kpi-net-revenue');
  if (netKpi) netKpi.textContent = 'R$ ' + netRevenueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  
  const feesKpi = document.getElementById('kpi-total-fees');
  if (feesKpi) feesKpi.textContent = 'R$ ' + feesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const metaAchieved = document.getElementById('kpi-meta-achieved');
  if (metaAchieved) metaAchieved.textContent = 'R$ ' + netRevenueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const metaTarget = 500000;
  const metaPercent = Math.min(100, Math.round((netRevenueTotal / metaTarget) * 100));
  const metaPercentEl = document.getElementById('kpi-meta-percent');
  if (metaPercentEl) metaPercentEl.textContent = metaPercent + '%';
  const metaProgressEl = document.getElementById('kpi-meta-progress');
  if (metaProgressEl) metaProgressEl.style.width = metaPercent + '%';

  // Smart Cards update
  const smartBiggestEvent = document.getElementById('smart-biggest-event');
  if (smartBiggestEvent && filteredEvents.length > 0) {
    const sorted = [...filteredEvents].sort((a, b) => b.revenue - a.revenue);
    smartBiggestEvent.textContent = sorted[0].name;
    const revenueEl = document.getElementById('smart-biggest-event-revenue');
    if (revenueEl) revenueEl.textContent = 'R$ ' + sorted[0].revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  // Update charts
  renderEvolutionChart();
  renderDistributionChart(availableTotal, releasingTotal, paidRepassesTotal, blockedTotal, blockedTotal * 0.25);
}

function renderEvolutionChart() {
  const ctxEl = document.getElementById('chart-financial-evolution');
  if (!ctxEl) return;
  const ctx = ctxEl.getContext('2d');
  if (!ctx) return;

  if (window.financialEvolutionChart) {
    window.financialEvolutionChart.destroy();
  }

  let labels = [];
  let entradas = [];
  let saidas = [];
  let saldo = [];

  if (currentEvolutionPeriod === '7d') {
    labels = ['09/07', '10/07', '11/07', '12/07', '13/07', '14/07', '15/07'];
    entradas = [4200, 5100, 8500, 3200, 6100, 7800, 8500];
    saidas = [1100, 1500, 2100, 900, 1800, 2200, 2100];
    saldo = [3100, 3600, 6400, 2300, 4300, 5600, 6400];
  } else if (currentEvolutionPeriod === '30d') {
    labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    entradas = [24000, 28000, 35000, 42000];
    saidas = [8000, 9200, 12000, 15000];
    saldo = [16000, 18800, 23000, 27000];
  } else {
    labels = ['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'];
    entradas = [85000, 92000, 104000, 120000, 150000, 95000, 110000, 125000, 130000, 142000, 155000, 168000];
    saidas = [31000, 34000, 38000, 45000, 60000, 36000, 40000, 46000, 48000, 52000, 58000, 62000];
    saldo = [54000, 58000, 66000, 75000, 90000, 59000, 70000, 79000, 82000, 90000, 97000, 106000];
  }

  window.financialEvolutionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Entradas',
          data: entradas,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Saídas',
          data: saidas,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Saldo Líquido',
          data: saldo,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 12, font: { size: 11 } }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: function(val) {
              return 'R$ ' + val.toLocaleString('pt-BR');
            }
          }
        }
      }
    }
  });
}

function renderDistributionChart(available, releasing, antecipado, blocked, contestacao) {
  const ctxEl = document.getElementById('chart-financial-distribution');
  if (!ctxEl) return;
  const ctx = ctxEl.getContext('2d');
  if (!ctx) return;

  if (window.financialDistributionChart) {
    window.financialDistributionChart.destroy();
  }

  window.financialDistributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Disponível', 'A Liberar', 'Antecipado', 'Bloqueado', 'Contestação'],
      datasets: [{
        data: [available, releasing, antecipado, blocked, contestacao],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 10, font: { size: 10 } }
        }
      }
    }
  });
}

function updateEvolutionChartFilter(period) {
  currentEvolutionPeriod = period;
  ['7d', '30d', '12m'].forEach(p => {
    const btn = document.getElementById(`btn-evolution-${p}`);
    if (btn) {
      if (p === period) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
  renderEvolutionChart();
}
window.updateEvolutionChartFilter = updateEvolutionChartFilter;

function clearFinancialFilters() {
  const searchEl = document.getElementById('search-financial-balance');
  if (searchEl) searchEl.value = '';
  const orgEl = document.getElementById('filter-financial-organizer');
  if (orgEl) orgEl.value = 'all';
  const statusEl = document.getElementById('filter-financial-status');
  if (statusEl) statusEl.value = 'all';
  
  financialSearchQuery = '';
  financialFilterOrganizer = 'all';
  financialFilterStatus = 'all';
  
  renderFinancialBalanceRows();
}
window.clearFinancialFilters = clearFinancialFilters;

function syncFinancialData() {
  const icon = document.getElementById('sync-icon');
  if (icon) {
    icon.classList.add('fa-spin');
  }
  
  setTimeout(() => {
    if (icon) icon.classList.remove('fa-spin');
    
    EVENTS_DATA.forEach(ev => {
      if (ev.status === 'ativos') {
        ev.revenue += Math.round(Math.random() * 800 - 300);
        if (ev.fees) {
          ev.fees.platform = ev.revenue * 0.1;
          ev.fees.card = ev.revenue * 0.05;
        }
      }
    });
    
    renderFinancialBalanceRows();
    
    const insightsList = document.getElementById('ia-financeira-insights-list');
    if (insightsList) {
      insightsList.innerHTML = `
        <li>Dados atualizados com sucesso às ${new Date().toLocaleTimeString('pt-BR')}.</li>
        <li>Seu saldo disponível aumentou <strong>${(10 + Math.random()*5).toFixed(1)}%</strong> em relação à semana anterior.</li>
        <li>O evento "${EVENTS_DATA[0].name}" representa <strong>${Math.round(EVENTS_DATA[0].revenue / EVENTS_DATA.reduce((sum, e) => sum + e.revenue, 0) * 100)}%</strong> de toda a sua receita total.</li>
        <li>R$ ${(12000 + Math.random()*4000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} previstos para liberação automática amanhã.</li>
      `;
    }
    
    alert("Saldo sincronizado com sucesso!");
  }, 1000);
}
window.syncFinancialData = syncFinancialData;

function exportFinancialFormat(format) {
  alert(`Exportando relatório financeiro no formato ${format.toUpperCase()}...`);
  if (format === 'csv') {
    exportFinancialBalanceCSV();
  } else {
    let filename = `relatorio-financeiro.${format}`;
    let data = "Conteudo de relatorio mockup para formato " + format.toUpperCase();
    let blob = new Blob([data], { type: 'text/plain' });
    let link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
}
window.exportFinancialFormat = exportFinancialFormat;

function renderFinancialEligibleEvents() {
  const tbody = document.getElementById('financial-eligible-events-rows');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  EVENTS_DATA.forEach(ev => {
    const platformFee = ev.fees?.platform || 0;
    const cardFee = ev.fees?.card || 0;
    const retention = ev.fees?.retention || 0;
    const totalFees = platformFee + cardFee + retention;
    const netRevenue = Math.max(0, ev.revenue - totalFees);
    
    const evRepasses = PAYOUTS_HISTORY.filter(p => p.eventId === ev.id || (ev.id === 3368 && !p.eventId));
    const paidRepasses = evRepasses.filter(p => p.status === 'Pago').reduce((sum, p) => sum + p.value, 0);
    const pendingRepasses = evRepasses.filter(p => p.status === 'Pendente' || p.status === 'Em Processamento' || p.status === 'Em processamento' || p.status === 'Aguardando Aprovação').reduce((sum, p) => sum + p.value, 0);
    
    const available = Math.max(0, netRevenue - paidRepasses - pendingRepasses);
    const isEligible = available > 0 && ev.status === 'ativos';
    
    let statusBadge = '';
    if (ev.status !== 'ativos') {
      statusBadge = '<span style="font-size: 9px; display: block; color: #ef4444;"><i class="ph-lock"></i> Inativo</span>';
    } else if (available <= 0) {
      statusBadge = '<span style="font-size: 9px; display: block; color: #718096;"><i class="ph-check-circle"></i> Sem Saldo</span>';
    } else {
      statusBadge = '<span style="font-size: 9px; display: block; color: #2ecb71;"><i class="ph-lock-open"></i> Liberado</span>';
    }
    
    const isChecked = isEligible && ev.id === 3368;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding: 8px 10px;">
        <input type="checkbox" class="chk-eligible-event" id="chk-eligible-ev-${ev.id}" data-id="${ev.id}" data-value="${available}" ${isEligible ? '' : 'disabled'} ${isChecked ? 'checked' : ''} onchange="updatePayoutAvailableSum()">
      </td>
      <td style="padding: 8px 10px; font-weight: 600; color: ${isEligible ? '#1e293b' : 'var(--text-light)'}; font-size: 12.5px;">
        ${ev.name}
        ${statusBadge}
      </td>
      <td style="padding: 8px 10px; color: ${isEligible ? 'var(--text-main)' : 'var(--text-light)'}; font-size: 11px;">
        ${ev.date.split(' - ')[0]}
      </td>
      <td style="padding: 8px 10px; color: ${isEligible ? 'var(--text-main)' : 'var(--text-light)'};" class="text-right text-end amount fw-bold ${isEligible ? 'text-success' : ''}">
        R$ ${available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </td>
    `;
    tbody.appendChild(tr);
  });
}
window.renderFinancialEligibleEvents = renderFinancialEligibleEvents;

window.requestRepasseForEvent = function(eventId) {
  renderFinancialEligibleEvents();
  
  document.querySelectorAll('.chk-eligible-event').forEach(chk => {
    const id = chk.getAttribute('data-id');
    if (id == eventId) {
      chk.checked = true;
    } else {
      chk.checked = false;
    }
  });
  
  updatePayoutAvailableSum();
  switchActiveView('financial-repass');
  
  const formEl = document.getElementById('page-repasse-form');
  if (formEl) {
    formEl.scrollIntoView({ behavior: 'smooth' });
  }
};

window.viewEventFinancialDetails = function(eventId) {
  const ev = EVENTS_DATA.find(e => e.id == eventId);
  if (!ev) return;
  
  const platformFee = ev.fees?.platform || 0;
  const cardFee = ev.fees?.card || 0;
  const retention = ev.fees?.retention || 0;
  const totalFees = platformFee + cardFee + retention;
  const netRevenue = Math.max(0, ev.revenue - totalFees);
  
  const fmt = val => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const fmtNeg = val => `- R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  document.getElementById('balance-event-name').textContent = ev.name;
  document.getElementById('balance-gross').textContent = fmt(ev.revenue);
  document.getElementById('balance-tax-platform').textContent = fmtNeg(platformFee);
  document.getElementById('balance-tax-card').textContent = fmtNeg(cardFee);
  document.getElementById('balance-retention').textContent = fmtNeg(retention);
  document.getElementById('balance-net').textContent = fmt(netRevenue);
  
  openModal('balance');
};

function toggleFinancialShowClosed() {
  window.financialShowClosed = !window.financialShowClosed;
  const btn = document.getElementById('btn-financial-closed');
  if (btn) {
    btn.innerHTML = window.financialShowClosed ? '<i class="ph-eye-slash"></i> Ver ativos' : '<i class="ph-eye"></i> Ver encerrados';
  }
  renderFinancialBalanceRows();
}
window.toggleFinancialShowClosed = toggleFinancialShowClosed;

function exportFinancialBalanceCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Evento,Total Arrecadado,Taxas,Liquido,Repasses Pagos,Repasses Pendentes,Disponivel\n";
  
  EVENTS_DATA.forEach(ev => {
    const platformFee = ev.fees?.platform || 0;
    const cardFee = ev.fees?.card || 0;
    const retention = ev.fees?.retention || 0;
    const totalFees = platformFee + cardFee + retention;
    const netRevenue = Math.max(0, ev.revenue - totalFees);
    
    const evRepasses = PAYOUTS_HISTORY.filter(p => p.eventId === ev.id || (ev.id === 3368 && !p.eventId));
    const paidRepasses = evRepasses.filter(p => p.status === 'Pago').reduce((sum, p) => sum + p.value, 0);
    const pendingRepasses = evRepasses.filter(p => p.status === 'Pendente' || p.status === 'Em Processamento' || p.status === 'Em processamento' || p.status === 'Aguardando Aprovação').reduce((sum, p) => sum + p.value, 0);
    const available = Math.max(0, netRevenue - paidRepasses - pendingRepasses);
    
    csvContent += `"${ev.name}",${ev.revenue},${totalFees},${netRevenue},${paidRepasses},${pendingRepasses},${available}\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "saldo_consolidado_diskingressos.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleFinancialExport() {
  const saldoPane = document.getElementById('subpane-saldo');
  if (saldoPane && saldoPane.style.display !== 'none') {
    exportFinancialBalanceCSV();
  } else {
    exportPayoutsCSV();
  }
}

/* ==========================================================================
   DiskIngressos Custom Negociações Financeiro Features
   ========================================================================== */
window.currentNegotiationEventId = 3368;
window.NEGOCIACOES_DATA = {};

function calculateNegotiationTotals(eventId) {
  const data = window.NEGOCIACOES_DATA[eventId];
  if (!data) return;
  
  let totalBruto = 0;
  let totalTaxas = 0;
  let totalServico = 0;
  let totalLiquido = 0;
  let totalIngressos = 0;
  
  data.receitas.forEach(r => {
    const paymentFee = parseFloat(r.taxa_pagamento) || 0;
    const antFee = parseFloat(r.taxa_antecipacao) || 0;
    const parcFee = parseFloat(r.taxa_parcelado) || 0;
    const effectiveRate = (paymentFee + antFee + parcFee) / 100;
    
    r.taxas = r.bruto * effectiveRate;
    
    const serviceDeduction = (r.pagamento_taxa_servico === 0) ? r.servico : 0;
    
    r.liquido = Math.max(0, r.bruto - r.taxas - serviceDeduction);
    
    totalBruto += r.bruto;
    totalTaxas += r.taxas;
    totalServico += r.servico;
    totalLiquido += r.liquido;
    totalIngressos += r.qtd_tickets;
  });
  
  data.total_bruto = totalBruto;
  data.total_taxas = totalTaxas;
  data.total_servico = totalServico;
  data.total_liquido = totalLiquido;
  data.total_ingressos = totalIngressos;
  
  // Calculate total despesas
  let totalDespesas = 0;
  data.despesas.forEach(d => {
    totalDespesas += parseFloat(d.valor) || 0;
  });
  data.total_despesas = totalDespesas;
  
  // Calculate total patrocinios
  let totalPatrocinio = 0;
  data.patrocinios.forEach(p => {
    totalPatrocinio += parseFloat(p.valor) || 0;
  });
  data.total_patrocinio = totalPatrocinio;

  // Run Advanced calculations (installment values based on Simple/Compound interest)
  const advVal = parseFloat(data.advanced.adv.valor) || 0;
  const advTaxa = (parseFloat(data.advanced.taxa.valor) || 0) / 100;
  const advParcCount = parseInt(data.advanced.parcelas.valor) || 1;
  let installmentVal = 0;

  if (data.advanced.taxa.tipo_valor === 1) { // Simple interest
    const totalWithSimpleJuros = advVal + (advVal * advTaxa);
    installmentVal = totalWithSimpleJuros / advParcCount;
  } else { // Compound interest
    const totalWithCompJuros = advVal * Math.pow(1 + advTaxa, advParcCount);
    installmentVal = totalWithCompJuros / advParcCount;
  }
  data.advanced.valor.valor = parseFloat(installmentVal.toFixed(2));

  // Re-generate advanced installments list if needed
  if (!data.advanced.parcelas_list || data.advanced.parcelas_list.length !== advParcCount) {
    data.advanced.parcelas_list = [];
    const baseDate = new Date(data.advanced.data.valor || '2026-07-15');
    for (let i = 0; i < advParcCount; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(baseDate.getMonth() + i);
      data.advanced.parcelas_list.push({
        numero: i + 1,
        valor: installmentVal,
        valor_pago: i === 0 ? installmentVal : 0.00,
        status: i === 0 ? 1 : 0,
        data: dueDate.toLocaleDateString('pt-BR')
      });
    }
  } else {
    // Update installment values
    data.advanced.parcelas_list.forEach(p => {
      p.valor = installmentVal;
      if (p.status === 1) {
        p.valor_pago = installmentVal;
      }
    });
  }

  // Run Saque calculations
  const infoPercent = (parseFloat(data.infos.percent.valor) || 0) / 100;
  const withdrawable = (data.total_bruto - data.total_despesas - data.total_taxas) * infoPercent;
  data.infos.lib.valor = parseFloat(Math.max(0, withdrawable).toFixed(2));
}

function initializeNegotiationsData() {
  EVENTS_DATA.forEach(ev => {
    const brutoTotal = ev.revenue;
    const servicoTotal = ev.fees?.platform || 0;
    
    const dinero = { forma_pagamento: 'DINHEIRO', tipo: 0, taxa_pagamento: 0.00, pagamento_taxa_servico: 0, taxa_antecipacao: 0, taxa_parcelado: 0, pagamento_antecipado: 0, qtd_tickets: Math.round(ev.salesCount * 0.1), bruto: brutoTotal * 0.1, servico: servicoTotal * 0.1, taxas: 0.0, liquido: 0.0 };
    const pix = { forma_pagamento: 'PIX', tipo: 1, taxa_pagamento: 0.99, pagamento_taxa_servico: 1, taxa_antecipacao: 0, taxa_parcelado: 0, pagamento_antecipado: 0, qtd_tickets: Math.round(ev.salesCount * 0.4), bruto: brutoTotal * 0.4, servico: servicoTotal * 0.4, taxas: 0.0, liquido: 0.0 };
    const debito = { forma_pagamento: 'DÉBITO', tipo: 2, taxa_pagamento: 1.99, pagamento_taxa_servico: 1, taxa_antecipacao: 0, taxa_parcelado: 0, pagamento_antecipado: 0, qtd_tickets: Math.round(ev.salesCount * 0.2), bruto: brutoTotal * 0.2, servico: servicoTotal * 0.2, taxas: 0.0, liquido: 0.0 };
    const credito = { forma_pagamento: 'CRÉDITO AV.', tipo: 3, taxa_pagamento: 2.99, pagamento_taxa_servico: 1, taxa_antecipacao: 1.50, taxa_parcelado: 0, pagamento_antecipado: 1, qtd_tickets: Math.round(ev.salesCount * 0.15), bruto: brutoTotal * 0.15, servico: servicoTotal * 0.15, taxas: 0.0, liquido: 0.0 };
    const credito_2a6 = { forma_pagamento: 'PARCELADO 2x à 6x', tipo: 4, taxa_pagamento: 3.49, pagamento_taxa_servico: 1, taxa_antecipacao: 1.50, taxa_parcelado: 1.99, pagamento_antecipado: 1, qtd_tickets: Math.round(ev.salesCount * 0.1), bruto: brutoTotal * 0.1, servico: servicoTotal * 0.1, taxas: 0.0, liquido: 0.0 };
    const credito_7a12 = { forma_pagamento: 'PARCELADO 7x à 12x', tipo: 5, taxa_pagamento: 3.99, pagamento_taxa_servico: 1, taxa_antecipacao: 1.50, taxa_parcelado: 2.99, pagamento_antecipado: 1, qtd_tickets: Math.round(ev.salesCount * 0.05), bruto: brutoTotal * 0.05, servico: servicoTotal * 0.05, taxas: 0.0, liquido: 0.0 };
    const cortesia = { forma_pagamento: 'CORTESIA', tipo: 6, taxa_pagamento: 0.00, pagamento_taxa_servico: 0, taxa_antecipacao: 0, taxa_parcelado: 0, pagamento_antecipado: 0, qtd_tickets: Math.max(0, ev.salesCount - (dinero.qtd_tickets + pix.qtd_tickets + debito.qtd_tickets + credito.qtd_tickets + credito_2a6.qtd_tickets + credito_7a12.qtd_tickets)), bruto: 0.00, servico: 0.00, taxas: 0.0, liquido: 0.00 };
    
    const receitas = [dinero, pix, debito, credito, credito_2a6, credito_7a12, cortesia];
    
    const despesas = [
      { fornecedor: 'Equipe de Som & Luz', categoria: 'Som & Luz', data: '2026-07-20', status: 'Pendente', valor: ev.id === 3368 ? 2500.00 : 800.00 },
      { fornecedor: 'Staff e Segurança do Local', categoria: 'Segurança', data: '2026-07-18', status: 'Pago', valor: ev.id === 3368 ? 1200.00 : 500.00 },
      { fornecedor: 'Agência de Publicidade', categoria: 'Marketing', data: '2026-07-15', status: 'Pago', valor: ev.id === 3368 ? 800.00 : 300.00 }
    ];
    
    const patrocinios = [
      { marca: 'Cerveja Parceira', categoria: 'Master', status: 'Ativo', valor: ev.id === 3368 ? 15000.00 : 5000.00 },
      { marca: 'Refrigerante Oficial', categoria: 'Gold', status: 'Ativo', valor: ev.id === 3368 ? 8000.00 : 2000.00 }
    ];
    
    const advanced = {
      adv: { descricao: 'Há verbas de advanced', tipo: 0, tipo_valor: 2, valor: 10000.00, show: true },
      taxa: { descricao: 'Taxa de juros mensal do advanced', tipo: 1, tipo_valor: 1, valor: 1.50, show: true },
      percent: { descricao: 'Percentual de desconto advanced', tipo: 2, valor: 20.00, show: true },
      forma: { descricao: 'Forma de desconto', tipo: 3, tipo_valor: 6, show: true },
      parcelas: { descricao: 'Quantidade de Parcelas', tipo: 4, valor: 3, show: true },
      data: { descricao: 'Data das Parcelas', tipo: 5, valor: '2026-07-15', show: true },
      valor: { descricao: 'Valor das parcelas', tipo: 6, valor: 0.00, show: true },
      parcelas_list: []
    };
    
    const infos = {
      lib: { descricao: 'Liberado para saque', tipo: 0, tipo_valor: 2, valor: 0.00 },
      percent: { descricao: 'Percentual liberado para saque', tipo: 1, valor: 80.00 },
      max: { descricao: 'Valor máximo para saque', tipo: 2, valor: 50000.00 },
      tempo: { descricao: 'Tempo mínimo para saque (Dias antes do evento)', tipo: 3, valor: 3 },
      pix: { descricao: 'Descontar valor por pix', tipo: 4, tipo_valor: 3, valor: 0 },
      ted: { descricao: 'Descontar valor por ted', tipo: 5, tipo_valor: 3, valor: 0 }
    };
    
    window.NEGOCIACOES_DATA[ev.id] = {
      receitas,
      despesas,
      patrocinios,
      advanced,
      infos
    };
    
    calculateNegotiationTotals(ev.id);
  });
}

window.updateAdvancedValue = function(eventId, key, value) {
  const data = window.NEGOCIACOES_DATA[eventId];
  if (!data) return;
  data.advanced[key].valor = value;
  calculateNegotiationTotals(eventId);
  renderNegotiationsData(eventId);
};

window.updateAdvancedRadio = function(eventId, key, val) {
  const data = window.NEGOCIACOES_DATA[eventId];
  if (!data) return;
  data.advanced[key].tipo_valor = parseInt(val);
  calculateNegotiationTotals(eventId);
  renderNegotiationsData(eventId);
};

window.updateInfoValue = function(eventId, key, value) {
  const data = window.NEGOCIACOES_DATA[eventId];
  if (!data) return;
  data.infos[key].valor = value;
  calculateNegotiationTotals(eventId);
  renderNegotiationsData(eventId);
};

window.updateInfoRadio = function(eventId, key, val) {
  const data = window.NEGOCIACOES_DATA[eventId];
  if (!data) return;
  data.infos[key].tipo_valor = parseInt(val);
  calculateNegotiationTotals(eventId);
  renderNegotiationsData(eventId);
};

window.payAdvancedInstallment = function(eventId, index) {
  const data = window.NEGOCIACOES_DATA[eventId];
  if (!data || !data.advanced.parcelas_list[index]) return;
  const p = data.advanced.parcelas_list[index];
  p.status = 1;
  p.valor_pago = p.valor;
  alert(`Parcela Nº ${index + 1} de R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} marcada como PAGA!`);
  renderNegotiationsData(eventId);
};

function renderNegotiationsData(eventId) {
  if (!window.NEGOCIACOES_DATA[eventId]) {
    const ev = EVENTS_DATA.find(e => e.id == eventId) || { id: eventId, revenue: 0, salesCount: 0 };
    const brutoTotal = ev.revenue || 0;
    const servicoTotal = ev.fees?.platform || 0;
    
    const dinero = { forma_pagamento: 'DINHEIRO', tipo: 0, taxa_pagamento: 0.00, pagamento_taxa_servico: 0, taxa_antecipacao: 0, taxa_parcelado: 0, pagamento_antecipado: 0, qtd_tickets: Math.round(ev.salesCount * 0.1), bruto: brutoTotal * 0.1, servico: servicoTotal * 0.1, taxas: 0.0, liquido: 0.0 };
    const pix = { forma_pagamento: 'PIX', tipo: 1, taxa_pagamento: 0.99, pagamento_taxa_servico: 1, taxa_antecipacao: 0, taxa_parcelado: 0, pagamento_antecipado: 0, qtd_tickets: Math.round(ev.salesCount * 0.4), bruto: brutoTotal * 0.4, servico: servicoTotal * 0.4, taxas: 0.0, liquido: 0.0 };
    const debito = { forma_pagamento: 'DÉBITO', tipo: 2, taxa_pagamento: 1.99, pagamento_taxa_servico: 1, taxa_antecipacao: 0, taxa_parcelado: 0, pagamento_antecipado: 0, qtd_tickets: Math.round(ev.salesCount * 0.2), bruto: brutoTotal * 0.2, servico: servicoTotal * 0.2, taxas: 0.0, liquido: 0.0 };
    const credito = { forma_pagamento: 'CRÉDITO AV.', tipo: 3, taxa_pagamento: 2.99, pagamento_taxa_servico: 1, taxa_antecipacao: 1.50, taxa_parcelado: 0, pagamento_antecipado: 1, qtd_tickets: Math.round(ev.salesCount * 0.15), bruto: brutoTotal * 0.15, servico: servicoTotal * 0.15, taxas: 0.0, liquido: 0.0 };
    const credito_2a6 = { forma_pagamento: 'PARCELADO 2x à 6x', tipo: 4, taxa_pagamento: 3.49, pagamento_taxa_servico: 1, taxa_antecipacao: 1.50, taxa_parcelado: 1.99, pagamento_antecipado: 1, qtd_tickets: Math.round(ev.salesCount * 0.1), bruto: brutoTotal * 0.1, servico: servicoTotal * 0.1, taxas: 0.0, liquido: 0.0 };
    const credito_7a12 = { forma_pagamento: 'PARCELADO 7x à 12x', tipo: 5, taxa_pagamento: 3.99, pagamento_taxa_servico: 1, taxa_antecipacao: 1.50, taxa_parcelado: 2.99, pagamento_antecipado: 1, qtd_tickets: Math.round(ev.salesCount * 0.05), bruto: brutoTotal * 0.05, servico: servicoTotal * 0.05, taxas: 0.0, liquido: 0.0 };
    const cortesia = { forma_pagamento: 'CORTESIA', tipo: 6, taxa_pagamento: 0.00, pagamento_taxa_servico: 0, taxa_antecipacao: 0, taxa_parcelado: 0, pagamento_antecipado: 0, qtd_tickets: Math.max(0, ev.salesCount - (dinero.qtd_tickets + pix.qtd_tickets + debito.qtd_tickets + credito.qtd_tickets + credito_2a6.qtd_tickets + credito_7a12.qtd_tickets)), bruto: 0.00, servico: 0.00, taxas: 0.0, liquido: 0.00 };
    
    const receitas = [dinero, pix, debito, credito, credito_2a6, credito_7a12, cortesia];
    
    const despesas = [
      { fornecedor: 'Equipe de Som & Luz', categoria: 'Som & Luz', data: '2026-07-20', status: 'Pendente', valor: 800.00 },
      { fornecedor: 'Staff e Segurança do Local', categoria: 'Segurança', data: '2026-07-18', status: 'Pago', valor: 500.00 },
      { fornecedor: 'Agência de Publicidade', categoria: 'Marketing', data: '2026-07-15', status: 'Pago', valor: 300.00 }
    ];
    
    const patrocinios = [
      { marca: 'Cerveja Parceira', categoria: 'Master', status: 'Ativo', valor: 5000.00 },
      { marca: 'Refrigerante Oficial', categoria: 'Gold', status: 'Ativo', valor: 2000.00 }
    ];
    
    const advanced = {
      adv: { descricao: 'Há verbas de advanced', tipo: 0, tipo_valor: 2, valor: 10000.00, show: true },
      taxa: { descricao: 'Taxa de juros mensal do advanced', tipo: 1, tipo_valor: 1, valor: 1.50, show: true },
      percent: { descricao: 'Percentual de desconto advanced', tipo: 2, valor: 20.00, show: true },
      forma: { descricao: 'Forma de desconto', tipo: 3, tipo_valor: 6, show: true },
      parcelas: { descricao: 'Quantidade de Parcelas', tipo: 4, valor: 3, show: true },
      data: { descricao: 'Data das Parcelas', tipo: 5, valor: '2026-07-15', show: true },
      valor: { descricao: 'Valor das parcelas', tipo: 6, valor: 0.00, show: true },
      parcelas_list: []
    };
    
    const infos = {
      lib: { descricao: 'Liberado para saque', tipo: 0, tipo_valor: 2, valor: 0.00 },
      percent: { descricao: 'Percentual liberado para saque', tipo: 1, valor: 80.00 },
      max: { descricao: 'Valor máximo para saque', tipo: 2, valor: 50000.00 },
      tempo: { descricao: 'Tempo mínimo para saque (Dias antes do evento)', tipo: 3, valor: 3 },
      pix: { descricao: 'Descontar valor por pix', tipo: 4, tipo_valor: 3, valor: 0 },
      ted: { descricao: 'Descontar valor por ted', tipo: 5, tipo_valor: 3, valor: 0 }
    };
    
    window.NEGOCIACOES_DATA[eventId] = {
      receitas,
      despesas,
      patrocinios,
      advanced,
      infos
    };
    calculateNegotiationTotals(eventId);
  }
  
  const data = window.NEGOCIACOES_DATA[eventId];
  if (!data) return;
  
  // 1. Render Receitas Table
  const revTbody = document.getElementById('revenue-neg-table-body');
  if (revTbody) {
    revTbody.innerHTML = '';
    data.receitas.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-2 fw-semibold text-dark">${r.forma_pagamento}</td>
        <td class="py-2 text-center">
          <input type="number" step="0.01" class="form-control form-control-sm text-center mx-auto" value="${r.taxa_pagamento}" oninput="window.updateNegValue(${eventId}, 'receitas', ${idx}, 'taxa_pagamento', this.value)" style="width: 75px; height: 26px; padding: 2px;">
        </td>
        <td class="py-2 text-center">
          <div class="d-flex justify-content-center gap-2">
            <div class="form-check form-check-inline mb-0">
              <input class="form-check-input" type="radio" name="srv-fee-${idx}" id="srv-inc-${idx}" value="1" ${r.pagamento_taxa_servico === 1 ? 'checked' : ''} onchange="window.updateNegValue(${eventId}, 'receitas', ${idx}, 'pagamento_taxa_servico', 1)">
              <label class="form-check-label fs-xxs" for="srv-inc-${idx}">Inclusa</label>
            </div>
            <div class="form-check form-check-inline mb-0">
              <input class="form-check-input" type="radio" name="srv-fee-${idx}" id="srv-prod-${idx}" value="0" ${r.pagamento_taxa_servico === 0 ? 'checked' : ''} onchange="window.updateNegValue(${eventId}, 'receitas', ${idx}, 'pagamento_taxa_servico', 0)">
              <label class="form-check-label fs-xxs" for="srv-prod-${idx}">Produtor</label>
            </div>
          </div>
        </td>
        <td class="py-2 text-center">
          <input type="number" step="0.01" class="form-control form-control-sm text-center mx-auto" value="${r.taxa_antecipacao}" oninput="window.updateNegValue(${eventId}, 'receitas', ${idx}, 'taxa_antecipacao', this.value)" style="width: 75px; height: 26px; padding: 2px;">
        </td>
        <td class="py-2 text-center">
          <div class="d-flex justify-content-center gap-2">
            <div class="form-check form-check-inline mb-0">
              <input class="form-check-input" type="radio" name="ant-fee-${idx}" id="ant-inc-${idx}" value="1" ${r.pagamento_antecipado === 1 ? 'checked' : ''} onchange="window.updateNegValue(${eventId}, 'receitas', ${idx}, 'pagamento_antecipado', 1)">
              <label class="form-check-label fs-xxs" for="ant-inc-${idx}">Inclusa</label>
            </div>
            <div class="form-check form-check-inline mb-0">
              <input class="form-check-input" type="radio" name="ant-fee-${idx}" id="ant-prod-${idx}" value="0" ${r.pagamento_antecipado === 0 ? 'checked' : ''} onchange="window.updateNegValue(${eventId}, 'receitas', ${idx}, 'pagamento_antecipado', 0)">
              <label class="form-check-label fs-xxs" for="ant-prod-${idx}">Produtor</label>
            </div>
          </div>
        </td>
        <td class="py-2 text-center">
          <input type="number" step="0.01" class="form-control form-control-sm text-center mx-auto" value="${r.taxa_parcelado}" oninput="window.updateNegValue(${eventId}, 'receitas', ${idx}, 'taxa_parcelado', this.value)" style="width: 75px; height: 26px; padding: 2px;">
        </td>
        <td class="py-2 text-end fw-bold text-muted">R$ ${r.taxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="py-2 text-center">${r.qtd_tickets}</td>
        <td class="py-2 text-end">R$ ${r.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="py-2 text-end text-info">R$ ${r.servico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="py-2 text-end fw-bold text-success">R$ ${r.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      `;
      revTbody.appendChild(tr);
    });
    
    // Render Totals Row
    document.getElementById('rev-total-taxas-sum').innerHTML = `Taxas:<br>R$ ${data.total_taxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('rev-total-qtd-sum').innerHTML = `Qtd. Ingressos:<br>${data.total_ingressos}`;
    document.getElementById('rev-total-bruto-sum').innerHTML = `Bruto:<br>R$ ${data.total_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('rev-total-servico-sum').innerHTML = `Taxa Serviço:<br>R$ ${data.total_servico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('rev-total-liquido-sum').innerHTML = `Líquido:<br>R$ ${data.total_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
  
  // 2. Render Despesas (Expenses) Table
  const expTbody = document.getElementById('expenses-neg-table-body');
  if (expTbody) {
    expTbody.innerHTML = '';
    data.despesas.forEach((d, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-2 fw-semibold text-dark">${d.fornecedor}</td>
        <td class="py-2"><span class="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1">${d.categoria}</span></td>
        <td class="py-2 text-muted">${d.data}</td>
        <td class="py-2">
          <span class="badge ${d.status === 'Pago' ? 'bg-success' : 'bg-warning text-dark'} fw-bold px-2 py-1 fs-xxs">${d.status}</span>
        </td>
        <td class="py-2 text-end fw-bold">R$ ${d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="py-2 text-end">
          <button class="btn btn-outline-danger btn-sm p-1" onclick="window.removeNegExpense(${eventId}, ${idx})" style="line-height: 1;"><i class="ph-trash"></i></button>
        </td>
      `;
      expTbody.appendChild(tr);
    });
    document.getElementById('exp-total-val').textContent = `R$ ${data.total_despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
  
  // 3. Render Patrocinios Table
  const sponsTbody = document.getElementById('sponsors-neg-table-body');
  if (sponsTbody) {
    sponsTbody.innerHTML = '';
    data.patrocinios.forEach((p, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-2 fw-semibold text-dark">${p.marca}</td>
        <td class="py-2"><span class="badge bg-success bg-opacity-10 text-success px-2 py-1">${p.categoria}</span></td>
        <td class="py-2"><span class="badge bg-success text-white fw-bold px-2 py-1 fs-xxs">${p.status}</span></td>
        <td class="py-2 text-end fw-bold">R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="py-2 text-end">
          <button class="btn btn-outline-danger btn-sm p-1" onclick="window.removeNegSponsor(${eventId}, ${idx})" style="line-height: 1;"><i class="ph-trash"></i></button>
        </td>
      `;
      sponsTbody.appendChild(tr);
    });
    document.getElementById('spons-total-val').textContent = `R$ ${data.total_patrocinio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
  
  // 4. Render Yii-Style Advanced Parameters
  const advParamTbody = document.getElementById('neg-advanced-param-rows');
  if (advParamTbody) {
    advParamTbody.innerHTML = `
      <tr>
        <td class="fw-semibold text-dark">${data.advanced.adv.descricao}</td>
        <td class="text-center">
          <div class="d-flex justify-content-center gap-3">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="adv-verba" id="adv-verba-sim" value="2" ${data.advanced.adv.tipo_valor === 2 ? 'checked' : ''} onchange="window.updateAdvancedRadio(${eventId}, 'adv', 2)">
              <label class="form-check-label fs-xs fw-semibold" for="adv-verba-sim">Sim</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="adv-verba" id="adv-verba-nao" value="3" ${data.advanced.adv.tipo_valor === 3 ? 'checked' : ''} onchange="window.updateAdvancedRadio(${eventId}, 'adv', 3)">
              <label class="form-check-label fs-xs fw-semibold" for="adv-verba-nao">Não</label>
            </div>
          </div>
        </td>
        <td class="text-end">
          <input type="number" step="0.01" class="form-control form-control-sm text-end font-monospace ms-auto" value="${data.advanced.adv.valor}" ${data.advanced.adv.tipo_valor === 3 ? 'disabled' : ''} oninput="window.updateAdvancedValue(${eventId}, 'adv', this.value)" style="width: 130px;">
        </td>
      </tr>
      <tr>
        <td class="fw-semibold text-dark">${data.advanced.taxa.descricao}</td>
        <td class="text-center">
          <div class="d-flex justify-content-center gap-3">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="adv-taxa-tipo" id="adv-taxa-simples" value="1" ${data.advanced.taxa.tipo_valor === 1 ? 'checked' : ''} onchange="window.updateAdvancedRadio(${eventId}, 'taxa', 1)">
              <label class="form-check-label fs-xs fw-semibold" for="adv-taxa-simples">% Simples</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="adv-taxa-tipo" id="adv-taxa-composto" value="2" ${data.advanced.taxa.tipo_valor === 2 ? 'checked' : ''} onchange="window.updateAdvancedRadio(${eventId}, 'taxa', 2)">
              <label class="form-check-label fs-xs fw-semibold" for="adv-taxa-composto">% Composto</label>
            </div>
          </div>
        </td>
        <td class="text-end">
          <div class="input-group input-group-sm ms-auto" style="width: 100px;">
            <input type="number" step="0.01" class="form-control text-end font-monospace" value="${data.advanced.taxa.valor}" oninput="window.updateAdvancedValue(${eventId}, 'taxa', this.value)">
            <span class="input-group-text">%</span>
          </div>
        </td>
      </tr>
      <tr>
        <td class="fw-semibold text-dark">${data.advanced.percent.descricao}</td>
        <td class="text-center text-muted">—</td>
        <td class="text-end">
          <div class="input-group input-group-sm ms-auto" style="width: 100px;">
            <input type="number" step="0.01" class="form-control text-end font-monospace" value="${data.advanced.percent.valor}" oninput="window.updateAdvancedValue(${eventId}, 'percent', this.value)">
            <span class="input-group-text">%</span>
          </div>
        </td>
      </tr>
      <tr>
        <td class="fw-semibold text-dark">${data.advanced.forma.descricao}</td>
        <td class="text-center">
          <div class="d-flex justify-content-center gap-2">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="adv-forma" id="adv-forma-ini" value="4" ${data.advanced.forma.tipo_valor === 4 ? 'checked' : ''} onchange="window.updateAdvancedRadio(${eventId}, 'forma', 4)">
              <label class="form-check-label fs-xxs" for="adv-forma-ini">Inicio</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="adv-forma" id="adv-forma-fin" value="5" ${data.advanced.forma.tipo_valor === 5 ? 'checked' : ''} onchange="window.updateAdvancedRadio(${eventId}, 'forma', 5)">
              <label class="form-check-label fs-xxs" for="adv-forma-fin">Final</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="adv-forma" id="adv-forma-par" value="6" ${data.advanced.forma.tipo_valor === 6 ? 'checked' : ''} onchange="window.updateAdvancedRadio(${eventId}, 'forma', 6)">
              <label class="form-check-label fs-xxs" for="adv-forma-par">Parcelas</label>
            </div>
          </div>
        </td>
        <td class="text-end text-muted">—</td>
      </tr>
      <tr style="display: ${data.advanced.forma.tipo_valor === 6 ? 'table-row' : 'none'};">
        <td class="fw-semibold text-dark">${data.advanced.parcelas.descricao}</td>
        <td class="text-center text-muted">—</td>
        <td class="text-end">
          <input type="number" class="form-control form-control-sm text-end font-monospace ms-auto" value="${data.advanced.parcelas.valor}" oninput="window.updateAdvancedValue(${eventId}, 'parcelas', this.value)" style="width: 100px;">
        </td>
      </tr>
      <tr style="display: ${data.advanced.forma.tipo_valor === 6 ? 'table-row' : 'none'};">
        <td class="fw-semibold text-dark">${data.advanced.data.descricao}</td>
        <td class="text-center text-muted">—</td>
        <td class="text-end">
          <input type="date" class="form-control form-control-sm font-monospace ms-auto" value="${data.advanced.data.valor}" oninput="window.updateAdvancedValue(${eventId}, 'data', this.value)" style="width: 150px;">
        </td>
      </tr>
      <tr>
        <td class="fw-semibold text-dark">${data.advanced.valor.descricao}</td>
        <td class="text-center text-muted">—</td>
        <td class="text-end fw-bold text-success font-monospace">R$ ${data.advanced.valor.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;

    // Render installments list
    const instSection = document.getElementById('neg-advanced-installments-section');
    const instTbody = document.getElementById('neg-advanced-installments-rows');
    if (instSection && instTbody) {
      if (data.advanced.forma.tipo_valor === 6 && data.advanced.parcelas_list && data.advanced.parcelas_list.length > 0) {
        instSection.style.display = 'block';
        instTbody.innerHTML = '';
        data.advanced.parcelas_list.forEach((p, index) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="text-center fw-bold text-primary font-monospace">${p.numero}</td>
            <td class="text-center font-monospace text-dark">R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td class="text-center font-monospace text-muted">R$ ${p.valor_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td class="text-center">
              <span class="badge ${p.status === 1 ? 'bg-success' : 'bg-warning text-dark'} fw-bold px-2 py-1 fs-xxs">
                ${p.status === 1 ? 'PAGO' : 'AGUARDANDO'}
              </span>
            </td>
            <td class="text-center text-muted font-monospace">${p.data}</td>
            <td class="text-end">
              <button class="btn btn-xs btn-success fw-bold text-white" onclick="window.payAdvancedInstallment(${eventId}, ${index})" ${p.status === 1 ? 'disabled' : ''}>
                <i class="ph-check-circle me-1"></i> Pagar
              </button>
            </td>
          `;
          instTbody.appendChild(tr);
        });
      } else {
        instSection.style.display = 'none';
      }
    }
  }

  // Keep original negotiations sectors list
  const sectorsTbody = document.getElementById('negotiations-table-body');
  if (sectorsTbody) {
    sectorsTbody.innerHTML = `
      <tr>
        <td class="py-2">Pista Premium</td>
        <td class="py-2">Site / App</td>
        <td class="py-2 text-center text-purple fw-bold">15.0 %</td>
        <td class="py-2 text-center text-purple fw-bold">10.0 %</td>
        <td class="py-2 text-end">
          <button class="btn btn-outline-danger btn-sm p-1" onclick="alert('Regra padrão de conveniência do setor ativa!')" disabled><i class="ph-trash"></i></button>
        </td>
      </tr>
      <tr>
        <td class="py-2">Camarote Vip</td>
        <td class="py-2">PDV Físico</td>
        <td class="py-2 text-center text-purple fw-bold">10.0 %</td>
        <td class="py-2 text-center text-purple fw-bold">8.0 %</td>
        <td class="py-2 text-end">
          <button class="btn btn-outline-danger btn-sm p-1" onclick="alert('Regra padrão de conveniência do setor ativa!')" disabled><i class="ph-trash"></i></button>
        </td>
      </tr>
    `;
  }
  
  // 5. Render Informacoes Financeiras Tab (Saque parameters table)
  const infoParamTbody = document.getElementById('neg-info-param-rows');
  if (infoParamTbody) {
    infoParamTbody.innerHTML = `
      <tr>
        <td class="fw-semibold text-dark">${data.infos.lib.descricao}</td>
        <td class="text-center">
          <div class="d-flex justify-content-center gap-3">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="info-lib" id="info-lib-sim" value="2" ${data.infos.lib.tipo_valor === 2 ? 'checked' : ''} onchange="window.updateInfoRadio(${eventId}, 'lib', 2)">
              <label class="form-check-label fs-xs fw-semibold" for="info-lib-sim">Sim</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="info-lib" id="info-lib-nao" value="3" ${data.infos.lib.tipo_valor === 3 ? 'checked' : ''} onchange="window.updateInfoRadio(${eventId}, 'lib', 3)">
              <label class="form-check-label fs-xs fw-semibold" for="info-lib-nao">Não</label>
            </div>
          </div>
        </td>
        <td class="text-end fw-bold text-success font-monospace">R$ ${data.infos.lib.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td class="fw-semibold text-dark">${data.infos.percent.descricao}</td>
        <td class="text-center text-muted">—</td>
        <td class="text-end">
          <div class="input-group input-group-sm ms-auto" style="width: 100px;">
            <input type="number" step="0.01" class="form-control text-end font-monospace" value="${data.infos.percent.valor}" oninput="window.updateInfoValue(${eventId}, 'percent', this.value)">
            <span class="input-group-text">%</span>
          </div>
        </td>
      </tr>
      <tr>
        <td class="fw-semibold text-dark">${data.infos.max.descricao}</td>
        <td class="text-center text-muted">—</td>
        <td class="text-end">
          <input type="number" step="0.01" class="form-control form-control-sm text-end font-monospace ms-auto" value="${data.infos.max.valor}" oninput="window.updateInfoValue(${eventId}, 'max', this.value)" style="width: 120px;">
        </td>
      </tr>
      <tr>
        <td class="fw-semibold text-dark">${data.infos.tempo.descricao}</td>
        <td class="text-center text-muted">—</td>
        <td class="text-end">
          <input type="number" class="form-control form-control-sm text-end font-monospace ms-auto" value="${data.infos.tempo.valor}" oninput="window.updateInfoValue(${eventId}, 'tempo', this.value)" style="width: 100px;">
        </td>
      </tr>
      <tr>
        <td class="fw-semibold text-dark">${data.infos.pix.descricao}</td>
        <td class="text-center">
          <div class="d-flex justify-content-center gap-3">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="info-pix" id="info-pix-sim" value="2" ${data.infos.pix.tipo_valor === 2 ? 'checked' : ''} onchange="window.updateInfoRadio(${eventId}, 'pix', 2)">
              <label class="form-check-label fs-xs fw-semibold" for="info-pix-sim">Sim</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="info-pix" id="info-pix-nao" value="3" ${data.infos.pix.tipo_valor === 3 ? 'checked' : ''} onchange="window.updateInfoRadio(${eventId}, 'pix', 3)">
              <label class="form-check-label fs-xs fw-semibold" for="info-pix-nao">Não</label>
            </div>
          </div>
        </td>
        <td class="text-end text-muted">—</td>
      </tr>
      <tr>
        <td class="fw-semibold text-dark">${data.infos.ted.descricao}</td>
        <td class="text-center">
          <div class="d-flex justify-content-center gap-3">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="info-ted" id="info-ted-sim" value="2" ${data.infos.ted.tipo_valor === 2 ? 'checked' : ''} onchange="window.updateInfoRadio(${eventId}, 'ted', 2)">
              <label class="form-check-label fs-xs fw-semibold" for="info-ted-sim">Sim</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="info-ted" id="info-ted-nao" value="3" ${data.infos.ted.tipo_valor === 3 ? 'checked' : ''} onchange="window.updateInfoRadio(${eventId}, 'ted', 3)">
              <label class="form-check-label fs-xs fw-semibold" for="info-ted-nao">Não</label>
            </div>
          </div>
        </td>
        <td class="text-end text-muted">—</td>
      </tr>
    `;
  }
  
  // Render Informacoes Financeiras KPIs
  const infoBruto = document.getElementById('info-bruto-val');
  if (infoBruto) infoBruto.textContent = `R$ ${data.total_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  const infoPatrocinio = document.getElementById('info-patrocinio-val');
  if (infoPatrocinio) infoPatrocinio.textContent = `R$ ${data.total_patrocinio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  const infoDespesas = document.getElementById('info-despesas-val');
  if (infoDespesas) infoDespesas.textContent = `R$ ${data.total_despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  const infoTaxasOperadoras = document.getElementById('info-taxas-operadoras-val');
  if (infoTaxasOperadoras) infoTaxasOperadoras.textContent = `R$ ${data.total_taxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  const infoTaxaServico = document.getElementById('info-taxa-servico-val');
  if (infoTaxaServico) infoTaxaServico.textContent = `R$ ${data.total_servico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  const infoLiquido = document.getElementById('info-lucro-liquido-val');
  if (infoLiquido) {
    const finalNet = data.total_bruto + data.total_patrocinio - data.total_despesas - data.total_taxas - data.total_servico;
    infoLiquido.textContent = `R$ ${finalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }

  // Update DRE comparison
  const totalReceitas = data.total_bruto + data.total_patrocinio;
  const totalCustos = data.total_despesas + data.total_taxas + data.total_servico;
  const ratio = totalReceitas > 0 ? (totalCustos / totalReceitas) : 0;
  
  const dreRec = document.getElementById('dre-receitas-sum');
  if (dreRec) dreRec.textContent = `R$ ${totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  const dreCust = document.getElementById('dre-custos-sum');
  if (dreCust) dreCust.textContent = `R$ ${totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  const dreCustProg = document.getElementById('dre-custos-progress');
  if (dreCustProg) {
    const pct = Math.min(100, Math.round(ratio * 100));
    dreCustProg.style.width = `${pct}%`;
  }
}
window.renderNegotiationsData = renderNegotiationsData;

function initNegotiationsPage() {
  const eventNav = document.getElementById('event-sidebar-nav');
  const isEventManaged = eventNav && eventNav.style.display === 'block';
  
  if (isEventManaged && window.currentManagedEventId) {
    window.currentNegotiationEventId = window.currentManagedEventId;
  }

  // Fallback to first event if not set or invalid
  if (EVENTS_DATA.length > 0) {
    const exists = EVENTS_DATA.some(e => e.id == window.currentNegotiationEventId);
    if (!exists) {
      window.currentNegotiationEventId = EVENTS_DATA[0].id;
    }
  }

  const selectEl = document.getElementById('neg-event-select');
  if (selectEl) {
    selectEl.innerHTML = '';
    EVENTS_DATA.forEach(ev => {
      const option = document.createElement('option');
      option.value = ev.id;
      option.textContent = `ID.${ev.id} - ${ev.name}`;
      if (ev.id == window.currentNegotiationEventId) {
        option.selected = true;
      }
      selectEl.appendChild(option);
    });
  }
  
  if (Object.keys(window.NEGOCIACOES_DATA).length === 0) {
    initializeNegotiationsData();
  }
  
  window.selectNegotiationEvent(window.currentNegotiationEventId);
  window.switchNegotiationTab(null, 'receita');
}
window.initNegotiationsPage = initNegotiationsPage;

window.selectNegotiationEvent = function(eventId) {
  let ev = EVENTS_DATA.find(e => e.id == eventId);
  if (!ev && EVENTS_DATA.length > 0) {
    ev = EVENTS_DATA[0];
    eventId = ev.id;
  }
  if (!ev) return;
  window.currentNegotiationEventId = eventId;
  
  // Set date labels matching user screenshot exactly
  const startEl = document.getElementById('neg-sales-start-label');
  if (startEl) startEl.innerHTML = `<i class="ph-calendar-blank me-1"></i> Início das Vendas: <strong>01/07/2025 às 16h38</strong>`;
  
  const endEl = document.getElementById('neg-sales-end-label');
  if (endEl) endEl.innerHTML = `<i class="ph-calendar-x me-1"></i> Final das Vendas: <strong>${ev.date.split(' - ')[0]} às ${ev.date.split(' - ')[1] || '20h00'}</strong>`;
  
  const badgeEl = document.getElementById('neg-event-badge');
  if (badgeEl) {
    if (ev.status === 'ativos') {
      badgeEl.className = 'badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 px-3 py-2 fs-xxs fw-bold';
      badgeEl.innerHTML = '<i class="ph-check-circle me-1"></i> Evento Ativo';
    } else {
      badgeEl.className = 'badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20 px-3 py-2 fs-xxs fw-bold';
      badgeEl.innerHTML = 'Evento realizado há: 02 Dias 16h 29m 27s';
    }
  }

  // Toggle selection dropdown vs title banner based on layout mode
  const eventNav = document.getElementById('event-sidebar-nav');
  const isEventManaged = eventNav && eventNav.style.display === 'block';

  const selectContainer = document.getElementById('neg-select-container');
  const titleContainer = document.getElementById('neg-event-title-container');
  const titleText = document.getElementById('neg-event-title-text');

  if (isEventManaged && window.currentManagedEventId) {
    if (selectContainer) selectContainer.style.display = 'none';
    if (titleContainer) titleContainer.style.display = 'block';
    if (titleText) titleText.textContent = `ID.${ev.id} - ${ev.name}`;
  } else {
    if (selectContainer) selectContainer.style.display = 'block';
    if (titleContainer) titleContainer.style.display = 'none';
  }
  
  // Render tables
  renderNegotiationsData(eventId);
};

window.switchNegotiationTab = function(event, tabId) {
  if (event) event.preventDefault();
  
  document.querySelectorAll('.negotiation-tab-pane').forEach(pane => {
    pane.style.display = 'none';
  });
  
  const activePane = document.getElementById(`neg-tab-content-${tabId}`);
  if (activePane) {
    activePane.style.display = 'block';
  }
  
  const tabLinks = document.querySelectorAll('#view-financial-negotiations .nav-tabs .nav-link');
  tabLinks.forEach(link => {
    link.classList.remove('active', 'bg-white', 'shadow-sm');
    link.classList.add('text-muted');
  });
  
  const activeLink = event ? event.target : document.getElementById(`btn-neg-tab-${tabId}`);
  if (activeLink) {
    activeLink.classList.add('active', 'bg-white', 'shadow-sm');
    activeLink.classList.remove('text-muted');
  }
};

window.updateNegValue = function(eventId, category, index, field, value) {
  const data = window.NEGOCIACOES_DATA[eventId];
  if (!data) return;
  
  if (category === 'receitas') {
    data.receitas[index][field] = parseFloat(value) || 0;
  }
  
  calculateNegotiationTotals(eventId);
  renderNegotiationsData(eventId);
};

window.showAddExpenseInlineForm = function() {
  const container = document.getElementById('add-expense-inline-container');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
};

window.saveNewExpenseInline = function(event) {
  event.preventDefault();
  const eventId = window.currentNegotiationEventId;
  const data = window.NEGOCIACOES_DATA[eventId];
  if (!data) return;
  
  const supplier = document.getElementById('exp-supplier').value;
  const category = document.getElementById('exp-category').value;
  const value = parseFloat(document.getElementById('exp-value').value) || 0;
  const date = document.getElementById('exp-date').value;
  
  data.despesas.push({
    fornecedor: supplier,
    categoria: category,
    data: date,
    status: 'Pendente',
    valor: value
  });
  
  calculateNegotiationTotals(eventId);
  renderNegotiationsData(eventId);
  
  // Hide and reset form
  document.getElementById('add-expense-inline-container').style.display = 'none';
  document.getElementById('exp-supplier').value = '';
  document.getElementById('exp-value').value = '';
  document.getElementById('exp-date').value = '';
  
  alert('Despesa adicionada com sucesso!');
};

window.removeNegExpense = function(eventId, index) {
  const data = window.NEGOCIACOES_DATA[eventId];
  if (!data) return;
  
  if (confirm('Deseja realmente remover esta despesa?')) {
    data.despesas.splice(index, 1);
    calculateNegotiationTotals(eventId);
    renderNegotiationsData(eventId);
  }
};

window.showAddSponsorInlineForm = function() {
  const container = document.getElementById('add-sponsor-inline-container');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
};

window.saveNewSponsorInline = function(event) {
  event.preventDefault();
  const eventId = window.currentNegotiationEventId;
  const data = window.NEGOCIACOES_DATA[eventId];
  if (!data) return;
  
  const name = document.getElementById('spons-name').value;
  const tier = document.getElementById('spons-tier').value;
  const value = parseFloat(document.getElementById('spons-value').value) || 0;
  
  data.patrocinios.push({
    marca: name,
    categoria: tier,
    status: 'Ativo',
    valor: value
  });
  
  calculateNegotiationTotals(eventId);
  renderNegotiationsData(eventId);
  
  document.getElementById('add-sponsor-inline-container').style.display = 'none';
  document.getElementById('spons-name').value = '';
  document.getElementById('spons-value').value = '';
  
  alert('Patrocínio adicionado com sucesso!');
};

window.removeNegSponsor = function(eventId, index) {
  const data = window.NEGOCIACOES_DATA[eventId];
  if (!data) return;
  
  if (confirm('Deseja realmente remover este patrocínio?')) {
    data.patrocinios.splice(index, 1);
    calculateNegotiationTotals(eventId);
    renderNegotiationsData(eventId);
  }
};

window.saveRevenueNegotiation = function() {
  alert('Configurações de negociação gravadas com sucesso no banco de dados!');
};

// Initialize Negotiations Data on script load
if (typeof EVENTS_DATA !== 'undefined') {
  initializeNegotiationsData();
}


/* ==========================================================================
   DiskIngressos Custom Event Management & Grid Layout Features
   ========================================================================== */
window.currentEventsViewMode = 'grid';
window.currentEventsColumns = 4;
window.currentManagedEventId = 3368;
window.eventDashboardCharts = {};

window.setEventsViewMode = function(mode) {
  window.currentEventsViewMode = mode;
  
  const gridBtn = document.getElementById('btn-view-grid');
  const listBtn = document.getElementById('btn-view-list');
  const gridContainer = document.getElementById('events-grid-body');
  const listContainer = document.getElementById('events-list-table-container');
  
  if (mode === 'grid') {
    if (gridBtn) gridBtn.classList.add('active');
    if (listBtn) listBtn.classList.remove('active');
    if (gridContainer) gridContainer.style.setProperty('display', 'flex', 'important');
    if (listContainer) listContainer.style.setProperty('display', 'none', 'important');
  } else {
    if (gridBtn) gridBtn.classList.remove('active');
    if (gridBtn) gridBtn.classList.add('border');
    if (listBtn) listBtn.classList.add('active');
    if (gridContainer) gridContainer.style.setProperty('display', 'none', 'important');
    if (listContainer) listContainer.style.setProperty('display', 'block', 'important');
  }
};

window.setEventsColumns = function(cols) {
  window.currentEventsColumns = cols;
  
  document.querySelectorAll('.btn-col-select').forEach(btn => {
    const btnCols = btn.getAttribute('data-cols');
    if (btnCols == cols) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  const gridContainer = document.getElementById('events-grid-body');
  if (gridContainer) {
    gridContainer.classList.remove('row-cols-md-3', 'row-cols-md-4', 'row-cols-md-5');
    gridContainer.classList.add(`row-cols-md-${cols}`);
  }
};

function renderEventsList() {
  const gridContainer = document.getElementById('events-grid-body');
  if (!gridContainer) return;
  
  gridContainer.innerHTML = '';
  
  const filtered = EVENTS_DATA.filter(ev => {
    const matchesFilter = currentEventsFilter === 'todos' || ev.status === currentEventsFilter;
    const matchesSearch = ev.name.toLowerCase().includes(currentSearchQuery.toLowerCase()) || 
                          ev.location.toLowerCase().includes(currentSearchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  
  if (filtered.length === 0) {
    gridContainer.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        Nenhum evento localizado com os filtros aplicados.
      </div>
    `;
    return;
  }
  
  filtered.forEach(ev => {
    const coverImg = ev.coverImage || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800&auto=format&fit=crop';
    
    let statusClass = 'bg-success';
    let statusText = 'Ativo';
    if (ev.status !== 'ativos') {
      statusClass = 'bg-secondary';
      statusText = 'Inativo';
    }
    
    const cardCol = document.createElement('div');
    cardCol.className = 'col d-flex';
    cardCol.innerHTML = `
      <div class="card card-hover shadow-sm border-0 w-100 flex-column justify-content-between p-0 position-relative cursor-pointer event-card-element" onclick="window.manageEvent(${ev.id})" style="border-radius: 12px; overflow: hidden; background: #fff; transition: transform 0.2s, box-shadow 0.2s;">
        <div style="position: relative; height: 140px; overflow: hidden;">
          <img src="${coverImg}" style="width: 100%; height: 100%; object-fit: cover;" alt="&quot;${ev.name}&quot;">
          <span class="badge ${statusClass} fw-bold position-absolute" style="top: 10px; right: 10px; padding: 4px 8px; font-size: 10px; border-radius: 4px;">${statusText}</span>
        </div>
        <div class="card-body p-3 d-flex flex-column justify-content-between flex-grow-1">
          <div>
            <h6 class="fw-bold text-dark mb-1 text-truncate-2" style="font-size: 13.5px; line-height: 1.4; min-height: 38px;">${ev.name}</h6>
            <div class="d-flex align-items-center gap-1 text-muted fs-xxs mb-1">
              <i class="ph-map-pin"></i>
              <span class="text-truncate">${ev.location}</span>
            </div>
            <div class="d-flex align-items-center gap-1 text-muted fs-xxs mb-3">
              <i class="ph-calendar"></i>
              <span>${ev.date}</span>
            </div>
          </div>
          <div>
            <div class="border-top pt-2">
              <div class="d-flex justify-content-between fs-xxs text-muted mb-1">
                <span>Vendas: <strong>${ev.salesCount}</strong></span>
                <span class="fw-bold text-primary">R$ ${ev.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="progress" style="height: 6px; border-radius: 3px; background-color: #f1f5f9;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: ${ev.salesCount > 0 ? '70%' : '0%'}; border-radius: 3px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    gridContainer.appendChild(cardCol);
  });
}
window.renderEventsList = renderEventsList;

window.manageEvent = function(eventId) {
  window.currentManagedEventId = eventId;
  const ev = EVENTS_DATA.find(e => e.id == eventId);
  if (!ev) return;
  
  const headerEl = document.getElementById('managed-event-name-header');
  if (headerEl) {
    headerEl.textContent = ev.name;
  }
  
  const mainNav = document.getElementById('main-sidebar-nav');
  if (mainNav) mainNav.style.display = 'none';
  
  const eventNav = document.getElementById('event-sidebar-nav');
  if (eventNav) eventNav.style.display = 'block';
  
  initEventDashboard(eventId);
  switchActiveView('event-dashboard');
};

window.exitEventManagement = function() {
  const mainNav = document.getElementById('main-sidebar-nav');
  if (mainNav) mainNav.style.display = 'block';
  
  const eventNav = document.getElementById('event-sidebar-nav');
  if (eventNav) eventNav.style.display = 'none';
  
  switchActiveView('events-list');
};

function initEventDashboard(eventId) {
  const ev = EVENTS_DATA.find(e => e.id == eventId);
  if (!ev) return;
  
  const salesEl = document.getElementById('event-dashboard-sales');
  if (salesEl) salesEl.textContent = ev.salesCount.toLocaleString('pt-BR');
  
  const revEl = document.getElementById('event-dashboard-revenue');
  if (revEl) revEl.textContent = `R$ ${ev.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  const subtitleEl = document.getElementById('event-dashboard-subtitle');
  if (subtitleEl) subtitleEl.textContent = ev.name;
  
  const modContainer = document.getElementById('event-sales-modalities');
  if (modContainer) {
    modContainer.innerHTML = `
      <div>
        <div class="d-flex justify-content-between fs-xxs mb-1">
          <span>INTEIRA</span>
          <span class="fw-bold">R$ ${(ev.revenue * 0.6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="progress" style="height: 6px; border-radius: 3px;">
          <div class="progress-bar bg-primary" role="progressbar" style="width: 60%;"></div>
        </div>
      </div>
      <div>
        <div class="d-flex justify-content-between fs-xxs mb-1">
          <span>MEIA-ENTRADA</span>
          <span class="fw-bold">R$ ${(ev.revenue * 0.35).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="progress" style="height: 6px; border-radius: 3px;">
          <div class="progress-bar bg-success" role="progressbar" style="width: 35%;"></div>
        </div>
      </div>
      <div>
        <div class="d-flex justify-content-between fs-xxs mb-1">
          <span>PCD</span>
          <span class="fw-bold">R$ ${(ev.revenue * 0.05).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="progress" style="height: 6px; border-radius: 3px;">
          <div class="progress-bar bg-warning" role="progressbar" style="width: 5%;"></div>
        </div>
      </div>
    `;
  }
  
  const transTbody = document.getElementById('event-dashboard-recent-transactions');
  if (transTbody) {
    transTbody.innerHTML = `
      <tr>
        <td><strong>Vinicius Casagrande</strong></td>
        <td><span class="badge bg-light text-primary px-2">PIX</span></td>
        <td>14/07/2026 09:30</td>
        <td class="text-end fw-bold text-success">R$ 150,00</td>
      </tr>
      <tr>
        <td><strong>Ana Paula Mendes</strong></td>
        <td><span class="badge bg-light text-info px-2">Crédito</span></td>
        <td>13/07/2026 14:15</td>
        <td class="text-end fw-bold text-success">R$ 75,00</td>
      </tr>
      <tr>
        <td><strong>Felipe Ribeiro</strong></td>
        <td><span class="badge bg-light text-warning px-2">Boleto</span></td>
        <td>12/07/2026 11:00</td>
        <td class="text-end fw-bold text-success">R$ 250,00</td>
      </tr>
    `;
  }
  
  const salesCtx = document.getElementById('event-chart-sales-tempo');
  if (salesCtx) {
    if (window.eventDashboardCharts.sales) {
      window.eventDashboardCharts.sales.destroy();
    }
    
    window.eventDashboardCharts.sales = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: ['05/07', '06/07', '07/07', '08/07', '09/07', '10/07', '11/07'],
        datasets: [{
          label: 'Ingressos',
          data: [10, 25, 45, 90, 150, 280, ev.salesCount || 400],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
  
  const accessCtx = document.getElementById('event-chart-access-pie');
  if (accessCtx) {
    if (window.eventDashboardCharts.access) {
      window.eventDashboardCharts.access.destroy();
    }
    
    window.eventDashboardCharts.access = new Chart(accessCtx, {
      type: 'doughnut',
      data: {
        labels: ['Site', 'Bilheteria', 'Totem'],
        datasets: [{
          data: [80.7, 15.7, 3.6],
          backgroundColor: ['#3b82f6', '#2ecb71', '#f1c40f'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }
}
window.initEventDashboard = initEventDashboard;

/* ==========================================================================
   6. Reports Detail View & Dynamic Mocks Engine
   ========================================================================== */

// Store active chart reference to destroy it when switching
window.activeReportChart = null;

// Mock database for reports
const reportDefinitions = {
  'eventos-periodo': {
    title: 'Eventos por Período',
    desc: 'Lista os eventos por período com informações de status, nº de convidados, parcelas em aberto, quantidade de checklists e planejamentos.',
    icon: 'ph-calendar',
    type: 'table'
  },
  'pagamento-eventos': {
    title: 'Visão de Pagamento de Eventos',
    desc: 'Lista os eventos com valores contratados, valores pagos, a receber e valores ainda não lançados. Ideal para conferir quanto você tem a receber.',
    icon: 'ph-eye',
    type: 'table'
  },
  'receitas-despesas-eventos': {
    title: 'Receitas e Despesas de Eventos',
    desc: 'Lista os eventos com suas receitas e despesas de acordo com o filtro selecionado.',
    icon: 'ph-chart-line-up',
    type: 'chart'
  },
  'lucros-periodo': {
    title: 'Lucros por Período',
    desc: 'Liste os eventos de um determinado período com informações financeiras e margem líquida.',
    icon: 'ph-currency-dollar',
    type: 'chart'
  },
  'metas-evento': {
    title: 'Metas do Evento',
    desc: 'Relatórios das metas de vendas e orçamentos definidas nos eventos.',
    icon: 'ph-target',
    type: 'custom'
  },
  'custo-venda': {
    title: 'Custo de Venda',
    desc: 'Lista o custo de venda de um evento específico ou de todos.',
    icon: 'ph-tag',
    type: 'chart'
  },
  'fornecedor-eventos': {
    title: 'Por Fornecedor/Parceiro (Eventos)',
    desc: 'Lista as receitas e despesas separadas por fornecedor ou parceiro de um evento específico ou de todos.',
    icon: 'ph-handshake',
    type: 'table'
  },
  'pedidos-periodo': {
    title: 'Pedidos por Período',
    desc: 'Lista os pedidos de serviços e produtos por período, organizados por evento.',
    icon: 'ph-shopping-cart',
    type: 'table'
  },
  'comparativo-eventos': {
    title: 'Comparativos entre Eventos',
    desc: 'Compare dados financeiros, vendas e métricas entre eventos próprios e recorrentes.',
    icon: 'ph-scales',
    type: 'chart'
  },
  'eventos-local': {
    title: 'Eventos por Salão/Local',
    desc: 'Lista os eventos realizados em um salão ou local específico por período, com informações de status, nº de convidados e detalhes financeiros.',
    icon: 'ph-map-pin',
    type: 'table'
  },
  'relatorios-financeiros': {
    title: 'Relatórios Financeiros',
    desc: 'Vários modelos de relatórios baseados em sua necessidade. Inclui análise de faturamento de bilheteria e vendas físicas por PDV (POS).',
    icon: 'ph-file-text',
    type: 'custom' // Custom tabbed layout
  },
  'extrato-periodo': {
    title: 'Extrato por Período',
    desc: 'Lista em formato de extrato as receitas e despesas da empresa por período.',
    icon: 'ph-list-bullets',
    type: 'table'
  },
  'receitas-despesas-mensal': {
    title: 'Receitas e Despesas',
    desc: 'Exibe em formato de grade mês a mês os valores de lançamentos e despesas com valores lançados e previsão de entrada.',
    icon: 'ph-grid-nine',
    type: 'chart'
  },
  'por-categoria': {
    title: 'Por Categoria',
    desc: 'Lista em gráficos as receitas e despesas separadas por categoria.',
    icon: 'ph-chart-pie',
    type: 'chart'
  },
  'por-categoria-eventos': {
    title: 'Por Categoria (Eventos)',
    desc: 'Lista em gráficos as receitas e despesas separadas por categoria de um evento específico ou de todos.',
    icon: 'ph-chart-pie-slice',
    type: 'table'
  },
  'por-cliente-eventos': {
    title: 'Por Cliente (Eventos)',
    desc: 'Lista as receitas e despesas separadas por cliente de um evento específico ou de todos.',
    icon: 'ph-user',
    type: 'table'
  },
  'fornecedor-todas-categorias': {
    title: 'Por Fornecedores/Parceiros (Todas Categorias)',
    desc: 'Exibe todas as receitas/despesas associadas a um fornecedor.',
    icon: 'ph-handshake',
    type: 'table'
  },
  'por-casting-equipe': {
    title: 'Por Casting/Equipe',
    desc: 'Exibe todas as receitas/despesas associadas a uma pessoa da equipe.',
    icon: 'ph-users-three',
    type: 'table'
  },
  'historico-cobrancas': {
    title: 'Histórico de Cobranças',
    desc: 'Lista todas as cobranças pela data de criação ou última alteração, exibe também o usuário responsável.',
    icon: 'ph-clock-counter-clockwise',
    type: 'table'
  },
  'lancamentos-eventos-usuario': {
    title: 'Lançamentos por Eventos/Usuário',
    desc: 'Lista todas as receitas/despesas dos eventos em que o usuário selecionado é o responsável.',
    icon: 'ph-user-list',
    type: 'table'
  },
  'por-centro-custo': {
    title: 'Por Centro de Custo',
    desc: 'Exibe todas as receitas/despesas associadas a um centro de custo.',
    icon: 'ph-folder-open',
    type: 'table'
  }
};

window.openReportDetail = function(reportKey) {
  window.activeReportKey = reportKey;
  
  const grid = document.getElementById('reports-grid-view');
  const detail = document.getElementById('report-detail-view');
  if (grid) grid.style.display = 'none';
  if (detail) detail.style.display = 'block';

  const report = reportDefinitions[reportKey];
  if (report) {
    document.getElementById('report-detail-title').innerText = report.title;
    document.getElementById('report-detail-desc').innerText = report.desc;
    
    const iconEl = document.getElementById('report-detail-icon');
    iconEl.className = '';
    iconEl.classList.add(...report.icon.split(' '));
    
    // Set standard class color on icon wrapper
    const wrapper = document.getElementById('report-title-icon-container');
    if (reportKey.includes('eventos') || ['metas-evento', 'pedidos-periodo', 'comparativo-eventos'].includes(reportKey)) {
      wrapper.className = 'p-2 bg-light rounded me-3 text-primary';
    } else {
      wrapper.className = 'p-2 bg-light rounded me-3 text-success';
    }
  }
  
  window.refreshReportDetail();
};

window.closeReportDetail = function() {
  if (window.activeReportChart) {
    window.activeReportChart.destroy();
    window.activeReportChart = null;
  }
  
  const grid = document.getElementById('reports-grid-view');
  const detail = document.getElementById('report-detail-view');
  if (grid) grid.style.display = 'block';
  if (detail) detail.style.display = 'none';
};

window.refreshReportDetail = function() {
  const key = window.activeReportKey;
  const container = document.getElementById('report-detail-body');
  if (!container || !key) return;

  // Clean old charts
  if (window.activeReportChart) {
    window.activeReportChart.destroy();
    window.activeReportChart = null;
  }
  
  container.innerHTML = '';

  const report = reportDefinitions[key];
  if (!report) return;

  // Helper functions to generate elements
  function makeStats(cards) {
    let html = `<div class="row g-3 mb-4">`;
    cards.forEach(c => {
      html += `
        <div class="col-md-4 col-sm-6">
          <div class="card card-body shadow-sm border p-3" style="border-radius: 6px; background-color: #fafbfc;">
            <span class="text-uppercase text-muted fw-bold d-block mb-1" style="font-size: 10px; letter-spacing: 0.5px;">${c.title}</span>
            <h4 class="fw-bold mb-0 ${c.colorClass || 'text-dark'}">${c.value}</h4>
            ${c.sub ? `<span class="text-muted mt-1 d-block" style="font-size: 11px;">${c.sub}</span>` : ''}
          </div>
        </div>
      `;
    });
    html += `</div>`;
    return html;
  }

  function makeTable(headers, rows) {
    let html = `<div class="table-responsive border rounded bg-white shadow-sm mb-3">`;
    html += `<table class="table table-hover table-striped mb-0 align-middle" style="font-size: 13px;">`;
    html += `<thead class="table-light border-bottom"><tr>`;
    headers.forEach(h => {
      html += `<th class="fw-bold text-dark py-2.5 px-3">${h}</th>`;
    });
    html += `</tr></thead><tbody>`;
    rows.forEach(r => {
      html += `<tr class="border-bottom">`;
      r.forEach((val, idx) => {
        // Highlight first column (often primary object) or money columns
        let style = '';
        if (idx === 0) style = 'font-weight: 600; color: #1e293b;';
        if (typeof val === 'string' && val.includes('R$')) style += ' font-family: monospace;';
        html += `<td class="py-2.5 px-3" style="${style}">${val}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
  }

  // Generate layouts based on Key
  if (key === 'eventos-periodo') {
    container.innerHTML = makeStats([
      { title: 'Total de Eventos', value: '8', sub: 'No período selecionado' },
      { title: 'Eventos Realizados', value: '4', sub: 'Com relatório finalizado', colorClass: 'text-success' },
      { title: 'Confirmados / Rascunhos', value: '4', sub: 'Próximos agendamentos', colorClass: 'text-primary' }
    ]);
    
    container.innerHTML += makeTable(
      ['Evento', 'Data / Período', 'Local', 'Convidados', 'Checklists', 'Status'],
      [
        ['Festival de Inverno 2026', '12/07/2026', 'Pedreira Paulo Leminski', '15.000', '45/45 (100%)', '<span class="badge bg-success py-1 px-2 text-white">Realizado</span>'],
        ['Teatro Guaíra - Orquestra', '18/07/2026', 'Teatro Guaíra', '2.100', '28/32 (87%)', '<span class="badge bg-primary py-1 px-2 text-white">Confirmado</span>'],
        ['Show de Rock Curitiba', '25/07/2026', 'Live Curitiba', '5.000', '12/40 (30%)', '<span class="badge bg-primary py-1 px-2 text-white">Confirmado</span>'],
        ['Baile de Gala Anual', '05/08/2026', 'Clube Curitibano', '800', '5/25 (20%)', '<span class="badge bg-warning py-1 px-2 text-dark">Planejando</span>'],
        ['Workshop Startup 2026', '10/08/2026', 'Expo Unimed', '450', '0/15 (0%)', '<span class="badge bg-secondary py-1 px-2 text-white">Rascunho</span>']
      ]
    );
  }
  else if (key === 'pagamento-eventos') {
    container.innerHTML = makeStats([
      { title: 'Total Contratado', value: 'R$ 1.770.000,00', sub: 'Faturamento contratual' },
      { title: 'Total Pago / Emitido', value: 'R$ 1.290.000,00', sub: 'Já baixado no financeiro', colorClass: 'text-success' },
      { title: 'Saldo a Receber', value: 'R$ 480.000,00', sub: 'Cobranças em aberto', colorClass: 'text-warning' }
    ]);
    
    container.innerHTML += makeTable(
      ['Evento', 'Valor Contratado', 'Valor Pago', 'Saldo devedor', 'Situação'],
      [
        ['Festival de Inverno 2026', 'R$ 1.200.000,00', 'R$ 900.000,00', 'R$ 300.000,00', '<span class="badge bg-warning py-1 px-2 text-dark">Parcial</span>'],
        ['Teatro Guaíra - Orquestra', 'R$ 250.000,00', 'R$ 250.000,00', 'R$ 0,00', '<span class="badge bg-success py-1 px-2 text-white">Quitado</span>'],
        ['Show de Rock Curitiba', 'R$ 320.000,00', 'R$ 140.000,00', 'R$ 180.000,00', '<span class="badge bg-warning py-1 px-2 text-dark">Parcial</span>'],
        ['Baile de Gala Anual', 'R$ 70.000,00', 'R$ 0,00', 'R$ 70.000,00', '<span class="badge bg-danger py-1 px-2 text-white">Aguardando</span>']
      ]
    );
  }
  else if (key === 'receitas-despesas-eventos') {
    container.innerHTML = makeStats([
      { title: 'Receita Total Eventos', value: 'R$ 1.520.000,00' },
      { title: 'Despesa Total Eventos', value: 'R$ 680.000,00', colorClass: 'text-danger' },
      { title: 'Resultado Operacional', value: 'R$ 840.000,00', colorClass: 'text-success' }
    ]);
    
    // Add canvas for chart
    container.innerHTML += `
      <div class="card p-3 border mb-3 shadow-sm bg-white" style="border-radius: 6px;">
        <h6 class="fw-bold text-dark mb-3"><i class="ph-chart-bar text-primary me-2"></i> Comparativo por Evento</h6>
        <div style="height: 260px; position: relative;">
          <canvas id="report-detail-chart-canvas"></canvas>
        </div>
      </div>
    `;

    setTimeout(() => {
      const ctx = document.getElementById('report-detail-chart-canvas');
      if (ctx) {
        window.activeReportChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Festival Inverno', 'Teatro Guaíra', 'Show Rock', 'Baile Gala'],
            datasets: [
              { label: 'Receitas', data: [1200000, 250000, 320000, 0], backgroundColor: '#3b82f6', borderRadius: 4 },
              { label: 'Despesas', data: [520000, 95000, 150000, 15000], backgroundColor: '#ef4444', borderRadius: 4 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    }, 50);
  }
  else if (key === 'lucros-periodo') {
    container.innerHTML = makeStats([
      { title: 'Faturamento Bruto', value: 'R$ 1.840.000,00' },
      { title: 'Custos Operacionais', value: 'R$ 920.000,00', colorClass: 'text-danger' },
      { title: 'Lucro Líquido', value: 'R$ 920.000,00', colorClass: 'text-success' }
    ]);
    
    container.innerHTML += `
      <div class="card p-3 border mb-3 shadow-sm bg-white" style="border-radius: 6px;">
        <h6 class="fw-bold text-dark mb-3"><i class="ph-chart-line text-success me-2"></i> Evolução da Margem de Lucro (%)</h6>
        <div style="height: 250px; position: relative;">
          <canvas id="report-detail-chart-canvas"></canvas>
        </div>
      </div>
    `;

    setTimeout(() => {
      const ctx = document.getElementById('report-detail-chart-canvas');
      if (ctx) {
        window.activeReportChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
            datasets: [{
              label: 'Margem Líquida %',
              data: [35, 42, 40, 48, 52, 50, 50],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              tension: 0.25,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 100 } }
          }
        });
      }
    }, 50);
  }
  else if (key === 'metas-evento') {
    container.innerHTML = makeStats([
      { title: 'Metas Ativas', value: '6' },
      { title: 'Metas Atingidas', value: '4', colorClass: 'text-success' },
      { title: 'Progresso Médio', value: '82%', colorClass: 'text-primary' }
    ]);

    container.innerHTML += `
      <div class="card p-4 border shadow-sm bg-white" style="border-radius: 6px;">
        <h6 class="fw-bold text-dark mb-4"><i class="ph-target text-danger me-2"></i> Progresso das Metas Comerciais e Orçamentárias</h6>
        
        <div class="mb-4">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="fw-semibold text-dark fs-xs">Venda de Ingressos (Festival de Inverno)</span>
            <span class="fs-xs text-muted">15.000 / 15.000 (100%)</span>
          </div>
          <div class="progress" style="height: 10px; border-radius: 4px;">
            <div class="progress-bar bg-success" style="width: 100%;"></div>
          </div>
        </div>

        <div class="mb-4">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="fw-semibold text-dark fs-xs">Patrocínio Teatro Guaíra (Captação)</span>
            <span class="fs-xs text-muted">R$ 45.000,00 / R$ 50.000,00 (90%)</span>
          </div>
          <div class="progress" style="height: 10px; border-radius: 4px;">
            <div class="progress-bar bg-primary" style="width: 90%;"></div>
          </div>
        </div>

        <div class="mb-4">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="fw-semibold text-dark fs-xs">Meta de Venda Show de Rock (Ingressos)</span>
            <span class="fs-xs text-muted">3.800 / 5.000 (76%)</span>
          </div>
          <div class="progress" style="height: 10px; border-radius: 4px;">
            <div class="progress-bar bg-info" style="width: 76%;"></div>
          </div>
        </div>

        <div class="mb-2">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="fw-semibold text-dark fs-xs">Budget de Custo Operacional (Festival)</span>
            <span class="fs-xs text-muted">R$ 520.000,00 / R$ 600.000,00 (86% utilizado)</span>
          </div>
          <div class="progress" style="height: 10px; border-radius: 4px;">
            <div class="progress-bar bg-warning" style="width: 86%;"></div>
          </div>
        </div>
      </div>
    `;
  }
  else if (key === 'custo-venda') {
    container.innerHTML = makeStats([
      { title: 'Taxa Gateway Média', value: '2.05% MDR', sub: 'Stone + Cielo failover' },
      { title: 'Total Comissões Pagas', value: 'R$ 84.600,00', colorClass: 'text-danger' },
      { title: 'Custo por Bilhete Emitido', value: 'R$ 4,12', sub: 'Média ponderada' }
    ]);

    container.innerHTML += `
      <div class="card p-3 border mb-3 shadow-sm bg-white" style="border-radius: 6px;">
        <h6 class="fw-bold text-dark mb-3"><i class="ph-chart-pie text-warning me-2"></i> Distribuição dos Custos Comerciais</h6>
        <div style="height: 250px; position: relative;">
          <canvas id="report-detail-chart-canvas"></canvas>
        </div>
      </div>
    `;

    setTimeout(() => {
      const ctx = document.getElementById('report-detail-chart-canvas');
      if (ctx) {
        window.activeReportChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Taxa Gateway (Adquirentes)', 'Comissão de Divulgação', 'Taxa de Conveniência (Ticketeira)', 'Taxa Administrativa'],
            datasets: [{
              data: [45.8, 30.2, 18.0, 6.0],
              backgroundColor: ['#f1c40f', '#3897f0', '#2ecb71', '#e74c3c'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    }, 50);
  }
  else if (key === 'relatorios-financeiros') {
    // Custom tabbed view for financial reports including PDV/POS
    container.innerHTML = `
      <div class="card-header border-0 p-0 mb-4 bg-transparent">
        <ul class="nav nav-tabs nav-tabs-bottom border-bottom-2 border-secondary" id="rep-fin-tabs" style="margin-bottom: 0;">
          <li class="nav-item">
            <a href="#" class="nav-link active fw-bold text-dark" id="rep-fin-tab-general" onclick="window.switchRepFinTab('general')">
              <i class="ph-trend-up me-1"></i> Resumo Financeiro Geral
            </a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link fw-bold text-dark" id="rep-fin-tab-pdv" onclick="window.switchRepFinTab('pdv')">
              <i class="ph-shopping-cart me-1"></i> Vendas por PDV (Físico/POS)
            </a>
          </li>
        </ul>
      </div>
      <div id="rep-fin-content-general"></div>
      <div id="rep-fin-content-pdv" style="display: none;"></div>
    `;

    // Render both contents immediately
    window.renderFinancialGeneralSubReport();
    window.renderFinancialPDVSubReport();
  }
  else if (key === 'extrato-periodo') {
    container.innerHTML = makeStats([
      { title: 'Saldo Anterior', value: 'R$ 420.000,00' },
      { title: 'Total Entradas (+)', value: 'R$ 380.000,00', colorClass: 'text-success' },
      { title: 'Total Saídas (-)', value: 'R$ 120.000,00', colorClass: 'text-danger' }
    ]);

    container.innerHTML += makeTable(
      ['Data', 'Descrição / Documento', 'Categoria', 'Tipo', 'Valor', 'Saldo Final'],
      [
        ['12/07/2026', 'Receita Ingressos - Festival', 'Bilheteria', '<span class="text-success fw-bold">ENTRADA</span>', 'R$ 120.000,00', 'R$ 680.000,00'],
        ['10/07/2026', 'Pagamento Equipe de Segurança', 'Segurança', '<span class="text-danger fw-bold">SAÍDA</span>', '- R$ 15.000,00', 'R$ 560.000,00'],
        ['08/07/2026', 'Patrocínio Coca-Cola', 'Patrocínio', '<span class="text-success fw-bold">ENTRADA</span>', 'R$ 50.000,00', 'R$ 575.000,00'],
        ['06/07/2026', 'Aluguel Som e Iluminação', 'Estrutura', '<span class="text-danger fw-bold">SAÍDA</span>', '- R$ 25.000,00', 'R$ 525.000,00'],
        ['05/07/2026', 'Repasse Bilheteria Orquestra', 'Repasses', '<span class="text-danger fw-bold">SAÍDA</span>', '- R$ 80.000,00', 'R$ 550.000,00']
      ]
    );
  }
  else if (key === 'por-categoria') {
    container.innerHTML = makeStats([
      { title: 'Maior Despesa', value: 'Catering / Buffet', sub: '35% das despesas totais' },
      { title: 'Maior Receita', value: 'Ingressos / Bilheteria', sub: '78% das receitas totais', colorClass: 'text-success' }
    ]);

    container.innerHTML += `
      <div class="card p-3 border mb-3 shadow-sm bg-white" style="border-radius: 6px;">
        <h6 class="fw-bold text-dark mb-3"><i class="ph-chart-pie text-success me-2"></i> Despesas Totais por Categoria</h6>
        <div style="height: 250px; position: relative;">
          <canvas id="report-detail-chart-canvas"></canvas>
        </div>
      </div>
    `;

    setTimeout(() => {
      const ctx = document.getElementById('report-detail-chart-canvas');
      if (ctx) {
        window.activeReportChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Aluguel de Local', 'Catering / Buffet', 'Staff & Segurança', 'Som & Iluminação', 'Marketing & Tráfego'],
            datasets: [{
              data: [25, 35, 15, 15, 10],
              backgroundColor: ['#2563eb', '#10b981', '#f1c40f', '#e74c3c', '#9333ea'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    }, 50);
  }
  else if (key === 'por-casting-equipe') {
    container.innerHTML = makeStats([
      { title: 'Integrantes na Equipe', value: '18', sub: 'Casting & Staff' },
      { title: 'Total Pago no Período', value: 'R$ 94.200,00', colorClass: 'text-success' },
      { title: 'Média por Integrante', value: 'R$ 5.233,33' }
    ]);

    container.innerHTML += makeTable(
      ['Nome do Integrante', 'Função / Cargo', 'Eventos Trabalhados', 'Total Pago', 'Status Financeiro'],
      [
        ['Vinícius Casagrande', 'Coordenador Geral', '4 eventos', 'R$ 24.000,00', '<span class="badge bg-success py-1 px-2 text-white">Pago</span>'],
        ['Amanda Souza', 'Supervisor de Casting', '3 eventos', 'R$ 15.000,00', '<span class="badge bg-success py-1 px-2 text-white">Pago</span>'],
        ['Carlos Eduardo', 'Técnico de Som', '3 eventos', 'R$ 12.000,00', '<span class="badge bg-warning py-1 px-2 text-dark">Pendente</span>'],
        ['Mariana Pires', 'Recepcionista VIP', '4 eventos', 'R$ 8.200,00', '<span class="badge bg-success py-1 px-2 text-white">Pago</span>'],
        ['Julio Cesar', 'Staff Apoio', '2 eventos', 'R$ 5.000,00', '<span class="badge bg-success py-1 px-2 text-white">Pago</span>']
      ]
    );
  }
  // Generic fallback rendering for remaining reports to ensure they work beautifully
  else {
    container.innerHTML = makeStats([
      { title: 'Registros Encontrados', value: '124', sub: 'Filtrados com sucesso' },
      { title: 'Valor Consolidado', value: 'R$ 412.500,00', colorClass: 'text-success' },
      { title: 'Status do Relatório', value: 'Consolidado', colorClass: 'text-primary' }
    ]);

    container.innerHTML += `
      <div class="row g-3">
        <div class="col-md-7">
          ${makeTable(
            ['Código / ID', 'Referência', 'Data Registro', 'Valor', 'Status'],
            [
              ['REP-1029', 'Lançamento Geral ' + report.title, '12/07/2026', 'R$ 15.000,00', '<span class="badge bg-success py-1 px-2 text-white">Confirmado</span>'],
              ['REP-1028', 'Movimentação ' + report.title, '10/07/2026', 'R$ 8.450,00', '<span class="badge bg-success py-1 px-2 text-white">Confirmado</span>'],
              ['REP-1027', 'Ajuste Operacional ' + report.title, '09/07/2026', 'R$ -2.100,00', '<span class="badge bg-danger py-1 px-2 text-white">Estornado</span>'],
              ['REP-1026', 'Faturamento Vinculado', '08/07/2026', 'R$ 45.000,00', '<span class="badge bg-success py-1 px-2 text-white">Confirmado</span>'],
              ['REP-1025', 'Verificação Periódica', '05/07/2026', 'R$ 1.800,00', '<span class="badge bg-primary py-1 px-2 text-white">Aberto</span>']
            ]
          )}
        </div>
        <div class="col-md-5">
          <div class="card p-3 border shadow-sm bg-white" style="border-radius: 6px; height: 100%;">
            <h6 class="fw-bold text-dark mb-3"><i class="ph-presentation text-purple me-2"></i> Gráfico de Distribuição</h6>
            <div style="height: 200px; position: relative;">
              <canvas id="report-detail-chart-canvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const ctx = document.getElementById('report-detail-chart-canvas');
      if (ctx) {
        window.activeReportChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
            datasets: [{
              label: 'Volumetria',
              data: [12, 19, 3, 5, 2],
              backgroundColor: '#8b5cf6',
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }
        });
      }
    }, 50);
  }
};

window.switchRepFinTab = function(tabName) {
  const generalTab = document.getElementById('rep-fin-tab-general');
  const pdvTab = document.getElementById('rep-fin-tab-pdv');
  const generalContent = document.getElementById('rep-fin-content-general');
  const pdvContent = document.getElementById('rep-fin-content-pdv');

  if (tabName === 'general') {
    if (generalTab) generalTab.classList.add('active');
    if (pdvTab) pdvTab.classList.remove('active');
    if (generalContent) generalContent.style.display = 'block';
    if (pdvContent) pdvContent.style.display = 'none';
  } else {
    if (generalTab) generalTab.classList.remove('active');
    if (pdvTab) pdvTab.classList.add('active');
    if (generalContent) generalContent.style.display = 'none';
    if (pdvContent) pdvContent.style.display = 'block';
  }
};

window.renderFinancialGeneralSubReport = function() {
  const container = document.getElementById('rep-fin-content-general');
  if (!container) return;

  let html = `
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card card-body border shadow-sm p-3" style="background-color: #fafbfc; border-radius: 6px;">
          <span class="text-uppercase text-muted fw-bold d-block mb-1" style="font-size: 10px;">Faturamento Total</span>
          <h4 class="fw-bold mb-0 text-success">R$ 1.984.500,00</h4>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card card-body border shadow-sm p-3" style="background-color: #fafbfc; border-radius: 6px;">
          <span class="text-uppercase text-muted fw-bold d-block mb-1" style="font-size: 10px;">Impostos & Taxas</span>
          <h4 class="fw-bold mb-0 text-danger">R$ 112.400,00</h4>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card card-body border shadow-sm p-3" style="background-color: #fafbfc; border-radius: 6px;">
          <span class="text-uppercase text-muted fw-bold d-block mb-1" style="font-size: 10px;">Ticket Médio</span>
          <h4 class="fw-bold mb-0 text-dark">R$ 195,50</h4>
        </div>
      </div>
    </div>

    <div class="table-responsive border rounded bg-white shadow-sm mb-3">
      <table class="table table-hover table-striped mb-0" style="font-size: 13px;">
        <thead class="table-light">
          <tr>
            <th class="fw-bold py-2 px-3">Modelo de Relatório</th>
            <th class="fw-bold py-2 px-3">Descrição Simplificada</th>
            <th class="fw-bold py-2 px-3 text-end">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-bottom">
            <td class="py-2.5 px-3 fw-bold">DRE Consolidado (Competência)</td>
            <td class="py-2.5 px-3 text-muted">Demonstração do Resultado de Exercício completo mês a mês.</td>
            <td class="py-2.5 px-3 text-end"><button class="btn btn-xs btn-orange text-white fw-bold py-0.5 px-2" onclick="alert('Exportando PDF...')">PDF</button></td>
          </tr>
          <tr class="border-bottom">
            <td class="py-2.5 px-3 fw-bold">Balancete de Verificação</td>
            <td class="py-2.5 px-3 text-muted">Demonstração das contas ativas, passivas e patrimônio líquido.</td>
            <td class="py-2.5 px-3 text-end"><button class="btn btn-xs btn-orange text-white fw-bold py-0.5 px-2" onclick="alert('Exportando PDF...')">PDF</button></td>
          </tr>
          <tr class="border-bottom">
            <td class="py-2.5 px-3 fw-bold">Fluxo de Caixa Acumulado</td>
            <td class="py-2.5 px-3 text-muted">Acompanhamento diário de disponibilidades financeiras.</td>
            <td class="py-2.5 px-3 text-end"><button class="btn btn-xs btn-orange text-white fw-bold py-0.5 px-2" onclick="alert('Exportando PDF...')">PDF</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  container.innerHTML = html;
};

// PDV (POS) Report - User Request
window.renderFinancialPDVSubReport = function() {
  const container = document.getElementById('rep-fin-content-pdv');
  if (!container) return;

  let html = `
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card card-body border shadow-sm p-3" style="background-color: #fafbfc; border-radius: 6px;">
          <span class="text-uppercase text-muted fw-bold d-block mb-1" style="font-size: 10px;">Faturamento Físico (PDV)</span>
          <h4 class="fw-bold mb-0 text-success">R$ 142.600,00</h4>
          <span class="text-muted d-block mt-1" style="font-size: 11px;">Dinheiro, cartões e PIX</span>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card card-body border shadow-sm p-3" style="background-color: #fafbfc; border-radius: 6px;">
          <span class="text-uppercase text-muted fw-bold d-block mb-1" style="font-size: 10px;">Ingressos Emitidos</span>
          <h4 class="fw-bold mb-0 text-primary">951 <span class="fs-xs fw-normal text-muted">bilhetes</span></h4>
          <span class="text-muted d-block mt-1" style="font-size: 11px;">Emissão nos pontos físicos</span>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card card-body border shadow-sm p-3" style="background-color: #fafbfc; border-radius: 6px;">
          <span class="text-uppercase text-muted fw-bold d-block mb-1" style="font-size: 10px;">Pontos de Venda Ativos</span>
          <h4 class="fw-bold mb-0 text-dark">3 <span class="fs-xs fw-normal text-muted">terminais</span></h4>
          <span class="text-muted d-block mt-1" style="font-size: 11px;">Shopping, Bilheteria e Totem</span>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <!-- Doughnut Chart for PDV locations -->
      <div class="col-lg-5 mb-3">
        <div class="card p-3 border shadow-sm bg-white" style="border-radius: 6px; height: 100%;">
          <h6 class="fw-bold text-dark mb-3"><i class="ph-chart-pie text-success me-2"></i> Faturamento por Ponto de Venda</h6>
          <div style="height: 220px; position: relative;">
            <canvas id="pdv-sales-chart-canvas"></canvas>
          </div>
        </div>
      </div>

      <!-- Transactions table -->
      <div class="col-lg-7 mb-3">
        <div class="card p-3 border shadow-sm bg-white" style="border-radius: 6px; height: 100%;">
          <h6 class="fw-bold text-dark mb-3"><i class="ph-list-bullets text-primary me-2"></i> Últimas Emissões Físicas</h6>
          <div class="table-responsive" style="max-height: 220px; overflow-y: auto;">
            <table class="table table-hover mb-0" style="font-size: 12px;">
              <thead class="table-light sticky-top">
                <tr>
                  <th class="py-2 fw-bold text-dark">Data / Hora</th>
                  <th class="py-2 fw-bold text-dark">PDV / Terminal</th>
                  <th class="py-2 fw-bold text-dark">Forma Pagto</th>
                  <th class="py-2 fw-bold text-dark text-end">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-bottom">
                  <td class="py-2 text-muted">14/07 14:45</td>
                  <td class="py-2 fw-semibold">PDV - Shopping</td>
                  <td class="py-2"><span class="badge bg-light text-dark">Cartão Débito</span></td>
                  <td class="py-2 text-end font-monospace">R$ 150,00</td>
                </tr>
                <tr class="border-bottom">
                  <td class="py-2 text-muted">14/07 14:12</td>
                  <td class="py-2 fw-semibold">Bilheteria Teatro</td>
                  <td class="py-2"><span class="badge bg-success-100 text-success">PIX</span></td>
                  <td class="py-2 text-end font-monospace">R$ 300,00</td>
                </tr>
                <tr class="border-bottom">
                  <td class="py-2 text-muted">14/07 13:50</td>
                  <td class="py-2 fw-semibold">PDV - Shopping</td>
                  <td class="py-2"><span class="badge bg-light text-dark">Cartão Crédito</span></td>
                  <td class="py-2 text-end font-monospace">R$ 450,00</td>
                </tr>
                <tr class="border-bottom">
                  <td class="py-2 text-muted">14/07 13:10</td>
                  <td class="py-2 fw-semibold">Totem Autoatendimento</td>
                  <td class="py-2"><span class="badge bg-light text-dark">Cartão Crédito</span></td>
                  <td class="py-2 text-end font-monospace">R$ 150,00</td>
                </tr>
                <tr class="border-bottom">
                  <td class="py-2 text-muted">14/07 12:30</td>
                  <td class="py-2 fw-semibold">Bilheteria Teatro</td>
                  <td class="py-2"><span class="badge bg-warning-100 text-warning">Dinheiro</span></td>
                  <td class="py-2 text-end font-monospace">R$ 90,00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;

  // Initialize Doughnut Chart for PDV
  setTimeout(() => {
    const ctx = document.getElementById('pdv-sales-chart-canvas');
    if (ctx) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['PDV - Shopping (58%)', 'Bilheteria Teatro (28%)', 'Totem Autoatendimento (14%)'],
          datasets: [{
            data: [82700, 39900, 20000],
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, font: { size: 11 } }
            }
          }
        }
      });
    }
  }, 100);
};

// ==========================================================================
// 6. Ticketera & Hub Financeiro Sub-modules Implementation
// ==========================================================================

// --- 6.1 PDV MODULE ---
let PDVS_DATA = [
  { id: 1, name: "Shopping Mueller", operators: 8, salesCount: 846, revenue: 46520.00, ticket: 54.99, status: "🟢", pix: 15420.00, credit: 22840.00, debit: 5880.00, cash: 2380.00, cancel: 420.00, refund: 0.00, caixas: 4, time: "01:42" },
  { id: 2, name: "Teatro Positivo", operators: 6, salesCount: 612, revenue: 38740.00, ticket: 63.30, status: "🟢", pix: 13180.00, credit: 18960.00, debit: 4860.00, cash: 1740.00, cancel: 280.00, refund: 0.00, caixas: 3, time: "01:18" },
  { id: 3, name: "Teatro Guaíra", operators: 7, salesCount: 735, revenue: 42380.00, ticket: 57.66, status: "🟢", pix: 14900.00, credit: 19460.00, debit: 5620.00, cash: 2400.00, cancel: 0.00, refund: 180.00, caixas: 4, time: "01:30" },
  { id: 4, name: "Teatro Fernanda Montenegro", operators: 5, salesCount: 418, revenue: 24960.00, ticket: 59.71, status: "🟢", pix: 8520.00, credit: 12640.00, debit: 2140.00, cash: 1660.00, cancel: 0.00, refund: 0.00, caixas: 2, time: "01:25" },
  { id: 5, name: "Família Pavê", operators: 4, salesCount: 322, revenue: 18950.00, ticket: 58.85, status: "🟢", pix: 6340.00, credit: 9120.00, debit: 2130.00, cash: 1360.00, cancel: 0.00, refund: 0.00, caixas: 2, time: "01:20" },
  { id: 6, name: "Venda Online", operators: 0, salesCount: 493, revenue: 13300.00, ticket: 26.98, status: "🟢", pix: 5920.00, credit: 6520.00, debit: 860.00, cash: 0.00, cancel: 1120.00, refund: 500.00, caixas: 0, time: "00:05" }
];

let CAIXAS_DATA = [
  { id: "CX-001", pdv: "Shopping Mueller", operator: "Ana Paula", status: "🟢", sales: 214, value: 11820.00 },
  { id: "CX-002", pdv: "Shopping Mueller", operator: "João Carlos", status: "🟢", sales: 206, value: 10940.00 },
  { id: "CX-003", pdv: "Teatro Positivo", operator: "Carlos Henrique", status: "🟢", sales: 184, value: 12450.00 },
  { id: "CX-004", pdv: "Teatro Guaíra", operator: "Juliana Costa", status: "🟢", sales: 228, value: 13920.00 },
  { id: "CX-005", pdv: "Teatro Fernanda Montenegro", operator: "Ricardo Souza", status: "🟢", sales: 151, value: 8920.00 },
  { id: "CX-006", pdv: "Família Pavê", operator: "Fernanda Lima", status: "🟢", sales: 136, value: 8140.00 }
];

let PAYMETHODS_DATA = [
  { method: "💳 Crédito", count: 1654, value: 86540.00, share: "46,82%" },
  { method: "📱 PIX", count: 1182, value: 64280.00, share: "34,78%" },
  { method: "💳 Débito", count: 428, value: 22630.00, share: "12,24%" },
  { method: "💵 Dinheiro", count: 162, value: 11400.00, share: "6,16%" }
];

window.pdvPaymethodsChart = null;

window.initPDVFinanceiroModule = function() {
  renderPDVExecutiveTable();
  renderPDVCaixasTable();
  renderPDVConciliationTable();
  renderPDVPaymethodsTable();
  renderPDVPaymethodsChart();
  updatePDVTotalIndicators();
};

function renderPDVExecutiveTable() {
  const tbody = document.getElementById('pdv-executive-rows');
  if (!tbody) return;
  tbody.innerHTML = '';
  PDVS_DATA.forEach(pdv => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => window.viewPDVDetail(pdv.name);
    tr.innerHTML = `
      <td class="fw-bold text-dark"><i class="ph-storefront me-1 text-muted"></i> ${pdv.name}</td>
      <td class="text-center fw-semibold">${pdv.operators > 0 ? pdv.operators : '—'}</td>
      <td class="text-center font-monospace">${pdv.salesCount}</td>
      <td class="text-end fw-bold text-success font-monospace">R$ ${pdv.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td class="text-end text-muted font-monospace">R$ ${pdv.ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td class="text-center fs-xxs">${pdv.status}</td>
      <td class="text-center">
        <button class="btn btn-xs btn-outline-primary py-0 px-2 fw-semibold" onclick="event.stopPropagation(); window.viewPDVDetail('${pdv.name}')">Detalhes</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPDVCaixasTable() {
  const tbody = document.getElementById('pdv-caixas-rows');
  if (!tbody) return;
  tbody.innerHTML = '';
  CAIXAS_DATA.forEach(cx => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-bold text-primary font-monospace">${cx.id}</td>
      <td>${cx.pdv}</td>
      <td>${cx.operator}</td>
      <td class="text-center fs-xxs">${cx.status}</td>
      <td class="text-center font-monospace">${cx.sales}</td>
      <td class="text-end fw-bold font-monospace text-dark">R$ ${cx.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td class="text-center">
        <button class="btn btn-xs btn-outline-warning py-0 px-1" onclick="window.sangriaPDVCaixa('${cx.id}')">Sangria</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPDVConciliationTable() {
  const tbody = document.getElementById('pdv-conciliation-rows');
  if (!tbody) return;
  tbody.innerHTML = '';
  PDVS_DATA.forEach(pdv => {
    if (pdv.name === "Venda Online") return; // Keep only physical matching the model
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-semibold text-dark">${pdv.name}</td>
      <td class="text-end font-monospace">R$ ${pdv.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td class="text-end font-monospace">R$ ${pdv.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td class="text-end font-monospace text-success">R$ 0,00</td>
      <td class="text-center text-success"><i class="ph-check-circle-fill"></i></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPDVPaymethodsTable() {
  const tbody = document.getElementById('pdv-paymethods-rows');
  if (!tbody) return;
  tbody.innerHTML = '';
  PAYMETHODS_DATA.forEach(pm => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-semibold text-dark">${pm.method}</td>
      <td class="text-center font-monospace">${pm.count}</td>
      <td class="text-end font-monospace text-dark fw-bold">R$ ${pm.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td class="text-end font-monospace text-primary fw-semibold">${pm.share}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPDVPaymethodsChart() {
  const ctxEl = document.getElementById('c-pdv-paymethods-chart');
  if (!ctxEl) return;
  const ctx = ctxEl.getContext('2d');
  if (!ctx) return;
  
  if (window.pdvPaymethodsChart) {
    window.pdvPaymethodsChart.destroy();
  }
  
  window.pdvPaymethodsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Crédito', 'PIX', 'Débito', 'Dinheiro'],
      datasets: [{
        data: [86540.00, 64280.00, 22630.00, 11400.00],
        backgroundColor: ['#3b82f6', '#f59e0b', '#06b6d4', '#10b981'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 10, font: { size: 9 } }
        }
      }
    }
  });
}

window.viewPDVDetail = function(pdvName) {
  const pdv = PDVS_DATA.find(p => p.name === pdvName);
  if (!pdv) return;
  
  const title = document.getElementById('pdv-detail-title');
  const revenue = document.getElementById('pdv-detail-revenue');
  const sold = document.getElementById('pdv-detail-sold');
  const pix = document.getElementById('pdv-detail-pix');
  const credit = document.getElementById('pdv-detail-credit');
  const debit = document.getElementById('pdv-detail-debit');
  const cash = document.getElementById('pdv-detail-cash');
  const cancel = document.getElementById('pdv-detail-cancel');
  const refund = document.getElementById('pdv-detail-refund');
  const estornoRow = document.getElementById('pdv-detail-estorno-row');
  const caixas = document.getElementById('pdv-detail-caixas');
  const time = document.getElementById('pdv-detail-time');
  
  if (title) title.textContent = pdv.name;
  if (revenue) revenue.textContent = `R$ ${pdv.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (sold) sold.textContent = pdv.salesCount;
  if (pix) pix.textContent = `R$ ${pdv.pix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (credit) credit.textContent = `R$ ${pdv.credit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (debit) debit.textContent = `R$ ${pdv.debit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (cash) cash.textContent = `R$ ${pdv.cash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (cancel) cancel.textContent = `R$ ${pdv.cancel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (refund) refund.textContent = `R$ ${pdv.refund.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (caixas) caixas.textContent = pdv.caixas > 0 ? pdv.caixas : '—';
  if (time) time.textContent = pdv.time;
  
  if (estornoRow) {
    estornoRow.style.display = pdv.refund > 0 ? 'flex' : 'none';
  }
};

window.sangriaPDVCaixa = function(cxId) {
  const cx = CAIXAS_DATA.find(c => c.id === cxId);
  if (!cx) return;
  const amountStr = prompt(`Informe o valor da sangria para o Caixa "${cx.id}" (${cx.operator}):`, "1000.00");
  if (amountStr === null) return;
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0 || amount > cx.value) {
    alert("Valor inválido! Insira um valor maior que zero e menor ou igual ao acumulado em caixa.");
    return;
  }
  
  cx.value -= amount;
  
  // Find associated PDV and decrease cash
  const pdv = PDVS_DATA.find(p => p.name === cx.pdv);
  if (pdv) {
    pdv.cash = Math.max(0, pdv.cash - amount);
    pdv.revenue -= amount;
  }
  
  alert(`Sangria de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} efetuada no Caixa ${cx.id}!`);
  initPDVFinanceiroModule();
};

window.simulatePDVSale = function() {
  // Choose random PDV
  const activePdvs = PDVS_DATA.filter(p => p.name !== "Venda Online");
  const pdv = activePdvs[Math.floor(Math.random() * activePdvs.length)];
  
  // Choose payment method
  const methods = ['Crédito', 'PIX', 'Débito', 'Dinheiro'];
  const method = methods[Math.floor(Math.random() * methods.length)];
  
  const ticketVal = parseFloat((Math.random() * 50 + 30).toFixed(2));
  
  // Update PDV dataset
  pdv.salesCount += 1;
  pdv.revenue += ticketVal;
  pdv.ticket = parseFloat((pdv.revenue / pdv.salesCount).toFixed(2));
  
  if (method === 'Crédito') {
    pdv.credit += ticketVal;
    PAYMETHODS_DATA[0].count += 1;
    PAYMETHODS_DATA[0].value += ticketVal;
  } else if (method === 'PIX') {
    pdv.pix += ticketVal;
    PAYMETHODS_DATA[1].count += 1;
    PAYMETHODS_DATA[1].value += ticketVal;
  } else if (method === 'Débito') {
    pdv.debit += ticketVal;
    PAYMETHODS_DATA[2].count += 1;
    PAYMETHODS_DATA[2].value += ticketVal;
  } else {
    pdv.cash += ticketVal;
    PAYMETHODS_DATA[3].count += 1;
    PAYMETHODS_DATA[3].value += ticketVal;
  }
  
  // Update a random Caixa of that PDV
  const caixas = CAIXAS_DATA.filter(c => c.pdv === pdv.name);
  if (caixas.length > 0) {
    const cx = caixas[Math.floor(Math.random() * caixas.length)];
    cx.sales += 1;
    cx.value += ticketVal;
  }
  
  // Log message
  const logEl = document.getElementById('pdv-simulation-log');
  if (logEl) {
    logEl.innerHTML = `<span class="text-success"><i class="ph-circle-fill fs-xxs"></i> [Simulação]</span> Venda de R$ ${ticketVal.toFixed(2)} no PDV "${pdv.name}" via ${method}.`;
  }
  
  // Re-run indicators & renders
  initPDVFinanceiroModule();
  window.viewPDVDetail(pdv.name);

  // Flash row to indicate update
  setTimeout(() => {
    const rows = document.querySelectorAll('#pdv-executive-rows tr');
    rows.forEach(r => {
      if (r.cells[0] && r.cells[0].textContent.includes(pdv.name)) {
        r.classList.add('flash-update');
        setTimeout(() => {
          r.classList.remove('flash-update');
        }, 800);
      }
    });
  }, 50);
};

function updatePDVTotalIndicators() {
  let totalRevenue = 0;
  let totalSold = 0;
  let totalPix = 0;
  let totalCards = 0;
  let totalCash = 0;
  let totalCancel = 0;
  let totalRefund = 0;
  
  PDVS_DATA.forEach(p => {
    totalRevenue += p.revenue;
    totalSold += p.salesCount;
    totalPix += p.pix;
    totalCards += (p.credit + p.debit);
    totalCash += p.cash;
    totalCancel += p.cancel;
    totalRefund += p.refund;
  });
  
  const revenueEl = document.getElementById('pdv-kpi-revenue');
  const soldEl = document.getElementById('pdv-kpi-sold');
  const ticketEl = document.getElementById('pdv-kpi-ticket');
  const pixEl = document.getElementById('pdv-kpi-pix');
  const cardsEl = document.getElementById('pdv-kpi-cards');
  const cashEl = document.getElementById('pdv-kpi-cash');
  const cancelEl = document.getElementById('pdv-kpi-cancel');
  const refundsEl = document.getElementById('pdv-kpi-refunds');
  
  if (revenueEl) revenueEl.textContent = `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (soldEl) soldEl.textContent = totalSold.toLocaleString('pt-BR');
  if (ticketEl) ticketEl.textContent = `R$ ${(totalRevenue / totalSold).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (pixEl) pixEl.textContent = `R$ ${totalPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (cardsEl) cardsEl.textContent = `R$ ${totalCards.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (cashEl) cashEl.textContent = `R$ ${totalCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (cancelEl) cancelEl.textContent = `R$ ${totalCancel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (refundsEl) refundsEl.textContent = `R$ ${totalRefund.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  // Re-calculate paymethod percentages
  const grandTotalPay = PAYMETHODS_DATA.reduce((sum, item) => sum + item.value, 0);
  PAYMETHODS_DATA.forEach(item => {
    item.share = `${((item.value / grandTotalPay) * 100).toFixed(2)}%`.replace('.', ',');
  });
}

// Keep backwards-compatibility for existing references
window.addNewPDV = function() {
  openModal('add-new-pdv-modal');
};

window.saveNewCompletePDV = function(e) {
  if (e) e.preventDefault();
  
  const name = document.getElementById('add-pdv-name').value;
  const ops = parseInt(document.getElementById('add-pdv-ops').value) || 1;
  const caixasCount = parseInt(document.getElementById('add-pdv-caixas').value) || 1;
  const operator = document.getElementById('add-pdv-operator-name').value;
  const status = document.getElementById('add-pdv-status').value;
  const time = document.getElementById('add-pdv-time').value;
  
  const pix = parseFloat(document.getElementById('add-pdv-pix').value) || 0;
  const credit = parseFloat(document.getElementById('add-pdv-credit').value) || 0;
  const debit = parseFloat(document.getElementById('add-pdv-debit').value) || 0;
  const cash = parseFloat(document.getElementById('add-pdv-cash').value) || 0;
  
  const totalRev = pix + credit + debit + cash;
  
  // Calculate a simulated average salesCount based on ticket
  const simulatedSales = Math.max(1, Math.round(totalRev / 54.00)) || 0;
  const ticket = simulatedSales > 0 ? parseFloat((totalRev / simulatedSales).toFixed(2)) : 0.00;
  
  // 1. Add to PDVS_DATA
  PDVS_DATA.push({
    id: Date.now(),
    name: name,
    operators: ops,
    salesCount: simulatedSales,
    revenue: totalRev,
    ticket: ticket,
    status: status,
    pix: pix,
    credit: credit,
    debit: debit,
    cash: cash,
    cancel: 0.00,
    refund: 0.00,
    caixas: caixasCount,
    time: time
  });
  
  // 2. Add to CAIXAS_DATA
  CAIXAS_DATA.push({
    id: `CX-${Math.floor(Math.random() * 900 + 100)}`,
    pdv: name,
    operator: operator,
    status: status,
    sales: simulatedSales,
    value: totalRev
  });
  
  // 3. Accumulate to global PAYMETHODS_DATA
  PAYMETHODS_DATA[0].count += Math.round(simulatedSales * 0.45);
  PAYMETHODS_DATA[0].value += credit;
  
  PAYMETHODS_DATA[1].count += Math.round(simulatedSales * 0.35);
  PAYMETHODS_DATA[1].value += pix;
  
  PAYMETHODS_DATA[2].count += Math.round(simulatedSales * 0.15);
  PAYMETHODS_DATA[2].value += debit;
  
  PAYMETHODS_DATA[3].count += Math.round(simulatedSales * 0.05);
  PAYMETHODS_DATA[3].value += cash;
  
  // Reset Form & UI
  alert(`PDV Completo "${name}" cadastrado com sucesso!`);
  closeModal('add-new-pdv-modal');
  document.getElementById('modal-add-new-pdv-form').reset();
  
  // Refresh UI
  initPDVFinanceiroModule();
  window.viewPDVDetail(name);
};

// --- 6.2 REFUNDS / CDC MODULE ---
let REFUNDS_LOG = [
  { txId: "TX-99001", client: "Amanda Cruz", method: "PIX", value: 120.00, date: "14/07/2026 12:45" },
  { txId: "TX-99002", client: "Bruno Senna", method: "Estorno Gateway (Crédito)", value: 380.00, date: "14/07/2026 11:30" }
];

function renderRefundsLog() {
  const tbody = document.getElementById('refund-log-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  REFUNDS_LOG.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-bold text-dark font-monospace">${log.txId}</td>
      <td>${log.client}</td>
      <td><span class="badge bg-light text-dark">${log.method}</span></td>
      <td class="font-monospace text-danger fw-bold">- R$ ${log.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td class="text-muted fs-xxs">${log.date}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.searchRefundTransaction = function() {
  const searchId = document.getElementById('refund-search-id').value.trim();
  if (searchId === 'TX-98765') {
    document.getElementById('refund-client-name').textContent = "Vinicius de Souza";
    document.getElementById('refund-event-name').textContent = "Show L7NNON & Xamã";
    document.getElementById('refund-value-amount').textContent = "R$ 250,00";
    
    document.getElementById('refund-result-panel').style.display = 'block';
    document.getElementById('refund-no-result').style.display = 'none';
  } else {
    alert("Transação não encontrada! Digite a transação de teste TX-98765.");
  }
};

window.executeRefund = function() {
  const type = document.getElementById('refund-type-select').value;
  const methodText = type === 'gateway' ? "Estorno Gateway (CDC)" : "Voucher DiskIngressos";
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  REFUNDS_LOG.unshift({
    txId: "TX-98765",
    client: "Vinicius de Souza",
    method: methodText,
    value: 250.00,
    date: dateStr
  });
  
  renderRefundsLog();
  alert(`Reembolso de R$ 250,00 efetuado com sucesso via ${methodText}!`);
  
  document.getElementById('refund-result-panel').style.display = 'none';
  document.getElementById('refund-no-result').style.display = 'block';
  document.getElementById('refund-search-id').value = '';
};

// --- 6.3 METHODS OF PAYMENT ---
window.savePaymentMethods = function(e) {
  if (e) e.preventDefault();
  const pixMdr = document.getElementById('pm-pix-mdr').value;
  const ccMdr = document.getElementById('pm-cc-mdr').value;
  const boletoFee = document.getElementById('pm-boleto-fee').value;
  alert(`Métodos de Pagamento Atualizados!\n- PIX MDR: ${pixMdr}%\n- Crédito MDR: ${ccMdr}%\n- Tarifa Fixa Boleto: R$ ${boletoFee}`);
};

// --- 6.4 CUSTOM PAYMENTS MODULE ---
let CUSTOM_PAY_RULES = [
  { id: 1, name: "Acordo Especial Produtor - L7NNON", type: "MDR Reduzido", event: "Show L7NNON & Xamã", rate: "1.5% fixo", status: "Ativo" },
  { id: 2, name: "Cortesias Patrocinador Heineken", type: "Taxa Zero", event: "Festival Rock & Art", rate: "0.00% (Sem Taxa)", status: "Ativo" },
  { id: 3, name: "Permuta Rádio Jovem Pan", type: "Ingresso Promocional", event: "Show Deive Leonardo", rate: "Isento", status: "Ativo" }
];

function renderCustomPayRules() {
  const tbody = document.getElementById('custompay-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  CUSTOM_PAY_RULES.forEach(rule => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-bold text-dark">${rule.name}</td>
      <td><span class="badge bg-light text-dark">${rule.type}</span></td>
      <td>${rule.event}</td>
      <td class="fw-bold text-primary">${rule.rate}</td>
      <td><span class="badge bg-success">${rule.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

window.addNewCustomPay = function() {
  const name = prompt("Nome da Regra Customizada:");
  if (!name) return;
  const type = prompt("Tipo de Acordo (ex: Taxa Zero, MDR Reduzido):");
  if (!type) return;
  const event = prompt("Evento Aplicado:");
  if (!event) return;
  const rate = prompt("MDR / Tarifa Customizada (ex: 1.2%):");
  if (!rate) return;
  CUSTOM_PAY_RULES.push({
    id: Date.now(),
    name: name,
    type: type,
    event: event,
    rate: rate,
    status: "Ativo"
  });
  renderCustomPayRules();
};

// --- 6.5 GATEWAY DE PAGAMENTOS (ERP GRADE CONFIG) ---
window.gatewayTab = 'config';

window.addNewGatewayProvider = function(e) {
  if (e) e.preventDefault();
  
  const name = document.getElementById('new-gw-name').value;
  const fee = parseFloat(document.getElementById('new-gw-fee').value).toFixed(2);
  const settlement = document.getElementById('new-gw-settlement').value;
  
  const selectEl = document.getElementById('gw-main-provider');
  if (selectEl) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = `${name} (Taxa ${fee}%) - ${settlement}`;
    selectEl.appendChild(opt);
    selectEl.value = name;
  }
  
  alert(`Gateway "${name}" adicionado com sucesso e selecionado como canal ativo!`);
  closeModal('add-new-gateway-modal');
  document.getElementById('modal-add-new-gateway-form').reset();
};

function switchGatewayTab(e, tabId) {
  if (e) e.preventDefault();
  
  // Update sidebar active classes
  const links = document.querySelectorAll('#gateway-menu-list .nav-link');
  links.forEach(l => {
    l.classList.remove('active', 'fw-bold', 'text-dark');
    l.classList.add('text-muted');
  });

  const activeLink = Array.from(links).find(l => {
    const onclickAttr = l.getAttribute('onclick');
    return onclickAttr && onclickAttr.includes(`'${tabId}'`);
  });
  if (activeLink) {
    activeLink.classList.add('active', 'fw-bold', 'text-dark');
    activeLink.classList.remove('text-muted');
  }

  // Hide/Show tab panes
  const panes = document.querySelectorAll('.gateway-tab-pane');
  panes.forEach(p => p.style.display = 'none');
  
  const activePane = document.getElementById(`gw-tab-${tabId}`);
  if (activePane) {
    activePane.style.display = 'block';
  }

  // Render charts if tab is reports
  if (tabId === 'reports') {
    setTimeout(renderGatewayCharts, 50);
  }
}
window.switchGatewayTab = switchGatewayTab;

window.toggleGatewayEnv = function(env) {
  // Sync the radios
  const globalProd = document.getElementById('gw-env-prod');
  const globalSand = document.getElementById('gw-env-sandbox');
  const tab1Prod = document.getElementById('gw-config-env');
  const tab1Sand = document.getElementById('gw-config-env'); // In our HTML we have select, not radio
  
  if (env === 'production') {
    if (globalProd) globalProd.checked = true;
    const configEnv = document.getElementById('gw-config-env');
    if (configEnv) configEnv.value = 'production';
  } else {
    if (globalSand) globalSand.checked = true;
    const configEnv = document.getElementById('gw-config-env');
    if (configEnv) configEnv.value = 'sandbox';
  }
  
  alert(`Ambiente alterado para: ${env.toUpperCase()}`);
};

window.testGatewayConnection = function() {
  alert("Testando conexão com o Gateway de Pagamentos...\n\nStatus: Conectado com sucesso!\nTempo de Resposta: 480ms\nVersão API: v2.8");
};

window.onGatewayProviderChange = function(providerName) {
  alert(`Gateway principal alterado para: ${providerName}\nAs taxas e MDR médios foram reajustados.`);
};

window.saveGatewayGeneralConfig = function() {
  alert("Configurações Gerais de Gateway salvas com sucesso!");
};

window.saveGatewayCredentials = function() {
  alert("Credenciais do Gateway criptografadas e salvas com sucesso no chaveiro de segurança!");
};

window.testGatewayAPI = function() {
  alert("Enviando requisição de teste para API (POST /v2.8/status)...\n\nHTTP status: 200 OK\nPayload validado.");
};

window.validateGatewayCredentials = function() {
  alert("Validando chaves de assinatura de Webhooks e API Tokens...\n\nChaves válidas!");
};

window.saveGatewayCards = function() {
  alert("Bandeiras ativas salvas!");
};

window.saveGatewayInstallments = function() {
  alert("Regras de Parcelamento e Juros salvas com sucesso!");
};

window.saveGatewayPIX = function() {
  const pixKey = document.getElementById('pix-key-val').value;
  alert(`Configuração PIX atualizada!\nChave cadastrada: ${pixKey}`);
};

window.saveGatewayBoletos = function() {
  alert("Configuração de emissão de boletos salva com sucesso!");
};

window.saveGatewayAntifraud = function() {
  alert("Regras de Antifraude e Blacklist aplicadas com sucesso!");
};

window.addGatewayWebhook = function() {
  const url = prompt("Digite a URL de retorno para o novo webhook:", "https://erp.diskingressos.com.br/api/custom-webhook");
  if (url) {
    const tbody = document.getElementById('gw-webhooks-table-body');
    if (tbody) {
      const row = `
        <tr>
          <td class="fw-semibold">Evento Customizado</td>
          <td><code style="font-size: 11px;">${url}</code></td>
          <td><span class="text-success"><i class="ph-check-bold"></i> Ativo</span></td>
          <td class="text-end">
            <button class="btn btn-xs btn-outline-secondary py-0.5 px-1.5" onclick="window.testWebhook('custom.event')">Testar</button>
            <button class="btn btn-xs btn-outline-danger py-0.5 px-1.5" onclick="window.deleteWebhook(this)">Excluir</button>
          </td>
        </tr>
      `;
      tbody.insertAdjacentHTML('beforeend', row);
      alert("Webhook adicionado com sucesso!");
    }
  }
};

window.testWebhook = function(eventName) {
  alert(`Disparando simulação de payload de teste para o evento: "${eventName}"...\n\nWebhook entregue (HTTP 200).`);
};

window.deleteWebhook = function(btn) {
  if (confirm("Deseja realmente excluir este Webhook?")) {
    const row = btn.closest('tr');
    if (row) row.remove();
  }
};

window.runConciliationNow = function() {
  alert("Iniciando varredura de extratos eletrônicos nas adquirentes...\n\nProcessamento completo! Nenhuma nova divergência encontrada.");
};

window.exportConciliationExcel = function() {
  alert("Exportando demonstrativo de conciliação bancária em formato EXCEL (.xlsx)...");
};

window.exportConciliationPDF = function() {
  alert("Gerando PDF do demonstrativo consolidado de conciliação bancária...");
};

window.triggerNewRefund = function() {
  const pedido = prompt("Digite o número do pedido para estorno:", "#15254");
  if (pedido) {
    const valor = prompt("Digite o valor a ser estornado (ou deixe vazio para estorno total):", "120,00");
    if (valor) {
      alert(`Solicitação de estorno enviada com sucesso para a operadora!\nPedido: ${pedido} - Valor: R$ ${valor}\nStatus: Processado.`);
    }
  }
};

// 1. CONFIGURAÇÕES ADICIONAIS
window.setGatewayActiveStatus = function(active) {
  const statusEl = document.getElementById('gw-config-status');
  if (statusEl) {
    statusEl.value = active ? 'ativo' : 'inativo';
  }
  const badge = document.getElementById('gw-header-status-badge');
  const footerLabel = document.getElementById('gw-footer-status-label');
  if (active) {
    if (badge) {
      badge.className = 'badge bg-success bg-opacity-10 text-success fw-bold me-1';
      badge.innerHTML = '<i class="ph-circle-fill me-1 fs-xxs"></i>Online';
    }
    if (footerLabel) {
      footerLabel.className = 'text-success fw-bold';
      footerLabel.innerHTML = '<i class="ph-circle-fill me-1 fs-xxs"></i>Online';
    }
    alert("Gateway de Pagamento ATIVADO!");
  } else {
    if (badge) {
      badge.className = 'badge bg-danger bg-opacity-10 text-danger fw-bold me-1';
      badge.innerHTML = '<i class="ph-circle-fill me-1 fs-xxs"></i>Offline';
    }
    if (footerLabel) {
      footerLabel.className = 'text-danger fw-bold';
      footerLabel.innerHTML = '<i class="ph-circle-fill me-1 fs-xxs"></i>Offline';
    }
    alert("Gateway de Pagamento DESATIVADO!");
  }
};

window.restoreGatewayDefaults = function() {
  const companyEl = document.getElementById('gw-config-company');
  const branchEl = document.getElementById('gw-config-branch');
  const timeoutEl = document.getElementById('gw-config-timeout');
  const urlEl = document.getElementById('gw-config-url');
  const webhookEl = document.getElementById('gw-config-webhook');
  
  if (companyEl) companyEl.value = "DiskIngressos Entretenimento S.A.";
  if (branchEl) branchEl.value = "Filial Curitiba Centro";
  if (timeoutEl) timeoutEl.value = "30";
  if (urlEl) urlEl.value = "https://api.mercadopago.com/v1";
  if (webhookEl) webhookEl.value = "https://erp.diskingressos.com.br/api/gateway/callback";
  alert("Configurações originais restauradas!");
};

// 2. CREDENCIAIS ADICIONAIS
window.generateNewAPIToken = function() {
  const rand = Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const privateToken = document.getElementById('gw-private-token');
  if (privateToken) {
    privateToken.value = rand;
    alert(`Novo token gerado: ${rand}`);
  }
};

window.copyPrivateAPIToken = function() {
  const privateToken = document.getElementById('gw-private-token');
  if (privateToken && privateToken.value) {
    navigator.clipboard.writeText(privateToken.value).then(() => {
      alert("Token Privado copiado para a área de transferência!");
    }).catch(() => {
      alert("Copiado: " + privateToken.value);
    });
  } else {
    alert("Nenhum token gerado para copiar.");
  }
};

// 3. CARTÕES ACEITOS ADICIONAIS
window.setGatewayCardChecks = function(checked) {
  const items = document.querySelectorAll('.brand-check-item');
  items.forEach(it => it.checked = checked);
  alert(checked ? "Todas as bandeiras selecionadas!" : "Todas as bandeiras desmarcadas!");
};

window.updateGatewayBrandsTable = function() {
  const tbody = document.getElementById('gw-cards-table-body');
  if (tbody) {
    tbody.innerHTML = '';
    const brands = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard', 'Diners', 'Discover', 'Cabal'];
    brands.forEach(br => {
      const isChecked = document.getElementById('c-' + br.toLowerCase())?.checked;
      if (isChecked) {
        tbody.innerHTML += `
          <tr>
            <td class="fw-bold">${br}</td>
            <td><span class="text-success"><i class="ph-check-bold"></i> Sim</span></td>
            <td><span class="text-success"><i class="ph-check-bold"></i> Sim</span></td>
            <td><span class="badge bg-success bg-opacity-10 text-success">Ativo</span></td>
          </tr>
        `;
      }
    });
  }
  alert("Lista de bandeiras atualizada com sucesso!");
};

// 4. PIX ADICIONAIS
window.generatePixQRCodeDemo = function() {
  alert("QR Code Dinâmico do PIX gerado para o teste!\nPayload: " + document.getElementById('pix-copiapaste').value);
};

window.testPixTransaction = function() {
  alert("Transação PIX Simulada!\nStatus: Pago instantaneamente.");
};

window.consultPixStatus = function() {
  alert("Consulta PIX: Transação pendente de pagamento.");
};

window.cancelPixTransaction = function() {
  alert("Transação PIX cancelada com sucesso.");
};

// 5. BOLETOS ADICIONAIS
window.emitBoletoDemo = function() {
  alert("Boleto emitido com sucesso!\nBanco: Banco do Brasil\nLinha Digitável: 00190.00009 02388.410007 00000.100017 9 99010000012000");
};

window.cancelBoletoDemo = function() {
  alert("Boleto cancelado no banco emissor!");
};

window.downloadBoletoDemo = function() {
  alert("Baixando PDF do boleto bancário...");
};

window.reemitBoletoDemo = function() {
  alert("Boleto reemitido com nova data de vencimento!");
};

window.sendBoletoEmail = function() {
  alert("Boleto enviado para o e-mail do comprador!");
};

// 6. PARCELAMENTO ADICIONAIS
window.addInstallmentRow = function() {
  const tbody = document.getElementById('gw-installment-table-rows');
  if (tbody) {
    const nextIdx = tbody.children.length + 1;
    tbody.innerHTML += `
      <tr>
        <td>${nextIdx}x</td>
        <td class="fw-bold text-danger">${(1.99 + nextIdx * 0.5).toFixed(2)}%</td>
        <td class="text-center"><input type="checkbox" checked></td>
        <td class="text-center"><input type="checkbox"></td>
      </tr>
    `;
    alert("Nova regra de parcela adicionada!");
  }
};

window.deleteInstallmentRow = function() {
  const tbody = document.getElementById('gw-installment-table-rows');
  if (tbody && tbody.children.length > 1) {
    tbody.lastElementChild.remove();
    alert("Última parcela removida.");
  }
};

window.duplicateInstallmentConfig = function() {
  alert("Configuração de parcelamento duplicada!");
};

// 7. ANTIFRAUDE ADICIONAIS
window.testAntifraudAPI = function() {
  alert("Enviando requisição de teste para ClearSale V3...\n\nHTTP status: 200 OK\nStatus da API: Online");
};

window.updateBlacklistData = function() {
  alert("Lista de CPFs e Cartões bloqueados atualizada com sucesso!");
};

// 8. WEBHOOKS ADICIONAIS
window.testWebhook = function(eventName) {
  alert(`Disparando simulação de payload de teste para o evento: "${eventName}"...\n\nWebhook entregue (HTTP 200).`);
};

window.viewWebhookPayload = function(eventName) {
  alert(`Payload JSON Simulado para "${eventName}":\n\n{\n  "event": "${eventName}",\n  "timestamp": "2026-07-15T10:00:00Z",\n  "data": {\n    "id": "pay_9284812",\n    "status": "approved",\n    "amount": 120.00\n  }\n}`);
};

window.resendWebhookEvent = function(eventName) {
  alert(`Reenviando evento "${eventName}" para o endpoint cadastrado...\n\nStatus: Reentregue com sucesso.`);
};

// 9. CONCILIAÇÃO ADICIONAIS
window.reconcileRow = function(btn) {
  const row = btn.closest('tr');
  if (row) {
    const statusCol = row.querySelector('.badge');
    if (statusCol) {
      statusCol.className = 'badge bg-success bg-opacity-10 text-success';
      statusCol.textContent = 'Conciliado';
    }
    const diffCol = row.cells[5];
    if (diffCol) {
      diffCol.className = 'font-monospace text-success';
      diffCol.textContent = 'R$ 0,00';
    }
    alert("Venda conciliada com sucesso!");
  }
};

window.ignoreConciliationRow = function(btn) {
  const row = btn.closest('tr');
  if (row) {
    const statusCol = row.querySelector('.badge');
    if (statusCol) {
      statusCol.className = 'badge bg-secondary bg-opacity-10 text-secondary';
      statusCol.textContent = 'Ignorado';
    }
    alert("Divergência ignorada.");
  }
};

window.exportConciliationExcel = function() {
  alert("Exportando demonstrativo de conciliação bancária em formato EXCEL (.xlsx)...");
};

window.exportConciliationPDF = function() {
  alert("Gerando PDF do demonstrativo consolidado de conciliação bancária...");
};

window.refreshConciliationData = function() {
  alert("Dados de conciliação financeira recarregados.");
};

// 10. ESTORNOS ADICIONAIS
window.triggerPartialRefund = function() {
  const pedido = prompt("Digite o número do pedido para estorno parcial:", "#15255");
  if (pedido) {
    const valor = prompt("Digite o valor do estorno parcial:", "40,00");
    if (valor) {
      alert(`Estorno parcial de R$ ${valor} aprovado para o pedido ${pedido}!`);
    }
  }
};

window.cancelRefundDemo = function() {
  alert("Solicitação de estorno cancelada.");
};

window.consultRefundStatus = function() {
  alert("Status do estorno: Finalizado com sucesso.");
};

// 11. LOGS ADICIONAIS
window.searchLogsData = function() {
  alert("Filtrando logs de auditoria...");
};

window.clearLogFilters = function() {
  alert("Filtros de log limpos.");
};

window.exportLogsCSV = function() {
  alert("Exportando logs no formato CSV...");
};

window.downloadLogsJSON = function() {
  alert("Baixando arquivo JSON de auditoria de logs...");
};

window.viewLogDetails = function(el) {
  const row = el.closest('tr');
  if (row) {
    const eventName = row.cells[1].textContent;
    alert(`Detalhes do Evento:\n\nEvento: ${eventName}\nPayload: ${row.cells[2].textContent}\nResposta API: ${row.cells[3]?.textContent || '200 OK'}`);
  }
};

// 12. RELATÓRIOS ADICIONAIS
window.exportReportsPDF = function() {
  alert("Exportando relatório consolidado do Gateway de Pagamento em PDF...");
};

window.exportReportsExcel = function() {
  alert("Exportando relatório consolidado do Gateway de Pagamento em EXCEL (.xlsx)...");
};

window.exportReportsCSV = function() {
  alert("Exportando relatório em formato CSV...");
};

window.printReports = function() {
  window.print();
};

window.refreshGatewayDashboard = function() {
  renderGatewayCharts();
  alert("Dashboard atualizado com sucesso!");
};

window.agendarRelatorio = function() {
  alert("Relatório agendado com sucesso!");
};

window.enviarPorEmail = function() {
  alert("Relatório enviado por e-mail com sucesso!");
};

// BARRA DE AÇÕES GLOBAL
window.globalAction = function(action) {
  switch (action) {
    case 'novo':
      alert('Iniciando cadastro de uma nova configuração de Gateway...');
      break;
    case 'editar':
      alert('Edição de configurações habilitada.');
      break;
    case 'salvar':
      alert('Salvando todas as configurações do painel de Gateways...');
      break;
    case 'cancelar':
      alert('Alterações descartadas.');
      break;
    case 'excluir':
      if (confirm('Tem certeza que deseja excluir esta configuração de Gateway?')) {
        alert('Configuração excluída com sucesso.');
      }
      break;
    case 'pesquisar':
      alert('Exibindo filtros de pesquisa avançada...');
      break;
    case 'atualizar':
      alert('Dados sincronizados com sucesso.');
      break;
    case 'importar':
      alert('Selecione um arquivo JSON/XML para importar.');
      break;
    case 'exportar':
      alert('Exportando configurações do Gateway (formato JSON)...');
      break;
    case 'historico':
      alert('Exibindo log de alterações e auditoria de configurações.');
      break;
    case 'ajuda':
      alert('Abrindo central de documentação e ajuda do Gateway.');
      break;
    default:
      console.log('Action not mapped:', action);
  }
};

// Charts
window.gwCharts = {};

function renderGatewayCharts() {
  const chartConfigs = [
    {
      id: 'c-gw-payments-day',
      type: 'line',
      data: {
        labels: ['05/07', '06/07', '07/07', '08/07', '09/07', '10/07'],
        datasets: [{
          label: 'Pagamentos (R$)',
          data: [120000, 135000, 110000, 142000, 168000, 152320],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          tension: 0.2,
          fill: true
        }]
      }
    },
    {
      id: 'c-gw-app-neg',
      type: 'bar',
      data: {
        labels: ['Aprovados', 'Negados'],
        datasets: [{
          data: [1245, 23],
          backgroundColor: ['#10b981', '#ef4444']
        }]
      }
    },
    {
      id: 'c-gw-card-brands',
      type: 'doughnut',
      data: {
        labels: ['Visa', 'Mastercard', 'Elo', 'Outros'],
        datasets: [{
          data: [55, 30, 10, 5],
          backgroundColor: ['#1e3a8a', '#ea580c', '#f59e0b', '#6b7280']
        }]
      }
    },
    {
      id: 'c-gw-pix-card',
      type: 'pie',
      data: {
        labels: ['PIX', 'Cartão', 'Boleto'],
        datasets: [{
          data: [430, 815, 203],
          backgroundColor: ['#f59e0b', '#8b5cf6', '#06b6d4']
        }]
      }
    },
    {
      id: 'c-gw-chargebacks',
      type: 'line',
      data: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Chargebacks',
          data: [0, 1, 0, 0, 1, 0, 0],
          borderColor: '#ef4444',
          tension: 0.1
        }]
      }
    },
    {
      id: 'c-gw-net-revenue',
      type: 'bar',
      data: {
        labels: ['Mai', 'Jun', 'Jul'],
        datasets: [{
          label: 'Receita Bruta (R$)',
          data: [1200000, 1400000, 1543200],
          backgroundColor: '#10b981'
        }]
      }
    },
    {
      id: 'c-gw-installments',
      type: 'doughnut',
      data: {
        labels: ['1x', '2x-6x', '7x-12x'],
        datasets: [{
          data: [45, 35, 20],
          backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899']
        }]
      }
    },
    {
      id: 'c-gw-response-time',
      type: 'line',
      data: {
        labels: ['10h', '11h', '12h', '13h', '14h'],
        datasets: [{
          label: 'API latency (ms)',
          data: [450, 480, 520, 460, 480],
          borderColor: '#06b6d4',
          tension: 0.3
        }]
      }
    }
  ];

  chartConfigs.forEach(conf => {
    const el = document.getElementById(conf.id);
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    if (window.gwCharts[conf.id]) {
      window.gwCharts[conf.id].destroy();
    }
    window.gwCharts[conf.id] = new Chart(ctx, {
      type: conf.type,
      data: conf.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: conf.type === 'doughnut' || conf.type === 'pie', labels: { font: { size: 8 } } }
        },
        scales: {
          y: { display: conf.type !== 'doughnut' && conf.type !== 'pie', ticks: { font: { size: 7 } } },
          x: { display: conf.type !== 'doughnut' && conf.type !== 'pie', ticks: { font: { size: 7 } } }
        }
      }
    });
  });
}

// --- 6.6 ADVANCED MODULE MANAGEMENT ---
let ADVANCED_RECEBER = [
  { id: 1, name: "Guto Lima", event: "Festival de Inverno", value: 3450.00, status: "Aberto" },
  { id: 2, name: "Clara Mendes", event: "Show Deive Leonardo", value: 1200.00, status: "Pago" },
  { id: 3, name: "Rodrigo Alencar", event: "Festival Rock & Art", value: 5800.00, status: "Atrasado" }
];
let ADVANCED_PAGAR = [
  { id: 1, vendor: "Som & Luz Equipamentos", value: 4500.00, due: "2026-07-20" },
  { id: 2, vendor: "Segurança SegTotal", value: 2300.00, due: "2026-07-18" },
  { id: 3, vendor: "Limpeza CleanEvent", value: 1200.00, due: "2026-07-22" }
];

function renderAdvancedTables() {
  const tbodyRec = document.getElementById('advanced-receber-table-body');
  if (tbodyRec) {
    tbodyRec.innerHTML = '';
    ADVANCED_RECEBER.forEach(item => {
      let badgeClass = 'bg-warning';
      if (item.status === 'Pago') badgeClass = 'bg-success';
      if (item.status === 'Atrasado') badgeClass = 'bg-danger';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="fw-bold text-dark">${item.name}</td>
        <td>${item.event}</td>
        <td class="font-monospace text-success fw-bold">R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td><span class="badge ${badgeClass}">${item.status}</span></td>
      `;
      tbodyRec.appendChild(tr);
    });
  }

  const tbodyPag = document.getElementById('advanced-pagar-table-body');
  if (tbodyPag) {
    tbodyPag.innerHTML = '';
    ADVANCED_PAGAR.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="fw-bold text-dark">${item.vendor}</td>
        <td class="font-monospace text-danger fw-bold">R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="text-muted fs-xxs">${item.due}</td>
        <td>
          <button class="btn btn-danger btn-xs py-0.5 px-2 fw-bold" onclick="window.payExpense(${item.id})">Pagar</button>
        </td>
      `;
      tbodyPag.appendChild(tr);
    });
  }
}

window.toggleTxTypeFields = function(type) {
  const nameLabel = document.getElementById('tx-name-label');
  const nameInput = document.getElementById('tx-name');
  const statusGroup = document.getElementById('tx-status-group');
  
  if (type === 'receita') {
    if (nameLabel) nameLabel.textContent = "Cliente:";
    if (nameInput) nameInput.placeholder = "Ex: João da Silva";
    if (statusGroup) statusGroup.style.display = 'block';
  } else {
    if (nameLabel) nameLabel.textContent = "Fornecedor:";
    if (nameInput) nameInput.placeholder = "Ex: Fornecedor Som";
    if (statusGroup) statusGroup.style.display = 'none';
  }
};

window.saveNewTransaction = function(e) {
  if (e) e.preventDefault();
  const type = document.getElementById('tx-type').value;
  const name = document.getElementById('tx-name').value;
  const desc = document.getElementById('tx-desc').value;
  const val = parseFloat(document.getElementById('tx-value').value) || 0;
  const date = document.getElementById('tx-date').value;
  const status = document.getElementById('tx-status').value;
  
  if (type === 'receita') {
    ADVANCED_RECEBER.unshift({
      id: Date.now(),
      name: name,
      event: desc,
      value: val,
      status: status
    });
  } else {
    ADVANCED_PAGAR.unshift({
      id: Date.now(),
      vendor: name,
      value: val,
      due: date
    });
  }
  
  renderAdvancedTables();
  alert("Lançamento financeiro adicionado com sucesso!");
  closeModal('new-transaction');
  
  document.getElementById('modal-new-transaction-form').reset();
  window.toggleTxTypeFields('receita');
};

window.payExpense = function(id) {
  const item = ADVANCED_PAGAR.find(p => p.id === id);
  if (item) {
    if (confirm(`Deseja confirmar a liquidação (pagamento) do lançamento "${item.vendor}" no valor de R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}?`)) {
      ADVANCED_PAGAR = ADVANCED_PAGAR.filter(p => p.id !== id);
      renderAdvancedTables();
      alert("Despesa liquidada e caixa atualizado!");
    }
  }
};

// Global Window exposures for inline HTML handlers (type="module" scoping workaround)
window.switchActiveView = switchActiveView;
window.selectRepasseBankCard = selectRepasseBankCard;
window.openModal = openModal;
window.closeModal = closeModal;
window.createUiCard = createUiCard;
window.createUiTable = createUiTable;
window.createUiModal = createUiModal;
window.createUiChart = createUiChart;
