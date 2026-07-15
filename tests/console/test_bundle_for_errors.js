const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const projectDir = path.join(__dirname, '..', '..');
const htmlPath = path.join(projectDir, 'dist', 'index.html');

// Find the JS file dynamically in dist/assets
const assetsDir = path.join(projectDir, 'dist', 'assets');
let jsFile = '';
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const found = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  if (found) jsFile = found;
}
const jsPath = path.join(assetsDir, jsFile);

if (!fs.existsSync(htmlPath) || !jsFile || !fs.existsSync(jsPath)) {
  console.error("HTML or JS bundle not found in dist!");
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const jsCode = fs.readFileSync(jsPath, 'utf8');

console.log("Simulating browser load with JSDOM...");

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  url: "https://financeiropdtnovo.web.app/"
});

// Mock some window objects that might be expected
dom.window.bootstrap = {
  Tooltip: function() { return { show: () => {}, hide: () => {} }; },
  Popover: function() { return { show: () => {}, hide: () => {} }; }
};

// Catch window errors
dom.window.addEventListener('error', (event) => {
  console.error("=== BROWSER RUNTIME ERROR ===");
  console.error(event.error);
});

try {
  // Execute the bundled code
  dom.window.eval(jsCode);
  console.log("Bundle executed without throwing immediate errors!");
  
  // Wait a bit for DOMContentLoaded
  setTimeout(() => {
    console.log("Check if JSDOM is alive...");
    process.exit(0);
  }, 1000);
} catch (e) {
  console.error("=== EVALUATION CRASH ===");
  console.error(e);
  process.exit(1);
}
