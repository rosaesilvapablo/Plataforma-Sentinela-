import { z } from "zod";

// Tipo de vinculo: como a pessoa se conecta a Vara.
export const tipoVinculoSchema = z.enum([
  "juiz",
  "servidor",
  "estagiario",
  "terceirizado",
  "cedido",
  "requisitado",
  "voluntario",
]);
export type TipoVinculo = z.infer<typeof tipoVinculoSchema>;

export const TIPO_VINCULO_LABELS: Record<TipoVinculo, string> = {
  juiz: "Juiz",
  servidor: "Servidor",
  estagiario: "Estagiário",
  terceirizado: "Terceirizado",
  cedido: "Cedido",
  requisitado: "Requisitado",
  voluntario: "Voluntário",
};

export const personStatusSchema = z.enum(["ativo", "afastado", "desligado"]);
export type PersonStatus = z.infer<typeof personStatusSchema>;

export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  ativo: "Ativo",
  afastado: "Afastado",
  desligado: "Desligado",
};

/**
 * Registro de membro da Equipe — coleção `team`.
 * `cargoEfetivo` é imutável após criação (regra de negócio acordada).
 * `funcaoComissionada` é mutável e SEM histórico (apenas estado atual).
 */
export const teamMemberSchema = z.object({
  uid: z.string(),
  nome: z.string().min(2).max(120),
  email: z.string().email(),
  matricula: z.string().min(1).max(20),
  cargoEfetivo: z.string().min(2).max(120),
  funcaoComissionada: z.string().max(20).nullable(),
  tipoVinculo: tipoVinculoSchema,
  lotacaoParadigma: z.string().min(2).max(120),
  lotacaoAtual: z.string().min(2).max(120),
  status: personStatusSchema,
  observacoes: z.string().max(1000).nullable(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

/** Form de criação — inclui cargoEfetivo (so na criacao). Strings vazias permitidas em campos opcionais. */
export const createTeamMemberFormSchema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres.").max(120, "Máximo 120 caracteres."),
  email: z.string().min(1, "Obrigatório.").email("E-mail inválido."),
  matricula: z.string().min(1, "Obrigatório.").max(20),
  cargoEfetivo: z.string().min(2, "Mínimo 2 caracteres.").max(120),
  funcaoComissionada: z.string().max(20, "Máximo 20 caracteres."),
  tipoVinculo: tipoVinculoSchema,
  lotacaoParadigma: z.string().min(2, "Mínimo 2 caracteres.").max(120),
  lotacaoAtual: z.string().min(2, "Mínimo 2 caracteres.").max(120),
  observacoes: z.string().max(1000, "Máximo 1000 caracteres."),
});
export type CreateTeamMemberForm = z.infer<typeof createTeamMemberFormSchema>;

/** Form de edição — SEM cargoEfetivo (imutável), COM status. */
export const updateTeamMemberFormSchema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres.").max(120),
  email: z.string().min(1).email("E-mail inválido."),
  matricula: z.string().min(1, "Obrigatório.").max(20),
  funcaoComissionada: z.string().max(20),
  tipoVinculo: tipoVinculoSchema,
  lotacaoParadigma: z.string().min(2).max(120),
  lotacaoAtual: z.string().min(2).max(120),
  status: personStatusSchema,
  observacoes: z.string().max(1000),
});
export type UpdateTeamMemberForm = z.infer<typeof updateTeamMemberFormSchema>;
