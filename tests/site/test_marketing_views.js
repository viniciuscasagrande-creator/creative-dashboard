const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const projectDir = path.join(__dirname, '..', '..');
const htmlPath = path.join(projectDir, 'dist', 'index.html');
const assetsDir = path.join(projectDir, 'dist', 'assets');

let jsFile = '';
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const found = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  if (found) jsFile = found;
}
const jsPath = path.join(assetsDir, jsFile);

const html = fs.readFileSync(htmlPath, 'utf8');
const jsCode = fs.readFileSync(jsPath, 'utf8');

console.log("Testing Marketing Views in JSDOM...");

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  url: "https://financeiropdtnovo.web.app/"
});

// Mock Chart and Bootstrap
dom.window.Chart = function(ctx, config) {
  this.ctx = ctx;
  this.config = config;
  this.destroy = () => {};
};

dom.window.bootstrap = {
  Tooltip: function() { return { show: () => {}, hide: () => {} }; },
  Popover: function() { return { show: () => {}, hide: () => {} }; },
  Collapse: {
    getOrCreateInstance: () => ({ show: () => {}, hide: () => {} })
  }
};

try {
  dom.window.eval(jsCode);
  console.log("JS Bundle loaded successfully.");

  const { window } = dom;
  const { document: doc } = window;

  const viewsToTest = [
    'mkt-config',
    'mkt-analytics',
    'mkt-pixel',
    'remkt-audiences',
    'remkt-recovery',
    'remkt-campaigns',
    'event-marketing'
  ];

  viewsToTest.forEach(v => {
    window.switchActiveView(v);
    const sec = doc.getElementById(`view-${v}`);
    console.log(`View 'view-${v}': display = ${sec ? sec.style.display : 'NOT FOUND'}`);
    if (!sec || sec.style.display !== 'flex') {
      throw new Error(`View 'view-${v}' failed to display!`);
    }
  });

  console.log("✅ All marketing and remarketing views tested and displayed successfully!");
  process.exit(0);
} catch (e) {
  console.error("❌ Test failed:", e);
  process.exit(1);
}
