const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log("Launching JSDOM for Negotiations verification...");

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

// Verify initial list loading
if (typeof window.initNegotiationsPage === 'function') {
  window.initNegotiationsPage();
  console.log("initNegotiationsPage executed.");
} else {
  console.error("initNegotiationsPage not found!");
  process.exit(1);
}

// 1. Verify Receita totals render
const revTotalLiquido = doc.getElementById('rev-total-liquido-sum').textContent;
console.log("Initial Revenue Net Sum:", revTotalLiquido);
if (!revTotalLiquido.includes("Líquido:")) {
  console.error("Receita table totals not populated!");
  process.exit(1);
}

// 2. Switch to Advanced Tab
if (typeof window.switchNegotiationTab === 'function') {
  window.switchNegotiationTab(null, 'advanced');
  const advTable = doc.getElementById('neg-advanced-param-rows');
  console.log("Advanced params table populated:", !!advTable && advTable.children.length > 0);
  if (!advTable || advTable.children.length === 0) {
    console.error("Advanced params table empty!");
    process.exit(1);
  }
} else {
  console.error("switchNegotiationTab not found!");
  process.exit(1);
}

// 3. Trigger Advanced Value Update
const initialInstallmentVal = doc.querySelector('#neg-advanced-param-rows tr:last-child td:last-child').textContent;
console.log("Initial Installment Value:", initialInstallmentVal);

// Update monthly interest rate of advanced to 10% simple
window.updateAdvancedValue(3368, 'taxa', 10.00);

const updatedInstallmentVal = doc.querySelector('#neg-advanced-param-rows tr:last-child td:last-child').textContent;
console.log("Updated Installment Value after 10% rate:", updatedInstallmentVal);
if (initialInstallmentVal === updatedInstallmentVal) {
  console.error("Update failed to trigger recalculation!");
  process.exit(1);
}

// 4. Verify Info Tab parameters
window.switchNegotiationTab(null, 'informacoes');
const infoTable = doc.getElementById('neg-info-param-rows');
console.log("Info parameters table populated:", !!infoTable && infoTable.children.length > 0);
if (!infoTable || infoTable.children.length === 0) {
  console.error("Info params table empty!");
  process.exit(1);
}

console.log("Test Passed!");
process.exit(0);
