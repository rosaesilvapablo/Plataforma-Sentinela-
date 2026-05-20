import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import {
  createFrequenciaFormSchema,
  frequenciaTipoSchema,
  FREQUENCIA_TIPO_LABELS,
  type CreateFrequenciaForm,
  type FrequenciaTipo,
} from "@/domain/frequencia";
import { createFrequencia } from "@/data/frequencia.repo";
import { useTeamList } from "@/hooks/useTeamList";

const TIPOS: FrequenciaTipo[] = [...frequenciaTipoSchema.options];

function todayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function CreateFrequenciaDialog({
  open,
  onClose,
  defaultMemberId,
}: {
  open: boolean;
  onClose: () => void;
  defaultMemberId?: string;
}) {
  const { team, loading: loadingTeam } = useTeamList();
  const ativos = useMemo(() => team.filter((m) => m.status === "ativo"), [team]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateFrequenciaForm>({
    resolver: zodResolver(createFrequenciaFormSchema),
    defaultValues: {
      memberId: defaultMemberId ?? "",
      tipo: "ausencia_justificada",
      dataInicio: todayDateString(),
      dataFim: todayDateString(),
      motivo: "",
      observacoes: "",
    },
  });

  const selectedMemberId = useWatch({ control, name: "memberId" });
  const selectedMember = ativos.find((m) => m.uid === selectedMemberId);

  async function onSubmit(data: CreateFrequenciaForm) {
    setSubmitError(null);
    const member = ativos.find((m) => m.uid === data.memberId);
    if (!member) {
      setSubmitError("Pessoa não encontrada.");
      return;
    }
    try {
      await createFrequencia(data, member.nome);
      toast.success(`Frequência de ${member.nome} registrada.`);
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
    <Modal open={open} onClose={close} title="Registrar frequência" className="max-w-2xl">
      {loadingTeam ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : ativos.length === 0 ? (
        <Alert tone="warning">
          Nenhuma pessoa ativa cadastrada. Cadastre membros em <strong>Equipe → Cadastro</strong>{" "}
          antes de registrar frequências.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

          <Field label="Pessoa" htmlFor="memberId" required error={errors.memberId?.message}>
            <select
              id="memberId"
              {...register("memberId")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              <option value="">Selecione…</option>
              {ativos.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.nome} — {m.cargoEfetivo}
                </option>
              ))}
            </select>
            {selectedMember ? (
              <p className="text-xs text-slate-500 mt-1">
                Lotação atual: {selectedMember.lotacaoAtual}
              </p>
            ) : null}
          </Field>

          <Field label="Tipo" htmlFor="tipo" required error={errors.tipo?.message}>
            <select
              id="tipo"
              {...register("tipo")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {FREQUENCIA_TIPO_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              label="Data fim"
              htmlFor="dataFim"
              required
              error={errors.dataFim?.message}
              hint="Mesmo dia se for ausência de 1 dia."
            >
              <Input
                id="dataFim"
                type="date"
                invalid={!!errors.dataFim}
                {...register("dataFim")}
              />
            </Field>
          </div>

          <Field label="Motivo" htmlFor="motivo" error={errors.motivo?.message}>
            <Input
              id="motivo"
              placeholder="Ex.: férias, licença médica, capacitação"
              invalid={!!errors.motivo}
              {...register("motivo")}
            />
          </Field>

          <Field
            label="Observações"
            htmlFor="observacoes"
            error={errors.observacoes?.message}
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
              Registrar
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
  return "Não foi possível registrar a frequência.";
}
