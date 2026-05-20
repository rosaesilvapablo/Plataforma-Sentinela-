import { useSearchParams } from "react-router-dom";
import { PplListTab } from "@/features/ppl/tabs/PplListTab";
import { MandadosTab } from "@/features/ppl/tabs/MandadosTab";
import { TestemunhasTab } from "@/features/ppl/tabs/TestemunhasTab";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "lista", label: "Pessoas Privadas de Liberdade" },
  { id: "mandados", label: "Mandados & Difusão Vermelha" },
  { id: "testemunhas", label: "Testemunhas Protegidas" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return TABS.some((t) => t.id === value);
}

export function PplPage() {
  const [params, setParams] = useSearchParams();
  const candidate = params.get("tab");
  const current: TabId = isTabId(candidate) ? candidate : "lista";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-sentinela-ink">PPL Criminal</h1>
        <p className="text-sm text-slate-500">
          Pessoas Privadas de Liberdade, mandados pendentes / difusão vermelha e testemunhas
          protegidas (Lei 9.807/99).
        </p>
      </header>

      <div className="border-b border-slate-200">
        <nav
          role="tablist"
          aria-label="Abas PPL"
          className="-mb-px flex gap-1 overflow-x-auto"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={current === t.id}
              onClick={() => setParams({ tab: t.id })}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
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
        {current === "lista" ? <PplListTab /> : null}
        {current === "mandados" ? <MandadosTab /> : null}
        {current === "testemunhas" ? <TestemunhasTab /> : null}
      </div>
    </div>
  );
}
