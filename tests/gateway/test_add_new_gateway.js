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

console.log("Launching JSDOM for add new gateway test...");

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
    const window = dom.window;

    // Verify select element initial choices
    const selectEl = doc.getElementById('gw-main-provider');
    console.log("Select options count (initial):", selectEl.options.length);

    // Mock alert and prompt
    window.alert = (msg) => console.log("ALERT:", msg);

    // Populate modal inputs
    doc.getElementById('new-gw-name').value = 'Stripe';
    doc.getElementById('new-gw-fee').value = '1.75';
    doc.getElementById('new-gw-settlement').value = 'D+1';
    doc.getElementById('new-gw-api-version').value = 'v3';

    // Submit form
    const form = doc.getElementById('modal-add-new-gateway-form');
    console.log("Form found:", !!form);
    
    // Trigger submit
    const event = new window.Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);

    setTimeout(() => {
      console.log("Select options count (after submit):", selectEl.options.length);
      console.log("Selected value:", selectEl.value);

      console.log("=== Errors ===");
      errors.forEach(e => console.error(e));
      
      if (selectEl.options.length > 6 && selectEl.value === 'Stripe') {
        console.log("Test Passed!");
        process.exit(0);
      } else {
        console.error("Test Failed! New gateway not added/selected.");
        process.exit(1);
      }
    }, 100);

  }, 1000);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
