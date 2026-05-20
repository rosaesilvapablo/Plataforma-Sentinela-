import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { callDisableUser } from "@/data/users.repo";
import { type AccessListUser } from "@/domain/users";

export function DisableUserDialog({
  user,
  onClose,
}: {
  user: AccessListUser;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setError(null);
    setLoading(true);
    try {
      await callDisableUser(user.uid);
      toast.success(`${user.fullName} desativado.`);
      onClose();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Desativar usuário">
      <div className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <p className="text-sm text-slate-700">
          Confirmar a desativação de <strong>{user.fullName}</strong> ({user.email})?
        </p>
        <Alert tone="warning">
          A conta fica com status <strong>desativada</strong> — o usuário não consegue mais
          entrar, mas o histórico fica preservado. Pode ser reativada depois.
        </Alert>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void onConfirm()} loading={loading}>
            Desativar
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
  return "Não foi possível desativar o usuário.";
}
