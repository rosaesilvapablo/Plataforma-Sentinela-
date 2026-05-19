import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renderiza o texto e dispara onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Salvar</Button>);
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("desativa o clique quando loading", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Enviando
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
