import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RoleBadge } from "@/features/admin/components/RoleBadge";

describe("RoleBadge", () => {
  it("renderiza o label do papel em portugues", () => {
    render(<RoleBadge role="diretor" />);
    expect(screen.getByText("Diretor")).toBeInTheDocument();
  });

  it("renderiza Administrador para admin", () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByText("Administrador")).toBeInTheDocument();
  });
});
