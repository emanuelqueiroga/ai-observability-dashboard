import { describe, expect, it, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/events/route";

beforeEach(() => {
  delete process.env.DATABASE_URL;
});

describe("/api/events", () => {
  it("returns 503 when DATABASE_URL is missing", async () => {
    const response = await GET(new Request("http://localhost/api/events"));

    expect(response.status).toBe(503);
  });

  it("returns 400 on malformed POST body when DATABASE_URL is set", async () => {
    process.env.DATABASE_URL = "postgresql://x:y@localhost:5432/z";

    const response = await POST(
      new Request("http://localhost/api/events", {
        method: "POST",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
  });
});
