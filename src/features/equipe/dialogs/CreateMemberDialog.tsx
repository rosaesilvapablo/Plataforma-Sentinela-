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
  createTeamMemberFormSchema,
  tipoVinculoSchema,
  TIPO_VINCULO_LABELS,
  type CreateTeamMemberForm,
  type TipoVinculo,
} from "@/domain/team";
import { createTeamMember } from "@/data/team.repo";

const TIPO_VINCULOS: TipoVinculo[] = [...tipoVinculoSchema.options];

export function CreateMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateTeamMemberForm>({
    resolver: zodResolver(createTeamMemberFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      matricula: "",
      cargoEfetivo: "",
      funcaoComissionada: "",
      tipoVinculo: "servidor",
      lotacaoParadigma: "",
      lotacaoAtual: "",
      observacoes: "",
    },
  });

  async function onSubmit(data: CreateTeamMemberForm) {
    setSubmitError(null);
    try {
      await createTeamMember(data);
      toast.success(`${data.nome} cadastrado.`);
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
    <Modal open={open} onClose={close} title="Cadastrar membro" className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome completo" htmlFor="nome" required error={errors.nome?.message}>
            <Input
              id="nome"
              autoComplete="name"
              invalid={!!errors.nome}
              {...register("nome")}
            />
          </Field>
          <Field
            label="E-mail institucional"
            htmlFor="email"
            required
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              invalid={!!errors.email}
              {...register("email")}
            />
          </Field>
          <Field
            label="Matrícula"
            htmlFor="matricula"
            required
            error={errors.matricula?.message}
          >
            <Input id="matricula" invalid={!!errors.matricula} {...register("matricula")} />
          </Field>
          <Field
            label="Tipo de vínculo"
            htmlFor="tipoVinculo"
            required
            error={errors.tipoVinculo?.message}
          >
            <select
              id="tipoVinculo"
              {...register("tipoVinculo")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {TIPO_VINCULOS.map((t) => (
                <option key={t} value={t}>
                  {TIPO_VINCULO_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Cargo efetivo"
            htmlFor="cargoEfetivo"
            required
            error={errors.cargoEfetivo?.message}
            hint="Imutável após criação."
          >
            <Input
              id="cargoEfetivo"
              invalid={!!errors.cargoEfetivo}
              {...register("cargoEfetivo")}
            />
          </Field>
          <Field
            label="Função comissionada"
            htmlFor="funcaoComissionada"
            error={errors.funcaoComissionada?.message}
            hint="Opcional. Ex.: FC-05, CJ-02."
          >
            <Input
              id="funcaoComissionada"
              invalid={!!errors.funcaoComissionada}
              {...register("funcaoComissionada")}
            />
          </Field>
          <Field
            label="Lotação paradigma"
            htmlFor="lotacaoParadigma"
            required
            error={errors.lotacaoParadigma?.message}
            hint="Onde deveria estar (paradigma da Vara)."
          >
            <Input
              id="lotacaoParadigma"
              invalid={!!errors.lotacaoParadigma}
              {...register("lotacaoParadigma")}
            />
          </Field>
          <Field
            label="Lotação atual"
            htmlFor="lotacaoAtual"
            required
            error={errors.lotacaoAtual?.message}
            hint="Onde está hoje."
          >
            <Input
              id="lotacaoAtual"
              invalid={!!errors.lotacaoAtual}
              {...register("lotacaoAtual")}
            />
          </Field>
        </div>

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
            Cadastrar
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
  return "Não foi possível cadastrar.";
}
