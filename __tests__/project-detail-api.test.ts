import { describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("pg", () => ({
  Pool: vi.fn(() => ({ query: queryMock })),
}));

import { GET } from "@/app/api/projects/[slug]/route";

describe("project detail api", () => {
  it("returns 503 when database is unavailable/missing", async () => {
    delete process.env.DATABASE_URL;

    const response = await GET(
      new Request("http://localhost/api/projects/projeto-de-teste"),
      { params: Promise.resolve({ slug: "projeto-de-teste" }) } as never,
    );

    expect(response.status).toBe(503);
  });
});
