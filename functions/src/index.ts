/**
 * Cloud Functions — Plataforma Sentinela 2026
 *
 * Modulo Admin → Usuarios:
 *  - createNewUser: cria conta + claim de role + access_list (com rollback)
 *  - setUserRole: atualiza role (guard anti auto-lockout)
 *  - disableUser: desativa conta (guard anti auto-lockout)
 *  - enableUser: reativa conta
 *
 * Todas as callables usam Firebase Functions v2 (Cloud Functions 2nd gen).
 * Acesso restrito a admin / diretor (papeis funcionalmente identicos).
 */

import { initializeApp } from "firebase-admin/app";
import { getAuth, type UserRecord } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { randomInt } from "node:crypto";

initializeApp();
const auth = getAuth();
const db = getFirestore();

// ===== Constantes e helpers =====

const VALID_ROLES = [
  "admin",
  "diretor",
  "juiz",
  "supervisor",
  "servidor",
  "estagiario",
  "terceirizado",
] as const;
type Role = (typeof VALID_ROLES)[number];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (VALID_ROLES as readonly string[]).includes(value);
}

function hasFullAccess(token: Record<string, unknown> | undefined): boolean {
  if (!token) return false;
  const role = token.role;
  return role === "admin" || role === "diretor";
}

function assertCanManageUsers(request: CallableRequest): void {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuario nao autenticado.");
  }
  if (!hasFullAccess(request.auth.token)) {
    throw new HttpsError(
      "permission-denied",
      "Apenas admin ou diretor podem gerenciar usuarios.",
    );
  }
}

function sanitizeEmail(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "Email invalido.");
  }
  return value.trim().toLowerCase();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Senha temporaria forte: 12 caracteres, mistura de 4 classes (maiusculas,
 * minusculas sem `l`, digitos sem 0/1, simbolos), embaralhada. CSPRNG.
 */
function generateTemporaryPassword(): string {
  const classes = [
    "ABCDEFGHIJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%&*?",
  ];
  const password: string[] = classes.map((c) => c[randomInt(c.length)] as string);
  while (password.length < 12) {
    const cls = classes[randomInt(classes.length)] as string;
    password.push(cls[randomInt(cls.length)] as string);
  }
  // Fisher-Yates shuffle
  for (let i = password.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = password[i] as string;
    password[i] = password[j] as string;
    password[j] = tmp;
  }
  return password.join("");
}

// ===== Callables =====

interface CreateNewUserPayload {
  email?: unknown;
  fullName?: unknown;
  role?: unknown;
}

interface CreateNewUserResult {
  uid: string;
  email: string;
  fullName: string;
  role: Role;
  temporaryPassword: string;
}

export const createNewUser = onCall<CreateNewUserPayload, Promise<CreateNewUserResult>>(
  { region: "us-central1" },
  async (request): Promise<CreateNewUserResult> => {
    assertCanManageUsers(request);
    const payload = request.data ?? {};

    const email = sanitizeEmail(payload.email);
    if (!EMAIL_REGEX.test(email)) {
      throw new HttpsError("invalid-argument", "Formato de e-mail invalido.");
    }
    if (typeof payload.fullName !== "string" || payload.fullName.trim().length < 2) {
      throw new HttpsError(
        "invalid-argument",
        "Nome completo obrigatorio (minimo 2 caracteres).",
      );
    }
    const fullName = payload.fullName.trim();
    if (!isRole(payload.role)) {
      throw new HttpsError(
        "invalid-argument",
        `Perfil invalido. Validos: ${VALID_ROLES.join(", ")}.`,
      );
    }
    const role = payload.role;

    // Checa duplicidade
    let existing: UserRecord | undefined;
    try {
      existing = await auth.getUserByEmail(email);
    } catch (err) {
      if ((err as { code?: string }).code !== "auth/user-not-found") {
        throw err;
      }
    }
    if (existing) {
      throw new HttpsError("already-exists", "Este e-mail ja esta cadastrado.");
    }

    const temporaryPassword = generateTemporaryPassword();
    const created = await auth.createUser({
      email,
      password: temporaryPassword,
      displayName: fullName,
    });

    // Compensacao: se claims ou access_list falharem, remove a conta orfa.
    try {
      await auth.setCustomUserClaims(created.uid, { role });
      await db.collection("access_list").doc(created.uid).set({
        uid: created.uid,
        email,
        fullName,
        role,
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
        createdBy: request.auth?.uid ?? null,
      });
    } catch (provisioningError) {
      try {
        await auth.deleteUser(created.uid);
      } catch (rollbackError) {
        logger.error("Falha ao reverter usuario orfao", {
          uid: created.uid,
          email,
          rollbackError,
        });
      }
      throw provisioningError;
    }

    logger.info("Usuario criado", {
      uid: created.uid,
      email,
      role,
      by: request.auth?.uid,
    });

    return {
      uid: created.uid,
      email,
      fullName,
      role,
      temporaryPassword,
    };
  },
);

