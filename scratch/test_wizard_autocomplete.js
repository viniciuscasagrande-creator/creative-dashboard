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

console.log("Diagnosing wizard autocomplete...");

async function findActivePortAndFetch() {
  const ports = [5173, 5174, 5175, 5176];
  for (const port of ports) {
    try {
      const html = await fetchUrl(`http://localhost:${port}/`);
      if (html.includes('id="main-content"')) {
        const jsCode = await fetchUrl(`http://localhost:${port}/src/app.js`);
        return { html, jsCode, port };
      }
    } catch (e) {}
  }
  throw new Error("Could not find active dev server on ports 5173-5176");
}

findActivePortAndFetch().then(({ html, jsCode, port }) => {
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
    constructor() {}
    destroy() {}
  };

  // Mock UI functions to prevent eval errors
  window.createUiCard = () => {};
  window.createUiTable = () => {};
  window.createUiModal = () => {};
  window.createUiChart = () => {};

  try {
    window.eval(cleanJs);
  } catch (err) {
    console.error("Eval failed:", err.message);
    process.exit(1);
  }

  setTimeout(() => {
    // Select dropdown element
    const select = doc.getElementById('wiz-prod-select');
    if (!select) {
      console.error("wiz-prod-select dropdown not found!");
      process.exit(1);
    }
    
    console.log("Simulating selection of DiskIngressos (prod-1)...");
    select.value = 'prod-1';
    window.selectWizardProducer('prod-1');

    const cnpjVal = doc.getElementById('wiz-prod-cnpj').value;
    const nameVal = doc.getElementById('wiz-prod-name').value;
    const respVal = doc.getElementById('wiz-prod-resp').value;

    console.log("Populated CNPJ:", cnpjVal);
    console.log("Populated Name:", nameVal);
    console.log("Populated Responsible:", respVal);

    if (cnpjVal === '08.123.456/0001-99' && nameVal === 'DiskIngressos Eventos Ltda') {
      console.log("SUCCESS: Autocomplete filled values correctly!");
      
      console.log("Simulating selection of manual option (clearing values)...");
      select.value = '';
      window.selectWizardProducer('');
      
      const clearedCnpj = doc.getElementById('wiz-prod-cnpj').value;
      if (clearedCnpj === '') {
        console.log("SUCCESS: Selecting manual option cleared the fields!");
        process.exit(0);
      } else {
        console.error("FAILURE: Fields were not cleared. CNPJ is still:", clearedCnpj);
        process.exit(1);
      }
    } else {
      console.error("FAILURE: Autocomplete values are incorrect!");
      process.exit(1);
    }
  }, 1000);
}).catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
