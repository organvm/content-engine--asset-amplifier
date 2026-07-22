#!/usr/bin/env node
// verify-docs.mjs — the CLAUDE.md drift predicate.
//
// Asserts that CLAUDE.md's structural claims match the actual repo tree, so the
// doc cannot silently rot the way it did before this check existed. Exit 0 iff
// the doc matches reality; exit 1 with a per-failure report otherwise.
//
//   node scripts/verify-docs.mjs            # from repo root (CI)
//   node scripts/verify-docs.mjs <rootDir>  # against another checkout
//
// Checks: (1) every apps/* dir is named in CLAUDE.md; (2) services count matches
// the "N total" claim and every dir is named; (3) schema-file count matches the
// "N tables" claim and every table is named; (4) wrangler [alias] targets resolve
// and the Node-only services are NOT aliased into the Worker bundle; (5) every
// file path referenced by a root package.json script exists (catches the dead
// `infra/scripts/seed.ts` path that this predicate was born from).

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? process.cwd());
const failures = [];
const fail = (msg) => failures.push(msg);

const read = (p) => readFileSync(join(root, p), 'utf8');
const dirs = (p) => {
  const abs = join(root, p);
  return existsSync(abs)
    ? readdirSync(abs, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
    : [];
};

const claude = read('CLAUDE.md');

// (1) Apps — every apps/* dir must be named in CLAUDE.md.
const apps = dirs('apps');
for (const a of apps) {
  if (!claude.includes(a)) fail(`app "${a}" exists in apps/ but is not mentioned in CLAUDE.md`);
}

// (2) Services — count matches the "N total" claim; every dir is named.
const services = dirs('services');
const svcClaim = claude.match(/services\/\*`?,?\s*(\d+)\s*total/i) ?? claude.match(/(\d+)\s*total/i);
if (svcClaim && Number(svcClaim[1]) !== services.length) {
  fail(`CLAUDE.md claims ${svcClaim[1]} services total, but services/ has ${services.length}`);
}
for (const s of services) {
  if (!claude.includes(s)) fail(`service "${s}" exists in services/ but is not mentioned in CLAUDE.md`);
}

// (3) Tables — schema-file count matches the "N tables" claim; every table is named
// (schema files are kebab-case, table names snake_case: check both variants).
const schemaDir = 'packages/db/src/schema';
const tableFiles = existsSync(join(root, schemaDir))
  ? readdirSync(join(root, schemaDir)).filter((f) => f.endsWith('.ts') && f !== 'index.ts')
  : [];
const tableClaim = claude.match(/(\d+)\s*tables/i);
if (tableClaim && Number(tableClaim[1]) !== tableFiles.length) {
  fail(`CLAUDE.md claims ${tableClaim[1]} tables, but ${schemaDir}/ has ${tableFiles.length}`);
}
for (const f of tableFiles) {
  const base = f.replace(/\.ts$/, '');
  if (!claude.includes(base) && !claude.includes(base.replace(/-/g, '_'))) {
    fail(`table "${base}" (schema file ${f}) is not mentioned in CLAUDE.md`);
  }
}

// (4) wrangler [alias] — Node-only services must not be aliased; targets must resolve.
const NODE_ONLY = ['audience-engine', 'video-renderer', 'webhook-dispatcher'];
if (existsSync(join(root, 'apps/api/wrangler.toml'))) {
  const toml = read('apps/api/wrangler.toml');
  const block = toml.slice(toml.indexOf('[alias]'));
  for (const line of block.split('\n').slice(1)) {
    if (line.startsWith('[')) break;
    const m = line.match(/"([^"]+)"\s*=\s*"([^"]+)"/);
    if (!m) continue;
    const [, pkg, target] = m;
    if (NODE_ONLY.some((n) => pkg.endsWith('/' + n))) {
      fail(`Node-only service in "${pkg}" is aliased into the Worker bundle — CLAUDE.md says it must not be`);
    }
    if (!existsSync(resolve(join(root, 'apps/api'), target))) {
      fail(`wrangler alias "${pkg}" points at a missing file: ${target}`);
    }
  }
}

// (5) Referenced script paths — every file path a root package.json script runs must exist.
const pkg = JSON.parse(read('package.json'));
for (const [name, cmd] of Object.entries(pkg.scripts ?? {})) {
  const tokens = String(cmd).match(/[\w./-]+\.(?:ts|tsx|mjs|cjs|js|sh|ya?ml)/g) ?? [];
  for (const t of tokens) {
    if (t.includes('/') && !existsSync(join(root, t))) {
      fail(`package.json script "${name}" references a missing path: ${t}`);
    }
  }
}

if (failures.length) {
  console.error(`✗ CLAUDE.md drift detected (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `✓ CLAUDE.md matches the tree: ${apps.length} apps, ${services.length} services, ` +
    `${tableFiles.length} tables; wrangler aliases + package.json script paths resolve.`,
);
