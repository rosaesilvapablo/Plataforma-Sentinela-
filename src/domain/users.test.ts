import { describe, it, expect } from "vitest";
import { createUserFormSchema, accessListUserSchema } from "@/domain/users";

describe("createUserFormSchema", () => {
  it("aceita um payload valido", () => {
    const result = createUserFormSchema.safeParse({
      email: "pablo.rosa@trf1.jus.br",
      fullName: "Pablo Rosa e Silva",
      role: "diretor",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail invalido", () => {
    const result = createUserFormSchema.safeParse({
      email: "naoEhEmail",
      fullName: "Pablo Rosa",
      role: "diretor",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita nome muito curto", () => {
    const result = createUserFormSchema.safeParse({
      email: "ok@trf1.jus.br",
      fullName: "P",
      role: "diretor",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita perfil desconhecido", () => {
    const result = createUserFormSchema.safeParse({
      email: "ok@trf1.jus.br",
      fullName: "Pablo Rosa",
      role: "supervisor_geral_ilegal",
    });
    expect(result.success).toBe(false);
  });
});

describe("accessListUserSchema", () => {
  it("aceita um registro completo valido", () => {
    const result = accessListUserSchema.safeParse({
      uid: "uid-123",
      email: "pablo.rosa@trf1.jus.br",
      fullName: "Pablo Rosa",
      role: "admin",
      status: "active",
      createdAt: new Date(),
      updatedAt: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita status invalido", () => {
    const result = accessListUserSchema.safeParse({
      uid: "uid-123",
      email: "ok@trf1.jus.br",
      fullName: "Pablo",
      role: "admin",
      status: "qualquer-coisa",
    });
    expect(result.success).toBe(false);
  });
});
