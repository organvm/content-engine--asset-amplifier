import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// infra/ is not a pnpm workspace member, so the `@cronus/*` packages (and their
// third-party deps like drizzle-orm) are not symlinked into a local node_modules
// the way they are for each service. Vite pre-resolves the string-literal imports
// in the E2E test during import analysis (before the DATABASE_URL `runIf` gate
// applies), so those specifiers must resolve or collection fails with
// ERR_MODULE_NOT_FOUND. Alias the workspace sources, and resolve drizzle-orm
// through packages/db (where it is a real dependency) so no version-pinned pnpm
// path is hard-coded. The suite itself still self-skips unless DATABASE_URL is set.
const pkg = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const requireFromDb = createRequire(pkg('../../packages/db/package.json'));

export default defineConfig({
  resolve: {
    // Array form + an exact-match regex for drizzle-orm so that subpath imports
    // (e.g. drizzle-orm/postgres-js used inside packages/db) are left untouched.
    alias: [
      { find: '@cronus/db', replacement: pkg('../../packages/db/src/index.ts') },
      { find: '@cronus/scoring', replacement: pkg('../../services/scoring/src/index.ts') },
      { find: /^drizzle-orm$/, replacement: requireFromDb.resolve('drizzle-orm') },
    ],
  },
  test: {
    include: ['**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
