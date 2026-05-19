import type { ReactNode } from "react";
import { BrandPanel } from "@/features/auth/BrandPanel";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <BrandPanel />
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 sm:p-10 shadow-xl shadow-slate-200/60">
            {children}
          </div>
          <footer className="mt-6 text-center text-xs text-slate-400">
            <p className="font-semibold tracking-[0.15em]">
              ACESSO RESTRITO • 4ª VARA FEDERAL CRIMINAL
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} Sentinela. Todos os direitos reservados.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
