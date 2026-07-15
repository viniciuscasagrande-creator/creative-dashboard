const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log("Launching JSDOM for add new complete PDV verification...");

const projectDir = path.join(__dirname, '..', '..');
const htmlPath = path.join(projectDir, 'index.html');
const jsPath = path.join(projectDir, 'src', 'app.js');

let html = fs.readFileSync(htmlPath, 'utf8');

// Mock Chart
const chartMock = `
class Chart {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
  }
  destroy() {}
}
window.Chart = Chart;
`;

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable"
});

const { window } = dom;
const { document: doc } = window;

// Inject dependencies
window.eval(chartMock);

// Read and execute app.js in context
let jsCode = fs.readFileSync(jsPath, 'utf8');
jsCode = jsCode.replace(/import\s+[^;]+;/g, '');
window.createUiCard = () => document.createElement('div');
window.createUiTable = () => document.createElement('div');
window.createUiModal = () => document.createElement('div');
window.createUiChart = () => null;
window.eval(jsCode);

// Verify initial list
if (typeof window.initPDVFinanceiroModule === 'function') {
  window.initPDVFinanceiroModule();
} else {
  console.error("initPDVFinanceiroModule not found!");
  process.exit(1);
}

const initialRowsCount = doc.querySelectorAll('#pdv-executive-rows tr').length;
console.log("Initial executive PDV rows count:", initialRowsCount);

// Simulate modal fields
doc.getElementById('add-pdv-name').value = 'Shopping Estação';
doc.getElementById('add-pdv-ops').value = '4';
doc.getElementById('add-pdv-caixas').value = '3';
doc.getElementById('add-pdv-operator-name').value = 'Juliana Martins';
doc.getElementById('add-pdv-status').value = '🟢';
doc.getElementById('add-pdv-time').value = '01:15';

doc.getElementById('add-pdv-pix').value = '1000.00';
doc.getElementById('add-pdv-credit').value = '2500.00';
doc.getElementById('add-pdv-debit').value = '500.00';
doc.getElementById('add-pdv-cash').value = '200.00';

// Trigger save
const initialRevenue = doc.getElementById('pdv-kpi-revenue').textContent;
console.log("Initial Revenue KPI:", initialRevenue);

if (typeof window.saveNewCompletePDV === 'function') {
  // Mock alert and closeModal
  window.alert = function(msg) {
    console.log("ALERT:", msg);
  };
  window.closeModal = function(id) {
    console.log("Modal closed:", id);
  };
  
  window.saveNewCompletePDV({
    preventDefault: () => {}
  });
  
  const updatedRowsCount = doc.querySelectorAll('#pdv-executive-rows tr').length;
  console.log("Updated executive PDV rows count:", updatedRowsCount);
  if (updatedRowsCount !== initialRowsCount + 1) {
    console.error("Expected " + (initialRowsCount + 1) + " rows, found " + updatedRowsCount);
    process.exit(1);
  }
  
  const updatedRevenue = doc.getElementById('pdv-kpi-revenue').textContent;
  console.log("Updated Revenue KPI:", updatedRevenue);
  
  // Clean R$ and dots to compare floats
  const parseVal = (str) => parseFloat(str.replace(/[^\d,]/g, '').replace(',', '.'));
  const diff = parseVal(updatedRevenue) - parseVal(initialRevenue);
  console.log("Revenue difference:", diff);
  if (diff !== 4200.00) {
    console.error("Expected revenue difference to be 4200.00, found " + diff);
    process.exit(1);
  }
  
} else {
  console.error("saveNewCompletePDV not found!");
  process.exit(1);
}

console.log("Test Passed!");
process.exit(0);
