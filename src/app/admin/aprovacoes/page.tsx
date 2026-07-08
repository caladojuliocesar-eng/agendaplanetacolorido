"use client";

import { useState, useEffect, useMemo } from "react";
import { getRelatorioPedagogico, saveRelatorioPedagogico, getAllStudents } from "@/lib/firestore";
import { Student } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface LogPedagogico {
  id: string;
  alunoId: string;
  data: string;
  pilar: string;
  pilarLabel: string;
  nota: string;
  sentimento: "positivo" | "neutro" | "atencao";
  criadoEm: string;
}

const PILAR_CONFIG: Record<string, { icon: string; color: string }> = {
  socioemocional:   { icon: "🤝", color: "#8B5CF6" },
  autonomia:        { icon: "🧒", color: "#06B6D4" },
  linguagem:        { icon: "💬", color: "#3B82F6" },
  motora:           { icon: "🏃", color: "#10B981" },
  logico:           { icon: "🧩", color: "#F59E0B" },
  curiosidade:      { icon: "🔍", color: "#EC4899" },
  leitura:          { icon: "📖", color: "#6366F1" },
  comportamento:    { icon: "🎯", color: "#14B8A6" },
  alimentacao_sono: { icon: "🍎", color: "#F97316" },
  destaques:        { icon: "⭐", color: "#EAB308" },
};

const ALUNO_ID = "aluno_otto";
const PERIODO_ATUAL = "2026-T2";

function calcScore(logs: LogPedagogico[]): number {
  if (!logs.length) return 0;
  let score = 0;
  for (const l of logs) {
    if (l.sentimento === "positivo") score += 3;
    else if (l.sentimento === "neutro") score += 2;
    else score += 1;
  }
  return Math.round((score / (logs.length * 3)) * 100);
}

function groupByPilar(logs: LogPedagogico[]) {
  const map: Record<string, LogPedagogico[]> = {};
  for (const log of logs) {
    if (!map[log.pilar]) map[log.pilar] = [];
    map[log.pilar].push(log);
  }
  return map;
}

