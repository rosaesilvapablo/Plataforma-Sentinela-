import { useSearchParams } from "react-router-dom";
import { OrientacoesTab } from "@/features/recolhimentos/OrientacoesTab";
import { ContasTab } from "@/features/recolhimentos/ContasTab";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "orientacoes", label: "Orientações" },
  { id: "contas", label: "Gestão de Contas" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(v: string | null): v is TabId {
  return v === "orientacoes" || v === "contas";
}

export function RecolhimentosPage() {
  const [params, setParams] = useSearchParams();
  const candidate = params.get("tab");
  const current: TabId = isTabId(candidate) ? candidate : "orientacoes";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-sentinela-ink">Recolhimentos & Gestão</h1>
        <p className="text-sm text-slate-500">
          Orientações para recolhimento de prestações pecuniárias, multas e fiança; gestão de
          contas ANPP, PRD e Conta Única.
        </p>
      </header>

      <div className="border-b border-slate-200">
        <nav role="tablist" aria-label="Abas Recolhimentos" className="-mb-px flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={current === t.id}
              onClick={() => setParams({ tab: t.id })}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                current === t.id
                  ? "border-sentinela-accent text-sentinela-accent"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div role="tabpanel">
        {current === "orientacoes" ? <OrientacoesTab /> : null}
        {current === "contas" ? <ContasTab /> : null}
      </div>
    </div>
  );
}
