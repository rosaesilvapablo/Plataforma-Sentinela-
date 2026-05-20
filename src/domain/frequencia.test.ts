import { describe, it, expect } from "vitest";
import {
  createFrequenciaFormSchema,
  updateFrequenciaFormSchema,
  frequenciaTipoSchema,
} from "@/domain/frequencia";

describe("frequenciaTipoSchema", () => {
  it("aceita tipos validos", () => {
    expect(frequenciaTipoSchema.safeParse("ausencia_justificada").success).toBe(true);
    expect(frequenciaTipoSchema.safeParse("falta_injustificada").success).toBe(true);
  });
  it("rejeita tipo desconhecido", () => {
    expect(frequenciaTipoSchema.safeParse("ferias").success).toBe(false);
  });
});

describe("createFrequenciaFormSchema", () => {
  const valid = {
    memberId: "abc123",
    tipo: "ausencia_justificada" as const,
    dataInicio: "2026-05-20",
    dataFim: "2026-05-22",
    motivo: "Capacitação",
    observacoes: "",
  };

  it("aceita payload valido (multi-dia)", () => {
    expect(createFrequenciaFormSchema.safeParse(valid).success).toBe(true);
  });

  it("aceita ausencia de 1 dia (dataInicio == dataFim)", () => {
    expect(
      createFrequenciaFormSchema.safeParse({
        ...valid,
        dataInicio: "2026-05-20",
        dataFim: "2026-05-20",
      }).success,
    ).toBe(true);
  });

  it("rejeita memberId vazio", () => {
    expect(createFrequenciaFormSchema.safeParse({ ...valid, memberId: "" }).success).toBe(
      false,
    );
  });

  it("rejeita data final anterior a inicial", () => {
    const result = createFrequenciaFormSchema.safeParse({
      ...valid,
      dataInicio: "2026-05-22",
      dataFim: "2026-05-20",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita formato de data invalido", () => {
    expect(
      createFrequenciaFormSchema.safeParse({ ...valid, dataInicio: "20/05/2026" }).success,
    ).toBe(false);
  });

  it("rejeita motivo muito longo", () => {
    expect(
      createFrequenciaFormSchema.safeParse({
        ...valid,
        motivo: "x".repeat(501),
      }).success,
    ).toBe(false);
  });
});

describe("updateFrequenciaFormSchema", () => {
  it("aceita update valido (sem memberId, imutavel)", () => {
    const result = updateFrequenciaFormSchema.safeParse({
      tipo: "falta_injustificada",
      dataInicio: "2026-05-20",
      dataFim: "2026-05-20",
      motivo: "",
      observacoes: "Sem comunicacao previa.",
    });
    expect(result.success).toBe(true);
  });
});
