import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { metaFormSchema, type MetaForm, type MetaEvolucao } from "@/domain/metas";
import { createMeta, updateMeta } from "@/data/metas.repo";

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function MetaDialog({
  open,
  onClose,
  existing,
  presetCodigo,
  presetDescricao,
}: {
  open: boolean;
  onClose: () => void;
  existing?: MetaEvolucao | undefined;
  presetCodigo?: string | undefined;
  presetDescricao?: string | undefined;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MetaForm>({
    resolver: zodResolver(metaFormSchema),
    defaultValues: existing
      ? {
          codigo: existing.codigo,
          descricao: existing.descricao,
          periodo: existing.periodo,
          percentual: existing.percentual,
          valorAlvo: existing.valorAlvo,
          valorAlcancado: existing.valorAlcancado,
          observacoes: existing.observacoes ?? "",
        }
      : {
          codigo: presetCodigo ?? "",
          descricao: presetDescricao ?? "",
          periodo: currentPeriod(),
          percentual: 0,
          valorAlvo: null,
          valorAlcancado: null,
          observacoes: "",
        },
  });

  async function onSubmit(data: MetaForm) {
    setSubmitError(null);
    try {
      if (existing) {
        await updateMeta(existing.id, data);
        toast.success("Meta atualizada.");
      } else {
        await createMeta(data);
        toast.success("Meta registrada.");
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
      title={existing ? "Editar registro de meta" : "Registrar evolução"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Código da meta"
            htmlFor="codigo"
            required
            error={errors.codigo?.message}
            hint="Ex.: Meta 1, Meta 4"
          >
            <Input id="codigo" invalid={!!errors.codigo} {...register("codigo")} />
          </Field>
          <Field label="Período" htmlFor="periodo" required error={errors.periodo?.message}>
            <Input
              id="periodo"
              type="month"
              invalid={!!errors.periodo}
              {...register("periodo")}
            />
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field
            label="% cumprimento"
            htmlFor="percentual"
            required
            error={errors.percentual?.message}
          >
            <Input
              id="percentual"
              type="number"
              step="0.1"
              min="0"
              max="200"
              invalid={!!errors.percentual}
              {...register("percentual", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Valor alvo" htmlFor="valorAlvo" error={errors.valorAlvo?.message}>
            <Input
              id="valorAlvo"
              type="number"
              step="0.01"
              {...register("valorAlvo", {
                setValueAs: (v) =>
                  v === "" || v === null || v === undefined ? null : Number(v),
              })}
            />
          </Field>
          <Field
            label="Valor alcançado"
            htmlFor="valorAlcancado"
            error={errors.valorAlcancado?.message}
          >
            <Input
              id="valorAlcancado"
              type="number"
              step="0.01"
              {...register("valorAlcancado", {
                setValueAs: (v) =>
                  v === "" || v === null || v === undefined ? null : Number(v),
              })}
            />
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
