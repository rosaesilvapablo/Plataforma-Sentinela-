import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ROLE_LABELS, type Role } from "@/domain/roles";

const tones: Record<Role, BadgeTone> = {
  admin: "red",
  diretor: "gold",
  juiz: "blue",
  supervisor: "blue",
  servidor: "neutral",
  estagiario: "neutral",
  terceirizado: "neutral",
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={tones[role]}>{ROLE_LABELS[role]}</Badge>;
}
