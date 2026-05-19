import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "@/App";

describe("App", () => {
  it("renderiza a tela de login quando o usuario nao esta autenticado", async () => {
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: /guardi[aã]o da/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /acessar sistema/i }),
    ).toBeInTheDocument();
  });
});
