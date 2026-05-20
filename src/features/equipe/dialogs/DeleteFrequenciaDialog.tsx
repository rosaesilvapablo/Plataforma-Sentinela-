import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { deleteFrequencia } from "@/data/frequencia.repo";
import { type Frequencia, FREQUENCIA_TIPO_LABELS } from "@/domain/frequencia";

function formatRange(row: Frequencia): string {
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR");
  return row.dataInicio.getTime() === row.dataFim.getTime()
    ? fmt(row.dataInicio)
    : `${fmt(row.dataInicio)} → ${fmt(row.dataFim)}`;
}

export function DeleteFrequenciaDialog({
  row,
  onClose,
}: {
  row: Frequencia;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setError(null);
    setLoading(true);
    try {
      await deleteFrequencia(row.id);
      toast.success(`Frequência de ${row.memberNome} excluída.`);
      onClose();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Excluir frequência">
      <div className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <p className="text-sm text-slate-700">
          Confirmar a exclusão definitiva desta frequência?
        </p>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
          <div>
            <strong>{row.memberNome}</strong>
          </div>
          <div className="text-slate-600">
            {FREQUENCIA_TIPO_LABELS[row.tipo]} · {formatRange(row)}
          </div>
        </div>
        <Alert tone="warning">
          A exclusão é definitiva. Use somente para corrigir registros equivocados.
        </Alert>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void onConfirm()} loading={loading}>
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
