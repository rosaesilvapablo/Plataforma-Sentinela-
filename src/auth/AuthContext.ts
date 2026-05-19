import { createContext } from "react";
import type { User } from "firebase/auth";
import type { Role } from "@/domain/roles";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  role: Role | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  refreshClaims: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
