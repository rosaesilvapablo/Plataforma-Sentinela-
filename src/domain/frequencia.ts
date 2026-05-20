import { z } from "zod";

export const frequenciaTipoSchema = z.enum([
  "ausencia_justificada",
  "falta_injustificada",
]);
export type FrequenciaTipo = z.infer<typeof frequenciaTipoSchema>;

export const FREQUENCIA_TIPO_LABELS: Record<FrequenciaTipo, string> = {
  ausencia_justificada: "Ausência justificada",
  falta_injustificada: "Falta injustificada",
};

/**
 * Registro de frequência (ausências/faltas).
 * docId é AUTOGERADO pelo Firestore — corrige o bug do legado em que
 * `userId` era usado como `docId` e sobrescrevia o histórico.
 */
export const frequenciaSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  memberNome: z.string(),
  tipo: frequenciaTipoSchema,
  dataInicio: z.date(),
  dataFim: z.date(),
  motivo: z.string().nullable(),
  observacoes: z.string().nullable(),
  createdByUid: z.string(),
  createdByName: z.string(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type Frequencia = z.infer<typeof frequenciaSchema>;

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const createFrequenciaFormSchema = z
  .object({
    memberId: z.string().min(1, "Selecione uma pessoa."),
    tipo: frequenciaTipoSchema,
    dataInicio: dateStringSchema,
    dataFim: dateStringSchema,
    motivo: z.string().max(500, "Máximo 500 caracteres."),
    observacoes: z.string().max(1000, "Máximo 1000 caracteres."),
  })
  .refine(
    (data) =>
      new Date(`${data.dataFim}T12:00:00`).getTime() >=
      new Date(`${data.dataInicio}T12:00:00`).getTime(),
    { message: "Data final não pode ser anterior à inicial.", path: ["dataFim"] },
  );
export type CreateFrequenciaForm = z.infer<typeof createFrequenciaFormSchema>;

/** Update form não permite mudar memberId (regra de negócio: imutável). */
export const updateFrequenciaFormSchema = z
  .object({
    tipo: frequenciaTipoSchema,
    dataInicio: dateStringSchema,
    dataFim: dateStringSchema,
    motivo: z.string().max(500),
    observacoes: z.string().max(1000),
  })
  .refine(
    (data) =>
      new Date(`${data.dataFim}T12:00:00`).getTime() >=
      new Date(`${data.dataInicio}T12:00:00`).getTime(),
    { message: "Data final não pode ser anterior à inicial.", path: ["dataFim"] },
  );
export type UpdateFrequenciaForm = z.infer<typeof updateFrequenciaFormSchema>;
