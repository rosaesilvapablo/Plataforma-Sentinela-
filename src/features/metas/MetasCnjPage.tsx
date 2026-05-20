import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { MetaDialog } from "@/features/metas/MetaDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useMetas } from "@/hooks/useMetas";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess, hasAnyRole } from "@/domain/roles";
import { projetarCumprimento, type MetaEvolucao } from "@/domain/metas";
import { deleteMeta } from "@/data/metas.repo";

type MetaGroup = {
  codigo: string;
  descricao: string;
  evolucoes: MetaEvolucao[];
};

export function MetasCnjPage() {
  const { rows, loading, error } = useMetas();
  const { role } = useAuth();
  const canRead = hasAnyRole(role, ["diretor", "juiz"]);
  const canWrite = hasFullAccess(role);
  const [openDialog, setOpenDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<MetaEvolucao | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MetaEvolucao | null>(null);
  const [selectedCodigo, setSelectedCodigo] = useState<string | null>(null);
  const [presetForNew, setPresetForNew] = useState<{
    codigo?: string;
    descricao?: string;
  }>({});

  const groups = useMemo<MetaGroup[]>(() => {
    const map = new Map<string, MetaGroup>();
    for (const r of rows) {
      const existing = map.get(r.codigo);
      if (existing) {
        existing.evolucoes.push(r);
        if (!existing.descricao && r.descricao) existing.descricao = r.descricao;
      } else {
        map.set(r.codigo, {
          codigo: r.codigo,
          descricao: r.descricao,
          evolucoes: [r],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [rows]);

  const selected = selectedCodigo
    ? groups.find((g) => g.codigo === selectedCodigo) ?? null
    : groups[0] ?? null;

  if (!canRead) return <Alert tone="warning">Acesso negado.</Alert>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-sentinela-ink">Metas CNJ</h1>
          <p className="text-sm text-slate-500">
            Evolução mensal do cumprimento das metas com projeção de tendência.
          </p>
        </div>
        {canWrite ? (
          <Button
            onClick={() => {
              setPresetForNew({});
              setOpenDialog(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nova evolução
          </Button>
        ) : null}
      </header>

      {error ? (
        <Alert tone="danger">Falha: {error.message}</Alert>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6">
            {canWrite ? "Nenhuma meta registrada ainda." : "Nenhuma meta disponível."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-0 lg:col-span-1">
            <header className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-medium">Metas ({groups.length})</h2>
            </header>
            <ul className="divide-y divide-slate-100">
              {groups.map((g) => {
                const proj = projetarCumprimento(g.evolucoes);
                return (
                  <li key={g.codigo}>
                    <button
                      type="button"
                      onClick={() => setSelectedCodigo(g.codigo)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${
                        selected?.codigo === g.codigo ? "bg-sentinela-accent/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{g.codigo}</p>
                          <p className="text-xs text-slate-500 truncate">{g.descricao}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${
                              proj.atual >= 100 ? "text-emerald-700" : "text-sentinela-ink"
                            }`}
                          >
                            {proj.atual.toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-500">
                            {g.evolucoes.length} registro(s)
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {selected ? <MetaDetail group={selected} canWrite={canWrite} onEdit={setEditTarget} onDelete={setDeleteTarget} onAddSimilar={() => { setPresetForNew({ codigo: selected.codigo, descricao: selected.descricao }); setOpenDialog(true); }} /> : null}
          </div>
        </div>
      )}

      {canWrite ? (
        <MetaDialog
          open={openDialog}
          onClose={() => {
            setOpenDialog(false);
            setPresetForNew({});
          }}
          presetCodigo={presetForNew.codigo}
          presetDescricao={presetForNew.descricao}
        />
      ) : null}

      {editTarget && canWrite ? (
        <MetaDialog open existing={editTarget} onClose={() => setEditTarget(null)} />
      ) : null}

      {deleteTarget && canWrite ? (
        <ConfirmDeleteDialog
          title="Excluir registro"
          message={`Excluir ${deleteTarget.codigo} — ${deleteTarget.periodo}?`}
          onConfirm={async () => {
            await deleteMeta(deleteTarget.id);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  );
}

function MetaDetail({
  group,
  canWrite,
  onEdit,
  onDelete,
  onAddSimilar,
}: {
  group: MetaGroup;
  canWrite: boolean;
  onEdit: (m: MetaEvolucao) => void;
  onDelete: (m: MetaEvolucao) => void;
  onAddSimilar: () => void;
}) {
  const proj = projetarCumprimento(group.evolucoes);
  const chartData = [...group.evolucoes]
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .map((e) => ({ periodo: e.periodo, percentual: e.percentual }));

  return (
    <>
      <Card>
        <header className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-medium">{group.codigo}</h2>
            <p className="text-sm text-slate-500">{group.descricao}</p>
          </div>
          {canWrite ? (
            <Button size="sm" variant="secondary" onClick={onAddSimilar}>
              <Plus className="h-3.5 w-3.5" /> Mês
            </Button>
          ) : null}
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Atual</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                proj.atual >= 100 ? "text-emerald-700" : "text-sentinela-ink"
              }`}
            >
              {proj.atual.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Ritmo (média/mês)
            </p>
            <p className="mt-1 text-2xl font-semibold flex items-center gap-1">
              <TrendingUp className="h-5 w-5 text-slate-400" />
              {proj.mediaCrescimento >= 0 ? "+" : ""}
              {proj.mediaCrescimento.toFixed(2)}
              <span className="text-sm text-slate-500">pp</span>
            </p>
          </div>
          <div
            className={`rounded-md border p-3 ${
              proj.cumpre
                ? "border-emerald-200 bg-emerald-50"
                : proj.mesesParaMeta === null
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className="text-xs uppercase tracking-wider text-slate-500">Projeção</p>
            <p className="mt-1 text-sm font-medium">
              {proj.cumpre
                ? proj.mesesParaMeta === 0
                  ? "✓ Meta cumprida"
                  : `Cumpre em ${proj.mesesParaMeta} mês(es)`
                : proj.mesesParaMeta === null
                  ? "Ritmo insuficiente"
                  : `Não cumpre em 12 meses (${proj.mesesParaMeta}m)`}
            </p>
          </div>
        </div>

        {chartData.length >= 2 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="periodo" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value) => {
                    const n = typeof value === "number" ? value : Number(value);
                    return [`${n.toFixed(1)}%`, "Cumprimento"];
                  }}
                />
                <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label="Meta" />
                <Line
                  type="monotone"
                  dataKey="percentual"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-12">
            Registre pelo menos 2 meses para visualizar a curva.
          </p>
        )}
      </Card>

      <Card className="p-0 overflow-hidden">
        <header className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-medium">Histórico</h3>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3 text-right">%</th>
                <th className="px-4 py-3 text-right">Alcançado</th>
                <th className="px-4 py-3 text-right">Alvo</th>
                <th className="px-4 py-3">Observações</th>
                {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...group.evolucoes]
                .sort((a, b) => b.periodo.localeCompare(a.periodo))
                .map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-mono text-xs">{e.periodo}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {e.percentual.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      {e.valorAlcancado?.toLocaleString("pt-BR") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {e.valorAlvo?.toLocaleString("pt-BR") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {e.observacoes ?? "—"}
                    </td>
                    {canWrite ? (
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onEdit(e)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100"
                          aria-label="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(e)}
                          className="rounded p-1 text-red-400 hover:bg-red-50"
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Badge tone="blue">{group.codigo}</Badge>
    </>
  );
}
