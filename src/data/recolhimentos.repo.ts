import {
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import { db, auth } from "@/lib/firebase";
import {
  contaGeridaSchema,
  tipoMovimentoSchema,
  type Orientacoes,
  type OrientacoesForm,
  type Movimento,
  type MovimentoForm,
} from "@/domain/recolhimentos";

const ORIENTACOES_DOC = "recolhimentos_orientacoes/main";
const MOV_COL = "contas_movimentos";

// ===== Orientacoes (doc unico) =====

export function subscribeToOrientacoes(
  onChange: (o: Orientacoes | null) => void,
  onError?: (err: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, ORIENTACOES_DOC),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      const data = snap.data();
      onChange({
        id: snap.id,
        conteudo: typeof data.conteudo === "string" ? data.conteudo : "",
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
        updatedByUid: typeof data.updatedByUid === "string" ? data.updatedByUid : null,
        updatedByName: typeof data.updatedByName === "string" ? data.updatedByName : null,
      });
    },
    (err) => onError?.(err),
  );
}

export async function fetchOrientacoes(): Promise<Orientacoes | null> {
  const snap = await getDoc(doc(db, ORIENTACOES_DOC));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    conteudo: typeof data.conteudo === "string" ? data.conteudo : "",
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
    updatedByUid: typeof data.updatedByUid === "string" ? data.updatedByUid : null,
    updatedByName: typeof data.updatedByName === "string" ? data.updatedByName : null,
  };
}

export async function saveOrientacoes(input: OrientacoesForm): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");
  await setDoc(
    doc(db, ORIENTACOES_DOC),
    {
      conteudo: input.conteudo,
      updatedAt: serverTimestamp(),
      updatedByUid: user.uid,
      updatedByName: user.displayName ?? user.email ?? "?",
    },
    { merge: true },
  );
}

// ===== Movimentos =====

function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}
function ds(s: string): Timestamp {
  return Timestamp.fromDate(new Date(`${s}T12:00:00`));
}

function mapMovimento(docId: string, data: DocumentData): Movimento | null {
  const conta = contaGeridaSchema.safeParse(data.conta);
  const tipo = tipoMovimentoSchema.safeParse(data.tipo);
  if (!conta.success || !tipo.success) return null;
  if (typeof data.valor !== "number" || !(data.data instanceof Timestamp)) return null;
  if (typeof data.descricao !== "string") return null;
  return {
    id: docId,
    conta: conta.data,
    tipo: tipo.data,
    valor: data.valor,
    data: data.data.toDate(),
    descricao: data.descricao,
    destinacao:
      typeof data.destinacao === "string" && data.destinacao.length > 0
        ? data.destinacao
        : null,
    processo:
      typeof data.processo === "string" && data.processo.length > 0 ? data.processo : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToMovimentos(
  onChange: (rows: Movimento[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, MOV_COL), orderBy("data", "desc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: Movimento[] = [];
      snap.forEach((d) => {
        const r = mapMovimento(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

function movPayload(input: MovimentoForm) {
  return {
    conta: input.conta,
    tipo: input.tipo,
    valor: input.valor,
    data: ds(input.data),
    descricao: input.descricao.trim(),
    destinacao: emptyToNull(input.destinacao),
    processo: emptyToNull(input.processo),
    updatedAt: serverTimestamp(),
  };
}

export async function createMovimento(input: MovimentoForm): Promise<string> {
  const ref = doc(collection(db, MOV_COL));
  await setDoc(ref, { ...movPayload(input), createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateMovimento(id: string, input: MovimentoForm): Promise<void> {
  await updateDoc(doc(db, MOV_COL, id), movPayload(input));
}

export async function deleteMovimento(id: string): Promise<void> {
  await deleteDoc(doc(db, MOV_COL, id));
}
