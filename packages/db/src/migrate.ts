import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

/**
 * Applies the hand-authored SQL migrations in packages/db/src/migrations/ in
 * filename order, tracking applied files in a `_migrations` table so re-runs are
 * idempotent. This is the runner behind `pnpm db:migrate` (and dev-setup.sh);
 * the migrations are plain SQL, not drizzle-kit-managed, so drizzle-kit migrate
 * (which needs a meta/_journal.json snapshot) does not apply them.
 */
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required to run migrations');
  process.exit(1);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
const sql = postgres(url, { max: 1 });

async function main() {
  await sql`CREATE TABLE IF NOT EXISTS _migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`;
  const applied = new Set(
    (await sql`SELECT name FROM _migrations`).map((r) => r.name as string),
  );

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip   ${file} (already applied)`);
      continue;
    }
    const ddl = readFileSync(join(migrationsDir, file), 'utf8');
    console.log(`apply  ${file}`);
    await sql.begin(async (tx) => {
      await tx.unsafe(ddl);
      await tx`INSERT INTO _migrations (name) VALUES (${file})`;
    });
  }
  console.log('migrations complete');
}

main()
  .then(() => sql.end())
  .catch(async (err) => {
    console.error('migration failed:', err);
    await sql.end();
    process.exit(1);
  });
