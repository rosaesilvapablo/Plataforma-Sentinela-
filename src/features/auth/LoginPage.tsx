import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  function detectCapsLock(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState?.("CapsLock") ?? false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-tight text-sentinela-ink">
          O guardião da{" "}
          <span className="text-sentinela-accent">eficiência judicial.</span>
        </h1>
        <p className="mt-3 text-slate-500">
          <span className="font-medium text-slate-700">Vigilância</span>,{" "}
          <span className="font-medium text-slate-700">proteção</span> e{" "}
          <span className="font-medium text-slate-700">inteligência</span> em um só lugar.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div aria-live="polite" aria-atomic="true">
          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900"
            >
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs font-semibold tracking-[0.12em] uppercase text-slate-500"
          >
            E-mail institucional
          </label>
          <div className="relative">
            <Mail
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            />
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.nome@trf1.jus.br"
              className={cn(
                "w-full h-12 rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm",
                "transition focus:outline-none focus-visible:border-sentinela-accent",
                "focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-sentinela-accent/15",
              )}
            />
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold tracking-[0.12em] uppercase text-slate-500"
          >
            Senha
          </label>
          <div className="relative">
            <Lock
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={detectCapsLock}
              onKeyUp={detectCapsLock}
              placeholder="••••••••"
              aria-describedby={capsLock ? "caps-lock-warning" : undefined}
              className={cn(
                "w-full h-12 rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 text-sm",
                "transition focus:outline-none focus-visible:border-sentinela-accent",
                "focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-sentinela-accent/15",
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-accent/40"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {capsLock ? (
            <p
              id="caps-lock-warning"
              role="status"
              className="flex items-center gap-1.5 text-xs text-amber-700"
            >
              <AlertCircle aria-hidden className="h-3.5 w-3.5" />
              Caps Lock está ativado.
            </p>
          ) : null}
        </div>

        {/* Lembrar + recuperar */}
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sentinela-accent focus:ring-sentinela-accent/40"
            />
            <span className="text-sm text-slate-700">Lembrar-me</span>
          </label>
          <Link
            to="/conta/recuperar"
            className="text-sm font-medium text-sentinela-accent hover:underline"
          >
            Recuperar senha
          </Link>
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "group flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 font-semibold text-white",
            "bg-sentinela-accent shadow-sm shadow-sentinela-accent/30",
            "transition hover:bg-sentinela-accent-hover active:scale-[0.99]",
            "focus:outline-none focus-visible:ring-4 focus-visible:ring-sentinela-accent/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {loading ? (
            <Spinner size="sm" className="text-white" />
          ) : null}
          <span>{loading ? "Autenticando…" : "Acessar Sistema"}</span>
          {!loading ? (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          ) : null}
        </button>
      </form>
    </AuthLayout>
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
      return "E-mail ou senha inválidos.";
    }
    if (code.includes("invalid-email")) {
      return "Formato de e-mail inválido.";
    }
    if (code.includes("too-many-requests")) {
      return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
    }
    if (code.includes("user-disabled")) {
      return "Conta desativada. Procure a coordenação.";
    }
    if (code.includes("network-request-failed")) {
      return "Falha de rede. Verifique sua conexão.";
    }
    if (code.includes("operation-not-allowed")) {
      return "Login por e-mail/senha está desabilitado no projeto. Acione um administrador.";
    }
  }
  return "Não foi possível entrar. Tente novamente.";
}
