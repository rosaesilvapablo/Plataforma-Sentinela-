import { Toaster } from "sonner";
import { AuthProvider } from "@/auth/AuthProvider";
import { AppRoutes } from "@/routes/AppRoutes";

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster richColors position="top-right" closeButton />
    </AuthProvider>
  );
}
