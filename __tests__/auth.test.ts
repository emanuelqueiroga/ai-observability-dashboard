import { describe, expect, it, vi } from "vitest";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as logoutPOST } from "@/app/api/auth/logout/route";

vi.mock("next/headers", () => ({
  cookies: () => ({
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

describe("/api/auth/login", () => {
  it("returns 400 when password field is missing", async () => {
    const response = await loginPOST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 401 for invalid password", async () => {
    process.env.APP_PASSWORD = "123456";

    const response = await loginPOST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password: "wrong" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns 200 and sets session cookie for correct password", async () => {
    process.env.APP_PASSWORD = "123456";

    const response = await loginPOST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password: "123456" }),
      }),
    );

    expect(response.status).toBe(200);
    const cookies = response.headers.get("set-cookie");
    expect(cookies).toContain("ai_obs_session=authenticated");
  });
});

describe("/api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const response = await logoutPOST();

    expect(response.status).toBe(200);
    const cookies = response.headers.get("set-cookie");
    expect(cookies).toContain("ai_obs_session=");
  });
});
