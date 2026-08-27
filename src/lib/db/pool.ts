import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool, types, type QueryResultRow } from "pg";

types.setTypeParser(1082, (value) => value);

const DEFAULT_DATABASE_URL =
  "postgres://leavewise:leavewise@127.0.0.1:5433/leavewise";

function databaseUrl() {
  return process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
}

function createPool(connectionString: string) {
  const parsed = new URL(connectionString);
  return new Pool({
    host: parsed.hostname,
    port: Number(parsed.port || 5433),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    max: 10,
  });
}

type PoolCache = { pool: Pool; url: string };

const globalForDb = globalThis as unknown as { leavewiseDb?: PoolCache };

function getPool(): Pool {
  const url = databaseUrl();
  const cached = globalForDb.leavewiseDb;
  if (cached?.url === url) {
    return cached.pool;
  }
  void cached?.pool.end().catch(() => undefined);
  const pool = createPool(url);
  globalForDb.leavewiseDb = { pool, url };
  return pool;
}

export const pool = getPool();

let schemaPromise: Promise<void> | null = null;

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = readFileSync(join(process.cwd(), "db/schema.sql"), "utf8");
      await pool.query(sql);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  await ensureSchema();
  return pool.query<T>(text, params);
}
