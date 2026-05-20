import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  statusSisbajudSchema,
  contaDepositoSchema,
  type SisbajudOrdem,
  type SisbajudOrdemForm,
  type Deposito,
  type DepositoForm,
} from "@/domain/sisbajud";

const ORDEM_COL = "sisbajud_ordens";
const DEP_COL = "depositos_sisbajud";

function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}
function ds(s: string): Timestamp {
  return Timestamp.fromDate(new Date(`${s}T12:00:00`));
}

// ===== Ordens =====

function mapOrdem(docId: string, data: DocumentData): SisbajudOrdem | null {
  const st = statusSisbajudSchema.safeParse(data.status);
  if (!st.success) return null;
  if (typeof data.processo !== "string" || typeof data.ordem !== "string") return null;
  if (typeof data.valor !== "number") return null;
  if (!(data.data instanceof Timestamp)) return null;
  return {
    id: docId,
    processo: data.processo,
    ordem: data.ordem,
    pessoa: typeof data.pessoa === "string" ? data.pessoa : "",
    valor: data.valor,
    status: st.data,
    data: data.data.toDate(),
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToSisbajudOrdens(
  onChange: (rows: SisbajudOrdem[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, ORDEM_COL), orderBy("data", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: SisbajudOrdem[] = [];
      snap.forEach((d) => {
        const r = mapOrdem(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

function ordemPayload(input: SisbajudOrdemForm) {
  return {
    processo: input.processo.trim(),
    ordem: input.ordem.trim(),
    pessoa: input.pessoa.trim(),
    valor: input.valor,
    status: input.status,
    data: ds(input.data),
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  };
}

export async function createSisbajudOrdem(input: SisbajudOrdemForm): Promise<string> {
  const ref = doc(collection(db, ORDEM_COL));
  await setDoc(ref, { ...ordemPayload(input), createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateSisbajudOrdem(
  id: string,
  input: SisbajudOrdemForm,
): Promise<void> {
  await updateDoc(doc(db, ORDEM_COL, id), ordemPayload(input));
}

export async function deleteSisbajudOrdem(id: string): Promise<void> {
  await deleteDoc(doc(db, ORDEM_COL, id));
}

// ===== Depositos =====

function mapDeposito(docId: string, data: DocumentData): Deposito | null {
  const conta = contaDepositoSchema.safeParse(data.conta);
  if (!conta.success) return null;
  if (typeof data.processo !== "string") return null;
  if (typeof data.valor !== "number") return null;
  if (!(data.data instanceof Timestamp)) return null;
  return {
    id: docId,
    processo: data.processo,
    conta: conta.data,
    valor: data.valor,
    data: data.data.toDate(),
    ordemSisbajudId:
      typeof data.ordemSisbajudId === "string" && data.ordemSisbajudId.length > 0
        ? data.ordemSisbajudId
        : null,
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToDepositos(
  onChange: (rows: Deposito[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, DEP_COL), orderBy("data", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: Deposito[] = [];
      snap.forEach((d) => {
        const r = mapDeposito(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

function depositoPayload(input: DepositoForm) {
  return {
    processo: input.processo.trim(),
    conta: input.conta,
    valor: input.valor,
    data: ds(input.data),
    ordemSisbajudId: emptyToNull(input.ordemSisbajudId),
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  };
}

export async function createDeposito(input: DepositoForm): Promise<string> {
  const ref = doc(collection(db, DEP_COL));
  await setDoc(ref, { ...depositoPayload(input), createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateDeposito(id: string, input: DepositoForm): Promise<void> {
  await updateDoc(doc(db, DEP_COL, id), depositoPayload(input));
}

export async function deleteDeposito(id: string): Promise<void> {
  await deleteDoc(doc(db, DEP_COL, id));
}
