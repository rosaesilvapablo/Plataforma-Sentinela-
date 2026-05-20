import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  KanbanSquare,
  CalendarDays,
  Gavel,
  ScrollText,
  Banknote,
  Wallet,
  BarChart3,
  Target,
  Users,
  Settings,
} from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { hasAnyRole, type Role } from "@/domain/roles";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  /** Se definido, o item so aparece para perfis listados (admin/diretor sempre veem). */
  requiredRoles?: readonly Role[];
};

const navItems: readonly NavItem[] = [
  { to: "/", label: "Sala de Situacao", icon: LayoutDashboard, end: true },
  { to: "/mesa", label: "Mesa de Trabalho", icon: KanbanSquare },
  {
    to: "/calendario",
    label: "Calendario",
    icon: CalendarDays,
    requiredRoles: ["admin", "diretor"],
  },
  { to: "/ppl", label: "PPL Criminal", icon: Gavel },
  { to: "/expedientes", label: "Expedientes", icon: ScrollText },
  { to: "/sisbajud", label: "SISBAJUD & Depositos", icon: Banknote },
  { to: "/recolhimentos", label: "Recolhimentos & Gestao", icon: Wallet },
  {
    to: "/estatisticas",
    label: "Estatisticas",
    icon: BarChart3,
    requiredRoles: ["admin", "diretor", "juiz"],
  },
  {
    to: "/metas",
    label: "Metas CNJ",
    icon: Target,
    requiredRoles: ["admin", "diretor", "juiz"],
  },
  { to: "/equipe", label: "Equipe", icon: Users },
  {
    to: "/admin",
    label: "Admin",
    icon: Settings,
    requiredRoles: ["admin", "diretor"],
  },
];

export function Sidebar() {
  const { role } = useAuth();
  const visible = navItems.filter(
    (item) => !item.requiredRoles || hasAnyRole(role, item.requiredRoles),
  );

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col bg-sentinela-ink text-slate-100 sticky top-0">
      <div className="px-6 py-5 border-b border-slate-700">
        <p className="text-xs uppercase tracking-wider text-slate-400">Plataforma</p>
        <h1 className="text-lg font-semibold text-sentinela-gold">Sentinela 2026</h1>
      </div>
      <nav aria-label="Navegacao principal" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {visible.map((item) => (
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
