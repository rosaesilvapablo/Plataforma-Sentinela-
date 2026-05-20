import { useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { PplDialog } from "@/features/ppl/dialogs/PplDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { usePplList } from "@/hooks/usePplList";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess, hasAnyRole } from "@/domain/roles";
import {
  TIPO_PRISAO_LABELS,
  classificarRevisao,
  type Ppl,
  type RevisaoStatus,
} from "@/domain/ppl";
import { deletePpl } from "@/data/ppl.repo";

function fmt(d: Date | null): string {
  return d ? d.toLocaleDateString("pt-BR") : "—";
}

const ALERT_STYLES: Record<RevisaoStatus, { tone: "neutral" | "gold" | "red"; text: string }> = {
  ok: { tone: "neutral", text: "text-slate-500" },
  atencao: { tone: "gold", text: "text-amber-700" },
  urgente: { tone: "red", text: "text-red-700" },
  vencido: { tone: "red", text: "text-red-800 font-semibold" },
};

export function PplListTab() {
  const { rows, loading, error } = usePplList();
  const { role } = useAuth();
  const canRead = hasAnyRole(role, ["diretor", "juiz", "supervisor", "servidor"]);
  const canWrite = hasFullAccess(role);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Ppl | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ppl | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.nome.toLowerCase().includes(term) ||
        r.processo.toLowerCase().includes(term) ||
        (r.cpf ?? "").toLowerCase().includes(term),
    );
  }, [rows, search]);

  const vencidos = rows.filter((r) => classificarRevisao(r.proximaRevisao).status === "vencido");
  const urgentes = rows.filter((r) => classificarRevisao(r.proximaRevisao).status === "urgente");

  if (!canRead) return <Alert tone="warning">Acesso negado a esta seção.</Alert>;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">Total cadastrado</p>
          <p className="mt-1 text-3xl font-semibold text-sentinela-ink">{rows.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Art. 316 vencidos
          </p>
          <p className="mt-1 text-3xl font-semibold text-red-700">{vencidos.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Vencendo em 7 dias
          </p>
          <p className="mt-1 text-3xl font-semibold text-amber-700">{urgentes.length}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <Input
          placeholder="Buscar por nome, processo ou CPF"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-md"
          aria-label="Buscar PPL"
        />
        {canWrite ? (
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4" /> Registrar
          </Button>
        ) : null}
      </div>

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
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Processo</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Data prisão</th>
                  <th className="px-4 py-3">Próxima revisão (Art. 316)</th>
                  {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const cls = classificarRevisao(r.proximaRevisao);
                  const style = ALERT_STYLES[cls.status];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{r.nome}</div>
                        {r.unidade ? (
                          <div className="text-xs text-slate-500">{r.unidade}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">
                        {r.processo}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="blue">{TIPO_PRISAO_LABELS[r.tipoPrisao]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{fmt(r.dataPrisao)}</td>
                      <td className="px-4 py-3 text-sm">
                        {r.proximaRevisao ? (
                          <div className={`flex items-center gap-2 ${style.text}`}>
                            {cls.status === "vencido" || cls.status === "urgente" ? (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            ) : null}
                            {fmt(r.proximaRevisao)}
                            {cls.diasRestantes != null ? (
                              <span className="text-xs">
                                ({cls.diasRestantes < 0 ? `vencido há ${Math.abs(cls.diasRestantes)}d` : `em ${cls.diasRestantes}d`})
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      {canWrite ? (
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditTarget(r)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteTarget(r)}
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
          <PplDialog open={openDialog} onClose={() => setOpenDialog(false)} />
          {editTarget ? (
            <PplDialog open existing={editTarget} onClose={() => setEditTarget(null)} />
          ) : null}
          {deleteTarget ? (
            <ConfirmDeleteDialog
              title="Excluir PPL"
              message={`Excluir o registro de ${deleteTarget.nome}?`}
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
