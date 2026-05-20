import { z } from "zod";

export const metaEvolucaoSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  descricao: z.string(),
  periodo: z.string(), // YYYY-MM
  percentual: z.number(),
  valorAlvo: z.number().nullable(),
  valorAlcancado: z.number().nullable(),
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type MetaEvolucao = z.infer<typeof metaEvolucaoSchema>;

const periodoSchema = z.string().regex(/^\d{4}-\d{2}$/, "Use formato YYYY-MM.");

export const metaFormSchema = z.object({
  codigo: z.string().min(1, "Obrigatório.").max(20),
  descricao: z.string().min(2, "Mínimo 2 caracteres.").max(200),
  periodo: periodoSchema,
  percentual: z.number().min(0, "Mínimo 0%").max(200, "Máximo 200%"),
  valorAlvo: z.number().nullable(),
  valorAlcancado: z.number().nullable(),
  observacoes: z.string().max(2000),
});
export type MetaForm = z.infer<typeof metaFormSchema>;

/**
 * Projeção: se mantém ritmo médio dos últimos N meses, em qual periodo
 * atinge 100% (ou null se já atingiu/não dá pra prever).
 */
export function projetarCumprimento(
  evolucoes: MetaEvolucao[],
  windowSize = 3,
): {
  atual: number;
  mediaCrescimento: number;
  mesesParaMeta: number | null;
  cumpre: boolean;
} {
  const sorted = [...evolucoes].sort((a, b) => a.periodo.localeCompare(b.periodo));
  if (sorted.length === 0) {
    return { atual: 0, mediaCrescimento: 0, mesesParaMeta: null, cumpre: false };
  }
  const atual = sorted[sorted.length - 1]?.percentual ?? 0;
  if (atual >= 100) {
    return { atual, mediaCrescimento: 0, mesesParaMeta: 0, cumpre: true };
  }
  const window = sorted.slice(-windowSize);
  if (window.length < 2) {
    return { atual, mediaCrescimento: 0, mesesParaMeta: null, cumpre: false };
  }
  let totalCresc = 0;
  for (let i = 1; i < window.length; i++) {
    const prev = window[i - 1]?.percentual ?? 0;
    const curr = window[i]?.percentual ?? 0;
    totalCresc += curr - prev;
  }
  const media = totalCresc / (window.length - 1);
  if (media <= 0) {
    return { atual, mediaCrescimento: media, mesesParaMeta: null, cumpre: false };
  }
  const meses = Math.ceil((100 - atual) / media);
  return { atual, mediaCrescimento: media, mesesParaMeta: meses, cumpre: meses <= 12 };
}
