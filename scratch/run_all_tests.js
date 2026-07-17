const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const testFiles = getFiles(path.join(__dirname, '..', 'tests'));
console.log(`Found ${testFiles.length} test files.`);

let failed = false;
testFiles.forEach(file => {
  const relativePath = path.relative(path.join(__dirname, '..'), file);
  console.log(`\n========================================`);
  console.log(`RUNNING: ${relativePath}`);
  console.log(`========================================`);
  try {
    execSync(`node "${file}"`, { stdio: 'inherit' });
    console.log(`SUCCESS: ${relativePath}`);
  } catch (error) {
    console.error(`FAILED: ${relativePath}`);
    failed = true;
  }
});

if (failed) {
  process.exit(1);
} else {
  console.log('\nAll tests completed successfully!');
  process.exit(0);
}
