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

    // Se tiver path.resolve(__dirname, 'index.html')
    if (content.includes("path.resolve(__dirname, 'index.html')")) {
      content = content.replace("path.resolve(__dirname, 'index.html')", "path.resolve(__dirname, '../../index.html')");
      changed = true;
    }
    if (content.includes('path.resolve(__dirname, "index.html")')) {
      content = content.replace('path.resolve(__dirname, "index.html")', 'path.resolve(__dirname, "../../index.html")');
      changed = true;
    }
    if (content.includes("fs.readFileSync('index.html'")) {
      content = content.replace("fs.readFileSync('index.html'", "fs.readFileSync(path.resolve(__dirname, '../../index.html')");
      changed = true;
    }
    if (content.includes('fs.readFileSync("index.html"')) {
      content = content.replace('fs.readFileSync("index.html"', 'fs.readFileSync(path.resolve(__dirname, "../../index.html")');
      changed = true;
    }
    // E certifique-se que import path está no topo se usou path
    if (content.includes('path.') && !content.includes("from 'path'") && !content.includes('from "path"')) {
      content = "import path from 'path';\n" + content;
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Caminhos ajustados em: ${file}`);
    }
  }
}

console.log('Ajustes de caminhos em tests/fases/ finalizados com sucesso.');
