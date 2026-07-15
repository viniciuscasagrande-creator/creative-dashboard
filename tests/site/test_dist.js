const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log("Reading built HTML from dist/index.html...");
const projectDir = path.join(__dirname, '..', '..');
const htmlPath = path.join(projectDir, 'dist', 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error("dist/index.html does not exist!");
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const dom = new JSDOM(html);
const doc = dom.window.document;

const negSection = doc.getElementById('view-financial-negotiations');
console.log("Negotiations section in dist/index.html exists:", !!negSection);

const negSelect = doc.getElementById('neg-event-select');
console.log("neg-event-select in dist/index.html exists:", !!negSelect);

const paramRows = doc.getElementById('neg-advanced-param-rows');
console.log("neg-advanced-param-rows in dist/index.html exists:", !!paramRows);

if (negSection && negSelect && paramRows) {
  console.log("Success! Built file contains the updated HTML structure.");
  process.exit(0);
} else {
  console.error("Error: Built file does NOT contain the updated HTML structure!");
  process.exit(1);
}
