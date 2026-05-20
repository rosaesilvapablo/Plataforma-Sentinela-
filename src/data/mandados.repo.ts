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
  categoriaMandadoSchema,
  statusMandadoSchema,
  type Mandado,
  type MandadoForm,
} from "@/domain/mandados";

const COLLECTION = "mandados";

function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function dateStringToTimestamp(s: string): Timestamp {
  return Timestamp.fromDate(new Date(`${s}T12:00:00`));
}

function map(docId: string, data: DocumentData): Mandado | null {
  const cat = categoriaMandadoSchema.safeParse(data.categoria);
  const st = statusMandadoSchema.safeParse(data.status);
  if (!cat.success || !st.success) return null;
  if (typeof data.pessoa !== "string" || typeof data.processo !== "string") return null;
  return {
    id: docId,
    pessoa: data.pessoa,
    processo: data.processo,
    categoria: cat.data,
    prazo: data.prazo instanceof Timestamp ? data.prazo.toDate() : null,
    status: st.data,
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToMandados(
  onChange: (rows: Mandado[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: Mandado[] = [];
      snap.forEach((d) => {
        const r = map(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

function payload(input: MandadoForm) {
  return {
    pessoa: input.pessoa.trim(),
    processo: input.processo.trim(),
    categoria: input.categoria,
    prazo: input.prazo ? dateStringToTimestamp(input.prazo) : null,
    status: input.status,
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  };
}

export async function createMandado(input: MandadoForm): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, { ...payload(input), createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateMandado(id: string, input: MandadoForm): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), payload(input));
}

export async function deleteMandado(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
