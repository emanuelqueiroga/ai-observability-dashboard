import Link from "next/link";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await listProjects();

  return (
    <div className="flex flex-1 bg-zinc-50 px-6 py-12 font-sans dark:bg-black sm:px-8 lg:px-12">
      <main className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
        <section className="grid gap-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Observability System
            </p>
          </div>
          <div className="grid gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
              Dashboard Geral
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Visão dos projetos cadastrados, eventos e alertas. Página individual
              por projeto e base preparada para Postgres no Docker.
            </p>
          </div>

          <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Projetos
            </h2>
            <ul className="grid gap-3">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <Link href={`/projects/${project.slug}`} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    {project.name}
                  </Link>
                  <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
                    {project.slug}
                  </p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {project.description ?? "Sem descrição"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Integração por API
          </h2>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Use <code className="font-mono">POST /api/events</code> com
            <code className="font-mono"> projectId</code>,
            <code className="font-mono"> type</code>,
            <code className="font-mono"> message</code>,
            <code className="font-mono"> level</code>,
            <code className="font-mono"> model</code>,
            <code className="font-mono"> tokens</code>,
            <code className="font-mono"> costUsd</code> e
            <code className="font-mono"> latencyMs</code>.
          </p>
        </section>
      </main>
    </div>
  );
}
