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
import { tipoBoletimSchema, type Boletim, type BoletimForm } from "@/domain/estatisticas";

const COLLECTION = "boletins_estatisticos";

function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function map(docId: string, data: DocumentData): Boletim | null {
  const tipo = tipoBoletimSchema.safeParse(data.tipo);
  if (!tipo.success) return null;
  if (typeof data.periodo !== "string") return null;
  if (typeof data.indicadores !== "object" || data.indicadores === null) return null;
  const indicadores: Record<string, number> = {};
  for (const [k, v] of Object.entries(data.indicadores as Record<string, unknown>)) {
    if (typeof v === "number") indicadores[k] = v;
  }
  return {
    id: docId,
    periodo: data.periodo,
    tipo: tipo.data,
    indicadores,
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToBoletins(
  onChange: (rows: Boletim[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COLLECTION), orderBy("periodo", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: Boletim[] = [];
      snap.forEach((d) => {
        const r = map(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

function payload(input: BoletimForm) {
  return {
    periodo: input.periodo,
    tipo: input.tipo,
    indicadores: input.indicadores,
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  };
}

export async function createBoletim(input: BoletimForm): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, { ...payload(input), createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateBoletim(id: string, input: BoletimForm): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), payload(input));
}

export async function deleteBoletim(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
