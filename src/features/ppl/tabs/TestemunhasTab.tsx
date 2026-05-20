import { useState } from "react";
import { Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { TestemunhaDialog } from "@/features/ppl/dialogs/TestemunhaDialog";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useTestemunhasList } from "@/hooks/useTestemunhasList";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess, hasAnyRole } from "@/domain/roles";
import { STATUS_TESTEMUNHA_LABELS, type Testemunha } from "@/domain/testemunha";
import { deleteTestemunha } from "@/data/testemunha.repo";

function fmt(d: Date | null): string {
  return d ? d.toLocaleDateString("pt-BR") : "—";
}

export function TestemunhasTab() {
  const { rows, loading, error } = useTestemunhasList();
  const { role } = useAuth();
  // Acesso mais restrito: apenas admin/diretor/juiz (sensibilidade da Lei 9.807/99).
  const canRead = hasAnyRole(role, ["diretor", "juiz"]);
  const canWrite = hasFullAccess(role);
  const [openDialog, setOpenDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Testemunha | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testemunha | null>(null);

  if (!canRead) return <Alert tone="warning">Acesso restrito a Diretoria e Juízo (Lei 9.807/99).</Alert>;

  return (
    <>
      <Alert tone="warning" className="mb-4">
        <ShieldAlert className="inline h-4 w-4 mr-1" />
        <strong>Dados sob sigilo (Lei 9.807/99).</strong> Este módulo armazena apenas
        identificadores e referências administrativas. Dados pessoais (nome real, endereço,
        contato) NÃO devem ser registrados aqui.
      </Alert>

      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-slate-500">
          {rows.length} registro{rows.length === 1 ? "" : "s"}.
        </p>
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
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6">Nenhum registro.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Caso</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Inclusão</th>
                  <th className="px-4 py-3">Encerramento</th>
                  {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono">{r.codigo}</td>
                    <td className="px-4 py-3 text-sm">{r.caso}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.status === "ativo" ? "green" : "neutral"}>
                        {STATUS_TESTEMUNHA_LABELS[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{fmt(r.dataInclusao)}</td>
                    <td className="px-4 py-3 text-sm">{fmt(r.dataEncerramento)}</td>
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
          <TestemunhaDialog open={openDialog} onClose={() => setOpenDialog(false)} />
          {editTarget ? (
            <TestemunhaDialog open existing={editTarget} onClose={() => setEditTarget(null)} />
          ) : null}
          {deleteTarget ? (
            <ConfirmDeleteDialog
              title="Excluir registro"
              message={`Excluir o registro ${deleteTarget.codigo}?`}
              warningMessage="Esta ação é irreversível."
              onConfirm={async () => {
                await deleteTestemunha(deleteTarget.id);
              }}
              onClose={() => setDeleteTarget(null)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
