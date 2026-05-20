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
  situacaoSchema,
  calcularProximaRevisao,
  type Ppl,
  type PplForm,
} from "@/domain/ppl";

const COLLECTION = "ppl";

function emptyToNull(value: string): string | null {
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function dateStringToTimestamp(s: string): Timestamp | null {
  if (!s) return null;
  return Timestamp.fromDate(new Date(`${s}T12:00:00`));
}

function mapPpl(docId: string, data: DocumentData): Ppl | null {
  const tipo = tipoPrisaoSchema.safeParse(data.tipoPrisao);
  const situacao = situacaoSchema.safeParse(data.situacao);
  if (!tipo.success || !situacao.success) return null;
  if (typeof data.nome !== "string" || typeof data.processo !== "string") return null;
  return {
    id: docId,
    nome: data.nome,
    rji: typeof data.rji === "string" && data.rji.length > 0 ? data.rji : null,
    cpf: typeof data.cpf === "string" && data.cpf.length > 0 ? data.cpf : null,
    rg: typeof data.rg === "string" && data.rg.length > 0 ? data.rg : null,
    processo: data.processo,
    local: typeof data.local === "string" && data.local.length > 0 ? data.local : null,
    situacao: situacao.data,
    tipoPrisao: tipo.data,
    dataCumprimento:
      data.dataCumprimento instanceof Timestamp ? data.dataCumprimento.toDate() : null,
    ultimaRevisao:
      data.ultimaRevisao instanceof Timestamp ? data.ultimaRevisao.toDate() : null,
    proximaRevisao:
      data.proximaRevisao instanceof Timestamp ? data.proximaRevisao.toDate() : null,
    redNotice: data.redNotice === true,
    redNoticeDate:
      data.redNoticeDate instanceof Timestamp ? data.redNoticeDate.toDate() : null,
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
  const dataCumprimento = dateStringToTimestamp(input.dataCumprimento);
  const ultimaRevisao = dateStringToTimestamp(input.ultimaRevisao);
  const proximaRevisaoDate = calcularProximaRevisao(
    input.situacao,
    dataCumprimento ? dataCumprimento.toDate() : null,
    ultimaRevisao ? ultimaRevisao.toDate() : null,
  );
  return {
    nome: input.nome.trim(),
    rji: emptyToNull(input.rji),
    cpf: emptyToNull(input.cpf),
    rg: emptyToNull(input.rg),
    processo: input.processo.trim(),
    local: emptyToNull(input.local),
    situacao: input.situacao,
    tipoPrisao: input.tipoPrisao,
    dataCumprimento,
    ultimaRevisao,
    proximaRevisao: proximaRevisaoDate ? Timestamp.fromDate(proximaRevisaoDate) : null,
    redNotice: input.redNotice,
    redNoticeDate: input.redNotice ? dateStringToTimestamp(input.redNoticeDate) : null,
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

/**
 * Atalho do legado: registra revisão na data de HOJE (1 clique).
 * Recalcula proximaRevisao = hoje + 90 dias.
 */
export async function registrarRevisaoHoje(p: Ppl): Promise<void> {
  if (p.situacao !== "pessoa_presa") {
    throw new Error("Revisão Art. 316 só se aplica a Pessoa Presa.");
  }
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  const proxima = calcularProximaRevisao(p.situacao, p.dataCumprimento, hoje);
  await updateDoc(doc(db, COLLECTION, p.id), {
    ultimaRevisao: Timestamp.fromDate(hoje),
    proximaRevisao: proxima ? Timestamp.fromDate(proxima) : null,
    updatedAt: serverTimestamp(),
  });
}
