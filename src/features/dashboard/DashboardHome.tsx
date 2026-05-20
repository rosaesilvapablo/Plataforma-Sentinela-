import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarPlus, Users, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess, ROLE_LABELS } from "@/domain/roles";
import { CreateFrequenciaDialog } from "@/features/equipe/dialogs/CreateFrequenciaDialog";

export function DashboardHome() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const canWrite = hasFullAccess(role);
  const [createFreqOpen, setCreateFreqOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Sala de Situação</h1>
        <p className="text-sm text-slate-500">
          Bem-vindo, {user?.displayName || user?.email}. Perfil:{" "}
          {role ? ROLE_LABELS[role] : "—"}.
        </p>
      </header>

      {/* Atalhos rapidos (admin/diretor) */}
      {canWrite ? (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
            Atalhos rápidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Card className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sentinela-accent/10 p-2 text-sentinela-accent">
                  <CalendarPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Lançar frequência</p>
                  <p className="text-xs text-slate-500">Ausência ou falta</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setCreateFreqOpen(true)}>
                Lançar
              </Button>
            </Card>
            <Card className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">Cadastrar membro</p>
                  <p className="text-xs text-slate-500">Equipe da Vara</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate("/equipe?tab=cadastro")}
              >
                Ir
              </Button>
            </Card>
          </div>
        </section>
      ) : null}

      <Card>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-slate-400" />
          <h2 className="font-medium">Indicadores</h2>
          <Badge tone="gold">em construção</Badge>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Widgets reativos com alertas acionáveis (Art. 316 vencendo, expedientes em atraso,
          plantão sem responsável, metas CNJ críticas, ausências pendentes) virão na tarefa #31.
        </p>
      </Card>

      {canWrite ? (
        <CreateFrequenciaDialog
          open={createFreqOpen}
          onClose={() => setCreateFreqOpen(false)}
        />
      ) : null}
    </div>
  );
}
