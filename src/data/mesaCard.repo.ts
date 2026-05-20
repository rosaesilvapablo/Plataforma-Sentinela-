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
  mesaColumnSchema,
  type MesaCard,
  type MesaCardForm,
  type MesaColumn,
} from "@/domain/mesaCard";

const COLLECTION = "mesa_cards";

function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function ds(s: string): Timestamp | null {
  if (!s) return null;
  return Timestamp.fromDate(new Date(`${s}T12:00:00`));
}

function map(docId: string, data: DocumentData): MesaCard | null {
  const col = mesaColumnSchema.safeParse(data.column);
  if (!col.success) return null;
  if (typeof data.titulo !== "string" || typeof data.processo !== "string") return null;
  return {
    id: docId,
    titulo: data.titulo,
    processo: data.processo,
    column: col.data,
    assigneeId:
      typeof data.assigneeId === "string" && data.assigneeId.length > 0 ? data.assigneeId : null,
    assigneeNome:
      typeof data.assigneeNome === "string" && data.assigneeNome.length > 0
        ? data.assigneeNome
        : null,
    prazo: data.prazo instanceof Timestamp ? data.prazo.toDate() : null,
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToMesaCards(
  onChange: (rows: MesaCard[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: MesaCard[] = [];
      snap.forEach((d) => {
        const r = map(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

function payload(input: MesaCardForm, assigneeNome: string | null) {
  return {
    titulo: input.titulo.trim(),
    processo: input.processo.trim(),
    column: input.column,
    assigneeId: emptyToNull(input.assigneeId),
    assigneeNome,
    prazo: ds(input.prazo),
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  };
}

export async function createMesaCard(
  input: MesaCardForm,
  assigneeNome: string | null,
): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, {
    ...payload(input, assigneeNome),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMesaCard(
  id: string,
  input: MesaCardForm,
  assigneeNome: string | null,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), payload(input, assigneeNome));
}

export async function moveMesaCard(id: string, column: MesaColumn): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { column, updatedAt: serverTimestamp() });
}

export async function deleteMesaCard(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
