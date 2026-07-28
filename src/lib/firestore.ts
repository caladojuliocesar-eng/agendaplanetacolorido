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
  UniformItem,
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

export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatDateLocal(new Date());
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
        ausente: false,
        motivoAusencia: "",
        ...partialRecord,
        criadoEm: now,
        atualizadoEm: now,
      });
    }
  }
}

export async function getStudentHistory(
  alunoId: string,
  days: number = 15
): Promise<DailyRecord[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const startStr = formatDateLocal(startDate);
  const endStr = formatDateLocal(endDate);

  // Consulta simples (não exige índice composto)
  const q = query(
    collection(db(), "registros_diarios"),
    where("alunoId", "==", alunoId)
  );
  
  const snap = await getDocs(q);
  const allRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyRecord));

  // Filtrar e ordenar na memória (mais robusto para desenvolvimento)
  return allRecords
    .filter(r => r.data >= startStr && r.data <= endStr)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, days);
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

export async function getEscolaRecordsForDate(
  escolaId: string,
  data: string
): Promise<DailyRecord[]> {
  const q = query(
    collection(db(), "registros_diarios"),
    where("escolaId", "==", escolaId),
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
  message: string,
  studentInfo?: { alunoId: string; escolaId: string; turma: string; data: string }
): Promise<void> {
  const newMessage = {
    id: Math.random().toString(36).substring(7),
    texto: message,
    horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    lida: false
  };

  const baseData = studentInfo ? {
    alunoId: studentInfo.alunoId,
    escolaId: studentInfo.escolaId,
    turma: studentInfo.turma,
    data: studentInfo.data,
    alimentacao: DEFAULT_FEEDING,
    atividades: DEFAULT_ACTIVITIES,
    atividadeTexto: "",
    observacoes: "",
    recadoLidoProfessor: false,
    resumoIA: null,
    lido: false,
    dataLeitura: null,
    soninho: false,
    xixi: false,
    coco: false,
    ausente: false,
    motivoAusencia: "",
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  } : {};

  await setDoc(doc(db(), "registros_diarios", recordId), {
    ...baseData,
    mensagensPais: arrayUnion(newMessage),
    recadoLidoProfessor: false,
  }, { merge: true });
}

export async function markAbsenceByParent(
  recordId: string,
  motivo: string,
  studentInfo: { alunoId: string; escolaId: string; turma: string; data: string }
): Promise<void> {
  const newMessage = {
    id: Math.random().toString(36).substring(7),
    texto: `Aviso de Ausência: ${motivo || "Não informado"}`,
    horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    lida: false
  };

  // Garante que o registro tenha todos os campos básicos para não travar a visão da professora
  const baseData = {
    alunoId: studentInfo.alunoId,
    escolaId: studentInfo.escolaId,
    turma: studentInfo.turma,
    data: studentInfo.data,
    alimentacao: DEFAULT_FEEDING,
    atividades: DEFAULT_ACTIVITIES,
    atividadeTexto: "",
    observacoes: "",
    recadoLidoProfessor: false,
    resumoIA: null,
    lido: false,
    dataLeitura: null,
    soninho: false,
    xixi: false,
    coco: false,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };

  await setDoc(doc(db(), "registros_diarios", recordId), {
    ...baseData,
    ausente: true,
    motivoAusencia: motivo,
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

export async function deleteUser(uid: string): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db(), "usuarios", uid));
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

export async function updateCobranca(id: string, data: Partial<Cobranca>): Promise<void> {
  await updateDoc(doc(db(), "cobrancas", id), {
    ...data,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteCobranca(id: string): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db(), "cobrancas", id));
}

export async function markCobrancaAsViewed(id: string): Promise<void> {
  await updateDoc(doc(db(), "cobrancas", id), {
    visualizado: true,
    dataVisualizacao: new Date().toISOString()
  });
}

// ============================================
// Pedagógico (Logs e Relatórios)
// ============================================

export interface LogPedagogico {
  id: string;
  alunoId: string;
  escolaId: string;
  turma: string;
  professorId: string;
  data: string;
  pilar: string;
  pilarLabel: string;
  nota: string;
  sentimento: "positivo" | "neutro" | "atencao";
  criadoEm: string;
}

export interface RelatorioPedagogico {
  id?: string;
  alunoId: string;
  escolaId: string;
  professorId: string;
  status: "rascunho_professor" | "aprovado" | "ajuste_solicitado";
  conteudo: string;
  periodo: string; // ex: "2026-T1"
  criadoEm: string;
  atualizadoEm: string;
}

export async function getLogsPedagogicos(alunoId: string): Promise<LogPedagogico[]> {
  const q = query(
    collection(db(), "logs_pedagogicos"),
    where("alunoId", "==", alunoId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as LogPedagogico))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export async function saveRelatorioPedagogico(relatorio: Omit<RelatorioPedagogico, "criadoEm" | "atualizadoEm">): Promise<void> {
  const now = new Date().toISOString();
  // Usamos um ID determinístico para facilitar a busca (aluno + periodo)
  const id = `${relatorio.alunoId}_${relatorio.periodo}`;
  const ref = doc(db(), "relatorios_pedagogicos", id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, {
      ...relatorio,
      atualizadoEm: now
    });
  } else {
    await setDoc(ref, {
      ...relatorio,
      criadoEm: now,
      atualizadoEm: now
    });
  }
}

export async function getRelatorioPedagogico(alunoId: string, periodo: string): Promise<RelatorioPedagogico | null> {
  const id = `${alunoId}_${periodo}`;
  const snap = await getDoc(doc(db(), "relatorios_pedagogicos", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as RelatorioPedagogico;
}

// ============================================
// Conversas com a Coordenação (Chat Direto)
// ============================================

export async function getCoordinationChat(alunoId: string): Promise<any | null> {
  const ref = doc(db(), "conversas_coordenacao", alunoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function saveCoordinationMessage(
  alunoId: string,
  texto: string,
  role: 'pai' | 'coordenacao',
  escolaId: string,
  nomeAluno: string
): Promise<void> {
  const ref = doc(db(), "conversas_coordenacao", alunoId);
  const snap = await getDoc(ref);
  const now = new Date().toISOString();
  const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  
  const newMessage = {
    id: Math.random().toString(36).substring(2, 9),
    texto,
    horario: `${now.split('T')[0]} ${timeStr}`,
    role,
    lida: false
  };

  if (snap.exists()) {
    await updateDoc(ref, {
      mensagens: arrayUnion(newMessage),
      ultimaMensagemEm: now,
      lidaCoordenacao: role === 'pai' ? false : true,
      lidaPai: role === 'coordenacao' ? false : true
    });
  } else {
    await setDoc(ref, {
      alunoId,
      escolaId,
      nomeAluno,
      mensagens: [newMessage],
      ultimaMensagemEm: now,
      lidaCoordenacao: role === 'pai' ? false : true,
      lidaPai: role === 'coordenacao' ? false : true
    });
  }
}

export async function markCoordinationChatRead(alunoId: string, role: 'pai' | 'coordenacao'): Promise<void> {
  const ref = doc(db(), "conversas_coordenacao", alunoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  
  const data = snap.data();
  const messages = data.mensagens || [];
  
  // Mark messages of the opposite role as read
  const updatedMessages = messages.map((m: any) => {
    if (m.role !== role && !m.lida) {
      return { ...m, lida: true };
    }
    return m;
  });

  if (role === 'coordenacao') {
    await updateDoc(ref, {
      mensagens: updatedMessages,
      lidaCoordenacao: true
    });
  } else {
    await updateDoc(ref, {
      mensagens: updatedMessages,
      lidaPai: true
    });
  }
}

export async function getCoordinationChatsByEscola(escolaId: string): Promise<any[]> {
  const q = query(
    collection(db(), "conversas_coordenacao"),
    where("escolaId", "==", escolaId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getTurmaRecordsForMonth(escolaId: string, turma: string, yearMonth: string): Promise<DailyRecord[]> {
  const start = `${yearMonth}-01`;
  const end = `${yearMonth}-31`;
  const q = query(
    collection(db(), "registros_diarios"),
    where("escolaId", "==", escolaId),
    where("turma", "==", turma)
  );
  const snap = await getDocs(q);
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyRecord));
  return all.filter(r => r.data >= start && r.data <= end);
}

// ============================================
// Solicitações de Matrícula Externa
// ============================================

export async function createMatriculaSolicitude(data: any): Promise<void> {
  const ref = doc(collection(db(), "solicitacoes_matricula"));
  await setDoc(ref, {
    ...data,
    id: ref.id,
    status: "pendente",
    criadoEm: new Date().toISOString()
  });
}

export async function getMatriculaSolicitudes(escolaId: string): Promise<any[]> {
  const q = query(
    collection(db(), "solicitacoes_matricula"),
    where("escolaId", "==", escolaId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

export async function approveMatriculaSolicitude(solicitudeId: string, escolaId: string): Promise<void> {
  const solicRef = doc(db(), "solicitacoes_matricula", solicitudeId);
  const solicSnap = await getDoc(solicRef);
  if (!solicSnap.exists()) throw new Error("Solicitação não encontrada.");
  
  const data = solicSnap.data();
  
  // 1. Create parent profiles if CPF is provided
  const parentIds: string[] = [];
  const now = new Date().toISOString();
  
  const createParent = async (parentData: any, parentesco: string) => {
    if (!parentData?.nome || !parentData?.cpf) return null;
    const cleanCpfVal = parentData.cpf.replace(/\D/g, "");
    if (!cleanCpfVal) return null;
    
    // Check if user already exists in usuarios
    const q = query(collection(db(), "usuarios"), where("cpf", "==", cleanCpfVal));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const existingId = snap.docs[0].id;
      parentIds.push(existingId);
      return existingId;
    }
    
    const userRef = doc(collection(db(), "usuarios"));
    const userId = userRef.id;
    await setDoc(userRef, {
      nome: parentData.nome,
      email: parentData.email || "",
      cpf: cleanCpfVal,
      role: "pai",
      escolaId,
      filhos: [],
      criadoEm: now
    });
    parentIds.push(userId);
    return userId;
  };
  
  const maeId = await createParent(data.mae, "Mãe");
  const paiId = await createParent(data.pai, "Pai");
  
  // 2. Create student profile
  const studentRef = doc(collection(db(), "alunos"));
  const studentId = studentRef.id;
  
  await setDoc(studentRef, {
    id: studentId,
    nome: data.aluno.nome,
    turma: data.aluno.turma,
    escolaId,
    fotoUrl: null,
    paiIds: parentIds,
    
    // Informações Pessoais
    dataNascimento: data.aluno.dataNascimento || "",
    genero: data.aluno.genero || "",
    endereco: `${data.endereco?.rua || ""}, CEP: ${data.endereco?.cep || ""}`,
    
    // Ficha Médica
    alergias: data.saude?.alergias || "",
    medicamentosContinuos: data.saude?.medicamentoFebre ? `${data.saude.medicamentoFebre} (Dosagem: ${data.saude.dosagemFebre || ""})` : "",
    tipoSanguineo: "",
    
    // Contatos e Autorizações
    contatosEmergencia: data.contatosEmergencia || [],
    autorizadosRetirada: data.autorizados || [],
    
    criadoEm: now,
    atualizadoEm: now
  });
  
  // 3. Link parent profiles to student
  for (const parentId of parentIds) {
    const userRef = doc(db(), "usuarios", parentId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const profile = userSnap.data();
      const currentFilhos = profile.filhos || [];
      const updatedFilhos = Array.from(new Set([...currentFilhos, studentId]));
      
      const vinculo = profile.vinculoFilhos || {};
      vinculo[studentId] = {
        parentesco: parentId === maeId ? "Mãe" : "Pai",
        flags: []
      };
      
      await updateDoc(userRef, {
        filhos: updatedFilhos,
        vinculoFilhos: vinculo
      });
    }
  }
  
  // 4. Update solicitude status to approved
  await updateDoc(solicRef, {
    status: "aprovada",
    alunoCriadoId: studentId
  });
}

export async function rejectMatriculaSolicitude(solicitudeId: string): Promise<void> {
  const solicRef = doc(db(), "solicitacoes_matricula", solicitudeId);
  await updateDoc(solicRef, {
    status: "recusada"
  });
}

export async function updateMatriculaSolicitude(solicitudeId: string, data: any): Promise<void> {
  const ref = doc(db(), "solicitacoes_matricula", solicitudeId);
  await updateDoc(ref, data);
}

// ============================================
// Controle de Estoque de Uniformes
// ============================================

export async function getUniformItems(escolaId: string): Promise<UniformItem[]> {
  const q = query(
    collection(db(), "estoque_uniformes"),
    where("escolaId", "==", escolaId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as UniformItem));
}

export async function saveUniformItem(item: Omit<UniformItem, "atualizadoEm">): Promise<void> {
  const ref = doc(db(), "estoque_uniformes", item.id);
  const now = new Date().toISOString();
  await setDoc(ref, {
    ...item,
    atualizadoEm: now
  });
}

export async function sellUniformItem(
  alunoId: string,
  alunoNome: string,
  alunoTurma: string,
  itemId: string,
  quantidade: number,
  escolaId: string
): Promise<void> {
  const ref = doc(db(), "estoque_uniformes", itemId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Item de uniforme não encontrado.");
  
  const item = snap.data() as UniformItem;
  const novaQuantidade = Math.max(0, item.quantidade - quantidade);
  
  // 1. Update stock quantity
  await updateDoc(ref, {
    quantidade: novaQuantidade,
    atualizadoEm: new Date().toISOString()
  });
  
  // 2. Generate a pending Cobranca automatically
  const total = item.precoUnitario * quantidade;
  const vencimento = new Date();
  vencimento.setDate(vencimento.getDate() + 10); // 10 days default vencimento
  const vencimentoStr = vencimento.toISOString().split("T")[0];
  
  await createCobranca({
    alunoId,
    alunoNome,
    alunoTurma,
    escolaId,
    titulo: `Uniforme: ${item.nome} (${item.tamanho})`,
    valor: total,
    dataVencimento: vencimentoStr,
    status: "pendente",
    itens: [
      {
        descricao: `${item.nome} - Tam: ${item.tamanho} (x${quantidade})`,
        valor: total
      }
    ]
  });
}
