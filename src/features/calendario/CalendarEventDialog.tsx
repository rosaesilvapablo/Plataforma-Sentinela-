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
  calendarEventFormSchema,
  calendarioCategoriaSchema,
  CATEGORIA_LABELS,
  type CalendarEventForm,
  type CalendarEvent,
  type CalendarioCategoria,
} from "@/domain/calendario";
import { createCalendarEvent, updateCalendarEvent } from "@/data/calendario.repo";

const CATEGORIAS: CalendarioCategoria[] = [...calendarioCategoriaSchema.options];

function toDateString(d: Date | null): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function CalendarEventDialog({
  open,
  onClose,
  existing,
  initialDate,
}: {
  open: boolean;
  onClose: () => void;
  existing?: CalendarEvent | undefined;
  initialDate?: Date | undefined;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CalendarEventForm>({
    resolver: zodResolver(calendarEventFormSchema),
    defaultValues: existing
      ? {
          titulo: existing.titulo,
          categoria: existing.categoria,
          data: toDateString(existing.data),
          observacoes: existing.observacoes ?? "",
        }
      : {
          titulo: "",
          categoria: "institucional",
          data: toDateString(initialDate ?? new Date()),
          observacoes: "",
        },
  });

  async function onSubmit(data: CalendarEventForm) {
    setSubmitError(null);
    try {
      if (existing) {
        await updateCalendarEvent(existing.id, data);
        toast.success("Evento atualizado.");
      } else {
        await createCalendarEvent(data);
        toast.success("Evento criado.");
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
      title={existing ? "Editar evento" : "Novo evento"}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <Field label="Título" htmlFor="titulo" required error={errors.titulo?.message}>
          <Input id="titulo" invalid={!!errors.titulo} {...register("titulo")} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {CATEGORIA_LABELS[c]}
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
            {existing ? "Salvar" : "Criar"}
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
