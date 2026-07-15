/**
 * Reusable UI Components Helper Module
 */

/**
 * Creates a standard premium card element
 */
export function createUiCard({ title, icon = '', content = '', badge = '', extraClass = '' }) {
  const card = document.createElement('div');
  card.className = `card shadow-sm border-0 ${extraClass}`;
  card.style.borderRadius = '12px';
  card.style.border = '1px solid rgba(0,0,0,0.06)';
  
  card.innerHTML = `
    <div class="card-body p-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="fw-bold mb-0 text-dark">
          ${icon ? `<i class="${icon} me-1 text-primary"></i>` : ''}
          ${title}
        </h6>
        ${badge ? `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20 px-2 py-0.5 fs-xxs">${badge}</span>` : ''}
      </div>
      <div class="card-content-area">
        ${content}
      </div>
    </div>
  `;
  return card;
}

/**
 * Creates a standard dynamic table structure
 */
export function createUiTable({ headers = [], rows = [], id = '', customClass = '' }) {
  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-responsive';
  
  const table = document.createElement('table');
  table.className = `table table-striped table-hover align-middle mb-0 ${customClass}`;
  if (id) table.id = id;
  
  let headerHtml = '';
  if (headers.length > 0) {
    headerHtml = `
      <thead class="table-light">
        <tr>
          ${headers.map(h => `<th class="py-2 fs-xxs fw-bold text-muted text-uppercase">${h}</th>`).join('')}
        </tr>
      </thead>
    `;
  }
  
  let rowsHtml = '';
  if (rows.length > 0) {
    rowsHtml = `
      <tbody>
        ${rows.map(r => `
          <tr>
            ${r.map(cell => `<td class="py-2 fs-xs">${cell}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    `;
  } else {
    rowsHtml = `
      <tbody>
        <tr>
          <td colspan="${headers.length || 1}" class="text-center text-muted py-3 fs-xs">Nenhum dado encontrado</td>
        </tr>
      </tbody>
    `;
  }
  
  table.innerHTML = headerHtml + rowsHtml;
  tableContainer.appendChild(table);
  return tableContainer;
}

/**
 * Renders a dynamic modal overlay inside the DOM
 */
export function createUiModal({ id, title, bodyHtml = '', footerHtml = '', size = 'medium' }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = `modal-${id}`;
  
  let maxWidth = '480px';
  if (size === 'large') maxWidth = '720px';
  if (size === 'small') maxWidth = '360px';
  
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: ${maxWidth}; border-radius: 8px;">
      <div class="modal-header text-white py-3 bg-dark" style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-bottom: 1px solid rgba(0,0,0,0.08);">
        <span class="modal-title fw-bold" style="color: #fff;">${title}</span>
        <button class="btn-close-modal" type="button" onclick="closeModal('${id}')" style="color: #fff; background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
      </div>
      <div class="modal-body p-4 text-start">
        ${bodyHtml}
      </div>
      ${footerHtml ? `
      <div class="modal-footer bg-light">
        ${footerHtml}
      </div>
      ` : ''}
    </div>
  `;
  
  document.body.appendChild(overlay);
  return overlay;
}

/**
 * Safely initializes a ChartJS chart instance
 */
export function createUiChart({ id, type, data, options = {} }) {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js is not loaded. Skipping chart rendering.");
    return null;
  }
  
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`Chart element with id="${id}" not found.`);
    return null;
  }
  
  const ctx = el.getContext('2d');
  if (!ctx) return null;
  
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { font: { size: 9 } }
      }
    }
  };
  
  return new Chart(ctx, {
    type,
    data,
    options: { ...defaultOptions, ...options }
  });
}
