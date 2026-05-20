import { useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { CreateMemberDialog } from "@/features/equipe/dialogs/CreateMemberDialog";
import { EditMemberDialog } from "@/features/equipe/dialogs/EditMemberDialog";
import { TipoVinculoBadge } from "@/features/equipe/components/TipoVinculoBadge";
import { PersonStatusBadge } from "@/features/equipe/components/PersonStatusBadge";
import { useTeamList } from "@/hooks/useTeamList";
import { useAuth } from "@/auth/useAuth";
import { hasFullAccess } from "@/domain/roles";
import { type TeamMember } from "@/domain/team";

export function CadastroTab() {
  const { team, loading, error } = useTeamList();
  const { role } = useAuth();
  const canWrite = hasFullAccess(role);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);

  const term = search.trim().toLowerCase();
  const filtered = term
    ? team.filter(
        (m) =>
          m.nome.toLowerCase().includes(term) ||
          m.email.toLowerCase().includes(term) ||
          m.matricula.toLowerCase().includes(term) ||
          m.cargoEfetivo.toLowerCase().includes(term),
      )
    : team;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
          />
          <Input
            placeholder="Buscar por nome, e-mail, matrícula ou cargo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Buscar membros"
          />
        </div>
        {canWrite ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Cadastrar
          </Button>
        ) : null}
      </div>

      {error ? (
        <Alert tone="danger">Falha ao carregar equipe: {error.message}</Alert>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6">
            {team.length === 0
              ? canWrite
                ? "Nenhum membro cadastrado. Clique em “Cadastrar” para começar."
                : "Nenhum membro cadastrado."
              : "Nenhum resultado para a busca."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Matrícula</th>
                  <th className="px-4 py-3">Cargo / Função</th>
                  <th className="px-4 py-3">Vínculo</th>
                  <th className="px-4 py-3">Lotação atual</th>
                  <th className="px-4 py-3">Status</th>
                  {canWrite ? <th className="px-4 py-3 text-right">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((m) => (
                  <tr key={m.uid} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{m.nome}</div>
                      <div className="text-xs text-slate-500">{m.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{m.matricula}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>{m.cargoEfetivo}</div>
                      {m.funcaoComissionada ? (
                        <div className="text-xs text-sentinela-accent font-medium">
                          {m.funcaoComissionada}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <TipoVinculoBadge tipo={m.tipoVinculo} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{m.lotacaoAtual}</div>
                      {m.lotacaoAtual !== m.lotacaoParadigma ? (
                        <div
                          className="text-xs text-amber-700"
                          title={`Paradigma: ${m.lotacaoParadigma}`}
                        >
                          ⚠ ≠ paradigma
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <PersonStatusBadge status={m.status} />
                    </td>
                    {canWrite ? (
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditTarget(m)}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
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
          <CreateMemberDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
          />
          {editTarget ? (
            <EditMemberDialog
              member={editTarget}
              onClose={() => setEditTarget(null)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
