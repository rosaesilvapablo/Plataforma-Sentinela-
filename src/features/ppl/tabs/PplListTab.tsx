import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Fingerprint,
  Globe,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { PplDialog } from "@/features/ppl/dialogs/PplDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { usePplList } from "@/hooks/usePplList";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess, hasAnyRole } from "@/domain/roles";
import {
  TIPO_PRISAO_LABELS,
  SITUACAO_LABELS,
  classificarRevisao,
  calcularDiasPreso,
  calcularDiasPendente,
  type Ppl,
  type RevisaoStatus,
} from "@/domain/ppl";
import { deletePpl, registrarRevisaoHoje } from "@/data/ppl.repo";
import { cn } from "@/lib/utils";

type FilterStatus = "todos" | "vencidos" | "presos" | "pendentes" | "interpol";

const FILTER_BUTTONS: Array<{ key: FilterStatus; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "vencidos", label: "Vencidos" },
  { key: "presos", label: "Presos" },
  { key: "pendentes", label: "Pendentes" },
  { key: "interpol", label: "Interpol" },
];

const REVISAO_STYLES: Record<
  RevisaoStatus,
  { text: string; bg: string; label: string } | null
> = {
  ok: { text: "text-emerald-700", bg: "bg-emerald-50", label: "NO PRAZO" },
  atencao: { text: "text-amber-700", bg: "bg-amber-50", label: "ATENÇÃO" },
  urgente: { text: "text-red-700", bg: "bg-red-100", label: "URGENTE" },
  vencido: { text: "text-red-800", bg: "bg-red-100", label: "VENCIDO" },
  na: null,
};

function fmt(d: Date | null): string {
  return d ? d.toLocaleDateString("pt-BR") : "—";
}

