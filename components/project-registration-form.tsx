"use client";

import { useState, type FormEvent } from "react";

type ProjectRegistrationState = {
  message: string;
  tone: "idle" | "success" | "error";
};

const initialState: ProjectRegistrationState = {
  message: "",
  tone: "idle",
};

export function ProjectRegistrationForm() {
  const [state, setState] = useState(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      repositoryUrl: String(formData.get("repositoryUrl") ?? ""),
      description: String(formData.get("description") ?? ""),
    };

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setState({
          message: result.error ?? "Não foi possível cadastrar o projeto.",
          tone: "error",
        });
        return;
      }

      event.currentTarget.reset();
      setState({ message: "Projeto cadastrado com sucesso.", tone: "success" });
    } catch {
      setState({
        message: "Não foi possível conectar à API de projetos.",
        tone: "error",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Nome do projeto
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-100"
          placeholder="Cliente Alpha"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="slug" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Slug do projeto
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-100"
          placeholder="cliente-alpha"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="repositoryUrl"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          URL do repositório
        </label>
        <input
          id="repositoryUrl"
          name="repositoryUrl"
          type="url"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-100"
          placeholder="https://github.com/exemplo/projeto"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="description"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-100"
          placeholder="Contexto do produto, time ou agente conectado"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-foreground px-4 py-3 text-base font-semibold text-background transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 dark:focus:ring-offset-background"
      >
        Cadastrar projeto
      </button>

      {state.message ? (
        <p
          className={
            state.tone === "error"
              ? "text-sm font-medium text-red-600 dark:text-red-400"
              : "text-sm font-medium text-green-700 dark:text-green-400"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
