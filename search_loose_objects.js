const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = 'C:\\Users\\vinad\\.gemini\\antigravity-cli\\brain\\71bb8937-8dc2-42a4-98e0-eb7cb07a5be5';
const objectsDir = path.join(projectDir, '.git', 'objects');

if (!fs.existsSync(objectsDir)) {
  console.log("No .git/objects directory found.");
  return;
}

const folders = fs.readdirSync(objectsDir).filter(f => f.length === 2 && /^[0-9a-f]{2}$/.test(f));
console.log(`Found ${folders.length} loose object folders in brainDir. Scanning...`);

const candidates = [];

for (const folder of folders) {
  const folderPath = path.join(objectsDir, folder);
  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const sha1 = folder + file;
    try {
      // Get object type and size
      const type = execSync(`git cat-file -t ${sha1}`, { cwd: projectDir }).toString().trim();
      const size = parseInt(execSync(`git cat-file -s ${sha1}`, { cwd: projectDir }).toString().trim(), 10);
      
      if (type === 'blob' && size > 10000) {
        // Read content
        const content = execSync(`git cat-file -p ${sha1}`, { cwd: projectDir, maxBuffer: 15 * 1024 * 1024 });
        const contentStr = content.toString('utf8');
        
        if (contentStr.includes('initAiAssistant')) {
          console.log(`FOUND 'initAiAssistant' in loose blob: ${sha1} | Size: ${size} bytes`);
          const hasViteCrash = !isUtf8(content);
          console.log(`  -> Valid UTF-8: ${!hasViteCrash}`);
          if (contentStr.includes('switchAccountingTab')) {
            console.log(`  -> ALSO FOUND 'switchAccountingTab'! This is a full app.js candidate!`);
            candidates.push({ sha1, size, validUtf8: !hasViteCrash });
          }
        }
      }
    } catch(e) {
      // Ignore errors
    }
  }
}

function isUtf8(buf) {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(buf);
    return true;
  } catch (e) {
    return false;
  }
}

console.log("Scan complete. Candidates:", candidates);
