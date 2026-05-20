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
  plantaoFormSchema,
  tipoPlantaoSchema,
  TIPO_PLANTAO_LABELS,
  type PlantaoForm,
  type Plantao,
  type TipoPlantao,
} from "@/domain/plantao";
import { createPlantao, updatePlantao } from "@/data/plantao.repo";
import { useTeamList } from "@/hooks/useTeamList";

const TIPOS: TipoPlantao[] = [...tipoPlantaoSchema.options];

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function today(): string {
  return toDateString(new Date());
}

export function PlantaoDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Plantao;
}) {
  const { team, loading: loadingTeam } = useTeamList();
  const juizes = useMemo(
    () => team.filter((m) => m.tipoVinculo === "juiz" && m.status === "ativo"),
    [team],
  );
  const servidores = useMemo(
    () => team.filter((m) => m.tipoVinculo === "servidor" && m.status === "ativo"),
    [team],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PlantaoForm>({
    resolver: zodResolver(plantaoFormSchema),
    defaultValues: existing
      ? {
          juizId: existing.juizId,
          servidorId: existing.servidorId,
          tipo: existing.tipo,
          dataInicio: toDateString(existing.dataInicio),
          dataFim: toDateString(existing.dataFim),
          observacoes: existing.observacoes ?? "",
        }
      : {
          juizId: "",
          servidorId: "",
          tipo: "ordinario",
          dataInicio: today(),
          dataFim: today(),
          observacoes: "",
        },
  });

  async function onSubmit(data: PlantaoForm) {
    setSubmitError(null);
    const juiz = juizes.find((m) => m.uid === data.juizId);
    const servidor = servidores.find((m) => m.uid === data.servidorId);
    if (!juiz || !servidor) {
      setSubmitError("Selecione juiz e servidor válidos.");
      return;
    }
    try {
      if (existing) {
        await updatePlantao(existing.id, data, juiz.nome, servidor.nome);
        toast.success("Plantão atualizado.");
      } else {
        await createPlantao(data, juiz.nome, servidor.nome);
        toast.success("Plantão registrado.");
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
      title={existing ? "Editar plantão" : "Registrar plantão"}
      className="max-w-2xl"
    >
      {loadingTeam ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : juizes.length === 0 || servidores.length === 0 ? (
        <Alert tone="warning">
          É necessário ter pelo menos um <strong>juiz</strong> e um{" "}
          <strong>servidor</strong> ativos cadastrados em Equipe → Cadastro.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Juiz responsável" htmlFor="juizId" required error={errors.juizId?.message}>
              <select
                id="juizId"
                {...register("juizId")}
                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
              >
                <option value="">Selecione…</option>
                {juizes.map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Servidor responsável"
              htmlFor="servidorId"
              required
              error={errors.servidorId?.message}
            >
              <select
                id="servidorId"
                {...register("servidorId")}
                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
              >
                <option value="">Selecione…</option>
                {servidores.map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.nome}
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
                    {TIPO_PLANTAO_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>
            <div />
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
            <Field label="Data fim" htmlFor="dataFim" required error={errors.dataFim?.message}>
              <Input
                id="dataFim"
                type="date"
                invalid={!!errors.dataFim}
                {...register("dataFim")}
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
  return "Não foi possível salvar o plantão.";
}
