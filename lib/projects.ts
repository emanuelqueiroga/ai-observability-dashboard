import fs from "node:fs";
import path from "node:path";

export type ProjectStatus = "active";

export type Project = {
  id: string;
  name: string;
  slug: string;
  repositoryUrl?: string;
  description?: string;
  status: ProjectStatus;
  createdAt: string;
};

export type CreateProjectInput = {
  name: string;
  slug: string;
  repositoryUrl?: string;
  description?: string;
};

const PROJECT_NAME_REQUIRED = "Project name is required";
const PROJECT_SLUG_INVALID =
  "Project slug must use lowercase letters, numbers and hyphens";
const PROJECT_REPOSITORY_URL_INVALID = "Repository URL must be a valid URL";
const PROJECT_SLUG_DUPLICATED = "Project slug already exists";
const PROJECT_STORE_UNAVAILABLE = "Project store is unavailable";

let projectStorePath = path.join(process.cwd(), "data", "projects.json");
let projectWriteQueue = Promise.resolve();

export class ProjectValidationError extends Error {}

export class ProjectStorageError extends Error {}

function ensureProjectStore() {
  fs.mkdirSync(/* turbopackIgnore: true */ path.dirname(projectStorePath), {
    recursive: true,
  });

  if (!fs.existsSync(/* turbopackIgnore: true */ projectStorePath)) {
    writeProjects([]);
  }
}

function asProject(value: unknown): Project | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.slug !== "string" ||
    record.status !== "active" ||
    typeof record.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    repositoryUrl: typeof record.repositoryUrl === "string" ? record.repositoryUrl : undefined,
    description: typeof record.description === "string" ? record.description : undefined,
    status: record.status,
    createdAt: record.createdAt,
  };
}

function readProjects(): Project[] {
  try {
    ensureProjectStore();

    const contents = fs
      .readFileSync(/* turbopackIgnore: true */ projectStorePath, "utf8")
      .trim();
    const parsed = contents ? JSON.parse(contents) : [];

    if (!Array.isArray(parsed)) {
      throw new ProjectStorageError(PROJECT_STORE_UNAVAILABLE);
    }

    return parsed.map((project) => {
      const parsedProject = asProject(project);

      if (!parsedProject) {
        throw new ProjectStorageError(PROJECT_STORE_UNAVAILABLE);
      }

      return parsedProject;
    });
  } catch (error) {
    if (error instanceof ProjectStorageError) {
      throw error;
    }

    throw new ProjectStorageError(PROJECT_STORE_UNAVAILABLE);
  }
}

function writeProjects(projects: Project[]) {
  fs.mkdirSync(/* turbopackIgnore: true */ path.dirname(projectStorePath), {
    recursive: true,
  });
  const temporaryPath = `${projectStorePath}.tmp`;

  fs.writeFileSync(
    /* turbopackIgnore: true */ temporaryPath,
    `${JSON.stringify(projects, null, 2)}\n`,
    "utf8",
  );
  fs.renameSync(
    /* turbopackIgnore: true */ temporaryPath,
    /* turbopackIgnore: true */ projectStorePath,
  );
}

function assertRepositoryUrl(repositoryUrl: string | undefined) {
  if (!repositoryUrl) {
    return;
  }

  try {
    const url = new URL(repositoryUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new ProjectValidationError(PROJECT_REPOSITORY_URL_INVALID);
    }
  } catch {
    throw new ProjectValidationError(PROJECT_REPOSITORY_URL_INVALID);
  }
}

function createProjectId() {
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeCreateProjectInput(input: CreateProjectInput): CreateProjectInput {
  const name = input.name.trim();
  const slug = input.slug.trim();
  const repositoryUrl = input.repositoryUrl?.trim() || undefined;
  const description = input.description?.trim() || undefined;

  if (!name) {
    throw new ProjectValidationError(PROJECT_NAME_REQUIRED);
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new ProjectValidationError(PROJECT_SLUG_INVALID);
  }

  assertRepositoryUrl(repositoryUrl);

  return { name, slug, repositoryUrl, description };
}

export function createProject(input: CreateProjectInput): Project {
  const normalizedInput = normalizeCreateProjectInput(input);
  const projects = readProjects();

  if (projects.some((project) => project.slug === normalizedInput.slug)) {
    throw new ProjectValidationError(PROJECT_SLUG_DUPLICATED);
  }

  const project: Project = {
    id: createProjectId(),
    name: normalizedInput.name,
    slug: normalizedInput.slug,
    repositoryUrl: normalizedInput.repositoryUrl,
    description: normalizedInput.description,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  writeProjects([project, ...projects]);

  return project;
}

export function createProjectQueued(input: CreateProjectInput): Promise<Project> {
  const queuedWrite = projectWriteQueue.then(() => createProject(input));
  projectWriteQueue = queuedWrite.then(
    () => undefined,
    () => undefined,
  );

  return queuedWrite;
}

export function listProjects(): Project[] {
  return readProjects();
}

export function resetProjectsForTests() {
  projectWriteQueue = Promise.resolve();
  writeProjects([]);
}

export function setProjectStorePathForTests(storePath: string) {
  projectStorePath = storePath;
}
