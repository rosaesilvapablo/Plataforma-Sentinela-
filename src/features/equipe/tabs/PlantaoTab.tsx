import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { PlantaoDialog } from "@/features/equipe/dialogs/PlantaoDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { usePlantaoList } from "@/hooks/usePlantaoList";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess } from "@/domain/roles";
import { TIPO_PLANTAO_LABELS, type Plantao } from "@/domain/plantao";
import { deletePlantao } from "@/data/plantao.repo";

function formatRange(row: Plantao): string {
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR");
  return row.dataInicio.getTime() === row.dataFim.getTime()
    ? fmt(row.dataInicio)
    : `${fmt(row.dataInicio)} → ${fmt(row.dataFim)}`;
}

export function PlantaoTab() {
  const { rows, loading, error } = usePlantaoList();
  const { role } = useAuth();
  const canWrite = hasFullAccess(role);
  const [openDialog, setOpenDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Plantao | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plantao | null>(null);

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-slate-500">
          Períodos de plantão com juiz e servidor responsáveis.
        </p>
        {canWrite ? (
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4" /> Registrar
          </Button>
        ) : null}
      </div>

      {error ? (
        <Alert tone="danger">Falha ao carregar plantões: {error.message}</Alert>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6">
            Nenhum plantão registrado.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Juiz</th>
                  <th className="px-4 py-3">Servidor</th>
                  {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{formatRange(r)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.tipo === "ordinario" ? "neutral" : r.tipo === "extraordinario" ? "gold" : "blue"}>
                        {TIPO_PLANTAO_LABELS[r.tipo]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{r.juizNome}</td>
                    <td className="px-4 py-3 text-sm">{r.servidorNome}</td>
                    {canWrite ? (
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditTarget(r)}
                          aria-label="Editar plantão"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteTarget(r)}
                          aria-label="Excluir plantão"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {canWrite ? (
        <>
          <PlantaoDialog open={openDialog} onClose={() => setOpenDialog(false)} />
          {editTarget ? (
            <PlantaoDialog
              open
              existing={editTarget}
              onClose={() => setEditTarget(null)}
            />
          ) : null}
          {deleteTarget ? (
            <ConfirmDeleteDialog
              title="Excluir plantão"
              message={`Confirmar exclusão do plantão de ${formatRange(deleteTarget)}?`}
              onConfirm={async () => {
                await deletePlantao(deleteTarget.id);
              }}
              onClose={() => setDeleteTarget(null)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
