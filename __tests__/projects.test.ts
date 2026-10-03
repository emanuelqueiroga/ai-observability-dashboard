import { describe, expect, it, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { GET, POST } from "@/app/api/projects/route";
import {
  createProject,
  listProjects,
  resetProjectsForTests,
  setProjectStorePathForTests,
} from "@/lib/projects";

const testProjectStorePath = path.join(
  os.tmpdir(),
  "ai-observability-dashboard-projects-test.json",
);

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

describe("project registry", () => {
  beforeEach(() => {
    setProjectStorePathForTests(testProjectStorePath);
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
    expect(JSON.parse(fs.readFileSync(testProjectStorePath, "utf8"))).toHaveLength(1);
  });

  it("loads projects from the file store", () => {
    fs.writeFileSync(
      testProjectStorePath,
      JSON.stringify([
        {
          id: "proj_file_seed",
          name: "Seeded Project",
          slug: "seeded-project",
          status: "active",
          createdAt: "2026-10-03T00:00:00.000Z",
        },
      ]),
    );

    expect(listProjects()).toMatchObject([
      {
        id: "proj_file_seed",
        name: "Seeded Project",
        slug: "seeded-project",
      },
    ]);
  });

  it("fails explicitly when the file store is corrupted", () => {
    fs.writeFileSync(testProjectStorePath, "not-json", "utf8");

    expect(() => listProjects()).toThrow("Project store is unavailable");
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
    setProjectStorePathForTests(testProjectStorePath);
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

  it("validates POST payloads before reading a corrupted project store", async () => {
    fs.writeFileSync(testProjectStorePath, "not-json", "utf8");

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

  it("serializes concurrent project creation through the API", async () => {
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
    expect(listProjects()).toHaveLength(3);
  });

  it("returns 500 when the project store cannot be read", async () => {
    fs.writeFileSync(testProjectStorePath, "not-json", "utf8");

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await json(response)).toMatchObject({
      error: "Project store is unavailable",
    });
  });
});
