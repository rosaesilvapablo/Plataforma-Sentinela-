import { useSearchParams } from "react-router-dom";
import { QuadroGeralTab } from "@/features/equipe/tabs/QuadroGeralTab";
import { CadastroTab } from "@/features/equipe/tabs/CadastroTab";
import { FrequenciaTab } from "@/features/equipe/tabs/FrequenciaTab";
import { PlantaoTab } from "@/features/equipe/tabs/PlantaoTab";
import { RegimeTrabalhoTab } from "@/features/equipe/tabs/RegimeTrabalhoTab";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "quadro", label: "Quadro Geral" },
  { id: "cadastro", label: "Cadastro" },
  { id: "frequencia", label: "Frequência" },
  { id: "plantao", label: "Plantão" },
  { id: "regime", label: "Regime de Trabalho" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return TABS.some((t) => t.id === value);
}

export function EquipePage() {
  const [params, setParams] = useSearchParams();
  const candidate = params.get("tab");
  const current: TabId = isTabId(candidate) ? candidate : "quadro";

  function selectTab(id: TabId) {
    setParams({ tab: id });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-sentinela-ink">Equipe</h1>
        <p className="text-sm text-slate-500">
          Quadro de pessoal da Vara: cadastro, frequência, plantão e regime de trabalho.
        </p>
      </header>

      <div className="border-b border-slate-200">
        <nav
          role="tablist"
          aria-label="Abas de Equipe"
          className="-mb-px flex gap-1 overflow-x-auto"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={current === t.id}
              onClick={() => selectTab(t.id)}
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
        {current === "quadro" ? <QuadroGeralTab /> : null}
        {current === "cadastro" ? <CadastroTab /> : null}
        {current === "frequencia" ? <FrequenciaTab /> : null}
        {current === "plantao" ? <PlantaoTab /> : null}
        {current === "regime" ? <RegimeTrabalhoTab /> : null}
      </div>
    </div>
  );
}
