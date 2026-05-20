import { describe, it, expect } from "vitest";
import { calcularProximaRevisao, classificarRevisao } from "@/domain/ppl";

describe("calcularProximaRevisao", () => {
  it("retorna null para tipos que nao sao preventiva", () => {
    expect(calcularProximaRevisao("flagrante", new Date(), null)).toBeNull();
    expect(calcularProximaRevisao("definitiva", new Date(), null)).toBeNull();
    expect(calcularProximaRevisao("temporaria", new Date(), null)).toBeNull();
  });

  it("calcula 90 dias a partir da data da prisao quando nao ha revisao anterior", () => {
    const dataPrisao = new Date("2026-01-01T12:00:00");
    const r = calcularProximaRevisao("preventiva", dataPrisao, null);
    expect(r).not.toBeNull();
    expect(r!.getDate()).toBe(1);
    expect(r!.getMonth()).toBe(3); // abril (0-indexed)
  });

  it("calcula 90 dias a partir da ultima revisao", () => {
    const dataPrisao = new Date("2026-01-01T12:00:00");
    const ultima = new Date("2026-04-01T12:00:00");
    const r = calcularProximaRevisao("preventiva", dataPrisao, ultima);
    expect(r).not.toBeNull();
    expect(r!.getMonth()).toBe(5); // junho (90 dias depois de abril)
  });
});

describe("classificarRevisao", () => {
  it("retorna ok quando nao ha proxima revisao", () => {
    expect(classificarRevisao(null).status).toBe("ok");
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
