import { describe, expect, it, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/events/route";

const projectId = "proj_test";

beforeEach(() => {
  delete process.env.DATABASE_URL;
});

describe("/api/events", () => {
  it("returns 503 when DATABASE_URL is missing", async () => {
    const response = await GET(new Request("http://localhost/api/events"));

    expect(response.status).toBe(503);
  });

  it("returns 400 on malformed POST body", async () => {
    const response = await POST(
      new Request("http://localhost/api/events", {
        method: "POST",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
  });
});
