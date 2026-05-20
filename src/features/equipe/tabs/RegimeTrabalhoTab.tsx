import { useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { RegimeDialog } from "@/features/equipe/dialogs/RegimeDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useRegimeList } from "@/hooks/useRegimeList";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess } from "@/domain/roles";
import { TIPO_REGIME_LABELS, type Regime } from "@/domain/regimeTrabalho";
import { deleteRegime } from "@/data/regimeTrabalho.repo";

function fmt(d: Date | null): string {
  return d ? d.toLocaleDateString("pt-BR") : "—";
}

function daysUntil(d: Date): number {
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function deadlineHint(r: Regime): { label: string; tone: "neutral" | "gold" | "red" } | null {
  if (!r.dataFimPrevista) return null;
  const days = daysUntil(r.dataFimPrevista);
  if (days < 0) return { label: `Vencido há ${Math.abs(days)}d`, tone: "red" };
  if (days <= 7) return { label: `Vence em ${days}d`, tone: "red" };
  if (days <= 30) return { label: `Vence em ${days}d`, tone: "gold" };
  return null;
}

export function RegimeTrabalhoTab() {
  const { rows, loading, error } = useRegimeList();
  const { role } = useAuth();
  const canWrite = hasFullAccess(role);
  const [openDialog, setOpenDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Regime | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Regime | null>(null);

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-slate-500">
          Regime de trabalho de cada membro com vínculo ao processo SEI e alerta de prazo.
        </p>
        {canWrite ? (
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4" /> Registrar
          </Button>
        ) : null}
      </div>

      {error ? (
        <Alert tone="danger">Falha ao carregar regimes: {error.message}</Alert>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6">Nenhum regime registrado.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Pessoa</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Processo SEI</th>
                  <th className="px-4 py-3">Início</th>
                  <th className="px-4 py-3">Fim previsto</th>
                  {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const hint = deadlineHint(r);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">{r.memberNome}</td>
                      <td className="px-4 py-3">
                        <Badge tone="blue">{TIPO_REGIME_LABELS[r.tipo]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">
                        {r.processoSei}
                      </td>
                      <td className="px-4 py-3 text-sm">{fmt(r.dataInicio)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {fmt(r.dataFimPrevista)}
                          {hint ? (
                            <span
                              className={
                                hint.tone === "red"
                                  ? "inline-flex items-center gap-1 text-xs text-red-700"
                                  : "inline-flex items-center gap-1 text-xs text-amber-700"
                              }
                            >
                              <AlertTriangle className="h-3 w-3" />
                              {hint.label}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      {canWrite ? (
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditTarget(r)}
                            aria-label="Editar regime"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteTarget(r)}
                            aria-label="Excluir regime"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {canWrite ? (
        <>
          <RegimeDialog open={openDialog} onClose={() => setOpenDialog(false)} />
          {editTarget ? (
            <RegimeDialog
              open
              existing={editTarget}
              onClose={() => setEditTarget(null)}
            />
          ) : null}
          {deleteTarget ? (
            <ConfirmDeleteDialog
              title="Excluir regime"
              message={`Excluir o regime de ${deleteTarget.memberNome}?`}
              onConfirm={async () => {
                await deleteRegime(deleteTarget.id);
              }}
              onClose={() => setDeleteTarget(null)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
