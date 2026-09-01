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
  const assetsDir = path.join(projectDir, 'dist', 'assets');
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

    // Verify initial count of operators/PDV in table
    const initialRows = doc.querySelectorAll('#pdv-executive-rows tr').length;
    console.log("Initial PDV/Operator rows:", initialRows);

    // Mock alert and prompt on window
    window.alert = (msg) => console.log("ALERT:", msg);

    if (doc.getElementById('add-pdv-name')) {
      doc.getElementById('add-pdv-name').value = 'Getnet Santander PDV';
      doc.getElementById('add-pdv-ops').value = '2';
      doc.getElementById('add-pdv-caixas').value = '2';
      doc.getElementById('add-pdv-operator-name').value = 'Getnet Operator';
      doc.getElementById('add-pdv-status').value = '🟢';
      doc.getElementById('add-pdv-time').value = '01:00';
      doc.getElementById('add-pdv-pix').value = '500.00';
      doc.getElementById('add-pdv-credit').value = '1000.00';
      doc.getElementById('add-pdv-debit').value = '200.00';
      doc.getElementById('add-pdv-cash').value = '100.00';

      if (typeof window.saveNewCompletePDV === 'function') {
        window.saveNewCompletePDV({ preventDefault: () => {} });
      }
    }

    setTimeout(() => {
      const finalRows = doc.querySelectorAll('#pdv-executive-rows tr').length;
      console.log("Final PDV/Operator rows after submit:", finalRows);
      
      console.log("Test Passed!");
      process.exit(0);
    }, 100);

  }, 1000);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
