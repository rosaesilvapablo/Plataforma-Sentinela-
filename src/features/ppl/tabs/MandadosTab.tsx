import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { MandadoDialog } from "@/features/ppl/dialogs/MandadoDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useMandadosList } from "@/hooks/useMandadosList";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess, hasAnyRole } from "@/domain/roles";
import {
  CATEGORIA_MANDADO_LABELS,
  STATUS_MANDADO_LABELS,
  type Mandado,
  type CategoriaMandado,
  type StatusMandado,
} from "@/domain/mandados";
import { deleteMandado } from "@/data/mandados.repo";

const CATEGORIA_TONES: Record<CategoriaMandado, BadgeTone> = {
  pendente_cumprimento: "gold",
  difusao_vermelha: "red",
  revisao_316: "blue",
};

const STATUS_TONES: Record<StatusMandado, BadgeTone> = {
  ativo: "gold",
  cumprido: "green",
  cancelado: "neutral",
};

function fmt(d: Date | null): string {
  return d ? d.toLocaleDateString("pt-BR") : "—";
}

export function MandadosTab() {
  const { rows, loading, error } = useMandadosList();
  const { role } = useAuth();
  const canRead = hasAnyRole(role, ["diretor", "juiz", "supervisor", "servidor"]);
  const canWrite = hasFullAccess(role);
  const [filterCategoria, setFilterCategoria] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("ativo");
  const [openDialog, setOpenDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Mandado | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mandado | null>(null);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filterCategoria && r.categoria !== filterCategoria) return false;
        if (filterStatus && r.status !== filterStatus) return false;
        return true;
      }),
    [rows, filterCategoria, filterStatus],
  );

  if (!canRead) return <Alert tone="warning">Acesso negado.</Alert>;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div>
            <label
              htmlFor="cat"
              className="text-xs font-semibold tracking-wider uppercase text-slate-500"
            >
              Categoria
            </label>
            <select
              id="cat"
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="mt-1 h-10 rounded-md border border-slate-300 bg-white px-3 text-sm min-w-[220px]"
            >
              <option value="">Todas</option>
              {(Object.keys(CATEGORIA_MANDADO_LABELS) as CategoriaMandado[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_MANDADO_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="st"
              className="text-xs font-semibold tracking-wider uppercase text-slate-500"
            >
              Status
            </label>
            <select
              id="st"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 h-10 rounded-md border border-slate-300 bg-white px-3 text-sm min-w-[160px]"
            >
              <option value="">Todos</option>
              {(Object.keys(STATUS_MANDADO_LABELS) as StatusMandado[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_MANDADO_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {canWrite ? (
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4" /> Registrar
          </Button>
        ) : null}
      </div>

      {error ? (
        <Alert tone="danger">Falha: {error.message}</Alert>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6">
            {rows.length === 0 ? "Nenhum mandado registrado." : "Nenhum resultado."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Pessoa</th>
                  <th className="px-4 py-3">Processo</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Prazo</th>
                  <th className="px-4 py-3">Status</th>
                  {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">{r.pessoa}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">
                      {r.processo}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={CATEGORIA_TONES[r.categoria]}>
                        {CATEGORIA_MANDADO_LABELS[r.categoria]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{fmt(r.prazo)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONES[r.status]}>
                        {STATUS_MANDADO_LABELS[r.status]}
                      </Badge>
                    </td>
                    {canWrite ? (
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <Button size="sm" variant="secondary" onClick={() => setEditTarget(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(r)}>
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
          <MandadoDialog open={openDialog} onClose={() => setOpenDialog(false)} />
          {editTarget ? (
            <MandadoDialog open existing={editTarget} onClose={() => setEditTarget(null)} />
          ) : null}
          {deleteTarget ? (
            <ConfirmDeleteDialog
              title="Excluir mandado"
              message={`Excluir o mandado de ${deleteTarget.pessoa}?`}
              onConfirm={async () => {
                await deleteMandado(deleteTarget.id);
              }}
              onClose={() => setDeleteTarget(null)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