interface SetUserRolePayload {
  uid?: unknown;
  role?: unknown;
}

export const setUserRole = onCall<SetUserRolePayload>(
  { region: "us-central1" },
  async (request) => {
    assertCanManageUsers(request);
    const { uid, role } = request.data ?? {};

    if (typeof uid !== "string" || !uid) {
      throw new HttpsError("invalid-argument", "UID obrigatorio.");
    }
    if (!isRole(role)) {
      throw new HttpsError(
        "invalid-argument",
        `Perfil invalido. Validos: ${VALID_ROLES.join(", ")}.`,
      );
    }

    // Anti auto-lockout: ninguem rebaixa o proprio admin/diretor.
    if (uid === request.auth?.uid && role !== "admin" && role !== "diretor") {
      throw new HttpsError(
        "failed-precondition",
        "Voce nao pode rebaixar o proprio perfil. Peca a outro admin/diretor.",
      );
    }

    await auth.setCustomUserClaims(uid, { role });
    await db.collection("access_list").doc(uid).set(
      {
        uid,
        role,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: request.auth?.uid ?? null,
      },
      { merge: true },
    );

    logger.info("Perfil atualizado", { uid, role, by: request.auth?.uid });

    return { uid, role };
  },
);

interface DisableUserPayload {
  uid?: unknown;
}

export const disableUser = onCall<DisableUserPayload>(
  { region: "us-central1" },
  async (request) => {
    assertCanManageUsers(request);
    const { uid } = request.data ?? {};
    if (typeof uid !== "string" || !uid) {
      throw new HttpsError("invalid-argument", "UID obrigatorio.");
    }

    if (uid === request.auth?.uid) {
      throw new HttpsError(
        "failed-precondition",
        "Voce nao pode desativar a propria conta.",
      );
    }

    await auth.updateUser(uid, { disabled: true });
    await db.collection("access_list").doc(uid).set(
      {
        uid,
        status: "disabled",
        disabledAt: FieldValue.serverTimestamp(),
        disabledBy: request.auth?.uid ?? null,
      },
      { merge: true },
    );

    logger.info("Usuario desativado", { uid, by: request.auth?.uid });

    return { uid, status: "disabled" as const };
  },
);

interface EnableUserPayload {
  uid?: unknown;
}

export const enableUser = onCall<EnableUserPayload>(
  { region: "us-central1" },
  async (request) => {
    assertCanManageUsers(request);
    const { uid } = request.data ?? {};
    if (typeof uid !== "string" || !uid) {
      throw new HttpsError("invalid-argument", "UID obrigatorio.");
    }

    await auth.updateUser(uid, { disabled: false });
    await db.collection("access_list").doc(uid).set(
      {
        uid,
        status: "active",
        enabledAt: FieldValue.serverTimestamp(),
        enabledBy: request.auth?.uid ?? null,
      },
      { merge: true },
    );

    logger.info("Usuario reativado", { uid, by: request.auth?.uid });

    return { uid, status: "active" as const };
  },
);
