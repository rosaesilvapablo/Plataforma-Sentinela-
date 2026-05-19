import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/auth/useAuth";

const MIN_LEN = 8;

export function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < MIN_LEN) {
      setError(`A nova senha deve ter pelo menos ${MIN_LEN} caracteres.`);
      return;
    }
    if (next !== confirm) {
      setError("A confirmacao nao coincide com a nova senha.");
      return;
    }
    if (next === current) {
      setError("A nova senha precisa ser diferente da atual.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(current, next);
      setOk(true);
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      const code =
        typeof err === "object" && err && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      if (code.includes("wrong-password") || code.includes("invalid-credential")) {
        setError("Senha atual incorreta.");
      } else if (code.includes("weak-password")) {
        setError("A nova senha e fraca demais. Use letras, numeros e simbolos.");
      } else {
        setError("Nao foi possivel atualizar a senha.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-md">
      <h1 className="mb-6 text-xl font-semibold">Trocar senha</h1>
      {ok ? (
        <Alert tone="success" className="mb-4">
          Senha atualizada com sucesso.
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Senha atual" htmlFor="current" required>
          <Input
            id="current"
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field label="Nova senha" htmlFor="next" required hint={`Minimo de ${MIN_LEN} caracteres.`}>
          <Input
            id="next"
            type="password"
            autoComplete="new-password"
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        <Field label="Confirmar nova senha" htmlFor="confirm" required>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <Button type="submit" loading={loading}>
          Salvar
        </Button>
      </form>
    </Card>
  );
}
