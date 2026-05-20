import { z } from "zod";

export const categoriaMandadoSchema = z.enum([
  "pendente_cumprimento",
  "difusao_vermelha",
  "revisao_316",
]);
export type CategoriaMandado = z.infer<typeof categoriaMandadoSchema>;

export const CATEGORIA_MANDADO_LABELS: Record<CategoriaMandado, string> = {
  pendente_cumprimento: "Mandado pendente",
  difusao_vermelha: "Difusão Vermelha",
  revisao_316: "Revisão Art. 316",
};

export const statusMandadoSchema = z.enum(["ativo", "cumprido", "cancelado"]);
export type StatusMandado = z.infer<typeof statusMandadoSchema>;

export const STATUS_MANDADO_LABELS: Record<StatusMandado, string> = {
  ativo: "Ativo",
  cumprido: "Cumprido",
  cancelado: "Cancelado",
};

export const mandadoSchema = z.object({
  id: z.string(),
  pessoa: z.string(),
  processo: z.string(),
  categoria: categoriaMandadoSchema,
  prazo: z.date().nullable(),
  status: statusMandadoSchema,
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type Mandado = z.infer<typeof mandadoSchema>;

const dateStringOptional = z.string();

export const mandadoFormSchema = z.object({
  pessoa: z.string().min(2, "Mínimo 2 caracteres.").max(120),
  processo: z.string().min(1, "Processo obrigatório.").max(40),
  categoria: categoriaMandadoSchema,
  prazo: dateStringOptional,
  status: statusMandadoSchema,
  observacoes: z.string().max(2000),
});
export type MandadoForm = z.infer<typeof mandadoFormSchema>;
