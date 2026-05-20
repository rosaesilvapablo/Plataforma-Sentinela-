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
  updateFrequenciaFormSchema,
  frequenciaTipoSchema,
  FREQUENCIA_TIPO_LABELS,
  type UpdateFrequenciaForm,
  type Frequencia,
  type FrequenciaTipo,
} from "@/domain/frequencia";
import { updateFrequencia } from "@/data/frequencia.repo";

const TIPOS: FrequenciaTipo[] = [...frequenciaTipoSchema.options];

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function EditFrequenciaDialog({
  row,
  onClose,
}: {
  row: Frequencia;
  onClose: () => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateFrequenciaForm>({
    resolver: zodResolver(updateFrequenciaFormSchema),
    defaultValues: {
      tipo: row.tipo,
      dataInicio: toDateString(row.dataInicio),
      dataFim: toDateString(row.dataFim),
      motivo: row.motivo ?? "",
      observacoes: row.observacoes ?? "",
    },
  });

  async function onSubmit(data: UpdateFrequenciaForm) {
    setSubmitError(null);
    try {
      await updateFrequencia(row.id, data);
      toast.success(`Frequência de ${row.memberNome} atualizada.`);
      onClose();
    } catch (err) {
      setSubmitError(formatError(err));
    }
  }

  return (
    <Modal open onClose={onClose} title={`Editar frequência — ${row.memberNome}`} className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <Alert tone="info" className="text-xs">
          A pessoa (<strong>{row.memberNome}</strong>) é imutável. Para mudar, exclua este registro
          e crie um novo.
        </Alert>

        <Field label="Tipo" htmlFor="tipo" required error={errors.tipo?.message}>
          <select
            id="tipo"
            {...register("tipo")}
            className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {FREQUENCIA_TIPO_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Data início"
            htmlFor="dataInicio"
            required
            error={errors.dataInicio?.message}
          >
            <Input
              id="dataInicio"
              type="date"
              invalid={!!errors.dataInicio}
              {...register("dataInicio")}
            />
          </Field>
          <Field
            label="Data fim"
            htmlFor="dataFim"
            required
            error={errors.dataFim?.message}
          >
            <Input
              id="dataFim"
              type="date"
              invalid={!!errors.dataFim}
              {...register("dataFim")}
            />
          </Field>
        </div>

        <Field label="Motivo" htmlFor="motivo" error={errors.motivo?.message}>
          <Input id="motivo" invalid={!!errors.motivo} {...register("motivo")} />
        </Field>

        <Field
          label="Observações"
          htmlFor="observacoes"
          error={errors.observacoes?.message}
        >
          <textarea
            id="observacoes"
            rows={3}
            {...register("observacoes")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Salvar
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
  return "Não foi possível atualizar.";
}
