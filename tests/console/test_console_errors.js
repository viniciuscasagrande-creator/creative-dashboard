const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const projectDir = path.join(__dirname, '..', '..');
const distDir = path.join(projectDir, 'dist');
const htmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error("dist/index.html not found! Build first.");
  process.exit(1);
}

const virtualConsole = new VirtualConsole();
virtualConsole.on("log", (message) => {
  console.log("[BROWSER LOG]", message);
});
virtualConsole.on("error", (message) => {
  console.error("[BROWSER ERROR]", message);
});
virtualConsole.on("warn", (message) => {
  console.warn("[BROWSER WARNING]", message);
});

console.log("Loading dist/index.html using JSDOM.fromFile...");
JSDOM.fromFile(htmlPath, {
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
}).then((dom) => {
  // Wait 3 seconds for scripts to execute
  setTimeout(() => {
    console.log("Simulation finished.");
    process.exit(0);
  }, 3000);
}).catch(err => {
  console.error("JSDOM load error:", err);
  process.exit(1);
});
