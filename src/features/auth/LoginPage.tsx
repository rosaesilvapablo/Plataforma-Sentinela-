import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/auth/useAuth";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(mapAuthError(err));
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
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-wider text-slate-500">Plataforma</p>
          <h1 className="text-2xl font-semibold text-sentinela-ink">Sentinela 2026</h1>
        </div>

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
          <Field label="Senha" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" loading={loading}>
            Entrar
          </Button>
          <p className="text-center text-sm text-slate-500">
            <Link to="/conta/recuperar" className="hover:underline">
              Esqueci minha senha
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}

function mapAuthError(err: unknown): string {
  if (typeof err === "object" && err && "code" in err) {
    const code = String((err as { code: unknown }).code);
    if (
      code.includes("invalid-credential") ||
      code.includes("wrong-password") ||
      code.includes("user-not-found")
    ) {
      return "Email ou senha invalidos.";
    }
    if (code.includes("too-many-requests")) {
      return "Muitas tentativas. Tente novamente em alguns minutos.";
    }
    if (code.includes("user-disabled")) {
      return "Conta desativada. Procure um administrador.";
    }
    if (code.includes("network-request-failed")) {
      return "Falha de rede. Verifique sua conexao.";
    }
  }
  return "Nao foi possivel entrar. Tente novamente.";
}
