import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/projects", () => ({
  listProjects: vi.fn(async () => [
    {
      id: "proj_1",
      name: "Projeto de Exemplo",
      slug: "projeto-de-exemplo",
      status: "active",
      createdAt: "2026-10-03T00:00:00.000Z",
    },
  ]),
}));

describe("dashboard home", () => {
  it("renders the project registration surface", async () => {
    render(await Home());

    expect(
      screen.getByRole("heading", { name: /Dashboard Geral/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Projetos/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Integração por API/i })).toBeInTheDocument();
    expect(screen.getAllByText(/POST \/api\/events/i).length).toBeGreaterThan(0);
  });

  it("renders projects returned from the (postgres) store", async () => {
    render(await Home());

    expect(screen.getAllByText("Projeto de Exemplo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("projeto-de-exemplo").length).toBeGreaterThan(0);
  });
});
