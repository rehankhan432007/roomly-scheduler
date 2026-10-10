#!/usr/bin/env node
/**
 * export-part.mjs <N>
 * Exports part N files to handoff/part-N.zip
 */
import { createReadStream, createWriteStream, statSync } from 'node:fs';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createGzip } from 'node:zlib';
import { ZipArchive } from 'archiver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const partNum = process.argv[2];
if (!partNum || !['1','2','3','4'].includes(partNum)) {
  console.error('Usage: node scripts/export-part.mjs <1|2|3|4>');
  process.exit(1);
}

const ownership = JSON.parse(await readFile(path.join(root, 'ownership.json'), 'utf8'));
const contractVersion = (await readFile(path.join(root, 'CONTRACT_VERSION'), 'utf8')).trim();

// Check git status
const gitStatus = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
if (gitStatus.error) {
  // Init git if needed
  spawnSync('git', ['init'], { cwd: root });
  spawnSync('git', ['add', '-A'], { cwd: root });
  spawnSync('git', ['commit', '-m', 'initial'], { cwd: root, env: { ...process.env, GIT_AUTHOR_NAME: 'builder', GIT_AUTHOR_EMAIL: 'build@meetmaze.dev', GIT_COMMITTER_NAME: 'builder', GIT_COMMITTER_EMAIL: 'build@meetmaze.dev' } });
}

// Get owned globs for this part
const partGlobs = ownership.parts[partNum];
const { minimatch } = await import('minimatch');

// Match a file path against globs
function matchesGlobs(file, globs) {
  const rel = file.replace(/\\/g, '/');
  return globs.some(g => minimatch(rel, g, { matchBase: false }));
}

// Get changed files
const status2 = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
const changedFiles = (status2.stdout ?? '')
  .split('\n')
  .filter(Boolean)
  .map(l => l.slice(3).trim())
  .filter(f => !f.includes('node_modules') && !f.includes('.next') && !f.includes('dist'));

const allGlobs = [...(ownership.skeleton ?? []), ...partGlobs];
const violations = changedFiles.filter(f => !matchesGlobs(f, allGlobs));
if (violations.length > 0) {
  console.error('ERROR: These files are outside your ownership globs:');
  violations.forEach(f => console.error(' ', f));
  process.exit(1);
}

// Check handoff doc exists
const handoffDoc = path.join(root, `docs/parts/PART_${partNum}_HANDOFF.md`);
try { await access(handoffDoc); } catch {
  console.error(`ERROR: Missing docs/parts/PART${partNum}HANDOFF.md`);
  process.exit(1);
}

// Write HANDOFF.json
const handoffJson = {
  part: parseInt(partNum),
  contractVersion,
  createdAt: new Date().toISOString(),
  ownedFiles: partGlobs,
  extraDependencies: { api: {}, web: {}, shared: {} },
  envVars: [
    { key: 'HOLD_TTL_SECONDS', default: '300', description: 'Seconds a HELD slot stays active before auto-release' },
    { key: 'CHECKIN_OPEN_BEFORE_MIN', default: '10', description: 'Minutes before meeting start that QR check-in opens' },
    { key: 'DEFAULT_CHECKIN_GRACE_MIN', default: '15', description: 'Minutes after start before unreleased room is auto-released' },
  ],
  migrations: ['301_part3_history'],
  seeds: ['301_part3_history'],
  providesServices: ['bookings', 'search'],
  consumesServices: ['rooms', 'insights', 'ranking', 'notifications'],
  apiEndpoints: [
    'POST /search/rooms', 'GET /rooms/:id/availability',
    'POST /bookings/check-conflicts', 'POST /bookings/hold', 'POST /bookings/:id/confirm',
    'POST /bookings/:id/cancel', 'POST /bookings', 'GET /bookings', 'GET /bookings/:id',
    'GET /me/calendar', 'PATCH /bookings/:id',
  ],
  webRoutes: ['/client', '/client/search', '/client/rooms/[id]', '/client/bookings', '/client/bookings/[id]', '/client/calendar'],
  navItems: ['Home (200)', 'Find a room (210)', 'My bookings (220)', 'Calendar (230)'],
  slotsProvided: [],
  slotsUsed: ['booking.card.actions', 'booking.detail.sections', 'room.detail.sections', 'client.home.widgets'],
  assumptions: [],
  knownIssues: [],
};

await mkdir(path.join(root, 'handoff'), { recursive: true });
await writeFile(path.join(root, 'handoff/HANDOFF.json'), JSON.stringify(handoffJson, null, 2));

// Create zip
const outPath = path.join(root, `handoff/part-${partNum}.zip`);
const output = createWriteStream(outPath);
const archive = new ZipArchive({ zlib: { level: 9 } });

await new Promise((resolve, reject) => {
  output.on('close', resolve);
  archive.on('error', reject);
  archive.pipe(output);

  // Add owned files
  for (const glob of partGlobs) {
    archive.glob(glob, { cwd: root, ignore: ['node_modules/**', '.next/**', 'dist/**', '**/*.env', '**/*.generated.ts'] });
  }
  archive.file(path.join(root, 'handoff/HANDOFF.json'), { name: 'HANDOFF.json' });
  archive.file(path.join(root, `docs/parts/PART_${partNum}_HANDOFF.md`), { name: `PART_${partNum}_HANDOFF.md` });
  archive.finalize();
});

// SHA-256
const hash = createHash('sha256');
const stream = createReadStream(outPath);
for await (const chunk of stream) hash.update(chunk);
const sha256 = hash.digest('hex');

console.log(`\nExport successful!`);
console.log(`Bundle: ${outPath}`);
console.log(`SHA-256: ${sha256}`);
