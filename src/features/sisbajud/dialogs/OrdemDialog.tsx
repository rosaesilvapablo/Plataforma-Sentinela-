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
  sisbajudOrdemFormSchema,
  statusSisbajudSchema,
  STATUS_SISBAJUD_LABELS,
  type SisbajudOrdemForm,
  type SisbajudOrdem,
  type StatusSisbajud,
} from "@/domain/sisbajud";
import { createSisbajudOrdem, updateSisbajudOrdem } from "@/data/sisbajud.repo";

const STATUSES: StatusSisbajud[] = [...statusSisbajudSchema.options];

function toDateString(d: Date | null): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function OrdemDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: SisbajudOrdem;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SisbajudOrdemForm>({
    resolver: zodResolver(sisbajudOrdemFormSchema),
    defaultValues: existing
      ? {
          processo: existing.processo,
          ordem: existing.ordem,
          pessoa: existing.pessoa,
          valor: existing.valor,
          status: existing.status,
          data: toDateString(existing.data),
          observacoes: existing.observacoes ?? "",
        }
      : {
          processo: "",
          ordem: "",
          pessoa: "",
          valor: 0,
          status: "pendente",
          data: toDateString(new Date()),
          observacoes: "",
        },
  });

  async function onSubmit(data: SisbajudOrdemForm) {
    setSubmitError(null);
    try {
      if (existing) {
        await updateSisbajudOrdem(existing.id, data);
        toast.success("Ordem atualizada.");
      } else {
        await createSisbajudOrdem(data);
        toast.success("Ordem registrada.");
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
      title={existing ? "Editar ordem SISBAJUD" : "Registrar ordem SISBAJUD"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Processo" htmlFor="processo" required error={errors.processo?.message}>
            <Input id="processo" invalid={!!errors.processo} {...register("processo")} />
          </Field>
          <Field
            label="Número da ordem"
            htmlFor="ordem"
            required
            error={errors.ordem?.message}
          >
            <Input id="ordem" invalid={!!errors.ordem} {...register("ordem")} />
          </Field>
          <Field label="Pessoa" htmlFor="pessoa" required error={errors.pessoa?.message}>
            <Input id="pessoa" invalid={!!errors.pessoa} {...register("pessoa")} />
          </Field>
          <Field
            label="Valor (R$)"
            htmlFor="valor"
            required
            error={errors.valor?.message}
          >
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              invalid={!!errors.valor}
              {...register("valor", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Status" htmlFor="status" required error={errors.status?.message}>
            <select
              id="status"
              {...register("status")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_SISBAJUD_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Data" htmlFor="data" required error={errors.data?.message}>
            <Input id="data" type="date" invalid={!!errors.data} {...register("data")} />
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
