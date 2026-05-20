import { Badge } from "@/components/ui/Badge";
import { type UserStatus } from "@/domain/users";

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return status === "active" ? (
    <Badge tone="green">Ativo</Badge>
  ) : (
    <Badge tone="neutral">Desativado</Badge>
  );
}
