import { describe, it, expect } from "vitest";
import {
  createTeamMemberFormSchema,
  updateTeamMemberFormSchema,
  teamMemberSchema,
  tipoVinculoSchema,
  personStatusSchema,
} from "@/domain/team";

describe("tipoVinculoSchema", () => {
  it("aceita todos os tipos de vinculo definidos", () => {
    for (const t of tipoVinculoSchema.options) {
      expect(tipoVinculoSchema.safeParse(t).success).toBe(true);
    }
  });

  it("rejeita valor desconhecido", () => {
    expect(tipoVinculoSchema.safeParse("magistrado").success).toBe(false);
  });
});

describe("personStatusSchema", () => {
  it("aceita status validos", () => {
    expect(personStatusSchema.safeParse("ativo").success).toBe(true);
    expect(personStatusSchema.safeParse("afastado").success).toBe(true);
    expect(personStatusSchema.safeParse("desligado").success).toBe(true);
  });

  it("rejeita status desconhecido", () => {
    expect(personStatusSchema.safeParse("ferias").success).toBe(false);
  });
});

describe("createTeamMemberFormSchema", () => {
  const validInput = {
    nome: "Pablo Rosa e Silva",
    email: "pablo.rosa@trf1.jus.br",
    matricula: "TR12345",
    cargoEfetivo: "Analista Judiciario",
    funcaoComissionada: "FC-05",
    tipoVinculo: "servidor" as const,
    lotacaoParadigma: "Secretaria",
    lotacaoAtual: "Secretaria",
    observacoes: "",
  };

  it("aceita payload valido", () => {
    expect(createTeamMemberFormSchema.safeParse(validInput).success).toBe(true);
  });

  it("aceita funcao comissionada vazia (opcional)", () => {
    expect(
      createTeamMemberFormSchema.safeParse({ ...validInput, funcaoComissionada: "" }).success,
    ).toBe(true);
  });

  it("rejeita nome muito curto", () => {
    expect(
      createTeamMemberFormSchema.safeParse({ ...validInput, nome: "P" }).success,
    ).toBe(false);
  });

  it("rejeita e-mail invalido", () => {
    expect(
      createTeamMemberFormSchema.safeParse({ ...validInput, email: "naoEhEmail" }).success,
    ).toBe(false);
  });

  it("rejeita matricula vazia", () => {
    expect(
      createTeamMemberFormSchema.safeParse({ ...validInput, matricula: "" }).success,
    ).toBe(false);
  });
});

describe("updateTeamMemberFormSchema", () => {
  it("nao espera cargoEfetivo (imutavel)", () => {
    const result = updateTeamMemberFormSchema.safeParse({
      nome: "Pablo Rosa",
      email: "pablo@trf1.jus.br",
      matricula: "TR1",
      funcaoComissionada: "",
      tipoVinculo: "servidor",
      lotacaoParadigma: "Gabinete",
      lotacaoAtual: "Gabinete",
      status: "ativo",
      observacoes: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("teamMemberSchema (mapeado do Firestore)", () => {
  it("aceita registro completo", () => {
    const result = teamMemberSchema.safeParse({
      uid: "abc123",
      nome: "Pablo Rosa",
      email: "pablo@trf1.jus.br",
      matricula: "TR1",
      cargoEfetivo: "Analista",
      funcaoComissionada: "FC-05",
      tipoVinculo: "servidor",
      lotacaoParadigma: "Secretaria",
      lotacaoAtual: "Gabinete",
      status: "ativo",
      observacoes: null,
      createdAt: new Date(),
      updatedAt: null,
    });
    expect(result.success).toBe(true);
  });
});
