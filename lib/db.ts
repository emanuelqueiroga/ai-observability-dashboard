import { Pool } from "pg";

const globalForDb = globalThis as unknown as { pgPool?: Pool };

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  if (!globalForDb.pgPool) {
    globalForDb.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 2_000,
    });
  }

  return globalForDb.pgPool;
}

export async function query<T extends Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<{ rows: T[] }> {
  return getPool().query(text, params) as Promise<{ rows: T[] }>;
}

export type SqlExecutor = (
  text: string,
  params?: unknown[],
) => Promise<{ rows: unknown[] }>;

/**
 * Runs `run` inside a database transaction so multi-statement writes (an event
 * plus its derived alerts) either all land or none do. When the pool cannot
 * open a dedicated client (e.g. a lightweight test double), statements run
 * inline against `query` so the same call sites remain testable.
 */
export async function withTransaction<T>(
  run: (execute: SqlExecutor) => Promise<T>,
): Promise<T> {
  const pool = getPool();

  if (typeof (pool as { connect?: unknown }).connect !== "function") {
    return run((text, params) => query<Record<string, unknown>>(text, params));
  }

  const client = await pool.connect();

  try {
    await client.query("begin");
    const result = await run((text, params) => client.query(text, params));
    await client.query("commit");
    return result;
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      // Preserve the original failure; a rollback error is secondary.
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * `timestamptz` columns come back from `pg` as `Date` objects (or strings when
 * the driver is mocked). Normalize them to ISO strings so the API/UI layer
 * always receives a stable, JSON-serializable shape.
 */
export function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

/** Guards against driver-specific error shapes when inspecting SQLSTATE codes. */
export function isPgErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === code
  );
}
