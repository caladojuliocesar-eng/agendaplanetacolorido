"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getAllStudents, getTurmaRecords, getTodayDateString } from "@/lib/firestore";
import { Student, DailyRecord, FEEDING_COLORS, FeedingStatus } from "@/types";
import Link from "next/link";

export default function AdminMonitorPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, DailyRecord>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  
  const today = getTodayDateString();

  useEffect(() => {
    if (!profile?.escolaId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [profile]);

  async function loadData() {
    setLoading(true);
    try {
      const allStudents = await getAllStudents(profile!.escolaId!);
      setStudents(allStudents);
      
      if (allStudents.length > 0) {
        // Auto-select first available turma
        const turmas = Array.from(new Set(allStudents.map(s => s.turma))).sort();
        if (turmas.length > 0) {
          setSelectedTurma(turmas[0]);
        }
      }
    } catch (error) {
      console.error("Error loading monitor data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Load records when selected turma changes
  useEffect(() => {
    if (!profile?.escolaId || !selectedTurma) return;
    
    async function fetchRecords() {
      try {
        const turmaRecords = await getTurmaRecords(profile!.escolaId!, selectedTurma, today);
        const recordsMap: Record<string, DailyRecord> = {};
        turmaRecords.forEach(r => {
          recordsMap[r.alunoId] = r;
        });
        setRecords(recordsMap);
      } catch (error) {
        console.error("Error loading records:", error);
      }
    }
    
    fetchRecords();
    
    // Auto refresh every 2 minutes
    const interval = setInterval(fetchRecords, 120000);
    return () => clearInterval(interval);
  }, [profile, selectedTurma, today]);

  const turmasAtuais = Array.from(new Set(students.map(s => s.turma))).sort();
  const alunosNaTurma = students.filter(s => s.turma === selectedTurma);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <header style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>Monitor de Salas</h1>
          <p style={{ color: "#64748B", margin: 0 }}>Acompanhamento em tempo real das atividades de hoje.</p>
        </div>
        
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4, textTransform: "uppercase" }}>
            Selecione a Turma
          </label>
          <select 
            className="text-input" 
            style={{ width: 200 }}
            value={selectedTurma} 
            onChange={(e) => setSelectedTurma(e.target.value)}
          >
            {turmasAtuais.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </header>

      {selectedTurma && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: 13, color: "#475569" }}>Aluno</th>
                  <th style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#475569" }}>Lanche M.</th>
                  <th style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#475569" }}>Almoço</th>
                  <th style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#475569" }}>Lanche T.</th>
                  <th style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#475569" }}>Jantar</th>
                  <th style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#475569" }}>Rotina (💤💧💩)</th>
                  <th style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#475569" }}>Recados</th>
                  <th style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#475569" }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {alunosNaTurma.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#64748B" }}>
                      Nenhum aluno nesta turma.
                    </td>
                  </tr>
                ) : (
                  alunosNaTurma.map(aluno => {
                    const record = records[aluno.id];
                    
                    const getStatusDot = (status: FeedingStatus | undefined) => {
                      if (status === undefined || status === 0) return <span style={{ color: "#CBD5E1" }}>—</span>;
                      const colorMap = { success: "#10B981", warning: "#F59E0B", danger: "#EF4444" };
                      const color = colorMap[FEEDING_COLORS[status] as keyof typeof colorMap] || "#CBD5E1";
                      return <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, margin: "0 auto" }} />;
                    };

                    const hasUnreadMessage = record && !record.recadoLidoProfessor && record.mensagensPais && record.mensagensPais.length > 0;
                    
                    return (
                      <tr key={aluno.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "16px", fontWeight: 600, color: "#1E293B" }}>
                          {aluno.nome}
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          {getStatusDot(record?.alimentacao?.frutas)}
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          {getStatusDot(record?.alimentacao?.almoco)}
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          {getStatusDot(record?.alimentacao?.lancheTarde)}
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          {getStatusDot(record?.alimentacao?.jantar)}
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <span style={{ opacity: record?.soninho ? 1 : 0.2 }}>😴</span>
                            <span style={{ opacity: record?.xixi ? 1 : 0.2 }}>💧</span>
                            <span style={{ opacity: record?.coco ? 1 : 0.2 }}>💩</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          {hasUnreadMessage ? (
                            <span style={{ 
                              background: "#FEE2E2", color: "#EF4444", 
                              padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 
                            }}>
                              PENDENTE
                            </span>
                          ) : (record?.mensagensPais && record.mensagensPais.length > 0) ? (
                            <span style={{ 
                              background: "#D1FAE5", color: "#10B981", 
                              padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 
                            }}>
                              LIDO
                            </span>
                          ) : (
                            <span style={{ color: "#CBD5E1" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <Link 
                            href={`/professor/registro/${aluno.id}`}
                            style={{
                              display: "inline-block",
                              padding: "6px 12px",
                              background: "var(--primary-light)",
                              color: "var(--primary-dark)",
                              textDecoration: "none",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600
                            }}
                          >
                            Ver Agenda
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
