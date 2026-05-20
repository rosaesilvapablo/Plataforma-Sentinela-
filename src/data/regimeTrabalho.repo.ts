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
import { tipoRegimeSchema, type Regime, type RegimeForm } from "@/domain/regimeTrabalho";

const COLLECTION = "regime_trabalho";

function emptyToNull(value: string): string | null {
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function dateStringToTimestamp(s: string, hour: number): Timestamp {
  return Timestamp.fromDate(new Date(`${s}T${String(hour).padStart(2, "0")}:00:00`));
}

function mapRegime(docId: string, data: DocumentData): Regime | null {
  const tipo = tipoRegimeSchema.safeParse(data.tipo);
  if (!tipo.success) return null;
  if (
    typeof data.memberId !== "string" ||
    typeof data.memberNome !== "string" ||
    typeof data.processoSei !== "string"
  )
    return null;
  if (!(data.dataInicio instanceof Timestamp)) return null;
  return {
    id: docId,
    memberId: data.memberId,
    memberNome: data.memberNome,
    tipo: tipo.data,
    processoSei: data.processoSei,
    dataInicio: data.dataInicio.toDate(),
    dataFimPrevista:
      data.dataFimPrevista instanceof Timestamp ? data.dataFimPrevista.toDate() : null,
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToRegimes(
  onChange: (rows: Regime[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COLLECTION), orderBy("dataInicio", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: Regime[] = [];
      snap.forEach((d) => {
        const r = mapRegime(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

function payload(input: RegimeForm, memberNome: string) {
  return {
    memberId: input.memberId,
    memberNome,
    tipo: input.tipo,
    processoSei: input.processoSei.trim(),
    dataInicio: dateStringToTimestamp(input.dataInicio, 12),
    dataFimPrevista: input.dataFimPrevista
      ? dateStringToTimestamp(input.dataFimPrevista, 12)
      : null,
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  };
}

export async function createRegime(input: RegimeForm, memberNome: string): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, { ...payload(input, memberNome), createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateRegime(
  id: string,
  input: RegimeForm,
  memberNome: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), payload(input, memberNome));
}

export async function deleteRegime(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
