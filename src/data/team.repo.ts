import {
  collection,
  doc,
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
import { db } from "@/lib/firebase";
import {
  tipoVinculoSchema,
  personStatusSchema,
  type TeamMember,
  type CreateTeamMemberForm,
  type UpdateTeamMemberForm,
} from "@/domain/team";

function mapMember(docId: string, data: DocumentData): TeamMember | null {
  const tipoVinculo = tipoVinculoSchema.safeParse(data.tipoVinculo);
  const status = personStatusSchema.safeParse(data.status);
  if (!tipoVinculo.success || !status.success) return null;
  if (typeof data.nome !== "string" || typeof data.email !== "string") return null;
  return {
    uid: docId,
    nome: data.nome,
    email: data.email,
    matricula: typeof data.matricula === "string" ? data.matricula : "",
    cargoEfetivo: typeof data.cargoEfetivo === "string" ? data.cargoEfetivo : "",
    funcaoComissionada:
      typeof data.funcaoComissionada === "string" && data.funcaoComissionada.length > 0
        ? data.funcaoComissionada
        : null,
    tipoVinculo: tipoVinculo.data,
    lotacaoParadigma:
      typeof data.lotacaoParadigma === "string" ? data.lotacaoParadigma : "",
    lotacaoAtual: typeof data.lotacaoAtual === "string" ? data.lotacaoAtual : "",
    status: status.data,
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToTeam(
  onChange: (team: TeamMember[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, "team"), orderBy("nome"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const members: TeamMember[] = [];
      snap.forEach((d) => {
        const m = mapMember(d.id, d.data());
        if (m) members.push(m);
      });
      onChange(members);
    },
    (err) => onError?.(err),
  );
}

/**
 * Cria um novo membro com docId autogerado. Campos opcionais vazios sao
 * gravados como `null` (nao string vazia) para preservar consultas.
 */
export async function createTeamMember(input: CreateTeamMemberForm): Promise<string> {
  const ref = doc(collection(db, "team"));
  const cleaned = sanitizeCreate(input);
  await setDoc(ref, {
    ...cleaned,
    status: "ativo",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTeamMember(
  uid: string,
  input: UpdateTeamMemberForm,
): Promise<void> {
  const ref = doc(db, "team", uid);
  const cleaned = sanitizeUpdate(input);
  await updateDoc(ref, {
    ...cleaned,
    updatedAt: serverTimestamp(),
  });
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeCreate(input: CreateTeamMemberForm) {
  return {
    nome: input.nome.trim(),
    email: input.email.trim().toLowerCase(),
    matricula: input.matricula.trim(),
    cargoEfetivo: input.cargoEfetivo.trim(),
    funcaoComissionada: emptyToNull(input.funcaoComissionada),
    tipoVinculo: input.tipoVinculo,
    lotacaoParadigma: input.lotacaoParadigma.trim(),
    lotacaoAtual: input.lotacaoAtual.trim(),
    observacoes: emptyToNull(input.observacoes),
  };
}

function sanitizeUpdate(input: UpdateTeamMemberForm) {
  return {
    nome: input.nome.trim(),
    email: input.email.trim().toLowerCase(),
    matricula: input.matricula.trim(),
    // cargoEfetivo NAO esta aqui — imutavel
    funcaoComissionada: emptyToNull(input.funcaoComissionada),
    tipoVinculo: input.tipoVinculo,
    lotacaoParadigma: input.lotacaoParadigma.trim(),
    lotacaoAtual: input.lotacaoAtual.trim(),
    status: input.status,
    observacoes: emptyToNull(input.observacoes),
  };
}
