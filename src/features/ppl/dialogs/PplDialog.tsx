import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import {
  pplFormSchema,
  tipoPrisaoSchema,
  situacaoSchema,
  TIPO_PRISAO_LABELS,
  SITUACAO_LABELS,
  type PplForm,
  type Ppl,
  type TipoPrisao,
  type Situacao,
} from "@/domain/ppl";
import { createPpl, updatePpl } from "@/data/ppl.repo";

const TIPOS: TipoPrisao[] = [...tipoPrisaoSchema.options];
const SITUACOES: Situacao[] = [...situacaoSchema.options];

function toDateString(d: Date | null): string {
  if (!d) return "";
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
  existing?: Ppl | undefined;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PplForm>({
    resolver: zodResolver(pplFormSchema),
    defaultValues: existing
      ? {
          nome: existing.nome,
          rji: existing.rji ?? "",
          cpf: existing.cpf ?? "",
          rg: existing.rg ?? "",
          processo: existing.processo,
          local: existing.local ?? "",
          situacao: existing.situacao,
          tipoPrisao: existing.tipoPrisao,
          dataCumprimento: toDateString(existing.dataCumprimento),
          ultimaRevisao: toDateString(existing.ultimaRevisao),
          redNotice: existing.redNotice,
          redNoticeDate: toDateString(existing.redNoticeDate),
          observacoes: existing.observacoes ?? "",
        }
      : {
          nome: "",
          rji: "",
          cpf: "",
          rg: "",
          processo: "",
          local: "",
          situacao: "pessoa_presa",
          tipoPrisao: "preventiva",
          dataCumprimento: toDateString(new Date()),
          ultimaRevisao: "",
          redNotice: false,
          redNoticeDate: "",
          observacoes: "",
        },
  });

  const redNoticeAtual = useWatch({ control, name: "redNotice" });
  const situacaoAtual = useWatch({ control, name: "situacao" });

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

        <Field label="Nome completo" htmlFor="nome" required error={errors.nome?.message}>
          <Input id="nome" invalid={!!errors.nome} {...register("nome")} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="RJI (BNMP)" htmlFor="rji" error={errors.rji?.message}>
            <Input id="rji" placeholder="ID no BNMP" {...register("rji")} />
          </Field>
          <Field label="CPF" htmlFor="cpf" error={errors.cpf?.message}>
            <Input id="cpf" placeholder="000.000.000-00" {...register("cpf")} />
          </Field>
          <Field label="RG" htmlFor="rg" error={errors.rg?.message}>
            <Input id="rg" {...register("rg")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Processo"
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
            label="Local (estabelecimento)"
            htmlFor="local"
            error={errors.local?.message}
            hint="Ex.: IAPEN, Delegacia…"
          >
            <Input id="local" {...register("local")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Situação"
            htmlFor="situacao"
            required
            error={errors.situacao?.message}
          >
            <select
              id="situacao"
              {...register("situacao")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {SITUACOES.map((s) => (
                <option key={s} value={s}>
                  {SITUACAO_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Espécie de prisão"
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Data de cumprimento do mandado"
            htmlFor="dataCumprimento"
            error={errors.dataCumprimento?.message}
          >
            <Input
              id="dataCumprimento"
              type="date"
              {...register("dataCumprimento")}
            />
          </Field>
          <Field
            label="Última revisão da prisão"
            htmlFor="ultimaRevisao"
            error={errors.ultimaRevisao?.message}
            hint={
              situacaoAtual === "pessoa_presa"
                ? "Próxima revisão Art. 316: 90 dias após esta data (ou após o cumprimento, se vazio)."
                : "Aplicável apenas para Pessoa Presa."
            }
          >
            <Input id="ultimaRevisao" type="date" {...register("ultimaRevisao")} />
          </Field>
        </div>

        {/* Interpol — flag inline (restaurado do legado) */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("redNotice")}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
            />
            <span className="text-sm font-bold text-red-700 flex items-center gap-1.5">
              <Globe className="h-4 w-4" />
              Difusão Vermelha (Interpol)
            </span>
          </label>
          {redNoticeAtual ? (
            <Field
              label="Data da inclusão na Difusão Vermelha"
              htmlFor="redNoticeDate"
              error={errors.redNoticeDate?.message}
            >
              <Input id="redNoticeDate" type="date" {...register("redNoticeDate")} />
            </Field>
          ) : null}
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
