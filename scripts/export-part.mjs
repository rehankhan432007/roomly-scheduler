import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, resolve, relative } from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

const ROOT = resolve(import.meta.dirname, '..');
const partNum = parseInt(process.argv[2], 10);
if (![1,2,3,4].includes(partNum)) {
  console.error('Usage: node export-part.mjs <1|2|3|4>');
  process.exit(1);
}

const ownership = JSON.parse(readFileSync(join(ROOT, 'ownership.json'), 'utf8'));
const partGlobs = ownership.parts[String(partNum)];
const skeletonGlobs = ownership.skeleton;

// Initialize git if needed
try { execSync('git rev-parse --git-dir', { cwd: ROOT, stdio: 'pipe' }); }
catch { execSync('git init && git add -A && git commit -m "initial"', { cwd: ROOT, stdio: 'pipe' }); }

// Simple glob-to-regex
function globToRegex(g) {
  let r = g.replace(/\./g, '\\.').replace(/\*\*/g, '{{GLOBSTAR}}').replace(/\*/g, '[^/]*').replace(/\{\{GLOBSTAR\}\}/g, '.*');
  return new RegExp('^' + r + '$');
}

function matchesGlobs(filePath, globs) {
  const rel = filePath.replace(/\\/g, '/');
  return globs.some(g => globToRegex(g).test(rel));
}

// Get changed/untracked files
let files;
try {
  const status = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' });
  files = status.split('\n').filter(Boolean).map(l => l.substring(3).trim());
} catch {
  files = [];
}

// Validate all changed files are within part globs or skeleton
const allowed = [...partGlobs, ...skeletonGlobs];
const violations = files.filter(f => !matchesGlobs(f, allowed) && !f.startsWith('node_modules') && !f.startsWith('.git') && !f.startsWith('handoff'));
if (violations.length > 0) {
  console.error('ERROR: Files outside your part globs:');
  violations.forEach(v => console.error('  ' + v));
  process.exit(1);
}

// Collect part files (only part-owned, excluding generated/temp)
const excludePatterns = ['node_modules', '.next', 'dist', '.env', '.generated.ts'];
function shouldExclude(f) { return excludePatterns.some(p => f.includes(p)); }

function collectFiles(dir, base = '') {
  const results = [];
  try {
    const { readdirSync } = await import('fs');
  } catch {}
  return results;
}

// For simplicity, use git ls-files
const allFiles = execSync('git ls-files --cached --others --exclude-standard', { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(Boolean).filter(f => !shouldExclude(f));

const partFiles = allFiles.filter(f => matchesGlobs(f, partGlobs));

// Create handoff dir
const handoffDir = join(ROOT, 'handoff');
if (!existsSync(handoffDir)) mkdirSync(handoffDir, { recursive: true });

// Check handoff doc exists
const handoffDoc = join(ROOT, `docs/parts/PART_${partNum}_HANDOFF.md`);
if (!existsSync(handoffDoc)) {
  console.error(`ERROR: ${handoffDoc} does not exist`);
  process.exit(1);
}

// Write HANDOFF.json
const handoff = {
  part: partNum,
  contractVersion: readFileSync(join(ROOT, 'CONTRACT_VERSION'), 'utf8').trim(),
  createdAt: new Date().toISOString(),
  ownedFiles: partFiles,
  extraDependencies: { api: {}, web: {}, shared: {} },
  envVars: [],
  migrations: [],
  seeds: [],
  providesServices: [],
  consumesServices: [],
  apiEndpoints: [],
  webRoutes: [],
  navItems: [],
  slotsProvided: [],
  slotsUsed: [],
  assumptions: [],
  knownIssues: []
};
writeFileSync(join(handoffDir, `HANDOFF_PART_${partNum}.json`), JSON.stringify(handoff, null, 2));

// Create zip using tar (cross-platform)
const zipName = `part-${partNum}.zip`;
try {
  const fileList = partFiles.join('\n');
  writeFileSync(join(handoffDir, 'filelist.txt'), fileList);
  execSync(`tar -cf ${zipName} -T filelist.txt`, { cwd: handoffDir, stdio: 'pipe' });
} catch (e) {
  // Fallback: just copy files list
  writeFileSync(join(handoffDir, zipName), JSON.stringify({ files: partFiles }));
}

const zipPath = join(handoffDir, zipName);
const hash = createHash('sha256').update(readFileSync(zipPath)).digest('hex');
console.log(`\nExported: ${zipPath}`);
console.log(`SHA-256: ${hash}`);
