"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStudentsByTurma,
  getTurmaRecords,
  getTodayDateString,
  getPendingParentMessages,
  markParentMessageRead,
} from "@/lib/firestore";
import { Student, DailyRecord } from "@/types";

// Generate a consistent color from a string
function stringToColor(str: string): string {
  const colors = [
    "#6366F1", "#8B5CF6", "#EC4899", "#F43F5E",
    "#F59E0B", "#10B981", "#06B6D4", "#3B82F6",
    "#A855F7", "#14B8A6", "#F97316", "#84CC16",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Map<string, DailyRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [pendingRecords, setPendingRecords] = useState<DailyRecord[]>([]);

  const today = getTodayDateString();

  useEffect(() => {
    if (!profile?.escolaId || !profile?.turma) return;

    async function loadData() {
      setLoading(true);
      try {
        const [studentList, recordList] = await Promise.all([
          getStudentsByTurma(profile!.escolaId, profile!.turma!),
          getTurmaRecords(profile!.escolaId, profile!.turma!, today),
        ]);

        setStudents(studentList.sort((a, b) => a.nome.localeCompare(b.nome)));

        const recordMap = new Map<string, DailyRecord>();
        recordList.forEach((r) => recordMap.set(r.alunoId, r));
        setRecords(recordMap);

        // Load all pending messages (unread parent messages from any date)
        const pending = await getPendingParentMessages(profile!.escolaId, profile!.turma!);
        setPendingRecords(pending);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      }
      setLoading(false);
    }

    loadData();
  }, [profile, today]);

  const toggleStudentSelection = (id: string) => {
    if (!selectMode) {
      // Single click: go to individual record
      router.push(`/professor/registro/${id}`);
      return;
    }
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedStudents(newSet);
  };

  const selectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map((s) => s.id)));
    }
  };

  const goToBatchRecord = () => {
    if (selectedStudents.size === 0) return;
    const ids = Array.from(selectedStudents).join(",");
    router.push(`/professor/registro-turma?ids=${ids}`);
  };

  const handleMarkAsRead = async (recordId: string) => {
    try {
      await markParentMessageRead(recordId);
      // Update local state to remove the message
      setPendingRecords(prev => prev.filter(r => r.id !== recordId));
      
      // Update the records map if it contains this record (to remove the icon on the avatar)
      const updatedRecords = new Map(records);
      for (const [alunoId, rec] of updatedRecords.entries()) {
        if (rec.id === recordId) {
          updatedRecords.set(alunoId, { ...rec, recadoLidoProfessor: true });
        }
      }
      setRecords(updatedRecords);
    } catch (err) {
      console.error("Error marking message as read:", err);
      alert("Erro ao marcar como lido.");
    }
  };

  // Count unread parent messages
  const unreadCount = Array.from(records.values()).filter(
    (r) => 
      (r.recadoPais && !r.recadoLidoProfessor) || 
      (r.mensagensPais && r.mensagensPais.some(m => !m.lida))
  ).length;

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 0",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div className="spinner" />
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Carregando turma...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Date & Actions Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, margin: 0 }}>Hoje</h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        {unreadCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "var(--danger-light)",
              borderRadius: "var(--radius-full)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--danger)",
            }}
          >
            💬 <span className="badge">{unreadCount}</span> recado
            {unreadCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Pending Messages Alert */}
      {pendingRecords.length > 0 && (
        <div
          className="card"
          style={{
            padding: "16px 20px",
            marginBottom: 20,
            background: "var(--accent-light)",
            borderLeft: "4px solid var(--accent)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>📩</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "var(--accent-dark)", fontSize: 14 }}>
                Recados pendentes dos pais
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                Você tem {pendingRecords.length} mensagem(ns) não lida(s).
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingRecords.map((rec) => {
              const student = students.find(s => s.id === rec.alunoId);
              // Handle both old string format and new array format
              const messages = rec.mensagensPais || (rec.recadoPais ? [{ id: "legacy", texto: rec.recadoPais, horario: "", lida: false }] : []);
              const unreadMessages = messages.filter(m => !m.lida);

              if (unreadMessages.length === 0) return null;

              return (
                <div 
                  key={rec.id} 
                  style={{ 
                    background: "white", 
                    padding: "12px", 
                    borderRadius: 8, 
                    border: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                      {student?.nome || "Aluno"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {rec.data === today ? "Hoje" : rec.data}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {unreadMessages.map((msg, idx) => (
                      <p key={msg.id || idx} style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic", borderLeft: "2px solid var(--accent)", paddingLeft: 8 }}>
                        {msg.horario && <span style={{ fontSize: 10, fontStyle: "normal", fontWeight: 700, opacity: 0.6, marginRight: 4 }}>[{msg.horario}]</span>}
                        "{msg.texto}"
                      </p>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button
                      className="btn btn--secondary"
                      style={{ fontSize: 11, padding: "4px 10px", flex: 1 }}
                      onClick={() => handleMarkAsRead(rec.id)}
                    >
                      ✓ Marcar Tudo Lido
                    </button>
                    <button
                      className="btn btn--outline"
                      style={{ fontSize: 11, padding: "4px 10px", flex: 1 }}
                      onClick={() => router.push(`/professor/registro/${rec.alunoId}`)}
                    >
                      Ir para Ficha
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-select toggle */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <button
          className={`btn ${selectMode ? "btn--primary" : "btn--secondary"}`}
          style={{ fontSize: 14, padding: "10px 16px" }}
          onClick={() => {
            setSelectMode(!selectMode);
            setSelectedStudents(new Set());
          }}
        >
          {selectMode ? "✓ Modo Seleção" : "☐ Selecionar Vários"}
        </button>

        {selectMode && (
          <>
            <button
              className="btn btn--secondary"
              style={{ fontSize: 14, padding: "10px 16px" }}
              onClick={selectAll}
            >
              {selectedStudents.size === students.length
                ? "Desmarcar Todos"
                : "Todos"}
            </button>
            {selectedStudents.size > 0 && (
              <button
                className="btn btn--primary"
                style={{ fontSize: 14, padding: "10px 16px" }}
                onClick={goToBatchRecord}
              >
                Preencher ({selectedStudents.size})
              </button>
            )}
          </>
        )}
      </div>

      {/* Student Grid */}
      {students.length === 0 ? (
        <div
          className="card"
          style={{ padding: 32, textAlign: "center", border: "2px dashed var(--border)" }}
        >
          <p style={{ fontSize: 48, margin: "0 0 12px" }}>🔍</p>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>Nenhum aluno encontrado</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Não encontramos alunos cadastrados para:<br/>
            <strong>Turma:</strong> {profile?.turma || "Não definida"}<br/>
            <strong>Escola:</strong> {profile?.escolaId || "Não definida"}
          </p>
          <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
            Verifique se os nomes coincidem exatamente no Firestore (letras maiúsculas, espaços, etc).
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
            gap: 12,
          }}
        >
          {students.map((student) => {
            const record = records.get(student.id);
            const hasRecord = !!record;
            const hasUnreadMessage =
              (record?.recadoPais && !record?.recadoLidoProfessor) ||
              (record?.mensagensPais && record?.mensagensPais.some(m => !m.lida));

            return (
              <div
                key={student.id}
                className="student-avatar"
                data-selected={selectedStudents.has(student.id) ? "true" : "false"}
                onClick={() => toggleStudentSelection(student.id)}
              >
                <div
                  className="student-avatar__circle"
                  style={{
                    background: stringToColor(student.nome),
                    position: "relative",
                  }}
                >
                  {getInitials(student.nome)}
                  {hasRecord && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: -2,
                        right: -2,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "var(--success)",
                        border: "2px solid white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "white",
                      }}
                    >
                      ✓
                    </div>
                  )}
                  {hasUnreadMessage && (
                    <div
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "var(--danger)",
                        border: "2px solid white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                      }}
                    >
                      💬
                    </div>
                  )}
                </div>
                <span className="student-avatar__name">{student.nome}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
