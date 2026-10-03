import { describe, expect, it, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/projects/route";
import {
  createProject,
  listProjects,
  resetProjectsForTests,
} from "@/lib/projects";

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

describe("project registry", () => {
  beforeEach(() => {
    resetProjectsForTests();
  });

  it("creates and lists projects through the domain API", () => {
    const project = createProject({
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
    expect(listProjects()).toHaveLength(1);
  });

  it("rejects duplicated project slugs", () => {
    createProject({ name: "Alpha", slug: "alpha" });

    expect(() => createProject({ name: "Alpha Duplicate", slug: "alpha" })).toThrow(
      "Project slug already exists",
    );
  });

  it("rejects invalid project payloads", () => {
    expect(() => createProject({ name: "", slug: "valid-slug" })).toThrow(
      "Project name is required",
    );
    expect(() => createProject({ name: "Valid", slug: "Invalid Slug" })).toThrow(
      "Project slug must use lowercase letters, numbers and hyphens",
    );
    expect(() =>
      createProject({ name: "Valid", slug: "valid", repositoryUrl: "not-a-url" }),
    ).toThrow("Repository URL must be a valid URL");
    expect(() =>
      createProject({ name: "Valid", slug: "valid", repositoryUrl: "mailto:repo@example.com" }),
    ).toThrow("Repository URL must be a valid URL");
  });
});

describe("/api/projects", () => {
  beforeEach(() => {
    resetProjectsForTests();
  });

  it("creates projects via POST and lists them via GET", async () => {
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
      project: {
        name: "API Connected Project",
        slug: "api-connected-project",
      },
    });

    const listed = await GET();

    expect(listed.status).toBe(200);
    expect(await json(listed)).toMatchObject({
      projects: [
        {
          name: "API Connected Project",
          slug: "api-connected-project",
        },
      ],
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
});
