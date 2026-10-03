"use client";

import { useState } from "react";
import { ProjectRegistrationForm } from "@/components/project-registration-form";
import type { Project } from "@/lib/projects";

type ProjectRegistryDashboardProps = {
  initialProjects: Project[];
};

export function ProjectRegistryDashboard({ initialProjects }: ProjectRegistryDashboardProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  function handleProjectCreated(project: Project) {
    setProjects((currentProjects) => [
      project,
      ...currentProjects.filter((currentProject) => currentProject.slug !== project.slug),
    ]);
  }

  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Cadastro de projeto
      </h2>
      <ProjectRegistrationForm onProjectCreated={handleProjectCreated} />

      <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Projetos cadastrados
          </h2>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            {projects.length} ativos
          </span>
        </div>

        {projects.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Nenhum projeto cadastrado ainda. Use o formulário acima ou envie um
            payload para <code className="font-mono">POST /api/projects</code>.
          </p>
        ) : (
          <ul className="grid gap-3">
            {projects.map((project) => (
              <li
                key={project.id}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">
                      {project.name}
                    </h3>
                    <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
                      {project.slug}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {project.status}
                  </span>
                </div>
                {project.repositoryUrl ? (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block truncate text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {project.repositoryUrl}
                  </a>
                ) : null}
                {project.description ? (
                  <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {project.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
