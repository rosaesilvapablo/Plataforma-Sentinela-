import { z } from "zod";

export const calendarioCategoriaSchema = z.enum([
  "feriado",
  "institucional",
  "audiencia",
  "outro",
]);
export type CalendarioCategoria = z.infer<typeof calendarioCategoriaSchema>;

export const CATEGORIA_LABELS: Record<CalendarioCategoria, string> = {
  feriado: "Feriado",
  institucional: "Institucional",
  audiencia: "Audiência",
  outro: "Outro",
};

export const calendarEventSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  categoria: calendarioCategoriaSchema,
  data: z.date(),
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type CalendarEvent = z.infer<typeof calendarEventSchema>;

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const calendarEventFormSchema = z.object({
  titulo: z.string().min(2, "Mínimo 2 caracteres.").max(120),
  categoria: calendarioCategoriaSchema,
  data: dateString,
  observacoes: z.string().max(2000),
});
export type CalendarEventForm = z.infer<typeof calendarEventFormSchema>;

/**
 * Item agregado para exibir no calendário — combina eventos manuais e
 * derivações de outros módulos.
 */
export type AgregadoEvento = {
  data: Date;
  titulo: string;
  fonte: "manual" | "plantao" | "frequencia" | "expediente_prazo" | "ppl_revisao";
  tone: "neutral" | "blue" | "gold" | "red" | "green";
  detalhe?: string;
};

export const FONTE_LABELS: Record<AgregadoEvento["fonte"], string> = {
  manual: "Manual",
  plantao: "Plantão",
  frequencia: "Frequência",
  expediente_prazo: "Prazo expediente",
  ppl_revisao: "Revisão Art. 316",
};
