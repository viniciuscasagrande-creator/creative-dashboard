const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const projectDir = path.join(__dirname, '..', '..');

const bootstrapCode = fs.readFileSync(path.join(projectDir, 'assets', 'js', 'bootstrap', 'bootstrap.bundle.min.js'), 'utf8');
const limitlessAppCode = fs.readFileSync(path.join(projectDir, 'limitless_assets', 'js', 'app.js'), 'utf8');
const appCode = fs.readFileSync(path.join(projectDir, 'src', 'app.js'), 'utf8');

const html = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf8');

console.log("Setting up JSDOM...");

const dom = new JSDOM(html, {
  runScripts: "outside-only",
  url: "https://financeiropdtnovo.web.app"
});

const window = dom.window;

// Mock Chart
window.Chart = function() {
  return { destroy: () => {}, update: () => {} };
};

// Evaluate in order
dom.window.eval(bootstrapCode);
dom.window.eval(limitlessAppCode);
// Strip ES imports for JSDOM eval
const cleanAppCode = appCode.replace(/import\s+[^;]+;/g, '');
window.createUiCard = () => window.document.createElement('div');
window.createUiTable = () => window.document.createElement('div');
window.createUiModal = () => window.document.createElement('div');
window.createUiChart = () => null;
dom.window.eval(cleanAppCode);

console.log("Simulating DOMContentLoaded...");
const event = new window.Event('DOMContentLoaded');
window.document.dispatchEvent(event);

const doc = window.document;

// Let's find the first submenu header, e.g., "Marketing" or "Financeiro"
const submenuToggles = doc.querySelectorAll('.nav-item-submenu > .nav-link');
console.log(`Found ${submenuToggles.length} submenu toggles in sidebar.`);

if (submenuToggles.length > 0) {
  const firstToggle = submenuToggles[0];
  const parent = firstToggle.closest('.nav-item-submenu');
  const submenu = parent.querySelector('.nav-group-sub');

  console.log("Initial state:");
  console.log("  Parent classes:", parent.className);
  console.log("  Submenu classes:", submenu.className);

  console.log("Clicking the toggle...");
  firstToggle.click();

  console.log("State after click:");
  console.log("  Parent classes:", parent.className);
  console.log("  Submenu classes:", submenu.className);
}

process.exit(0);
