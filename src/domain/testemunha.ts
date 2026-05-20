import { z } from "zod";

export const statusTestemunhaSchema = z.enum(["ativo", "encerrado"]);
export type StatusTestemunha = z.infer<typeof statusTestemunhaSchema>;

export const STATUS_TESTEMUNHA_LABELS: Record<StatusTestemunha, string> = {
  ativo: "Ativo",
  encerrado: "Encerrado",
};

/**
 * Testemunha Protegida (Lei 9.807/99).
 *
 * IMPORTANTE: dados sensíveis (nome real, endereço, contato) NÃO devem ser
 * armazenados aqui. Use `codigo` interno e `processo` como referências.
 *
 * Modelo restaurado do legado + refinamentos v2026:
 *   - `processo`: número do processo (legado)
 *   - `quantidadePessoas`: agrupa N testemunhas num só processo (legado)
 *   - `inProvita` + `dataInclusaoProvita`: flag PROVITA (legado)
 *   - `codigo`, `status`, `dataInclusao`, `dataEncerramento`: refinamentos v2026
 *     (auditável e ciclo de vida explícito)
 */
export const testemunhaSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  processo: z.string(),
  quantidadePessoas: z.number().int().min(1),
  inProvita: z.boolean(),
  dataInclusaoProvita: z.date().nullable(),
  status: statusTestemunhaSchema,
  dataInclusao: z.date(),
  dataEncerramento: z.date().nullable(),
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type Testemunha = z.infer<typeof testemunhaSchema>;

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");
const dateStringOptional = z.string();

export const testemunhaFormSchema = z.object({
  codigo: z.string().min(1, "Código obrigatório.").max(40),
  processo: z.string().min(1, "Processo obrigatório.").max(40),
  quantidadePessoas: z
    .number()
    .int("Use número inteiro.")
    .min(1, "Mínimo 1 pessoa.")
    .max(999),
  inProvita: z.boolean(),
  dataInclusaoProvita: dateStringOptional,
  status: statusTestemunhaSchema,
  dataInclusao: dateStringSchema,
  dataEncerramento: dateStringOptional,
  observacoes: z.string().max(2000),
});
export type TestemunhaForm = z.infer<typeof testemunhaFormSchema>;
