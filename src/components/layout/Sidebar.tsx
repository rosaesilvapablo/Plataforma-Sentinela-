import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarX,
  CalendarDays,
  Briefcase,
  ScrollText,
  Gavel,
  Banknote,
  Coins,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

const navItems: readonly NavItem[] = [
  { to: "/", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/equipe", label: "Equipe", icon: Users },
  { to: "/ausencias", label: "Ausencias", icon: CalendarX },
  { to: "/calendario", label: "Calendario Institucional", icon: CalendarDays },
  { to: "/plantao", label: "Plantao Judicial", icon: Briefcase },
  { to: "/expedientes", label: "Expedientes", icon: ScrollText },
  { to: "/ppl", label: "PPL e Medidas Cautelares", icon: Gavel },
  { to: "/sisbajud", label: "SISBAJUD", icon: Banknote },
  { to: "/depositos", label: "Depositos e Recolhimentos", icon: Coins },
  { to: "/estatisticas", label: "Estatisticas e Metas", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex h-screen w-64 flex-col bg-sentinela-ink text-slate-100 sticky top-0">
      <div className="px-6 py-5 border-b border-slate-700">
        <p className="text-xs uppercase tracking-wider text-slate-400">Plataforma</p>
        <h1 className="text-lg font-semibold text-sentinela-gold">Sentinela 2026</h1>
      </div>
      <nav aria-label="Navegacao principal" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-slate-800 text-sentinela-gold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
