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

let projects: Project[] = [];

function assertRepositoryUrl(repositoryUrl: string | undefined) {
  if (!repositoryUrl) {
    return;
  }

  try {
    const url = new URL(repositoryUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error(PROJECT_REPOSITORY_URL_INVALID);
    }
  } catch {
    throw new Error(PROJECT_REPOSITORY_URL_INVALID);
  }
}

function createProjectId() {
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createProject(input: CreateProjectInput): Project {
  const name = input.name.trim();
  const slug = input.slug.trim();
  const repositoryUrl = input.repositoryUrl?.trim() || undefined;
  const description = input.description?.trim() || undefined;

  if (!name) {
    throw new Error(PROJECT_NAME_REQUIRED);
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error(PROJECT_SLUG_INVALID);
  }

  assertRepositoryUrl(repositoryUrl);

  if (projects.some((project) => project.slug === slug)) {
    throw new Error(PROJECT_SLUG_DUPLICATED);
  }

  const project: Project = {
    id: createProjectId(),
    name,
    slug,
    repositoryUrl,
    description,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  projects = [project, ...projects];

  return project;
}

export function listProjects(): Project[] {
  return [...projects];
}

export function resetProjectsForTests() {
  projects = [];
}
