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
  regimeFormSchema,
  tipoRegimeSchema,
  TIPO_REGIME_LABELS,
  type RegimeForm,
  type Regime,
  type TipoRegime,
} from "@/domain/regimeTrabalho";
import { createRegime, updateRegime } from "@/data/regimeTrabalho.repo";
import { useTeamList } from "@/hooks/useTeamList";

const TIPOS: TipoRegime[] = [...tipoRegimeSchema.options];

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function RegimeDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Regime;
}) {
  const { team, loading: loadingTeam } = useTeamList();
  const ativos = useMemo(() => team.filter((m) => m.status === "ativo"), [team]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegimeForm>({
    resolver: zodResolver(regimeFormSchema),
    defaultValues: existing
      ? {
          memberId: existing.memberId,
          tipo: existing.tipo,
          processoSei: existing.processoSei,
          dataInicio: toDateString(existing.dataInicio),
          dataFimPrevista: existing.dataFimPrevista
            ? toDateString(existing.dataFimPrevista)
            : "",
          observacoes: existing.observacoes ?? "",
        }
      : {
          memberId: "",
          tipo: "hibrido",
          processoSei: "",
          dataInicio: toDateString(new Date()),
          dataFimPrevista: "",
          observacoes: "",
        },
  });

  async function onSubmit(data: RegimeForm) {
    setSubmitError(null);
    const member = ativos.find((m) => m.uid === data.memberId);
    if (!member) {
      setSubmitError("Pessoa não encontrada.");
      return;
    }
    try {
      if (existing) {
        await updateRegime(existing.id, data, member.nome);
        toast.success("Regime atualizado.");
      } else {
        await createRegime(data, member.nome);
        toast.success("Regime registrado.");
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
      title={existing ? "Editar regime de trabalho" : "Registrar regime de trabalho"}
      className="max-w-2xl"
    >
      {loadingTeam ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : ativos.length === 0 ? (
        <Alert tone="warning">
          Cadastre pessoas em <strong>Equipe → Cadastro</strong> antes de registrar regimes.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

          <Field label="Pessoa" htmlFor="memberId" required error={errors.memberId?.message}>
            <select
              id="memberId"
              {...register("memberId")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
              disabled={!!existing}
            >
              <option value="">Selecione…</option>
              {ativos.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.nome} — {m.cargoEfetivo}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tipo de regime" htmlFor="tipo" required error={errors.tipo?.message}>
              <select
                id="tipo"
                {...register("tipo")}
                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {TIPO_REGIME_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Processo SEI"
              htmlFor="processoSei"
              required
              error={errors.processoSei?.message}
              hint="Ex.: 0001234-56.2026.4.01.0001"
            >
              <Input
                id="processoSei"
                invalid={!!errors.processoSei}
                {...register("processoSei")}
              />
            </Field>
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
              label="Fim previsto"
              htmlFor="dataFimPrevista"
              error={errors.dataFimPrevista?.message}
              hint="Opcional. Alerta de prazo aparece próximo ao fim."
            >
              <Input
                id="dataFimPrevista"
                type="date"
                invalid={!!errors.dataFimPrevista}
                {...register("dataFimPrevista")}
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
      )}
    </Modal>
  );
}

function formatError(err: unknown): string {
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Não foi possível salvar o regime.";
}
