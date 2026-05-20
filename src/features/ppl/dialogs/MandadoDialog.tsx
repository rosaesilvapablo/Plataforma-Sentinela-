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
  mandadoFormSchema,
  categoriaMandadoSchema,
  statusMandadoSchema,
  CATEGORIA_MANDADO_LABELS,
  STATUS_MANDADO_LABELS,
  type MandadoForm,
  type Mandado,
  type CategoriaMandado,
  type StatusMandado,
} from "@/domain/mandados";
import { createMandado, updateMandado } from "@/data/mandados.repo";

const CATEGORIAS: CategoriaMandado[] = [...categoriaMandadoSchema.options];
const STATUSES: StatusMandado[] = [...statusMandadoSchema.options];

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function MandadoDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Mandado;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MandadoForm>({
    resolver: zodResolver(mandadoFormSchema),
    defaultValues: existing
      ? {
          pessoa: existing.pessoa,
          processo: existing.processo,
          categoria: existing.categoria,
          prazo: existing.prazo ? toDateString(existing.prazo) : "",
          status: existing.status,
          observacoes: existing.observacoes ?? "",
        }
      : {
          pessoa: "",
          processo: "",
          categoria: "pendente_cumprimento",
          prazo: "",
          status: "ativo",
          observacoes: "",
        },
  });

  async function onSubmit(data: MandadoForm) {
    setSubmitError(null);
    try {
      if (existing) {
        await updateMandado(existing.id, data);
        toast.success("Mandado atualizado.");
      } else {
        await createMandado(data);
        toast.success("Mandado registrado.");
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
      title={existing ? "Editar mandado" : "Registrar mandado / difusão vermelha"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Pessoa" htmlFor="pessoa" required error={errors.pessoa?.message}>
            <Input id="pessoa" invalid={!!errors.pessoa} {...register("pessoa")} />
          </Field>
          <Field
            label="Processo"
            htmlFor="processo"
            required
            error={errors.processo?.message}
          >
            <Input id="processo" invalid={!!errors.processo} {...register("processo")} />
          </Field>
          <Field
            label="Categoria"
            htmlFor="categoria"
            required
            error={errors.categoria?.message}
          >
            <select
              id="categoria"
              {...register("categoria")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_MANDADO_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" htmlFor="status" required error={errors.status?.message}>
            <select
              id="status"
              {...register("status")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_MANDADO_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Prazo"
            htmlFor="prazo"
            error={errors.prazo?.message}
            hint="Opcional."
          >
            <Input id="prazo" type="date" {...register("prazo")} />
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
