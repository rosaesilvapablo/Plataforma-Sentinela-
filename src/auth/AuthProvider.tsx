import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isRole, type Role } from "@/domain/roles";
import { AuthContext, type AuthContextValue, type AuthStatus } from "@/auth/AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (next) => {
      setUser(next);
      if (next) {
        const tokenResult = await next.getIdTokenResult();
        setRole(isRole(tokenResult.claims.role) ? (tokenResult.claims.role as Role) : null);
        setStatus("authenticated");
      } else {
        setRole(null);
        setStatus("unauthenticated");
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      role,
      async signIn(email, password) {
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signOut() {
        await fbSignOut(auth);
      },
      async sendReset(email) {
        await sendPasswordResetEmail(auth, email);
      },
      async changePassword(current, next) {
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) {
          throw new Error("Usuario nao autenticado.");
        }
        const credential = EmailAuthProvider.credential(currentUser.email, current);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, next);
      },
      async refreshClaims() {
        const u = auth.currentUser;
        if (!u) return;
        await u.getIdToken(true);
        const tokenResult = await u.getIdTokenResult();
        setRole(isRole(tokenResult.claims.role) ? (tokenResult.claims.role as Role) : null);
      },
    }),
    [status, user, role],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
