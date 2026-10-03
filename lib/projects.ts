import { isPgErrorWithCode, query, toIsoString } from "@/lib/db";

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

let projectWriteQueue = Promise.resolve();

export class ProjectValidationError extends Error {}

export class ProjectStorageError extends Error {}

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  repository_url: string | null;
  description: string | null;
  status: ProjectStatus;
  created_at: string | Date;
};

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    repositoryUrl: row.repository_url ?? undefined,
    description: row.description ?? undefined,
    status: row.status,
    createdAt: toIsoString(row.created_at),
  };
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

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const normalizedInput = normalizeCreateProjectInput(input);

  const project: Project = {
    id: createProjectId(),
    name: normalizedInput.name,
    slug: normalizedInput.slug,
    repositoryUrl: normalizedInput.repositoryUrl,
    description: normalizedInput.description,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  try {
    await query(
      `insert into projects (id, name, slug, repository_url, description, status, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        project.id,
        project.name,
        project.slug,
        project.repositoryUrl ?? null,
        project.description ?? null,
        project.status,
        project.createdAt,
      ],
    );
  } catch (error) {
    // Rely on the `projects.slug` unique constraint instead of a check-then-insert
    // read, which is racy under concurrent requests.
    if (isPgErrorWithCode(error, "23505")) {
      throw new ProjectValidationError(PROJECT_SLUG_DUPLICATED);
    }

    throw error;
  }

  return project;
}

export async function createProjectQueued(input: CreateProjectInput): Promise<Project> {
  const queuedWrite = projectWriteQueue.then(() => createProject(input));
  projectWriteQueue = queuedWrite.then(
    () => undefined,
    () => undefined,
  );

  return queuedWrite;
}

export async function listProjects(): Promise<Project[]> {
  const result = await query<ProjectRow>(
    "select * from projects order by created_at desc",
  );

  return result.rows.map(rowToProject);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const result = await query<ProjectRow>(
    "select * from projects where slug = $1 limit 1",
    [slug],
  );

  return result.rows[0] ? rowToProject(result.rows[0]) : null;
}

export function resetProjectsForTests() {
  projectWriteQueue = Promise.resolve();
}
