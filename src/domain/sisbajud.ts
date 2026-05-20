import { z } from "zod";

export const statusSisbajudSchema = z.enum([
  "pendente",
  "bloqueado",
  "transferido",
  "cancelado",
]);
export type StatusSisbajud = z.infer<typeof statusSisbajudSchema>;

export const STATUS_SISBAJUD_LABELS: Record<StatusSisbajud, string> = {
  pendente: "Pendente",
  bloqueado: "Bloqueado",
  transferido: "Transferido",
  cancelado: "Cancelado",
};

export const sisbajudOrdemSchema = z.object({
  id: z.string(),
  processo: z.string(),
  ordem: z.string(),
  pessoa: z.string(),
  valor: z.number(),
  status: statusSisbajudSchema,
  data: z.date(),
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type SisbajudOrdem = z.infer<typeof sisbajudOrdemSchema>;

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const sisbajudOrdemFormSchema = z.object({
  processo: z.string().min(1, "Obrigatório.").max(40),
  ordem: z.string().min(1, "Obrigatório.").max(40),
  pessoa: z.string().min(2, "Mínimo 2 caracteres.").max(120),
  valor: z.number().min(0, "Valor não pode ser negativo."),
  status: statusSisbajudSchema,
  data: dateStringSchema,
  observacoes: z.string().max(2000),
});
export type SisbajudOrdemForm = z.infer<typeof sisbajudOrdemFormSchema>;

export const contaDepositoSchema = z.enum(["anpp", "prd", "conta_unica", "judicial"]);
export type ContaDeposito = z.infer<typeof contaDepositoSchema>;

export const CONTA_DEPOSITO_LABELS: Record<ContaDeposito, string> = {
  anpp: "ANPP",
  prd: "PRD",
  conta_unica: "Conta Única",
  judicial: "Conta judicial",
};

export const depositoSchema = z.object({
  id: z.string(),
  processo: z.string(),
  conta: contaDepositoSchema,
  valor: z.number(),
  data: z.date(),
  ordemSisbajudId: z.string().nullable(),
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type Deposito = z.infer<typeof depositoSchema>;

export const depositoFormSchema = z.object({
  processo: z.string().min(1, "Obrigatório.").max(40),
  conta: contaDepositoSchema,
  valor: z.number().min(0, "Valor não pode ser negativo."),
  data: dateStringSchema,
  ordemSisbajudId: z.string(),
  observacoes: z.string().max(2000),
});
export type DepositoForm = z.infer<typeof depositoFormSchema>;

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
