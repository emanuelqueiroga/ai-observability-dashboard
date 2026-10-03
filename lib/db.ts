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
