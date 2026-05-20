import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { ROLES, ROLE_LABELS, type Role } from "@/domain/roles";
import { callSetUserRole } from "@/data/users.repo";
import { type AccessListUser } from "@/domain/users";

export function SetRoleDialog({
  user,
  onClose,
}: {
  user: AccessListUser;
  onClose: () => void;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setError(null);
    setLoading(true);
    try {
      await callSetUserRole(user.uid, role);
      toast.success(`Perfil de ${user.fullName} alterado para ${ROLE_LABELS[role]}.`);
      onClose();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Alterar perfil — ${user.fullName}`}>
      <div className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Field label="Novo perfil" htmlFor="role">
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-xs text-slate-500">
          O novo perfil entra em vigor no próximo refresh do token (login do usuário, ou
          após alguns minutos).
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={() => void onConfirm()} loading={loading} disabled={role === user.role}>
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function formatError(err: unknown): string {
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Não foi possível alterar o perfil.";
}
