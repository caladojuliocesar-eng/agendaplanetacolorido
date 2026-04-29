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
  addDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "./firebase";
import {
  DailyRecord,
  Student,
  DEFAULT_FEEDING,
  DEFAULT_ACTIVITIES,
  Aviso,
  Evento,
  UserProfile,
  Cobranca,
  CobrancaStatus,
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
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
        mensagensPais: [],
        recadoLidoProfessor: true,
        resumoIA: null,
        lido: false,
        dataLeitura: null,
        professorId,
        soninho: false,
        xixi: false,
        coco: false,
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
  const ref = doc(db(), "registros_diarios", recordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  
  const data = snap.data();
  if (data.mensagensPais && Array.isArray(data.mensagensPais)) {
    const updatedMessages = data.mensagensPais.map((m: any) => ({ ...m, lida: true }));
    await updateDoc(ref, {
      recadoLidoProfessor: true,
      mensagensPais: updatedMessages
    });
  } else {
    await updateDoc(ref, {
      recadoLidoProfessor: true,
    });
  }
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
  const newMessage = {
    id: Math.random().toString(36).substring(7),
    texto: message,
    horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    lida: false
  };

  // Use setDoc with merge to create record if it doesn't exist yet
  await setDoc(doc(db(), "registros_diarios", recordId), {
    recadoPais: message, 
    mensagensPais: arrayUnion(newMessage),
    recadoLidoProfessor: false,
  }, { merge: true });
}

export async function saveTeacherMessage(
  recordId: string,
  message: string
): Promise<void> {
  const newMessage = {
    id: Math.random().toString(36).substring(7),
    texto: message,
    horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    lida: false
  };

  await setDoc(doc(db(), "registros_diarios", recordId), {
    mensagensProfessor: arrayUnion(newMessage),
  }, { merge: true });
}

export async function updateAISummary(
  recordId: string,
  summary: string
): Promise<void> {
  await updateDoc(doc(db(), "registros_diarios", recordId), {
    resumoIA: summary,
  });
}

export async function getPendingParentMessages(
  escolaId: string,
  turma: string
): Promise<DailyRecord[]> {
  const q = query(
    collection(db(), "registros_diarios"),
    where("escolaId", "==", escolaId),
    where("turma", "==", turma),
    where("recadoLidoProfessor", "==", false)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as DailyRecord))
    .filter((r) => (r.recadoPais || (r.mensagensPais && r.mensagensPais.some(m => !m.lida))));
}

// ============================================
// Escola Info (Mural & Calendário)
// ============================================

export async function getAvisos(escolaId: string): Promise<Aviso[]> {
  const q = query(
    collection(db(), "avisos"),
    where("escolaId", "==", escolaId)
  );
  const snap = await getDocs(q);
  const avisos = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Aviso));
  return avisos.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
}

export async function saveAviso(aviso: Aviso): Promise<void> {
  await setDoc(doc(db(), "avisos", aviso.id), aviso);
}

export async function deleteAviso(avisoId: string): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db(), "avisos", avisoId));
}

export async function getEventos(escolaId: string): Promise<Evento[]> {
  const q = query(
    collection(db(), "eventos"),
    where("escolaId", "==", escolaId)
  );
  const snap = await getDocs(q);
  const eventos = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Evento));
  return eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
}

export async function saveEvento(evento: Evento): Promise<void> {
  await setDoc(doc(db(), "eventos", evento.id), evento);
}

export async function deleteEvento(eventoId: string): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db(), "eventos", eventoId));
}

// ============================================
// Admin Functions
// ============================================

export async function getAllStudents(escolaId: string): Promise<Student[]> {
  const q = query(
    collection(db(), "alunos"),
    where("escolaId", "==", escolaId)
  );
  const snap = await getDocs(q);
  const students = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
  return students.sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function getAllUsers(escolaId: string): Promise<UserProfile[]> {
  const q = query(
    collection(db(), "usuarios"),
    where("escolaId", "==", escolaId)
  );
  const snap = await getDocs(q);
  const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
  return users.sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function updateStudentTurma(studentIds: string[], novaTurma: string): Promise<void> {
  const { writeBatch } = await import("firebase/firestore");
  const batch = writeBatch(db());
  
  for (const id of studentIds) {
    const ref = doc(db(), "alunos", id);
    batch.update(ref, { turma: novaTurma });
  }
  
  await batch.commit();
}

export async function addStudent(studentData: Omit<Student, "id">): Promise<void> {
  await addDoc(collection(db(), "alunos"), {
    ...studentData,
    criadoEm: new Date().toISOString()
  });
}

export async function updateStudent(studentId: string, data: Partial<Student>): Promise<void> {
  const ref = doc(db(), "alunos", studentId);
  await updateDoc(ref, data);
}

export async function addUser(userData: Omit<UserProfile, "uid">): Promise<void> {
  await addDoc(collection(db(), "usuarios"), {
    ...userData,
    criadoEm: new Date().toISOString()
  });
}

export async function updateUser(userId: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db(), "usuarios", userId);
  await updateDoc(ref, data);
}

export async function linkParentToStudent(userId: string, studentId: string): Promise<void> {
  const ref = doc(db(), "usuarios", userId);
  await updateDoc(ref, {
    filhos: arrayUnion(studentId)
  });
}

export async function unlinkParentFromStudent(userId: string, studentId: string): Promise<void> {
  const ref = doc(db(), "usuarios", userId);
  await updateDoc(ref, {
    filhos: arrayRemove(studentId)
  });
}

// ============================================
// Financeiro
// ============================================

export async function getCobrancasByAluno(alunoId: string): Promise<Cobranca[]> {
  const q = query(
    collection(db(), "cobrancas"),
    where("alunoId", "==", alunoId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Cobranca));
}

export async function getCobrancasByEscola(escolaId: string): Promise<Cobranca[]> {
  const q = query(
    collection(db(), "cobrancas"),
    where("escolaId", "==", escolaId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Cobranca));
}

export async function createCobranca(cobranca: Omit<Cobranca, "id" | "criadoEm" | "atualizadoEm" | "visualizado">): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db(), "cobrancas"), {
    ...cobranca,
    visualizado: false,
    criadoEm: now,
    atualizadoEm: now,
  });
  return docRef.id;
}

export async function updateCobrancaStatus(id: string, status: CobrancaStatus): Promise<void> {
  await updateDoc(doc(db(), "cobrancas", id), {
    status,
    atualizadoEm: new Date().toISOString()
  });
}

export async function markCobrancaAsViewed(id: string): Promise<void> {
  await updateDoc(doc(db(), "cobrancas", id), {
    visualizado: true,
    dataVisualizacao: new Date().toISOString()
  });
}
