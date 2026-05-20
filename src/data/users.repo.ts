import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { isRole, type Role } from "@/domain/roles";
import { userStatusSchema, type AccessListUser, type UserStatus } from "@/domain/users";

function mapUser(docId: string, data: DocumentData): AccessListUser | null {
  if (!isRole(data.role)) return null;
  if (typeof data.email !== "string" || typeof data.fullName !== "string") return null;
  const parsedStatus = userStatusSchema.safeParse(data.status);
  const status: UserStatus = parsedStatus.success ? parsedStatus.data : "active";
  return {
    uid: docId,
    email: data.email,
    fullName: data.fullName,
    role: data.role,
    status,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToUsers(
  onChange: (users: AccessListUser[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, "access_list"), orderBy("fullName"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const users: AccessListUser[] = [];
      snap.forEach((d) => {
        const u = mapUser(d.id, d.data());
        if (u) users.push(u);
      });
      onChange(users);
    },
    (err) => onError?.(err),
  );
}

// ===== Callables =====

type CreateNewUserData = { email: string; fullName: string; role: Role };
type CreateNewUserResult = {
  uid: string;
  email: string;
  fullName: string;
  role: Role;
  temporaryPassword: string;
};

export async function callCreateNewUser(data: CreateNewUserData): Promise<CreateNewUserResult> {
  const fn = httpsCallable<CreateNewUserData, CreateNewUserResult>(functions, "createNewUser");
  const result = await fn(data);
  return result.data;
}

export async function callSetUserRole(uid: string, role: Role): Promise<void> {
  const fn = httpsCallable<{ uid: string; role: Role }, { uid: string; role: Role }>(
    functions,
    "setUserRole",
  );
  await fn({ uid, role });
}

export async function callDisableUser(uid: string): Promise<void> {
  const fn = httpsCallable<{ uid: string }, { uid: string; status: "disabled" }>(
    functions,
    "disableUser",
  );
  await fn({ uid });
}

export async function callEnableUser(uid: string): Promise<void> {
  const fn = httpsCallable<{ uid: string }, { uid: string; status: "active" }>(
    functions,
    "enableUser",
  );
  await fn({ uid });
}
