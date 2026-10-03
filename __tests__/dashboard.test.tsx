import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

describe("dashboard home", () => {
  it("renders the project registration surface", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /AI Observability Dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do projeto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Slug do projeto/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cadastrar projeto/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Projetos cadastrados/i })).toBeInTheDocument();
    expect(screen.getAllByText(/POST \/api\/projects/i).length).toBeGreaterThan(0);
  });
});
