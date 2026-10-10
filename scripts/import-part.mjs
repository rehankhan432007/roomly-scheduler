#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import AdmZip from 'adm-zip';

const zipPath = process.argv[2];
if (!zipPath || !zipPath.endsWith('.zip')) {
  console.error('Usage: npm run part:import -- handoff/part-<N>.zip');
  process.exit(1);
}

// 1. Check Git
const status = execSync('git status --porcelain').toString().trim();
if (status.length > 0) {
  console.error('❌ ERROR: Git working directory is not clean. Commit or stash your changes first.');
  process.exit(1);
}

const partMatch = zipPath.match(/part-(\d+)\.zip$/);
if (!partMatch) {
  console.error('❌ ERROR: Filename must be part-<N>.zip');
  process.exit(1);
}
const partNum = partMatch[1];

// 2. Unzip & Validate
console.log(`\n📦 Importing Part ${partNum} from ${zipPath}...`);
const tempDir = `.temp_import_part_${partNum}`;
if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });

const zip = new AdmZip(zipPath);
zip.extractAllTo(tempDir, true);

const handoffJsonPath = join(tempDir, 'HANDOFF.json');
if (!existsSync(handoffJsonPath)) {
  console.error('❌ ERROR: Bundle missing HANDOFF.json');
  rmSync(tempDir, { recursive: true, force: true });
  process.exit(1);
}

const handoff = JSON.parse(readFileSync(handoffJsonPath, 'utf-8'));
const contractVersion = readFileSync('CONTRACT_VERSION', 'utf-8').trim();
if (handoff.contractVersion !== contractVersion) {
  console.error(`❌ ERROR: Bundle contract version (${handoff.contractVersion}) does not match local version (${contractVersion})`);
  rmSync(tempDir, { recursive: true, force: true });
  process.exit(1);
}

// 3. Create branch
const tag = `pre-import-part-${partNum}`;
const branch = `integrate/part-${partNum}`;
try {
  execSync(`git tag -f ${tag}`);
  execSync(`git checkout -b ${branch}`);
} catch (e) {
  console.error('❌ Failed to create branch/tag');
  process.exit(1);
}

// 4. Copy files (excluding HANDOFF.json) and run steps
try {
  console.log('🔄 Merging files...');
  // Extract directly over current directory, AdmZip can overwrite
  const zip2 = new AdmZip(zipPath);
  const entries = zip2.getEntries();
  entries.forEach((e) => {
    if (e.entryName !== 'HANDOFF.json') {
      zip2.extractEntryTo(e, '.', false, true); // true = overwrite
    }
  });

  console.log('📦 Installing dependencies & generating registries...');
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run gen', { stdio: 'inherit' });

  console.log('🗄️ Setting up scratch database...');
  process.env.MYSQL_DATABASE = 'meetmaze_verify'; // Override DB
  execSync('npm run db:reset', { stdio: 'inherit' }); // Note: requires docker mysql running

  console.log('🧪 Running quality checks...');
  execSync('npm run typecheck', { stdio: 'inherit' });
  execSync('npm run lint', { stdio: 'inherit' });
  execSync('npm run test', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });

  // (Smoke test execution would go here using concurrently/wait-on, simplified for this stub)
  
  // 9. Success
  execSync('git add .');
  execSync(`git commit -m "integrate: part ${partNum}"`);
  execSync('git checkout main');
  execSync(`git merge ${branch}`);
  
  console.log(`\n✅ Successfully integrated Part ${partNum}!`);
  
} catch (err) {
  console.error('\n❌ IMPORT FAILED');
  console.error(err.message);
  console.log('🔄 Rolling back to pre-import state...');
  execSync('git reset --hard');
  execSync('git checkout main');
  execSync(`git reset --hard ${tag}`);
  execSync(`git branch -D ${branch}`);
  process.exit(1);
} finally {
  if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
}
