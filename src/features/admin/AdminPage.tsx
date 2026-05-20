import { useSearchParams } from "react-router-dom";
import { UsuariosTab } from "@/features/admin/tabs/UsuariosTab";
import { ConfiguracoesTab } from "@/features/admin/tabs/ConfiguracoesTab";
import { LogsTab } from "@/features/admin/tabs/LogsTab";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "usuarios", label: "Usuários" },
  { id: "configuracoes", label: "Configurações" },
  { id: "logs", label: "Logs" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return value === "usuarios" || value === "configuracoes" || value === "logs";
}

export function AdminPage() {
  const [params, setParams] = useSearchParams();
  const candidate = params.get("tab");
  const current: TabId = isTabId(candidate) ? candidate : "usuarios";

  function selectTab(id: TabId) {
    setParams({ tab: id });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-sentinela-ink">Admin</h1>
        <p className="text-sm text-slate-500">
          Gestão de usuários, configurações do sistema e auditoria.
        </p>
      </header>

      <div className="border-b border-slate-200">
        <nav role="tablist" aria-label="Abas do Admin" className="-mb-px flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={current === t.id}
              onClick={() => selectTab(t.id)}
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
        {current === "usuarios" ? <UsuariosTab /> : null}
        {current === "configuracoes" ? <ConfiguracoesTab /> : null}
        {current === "logs" ? <LogsTab /> : null}
      </div>
    </div>
  );
}
