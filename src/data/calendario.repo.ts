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
  calendarioCategoriaSchema,
  type CalendarEvent,
  type CalendarEventForm,
} from "@/domain/calendario";

const COLLECTION = "calendar_events";

function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function ds(s: string): Timestamp {
  return Timestamp.fromDate(new Date(`${s}T12:00:00`));
}

function map(docId: string, data: DocumentData): CalendarEvent | null {
  const cat = calendarioCategoriaSchema.safeParse(data.categoria);
  if (!cat.success) return null;
  if (typeof data.titulo !== "string") return null;
  if (!(data.data instanceof Timestamp)) return null;
  return {
    id: docId,
    titulo: data.titulo,
    categoria: cat.data,
    data: data.data.toDate(),
    observacoes:
      typeof data.observacoes === "string" && data.observacoes.length > 0
        ? data.observacoes
        : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
  };
}

export function subscribeToCalendarEvents(
  onChange: (rows: CalendarEvent[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COLLECTION), orderBy("data", "asc"));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const rows: CalendarEvent[] = [];
      snap.forEach((d) => {
        const r = map(d.id, d.data());
        if (r) rows.push(r);
      });
      onChange(rows);
    },
    (err) => onError?.(err),
  );
}

function payload(input: CalendarEventForm) {
  return {
    titulo: input.titulo.trim(),
    categoria: input.categoria,
    data: ds(input.data),
    observacoes: emptyToNull(input.observacoes),
    updatedAt: serverTimestamp(),
  };
}

export async function createCalendarEvent(input: CalendarEventForm): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, { ...payload(input), createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateCalendarEvent(
  id: string,
  input: CalendarEventForm,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), payload(input));
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
