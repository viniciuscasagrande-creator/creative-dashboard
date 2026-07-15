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

console.log("Launching JSDOM for add operator test...");

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

    // Verify initial count of operators in table
    const initialRows = doc.querySelectorAll('#operators-table-body tr').length;
    console.log("Initial operator rows:", initialRows);

    // Mock alert and prompt on window
    window.alert = (msg) => console.log("ALERT:", msg);

    // Populate modal inputs
    doc.getElementById('op-name').value = 'Getnet Santander';
    doc.getElementById('op-approval').value = '94.2';
    doc.getElementById('op-mdr').value = '1.85';
    doc.getElementById('op-volume').value = '25000';
    doc.getElementById('op-status').value = 'Ativo';

    // Submit form
    const form = doc.getElementById('modal-add-operator-form');
    console.log("Form found:", !!form);
    
    // Trigger submit event
    const event = new window.Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);

    setTimeout(() => {
      const finalRows = doc.querySelectorAll('#operators-table-body tr').length;
      console.log("Final operator rows after submit:", finalRows);

      console.log("=== Errors ===");
      errors.forEach(e => console.error(e));
      
      if (finalRows > initialRows) {
        console.log("Test Passed!");
        process.exit(0);
      } else {
        console.error("Test Failed! Operator was not added.");
        process.exit(1);
      }
    }, 100);

  }, 1000);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
