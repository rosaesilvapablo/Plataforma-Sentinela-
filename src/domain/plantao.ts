import { z } from "zod";

export const tipoPlantaoSchema = z.enum(["ordinario", "extraordinario", "recesso"]);
export type TipoPlantao = z.infer<typeof tipoPlantaoSchema>;

export const TIPO_PLANTAO_LABELS: Record<TipoPlantao, string> = {
  ordinario: "Ordinário",
  extraordinario: "Extraordinário",
  recesso: "Recesso",
};

export const plantaoSchema = z.object({
  id: z.string(),
  dataInicio: z.date(),
  dataFim: z.date(),
  juizId: z.string(),
  juizNome: z.string(),
  servidorId: z.string(),
  servidorNome: z.string(),
  tipo: tipoPlantaoSchema,
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type Plantao = z.infer<typeof plantaoSchema>;

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const plantaoFormSchema = z
  .object({
    juizId: z.string().min(1, "Selecione um juiz responsável."),
    servidorId: z.string().min(1, "Selecione um servidor responsável."),
    tipo: tipoPlantaoSchema,
    dataInicio: dateStringSchema,
    dataFim: dateStringSchema,
    observacoes: z.string().max(1000),
  })
  .refine(
    (d) =>
      new Date(`${d.dataFim}T12:00:00`).getTime() >=
      new Date(`${d.dataInicio}T12:00:00`).getTime(),
    { message: "Data final não pode ser anterior à inicial.", path: ["dataFim"] },
  );
export type PlantaoForm = z.infer<typeof plantaoFormSchema>;
