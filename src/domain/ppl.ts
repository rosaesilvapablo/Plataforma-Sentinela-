import { z } from "zod";

// ===== Situação (status do PPL — restaurado do legado) =====
export const situacaoSchema = z.enum([
  "pessoa_presa",
  "mandado_pendente",
  "pessoa_foragida",
]);
export type Situacao = z.infer<typeof situacaoSchema>;

export const SITUACAO_LABELS: Record<Situacao, string> = {
  pessoa_presa: "Pessoa Presa",
  mandado_pendente: "Mandado Pendente",
  pessoa_foragida: "Pessoa Foragida",
};

// ===== Espécie de prisão (mantém v2026 — inclui Monitoramento Eletrônico) =====
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

// ===== Schema completo PPL =====
export const pplSchema = z.object({
  id: z.string(),
  nome: z.string(),
  rji: z.string().nullable(), // BNMP — restaurado
  cpf: z.string().nullable(),
  rg: z.string().nullable(),
  processo: z.string(),
  local: z.string().nullable(), // renomeado de unidade
  situacao: situacaoSchema, // restaurado
  tipoPrisao: tipoPrisaoSchema,
  dataCumprimento: z.date().nullable(), // renomeado de dataPrisao
  ultimaRevisao: z.date().nullable(),
  proximaRevisao: z.date().nullable(),
  redNotice: z.boolean(), // restaurado (flag inline)
  redNoticeDate: z.date().nullable(), // restaurado
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type Ppl = z.infer<typeof pplSchema>;

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");
const dateStringOptional = z.string();

export const pplFormSchema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres.").max(120),
  rji: z.string().max(40),
  cpf: z.string().max(20),
  rg: z.string().max(20),
  processo: z.string().min(1, "Processo obrigatório.").max(40),
  local: z.string().max(120),
  situacao: situacaoSchema,
  tipoPrisao: tipoPrisaoSchema,
  dataCumprimento: dateStringOptional,
  ultimaRevisao: dateStringOptional,
  redNotice: z.boolean(),
  redNoticeDate: dateStringOptional,
  observacoes: z.string().max(2000),
});
export type PplForm = z.infer<typeof pplFormSchema>;

// ===== Cálculos =====

/**
 * Calcula a próxima revisão da prisão (90 dias) — restaurado do legado.
 * Base: última revisão se houver, senão data de cumprimento.
 * Aplica-se apenas quando a pessoa está efetivamente presa.
 */
export function calcularProximaRevisao(
  situacao: Situacao,
  dataCumprimento: Date | null,
  ultimaRevisao: Date | null,
): Date | null {
  if (situacao !== "pessoa_presa") return null;
  const base = ultimaRevisao ?? dataCumprimento;
  if (!base) return null;
  const next = new Date(base);
  next.setDate(next.getDate() + 90);
  return next;
}

/**
 * Dias transcorridos desde uma data até hoje (ceil).
 */
function diasDesde(d: Date | null): number {
  if (!d) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil(Math.abs(today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** Dias preso (somente para situacao = pessoa_presa) — restaurado do legado. */
export function calcularDiasPreso(p: Pick<Ppl, "situacao" | "dataCumprimento">): number {
  return p.situacao === "pessoa_presa" ? diasDesde(p.dataCumprimento) : 0;
}

/** Dias com mandado pendente / pessoa foragida — restaurado do legado. */
export function calcularDiasPendente(p: Pick<Ppl, "situacao" | "dataCumprimento">): number {
  return p.situacao !== "pessoa_presa" ? diasDesde(p.dataCumprimento) : 0;
}

// ===== Classificação de revisão (mantém refinamento v2026: 3 níveis) =====
export type RevisaoStatus = "ok" | "atencao" | "urgente" | "vencido" | "na";

export function classificarRevisao(proximaRevisao: Date | null): {
  status: RevisaoStatus;
  diasRestantes: number | null;
} {
  if (!proximaRevisao) return { status: "na", diasRestantes: null };
  const now = new Date();
  const diff = proximaRevisao.getTime() - now.getTime();
  const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (dias < 0) return { status: "vencido", diasRestantes: dias };
  if (dias <= 7) return { status: "urgente", diasRestantes: dias };
  if (dias <= 30) return { status: "atencao", diasRestantes: dias };
  return { status: "ok", diasRestantes: dias };
}

export { dateStringSchema as _dateStringSchema };
