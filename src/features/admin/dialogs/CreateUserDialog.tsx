import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { ROLES, ROLE_LABELS } from "@/domain/roles";
import { createUserFormSchema, type CreateUserForm } from "@/domain/users";
import { callCreateNewUser } from "@/data/users.repo";

type CreatedSummary = {
  email: string;
  fullName: string;
  temporaryPassword: string;
};

export function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [created, setCreated] = useState<CreatedSummary | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: { email: "", fullName: "", role: "servidor" },
  });

  async function onSubmit(data: CreateUserForm) {
    setSubmitError(null);
    try {
      const res = await callCreateNewUser(data);
      setCreated({
        email: res.email,
        fullName: res.fullName,
        temporaryPassword: res.temporaryPassword,
      });
      toast.success(`Usuário ${res.fullName} criado.`);
    } catch (err) {
      setSubmitError(formatError(err));
    }
  }

  function close() {
    setCreated(null);
    setSubmitError(null);
    setCopied(false);
    reset();
    onClose();
  }

  async function copyCredentials() {
    if (!created) return;
    await navigator.clipboard.writeText(
      `E-mail: ${created.email}\nSenha temporária: ${created.temporaryPassword}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal open={open} onClose={close} title="Criar usuário">
      {created ? (
        <div className="space-y-4">
          <Alert tone="success">
            Usuário <strong>{created.fullName}</strong> criado. Compartilhe estas credenciais — a
            senha temporária <strong>não será exibida novamente</strong>.
          </Alert>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-sm">
            <div className="mb-1">
              E-mail: <strong>{created.email}</strong>
            </div>
            <div>
              Senha temporária: <strong>{created.temporaryPassword}</strong>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Recomende ao usuário trocar a senha no primeiro acesso (menu &quot;Trocar senha&quot;).
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => void copyCredentials()}>
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copiar
                </>
              )}
            </Button>
            <Button onClick={close}>Fechar</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {submitError ? <Alert tone="danger">{submitError}</Alert> : null}
          <Field
            label="Nome completo"
            htmlFor="fullName"
            required
            error={errors.fullName?.message}
          >
            <Input
              id="fullName"
              autoComplete="name"
              invalid={!!errors.fullName}
              {...register("fullName")}
            />
          </Field>
          <Field label="E-mail" htmlFor="email" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              invalid={!!errors.email}
              {...register("email")}
            />
          </Field>
          <Field label="Perfil" htmlFor="role" required error={errors.role?.message}>
            <select
              id="role"
              {...register("role")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={close} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Criar
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
  return "Não foi possível criar o usuário.";
}
