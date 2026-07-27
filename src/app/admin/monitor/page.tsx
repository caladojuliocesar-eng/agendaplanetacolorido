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
  
  // State for silent monitoring chat
  const [selectedChatRecord, setSelectedChatRecord] = useState<DailyRecord | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  
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
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                <tr>
                  <th style={{ padding: "16px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Aluno</th>
                  <th style={{ padding: "16px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", textAlign: "center" }}>Frutas</th>
                  <th style={{ padding: "16px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", textAlign: "center" }}>Almoço</th>
                  <th style={{ padding: "16px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", textAlign: "center" }}>Lanche</th>
                  <th style={{ padding: "16px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", textAlign: "center" }}>Jantar</th>
                  <th style={{ padding: "16px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", textAlign: "center" }}>Sono/Xixi/Cocô</th>
                  <th style={{ padding: "16px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", textAlign: "center" }}>Mensagens</th>
                  <th style={{ padding: "16px" }}></th>
                </tr>
              </thead>
              <tbody>
                {alunosNaTurma.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>
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
                            <span 
                              onClick={() => {
                                if (record) {
                                  setSelectedChatRecord(record);
                                  setSelectedStudentName(aluno.nome);
                                }
                              }}
                              style={{ 
                                background: "#FEE2E2", color: "#EF4444", 
                                padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-block"
                              }}
                              title="Clique para ver mensagens silenciosamente"
                            >
                              PENDENTE
                            </span>
                          ) : (record?.mensagensPais && record.mensagensPais.length > 0) ? (
                            <span 
                              onClick={() => {
                                if (record) {
                                  setSelectedChatRecord(record);
                                  setSelectedStudentName(aluno.nome);
                                }
                              }}
                              style={{ 
                                background: "#D1FAE5", color: "#10B981", 
                                padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-block"
                              }}
                              title="Clique para ver mensagens silenciosamente"
                            >
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

      {/* Silent Chat Monitor Modal */}
      {selectedChatRecord && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            width: "100%",
            maxWidth: 500,
            padding: 0,
            background: "white",
            borderRadius: 24,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "85vh"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "#F8FAFC",
              borderBottom: "1px solid #E2E8F0",
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1E293B" }}>
                  Conversa de {selectedStudentName}
                </h3>
                <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                  Modo Monitoramento Silencioso
                </span>
              </div>
              <button 
                onClick={() => { setSelectedChatRecord(null); setSelectedStudentName(""); }} 
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ✕
              </button>
            </div>

            {/* Chat Thread */}
            <div style={{
              padding: 24,
              overflowY: "auto",
              flex: 1,
              background: "#FFFBF7",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              minHeight: 250
            }}>
              {(() => {
                const combined = [
                  ...(selectedChatRecord.mensagensPais || []).map(m => ({ ...m, role: 'pai' })),
                  ...(selectedChatRecord.mensagensProfessor || []).map(m => ({ ...m, role: 'professor' }))
                ].sort((a, b) => a.horario.localeCompare(b.horario));

                if (combined.length === 0 && selectedChatRecord.recadoPais) {
                  combined.push({
                    id: "legacy",
                    texto: selectedChatRecord.recadoPais,
                    horario: "",
                    lida: true,
                    role: 'pai'
                  });
                }

                if (combined.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 14 }}>
                      Nenhuma mensagem trocada hoje.
                    </div>
                  );
                }

                return combined.map((msg, idx) => {
                  const isPai = msg.role === 'pai';
                  return (
                    <div 
                      key={msg.id || idx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isPai ? "flex-start" : "flex-end",
                        maxWidth: "85%",
                        alignSelf: isPai ? "flex-start" : "flex-end"
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 4, paddingLeft: 4, paddingRight: 4 }}>
                        {isPai ? "RESPONSÁVEL" : "PROFESSOR(A)"}
                      </span>
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: isPai ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
                        background: isPai ? "white" : "var(--primary-light)",
                        color: isPai ? "#334155" : "var(--primary-dark)",
                        border: isPai ? "1px solid #E2E8F0" : "1px solid var(--primary)",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        fontSize: 14,
                        lineHeight: 1.5,
                        wordBreak: "break-word"
                      }}>
                        {msg.texto}
                      </div>
                      <span style={{ fontSize: 9, color: "#94A3B8", marginTop: 4, paddingLeft: 4, paddingRight: 4 }}>
                        {msg.horario} {msg.role === 'pai' && (msg.lida ? "✓ Lida" : "✓ Recebida")}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Warning Footer */}
            <div style={{
              background: "#F8FAFC",
              borderTop: "1px solid #E2E8F0",
              padding: "16px 24px",
              textAlign: "center"
            }}>
              <p style={{ margin: 0, fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>
                ⚠️ <strong>Aviso da Coordenação:</strong> A visualização neste painel é apenas para acompanhamento. Para responder aos pais, acesse a agenda do aluno ou fale com o professor da turma.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
