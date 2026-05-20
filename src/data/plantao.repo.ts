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
import { tipoPlantaoSchema, type Plantao, type PlantaoForm } from "@/domain/plantao";

const COLLECTION = "plantoes";

function emptyToNull(value: string): string | null {
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function dateStringToTimestamp(s: string, hour: number): Timestamp {
  return Timestamp.fromDate(new Date(`${s}T${String(hour).padStart(2, "0")}:00:00`));
}

function mapPlantao(docId: string, data: DocumentData): Plantao | null {
  const tipo = tipoPlantaoSchema.safeParse(data.tipo);
  if (!tipo.success) return null;
  if (
    typeof data.juizId !== "string" ||
    typeof data.juizNome !== "string" ||
    typeof data.servidorId !== "string" ||
    typeof data.servidorNome !== "string"
  )
    return null;
  if (!(data.dataInicio instanceof Timestamp) || !(data.dataFim instanceof Timestamp))
    return null;
  return {
    id: docId,
    dataInicio: data.dataInicio.toDate(),
    dataFim: data.dataFim.toDate(),
    juizId: data.juizId,
    juizNome: data.juizNome,
    servidorId: data.servidorId,
    servidorNome: data.servidorNome,
    tipo: tipo.data,
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToPlantoes(
  onChange: (rows: Plantao[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COLLECTION), orderBy("dataInicio", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: Plantao[] = [];
      snap.forEach((d) => {
        const r = mapPlantao(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

export async function createPlantao(
  input: PlantaoForm,
  juizNome: string,
  servidorNome: string,
): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, {
    juizId: input.juizId,
    juizNome,
    servidorId: input.servidorId,
    servidorNome,
    tipo: input.tipo,
    dataInicio: dateStringToTimestamp(input.dataInicio, 12),
    dataFim: dateStringToTimestamp(input.dataFim, 12),
    observacoes: emptyToNull(input.observacoes),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePlantao(
  id: string,
  input: PlantaoForm,
  juizNome: string,
  servidorNome: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    juizId: input.juizId,
    juizNome,
    servidorId: input.servidorId,
    servidorNome,
    tipo: input.tipo,
    dataInicio: dateStringToTimestamp(input.dataInicio, 12),
    dataFim: dateStringToTimestamp(input.dataFim, 12),
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlantao(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
