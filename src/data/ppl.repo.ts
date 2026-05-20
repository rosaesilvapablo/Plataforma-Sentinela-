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
  tipoPrisaoSchema,
  calcularProximaRevisao,
  type Ppl,
  type PplForm,
} from "@/domain/ppl";

const COLLECTION = "ppl";

function emptyToNull(value: string): string | null {
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function dateStringToTimestamp(s: string): Timestamp {
  return Timestamp.fromDate(new Date(`${s}T12:00:00`));
}

function mapPpl(docId: string, data: DocumentData): Ppl | null {
  const tipo = tipoPrisaoSchema.safeParse(data.tipoPrisao);
  if (!tipo.success) return null;
  if (typeof data.nome !== "string" || typeof data.processo !== "string") return null;
  if (!(data.dataPrisao instanceof Timestamp)) return null;
  return {
    id: docId,
    nome: data.nome,
    cpf: typeof data.cpf === "string" && data.cpf.length > 0 ? data.cpf : null,
    rg: typeof data.rg === "string" && data.rg.length > 0 ? data.rg : null,
    processo: data.processo,
    tipoPrisao: tipo.data,
    dataPrisao: data.dataPrisao.toDate(),
    ultimaRevisao:
      data.ultimaRevisao instanceof Timestamp ? data.ultimaRevisao.toDate() : null,
    proximaRevisao:
      data.proximaRevisao instanceof Timestamp ? data.proximaRevisao.toDate() : null,
    unidade: typeof data.unidade === "string" && data.unidade.length > 0 ? data.unidade : null,
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToPpl(
  onChange: (rows: Ppl[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COLLECTION), orderBy("nome"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: Ppl[] = [];
      snap.forEach((d) => {
        const r = mapPpl(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

function payload(input: PplForm) {
  const dataPrisao = dateStringToTimestamp(input.dataPrisao);
  const ultimaRevisao = input.ultimaRevisao
    ? dateStringToTimestamp(input.ultimaRevisao)
    : null;
  const proximaRevisaoDate = calcularProximaRevisao(
    input.tipoPrisao,
    dataPrisao.toDate(),
    ultimaRevisao ? ultimaRevisao.toDate() : null,
  );
  return {
    nome: input.nome.trim(),
    cpf: emptyToNull(input.cpf),
    rg: emptyToNull(input.rg),
    processo: input.processo.trim(),
    tipoPrisao: input.tipoPrisao,
    dataPrisao,
    ultimaRevisao,
    proximaRevisao: proximaRevisaoDate ? Timestamp.fromDate(proximaRevisaoDate) : null,
    unidade: emptyToNull(input.unidade),
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  };
}

export async function createPpl(input: PplForm): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, { ...payload(input), createdAt: serverTimestamp() });
  return ref.id;
}

export async function updatePpl(id: string, input: PplForm): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), payload(input));
}

export async function deletePpl(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
