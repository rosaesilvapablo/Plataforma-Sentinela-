export const ROLES = [
  "admin",
  "diretor",
  "juiz",
  "supervisor",
  "servidor",
  "estagiario",
  "terceirizado",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  diretor: "Diretor",
  juiz: "Juiz",
  supervisor: "Supervisor",
  servidor: "Servidor",
  estagiario: "Estagiario",
  terceirizado: "Terceirizado",
};

/**
 * Por decisao de arquitetura, `admin` e `diretor` sao funcionalmente identicos
 * em termos de permissao — ambos tem CRUD total em todo o sistema. Mantidos
 * como dois labels distintos por significado organizacional.
 */
export function hasFullAccess(current: Role | null): boolean {
  return current === "admin" || current === "diretor";
}

export function hasAnyRole(current: Role | null, allowed: readonly Role[]): boolean {
  if (!current) return false;
  if (hasFullAccess(current)) return true;
  return allowed.includes(current);
}
