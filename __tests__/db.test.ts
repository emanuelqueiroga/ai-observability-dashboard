import { describe, expect, it, beforeEach, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("pg", () => ({
  Pool: class {
    query = queryMock;
  },
}));

async function importDb() {
  vi.resetModules();
  return await import("@/lib/db");
}

describe("postgres db", () => {
  beforeEach(() => {
    queryMock.mockReset();
    delete process.env.DATABASE_URL;
  });

  it("throws a useful error when DATABASE_URL is missing", async () => {
    const db = await importDb();

    await expect(db.query("SELECT 1")).rejects.toThrow("DATABASE_URL is missing");
  });

  it("delegates queries to the pool", async () => {
    process.env.DATABASE_URL = "postgresql://x:y@localhost:5432/z";
    queryMock.mockResolvedValue({ rows: [{ ok: true }] });

    const db = await importDb();

    await expect(db.query("SELECT 1")).resolves.toEqual({ rows: [{ ok: true }] });
    expect(queryMock).toHaveBeenCalledWith("SELECT 1", undefined);
  });
});
