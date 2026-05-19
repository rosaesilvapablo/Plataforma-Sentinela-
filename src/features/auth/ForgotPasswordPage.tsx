import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/auth/useAuth";

export function ForgotPasswordPage() {
  const { sendReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendReset(email);
      setSent(true);
    } catch {
      setError("Nao foi possivel enviar o email. Verifique o endereco e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-sentinela-surface px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm"
        noValidate
      >
        <h1 className="mb-6 text-xl font-semibold">Recuperar senha</h1>

        {sent ? (
          <Alert tone="success" className="mb-4">
            Se o email existir, enviamos um link de recuperacao.
          </Alert>
        ) : null}
        {error ? (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        ) : null}

        <div className="space-y-4">
          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" loading={loading} disabled={sent}>
            Enviar link
          </Button>
          <p className="text-center text-sm">
            <Link to="/login" className="text-slate-600 hover:underline">
              Voltar ao login
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
