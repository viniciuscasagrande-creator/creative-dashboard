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

console.log("Launching JSDOM for click operators test...");

JSDOM.fromFile(htmlPath, {
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
}).then((dom) => {
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

  setTimeout(() => {
    const doc = dom.window.document;
    
    // Find the link to financial-operators
    const link = doc.querySelector('a[data-view="financial-operators"]');
    console.log("Found Operadoras de Cartão link:", !!link);
    
    // Before click check display
    const section = doc.getElementById('view-financial-operators');
    console.log("Section display before click:", section.style.display);

    // Trigger click
    const clickEvent = new dom.window.Event('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);

    setTimeout(() => {
      console.log("Section display after click:", section.style.display);
      console.log("=== Errors ===");
      errors.forEach(e => console.error(e));
      
      if (section.style.display === 'flex') {
        console.log("Test Passed!");
        process.exit(0);
      } else {
        console.error("Test Failed! View did not display.");
        process.exit(1);
      }
    }, 100);

  }, 1000);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
