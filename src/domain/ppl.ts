import { z } from "zod";

export const tipoPrisaoSchema = z.enum([
  "preventiva",
  "temporaria",
  "flagrante",
  "definitiva",
  "monitoramento_eletronico",
  "outra",
]);
export type TipoPrisao = z.infer<typeof tipoPrisaoSchema>;

export const TIPO_PRISAO_LABELS: Record<TipoPrisao, string> = {
  preventiva: "Prisão preventiva",
  temporaria: "Prisão temporária",
  flagrante: "Prisão em flagrante",
  definitiva: "Prisão definitiva",
  monitoramento_eletronico: "Monitoramento eletrônico",
  outra: "Outra cautelar",
};

export const pplSchema = z.object({
  id: z.string(),
  nome: z.string(),
  cpf: z.string().nullable(),
  rg: z.string().nullable(),
  processo: z.string(),
  tipoPrisao: tipoPrisaoSchema,
  dataPrisao: z.date(),
  ultimaRevisao: z.date().nullable(),
  proximaRevisao: z.date().nullable(),
  unidade: z.string().nullable(),
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type Ppl = z.infer<typeof pplSchema>;

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");
const dateStringOptional = z.string();

export const pplFormSchema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres.").max(120),
  cpf: z.string().max(20),
  rg: z.string().max(20),
  processo: z.string().min(1, "Processo obrigatório.").max(40),
  tipoPrisao: tipoPrisaoSchema,
  dataPrisao: dateStringSchema,
  ultimaRevisao: dateStringOptional,
  unidade: z.string().max(120),
  observacoes: z.string().max(2000),
});
export type PplForm = z.infer<typeof pplFormSchema>;

/**
 * Calcula a próxima revisão Art. 316 CPP (90 dias) para prisão preventiva.
 * Base: última revisão se existir, senão data da prisão.
 * Retorna null se tipoPrisao não for preventiva.
 */
export function calcularProximaRevisao(
  tipo: TipoPrisao,
  dataPrisao: Date,
  ultimaRevisao: Date | null,
): Date | null {
  if (tipo !== "preventiva") return null;
  const base = ultimaRevisao ?? dataPrisao;
  const next = new Date(base);
  next.setDate(next.getDate() + 90);
  return next;
}

export type RevisaoStatus = "ok" | "atencao" | "urgente" | "vencido";

export function classificarRevisao(proximaRevisao: Date | null): {
  status: RevisaoStatus;
  diasRestantes: number | null;
} {
  if (!proximaRevisao) return { status: "ok", diasRestantes: null };
  const now = new Date();
  const diff = proximaRevisao.getTime() - now.getTime();
  const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (dias < 0) return { status: "vencido", diasRestantes: dias };
  if (dias <= 7) return { status: "urgente", diasRestantes: dias };
  if (dias <= 30) return { status: "atencao", diasRestantes: dias };
  return { status: "ok", diasRestantes: dias };
}
