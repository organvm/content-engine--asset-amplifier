import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// infra/ is not a pnpm workspace member, so the `@cronus/*` packages are not
// symlinked into a local node_modules the way they are for each service. Vite
// pre-resolves the string-literal dynamic imports in the E2E test during import
// analysis (before the DATABASE_URL `runIf` gate applies), so those specifiers
// must resolve or collection fails with ERR_MODULE_NOT_FOUND. Alias them to the
// workspace sources; the suite itself still self-skips unless DATABASE_URL is set.
const pkg = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@cronus/db': pkg('../../packages/db/src/index.ts'),
      '@cronus/scoring': pkg('../../services/scoring/src/index.ts'),
    },
  },
  test: {
    include: ['**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
