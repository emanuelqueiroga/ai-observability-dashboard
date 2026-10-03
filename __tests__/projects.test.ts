import { describe, expect, it, beforeEach, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("pg", () => ({
  Pool: class {
    query = queryMock;
  },
}));

import { GET, POST } from "@/app/api/projects/route";
import {
  createProject,
  listProjects,
  resetProjectsForTests,
} from "@/lib/projects";

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

const projectRow = {
  id: "proj_1",
  name: "Cliente Alpha",
  slug: "cliente-alpha",
  repository_url: "https://github.com/example/alpha",
  description: "Projeto conectado por agente externo",
  status: "active",
  created_at: "2026-10-03T00:00:00.000Z",
};

describe("project registry", () => {
  beforeEach(() => {
    queryMock.mockReset();
    delete (globalThis as Record<string, unknown>).pgPool;
    process.env.DATABASE_URL = "postgresql://x:y@localhost:5432/z";
    resetProjectsForTests();
  });

  it("creates and lists projects through the domain API", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] }); // insert

    const project = await createProject({
      name: "Cliente Alpha",
      slug: "cliente-alpha",
      repositoryUrl: "https://github.com/example/alpha",
      description: "Projeto conectado por agente externo",
    });

    expect(project).toMatchObject({
      name: "Cliente Alpha",
      slug: "cliente-alpha",
      repositoryUrl: "https://github.com/example/alpha",
      status: "active",
    });
    expect(project.id).toMatch(/^proj_/);
    expect(project.createdAt).toBeTruthy();
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("insert into projects"),
      expect.arrayContaining([project.id, "Cliente Alpha", "cliente-alpha"]),
    );

    queryMock.mockResolvedValueOnce({ rows: [projectRow] });

    expect(await listProjects()).toHaveLength(1);
  });

  it("maps rows from postgres into projects", async () => {
    queryMock.mockResolvedValueOnce({ rows: [projectRow] });

    expect(await listProjects()).toMatchObject([
      {
        id: "proj_1",
        name: "Cliente Alpha",
        slug: "cliente-alpha",
        repositoryUrl: "https://github.com/example/alpha",
      },
    ]);
  });

  it("fails explicitly when the database query fails", async () => {
    queryMock.mockRejectedValueOnce(new Error("connection refused"));

    await expect(listProjects()).rejects.toThrow("connection refused");
  });

  it("rejects duplicated project slugs", async () => {
    const uniqueViolation = Object.assign(new Error("duplicate key value violates unique constraint"), {
      code: "23505",
    });
    queryMock.mockRejectedValueOnce(uniqueViolation);

    await expect(createProject({ name: "Alpha", slug: "alpha" })).rejects.toThrow(
      "Project slug already exists",
    );
  });

  it("rejects invalid project payloads", async () => {
    await expect(createProject({ name: "", slug: "valid-slug" })).rejects.toThrow(
      "Project name is required",
    );
    await expect(createProject({ name: "Valid", slug: "Invalid Slug" })).rejects.toThrow(
      "Project slug must use lowercase letters, numbers and hyphens",
    );
    await expect(
      createProject({ name: "Valid", slug: "valid", repositoryUrl: "not-a-url" }),
    ).rejects.toThrow("Repository URL must be a valid URL");
    await expect(
      createProject({ name: "Valid", slug: "valid", repositoryUrl: "mailto:repo@example.com" }),
    ).rejects.toThrow("Repository URL must be a valid URL");
  });
});

describe("/api/projects", () => {
  beforeEach(() => {
    queryMock.mockReset();
    delete (globalThis as Record<string, unknown>).pgPool;
    process.env.DATABASE_URL = "postgresql://x:y@localhost:5432/z";
    resetProjectsForTests();
  });

  it("creates projects via POST and lists them via GET", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const created = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: "API Connected Project",
          slug: "api-connected-project",
          repositoryUrl: "https://github.com/example/api-project",
        }),
      }),
    );

    expect(created.status).toBe(201);
    expect(await json(created)).toMatchObject({
      project: { name: "API Connected Project", slug: "api-connected-project" },
    });

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          ...projectRow,
          name: "API Connected Project",
          slug: "api-connected-project",
        },
      ],
    });

    const listed = await GET();

    expect(listed.status).toBe(200);
    expect(await json(listed)).toMatchObject({
      projects: [{ name: "API Connected Project", slug: "api-connected-project" }],
    });
  });

  it("returns 400 for invalid POST payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Broken", slug: "Invalid Slug" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      error: "Project slug must use lowercase letters, numbers and hyphens",
    });
  });

  it("returns 400 for malformed JSON request bodies", async () => {
    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      error: "Invalid project payload",
    });
  });

  it("validates POST payloads before touching the database", async () => {
    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Broken", slug: "Invalid Slug" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("serializes concurrent project creation through the API", async () => {
    queryMock.mockImplementation(async () => ({ rows: [] }));

    const responses = await Promise.all(
      ["one", "two", "three"].map((slug) =>
        POST(
          new Request("http://localhost/api/projects", {
            method: "POST",
            body: JSON.stringify({ name: `Project ${slug}`, slug: `project-${slug}` }),
          }),
        ),
      ),
    );

    expect(responses.map((response) => response.status)).toEqual([201, 201, 201]);
  });

  it("returns 500 when the database cannot be read", async () => {
    queryMock.mockRejectedValueOnce(new Error("connection refused"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await json(response)).toMatchObject({
      error: "Project store is unavailable",
    });
  });
});
