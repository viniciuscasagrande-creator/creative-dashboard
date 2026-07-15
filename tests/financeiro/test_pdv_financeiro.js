const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log("Launching JSDOM for PDV Financeiro verification...");

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

// Verify PDV view structure
const viewPdv = doc.getElementById('view-financial-pdv');
console.log("PDV section exists:", !!viewPdv);

// Trigger initialization
if (typeof window.initPDVFinanceiroModule === 'function') {
  window.initPDVFinanceiroModule();
  console.log("initPDVFinanceiroModule executed.");
} else {
  console.error("initPDVFinanceiroModule not found on window!");
  process.exit(1);
}

// Verify dynamic lists populated
const execRows = doc.querySelectorAll('#pdv-executive-rows tr');
console.log("Executive PDV rows count:", execRows.length);
if (execRows.length !== 6) {
  console.error("Expected 6 rows, found " + execRows.length);
  process.exit(1);
}

const caixasRows = doc.querySelectorAll('#pdv-caixas-rows tr');
console.log("Monitor Caixas rows count:", caixasRows.length);
if (caixasRows.length !== 6) {
  console.error("Expected 6 rows, found " + caixasRows.length);
  process.exit(1);
}

// Simulate sale
const initialRevenue = doc.getElementById('pdv-kpi-revenue').textContent;
console.log("Initial Revenue KPI:", initialRevenue);

if (typeof window.simulatePDVSale === 'function') {
  window.simulatePDVSale();
  const updatedRevenue = doc.getElementById('pdv-kpi-revenue').textContent;
  console.log("Updated Revenue KPI after simulation:", updatedRevenue);
  if (initialRevenue === updatedRevenue) {
    console.error("Simulation failed to update revenue indicator!");
    process.exit(1);
  }
} else {
  console.error("simulatePDVSale not found!");
  process.exit(1);
}

console.log("Test Passed!");
process.exit(0);
