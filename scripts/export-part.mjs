#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { createHash } from 'crypto';
import AdmZip from 'adm-zip'; // Note: Requires npm install adm-zip

const PART_N = process.argv[2];
if (!PART_N || !['1', '2', '3', '4'].includes(PART_N)) {
  console.error('Usage: npm run part:export -- <N> (where N is 1, 2, 3, or 4)');
  process.exit(1);
}

// 1. Ensure git is initialized and working tree is readable
try {
  if (!existsSync('.git')) {
    execSync('git init');
    execSync('git add .');
    execSync('git commit -m "Initial commit for export script check"');
  }
} catch (err) {
  console.error('Failed to initialize/read git repo:', err.message);
  process.exit(1);
}

// 2. Load ownership.json
const ownershipStr = readFileSync('ownership.json', 'utf-8');
const ownership = JSON.parse(ownershipStr);
const myGlobs = [...ownership.skeleton, ...ownership.parts[PART_N]];

// Simple glob to regex converter for ownership checking
function globToRegex(glob) {
  let pattern = glob.replace(/\./g, '\\.').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
  return new RegExp(`^${pattern}$`);
}
const regexes = myGlobs.map(globToRegex);

function isFileOwned(file) {
  return regexes.some((regex) => regex.test(file));
}

// 3. Get changed files
const statusOutput = execSync('git status --porcelain').toString().trim();
const changedFiles = statusOutput
  .split('\n')
  .filter((line) => line.length > 0)
  .map((line) => line.slice(3).trim());

// 4. Validate ownership
const offenders = changedFiles.filter((file) => !isFileOwned(file) && !file.startsWith('handoff/'));
if (offenders.length > 0) {
  console.error(`\n❌ ERROR: You have modified files outside of Part ${PART_N}'s ownership boundaries:`);
  offenders.forEach((f) => console.error(`   - ${f}`));
  console.error('\nPlease revert these files or move them into your part before exporting.');
  process.exit(1);
}

// 5. Build HANDOFF.json
const handoffPath = `docs/parts/PART_${PART_N}_HANDOFF.md`;
if (!existsSync(handoffPath)) {
  console.error(`❌ ERROR: Missing ${handoffPath}. Please create it before exporting.`);
  process.exit(1);
}

const handoffMd = readFileSync(handoffPath, 'utf-8');
// Basic frontmatter extraction
const match = handoffMd.match(/^---\n([\s\S]*?)\n---/);
let handoffData = { part: parseInt(PART_N), contractVersion: ownership.contractVersion, createdAt: new Date().toISOString(), ownedFiles: myGlobs };

if (match) {
  try {
    // A real yaml parser would be better, but we fallback to assuming a basic structure for this script
    // In a full environment we'd use js-yaml
    handoffData = { ...handoffData, _yamlFound: true }; 
  } catch (e) {
    console.error('Warning: Could not parse frontmatter in HANDOFF.md');
  }
}

writeFileSync('HANDOFF.json', JSON.stringify(handoffData, null, 2));

// 6. Zip files
const zip = new AdmZip();
const filesToAdd = execSync('git ls-files').toString().trim().split('\n');

filesToAdd.forEach(file => {
  if (isFileOwned(file) && !file.includes('node_modules/') && !file.endsWith('.generated.ts') && file !== '.env') {
    zip.addLocalFile(file, file.includes('/') ? file.substring(0, file.lastIndexOf('/')) : '');
  }
});
zip.addLocalFile('HANDOFF.json');

execSync('mkdir -p handoff');
const zipPath = `handoff/part-${PART_N}.zip`;
zip.writeZip(zipPath);

// 7. Calculate SHA256
const fileBuffer = readFileSync(zipPath);
const hash = createHash('sha256').update(fileBuffer).digest('hex');

console.log(`\n✅ Export successful for Part ${PART_N}!`);
console.log(`📁 Created: ${zipPath}`);
console.log(`🔑 SHA-256: ${hash}`);
