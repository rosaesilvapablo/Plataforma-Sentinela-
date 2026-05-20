import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

/**
 * Diálogo genérico de confirmação de exclusão.
 * Recebe `onConfirm` que faz o delete; mostra erro se falhar.
 */
export function ConfirmDeleteDialog({
  title,
  message,
  successMessage = "Excluído.",
  onConfirm,
  onClose,
  warningMessage,
}: {
  title: string;
  message: string;
  successMessage?: string;
  warningMessage?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setError(null);
    setLoading(true);
    try {
      await onConfirm();
      toast.success(successMessage);
      onClose();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={title}>
      <div className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <p className="text-sm text-slate-700">{message}</p>
        {warningMessage ? <Alert tone="warning">{warningMessage}</Alert> : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void go()} loading={loading}>
            Excluir
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
  return "Não foi possível excluir.";
}
