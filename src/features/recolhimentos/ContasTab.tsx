import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { MovimentoDialog } from "@/features/recolhimentos/MovimentoDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useMovimentos } from "@/hooks/useRecolhimentos";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess } from "@/domain/roles";
import {
  CONTA_GERIDA_LABELS,
  TIPO_MOVIMENTO_LABELS,
  calcularSaldo,
  formatMoney,
  type Movimento,
  type ContaGerida,
} from "@/domain/recolhimentos";
import { deleteMovimento } from "@/data/recolhimentos.repo";

const CONTAS: ContaGerida[] = ["anpp", "prd", "conta_unica"];

function fmt(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

export function ContasTab() {
  const { rows, loading, error } = useMovimentos();
  const { role } = useAuth();
  const canWrite = hasFullAccess(role);
  const [filterConta, setFilterConta] = useState<string>("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Movimento | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Movimento | null>(null);

  const filtered = useMemo(
    () => (filterConta ? rows.filter((r) => r.conta === filterConta) : rows),
    [rows, filterConta],
  );

  const saldoPorConta = useMemo(() => {
    const m = new Map<ContaGerida, number>();
    for (const c of CONTAS) {
      m.set(c, calcularSaldo(rows.filter((r) => r.conta === c)));
    }
    return m;
  }, [rows]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {CONTAS.map((c) => {
          const saldo = saldoPorConta.get(c) ?? 0;
          return (
            <Card key={c}>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {CONTA_GERIDA_LABELS[c].split(" — ")[0]}
              </p>
              <p
                className={`mt-1 text-2xl font-semibold ${
                  saldo < 0 ? "text-red-700" : "text-sentinela-ink"
                }`}
              >
                {formatMoney(saldo)}
              </p>
              <p className="text-xs text-slate-500">saldo calculado</p>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <label
            htmlFor="filter-conta"
            className="text-xs font-semibold tracking-wider uppercase text-slate-500"
          >
            Conta
          </label>
          <select
            id="filter-conta"
            value={filterConta}
            onChange={(e) => setFilterConta(e.target.value)}
            className="mt-1 h-10 rounded-md border border-slate-300 bg-white px-3 text-sm min-w-[260px]"
          >
            <option value="">Todas</option>
            {CONTAS.map((c) => (
              <option key={c} value={c}>
                {CONTA_GERIDA_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        {canWrite ? (
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4" /> Movimento
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
            {rows.length === 0 ? "Nenhum movimento registrado." : "Sem resultados para o filtro."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Destinação</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{fmt(r.data)}</td>
                    <td className="px-4 py-3 text-sm">
                      {CONTA_GERIDA_LABELS[r.conta].split(" — ")[0]}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={r.tipo === "entrada" ? "green" : "gold"}>
                        {r.tipo === "entrada" ? (
                          <ArrowDownToLine className="inline h-3 w-3 mr-1" />
                        ) : (
                          <ArrowUpFromLine className="inline h-3 w-3 mr-1" />
                        )}
                        {TIPO_MOVIMENTO_LABELS[r.tipo]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{r.descricao}</div>
                      {r.processo ? (
                        <div className="text-xs font-mono text-slate-500">{r.processo}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {r.destinacao ?? "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-medium ${
                        r.tipo === "entrada" ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {r.tipo === "entrada" ? "+" : "−"} {formatMoney(r.valor)}
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
          <MovimentoDialog open={openDialog} onClose={() => setOpenDialog(false)} />
          {editTarget ? (
            <MovimentoDialog open existing={editTarget} onClose={() => setEditTarget(null)} />
          ) : null}
          {deleteTarget ? (
            <ConfirmDeleteDialog
              title="Excluir movimento"
              message={`Excluir movimento de ${formatMoney(deleteTarget.valor)} (${deleteTarget.descricao})?`}
              onConfirm={async () => {
                await deleteMovimento(deleteTarget.id);
              }}
              onClose={() => setDeleteTarget(null)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
