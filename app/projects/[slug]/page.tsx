import { notFound } from "next/navigation";
import { listProjects } from "@/lib/projects";
import { listEventsForProject } from "@/lib/events";
import { buildAlertsForEvent } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const projects = await listProjects();
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  const events = await listEventsForProject(project.id);
  const alerts = events.flatMap((event) => buildAlertsForEvent(event));

  return (
    <div className="flex flex-1 bg-zinc-50 px-6 py-12 font-sans dark:bg-black sm:px-8 lg:px-12">
      <main className="mx-auto grid w-full max-w-5xl gap-8">
        <section className="grid gap-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Projeto
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {project.name}
          </h1>
          <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">{project.slug}</p>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {project.description ?? "Sem descrição cadastrada."}
          </p>
          {project.repositoryUrl ? (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {project.repositoryUrl}
            </a>
          ) : null}
        </section>

        <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Alertas</h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhum alerta ativo.</p>
          ) : (
            <ul className="grid gap-3">
              {alerts.map((alert) => (
                <li key={alert.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">{alert.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{alert.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Eventos</h2>
          {events.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Nenhum evento registrado ainda.
            </p>
          ) : (
            <ul className="grid gap-3">
              {events.map((event) => (
                <li key={event.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">{event.type}</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{event.message}</p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {event.level}
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {event.model ?? "sem modelo"} · {event.tokens} tokens · ${event.costUsd.toFixed(2)} · {event.latencyMs}ms
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
