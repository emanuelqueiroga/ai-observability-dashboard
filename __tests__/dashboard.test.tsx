import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("dashboard home", () => {
  it("renders the project registration surface", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /AI Observability Dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do projeto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Slug do projeto/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cadastrar projeto/i })).toBeInTheDocument();
    expect(screen.getByText(/POST \/api\/projects/i)).toBeInTheDocument();
  });
});
