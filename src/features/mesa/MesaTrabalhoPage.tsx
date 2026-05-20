import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { MesaCardDialog } from "@/features/mesa/MesaCardDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useMesaCards } from "@/hooks/useMesaCards";
import { useAuth } from "@/auth/useAuth";
import { hasAnyRole } from "@/domain/roles";
import {
  MESA_COLUMN_LABELS,
  MESA_COLUMNS_ORDER,
  type MesaCard,
  type MesaColumn,
} from "@/domain/mesaCard";
import { deleteMesaCard, moveMesaCard } from "@/data/mesaCard.repo";

const COLUMN_COLORS: Record<MesaColumn, string> = {
  concluso_despacho: "bg-blue-50 border-blue-200",
  concluso_decisao: "bg-amber-50 border-amber-200",
  concluso_sentenca: "bg-purple-50 border-purple-200",
  em_diligencia: "bg-orange-50 border-orange-200",
  concluido: "bg-emerald-50 border-emerald-200",
};

function fmt(d: Date | null): string {
  return d ? d.toLocaleDateString("pt-BR") : "—";
}

function neighbor(col: MesaColumn, dir: -1 | 1): MesaColumn | null {
  const idx = MESA_COLUMNS_ORDER.indexOf(col);
  const next = idx + dir;
  if (next < 0 || next >= MESA_COLUMNS_ORDER.length) return null;
  return MESA_COLUMNS_ORDER[next] ?? null;
}

export function MesaTrabalhoPage() {
  const { rows, loading, error } = useMesaCards();
  const { role } = useAuth();
  const canRead = hasAnyRole(role, ["diretor", "juiz", "supervisor", "servidor"]);
  const canWrite = hasAnyRole(role, ["diretor", "supervisor", "servidor"]);
  const canDelete = hasAnyRole(role, ["diretor"]);
  const [openDialog, setOpenDialog] = useState(false);
  const [defaultColumn, setDefaultColumn] = useState<MesaColumn | undefined>();
  const [editTarget, setEditTarget] = useState<MesaCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MesaCard | null>(null);

  const byColumn = useMemo(() => {
    const map = new Map<MesaColumn, MesaCard[]>();
    for (const col of MESA_COLUMNS_ORDER) map.set(col, []);
    for (const r of rows) {
      const arr = map.get(r.column) ?? [];
      arr.push(r);
      map.set(r.column, arr);
    }
    return map;
  }, [rows]);

  if (!canRead) return <Alert tone="warning">Acesso negado.</Alert>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-sentinela-ink">Mesa de Trabalho</h1>
          <p className="text-sm text-slate-500">
            Kanban com estados processuais. Mova cartões com as setas.
          </p>
        </div>
        {canWrite ? (
          <Button
            onClick={() => {
              setDefaultColumn(undefined);
              setOpenDialog(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo cartão
          </Button>
        ) : null}
      </header>

      {error ? (
        <Alert tone="danger">Falha: {error.message}</Alert>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {MESA_COLUMNS_ORDER.map((col) => {
            const cards = byColumn.get(col) ?? [];
            return (
              <div
                key={col}
                className={`rounded-lg border ${COLUMN_COLORS[col]} p-3 flex flex-col gap-3 min-h-[200px]`}
              >
                <header className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-sentinela-ink">
                    {MESA_COLUMN_LABELS[col]}
                  </h2>
                  <Badge tone="neutral">{cards.length}</Badge>
                </header>
                <div className="flex flex-col gap-2">
                  {cards.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">Vazio</p>
                  ) : (
                    cards.map((c) => (
                      <article
                        key={c.id}
                        className="rounded-md border border-slate-200 bg-white p-3 shadow-sm space-y-2"
                      >
                        <h3 className="text-sm font-medium text-sentinela-ink line-clamp-2">
                          {c.titulo}
                        </h3>
                        <p className="text-xs font-mono text-slate-500">{c.processo}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 truncate">
                            {c.assigneeNome ?? "Sem responsável"}
                          </span>
                          <span className="text-slate-500">{fmt(c.prazo)}</span>
                        </div>
                        {canWrite ? (
                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const prev = neighbor(c.column, -1);
                                  if (prev) void moveMesaCard(c.id, prev);
                                }}
                                disabled={!neighbor(c.column, -1)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Mover para coluna anterior"
                                title="Mover para coluna anterior"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = neighbor(c.column, 1);
                                  if (next) void moveMesaCard(c.id, next);
                                }}
                                disabled={!neighbor(c.column, 1)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Mover para próxima coluna"
                                title="Mover para próxima coluna"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setEditTarget(c)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                                aria-label="Editar"
                                title="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              {canDelete ? (
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(c)}
                                  className="rounded p-1 text-red-400 hover:bg-red-50"
                                  aria-label="Excluir"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>
                {canWrite ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultColumn(col);
                      setOpenDialog(true);
                    }}
                    className="rounded border border-dashed border-slate-300 py-2 text-xs text-slate-500 hover:bg-white hover:border-slate-400 transition"
                  >
                    + Novo nesta coluna
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {canWrite ? (
        <>
          <MesaCardDialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            defaultColumn={defaultColumn}
          />
          {editTarget ? (
            <MesaCardDialog
              open
              existing={editTarget}
              onClose={() => setEditTarget(null)}
            />
          ) : null}
          {deleteTarget && canDelete ? (
            <ConfirmDeleteDialog
              title="Excluir cartão"
              message={`Excluir "${deleteTarget.titulo}"?`}
              onConfirm={async () => {
                await deleteMesaCard(deleteTarget.id);
              }}
              onClose={() => setDeleteTarget(null)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
