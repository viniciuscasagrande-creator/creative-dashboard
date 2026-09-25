import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Organizando arquivos do projeto em pastas padronizadas...');
console.log('Diretório Raiz:', rootDir);

// 1. Criar pastas de destino se não existirem
const targetDirs = [
  'docs/relatorios',
  'docs/mapas',
  'docs/arquitetura',
  'docs/prompts',
  'backups',
  'scripts',
  'tests/fases',
  'src/examples'
];

targetDirs.forEach(d => {
  const fullPath = path.join(rootDir, d);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Criado diretório: ${d}`);
  }
});

// Helper de movimentação
function moveFile(srcRelative, destRelative) {
  const src = path.join(rootDir, srcRelative);
  const dest = path.join(rootDir, destRelative);
  if (fs.existsSync(src)) {
    // Garante que o diretório pai de destino existe
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    console.log(`  ✓ ${srcRelative} -> ${destRelative}`);
    return true;
  }
  return false;
}

// 2. Mover Documentação
console.log('\n1. Movendo Documentações e Relatórios...');
const rootFiles = fs.readdirSync(rootDir);

rootFiles.forEach(file => {
  if (file.startsWith('RELATORIO_') && file.endsWith('.md')) {
    moveFile(file, `docs/relatorios/${file}`);
  } else if (file.startsWith('MAPA_') && file.endsWith('.md')) {
    moveFile(file, `docs/mapas/${file}`);
  } else if (file.startsWith('ARQUITETURA_') && file.endsWith('.md')) {
    moveFile(file, `docs/arquitetura/${file}`);
  } else if (file.startsWith('USER_PROMPT_') && file.endsWith('.md')) {
    moveFile(file, `docs/prompts/${file}`);
  }
});

// 3. Mover Backups
console.log('\n2. Movendo Arquivos de Backup (.zip e .bak)...');
rootFiles.forEach(file => {
  if (file.startsWith('backup_') && file.endsWith('.zip')) {
    moveFile(file, `backups/${file}`);
  } else if (file.includes('.bak')) {
    moveFile(file, `backups/${file}`);
  }
});

const srcFiles = fs.existsSync(path.join(rootDir, 'src')) ? fs.readdirSync(path.join(rootDir, 'src')) : [];
srcFiles.forEach(file => {
  if (file.includes('.bak')) {
    moveFile(`src/${file}`, `backups/${file}`);
  } else if (file.endsWith('Example.tsx')) {
    moveFile(`src/${file}`, `src/examples/${file}`);
  }
});

// 4. Mover scripts antigos da raiz
console.log('\n3. Movendo Scripts...');
if (fs.existsSync(path.join(rootDir, 'reorganize.js'))) {
  moveFile('reorganize.js', 'scripts/reorganize.js');
}

// 5. Mover Testes das Fases para tests/fases/
console.log('\n4. Movendo Testes das Fases para tests/fases/ e ajustando caminhos relativos...');
rootFiles.forEach(file => {
  if ((file.startsWith('test_phase_') || file === 'test_unified_payouts.js') && file.endsWith('.js')) {
    const srcPath = path.join(rootDir, file);
    let content = fs.readFileSync(srcPath, 'utf8');

    // Ajusta imports relativos de ./src/ para ../../src/
    content = content.replace(/from\s+['"]\.\/src\//g, "from '../../src/");
    content = content.replace(/from\s+['"]\.\/index\.html['"]/g, "from '../../index.html'");
    
    // Ajusta fs.readFileSync('index.html') para resolver no root
    content = content.replace(/fs\.readFileSync\(['"]index\.html['"]/g, "fs.readFileSync(path.resolve('index.html')");

    const destRelative = `tests/fases/${file}`;
    const destPath = path.join(rootDir, destRelative);
    fs.writeFileSync(destPath, content, 'utf8');
    fs.unlinkSync(srcPath);
    console.log(`  ✓ ${file} -> ${destRelative} (imports atualizados)`);
  }
});

// 6. Remover pasta fantasma 'principais'
console.log('\n5. Removendo diretórios fantasmas / residuais...');
const principaisPath = path.join(rootDir, 'principais');
if (fs.existsSync(principaisPath)) {
  fs.rmSync(principaisPath, { recursive: true, force: true });
  console.log('  ✓ Diretório fantasma "principais/" removido com sucesso.');
}

// 7. Atualizar .gitignore para incluir backups/ e *.bak
console.log('\n6. Atualizando .gitignore...');
const gitignorePath = path.join(rootDir, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  let gitignore = fs.readFileSync(gitignorePath, 'utf8');
  let updated = false;
  if (!gitignore.includes('backups/')) {
    gitignore += '\nbackups/\n*.bak*\n';
    updated = true;
  }
  if (updated) {
    fs.writeFileSync(gitignorePath, gitignore.trim() + '\n', 'utf8');
    console.log('  ✓ .gitignore atualizado com backups/ e *.bak*');
  }
}

console.log('\nOrganização concluída com sucesso!');
