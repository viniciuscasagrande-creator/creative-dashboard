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

console.log("Launching JSDOM for gateway tabs verification...");

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

    // Verify view-financial-operators exists
    const mainSection = doc.getElementById('view-financial-operators');
    console.log("Main section exists:", !!mainSection);

    // Initial state: config tab visible, others hidden
    const configPane = doc.getElementById('gw-tab-config');
    const credentialsPane = doc.getElementById('gw-tab-credentials');
    console.log("Config pane display (initial):", configPane.style.display);
    console.log("Credentials pane display (initial):", credentialsPane.style.display);

    // Click Credentials link
    const credsLink = Array.from(doc.querySelectorAll('#gateway-menu-list .nav-link')).find(el => el.textContent.includes('Credenciais'));
    console.log("Credentials menu link found:", !!credsLink);
    
    // Trigger click on Credentials
    const clickEvent = new dom.window.Event('click', { bubbles: true, cancelable: true });
    credsLink.dispatchEvent(clickEvent);

    setTimeout(() => {
      console.log("Config pane display (after click):", configPane.style.display);
      console.log("Credentials pane display (after click):", credentialsPane.style.display);

      if (configPane.style.display === 'none' && credentialsPane.style.display === 'block') {
        console.log("Test Passed!");
        process.exit(0);
      } else {
        console.error("Test Failed! Tabs did not switch.");
        process.exit(1);
      }
    }, 100);

  }, 1000);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
