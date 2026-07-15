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

console.log("Launching JSDOM from file with jsdomError listener...");

JSDOM.fromFile(htmlPath, {
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
}).then((dom) => {
  setTimeout(() => {
    console.log("=== Browser Logs ===");
    logs.forEach(l => console.log("LOG:", l));
    
    console.log("=== Browser Errors ===");
    errors.forEach(e => console.error(e));

    console.log("=== Scope Checks ===");
    console.log("window.App defined:", typeof dom.window.App !== 'undefined');
    console.log("window.bootstrap defined:", typeof dom.window.bootstrap !== 'undefined');

    process.exit(0);
  }, 3500);
}).catch(err => {
  console.error("JSDOM load error:", err);
  process.exit(1);
});
