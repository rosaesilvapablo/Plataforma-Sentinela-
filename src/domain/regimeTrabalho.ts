import { z } from "zod";

export const tipoRegimeSchema = z.enum(["presencial", "hibrido", "integral_remoto"]);
export type TipoRegime = z.infer<typeof tipoRegimeSchema>;

export const TIPO_REGIME_LABELS: Record<TipoRegime, string> = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  integral_remoto: "Integral remoto",
};

export const regimeSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  memberNome: z.string(),
  tipo: tipoRegimeSchema,
  processoSei: z.string(),
  dataInicio: z.date(),
  dataFimPrevista: z.date().nullable(),
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type Regime = z.infer<typeof regimeSchema>;

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const regimeFormSchema = z
  .object({
    memberId: z.string().min(1, "Selecione uma pessoa."),
    tipo: tipoRegimeSchema,
    processoSei: z.string().min(1, "Processo SEI é obrigatório.").max(40),
    dataInicio: dateStringSchema,
    dataFimPrevista: z.string(),
    observacoes: z.string().max(1000),
  })
  .refine(
    (d) =>
      d.dataFimPrevista === "" ||
      new Date(`${d.dataFimPrevista}T12:00:00`).getTime() >=
        new Date(`${d.dataInicio}T12:00:00`).getTime(),
    { message: "Fim previsto não pode ser anterior ao início.", path: ["dataFimPrevista"] },
  );
export type RegimeForm = z.infer<typeof regimeFormSchema>;
