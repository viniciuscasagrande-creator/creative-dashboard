const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log("Validating index.html structure...");
const projectDir = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf8');

// Parse using JSDOM
const dom = new JSDOM(html);
const doc = dom.window.document;

// Verify tag counts or structural components
const pageSections = doc.querySelectorAll('.page-section');
console.log("Total page-sections found:", pageSections.length);

pageSections.forEach(sec => {
  console.log(`Section id="${sec.id}" has children count:`, sec.children.length);
});

// Let's check for any parse errors (some JSDOM versions put parse errors in specific properties)
const errors = dom.window.document.querySelector('parsererror');
if (errors) {
  console.error("HTML Parse Error detected:", errors.textContent);
  process.exit(1);
} else {
  console.log("No syntax parseerror element found by JSDOM. Parsing completed.");
}

// Check specific required IDs for the negotiations page
const requiredIds = [
  'view-financial-negotiations',
  'neg-event-select',
  'revenue-neg-table-body',
  'neg-advanced-param-rows',
  'neg-info-param-rows'
];

let allOk = true;
requiredIds.forEach(id => {
  const el = doc.getElementById(id);
  console.log(`Element with id="${id}" exists:`, !!el);
  if (!el) allOk = false;
});

if (allOk) {
  console.log("All required elements are present in index.html!");
  process.exit(0);
} else {
  console.error("Some required elements are missing in index.html!");
  process.exit(1);
}
