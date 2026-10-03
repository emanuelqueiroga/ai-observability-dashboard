import { ProjectRegistryDashboard } from "@/components/project-registry-dashboard";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default function Home() {
  const projects = listProjects();

  return (
    <div className="flex flex-1 bg-zinc-50 px-6 py-12 font-sans dark:bg-black sm:px-8 lg:px-12">
      <main className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
        <section className="grid gap-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Local-first MVP
          </p>
          <div className="grid gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
              AI Observability Dashboard
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Cadastre projetos monitorados por agentes de IA, mantenha o
              inventário inicial localmente e exponha os dados para integrações
              externas.
            </p>
          </div>

          <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Integração por API
            </h2>
            <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
              Use <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm dark:bg-zinc-900">POST /api/projects</code>{" "}
              com JSON contendo <code className="font-mono text-sm">name</code>,{" "}
              <code className="font-mono text-sm">slug</code> e opcionalmente{" "}
              <code className="font-mono text-sm">repositoryUrl</code>. Consulte os
              projetos registrados com <code className="font-mono text-sm">GET /api/projects</code>.
            </p>
          </div>
        </section>

        <ProjectRegistryDashboard initialProjects={projects} />
      </main>
    </div>
  );
}
