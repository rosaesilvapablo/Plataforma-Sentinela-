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
  movimentoFormSchema,
  contaGeridaSchema,
  tipoMovimentoSchema,
  CONTA_GERIDA_LABELS,
  TIPO_MOVIMENTO_LABELS,
  type MovimentoForm,
  type Movimento,
  type ContaGerida,
  type TipoMovimento,
} from "@/domain/recolhimentos";
import { createMovimento, updateMovimento } from "@/data/recolhimentos.repo";

const CONTAS: ContaGerida[] = [...contaGeridaSchema.options];
const TIPOS: TipoMovimento[] = [...tipoMovimentoSchema.options];

function toDateString(d: Date | null): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function MovimentoDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Movimento;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MovimentoForm>({
    resolver: zodResolver(movimentoFormSchema),
    defaultValues: existing
      ? {
          conta: existing.conta,
          tipo: existing.tipo,
          valor: existing.valor,
          data: toDateString(existing.data),
          descricao: existing.descricao,
          destinacao: existing.destinacao ?? "",
          processo: existing.processo ?? "",
        }
      : {
          conta: "anpp",
          tipo: "entrada",
          valor: 0,
          data: toDateString(new Date()),
          descricao: "",
          destinacao: "",
          processo: "",
        },
  });

  const tipoAtual = watch("tipo");

  async function onSubmit(data: MovimentoForm) {
    setSubmitError(null);
    try {
      if (existing) {
        await updateMovimento(existing.id, data);
        toast.success("Movimento atualizado.");
      } else {
        await createMovimento(data);
        toast.success("Movimento registrado.");
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
      title={existing ? "Editar movimento" : "Registrar movimento"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Conta" htmlFor="conta" required error={errors.conta?.message}>
            <select
              id="conta"
              {...register("conta")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {CONTAS.map((c) => (
                <option key={c} value={c}>
                  {CONTA_GERIDA_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo" htmlFor="tipo" required error={errors.tipo?.message}>
            <select
              id="tipo"
              {...register("tipo")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {TIPO_MOVIMENTO_LABELS[t]}
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
        </div>

        <Field
          label="Descrição"
          htmlFor="descricao"
          required
          error={errors.descricao?.message}
        >
          <Input id="descricao" invalid={!!errors.descricao} {...register("descricao")} />
        </Field>

        {tipoAtual === "saida" ? (
          <Field
            label="Destinação"
            htmlFor="destinacao"
            error={errors.destinacao?.message}
            hint="Para onde foi destinado o recurso (instituição/projeto)."
          >
            <Input id="destinacao" {...register("destinacao")} />
          </Field>
        ) : null}

        <Field
          label="Processo (opcional)"
          htmlFor="processo"
          error={errors.processo?.message}
        >
          <Input id="processo" {...register("processo")} />
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
