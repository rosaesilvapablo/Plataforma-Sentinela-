import {
  collection,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import {
  frequenciaTipoSchema,
  type Frequencia,
  type CreateFrequenciaForm,
  type UpdateFrequenciaForm,
} from "@/domain/frequencia";

const COLLECTION = "frequencias";

function mapFrequencia(docId: string, data: DocumentData): Frequencia | null {
  const tipo = frequenciaTipoSchema.safeParse(data.tipo);
  if (!tipo.success) return null;
  if (
    typeof data.memberId !== "string" ||
    typeof data.memberNome !== "string" ||
    typeof data.createdByUid !== "string" ||
    typeof data.createdByName !== "string"
  ) {
    return null;
  }
  if (!(data.dataInicio instanceof Timestamp) || !(data.dataFim instanceof Timestamp)) {
    return null;
  }
  return {
    id: docId,
    memberId: data.memberId,
    memberNome: data.memberNome,
    tipo: tipo.data,
    dataInicio: data.dataInicio.toDate(),
    dataFim: data.dataFim.toDate(),
    motivo:
      typeof data.motivo === "string" && data.motivo.length > 0 ? data.motivo : null,
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdByUid: data.createdByUid,
    createdByName: data.createdByName,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToFrequencias(
  onChange: (rows: Frequencia[]) => void,
  onError?: (err: Error) => void,
): () => void {
  // Ordem mais recente primeiro (dataInicio desc).
  const q = query(collection(db, COLLECTION), orderBy("dataInicio", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: Frequencia[] = [];
      snap.forEach((d) => {
        const r = mapFrequencia(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

/** Converte YYYY-MM-DD em Timestamp ao meio-dia local (evita problemas de fuso). */
function dateStringToTimestamp(dateStr: string, hour: number): Timestamp {
  return Timestamp.fromDate(new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00`));
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function currentUserSnapshot(): { uid: string; name: string } {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");
  return {
    uid: user.uid,
    name: user.displayName ?? user.email ?? "?",
  };
}

export async function createFrequencia(
  input: CreateFrequenciaForm,
  memberNome: string,
): Promise<string> {
  const ref = doc(collection(db, COLLECTION)); // docId AUTOGERADO
  const { uid, name } = currentUserSnapshot();
  await setDoc(ref, {
    memberId: input.memberId,
    memberNome,
    tipo: input.tipo,
    dataInicio: dateStringToTimestamp(input.dataInicio, 12),
    dataFim: dateStringToTimestamp(input.dataFim, 12),
    motivo: emptyToNull(input.motivo),
    observacoes: emptyToNull(input.observacoes),
    createdByUid: uid,
    createdByName: name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateFrequencia(
  id: string,
  input: UpdateFrequenciaForm,
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    tipo: input.tipo,
    dataInicio: dateStringToTimestamp(input.dataInicio, 12),
    dataFim: dateStringToTimestamp(input.dataFim, 12),
    motivo: emptyToNull(input.motivo),
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFrequencia(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
