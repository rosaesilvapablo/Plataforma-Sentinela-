import { z } from "zod";

export const tipoBoletimSchema = z.enum(["tipo_1", "tipo_4"]);
export type TipoBoletim = z.infer<typeof tipoBoletimSchema>;

export const TIPO_BOLETIM_LABELS: Record<TipoBoletim, string> = {
  tipo_1: "Tipo 1 — Acervo",
  tipo_4: "Tipo 4 — Gerencial",
};

export const boletimSchema = z.object({
  id: z.string(),
  periodo: z.string(), // YYYY-MM
  tipo: tipoBoletimSchema,
  indicadores: z.record(z.string(), z.number()),
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type Boletim = z.infer<typeof boletimSchema>;

export const periodoMensalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Use formato YYYY-MM.");

export const boletimFormSchema = z.object({
  periodo: periodoMensalSchema,
  tipo: tipoBoletimSchema,
  indicadores: z.record(z.string(), z.number()),
  observacoes: z.string().max(2000),
});
export type BoletimForm = z.infer<typeof boletimFormSchema>;

/**
 * Compara dois boletins (atual vs anterior do mesmo tipo) e identifica
 * picos ou quedas relevantes (>= 30%) por indicador.
 */
export function compararBoletins(
  atual: Boletim,
  anterior: Boletim | null,
): Array<{ indicador: string; atual: number; anterior: number; deltaPct: number }> {
  if (!anterior) return [];
  const alerts: Array<{
    indicador: string;
    atual: number;
    anterior: number;
    deltaPct: number;
  }> = [];
  for (const [k, v] of Object.entries(atual.indicadores)) {
    const prev = anterior.indicadores[k];
    if (prev === undefined || prev === 0) continue;
    const delta = ((v - prev) / prev) * 100;
    if (Math.abs(delta) >= 30) {
      alerts.push({ indicador: k, atual: v, anterior: prev, deltaPct: delta });
    }
  }
  return alerts;
}