export default function ShowroomDiretora() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [reportsStatus, setReportsStatus] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<LogPedagogico[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [editableContent, setEditableContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [reportApproved, setReportApproved] = useState(false);
  const [reportFromProfessor, setReportFromProfessor] = useState(false);
  
  // Prompt de ajuste IA
  const [adjustPrompt, setAdjustPrompt] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const [selectedAluno, setSelectedAluno] = useState<string | null>(null);

  // Load students in this school
  useEffect(() => {
    if (profile?.escolaId) {
      getAllStudents(profile.escolaId)
        .then(async (list) => {
          setStudents(list);
          const statusMap: Record<string, string> = {};
          for (const s of list) {
            const rel = await getRelatorioPedagogico(s.id, PERIODO_ATUAL);
            if (rel) {
              statusMap[s.id] = rel.status;
            }
          }
          setReportsStatus(statusMap);
        })
        .catch(console.error);
    }
  }, [profile]);

  useEffect(() => {
    if (selectedAluno) {
      setLoading(true);
      fetch(`/api/pedagogico?alunoId=${selectedAluno}`)
        .then(res => res.json())
        .then(data => setLogs(data.logs || []))
        .catch(console.error)
        .finally(() => setLoading(false));

      // Check for report sent by professor
      getRelatorioPedagogico(selectedAluno, PERIODO_ATUAL).then(rel => {
        if (rel) {
          setReportContent(rel.conteudo);
          setEditableContent(rel.conteudo);
          setReportFromProfessor(true);
          if (rel.status === "aprovado") {
            setReportApproved(true);
          } else {
            setReportApproved(false);
          }
        } else {
          setReportContent(null);
          setEditableContent("");
          setReportFromProfessor(false);
          setReportApproved(false);
        }
      });
    } else {
      setLoading(false);
    }
  }, [selectedAluno]);

  const grouped = useMemo(() => groupByPilar(logs), [logs]);
  const globalScore = useMemo(() => calcScore(logs), [logs]);
  const positivos = useMemo(() => logs.filter(l => l.sentimento === "positivo").length, [logs]);
  const atencoes = useMemo(() => logs.filter(l => l.sentimento === "atencao").length, [logs]);

  const pilarEntries = useMemo(() => {
    return Object.entries(grouped)
      .filter(([k]) => k !== "destaques")
      .sort((a, b) => b[1].length - a[1].length);
  }, [grouped]);

  const selectedStudentObj = useMemo(() => students.find(s => s.id === selectedAluno), [students, selectedAluno]);

  async function handleGenerateReport() {
    if (generatingReport || !selectedAluno) return;
    setGeneratingReport(true);
    setReportContent(null);
    setReportApproved(false);
    setIsEditing(false);
    try {
      const res = await fetch("/api/pedagogico/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alunoId: selectedAluno }),
      });
      const data = await res.json();
      if (data.report) {
        setReportContent(data.report);
        setEditableContent(data.report);
        setReportFromProfessor(false);
      } else {
        alert("Erro ao gerar relatório: " + (data.error || "Desconhecido"));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar relatório.");
    } finally {
      setGeneratingReport(false);
    }
  }

  async function handleAdjustWithAI() {
    if (!adjustPrompt.trim() || adjusting || !selectedAluno) return;
    setAdjusting(true);
    try {
      const res = await fetch("/api/pedagogico/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          alunoId: selectedAluno,
          adjustPrompt: `Abaixo está o relatório atual. Ajuste-o conforme esta instrução da coordenação: "${adjustPrompt}"\n\nRelatório atual:\n${editableContent}`,
        }),
      });
      const data = await res.json();
      if (data.report) {
        setEditableContent(data.report);
        setReportContent(data.report);
        setAdjustPrompt("");
      } else {
        alert("Erro ao ajustar: " + (data.error || "Desconhecido"));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao ajustar relatório.");
    } finally {
      setAdjusting(false);
    }
  }

  async function handleApproveReport() {
    if (!editableContent || !selectedAluno) return;
    try {
      await saveRelatorioPedagogico({
        alunoId: selectedAluno,
        escolaId: profile?.escolaId || "planeta-colorido",
        professorId: "coord_direcao",
        status: "aprovado",
        conteudo: editableContent,
        periodo: PERIODO_ATUAL
      });
      setReportApproved(true);
      setReportContent(editableContent);
      setReportsStatus(prev => ({ ...prev, [selectedAluno]: "aprovado" }));
    } catch (error) {
      console.error(error);
      alert("Erro ao aprovar relatório.");
    }
  }

  function renderMarkdown(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 20, color: "#1E293B", marginTop: 24, fontWeight: 800 }}>{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 17, color: "#1E293B", marginTop: 20, fontWeight: 700 }}>{line.replace('### ', '')}</h3>;
      if (line.startsWith('# ')) return <h2 key={i} style={{ fontSize: 22, color: "#1E293B", marginTop: 28, fontWeight: 800 }}>{line.replace('# ', '')}</h2>;
      
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} style={{ margin: "0 0 12px 0", minHeight: line.trim() === "" ? 12 : "auto" }}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFBFC" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!selectedAluno) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAFBFC" }}>
        <header style={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          padding: "32px 24px 80px", color: "white", position: "relative", overflow: "hidden",
          borderRadius: 24, marginBottom: 32
        }}>
          <div style={{ maxWidth: 900, position: "relative", zIndex: 1 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
              Caixa de Entrada: Aprovações
            </h1>
            <p style={{ color: "#94A3B8", margin: 0, fontSize: 15 }}>Relatórios enviados pelos professores aguardando revisão final.</p>
          </div>
        </header>

        <div style={{ maxWidth: 900, margin: "-48px auto 0", padding: "0 24px 64px", position: "relative", zIndex: 2 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 24, border: "1px solid #F1F5F9", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 12 }}>
            {students.map(student => {
              const status = reportsStatus[student.id];
              const isApproved = status === "aprovado";
              const isPending = !status;
              
              return (
                <button 
                  key={student.id} 
                  onClick={() => setSelectedAluno(student.id)} 
                  style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "all 0.2s" }} 
                  className="hover:border-orange-400 hover:bg-orange-50"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 32 }}>{student.nome === "Luna" ? "👧🏻" : student.nome === "Otto" ? "👦🏼" : "👶"}</span>
                    <div style={{ textAlign: "left" }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1E293B" }}>{student.nome}</h3>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>{student.turma}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ 
                      background: isApproved ? "#F0FDF4" : isPending ? "#F1F5F9" : "#FFF7ED", 
                      color: isApproved ? "#166534" : isPending ? "#64748B" : "#F97316", 
                      padding: "6px 12px", 
                      borderRadius: 20, 
                      fontSize: 12, 
                      fontWeight: 700 
                    }}>
                      {isApproved ? "✅ Aprovado" : isPending ? "Pendente de Geração" : "Aguardando Revisão"}
                    </span>
                    <span style={{ color: "#F97316" }}>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFBFC" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
        padding: "32px 24px 80px",
        color: "white", position: "relative", overflow: "hidden",
        borderRadius: 24, marginBottom: 32
      }}>
        <div style={{ maxWidth: 900, position: "relative", zIndex: 1 }}>
          <button onClick={() => setSelectedAluno(null)} style={{
            color: "#94A3B8", fontSize: 13, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24,
            background: "none", border: "none", cursor: "pointer", padding: 0
          }}>
            ← Voltar à Caixa de Entrada
          </button>

          <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Revisão de Relatório
          </h1>
          <p style={{ color: "#94A3B8", margin: 0, fontSize: 15 }}>
            Aluno: {selectedStudentObj?.nome || ""} • {logs.length} observações analisadas
          </p>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "-48px auto 0", padding: "0 24px 64px", position: "relative", zIndex: 2 }}>
        
        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "white", borderRadius: 20, padding: "24px 28px", border: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>📊</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: "#64748B", fontWeight: 600 }}>Score Global</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#1E293B" }}>{globalScore}%</p>
            </div>
          </div>
          <div style={{ background: "white", borderRadius: 20, padding: "24px 28px", border: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>✅</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: "#64748B", fontWeight: 600 }}>Positivos</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#22C55E" }}>{positivos}</p>
            </div>
          </div>
          <div style={{ background: "white", borderRadius: 20, padding: "24px 28px", border: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>⚠️</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: "#64748B", fontWeight: 600 }}>Atenção</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#EF4444" }}>{atencoes}</p>
            </div>
          </div>
        </div>

        {/* Report Editor */}
        {reportContent && !reportApproved && (
          <div style={{
            background: "white", borderRadius: 20, padding: 32,
            border: "1px solid #F1F5F9", boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            marginBottom: 32,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, borderBottom: "1px solid #F1F5F9", paddingBottom: 16 }}>
              <span style={{ fontSize: 28 }}>✍️</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1E293B" }}>
                  {reportFromProfessor ? "Rascunho da Professora" : "Rascunho Gerado por IA"}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
                  {isEditing ? "Edite livremente o texto abaixo." : "Revise o texto. Você pode editar manualmente ou pedir ajustes à IA."}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  padding: "8px 16px", borderRadius: 10, border: "1px solid #E2E8F0",
                  background: isEditing ? "#FEF2F2" : "#F8FAFC", color: isEditing ? "#991B1B" : "#475569",
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                {isEditing ? "👁️ Visualizar" : "✏️ Editar Texto"}
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                style={{
                  width: "100%", minHeight: 400, padding: 24, borderRadius: 16,
                  border: "2px solid #E2E8F0", fontSize: 15, lineHeight: 1.8,
                  color: "#334155", fontFamily: "'Inter', system-ui, sans-serif",
                  outline: "none", resize: "vertical", boxSizing: "border-box",
                  background: "#FAFBFC",
                }}
              />
            ) : (
              <div style={{ fontSize: 15, lineHeight: 1.8, color: "#334155", marginBottom: 24 }}>
                {renderMarkdown(editableContent)}
              </div>
            )}

            <div style={{ marginTop: 24, background: "#F8FAFC", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0" }}>
              <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, color: "#475569", display: "flex", alignItems: "center", gap: 8 }}>
                🤖 Ajustar com IA
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <input
                  value={adjustPrompt}
                  onChange={(e) => setAdjustPrompt(e.target.value)}
                  placeholder='Ex: "Dê mais ênfase na autonomia"'
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdjustWithAI(); }}
                  style={{ flex: 1, padding: "14px 18px", borderRadius: 12, border: "1px solid #CBD5E1", fontSize: 14, outline: "none" }}
                />
                <button
                  onClick={handleAdjustWithAI}
                  disabled={adjusting || !adjustPrompt.trim()}
                  style={{ padding: "14px 20px", borderRadius: 12, border: "none", background: adjusting || !adjustPrompt.trim() ? "#CBD5E1" : "#6366F1", color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
                >
                  {adjusting ? "Ajustando..." : "Aplicar"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, borderTop: "1px solid #F1F5F9", paddingTop: 24, marginTop: 24, flexWrap: "wrap" }}>
              <button onClick={handleApproveReport} style={{ padding: "14px 24px", borderRadius: 12, border: "none", background: "#0F172A", color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                ✅ Aprovar e Finalizar
              </button>
            </div>
          </div>
        )}

        {/* If no report exists yet */}
        {!reportContent && (
           <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ color: "#64748B" }}>Nenhum rascunho enviado pela professora ainda.</p>
              <button onClick={handleGenerateReport} disabled={generatingReport} style={{
                padding: "14px 32px", borderRadius: 14, border: "none",
                background: "#F97316", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer"
              }}>
                {generatingReport ? "Gerando..." : "✨ Gerar Rascunho Próprio"}
              </button>
           </div>
        )}

        {reportContent && reportApproved && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1E293B" }}>📄 Documento Aprovado</h3>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setReportApproved(false)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #CBD5E1", background: "white", color: "#475569", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  ← Voltar
                </button>
                <button onClick={() => window.print()} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  🖨️ Imprimir
                </button>
              </div>
            </div>

            <div className="printable-a4" style={{
              background: "white", padding: "60px 80px", borderRadius: 8,
              boxShadow: "0 20px 40px rgba(0,0,0,0.08)", minHeight: 1123, margin: "0 auto", maxWidth: 794,
              fontFamily: "'Inter', system-ui, sans-serif"
            }}>
              <div style={{ textAlign: "center", borderBottom: "2px solid #F1F5F9", paddingBottom: 24, marginBottom: 40 }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#0F172A" }}>Escola Planeta Colorido</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  Relatório Pedagógico Trimestral
                </p>
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.8, color: "#334155" }}>
                {renderMarkdown(editableContent)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
