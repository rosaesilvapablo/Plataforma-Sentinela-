import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, KeyRound, UserCircle2, ChevronDown } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { ROLE_LABELS } from "@/domain/roles";

export function Topbar() {
  const { user, role, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm text-slate-500">
        {role ? ROLE_LABELS[role] : "Sem perfil definido"}
      </div>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <UserCircle2 className="h-5 w-5 text-slate-500" />
          <span className="text-sm">{user?.displayName || user?.email || "Usuario"}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-56 rounded-md border border-slate-200 bg-white p-1 shadow-lg z-30"
          >
            <Link
              to="/conta/senha"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-slate-100"
            >
              <KeyRound className="h-4 w-4" /> Trocar senha
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
