import { describe, expect, it } from "vitest";
import { normalizeDatabaseUrl } from "@/lib/migrate.mjs";

describe("migrate helpers", () => {
  it("returns DATABASE_URL when present", () => {
    process.env.DATABASE_URL = "postgresql://x:y@localhost:5432/z";

    expect(normalizeDatabaseUrl()).toBe("postgresql://x:y@localhost:5432/z");
  });

  it("throws when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;

    expect(() => normalizeDatabaseUrl()).toThrow("DATABASE_URL is missing");
  });
});
