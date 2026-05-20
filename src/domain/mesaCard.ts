import { z } from "zod";

export const mesaColumnSchema = z.enum([
  "concluso_despacho",
  "concluso_decisao",
  "concluso_sentenca",
  "em_diligencia",
  "concluido",
]);
export type MesaColumn = z.infer<typeof mesaColumnSchema>;

export const MESA_COLUMN_LABELS: Record<MesaColumn, string> = {
  concluso_despacho: "Concluso para despacho",
  concluso_decisao: "Concluso para decisão",
  concluso_sentenca: "Concluso para sentença",
  em_diligencia: "Em diligência",
  concluido: "Concluído",
};

export const MESA_COLUMNS_ORDER: MesaColumn[] = [
  "concluso_despacho",
  "concluso_decisao",
  "concluso_sentenca",
  "em_diligencia",
  "concluido",
];

export const mesaCardSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  processo: z.string(),
  column: mesaColumnSchema,
  assigneeId: z.string().nullable(),
  assigneeNome: z.string().nullable(),
  prazo: z.date().nullable(),
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type MesaCard = z.infer<typeof mesaCardSchema>;

export const mesaCardFormSchema = z.object({
  titulo: z.string().min(2, "Mínimo 2 caracteres.").max(200),
  processo: z.string().min(1, "Obrigatório.").max(40),
  column: mesaColumnSchema,
  assigneeId: z.string(),
  prazo: z.string(),
  observacoes: z.string().max(2000),
});
export type MesaCardForm = z.infer<typeof mesaCardFormSchema>;
