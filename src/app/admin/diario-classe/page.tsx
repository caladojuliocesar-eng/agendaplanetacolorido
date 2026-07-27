"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { 
  getAllStudents, 
  getTurmaRecordsForMonth 
} from "@/lib/firestore";
import { Student, DailyRecord } from "@/types";

const MESES = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const ANOS = ["2026", "2027"];

export default function AdminDiarioClassePage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection filters
  const [selectedTurma, setSelectedTurma] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("05"); // Default May (2026-05)
  const [selectedYear, setSelectedYear] = useState("2026");

  // Generated Report Data
  const [reportData, setReportData] = useState<{
    students: Student[];
    records: DailyRecord[];
    daysCount: number;
  } | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!profile?.escolaId) {
      setLoading(false);
      return;
    }
    loadStudents();
  }, [profile]);

  async function loadStudents() {
    setLoading(true);
    try {
      const data = await getAllStudents(profile!.escolaId!);
      setStudents(data);
      if (data.length > 0) {
        const turmas = Array.from(new Set(data.map(s => s.turma))).sort();
        if (turmas.length > 0) {
          setSelectedTurma(turmas[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const turmasDisponiveis = Array.from(new Set(students.map(s => s.turma))).sort();

  const handleGenerateReport = async () => {
    if (!profile?.escolaId || !selectedTurma || !selectedMonth || !selectedYear) return;
    setGenerating(true);
    try {
      const yearMonth = `${selectedYear}-${selectedMonth}`;
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      const daysCount = new Date(year, month, 0).getDate();

      // Load records of that month
      const monthRecords = await getTurmaRecordsForMonth(profile.escolaId, selectedTurma, yearMonth);
      // Filter students in this class
      const classStudents = students.filter(s => s.turma === selectedTurma).sort((a, b) => a.nome.localeCompare(b.nome));

      setReportData({
        students: classStudents,
        records: monthRecords,
        daysCount,
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar relatório.");
    } finally {
      setGenerating(false);
    }
  };

  const getDayOfWeek = (day: number) => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    return new Date(year, month - 1, day).getDay(); // 0 = Sunday, 6 = Saturday
  };

  const isWeekend = (day: number) => {
    const dow = getDayOfWeek(day);
    return dow === 0 || dow === 6;
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      {/* Inject print custom styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide sidebar and headers on print */
          aside, header, .no-print, button, select {
            display: none !important;
          }
          main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .printable-report {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .page-break {
            page-break-before: always !important;
          }
          .landscape-container {
            width: 100% !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 4px !important;
            font-size: 10px !important;
          }
        }
      `}} />

      <header className="no-print" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>Diário de Classe Oficial</h1>
        <p style={{ color: "#64748B", margin: 0 }}>Gere chamadas de frequência e registros diários de conteúdos nos moldes da Secretaria da Educação.</p>
      </header>

      {/* Filters Form */}
      <div className="card no-print" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>TURMA</label>
            <select className="text-input" value={selectedTurma} onChange={e => setSelectedTurma(e.target.value)}>
              <option value="" disabled>Selecione...</option>
              {turmasDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <div style={{ width: 150 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>MÊS</label>
            <select className="text-input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div style={{ width: 120 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>ANO</label>
            <select className="text-input" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <button 
            onClick={handleGenerateReport} 
            disabled={generating || !selectedTurma}
            className="btn btn--primary"
            style={{ padding: "12px 24px" }}
          >
            {generating ? "Carregando..." : "Gerar Diário"}
          </button>
        </div>
      </div>

      {reportData && (
        <div className="printable-report">
          {/* Header Info (both view and print) */}
          <div style={{ 
            borderBottom: "2px solid #1E293B", 
            paddingBottom: 16, 
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16
          }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#0F172A" }}>Escola Planeta Colorido</h2>
              <span style={{ fontSize: 14, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>
                Diário de Classe — Frequência e Conteúdo Programático
              </span>
            </div>
            <div style={{ textAlign: "right", fontSize: 13, color: "#334155" }}>
              <p style={{ margin: 0 }}><strong>Turma:</strong> {selectedTurma}</p>
              <p style={{ margin: 0 }}><strong>Período:</strong> {MESES.find(m => m.value === selectedMonth)?.label} / {selectedYear}</p>
            </div>
          </div>

          {/* Action button on view screen */}
          <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <button onClick={() => window.print()} className="btn btn--secondary" style={{ background: "#2563EB", color: "white", border: "none" }}>
              🖨️ Imprimir Diário Oficial
            </button>
          </div>

          {/* SECTION 1: FREQUENCY GRID */}
          <div className="landscape-container" style={{ marginBottom: 40 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", marginBottom: 12, textTransform: "uppercase", borderBottom: "1px solid #E2E8F0", paddingBottom: 6 }}>
              I. Registro de Frequência (Presenças / Faltas)
            </h3>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", border: "1px solid #94A3B8" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    <th style={{ border: "1px solid #CBD5E1", padding: "8px", textAlign: "left", minWidth: 150 }}>Aluno</th>
                    {Array.from({ length: reportData.daysCount }).map((_, i) => {
                      const day = i + 1;
                      const weekend = isWeekend(day);
                      return (
                        <th 
                          key={day} 
                          style={{ 
                            border: "1px solid #CBD5E1", 
                            padding: "4px", 
                            fontSize: 10,
                            background: weekend ? "#E2E8F0" : "#F8FAFC",
                            width: 25
                          }}
                        >
                          {day}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {reportData.students.map(student => (
                    <tr key={student.id}>
                      <td style={{ border: "1px solid #CBD5E1", padding: "8px", textAlign: "left", fontWeight: 600, fontSize: 13, color: "#1E293B" }}>
                        {student.nome}
                      </td>
                      {Array.from({ length: reportData.daysCount }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${selectedYear}-${selectedMonth}-${day.toString().padStart(2, "0")}`;
                        const record = reportData.records.find(r => r.alunoId === student.id && r.data === dateStr);
                        const weekend = isWeekend(day);

                        let content = "—";
                        let color = "#CBD5E1";

                        if (record) {
                          if (record.ausente) {
                            content = "F";
                            color = "#EF4444"; // red
                          } else {
                            content = "P";
                            color = "#10B981"; // green
                          }
                        }

                        return (
                          <td 
                            key={day} 
                            style={{ 
                              border: "1px solid #CBD5E1", 
                              padding: "4px", 
                              fontWeight: "bold",
                              fontSize: 11,
                              background: weekend ? "#F1F5F9" : "white",
                              color: color
                            }}
                          >
                            {weekend ? "" : content}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "#64748B" }}>
              * Legenda: <strong>P</strong> = Presente | <strong style={{ color: "#EF4444" }}>F</strong> = Falta Justificada/Sem Justificativa | <strong>—</strong> = Sem registro lançado. Sábados e domingos são omitidos automaticamente da contagem de frequência.
            </div>
          </div>

          {/* PAGE BREAK ON PRINT */}
          <div className="page-break" />

          {/* SECTION 2: PROGRAMMATIC CONTENT */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", marginBottom: 16, textTransform: "uppercase", borderBottom: "1px solid #E2E8F0", paddingBottom: 6 }}>
              II. Conteúdo Programático e Atividades Trabalhadas
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(() => {
                // Group records by day
                const recordsByDay: Record<string, DailyRecord[]> = {};
                reportData.records.forEach(rec => {
                  if (!recordsByDay[rec.data]) {
                    recordsByDay[rec.data] = [];
                  }
                  recordsByDay[rec.data].push(rec);
                });

                const sortedDays = Object.keys(recordsByDay).sort();

                if (sortedDays.length === 0) {
                  return (
                    <div style={{ padding: 24, textAlign: "center", color: "#94A3B8" }}>
                      Nenhum registro de atividade preenchido para este mês nesta turma.
                    </div>
                  );
                }

                return sortedDays.map(dateStr => {
                  const dayRecords = recordsByDay[dateStr];
                  // Use activities and descriptions from any of the non-absent student records on that day
                  const validRec = dayRecords.find(r => !r.ausente && (r.atividadeTexto || r.atividades));
                  if (!validRec) return null;

                  const dateFormatted = new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    weekday: "long"
                  });

                  // Extract checked activities
                  const activeActivities = Object.entries(validRec.atividades || {})
                    .filter(([_, checked]) => checked)
                    .map(([key, _]) => {
                      if (key === "rodaHistoria") return "📖 Roda de História";
                      if (key === "rodaConversa") return "💬 Roda de Conversa";
                      if (key === "recreacaoDirigida") return "🎯 Recreação Dirigida";
                      if (key === "recreacaoLivre") return "🎈 Recreação Livre";
                      if (key === "edFisica") return "🏃 Ed. Física";
                      if (key === "artes") return "🎨 Artes";
                      if (key === "danca") return "💃 Dança";
                      if (key === "ingles") return "🇬🇧 Inglês";
                      if (key === "parque") return "🌳 Parque";
                      if (key === "musica") return "🎵 Música";
                      if (key === "natacao") return "🏊 Natação";
                      return key;
                    });

                  return (
                    <div 
                      key={dateStr} 
                      style={{ 
                        border: "1px solid #E2E8F0", 
                        borderRadius: 12, 
                        background: "white", 
                        padding: 16,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", paddingBottom: 8, marginBottom: 12 }}>
                        <span style={{ fontWeight: 800, color: "var(--primary-dark)", textTransform: "capitalize", fontSize: 14 }}>
                          📅 {dateFormatted}
                        </span>
                      </div>
                      
                      {activeActivities.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                          {activeActivities.map(act => (
                            <span 
                              key={act} 
                              style={{ 
                                fontSize: 11, 
                                background: "#FFF7ED", 
                                color: "#C2410C", 
                                padding: "2px 8px", 
                                borderRadius: 6,
                                fontWeight: 700
                              }}
                            >
                              {act}
                            </span>
                          ))}
                        </div>
                      )}

                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#334155", whiteSpace: "pre-wrap" }}>
                        {validRec.atividadeTexto || <em style={{ color: "#94A3B8" }}>Sem descrição textual das atividades nesta data.</em>}
                      </p>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
