import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { useFrequenciaList } from "@/hooks/useFrequenciaList";
import { useTeamList } from "@/hooks/useTeamList";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess } from "@/domain/roles";
import {
  FREQUENCIA_TIPO_LABELS,
  frequenciaTipoSchema,
  type Frequencia,
  type FrequenciaTipo,
} from "@/domain/frequencia";
import { CreateFrequenciaDialog } from "@/features/equipe/dialogs/CreateFrequenciaDialog";
import { EditFrequenciaDialog } from "@/features/equipe/dialogs/EditFrequenciaDialog";
import { DeleteFrequenciaDialog } from "@/features/equipe/dialogs/DeleteFrequenciaDialog";
import { FrequenciaTipoBadge } from "@/features/equipe/components/FrequenciaTipoBadge";

const TIPO_OPTIONS: FrequenciaTipo[] = [...frequenciaTipoSchema.options];

function formatRange(row: Frequencia): string {
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR");
  return row.dataInicio.getTime() === row.dataFim.getTime()
    ? fmt(row.dataInicio)
    : `${fmt(row.dataInicio)} → ${fmt(row.dataFim)}`;
}

export function FrequenciaTab() {
  const { rows, loading, error } = useFrequenciaList();
  const { team } = useTeamList();
  const { role } = useAuth();
  const canWrite = hasFullAccess(role);

  const [memberFilter, setMemberFilter] = useState<string>("");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Frequencia | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Frequencia | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (memberFilter && r.memberId !== memberFilter) return false;
      if (tipoFilter && r.tipo !== tipoFilter) return false;
      return true;
    });
  }, [rows, memberFilter, tipoFilter]);

  const totalAusencias = filtered.filter(
    (r) => r.tipo === "ausencia_justificada",
  ).length;
  const totalFaltas = filtered.filter((r) => r.tipo === "falta_injustificada").length;

  return (
    <>
      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">Total no filtro</p>
          <p className="mt-1 text-3xl font-semibold text-sentinela-ink">{filtered.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Ausências justificadas
          </p>
          <p className="mt-1 text-3xl font-semibold text-blue-700">{totalAusencias}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Faltas injustificadas
          </p>
          <p className="mt-1 text-3xl font-semibold text-red-700">{totalFaltas}</p>
        </Card>
      </div>

      {/* Filtros + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div>
            <label
              htmlFor="filter-member"
              className="text-xs font-semibold tracking-wider uppercase text-slate-500"
            >
              Pessoa
            </label>
            <select
              id="filter-member"
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="mt-1 h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent min-w-[200px]"
            >
              <option value="">Todas</option>
              {team.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="filter-tipo"
              className="text-xs font-semibold tracking-wider uppercase text-slate-500"
            >
              Tipo
            </label>
            <select
              id="filter-tipo"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="mt-1 h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent min-w-[200px]"
            >
              <option value="">Todos</option>
              {TIPO_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {FREQUENCIA_TIPO_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {canWrite ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Registrar
          </Button>
        ) : null}
      </div>

      {/* Lista */}
      {error ? (
        <Alert tone="danger">Falha ao carregar frequências: {error.message}</Alert>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6">
            {rows.length === 0
              ? canWrite
                ? "Nenhuma frequência registrada. Clique em “Registrar” para começar."
                : "Nenhuma frequência registrada."
              : "Nenhum resultado para o filtro selecionado."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Pessoa</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Lançado por</th>
                  {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{formatRange(r)}</td>
                    <td className="px-4 py-3 text-sm">{r.memberNome}</td>
                    <td className="px-4 py-3">
                      <FrequenciaTipoBadge tipo={r.tipo} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {r.motivo ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {r.createdByName}
                    </td>
                    {canWrite ? (
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditTarget(r)}
                          aria-label={`Editar frequência de ${r.memberNome}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteTarget(r)}
                          aria-label={`Excluir frequência de ${r.memberNome}`}
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
          <CreateFrequenciaDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
          />
          {editTarget ? (
            <EditFrequenciaDialog
              row={editTarget}
              onClose={() => setEditTarget(null)}
            />
          ) : null}
          {deleteTarget ? (
            <DeleteFrequenciaDialog
              row={deleteTarget}
              onClose={() => setDeleteTarget(null)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
