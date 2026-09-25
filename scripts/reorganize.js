const fs = require('fs');
const path = require('path');

// 1. Define target directories
const dirs = [
  'src/components',
  'src/pages',
  'src/services',
  'src/utils',
  'src/config',
  'tests/financeiro',
  'tests/gateway',
  'tests/operadores',
  'tests/site',
  'tests/console'
];

console.log("Creating directory structure...");
dirs.forEach(d => {
  const fullPath = path.join(__dirname, d);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created: ${d}`);
  }
});

// 2. Define file moves
const moves = [
  { src: 'app.js', dest: 'src/app.js' },
  { src: 'styles.css', dest: 'src/styles.css' },
  { src: 'firebase-db.js', dest: 'src/services/firebase-db.js' },
  
  // Tests -> tests/financeiro
  { src: 'test_negociacoes_financeiro.js', dest: 'tests/financeiro/test_negociacoes_financeiro.js' },
  { src: 'test_pdv_financeiro.js', dest: 'tests/financeiro/test_pdv_financeiro.js' },
  { src: 'test_click_saldo.js', dest: 'tests/financeiro/test_click_saldo.js' },
  
  // Tests -> tests/gateway
  { src: 'test_add_new_gateway.js', dest: 'tests/gateway/test_add_new_gateway.js' },
  { src: 'test_gateway_tabs.js', dest: 'tests/gateway/test_gateway_tabs.js' },
  
  // Tests -> tests/operadores
  { src: 'test_add_operator.js', dest: 'tests/operadores/test_add_operator.js' },
  { src: 'test_click_operators.js', dest: 'tests/operadores/test_click_operators.js' },
  { src: 'test_add_new_pdv_completo.js', dest: 'tests/operadores/test_add_new_pdv_completo.js' },
  
  // Tests -> tests/site
  { src: 'test_live_site.js', dest: 'tests/site/test_live_site.js' },
  { src: 'test_deployed_site.js', dest: 'tests/site/test_deployed_site.js' },
  { src: 'test_dist.js', dest: 'tests/site/test_dist.js' },
  
  // Tests -> tests/console
  { src: 'test_console_errors.js', dest: 'tests/console/test_console_errors.js' },
  { src: 'test_bundle_for_errors.js', dest: 'tests/console/test_bundle_for_errors.js' },
  { src: 'test_app_init.js', dest: 'tests/console/test_app_init.js' },
  { src: 'test_eval_order.js', dest: 'tests/console/test_eval_order.js' },
  { src: 'validate_html.js', dest: 'tests/console/validate_html.js' }
];

console.log("Moving files...");
moves.forEach(m => {
  const srcPath = path.join(__dirname, m.src);
  const destPath = path.join(__dirname, m.dest);
  
  if (fs.existsSync(srcPath)) {
    fs.renameSync(srcPath, destPath);
    console.log(`Moved: ${m.src} -> ${m.dest}`);
  } else {
    console.warn(`File does not exist (skipping): ${m.src}`);
  }
});

// 3. Update index.html references
console.log("Updating index.html references...");
const indexHtmlPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let content = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Replace style sheet path
  content = content.replace(/href="styles\.css\?/g, 'href="src/styles.css?');
  
  // Replace script path
  content = content.replace(/src="app\.js\?/g, 'src="src/app.js?');
  
  fs.writeFileSync(indexHtmlPath, content, 'utf8');
  console.log("Updated references in index.html");
} else {
  console.error("index.html not found!");
}

console.log("Project structure adjusted successfully!");
process.exit(0);
