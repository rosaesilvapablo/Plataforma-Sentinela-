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
  tipoExpedienteSchema,
  statusExpedienteSchema,
  type Expediente,
  type ExpedienteForm,
} from "@/domain/expediente";

const COLLECTION = "expedientes";

function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function ds(s: string): Timestamp | null {
  if (!s) return null;
  return Timestamp.fromDate(new Date(`${s}T12:00:00`));
}

function map(docId: string, data: DocumentData): Expediente | null {
  const tipo = tipoExpedienteSchema.safeParse(data.tipo);
  const status = statusExpedienteSchema.safeParse(data.status);
  if (!tipo.success || !status.success) return null;
  if (
    typeof data.processo !== "string" ||
    typeof data.destinatario !== "string" ||
    typeof data.assunto !== "string"
  )
    return null;
  return {
    id: docId,
    processo: data.processo,
    tipo: tipo.data,
    destinatario: data.destinatario,
    assunto: data.assunto,
    status: status.data,
    dataEmissao: data.dataEmissao instanceof Timestamp ? data.dataEmissao.toDate() : null,
    prazoDevolucao:
      data.prazoDevolucao instanceof Timestamp ? data.prazoDevolucao.toDate() : null,
    dataCumprimento:
      data.dataCumprimento instanceof Timestamp ? data.dataCumprimento.toDate() : null,
    responsavel:
      typeof data.responsavel === "string" && data.responsavel.length > 0
        ? data.responsavel
        : null,
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToExpedientes(
  onChange: (rows: Expediente[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: Expediente[] = [];
      snap.forEach((d) => {
        const r = map(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

function payload(input: ExpedienteForm) {
  return {
    processo: input.processo.trim(),
    tipo: input.tipo,
    destinatario: input.destinatario.trim(),
    assunto: input.assunto.trim(),
    status: input.status,
    dataEmissao: ds(input.dataEmissao),
    prazoDevolucao: ds(input.prazoDevolucao),
    dataCumprimento: ds(input.dataCumprimento),
    responsavel: emptyToNull(input.responsavel),
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  };
}

export async function createExpediente(input: ExpedienteForm): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, { ...payload(input), createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateExpediente(id: string, input: ExpedienteForm): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), payload(input));
}

export async function deleteExpediente(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
