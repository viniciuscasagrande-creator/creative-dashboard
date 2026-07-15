const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const projectDir = path.join(__dirname, '..', '..');
const htmlPath = path.join(projectDir, 'dist', 'index.html');

const virtualConsole = new VirtualConsole();
const logs = [];
const errors = [];

virtualConsole.on("log", (msg) => logs.push(msg));
virtualConsole.on("error", (msg) => errors.push(msg));
virtualConsole.on("warn", (msg) => logs.push("[WARN] " + msg));
virtualConsole.on("jsdomError", (err) => errors.push("[JSDOM ERROR] " + err.message + "\nStack: " + err.stack));

console.log("Launching JSDOM for click simulation...");

JSDOM.fromFile(htmlPath, {
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
}).then((dom) => {
  // Find and eval the bundled JS file to mock type="module" execution
  const assetsDir = path.join(__dirname, 'dist', 'assets');
  let jsCode = '';
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const found = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
    if (found) {
      jsCode = fs.readFileSync(path.join(assetsDir, found), 'utf8');
    }
  }
  if (jsCode) {
    dom.window.eval(jsCode);
  }

  // Wait for DOMContentLoaded
  setTimeout(() => {
    const doc = dom.window.document;
    
    // Find the Financeiro submenu header link
    const financeiroHeader = Array.from(doc.querySelectorAll('.nav-item-submenu > a')).find(el => el.textContent.includes('Financeiro'));
    console.log("Found Financeiro header:", !!financeiroHeader);
    
    if (financeiroHeader) {
      const parent = financeiroHeader.closest('.nav-item-submenu');
      console.log("Financeiro parent classes before click:", parent.className);
      
      // Click header
      financeiroHeader.click();
      console.log("Financeiro parent classes after header click:", parent.className);
      
      // Find the Saldo link
      const saldoLink = doc.querySelector('.submenu-link[data-view="financial-balance"]');
      console.log("Found Saldo link:", !!saldoLink);
      
      if (saldoLink) {
        console.log("Clicking Saldo link...");
        saldoLink.click();
        
        // Wait a bit and check state
        setTimeout(() => {
          console.log("Financeiro parent classes after Saldo click:", parent.className);
          console.log("Number of balance rows:", doc.querySelectorAll('#financial-balance-rows tr').length);
          
          console.log("=== Browser Logs ===");
          logs.forEach(l => console.log("LOG:", l));
          
          console.log("=== Browser Errors ===");
          errors.forEach(e => console.error(e));
          
          process.exit(0);
        }, 100);
      } else {
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }, 3500);
}).catch(err => {
  console.error("JSDOM load error:", err);
  process.exit(1);
});
