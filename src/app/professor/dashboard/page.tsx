"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStudentsByTurma,
  getTurmaRecords,
  getTodayDateString,
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

  // Count unread parent messages
  const unreadCount = Array.from(records.values()).filter(
    (r) => r.recadoPais && !r.recadoLidoProfessor
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
          style={{ padding: 32, textAlign: "center" }}
        >
          <p style={{ fontSize: 48, margin: "0 0 12px" }}>🎒</p>
          <p style={{ color: "var(--text-secondary)" }}>
            Nenhum aluno cadastrado nesta turma.
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
              record?.recadoPais && !record?.recadoLidoProfessor;

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
