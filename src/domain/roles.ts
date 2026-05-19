export const ROLES = [
  "admin",
  "juiz",
  "diretor",
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
  juiz: "Juiz",
  diretor: "Diretor",
  supervisor: "Supervisor",
  servidor: "Servidor",
  estagiario: "Estagiario",
  terceirizado: "Terceirizado",
};

export function hasAnyRole(current: Role | null, allowed: readonly Role[]): boolean {
  if (!current) return false;
  if (current === "admin") return true;
  return allowed.includes(current);
}
