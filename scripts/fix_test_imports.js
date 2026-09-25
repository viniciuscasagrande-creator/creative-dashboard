import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testsDir = path.resolve(__dirname, '../tests/fases');

const files = fs.readdirSync(testsDir);
for (const file of files) {
  if (file.endsWith('.js')) {
    const filePath = path.join(testsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    if (content.includes('path.') && !content.includes("from 'path'") && !content.includes('from "path"')) {
      content = "import path from 'path';\n" + content;
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Corrigido import path em: ${file}`);
    }
  }
}
console.log('Verificação de imports de testes concluída!');
