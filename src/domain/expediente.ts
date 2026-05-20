import { z } from "zod";

export const tipoExpedienteSchema = z.enum([
  "oficio",
  "carta_precatoria",
  "mandado_diligencia",
]);
export type TipoExpediente = z.infer<typeof tipoExpedienteSchema>;

export const TIPO_EXPEDIENTE_LABELS: Record<TipoExpediente, string> = {
  oficio: "Ofício",
  carta_precatoria: "Carta precatória",
  mandado_diligencia: "Mandado de diligência",
};

export const statusExpedienteSchema = z.enum([
  "pendente",
  "emitido",
  "em_diligencia",
  "cumprido",
  "cancelado",
]);
export type StatusExpediente = z.infer<typeof statusExpedienteSchema>;

export const STATUS_EXPEDIENTE_LABELS: Record<StatusExpediente, string> = {
  pendente: "Pendente",
  emitido: "Emitido",
  em_diligencia: "Em diligência",
  cumprido: "Cumprido",
  cancelado: "Cancelado",
};

/**
 * Maquina de estados: transicoes validas (from → to[]).
 */
export const STATUS_TRANSITIONS: Record<StatusExpediente, StatusExpediente[]> = {
  pendente: ["emitido", "cancelado"],
  emitido: ["em_diligencia", "cumprido", "cancelado"],
  em_diligencia: ["cumprido", "cancelado"],
  cumprido: [],
  cancelado: [],
};

export function canTransition(from: StatusExpediente, to: StatusExpediente): boolean {
  return from === to || STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Prazos default em dias por tipo (configuravel no futuro em Admin → Config).
 */
export const PRAZO_DEFAULT_DIAS: Record<TipoExpediente, number> = {
  oficio: 10,
  carta_precatoria: 30,
  mandado_diligencia: 15,
};

export const expedienteSchema = z.object({
  id: z.string(),
  processo: z.string(),
  tipo: tipoExpedienteSchema,
  destinatario: z.string(),
  assunto: z.string(),
  status: statusExpedienteSchema,
  dataEmissao: z.date().nullable(),
  prazoDevolucao: z.date().nullable(),
  dataCumprimento: z.date().nullable(),
  responsavel: z.string().nullable(),
  observacoes: z.string().nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type Expediente = z.infer<typeof expedienteSchema>;

const dateString = z.string();

export const expedienteFormSchema = z.object({
  processo: z.string().min(1, "Obrigatório.").max(40),
  tipo: tipoExpedienteSchema,
  destinatario: z.string().min(2, "Mínimo 2 caracteres.").max(200),
  assunto: z.string().min(2, "Mínimo 2 caracteres.").max(500),
  status: statusExpedienteSchema,
  dataEmissao: dateString,
  prazoDevolucao: dateString,
  dataCumprimento: dateString,
  responsavel: z.string().max(120),
  observacoes: z.string().max(2000),
});
export type ExpedienteForm = z.infer<typeof expedienteFormSchema>;

export type PrazoStatus = "ok" | "atencao" | "urgente" | "vencido" | "na";

export function classificarPrazo(
  prazo: Date | null,
  status: StatusExpediente,
): { status: PrazoStatus; diasRestantes: number | null } {
  if (status === "cumprido" || status === "cancelado") {
    return { status: "na", diasRestantes: null };
  }
  if (!prazo) return { status: "na", diasRestantes: null };
  const diff = prazo.getTime() - Date.now();
  const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (dias < 0) return { status: "vencido", diasRestantes: dias };
  if (dias <= 3) return { status: "urgente", diasRestantes: dias };
  if (dias <= 7) return { status: "atencao", diasRestantes: dias };
  return { status: "ok", diasRestantes: dias };
}
