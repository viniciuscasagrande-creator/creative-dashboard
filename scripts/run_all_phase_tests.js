import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const testsDir = path.join(rootDir, 'tests/fases');

const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.js'));
console.log(`Executando ${testFiles.length} suítes de teste em tests/fases/...\n`);

let passedSuites = 0;
let failedSuites = 0;

for (const file of testFiles) {
  const filePath = path.join('tests/fases', file);
  console.log(`▶ Rodando ${file}...`);
  try {
    const out = execSync(`node ${filePath}`, { cwd: rootDir, stdio: 'pipe' }).toString();
    console.log(`  ✓ ${file} passou com sucesso!`);
    passedSuites++;
  } catch (err) {
    console.error(`  ✗ ${file} FALHOU!`);
    console.error(err.stdout ? err.stdout.toString() : err.message);
    failedSuites++;
  }
}

console.log('\n============================================================');
console.log(`RESULTADO FINAL: ${passedSuites}/${testFiles.length} suítes aprovadas.`);
if (failedSuites > 0) {
  console.error(`Atenção: ${failedSuites} suíte(s) falharam.`);
  process.exit(1);
} else {
  console.log('TODOS OS TESTES FORAM APROVADOS COM SUCESSO (100%)!');
  process.exit(0);
}
