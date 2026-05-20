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
  pplFormSchema,
  tipoPrisaoSchema,
  TIPO_PRISAO_LABELS,
  type PplForm,
  type Ppl,
  type TipoPrisao,
} from "@/domain/ppl";
import { createPpl, updatePpl } from "@/data/ppl.repo";

const TIPOS: TipoPrisao[] = [...tipoPrisaoSchema.options];

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function PplDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Ppl;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PplForm>({
    resolver: zodResolver(pplFormSchema),
    defaultValues: existing
      ? {
          nome: existing.nome,
          cpf: existing.cpf ?? "",
          rg: existing.rg ?? "",
          processo: existing.processo,
          tipoPrisao: existing.tipoPrisao,
          dataPrisao: toDateString(existing.dataPrisao),
          ultimaRevisao: existing.ultimaRevisao
            ? toDateString(existing.ultimaRevisao)
            : "",
          unidade: existing.unidade ?? "",
          observacoes: existing.observacoes ?? "",
        }
      : {
          nome: "",
          cpf: "",
          rg: "",
          processo: "",
          tipoPrisao: "preventiva",
          dataPrisao: toDateString(new Date()),
          ultimaRevisao: "",
          unidade: "",
          observacoes: "",
        },
  });

  async function onSubmit(data: PplForm) {
    setSubmitError(null);
    try {
      if (existing) {
        await updatePpl(existing.id, data);
        toast.success(`${data.nome} atualizado.`);
      } else {
        await createPpl(data);
        toast.success(`${data.nome} registrado.`);
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
      title={existing ? `Editar — ${existing.nome}` : "Registrar PPL"}
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome" htmlFor="nome" required error={errors.nome?.message}>
            <Input id="nome" invalid={!!errors.nome} {...register("nome")} />
          </Field>
          <Field
            label="Processo"
            htmlFor="processo"
            required
            error={errors.processo?.message}
          >
            <Input id="processo" invalid={!!errors.processo} {...register("processo")} />
          </Field>
          <Field label="CPF" htmlFor="cpf" error={errors.cpf?.message}>
            <Input id="cpf" {...register("cpf")} />
          </Field>
          <Field label="RG" htmlFor="rg" error={errors.rg?.message}>
            <Input id="rg" {...register("rg")} />
          </Field>
          <Field
            label="Tipo de prisão"
            htmlFor="tipoPrisao"
            required
            error={errors.tipoPrisao?.message}
          >
            <select
              id="tipoPrisao"
              {...register("tipoPrisao")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {TIPO_PRISAO_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unidade prisional" htmlFor="unidade" error={errors.unidade?.message}>
            <Input id="unidade" {...register("unidade")} />
          </Field>
          <Field
            label="Data da prisão"
            htmlFor="dataPrisao"
            required
            error={errors.dataPrisao?.message}
          >
            <Input
              id="dataPrisao"
              type="date"
              invalid={!!errors.dataPrisao}
              {...register("dataPrisao")}
            />
          </Field>
          <Field
            label="Última revisão (Art. 316)"
            htmlFor="ultimaRevisao"
            error={errors.ultimaRevisao?.message}
            hint="Opcional. Se vazio e tipo=preventiva, próxima revisão = data da prisão + 90 dias."
          >
            <Input
              id="ultimaRevisao"
              type="date"
              {...register("ultimaRevisao")}
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
