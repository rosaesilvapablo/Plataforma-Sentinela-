import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import {
  mesaCardFormSchema,
  mesaColumnSchema,
  MESA_COLUMN_LABELS,
  type MesaCardForm,
  type MesaCard,
  type MesaColumn,
} from "@/domain/mesaCard";
import { createMesaCard, updateMesaCard } from "@/data/mesaCard.repo";
import { useTeamList } from "@/hooks/useTeamList";

const COLUMNS: MesaColumn[] = [...mesaColumnSchema.options];

function toDateString(d: Date | null): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function MesaCardDialog({
  open,
  onClose,
  existing,
  defaultColumn,
}: {
  open: boolean;
  onClose: () => void;
  existing?: MesaCard | undefined;
  defaultColumn?: MesaColumn | undefined;
}) {
  const { team, loading: loadingTeam } = useTeamList();
  const responsaveis = useMemo(
    () => team.filter((m) => m.status === "ativo"),
    [team],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MesaCardForm>({
    resolver: zodResolver(mesaCardFormSchema),
    defaultValues: existing
      ? {
          titulo: existing.titulo,
          processo: existing.processo,
          column: existing.column,
          assigneeId: existing.assigneeId ?? "",
          prazo: toDateString(existing.prazo),
          observacoes: existing.observacoes ?? "",
        }
      : {
          titulo: "",
          processo: "",
          column: defaultColumn ?? "concluso_despacho",
          assigneeId: "",
          prazo: "",
          observacoes: "",
        },
  });

  async function onSubmit(data: MesaCardForm) {
    setSubmitError(null);
    const assignee = data.assigneeId
      ? responsaveis.find((m) => m.uid === data.assigneeId) ?? null
      : null;
    try {
      if (existing) {
        await updateMesaCard(existing.id, data, assignee?.nome ?? null);
        toast.success("Cartão atualizado.");
      } else {
        await createMesaCard(data, assignee?.nome ?? null);
        toast.success("Cartão criado.");
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
      title={existing ? "Editar cartão" : "Novo cartão"}
      className="max-w-2xl"
    >
      {loadingTeam ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

          <Field label="Título" htmlFor="titulo" required error={errors.titulo?.message}>
            <Input id="titulo" invalid={!!errors.titulo} {...register("titulo")} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Processo"
              htmlFor="processo"
              required
              error={errors.processo?.message}
            >
              <Input id="processo" invalid={!!errors.processo} {...register("processo")} />
            </Field>
            <Field label="Coluna" htmlFor="column" required error={errors.column?.message}>
              <select
                id="column"
                {...register("column")}
                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
              >
                {COLUMNS.map((c) => (
                  <option key={c} value={c}>
                    {MESA_COLUMN_LABELS[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Responsável"
              htmlFor="assigneeId"
              error={errors.assigneeId?.message}
              hint="Opcional."
            >
              <select
                id="assigneeId"
                {...register("assigneeId")}
                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
              >
                <option value="">Sem responsável</option>
                {responsaveis.map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prazo" htmlFor="prazo" error={errors.prazo?.message} hint="Opcional.">
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
              {existing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function formatError(err: unknown): string {
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Não foi possível salvar.";
}