export function PplListTab() {
  const { rows, loading, error } = usePplList();
  const { role } = useAuth();
  const canRead = hasAnyRole(role, ["diretor", "juiz", "supervisor", "servidor"]);
  const canWrite = hasFullAccess(role);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("todos");
  const [openDialog, setOpenDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Ppl | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ppl | null>(null);

  // Stats restauradas do legado: 5 cards
  const stats = useMemo(() => {
    const presos = rows.filter((p) => p.situacao === "pessoa_presa").length;
    const pendentes = rows.filter((p) => p.situacao !== "pessoa_presa").length;
    let vencidas = 0;
    let atencao = 0;
    for (const p of rows) {
      const cls = classificarRevisao(p.proximaRevisao).status;
      if (cls === "vencido") vencidas++;
      else if (cls === "atencao" || cls === "urgente") atencao++;
    }
    const interpol = rows.filter((p) => p.redNotice).length;
    return { presos, pendentes, vencidas, atencao, interpol };
  }, [rows]);

  // Filtros + busca + ordenação restauradas do legado
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = rows.filter((p) => {
      if (
        term &&
        !(
          p.nome.toLowerCase().includes(term) ||
          p.processo.toLowerCase().includes(term) ||
          (p.rji ?? "").toLowerCase().includes(term) ||
          (p.cpf ?? "").toLowerCase().includes(term)
        )
      ) {
        return false;
      }
      if (filter === "vencidos") {
        return classificarRevisao(p.proximaRevisao).status === "vencido";
      }
      if (filter === "presos") return p.situacao === "pessoa_presa";
      if (filter === "pendentes") return p.situacao !== "pessoa_presa";
      if (filter === "interpol") return p.redNotice;
      return true;
    });
    // Ordenação: vencidos primeiro, depois por mais tempo preso
    list = list.slice().sort((a, b) => {
      const aVenc = classificarRevisao(a.proximaRevisao).status === "vencido";
      const bVenc = classificarRevisao(b.proximaRevisao).status === "vencido";
      if (aVenc && !bVenc) return -1;
      if (bVenc && !aVenc) return 1;
      return calcularDiasPreso(b) - calcularDiasPreso(a);
    });
    return list;
  }, [rows, search, filter]);

  async function onRegistrarRevisao(p: Ppl) {
    if (!window.confirm(`Registrar revisão de ${p.nome} com data de HOJE?`)) return;
    try {
      await registrarRevisaoHoje(p);
      toast.success(`Revisão registrada para ${p.nome}.`);
    } catch (err) {
      toast.error(formatError(err));
    }
  }

  if (!canRead) return <Alert tone="warning">Acesso negado a esta seção.</Alert>;

  return (
    <>
      {/* Stats 5 cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <Card>
          <div className="flex items-center gap-2 text-slate-600 text-xs">
            <ShieldAlert className="h-3.5 w-3.5" /> Presos
          </div>
          <p className="mt-1 text-2xl font-semibold text-sentinela-ink">{stats.presos}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-slate-600 text-xs">
            <AlertCircle className="h-3.5 w-3.5" /> Pendentes
          </div>
          <p className="mt-1 text-2xl font-semibold text-sentinela-ink">{stats.pendentes}</p>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" /> Vencidos
          </div>
          <p className="mt-1 text-2xl font-semibold text-red-700">{stats.vencidas}</p>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 text-xs">
            <Clock className="h-3.5 w-3.5" /> Atenção
          </div>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{stats.atencao}</p>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 text-blue-700 text-xs">
            <Globe className="h-3.5 w-3.5" /> Interpol
          </div>
          <p className="mt-1 text-2xl font-semibold text-blue-700">{stats.interpol}</p>
        </Card>
      </div>

      {/* Filtros + busca + CTA */}
      <Card className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
          />
          <Input
            placeholder="Buscar por nome, processo, RJI ou CPF"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Buscar PPL"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTER_BUTTONS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition",
                filter === f.key
                  ? "bg-sentinela-accent text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {canWrite ? (
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4" /> Registrar
          </Button>
        ) : null}
      </Card>

      {error ? (
        <Alert tone="danger">Falha ao carregar PPL: {error.message}</Alert>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6">
            {rows.length === 0 ? "Nenhum PPL registrado." : "Nenhum resultado."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nome / Identificação</th>
                  <th className="px-4 py-3">Processo</th>
                  <th className="px-4 py-3">Situação / Espécie</th>
                  <th className="px-4 py-3">Tempo</th>
                  <th className="px-4 py-3">Revisão (90d)</th>
                  {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const cls = classificarRevisao(p.proximaRevisao);
                  const style = REVISAO_STYLES[cls.status];
                  const isVencido = cls.status === "vencido";
                  const diasPreso = calcularDiasPreso(p);
                  const diasPendente = calcularDiasPendente(p);
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        "transition",
                        isVencido ? "bg-red-50/50 hover:bg-red-100/50" : "hover:bg-slate-50",
                      )}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-sentinela-ink">{p.nome}</div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-0.5">
                          {p.rji ? (
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                              <Fingerprint className="h-3 w-3" /> RJI {p.rji}
                            </span>
                          ) : null}
                          {p.cpf ? <span>CPF {p.cpf}</span> : null}
                          {p.local ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {p.local}
                            </span>
                          ) : null}
                          {p.redNotice ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                              <Globe className="h-3 w-3" /> INTERPOL
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">
                        {p.processo}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={cn(
                            "inline-block rounded px-2 py-0.5 text-xs font-semibold",
                            p.situacao === "pessoa_presa"
                              ? "bg-slate-800 text-white"
                              : "bg-blue-100 text-blue-700",
                          )}
                        >
                          {SITUACAO_LABELS[p.situacao]}
                        </span>
                        <div className="text-xs text-slate-500 mt-1">
                          {TIPO_PRISAO_LABELS[p.tipoPrisao]}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {diasPreso > 0 ? (
                          <div className="flex items-center gap-1 text-slate-700">
                            <TrendingUp className="h-3.5 w-3.5 text-sentinela-accent" />
                            <span className="font-mono font-bold">{diasPreso}</span>
                            <span className="text-xs text-slate-500">dias preso</span>
                          </div>
                        ) : null}
                        {diasPendente > 0 ? (
                          <div className="flex items-center gap-1 text-blue-700">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-mono font-bold">{diasPendente}</span>
                            <span className="text-xs text-slate-500">dias pendente</span>
                          </div>
                        ) : null}
                        {diasPreso === 0 && diasPendente === 0 ? (
                          <span className="text-slate-300 text-xs">—</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {p.situacao === "pessoa_presa" && style ? (
                          <div>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold",
                                style.bg,
                                style.text,
                              )}
                            >
                              {style.label}
                            </span>
                            {p.proximaRevisao ? (
                              <div className="text-xs text-slate-500 mt-0.5">
                                Próxima: {fmt(p.proximaRevisao)}
                                {cls.diasRestantes !== null ? (
                                  <span className="ml-1">
                                    (
                                    {cls.diasRestantes < 0
                                      ? `atraso ${Math.abs(cls.diasRestantes)}d`
                                      : `${cls.diasRestantes}d`}
                                    )
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 mt-0.5">Sem data</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Aguarda cumprimento
                          </span>
                        )}
                      </td>
                      {canWrite ? (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {p.situacao === "pessoa_presa" ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => void onRegistrarRevisao(p)}
                                title="Registrar revisão HOJE"
                                aria-label="Registrar revisão hoje"
                              >
                                <Clock className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditTarget(p)}
                              aria-label="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setDeleteTarget(p)}
                              aria-label="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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
          <PplDialog open={openDialog} onClose={() => setOpenDialog(false)} />
          {editTarget ? (
            <PplDialog open existing={editTarget} onClose={() => setEditTarget(null)} />
          ) : null}
          {deleteTarget ? (
            <ConfirmDeleteDialog
              title="Excluir PPL"
              message={`Excluir o registro de ${deleteTarget.nome}?`}
              warningMessage="Esta ação é definitiva."
              onConfirm={async () => {
                await deletePpl(deleteTarget.id);
              }}
              onClose={() => setDeleteTarget(null)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}

function formatError(err: unknown): string {
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Erro inesperado.";
}
