import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { OrdemDialog } from "@/features/sisbajud/dialogs/OrdemDialog";
import { DepositoDialog } from "@/features/sisbajud/dialogs/DepositoDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useSisbajudOrdens, useDepositos } from "@/hooks/useSisbajud";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess, hasAnyRole } from "@/domain/roles";
import {
  STATUS_SISBAJUD_LABELS,
  CONTA_DEPOSITO_LABELS,
  formatMoney,
  type SisbajudOrdem,
  type Deposito,
  type StatusSisbajud,
} from "@/domain/sisbajud";
import { deleteSisbajudOrdem, deleteDeposito } from "@/data/sisbajud.repo";
import { cn } from "@/lib/utils";

const STATUS_TONES: Record<StatusSisbajud, BadgeTone> = {
  pendente: "gold",
  bloqueado: "blue",
  transferido: "green",
  cancelado: "neutral",
};

function fmt(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

const TABS = [
  { id: "ordens", label: "Ordens SISBAJUD" },
  { id: "depositos", label: "Depósitos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(v: string | null): v is TabId {
  return v === "ordens" || v === "depositos";
}

export function SisbajudPage() {
  const [params, setParams] = useSearchParams();
  const candidate = params.get("tab");
  const current: TabId = isTabId(candidate) ? candidate : "ordens";

  const { role } = useAuth();
  const canRead = hasAnyRole(role, ["diretor", "juiz", "supervisor", "servidor"]);

  if (!canRead) return <Alert tone="warning">Acesso negado.</Alert>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-sentinela-ink">SISBAJUD & Depósitos</h1>
        <p className="text-sm text-slate-500">
          Ordens SISBAJUD com desdobramentos e depósitos judiciais vinculados.
        </p>
      </header>

      <div className="border-b border-slate-200">
        <nav role="tablist" aria-label="Abas SISBAJUD" className="-mb-px flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={current === t.id}
              onClick={() => setParams({ tab: t.id })}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                current === t.id
                  ? "border-sentinela-accent text-sentinela-accent"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div role="tabpanel">
        {current === "ordens" ? <OrdensSection /> : <DepositosSection />}
      </div>
    </div>
  );
}

function OrdensSection() {
  const { rows, loading, error } = useSisbajudOrdens();
  const { rows: depositos } = useDepositos();
  const { role } = useAuth();
  const canWrite = hasFullAccess(role);
  const [openDialog, setOpenDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<SisbajudOrdem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SisbajudOrdem | null>(null);

  // Mapa ordemId -> total depositado para conciliacao visual.
  const conciliacao = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of depositos) {
      if (d.ordemSisbajudId) {
        m.set(d.ordemSisbajudId, (m.get(d.ordemSisbajudId) ?? 0) + d.valor);
      }
    }
    return m;
  }, [depositos]);

  const totalBloqueado = rows
    .filter((r) => r.status === "bloqueado")
    .reduce((s, r) => s + r.valor, 0);
  const totalTransferido = rows
    .filter((r) => r.status === "transferido")
    .reduce((s, r) => s + r.valor, 0);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">Ordens</p>
          <p className="mt-1 text-3xl font-semibold text-sentinela-ink">{rows.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">Bloqueado</p>
          <p className="mt-1 text-2xl font-semibold text-blue-700">{formatMoney(totalBloqueado)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">Transferido</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {formatMoney(totalTransferido)}
          </p>
        </Card>
      </div>

      <div className="flex justify-end mb-4">
        {canWrite ? (
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4" /> Nova ordem
          </Button>
        ) : null}
      </div>

      {error ? (
        <Alert tone="danger">Falha: {error.message}</Alert>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6">Nenhuma ordem registrada.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ordem</th>
                  <th className="px-4 py-3">Pessoa</th>
                  <th className="px-4 py-3">Processo</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Depositado</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Data</th>
                  {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const dep = conciliacao.get(r.id) ?? 0;
                  const diff = r.valor - dep;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono">{r.ordem}</td>
                      <td className="px-4 py-3 text-sm">{r.pessoa}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">
                        {r.processo}
                      </td>
                      <td className="px-4 py-3 text-sm">{formatMoney(r.valor)}</td>
                      <td className="px-4 py-3 text-sm">
                        {formatMoney(dep)}
                        {Math.abs(diff) > 0.01 ? (
                          <span className="ml-1 text-xs text-amber-700">
                            (Δ {formatMoney(diff)})
                          </span>
                        ) : (
                          <span className="ml-1 text-xs text-emerald-700">✓</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONES[r.status]}>
                          {STATUS_SISBAJUD_LABELS[r.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{fmt(r.data)}</td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {canWrite ? (
        <>
          <OrdemDialog open={openDialog} onClose={() => setOpenDialog(false)} />
          {editTarget ? (
            <OrdemDialog open existing={editTarget} onClose={() => setEditTarget(null)} />
          ) : null}
          {deleteTarget ? (
            <ConfirmDeleteDialog
              title="Excluir ordem"
              message={`Excluir a ordem ${deleteTarget.ordem}?`}
              onConfirm={async () => {
                await deleteSisbajudOrdem(deleteTarget.id);
              }}
              onClose={() => setDeleteTarget(null)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}

function DepositosSection() {
  const { rows, loading, error } = useDepositos();
  const { rows: ordens } = useSisbajudOrdens();
  const { role } = useAuth();
  const canWrite = hasFullAccess(role);
  const [openDialog, setOpenDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Deposito | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deposito | null>(null);

  const total = rows.reduce((s, r) => s + r.valor, 0);

  const ordemLabel = (id: string | null) => {
    if (!id) return "—";
    const o = ordens.find((x) => x.id === id);
    return o ? `${o.ordem}` : "—";
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">Total registrado</p>
          <p className="mt-1 text-2xl font-semibold text-sentinela-ink">{formatMoney(total)}</p>
          <p className="text-xs text-slate-500">{rows.length} depósito(s)</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-slate-500">Por conta</p>
          <ul className="mt-1 text-sm space-y-0.5">
            {Object.entries(CONTA_DEPOSITO_LABELS).map(([conta, label]) => {
              const s = rows
                .filter((r) => r.conta === conta)
                .reduce((acc, r) => acc + r.valor, 0);
              if (s === 0) return null;
              return (
                <li key={conta} className="flex justify-between">
                  <span>{label}</span>
                  <span className="font-medium">{formatMoney(s)}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="flex justify-end mb-4">
        {canWrite ? (
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4" /> Novo depósito
          </Button>
        ) : null}
      </div>

      {error ? (
        <Alert tone="danger">Falha: {error.message}</Alert>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6">Nenhum depósito registrado.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Processo</th>
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Ordem vinculada</th>
                  {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">{fmt(r.data)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">
                      {r.processo}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="blue">{CONTA_DEPOSITO_LABELS[r.conta]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{formatMoney(r.valor)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">
                      {ordemLabel(r.ordemSisbajudId)}
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
          <DepositoDialog open={openDialog} onClose={() => setOpenDialog(false)} />
          {editTarget ? (
            <DepositoDialog open existing={editTarget} onClose={() => setEditTarget(null)} />
          ) : null}
          {deleteTarget ? (
            <ConfirmDeleteDialog
              title="Excluir depósito"
              message={`Excluir depósito de ${formatMoney(deleteTarget.valor)}?`}
              onConfirm={async () => {
                await deleteDeposito(deleteTarget.id);
              }}
              onClose={() => setDeleteTarget(null)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
