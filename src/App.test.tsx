import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "@/App";

describe("App", () => {
  it("renderiza o titulo da plataforma", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /plataforma sentinela 2026/i })).toBeInTheDocument();
  });
});
