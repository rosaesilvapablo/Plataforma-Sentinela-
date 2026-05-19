import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/auth/useAuth";
import { ROLE_LABELS } from "@/domain/roles";

export function DashboardHome() {
  const { user, role } = useAuth();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Painel</h1>
        <p className="text-sm text-slate-500">
          Bem-vindo, {user?.displayName || user?.email}. Perfil:{" "}
          {role ? ROLE_LABELS[role] : "—"}.
        </p>
      </header>
      <Card>
        <div className="flex items-center gap-3">
          <h2 className="font-medium">Reconstrucao em andamento</h2>
          <Badge tone="gold">v2026</Badge>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Esqueleto operacional ativo. Os modulos de negocio serao habilitados conforme a matriz
          do contrato — comecando por <strong>Equipe</strong>.
        </p>
      </Card>
    </div>
  );
}
