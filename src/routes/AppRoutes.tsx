import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { ChangePasswordPage } from "@/features/auth/ChangePasswordPage";
import { DashboardHome } from "@/features/dashboard/DashboardHome";
import { AdminPage } from "@/features/admin/AdminPage";
import { EquipePage } from "@/features/equipe/EquipePage";
import { PplPage } from "@/features/ppl/PplPage";
import { ExpedientesPage } from "@/features/expedientes/ExpedientesPage";
import { MesaTrabalhoPage } from "@/features/mesa/MesaTrabalhoPage";
import { SisbajudPage } from "@/features/sisbajud/SisbajudPage";
import { RecolhimentosPage } from "@/features/recolhimentos/RecolhimentosPage";
import { EstatisticasPage } from "@/features/estatisticas/EstatisticasPage";
import {
  CalendarioPage,
  MetasCnjPage,
} from "@/features/placeholders";
import { RequireAuth } from "@/auth/RequireAuth";
import { RequireRole } from "@/auth/RequireRole";
import { AppShell } from "@/components/layout/AppShell";

function ProtectedShell() {
  return (
    <RequireAuth>
      <AppShell>
        <Outlet />
      </AppShell>
    </RequireAuth>
  );
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Publicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/conta/recuperar" element={<ForgotPasswordPage />} />

        {/* Protegidas */}
        <Route element={<ProtectedShell />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/mesa" element={<MesaTrabalhoPage />} />
          <Route
            path="/calendario"
            element={
              <RequireRole roles={["admin", "diretor"]}>
                <CalendarioPage />
              </RequireRole>
            }
          />
          <Route path="/ppl" element={<PplPage />} />
          <Route path="/expedientes" element={<ExpedientesPage />} />
          <Route path="/sisbajud" element={<SisbajudPage />} />
          <Route path="/recolhimentos" element={<RecolhimentosPage />} />
          <Route
            path="/estatisticas"
            element={
              <RequireRole roles={["admin", "diretor", "juiz"]}>
                <EstatisticasPage />
              </RequireRole>
            }
          />
          <Route
            path="/metas"
            element={
              <RequireRole roles={["admin", "diretor", "juiz"]}>
                <MetasCnjPage />
              </RequireRole>
            }
          />
          <Route path="/equipe" element={<EquipePage />} />
          <Route
            path="/admin"
            element={
              <RequireRole roles={["admin", "diretor"]}>
                <AdminPage />
              </RequireRole>
            }
          />
          <Route path="/conta/senha" element={<ChangePasswordPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
