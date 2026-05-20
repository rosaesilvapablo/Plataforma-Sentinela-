import { useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ExpedienteDialog } from "@/features/expedientes/ExpedienteDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useExpedientesList } from "@/hooks/useExpedientesList";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess, hasAnyRole } from "@/domain/roles";
import {
  TIPO_EXPEDIENTE_LABELS,
  STATUS_EXPEDIENTE_LABELS,
  classificarPrazo,
  type Expediente,
  type StatusExpediente,
  type PrazoStatus,
} from "@/domain/expediente";
import { deleteExpediente } from "@/data/expediente.repo";

const STATUS_TONES: Record<StatusExpediente, BadgeTone> = {
  pendente: "neutral",
  emitido: "blue",
  em_diligencia: "gold",
  cumprido: "green",
  cancelado: "neutral",
};

const PRAZO_TONES: Record<PrazoStatus, { tone: BadgeTone; text: string } | null> = {
  ok: null,
  atencao: { tone: "gold", text: "text-amber-700" },
  urgente: { tone: "red", text: "text-red-700" },
  vencido: { tone: "red", text: "text-red-800 font-semibold" },
  na: null,
};

function fmt(d: Date | null): string {
  return d ? d.toLocaleDateString("pt-BR") : "—";
}

export function ExpedientesPage() {
  const { rows, loading, error } = useExpedientesList();
  const { role } = useAuth();
  const canRead = hasAnyRole(role, ["diretor", "juiz", "supervisor", "servidor"]);
  const canWrite = hasAnyRole(role, ["diretor", "supervisor", "servidor"]); // expedientes operacionais
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Expediente | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expediente | null>(null);
  const canDelete = hasFullAccess(role);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (term) {
        const hit =
          r.processo.toLowerCase().includes(term) ||
          r.destinatario.toLowerCase().includes(term) ||
          r.assunto.toLowerCase().includes(term);
        if (!hit) return false;
      }
      return true;
    });
  }, [rows, filterStatus, search]);

  const pendentes = rows.filter((r) => r.status === "pendente" || r.status === "emitido" || r.status === "em_diligencia");
  const vencidos = pendentes.filter(
    (r) => classificarPrazo(r.prazoDevolucao, r.status).status === "vencido",
  );

  if (!canRead) return <Alert tone="warning">Acesso negado.</Alert>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-sentinela-ink">Expedientes</h1>
        <p className="text-sm text-slate-500">
          Ofícios, cartas precatórias e mandados de diligência com controle de prazo.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">Total</p>
          <p className="mt-1 text-3xl font-semibold text-sentinela-ink">{rows.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">Em andamento</p>
          <p className="mt-1 text-3xl font-semibold text-blue-700">{pendentes.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">Prazo vencido</p>
          <p className="mt-1 text-3xl font-semibold text-red-700">{vencidos.length}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-3 flex-1">
          <Input
            placeholder="Buscar por processo, destinatário ou assunto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-sm"
            aria-label="Buscar expedientes"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm min-w-[160px]"
            aria-label="Filtrar por status"
          >
            <option value="">Todos status</option>
            {(Object.keys(STATUS_EXPEDIENTE_LABELS) as StatusExpediente[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_EXPEDIENTE_LABELS[s]}
              </option>
            ))}
          </select>
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
            {rows.length === 0 ? "Nenhum expediente registrado." : "Nenhum resultado."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Processo / Assunto</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Destinatário</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Prazo</th>
                  {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const cls = classificarPrazo(r.prazoDevolucao, r.status);
                  const prazoStyle = PRAZO_TONES[cls.status];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-mono text-xs text-slate-600">{r.processo}</div>
                        <div>{r.assunto}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="blue">{TIPO_EXPEDIENTE_LABELS[r.tipo]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{r.destinatario}</td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONES[r.status]}>
                          {STATUS_EXPEDIENTE_LABELS[r.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {r.prazoDevolucao ? (
                          <div className={`flex items-center gap-2 ${prazoStyle?.text ?? ""}`}>
                            {cls.status === "vencido" || cls.status === "urgente" ? (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            ) : null}
                            {fmt(r.prazoDevolucao)}
                            {cls.diasRestantes != null && cls.status !== "ok" ? (
                              <span className="text-xs">
                                ({cls.diasRestantes < 0
                                  ? `há ${Math.abs(cls.diasRestantes)}d`
                                  : `em ${cls.diasRestantes}d`})
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
                          {canDelete ? (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setDeleteTarget(r)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
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
          <ExpedienteDialog open={openDialog} onClose={() => setOpenDialog(false)} />
          {editTarget ? (
            <ExpedienteDialog open existing={editTarget} onClose={() => setEditTarget(null)} />
          ) : null}
          {deleteTarget ? (
            <ConfirmDeleteDialog
              title="Excluir expediente"
              message={`Excluir o expediente ${deleteTarget.processo} — ${deleteTarget.assunto}?`}
              onConfirm={async () => {
                await deleteExpediente(deleteTarget.id);
              }}
              onClose={() => setDeleteTarget(null)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
