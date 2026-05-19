import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { cn } from "@/lib/utils";

export function ForgotPasswordPage() {
  const { sendReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendReset(email.trim());
      setSent(true);
    } catch {
      setError("Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-tight text-sentinela-ink">
          Recuperar <span className="text-sentinela-accent">acesso.</span>
        </h1>
        <p className="mt-3 text-slate-500">
          Informe seu e-mail institucional. Enviaremos um link para você redefinir a senha.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div aria-live="polite" aria-atomic="true">
          {sent ? (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
            >
              <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Se o e-mail existir, enviamos um link de recuperação.</span>
            </div>
          ) : null}
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

        <button
          type="submit"
          disabled={loading || sent}
          className={cn(
            "group flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 font-semibold text-white",
            "bg-sentinela-accent shadow-sm shadow-sentinela-accent/30",
            "transition hover:bg-sentinela-accent-hover active:scale-[0.99]",
            "focus:outline-none focus-visible:ring-4 focus-visible:ring-sentinela-accent/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {loading ? <Spinner size="sm" className="text-white" /> : null}
          <span>{loading ? "Enviando…" : "Enviar link"}</span>
          {!loading ? (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          ) : null}
        </button>

        <p className="text-center text-sm">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-sentinela-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
