const { JSDOM, VirtualConsole } = require('jsdom');
const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

console.log("Diagnosing local dev server...");

async function findActivePortAndFetch() {
  const ports = [5173, 5174, 5175, 5176];
  for (const port of ports) {
    try {
      console.log(`Checking port ${port}...`);
      const html = await fetchUrl(`http://localhost:${port}/`);
      if (html.includes('id="main-content"')) {
        console.log(`Found active dev server on port ${port}!`);
        const jsCode = await fetchUrl(`http://localhost:${port}/src/app.js`);
        return { html, jsCode, port };
      }
    } catch (e) {
      // Port not active or connection error, try next
    }
  }
  throw new Error("Could not find active dev server on ports 5173-5176");
}

findActivePortAndFetch().then(({ html, jsCode, port }) => {
  console.log(`Successfully fetched index.html and app.js from dev server on port ${port}!`);

  // Remove all ES module imports for JSDOM eval
  let cleanJs = jsCode.replace(/import\s+[^;]+;/g, '');
  
  const virtualConsole = new VirtualConsole();
  const logs = [];
  const errors = [];
  virtualConsole.on("log", (msg) => logs.push(msg));
  virtualConsole.on("error", (msg) => errors.push(msg));
  virtualConsole.on("jsdomError", (err) => errors.push(err.message));

  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: `http://localhost:${port}/`,
    virtualConsole
  });

  const { window } = dom;
  const { document: doc } = window;

  // Mock Chart
  window.Chart = class Chart {
    constructor(ctx, config) {}
    destroy() {}
  };
  window.createUiCard = () => window.document.createElement("div");
  window.createUiTable = () => window.document.createElement("div");
  window.createUiModal = () => window.document.createElement("div");
  window.createUiChart = () => null;

  // Evaluate app.js logic
  window.eval(cleanJs);

  // Wait for load
  setTimeout(() => {
    console.log("=== Logs during load ===");
    logs.forEach(l => console.log("LOG:", l));
    console.log("=== Errors during load ===");
    errors.forEach(e => console.error("ERROR:", e));

    console.log("Clicking Card Operators Link...");
    const links = doc.querySelectorAll('.submenu-link');
    const opLink = Array.from(links).find(l => l.getAttribute('data-view') === 'financial-operators');
    
    if (!opLink) {
      console.error("Card Operators link not found!");
      process.exit(1);
    }

    opLink.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

    setTimeout(() => {
      console.log("=== Logs after click ===");
      const uniqueLogs = [...new Set(logs)];
      uniqueLogs.forEach(l => console.log("LOG:", l));
      console.log("=== Errors after click ===");
      errors.forEach(e => console.error("ERROR:", e));

      const section = doc.getElementById('view-financial-operators');
      console.log("Section display:", section ? section.style.display : "not found");

      if (section && section.style.display === 'flex') {
        console.log("SUCCESS: Card Operators view is visible!");
        process.exit(0);
      } else {
        console.error("FAILURE: Card Operators view is not visible!");
        process.exit(1);
      }
    }, 500);

  }, 1000);
}).catch(err => {
  console.error("Diagnostic failed:", err);
  process.exit(1);
});
