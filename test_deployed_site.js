const { JSDOM, VirtualConsole } = require('jsdom');

const virtualConsole = new VirtualConsole();
const logs = [];
const errors = [];

virtualConsole.on("log", (msg) => logs.push(msg));
virtualConsole.on("error", (msg) => errors.push(msg));
virtualConsole.on("warn", (msg) => logs.push("[WARN] " + msg));
virtualConsole.on("jsdomError", (err) => errors.push("[JSDOM ERROR] " + err.message + "\nStack: " + err.stack));

console.log("Loading deployed site from URL...");

JSDOM.fromURL("https://financeiropdtnovo.web.app/", {
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
}).then((dom) => {
  // Let it load external resources over HTTPS (JSDOM supports HTTPS resources!)
  setTimeout(() => {
    console.log("=== Deployed Site Logs ===");
    logs.forEach(l => console.log("LOG:", l));
    
    console.log("=== Deployed Site Errors ===");
    errors.forEach(e => console.error(e));

    console.log("=== Scope Checks ===");
    console.log("window.App defined:", typeof dom.window.App !== 'undefined');
    console.log("window.bootstrap defined:", typeof dom.window.bootstrap !== 'undefined');

    const doc = dom.window.document;
    const submenus = doc.querySelectorAll('.nav-item-submenu > .nav-link');
    console.log(`Found ${submenus.length} submenu headers.`);

    if (submenus.length > 0) {
      const first = submenus[0];
      const parent = first.closest('.nav-item-submenu');
      console.log("Before click, parent classes:", parent.className);
      try {
        first.click();
        console.log("After click, parent classes:", parent.className);
      } catch (e) {
        console.error("Click error:", e.message);
      }
    }

    process.exit(0);
  }, 4000);
}).catch(err => {
  console.error("Fetch error:", err);
  process.exit(1);
});
