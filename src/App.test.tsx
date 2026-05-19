import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "@/App";

describe("App", () => {
  it("redireciona para a tela de login quando o usuario nao esta autenticado", async () => {
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: /sentinela 2026/i }),
    ).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });
});
