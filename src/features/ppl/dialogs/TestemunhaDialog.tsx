import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import {
  testemunhaFormSchema,
  statusTestemunhaSchema,
  STATUS_TESTEMUNHA_LABELS,
  type TestemunhaForm,
  type Testemunha,
  type StatusTestemunha,
} from "@/domain/testemunha";
import { createTestemunha, updateTestemunha } from "@/data/testemunha.repo";

const STATUSES: StatusTestemunha[] = [...statusTestemunhaSchema.options];

function toDateString(d: Date | null): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function TestemunhaDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Testemunha | undefined;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TestemunhaForm>({
    resolver: zodResolver(testemunhaFormSchema),
    defaultValues: existing
      ? {
          codigo: existing.codigo,
          processo: existing.processo,
          quantidadePessoas: existing.quantidadePessoas,
          inProvita: existing.inProvita,
          dataInclusaoProvita: toDateString(existing.dataInclusaoProvita),
          status: existing.status,
          dataInclusao: toDateString(existing.dataInclusao),
          dataEncerramento: toDateString(existing.dataEncerramento),
          observacoes: existing.observacoes ?? "",
        }
      : {
          codigo: "",
          processo: "",
          quantidadePessoas: 1,
          inProvita: false,
          dataInclusaoProvita: "",
          status: "ativo",
          dataInclusao: toDateString(new Date()),
          dataEncerramento: "",
          observacoes: "",
        },
  });

  const inProvitaAtual = useWatch({ control, name: "inProvita" });

  async function onSubmit(data: TestemunhaForm) {
    setSubmitError(null);
    try {
      if (existing) {
        await updateTestemunha(existing.id, data);
        toast.success("Registro atualizado.");
      } else {
        await createTestemunha(data);
        toast.success("Registro criado.");
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
      title={existing ? "Editar testemunha protegida" : "Registrar testemunha protegida"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <Alert tone="warning" className="text-xs">
          <strong>Lei 9.807/99.</strong> NÃO armazene aqui dados pessoais reais (nome, endereço,
          contato). Use código identificador interno. A coluna observações é apenas para
          anotações administrativas — sem identificação de pessoas ou localização.
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Código identificador"
            htmlFor="codigo"
            required
            error={errors.codigo?.message}
            hint="Ex.: TP-2026-001"
          >
            <Input id="codigo" invalid={!!errors.codigo} {...register("codigo")} />
          </Field>
          <Field
            label="Número do processo"
            htmlFor="processo"
            required
            error={errors.processo?.message}
          >
            <Input
              id="processo"
              placeholder="0000000-00.0000.0.00.0000"
              invalid={!!errors.processo}
              {...register("processo")}
            />
          </Field>
          <Field
            label="Quantidade de pessoas"
            htmlFor="quantidadePessoas"
            required
            error={errors.quantidadePessoas?.message}
            hint="Pessoas protegidas neste processo."
          >
            <Input
              id="quantidadePessoas"
              type="number"
              min="1"
              max="999"
              invalid={!!errors.quantidadePessoas}
              {...register("quantidadePessoas", { valueAsNumber: true })}
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
                  {STATUS_TESTEMUNHA_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Data de inclusão"
            htmlFor="dataInclusao"
            required
            error={errors.dataInclusao?.message}
          >
            <Input
              id="dataInclusao"
              type="date"
              invalid={!!errors.dataInclusao}
              {...register("dataInclusao")}
            />
          </Field>
          <Field
            label="Data de encerramento"
            htmlFor="dataEncerramento"
            error={errors.dataEncerramento?.message}
            hint="Preencher quando status = encerrado."
          >
            <Input id="dataEncerramento" type="date" {...register("dataEncerramento")} />
          </Field>
        </div>

        {/* PROVITA — restaurado do legado */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("inProvita")}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm font-bold text-emerald-700">
              Incluído no PROVITA
            </span>
          </label>
          {inProvitaAtual ? (
            <Field
              label="Data de inclusão no PROVITA"
              htmlFor="dataInclusaoProvita"
              error={errors.dataInclusaoProvita?.message}
            >
              <Input
                id="dataInclusaoProvita"
                type="date"
                {...register("dataInclusaoProvita")}
              />
            </Field>
          ) : null}
        </div>

        <Field
          label="Observações administrativas"
          htmlFor="observacoes"
          error={errors.observacoes?.message}
          hint="Sem dados pessoais ou localização."
        >
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
