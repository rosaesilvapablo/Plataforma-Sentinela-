import { describe, it, expect } from "vitest";
import {
  calcularProximaRevisao,
  classificarRevisao,
  calcularDiasPreso,
  calcularDiasPendente,
} from "@/domain/ppl";

describe("calcularProximaRevisao", () => {
  it("retorna null para situacoes que nao sao pessoa_presa", () => {
    const dataCumprimento = new Date("2026-01-01T12:00:00");
    expect(calcularProximaRevisao("mandado_pendente", dataCumprimento, null)).toBeNull();
    expect(calcularProximaRevisao("pessoa_foragida", dataCumprimento, null)).toBeNull();
  });

  it("calcula 90 dias a partir da data de cumprimento quando nao ha revisao anterior", () => {
    const dataCumprimento = new Date("2026-01-01T12:00:00");
    const r = calcularProximaRevisao("pessoa_presa", dataCumprimento, null);
    expect(r).not.toBeNull();
    expect(r!.getDate()).toBe(1);
    expect(r!.getMonth()).toBe(3); // abril (0-indexed)
  });

  it("calcula 90 dias a partir da ultima revisao", () => {
    const dataCumprimento = new Date("2026-01-01T12:00:00");
    const ultima = new Date("2026-04-01T12:00:00");
    const r = calcularProximaRevisao("pessoa_presa", dataCumprimento, ultima);
    expect(r).not.toBeNull();
    expect(r!.getMonth()).toBe(5); // junho
  });

  it("retorna null se nao ha base (sem cumprimento e sem revisao)", () => {
    expect(calcularProximaRevisao("pessoa_presa", null, null)).toBeNull();
  });
});

describe("classificarRevisao", () => {
  it("retorna na quando nao ha proxima revisao", () => {
    expect(classificarRevisao(null).status).toBe("na");
  });

  it("classifica vencido para data no passado", () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(classificarRevisao(past).status).toBe("vencido");
  });

  it("classifica urgente para <= 7 dias", () => {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    expect(classificarRevisao(soon).status).toBe("urgente");
  });

  it("classifica atencao para entre 8 e 30 dias", () => {
    const mid = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    expect(classificarRevisao(mid).status).toBe("atencao");
  });

  it("classifica ok para > 30 dias", () => {
    const far = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    expect(classificarRevisao(far).status).toBe("ok");
  });
});

describe("calcularDiasPreso", () => {
  it("retorna 0 quando situacao nao e pessoa_presa", () => {
    const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    expect(
      calcularDiasPreso({ situacao: "mandado_pendente", dataCumprimento: d }),
    ).toBe(0);
  });

  it("calcula dias desde a data de cumprimento para pessoa presa", () => {
    const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dias = calcularDiasPreso({ situacao: "pessoa_presa", dataCumprimento: d });
    expect(dias).toBeGreaterThanOrEqual(30);
    expect(dias).toBeLessThanOrEqual(31);
  });

  it("retorna 0 quando nao ha dataCumprimento", () => {
    expect(calcularDiasPreso({ situacao: "pessoa_presa", dataCumprimento: null })).toBe(0);
  });
});

describe("calcularDiasPendente", () => {
  it("calcula dias para mandado_pendente", () => {
    const d = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const dias = calcularDiasPendente({ situacao: "mandado_pendente", dataCumprimento: d });
    expect(dias).toBeGreaterThanOrEqual(10);
    expect(dias).toBeLessThanOrEqual(11);
  });

  it("retorna 0 para pessoa_presa", () => {
    const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    expect(calcularDiasPendente({ situacao: "pessoa_presa", dataCumprimento: d })).toBe(0);
  });
});
