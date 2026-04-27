import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  DailyRecord,
  Student,
  DEFAULT_FEEDING,
  DEFAULT_ACTIVITIES,
} from "@/types";

// ============================================
// Students
// ============================================

export async function getStudentsByTurma(
  escolaId: string,
  turma: string
): Promise<Student[]> {
  const q = query(
    collection(db(), "alunos"),
    where("escolaId", "==", escolaId),
    where("turma", "==", turma)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
}

export async function getStudentsByParent(
  filhoIds: string[]
): Promise<Student[]> {
  if (!filhoIds.length) return [];
  const students: Student[] = [];
  for (const id of filhoIds) {
    const snap = await getDoc(doc(db(), "alunos", id));
    if (snap.exists()) {
      students.push({ id: snap.id, ...snap.data() } as Student);
    }
  }
  return students;
}

// ============================================
// Daily Records
// ============================================

function buildRecordId(alunoId: string, data: string): string {
  return `${alunoId}_${data}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export async function getDailyRecord(
  alunoId: string,
  data: string
): Promise<DailyRecord | null> {
  const id = buildRecordId(alunoId, data);
  const snap = await getDoc(doc(db(), "registros_diarios", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as DailyRecord;
}

export async function saveDailyRecord(
  record: Omit<DailyRecord, "id" | "criadoEm" | "atualizadoEm">
): Promise<string> {
  const id = buildRecordId(record.alunoId, record.data);
  const now = new Date().toISOString();
  const existing = await getDoc(doc(db(), "registros_diarios", id));

  if (existing.exists()) {
    await updateDoc(doc(db(), "registros_diarios", id), {
      ...record,
      atualizadoEm: now,
    });
  } else {
    await setDoc(doc(db(), "registros_diarios", id), {
      ...record,
      criadoEm: now,
      atualizadoEm: now,
    });
  }
  return id;
}

export async function saveBatchRecords(
  alunoIds: string[],
  data: string,
  partialRecord: Partial<DailyRecord>,
  professorId: string,
  escolaId: string,
  turma: string
): Promise<void> {
  const now = new Date().toISOString();
  for (const alunoId of alunoIds) {
    const id = buildRecordId(alunoId, data);
    const existing = await getDoc(doc(db(), "registros_diarios", id));
    if (existing.exists()) {
      await updateDoc(doc(db(), "registros_diarios", id), {
        ...partialRecord,
        atualizadoEm: now,
      });
    } else {
      await setDoc(doc(db(), "registros_diarios", id), {
        alunoId, escolaId, turma, data,
        alimentacao: DEFAULT_FEEDING,
        atividades: DEFAULT_ACTIVITIES,
        atividadeTexto: "",
        observacoes: "",
        recadoPais: "",
        recadoLidoProfessor: true,
        resumoIA: null,
        lido: false,
        dataLeitura: null,
        professorId,
        ...partialRecord,
        criadoEm: now,
        atualizadoEm: now,
      });
    }
  }
}

export async function getStudentHistory(
  alunoId: string,
  days: number = 7
): Promise<DailyRecord[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const q = query(
    collection(db(), "registros_diarios"),
    where("alunoId", "==", alunoId),
    where("data", ">=", startStr),
    where("data", "<=", endStr),
    orderBy("data", "desc"),
    limit(days)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyRecord));
}

export async function getTurmaRecords(
  escolaId: string,
  turma: string,
  data: string
): Promise<DailyRecord[]> {
  const q = query(
    collection(db(), "registros_diarios"),
    where("escolaId", "==", escolaId),
    where("turma", "==", turma),
    where("data", "==", data)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyRecord));
}

export async function markParentMessageRead(recordId: string): Promise<void> {
  await updateDoc(doc(db(), "registros_diarios", recordId), {
    recadoLidoProfessor: true,
  });
}

export async function markAsReadByParent(recordId: string): Promise<void> {
  await updateDoc(doc(db(), "registros_diarios", recordId), {
    lido: true,
    dataLeitura: new Date().toISOString(),
  });
}

export async function saveParentMessage(
  recordId: string,
  message: string
): Promise<void> {
  await updateDoc(doc(db(), "registros_diarios", recordId), {
    recadoPais: message,
    recadoLidoProfessor: false,
  });
}

export async function updateAISummary(
  recordId: string,
  summary: string
): Promise<void> {
  await updateDoc(doc(db(), "registros_diarios", recordId), {
    resumoIA: summary,
  });
}
