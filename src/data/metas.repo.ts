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
import { type MetaEvolucao, type MetaForm } from "@/domain/metas";

const COLLECTION = "metas_cnj_evolucao";

function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function map(docId: string, data: DocumentData): MetaEvolucao | null {
  if (
    typeof data.codigo !== "string" ||
    typeof data.descricao !== "string" ||
    typeof data.periodo !== "string"
  )
    return null;
  if (typeof data.percentual !== "number") return null;
  return {
    id: docId,
    codigo: data.codigo,
    descricao: data.descricao,
    periodo: data.periodo,
    percentual: data.percentual,
    valorAlvo: typeof data.valorAlvo === "number" ? data.valorAlvo : null,
    valorAlcancado:
      typeof data.valorAlcancado === "number" ? data.valorAlcancado : null,
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToMetas(
  onChange: (rows: MetaEvolucao[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COLLECTION), orderBy("periodo", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: MetaEvolucao[] = [];
      snap.forEach((d) => {
        const r = map(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

function payload(input: MetaForm) {
  return {
    codigo: input.codigo.trim(),
    descricao: input.descricao.trim(),
    periodo: input.periodo,
    percentual: input.percentual,
    valorAlvo: input.valorAlvo,
    valorAlcancado: input.valorAlcancado,
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  };
}

export async function createMeta(input: MetaForm): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, { ...payload(input), createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateMeta(id: string, input: MetaForm): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), payload(input));
}

export async function deleteMeta(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
