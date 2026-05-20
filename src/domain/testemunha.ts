import { z } from "zod";

export const statusTestemunhaSchema = z.enum(["ativo", "encerrado"]);
export type StatusTestemunha = z.infer<typeof statusTestemunhaSchema>;

export const STATUS_TESTEMUNHA_LABELS: Record<StatusTestemunha, string> = {
  ativo: "Ativo",
  encerrado: "Encerrado",
};

/**
 * Testemunha Protegida (Lei 9.807/99).
 * IMPORTANTE: dados sensíveis (nome, endereço, contato) NÃO devem ser
 * armazenados aqui. Esta coleção guarda apenas IDENTIFICADORES e
 * referências administrativas. Dados pessoais ficam em sistemas com
 * sigilo apropriado (físico ou criptografado fora deste app).
 */
export const testemunhaSchema = z.object({
  id: z.string(),
  codigo: z.string(), // identificador único interno, NÃO o nome
  caso: z.string(),
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
  caso: z.string().min(1, "Caso/processo obrigatório.").max(200),
  status: statusTestemunhaSchema,
  dataInclusao: dateStringSchema,
  dataEncerramento: dateStringOptional,
  observacoes: z.string().max(2000),
});
export type TestemunhaForm = z.infer<typeof testemunhaFormSchema>;
