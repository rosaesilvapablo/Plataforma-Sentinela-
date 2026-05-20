import { useMemo, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { BoletimImportDialog } from "@/features/estatisticas/BoletimImportDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useBoletins } from "@/hooks/useBoletins";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess, hasAnyRole } from "@/domain/roles";
import { TIPO_BOLETIM_LABELS, type Boletim, type TipoBoletim } from "@/domain/estatisticas";
import { deleteBoletim } from "@/data/estatisticas.repo";

function exportCsv(b: Boletim) {
  const lines = ["indicador,valor"];
  for (const [k, v] of Object.entries(b.indicadores)) {
    lines.push(`"${k.replaceAll('"', '""')}",${v}`);
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `boletim_${b.tipo}_${b.periodo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function EstatisticasPage() {
  const { rows, loading, error } = useBoletins();
  const { role } = useAuth();
  const canRead = hasAnyRole(role, ["diretor", "juiz"]);
  const canWrite = hasFullAccess(role);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Boletim | null>(null);
  const [selected, setSelected] = useState<Boletim | null>(null);

  // Mapa de "anterior" por tipo, para passar ao dialog (validacao cruzada).
  const previousByType = useMemo(() => {
    const m = new Map<TipoBoletim, Boletim | null>();
    const tipos: TipoBoletim[] = ["tipo_1", "tipo_4"];
    for (const t of tipos) {
      const sorted = rows
        .filter((r) => r.tipo === t)
        .sort((a, b) => b.periodo.localeCompare(a.periodo));
      m.set(t, sorted[0] ?? null);
    }
    return m;
  }, [rows]);

  if (!canRead) return <Alert tone="warning">Acesso negado.</Alert>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-sentinela-ink">Estatísticas</h1>
          <p className="text-sm text-slate-500">
            Boletins mensais Tipo 1 (acervo) e Tipo 4 (gerencial), importados via CSV.
          </p>
        </div>
        {canWrite ? (
          <Button onClick={() => setOpenDialog(true)}>
            <Upload className="h-4 w-4" /> Importar CSV
          </Button>
        ) : null}
      </header>

      {error ? (
        <Alert tone="danger">Falha: {error.message}</Alert>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6">
            {canWrite
              ? "Nenhum boletim importado. Clique em “Importar CSV” para começar."
              : "Nenhum boletim disponível."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-0 overflow-hidden">
            <header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-medium">Boletins recentes</h2>
              <Badge tone="neutral">{rows.length}</Badge>
            </header>
            <ul className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {rows.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(b)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${
                      selected?.id === b.id ? "bg-sentinela-accent/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {b.periodo} · {TIPO_BOLETIM_LABELS[b.tipo]}
                        </p>
                        <p className="text-xs text-slate-500">
                          {Object.keys(b.indicadores).length} indicador(es)
                        </p>
                      </div>
                      <Badge tone={b.tipo === "tipo_1" ? "blue" : "gold"}>
                        {b.tipo === "tipo_1" ? "Acervo" : "Gerencial"}
                      </Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            {selected ? (
              <>
                <header className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-medium">
                      {selected.periodo} · {TIPO_BOLETIM_LABELS[selected.tipo]}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {Object.keys(selected.indicadores).length} indicador(es)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => exportCsv(selected)}
                    >
                      <Download className="h-3.5 w-3.5" /> Exportar
                    </Button>
                    {canWrite ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteTarget(selected)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </header>
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sticky top-0 bg-white">
                      <tr>
                        <th className="px-2 py-2">Indicador</th>
                        <th className="px-2 py-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(selected.indicadores).map(([k, v]) => (
                        <tr key={k}>
                          <td className="px-2 py-2">{k}</td>
                          <td className="px-2 py-2 text-right font-mono">
                            {v.toLocaleString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {selected.observacoes ? (
                  <p className="mt-3 text-xs text-slate-500 border-t pt-2">
                    {selected.observacoes}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-center text-slate-400 py-12">
                Selecione um boletim ao lado.
              </p>
            )}
          </Card>
        </div>
      )}

      {canWrite ? (
        <BoletimImportDialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          previousByType={previousByType}
        />
      ) : null}

      {deleteTarget && canWrite ? (
        <ConfirmDeleteDialog
          title="Excluir boletim"
          message={`Excluir boletim ${TIPO_BOLETIM_LABELS[deleteTarget.tipo]} (${deleteTarget.periodo})?`}
          onConfirm={async () => {
            await deleteBoletim(deleteTarget.id);
            if (selected?.id === deleteTarget.id) setSelected(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  );
}
