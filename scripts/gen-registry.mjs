import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const API_MODULES = join(ROOT, 'apps/api/src/modules');
const WEB_FEATURES = join(ROOT, 'apps/web/src/features');
const API_OUT = join(ROOT, 'apps/api/src/core/modules.generated.ts');
const WEB_OUT = join(ROOT, 'apps/web/src/core/features.generated.ts');

function scanApiModules() {
  if (!existsSync(API_MODULES)) return [];
  return readdirSync(API_MODULES, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .filter(d => existsSync(join(API_MODULES, d.name, 'index.ts')))
    .map(d => d.name)
    .sort();
}

function scanWebFeatures() {
  if (!existsSync(WEB_FEATURES)) return [];
  return readdirSync(WEB_FEATURES, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .filter(d => existsSync(join(WEB_FEATURES, d.name, 'manifest.ts')))
    .map(d => d.name)
    .sort();
}

// Generate API modules registry
const apiModules = scanApiModules();
let apiContent = '// AUTO-GENERATED — do not edit\n';
apiContent += "import type { ApiModule } from '@meetmaze/shared/contracts';\n\n";
for (const m of apiModules) {
  apiContent += `import ${m}Module from '../modules/${m}/index.js';\n`;
}
apiContent += `\nexport const modules: ApiModule[] = [\n`;
for (const m of apiModules) {
  apiContent += `  ${m}Module,\n`;
}
apiContent += '];\n';
writeFileSync(API_OUT, apiContent, 'utf8');
console.log(`[gen-registry] wrote ${API_OUT} (${apiModules.length} modules: ${apiModules.join(', ')})`);

// Generate web features registry
const webFeatures = scanWebFeatures();
let webContent = '// AUTO-GENERATED — do not edit\n';
webContent += "import type { FeatureManifest } from '@meetmaze/shared/contracts';\n\n";
for (const f of webFeatures) {
  webContent += `import ${f}Manifest from '../features/${f}/manifest';\n`;
}
webContent += `\nexport const features: FeatureManifest[] = [\n`;
for (const f of webFeatures) {
  webContent += `  ${f}Manifest,\n`;
}
webContent += '];\n';
writeFileSync(WEB_OUT, webContent, 'utf8');
console.log(`[gen-registry] wrote ${WEB_OUT} (${webFeatures.length} features: ${webFeatures.join(', ')})`);
