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
  statusTestemunhaSchema,
  type Testemunha,
  type TestemunhaForm,
} from "@/domain/testemunha";

const COLLECTION = "protected_witnesses";

function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function dateStringToTimestamp(s: string): Timestamp | null {
  if (!s) return null;
  return Timestamp.fromDate(new Date(`${s}T12:00:00`));
}

function map(docId: string, data: DocumentData): Testemunha | null {
  const st = statusTestemunhaSchema.safeParse(data.status);
  if (!st.success) return null;
  if (typeof data.codigo !== "string" || typeof data.processo !== "string") return null;
  if (typeof data.quantidadePessoas !== "number" || !Number.isInteger(data.quantidadePessoas)) {
    return null;
  }
  if (!(data.dataInclusao instanceof Timestamp)) return null;
  return {
    id: docId,
    codigo: data.codigo,
    processo: data.processo,
    quantidadePessoas: data.quantidadePessoas,
    inProvita: data.inProvita === true,
    dataInclusaoProvita:
      data.dataInclusaoProvita instanceof Timestamp
        ? data.dataInclusaoProvita.toDate()
        : null,
    status: st.data,
    dataInclusao: data.dataInclusao.toDate(),
    dataEncerramento:
      data.dataEncerramento instanceof Timestamp ? data.dataEncerramento.toDate() : null,
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToTestemunhas(
  onChange: (rows: Testemunha[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COLLECTION), orderBy("dataInclusao", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: Testemunha[] = [];
      snap.forEach((d) => {
        const r = map(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

function payload(input: TestemunhaForm) {
  return {
    codigo: input.codigo.trim(),
    processo: input.processo.trim(),
    quantidadePessoas: input.quantidadePessoas,
    inProvita: input.inProvita,
    dataInclusaoProvita: input.inProvita
      ? dateStringToTimestamp(input.dataInclusaoProvita)
      : null,
    status: input.status,
    dataInclusao: dateStringToTimestamp(input.dataInclusao),
    dataEncerramento: dateStringToTimestamp(input.dataEncerramento),
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  };
}

export async function createTestemunha(input: TestemunhaForm): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, { ...payload(input), createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateTestemunha(id: string, input: TestemunhaForm): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), payload(input));
}

export async function deleteTestemunha(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
