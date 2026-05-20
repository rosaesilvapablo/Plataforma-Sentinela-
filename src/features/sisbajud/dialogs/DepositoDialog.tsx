import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import {
  depositoFormSchema,
  contaDepositoSchema,
  CONTA_DEPOSITO_LABELS,
  type DepositoForm,
  type Deposito,
  type ContaDeposito,
} from "@/domain/sisbajud";
import { createDeposito, updateDeposito } from "@/data/sisbajud.repo";
import { useSisbajudOrdens } from "@/hooks/useSisbajud";

const CONTAS: ContaDeposito[] = [...contaDepositoSchema.options];

function toDateString(d: Date | null): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function DepositoDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Deposito;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { rows: ordens } = useSisbajudOrdens();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DepositoForm>({
    resolver: zodResolver(depositoFormSchema),
    defaultValues: existing
      ? {
          processo: existing.processo,
          conta: existing.conta,
          valor: existing.valor,
          data: toDateString(existing.data),
          ordemSisbajudId: existing.ordemSisbajudId ?? "",
          observacoes: existing.observacoes ?? "",
        }
      : {
          processo: "",
          conta: "judicial",
          valor: 0,
          data: toDateString(new Date()),
          ordemSisbajudId: "",
          observacoes: "",
        },
  });

  async function onSubmit(data: DepositoForm) {
    setSubmitError(null);
    try {
      if (existing) {
        await updateDeposito(existing.id, data);
        toast.success("Depósito atualizado.");
      } else {
        await createDeposito(data);
        toast.success("Depósito registrado.");
      }
      close();
    } catch (err) {
      setSubmitError(formatError(err));
    }
  }

  function close() {
    setSubmitError(null);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={existing ? "Editar depósito" : "Registrar depósito"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Processo" htmlFor="processo" required error={errors.processo?.message}>
            <Input id="processo" invalid={!!errors.processo} {...register("processo")} />
          </Field>
          <Field label="Conta" htmlFor="conta" required error={errors.conta?.message}>
            <select
              id="conta"
              {...register("conta")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {CONTAS.map((c) => (
                <option key={c} value={c}>
                  {CONTA_DEPOSITO_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Valor (R$)" htmlFor="valor" required error={errors.valor?.message}>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              invalid={!!errors.valor}
              {...register("valor", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Data" htmlFor="data" required error={errors.data?.message}>
            <Input id="data" type="date" invalid={!!errors.data} {...register("data")} />
          </Field>
          <Field
            label="Ordem SISBAJUD vinculada"
            htmlFor="ordemSisbajudId"
            error={errors.ordemSisbajudId?.message}
            hint="Opcional. Para conciliação."
          >
            <select
              id="ordemSisbajudId"
              {...register("ordemSisbajudId")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              <option value="">Sem vínculo</option>
              {ordens.map((o) => (
                <option key={o.id} value={o.id}>
                  Ordem {o.ordem} — {o.pessoa}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Observações" htmlFor="observacoes" error={errors.observacoes?.message}>
          <textarea
            id="observacoes"
            rows={3}
            {...register("observacoes")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {existing ? "Salvar" : "Registrar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function formatError(err: unknown): string {
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Não foi possível salvar.";
}
