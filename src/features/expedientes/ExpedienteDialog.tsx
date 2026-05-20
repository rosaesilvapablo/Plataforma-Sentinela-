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
  expedienteFormSchema,
  tipoExpedienteSchema,
  statusExpedienteSchema,
  TIPO_EXPEDIENTE_LABELS,
  STATUS_EXPEDIENTE_LABELS,
  PRAZO_DEFAULT_DIAS,
  canTransition,
  type ExpedienteForm,
  type Expediente,
  type TipoExpediente,
  type StatusExpediente,
} from "@/domain/expediente";
import { createExpediente, updateExpediente } from "@/data/expediente.repo";

const TIPOS: TipoExpediente[] = [...tipoExpedienteSchema.options];
const STATUSES: StatusExpediente[] = [...statusExpedienteSchema.options];

function toDateString(d: Date | null): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date: Date, days: number): Date {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
}

export function ExpedienteDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Expediente;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ExpedienteForm>({
    resolver: zodResolver(expedienteFormSchema),
    defaultValues: existing
      ? {
          processo: existing.processo,
          tipo: existing.tipo,
          destinatario: existing.destinatario,
          assunto: existing.assunto,
          status: existing.status,
          dataEmissao: toDateString(existing.dataEmissao),
          prazoDevolucao: toDateString(existing.prazoDevolucao),
          dataCumprimento: toDateString(existing.dataCumprimento),
          responsavel: existing.responsavel ?? "",
          observacoes: existing.observacoes ?? "",
        }
      : {
          processo: "",
          tipo: "oficio",
          destinatario: "",
          assunto: "",
          status: "pendente",
          dataEmissao: "",
          prazoDevolucao: "",
          dataCumprimento: "",
          responsavel: "",
          observacoes: "",
        },
  });

  async function onSubmit(data: ExpedienteForm) {
    setSubmitError(null);
    if (existing && !canTransition(existing.status, data.status)) {
      setSubmitError(
        `Transição inválida: ${STATUS_EXPEDIENTE_LABELS[existing.status]} → ${STATUS_EXPEDIENTE_LABELS[data.status]}.`,
      );
      return;
    }
    try {
      if (existing) {
        await updateExpediente(existing.id, data);
        toast.success("Expediente atualizado.");
      } else {
        await createExpediente(data);
        toast.success("Expediente registrado.");
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

  function onChangeTipo(tipo: TipoExpediente) {
    // Sugere prazo default ao escolher tipo (se ainda nao tem prazo definido).
    setValue("tipo", tipo);
  }

  function setDefaultPrazo(tipo: TipoExpediente) {
    const dias = PRAZO_DEFAULT_DIAS[tipo];
    setValue("prazoDevolucao", toDateString(addDays(new Date(), dias)));
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={existing ? "Editar expediente" : "Registrar expediente"}
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Processo" htmlFor="processo" required error={errors.processo?.message}>
            <Input id="processo" invalid={!!errors.processo} {...register("processo")} />
          </Field>
          <Field label="Tipo" htmlFor="tipo" required error={errors.tipo?.message}>
            <select
              id="tipo"
              {...register("tipo")}
              onChange={(e) => onChangeTipo(e.target.value as TipoExpediente)}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {TIPO_EXPEDIENTE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Destinatário"
            htmlFor="destinatario"
            required
            error={errors.destinatario?.message}
          >
            <Input
              id="destinatario"
              invalid={!!errors.destinatario}
              {...register("destinatario")}
            />
          </Field>
          <Field label="Responsável" htmlFor="responsavel" error={errors.responsavel?.message}>
            <Input id="responsavel" {...register("responsavel")} />
          </Field>
        </div>

        <Field label="Assunto" htmlFor="assunto" required error={errors.assunto?.message}>
          <Input id="assunto" invalid={!!errors.assunto} {...register("assunto")} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Status" htmlFor="status" required error={errors.status?.message}>
            <select
              id="status"
              {...register("status")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_EXPEDIENTE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end gap-2">
            <Field
              label="Prazo de devolução"
              htmlFor="prazoDevolucao"
              error={errors.prazoDevolucao?.message}
            >
              <Input id="prazoDevolucao" type="date" {...register("prazoDevolucao")} />
            </Field>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const el = document.getElementById("tipo") as HTMLSelectElement | null;
                if (el) setDefaultPrazo(el.value as TipoExpediente);
              }}
              title="Preencher prazo com o default do tipo selecionado"
            >
              + Default
            </Button>
          </div>
          <Field
            label="Data de emissão"
            htmlFor="dataEmissao"
            error={errors.dataEmissao?.message}
          >
            <Input id="dataEmissao" type="date" {...register("dataEmissao")} />
          </Field>
          <Field
            label="Data de cumprimento"
            htmlFor="dataCumprimento"
            error={errors.dataCumprimento?.message}
          >
            <Input id="dataCumprimento" type="date" {...register("dataCumprimento")} />
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
