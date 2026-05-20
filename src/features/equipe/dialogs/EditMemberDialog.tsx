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
  updateTeamMemberFormSchema,
  tipoVinculoSchema,
  personStatusSchema,
  TIPO_VINCULO_LABELS,
  PERSON_STATUS_LABELS,
  type UpdateTeamMemberForm,
  type TipoVinculo,
  type PersonStatus,
  type TeamMember,
} from "@/domain/team";
import { updateTeamMember } from "@/data/team.repo";

const TIPO_VINCULOS: TipoVinculo[] = [...tipoVinculoSchema.options];
const STATUS_VALUES: PersonStatus[] = [...personStatusSchema.options];

export function EditMemberDialog({
  member,
  onClose,
}: {
  member: TeamMember;
  onClose: () => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateTeamMemberForm>({
    resolver: zodResolver(updateTeamMemberFormSchema),
    defaultValues: {
      nome: member.nome,
      email: member.email,
      matricula: member.matricula,
      funcaoComissionada: member.funcaoComissionada ?? "",
      tipoVinculo: member.tipoVinculo,
      lotacaoParadigma: member.lotacaoParadigma,
      lotacaoAtual: member.lotacaoAtual,
      status: member.status,
      observacoes: member.observacoes ?? "",
    },
  });

  async function onSubmit(data: UpdateTeamMemberForm) {
    setSubmitError(null);
    try {
      await updateTeamMember(member.uid, data);
      toast.success(`${data.nome} atualizado.`);
      onClose();
    } catch (err) {
      setSubmitError(formatError(err));
    }
  }

  return (
    <Modal open onClose={onClose} title={`Editar — ${member.nome}`} className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

        <Alert tone="info" className="text-xs">
          Cargo efetivo (<strong>{member.cargoEfetivo}</strong>) é imutável após criação.
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome completo" htmlFor="nome" required error={errors.nome?.message}>
            <Input id="nome" invalid={!!errors.nome} {...register("nome")} />
          </Field>
          <Field label="E-mail" htmlFor="email" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
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
            label="Função comissionada"
            htmlFor="funcaoComissionada"
            error={errors.funcaoComissionada?.message}
            hint="Opcional. Ex.: FC-05."
          >
            <Input
              id="funcaoComissionada"
              invalid={!!errors.funcaoComissionada}
              {...register("funcaoComissionada")}
            />
          </Field>
          <Field label="Status" htmlFor="status" required error={errors.status?.message}>
            <select
              id="status"
              {...register("status")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {STATUS_VALUES.map((s) => (
                <option key={s} value={s}>
                  {PERSON_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Lotação paradigma"
            htmlFor="lotacaoParadigma"
            required
            error={errors.lotacaoParadigma?.message}
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
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Salvar
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
  return "Não foi possível atualizar.";
}
