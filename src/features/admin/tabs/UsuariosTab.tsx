import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { CreateUserDialog } from "@/features/admin/dialogs/CreateUserDialog";
import { SetRoleDialog } from "@/features/admin/dialogs/SetRoleDialog";
import { DisableUserDialog } from "@/features/admin/dialogs/DisableUserDialog";
import { RoleBadge } from "@/features/admin/components/RoleBadge";
import { UserStatusBadge } from "@/features/admin/components/UserStatusBadge";
import { useUsersList } from "@/hooks/useUsersList";
import { useAuth } from "@/auth/useAuth";
import { callEnableUser } from "@/data/users.repo";
import { type AccessListUser } from "@/domain/users";

export function UsuariosTab() {
  const { users, loading, error } = useUsersList();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<AccessListUser | null>(null);
  const [disableTarget, setDisableTarget] = useState<AccessListUser | null>(null);

  const term = search.trim().toLowerCase();
  const filtered = term
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(term) ||
          u.fullName.toLowerCase().includes(term),
      )
    : users;

  async function onEnable(u: AccessListUser) {
    try {
      await callEnableUser(u.uid);
      toast.success(`${u.fullName} reativado.`);
    } catch (err) {
      toast.error(formatError(err));
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
          />
          <Input
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Buscar usuários"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Criar usuário
        </Button>
      </div>

      {error ? (
        <Alert tone="danger">Falha ao carregar usuários: {error.message}</Alert>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-6">
            {users.length === 0
              ? "Nenhum usuário cadastrado ainda. Clique em “Criar usuário” para começar."
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
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const isSelf = u.uid === currentUser?.uid;
                  return (
                    <tr key={u.uid} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">
                        {u.fullName}
                        {isSelf ? (
                          <span className="ml-2 text-xs text-slate-400">(você)</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3">
                        <UserStatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setRoleTarget(u)}
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "Você não pode alterar o próprio perfil"
                              : "Alterar perfil"
                          }
                        >
                          Perfil
                        </Button>
                        {u.status === "active" ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDisableTarget(u)}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "Você não pode desativar a própria conta"
                                : "Desativar usuário"
                            }
                          >
                            Desativar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => void onEnable(u)}
                          >
                            Reativar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {roleTarget ? (
        <SetRoleDialog user={roleTarget} onClose={() => setRoleTarget(null)} />
      ) : null}
      {disableTarget ? (
        <DisableUserDialog user={disableTarget} onClose={() => setDisableTarget(null)} />
      ) : null}
    </>
  );
}

function formatError(err: unknown): string {
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Ocorreu um erro.";
}
