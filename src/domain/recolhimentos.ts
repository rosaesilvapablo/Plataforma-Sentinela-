import { z } from "zod";

export const orientacoesSchema = z.object({
  id: z.string(),
  conteudo: z.string(),
  updatedAt: z.date().nullable().optional(),
  updatedByUid: z.string().nullable(),
  updatedByName: z.string().nullable(),
});
export type Orientacoes = z.infer<typeof orientacoesSchema>;

export const orientacoesFormSchema = z.object({
  conteudo: z.string().max(20000, "Máximo 20000 caracteres."),
});
export type OrientacoesForm = z.infer<typeof orientacoesFormSchema>;

export const contaGeridaSchema = z.enum(["anpp", "prd", "conta_unica"]);
export type ContaGerida = z.infer<typeof contaGeridaSchema>;

export const CONTA_GERIDA_LABELS: Record<ContaGerida, string> = {
  anpp: "ANPP — Acordo de Não Persecução Penal",
  prd: "PRD — Prestação Pecuniária",
  conta_unica: "Conta Única",
};

export const tipoMovimentoSchema = z.enum(["entrada", "saida"]);
export type TipoMovimento = z.infer<typeof tipoMovimentoSchema>;

export const TIPO_MOVIMENTO_LABELS: Record<TipoMovimento, string> = {
  entrada: "Entrada",
  saida: "Saída / Destinação",
};

export const movimentoSchema = z.object({
  id: z.string(),
  conta: contaGeridaSchema,
  tipo: tipoMovimentoSchema,
  valor: z.number(),
  data: z.date(),
  descricao: z.string(),
  destinacao: z.string().nullable(),
  processo: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type Movimento = z.infer<typeof movimentoSchema>;

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const movimentoFormSchema = z.object({
  conta: contaGeridaSchema,
  tipo: tipoMovimentoSchema,
  valor: z.number().min(0, "Valor não pode ser negativo."),
  data: dateStringSchema,
  descricao: z.string().min(2, "Descreva o movimento.").max(500),
  destinacao: z.string().max(500),
  processo: z.string().max(40),
});
export type MovimentoForm = z.infer<typeof movimentoFormSchema>;

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function calcularSaldo(movimentos: Movimento[]): number {
  return movimentos.reduce(
    (s, m) => s + (m.tipo === "entrada" ? m.valor : -m.valor),
    0,
  );
}
