import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { ChangePasswordPage } from "@/features/auth/ChangePasswordPage";
import { DashboardHome } from "@/features/dashboard/DashboardHome";
import {
  EquipePage,
  AusenciasPage,
  CalendarioPage,
  PlantaoPage,
  ExpedientesPage,
  PplPage,
  SisbajudPage,
  DepositosPage,
  EstatisticasPage,
} from "@/features/placeholders";
import { RequireAuth } from "@/auth/RequireAuth";
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/conta/recuperar" element={<ForgotPasswordPage />} />

        <Route element={<ProtectedShell />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/equipe" element={<EquipePage />} />
          <Route path="/ausencias" element={<AusenciasPage />} />
          <Route path="/calendario" element={<CalendarioPage />} />
          <Route path="/plantao" element={<PlantaoPage />} />
          <Route path="/expedientes" element={<ExpedientesPage />} />
          <Route path="/ppl" element={<PplPage />} />
          <Route path="/sisbajud" element={<SisbajudPage />} />
          <Route path="/depositos" element={<DepositosPage />} />
          <Route path="/estatisticas" element={<EstatisticasPage />} />
          <Route path="/conta/senha" element={<ChangePasswordPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
