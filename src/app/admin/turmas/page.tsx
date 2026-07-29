"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getAllStudents, updateStudentTurma } from "@/lib/firestore";
import { Student } from "@/types";
import Link from "next/link";

const TURMAS_SUGERIDAS = [
  "Berçário I", "Berçário II",
  "Infantil I", "Infantil II", "Infantil III", "Infantil IV", "Infantil V"
];

const hasRealMedicalWarning = (val?: string): boolean => {
  if (!val) return false;
  const clean = val.trim().toLowerCase();
  return clean.length > 0 && 
         clean !== "não" && 
         clean !== "nao" && 
         clean !== "nenhum" && 
         clean !== "nenhuma" && 
         clean !== "não possui" && 
         clean !== "nao possui" && 
         clean !== "não tem" && 
         clean !== "nao tem" && 
         clean !== "n/a" && 
         clean !== "-";
};

export default function TurmasAdminPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"painel" | "remanejamento">("painel");
  const [selectedTurma, setSelectedTurma] = useState("");
  const [activeMedicalId, setActiveMedicalId] = useState<string | null>(null);

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
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  }

  // Obter lista de turmas únicas que existem atualmente
  const turmasAtuais = Array.from(new Set(students.map(s => s.turma))).sort();

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, filtered: Student[]) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filtered.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleStudent = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handlePromote = async () => {
    if (selectedIds.size === 0) return alert("Selecione pelo menos um aluno.");
    if (!destino) return alert("Selecione a turma de destino.");

    const confirmMsg = `Tem certeza que deseja mover ${selectedIds.size} aluno(s) para a turma "${destino}"?`;
    if (!window.confirm(confirmMsg)) return;

    setSaving(true);
    try {
      const novaTurma = destino;
      await updateStudentTurma(Array.from(selectedIds), novaTurma);
      
      alert("Alunos remanejados com sucesso!");
      setOrigem(novaTurma); // Muda a visualização para a nova turma
      setSelectedIds(new Set());
      await loadStudents(); // Recarrega os dados
    } catch (error) {
      console.error(error);
      alert("Erro ao remanejar alunos.");
    } finally {
      setSaving(false);
    }
  };

  const alunosNaOrigem = origem ? students.filter(s => s.turma === origem) : [];

  if (loading) return <div className="spinner" />;

  const alunosNaTurma = selectedTurma ? students.filter(s => s.turma === selectedTurma) : [];

  return (
    <div>
      {/* Keyframe animation for health pulse icon */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
      `}} />

      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>Gestão de Turmas</h1>
        <p style={{ color: "#64748B", margin: 0 }}>Acompanhe os alunos por sala de aula de forma visual e rápida.</p>
      </header>

      {/* Navegação por Abas */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, borderBottom: "1px solid #E2E8F0", paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab("painel")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "painel" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "painel" ? "var(--primary-dark)" : "#64748B",
            fontWeight: 700,
            padding: "8px 16px",
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          🖼️ Quadro de Rostos
        </button>
        <button
          onClick={() => setActiveTab("remanejamento")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "remanejamento" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "remanejamento" ? "var(--primary-dark)" : "#64748B",
            fontWeight: 700,
            padding: "8px 16px",
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          🔄 Remanejamento de Alunos
        </button>
      </div>

      {/* Conteúdo da Aba 1: Quadro de Rostos */}
      {activeTab === "painel" && (
        <div>
          {/* Seletor de Turma no topo */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24, background: "white", padding: 16, borderRadius: 12, border: "1px solid #E2E8F0" }}>
            <label style={{ fontSize: 13, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Escolha a Turma:
            </label>
            <select 
              className="text-input" 
              value={selectedTurma} 
              onChange={(e) => {
                setSelectedTurma(e.target.value);
                setActiveMedicalId(null);
              }}
              style={{ width: 220, margin: 0 }}
            >
              <option value="">Selecione...</option>
              {turmasAtuais.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {!selectedTurma ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, border: "1px dashed #CBD5E1" }}>
              <span style={{ fontSize: 48 }}>🏫</span>
              <h3 style={{ margin: "16px 0 8px 0", color: "#1E293B", fontSize: 18, fontWeight: 700 }}>Selecione uma Turma</h3>
              <p style={{ color: "#64748B", margin: 0 }}>Escolha uma turma no seletor acima para carregar o mural de alunos.</p>
            </div>
          ) : alunosNaTurma.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, border: "1px dashed #CBD5E1" }}>
              <p style={{ color: "#64748B", margin: 0 }}>Nenhum aluno cadastrado nesta turma.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20 }}>
                {alunosNaTurma.map(aluno => {
                  const hasMedicalAlert = hasRealMedicalWarning(aluno.alergias) || 
                                          hasRealMedicalWarning(aluno.restricoesAlimentares) || 
                                          hasRealMedicalWarning(aluno.medicamentosContinuos);
                  const nameParts = aluno.nome.trim().split(" ");
                  const displayName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : aluno.nome;

                  return (
                    <div 
                      key={aluno.id} 
                      style={{ 
                        background: "white", 
                        border: "1px solid #E2E8F0", 
                        borderRadius: 16, 
                        padding: "24px 16px 16px 16px", 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center", 
                        textAlign: "center", 
                        position: "relative", 
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)" 
                      }}
                    >
                      {/* Health Alert Icon */}
                      {hasMedicalAlert && (
                        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMedicalId(activeMedicalId === aluno.id ? null : aluno.id);
                            }}
                            style={{
                              background: "#FEE2E2",
                              border: "1px solid #FCA5A5",
                              color: "#DC2626",
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              fontSize: 12,
                              animation: "pulse 2s infinite",
                              padding: 0
                            }}
                            title="Ver Ficha Médica"
                          >
                            🩺
                          </button>
                          
                          {/* Medical Tooltip Popover */}
                          {activeMedicalId === aluno.id && (
                            <div style={{ position: "absolute", top: 32, right: 0, width: 220, background: "#1E293B", color: "white", padding: 12, borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)", zIndex: 50, textAlign: "left", fontSize: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4 }}>
                                <strong style={{ color: "#FCA5A5" }}>⚠️ Alerta de Saúde</strong>
                                <span style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setActiveMedicalId(null)}>✕</span>
                              </div>
                              {hasRealMedicalWarning(aluno.alergias) && <div style={{ marginBottom: 4 }}><strong>Alergias:</strong> {aluno.alergias}</div>}
                              {hasRealMedicalWarning(aluno.restricoesAlimentares) && <div style={{ marginBottom: 4 }}><strong>Restrições:</strong> {aluno.restricoesAlimentares}</div>}
                              {hasRealMedicalWarning(aluno.medicamentosContinuos) && <div><strong>Medicamentos:</strong> {aluno.medicamentosContinuos}</div>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Avatar */}
                      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F1F5F9", border: "2px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: 28, marginBottom: 12 }}>
                        {aluno.fotoUrl ? (
                          <img src={aluno.fotoUrl} alt={aluno.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          "👶"
                        )}
                      </div>

                      {/* Name */}
                      <h4 style={{ margin: "0 0 4px 0", fontSize: 15, fontWeight: 700, color: "#1E293B" }}>{displayName}</h4>
                      <p style={{ margin: "0 0 16px 0", fontSize: 11, color: "#94A3B8", textOverflow: "ellipsis", width: "100%", overflow: "hidden", whiteSpace: "nowrap" }}>{aluno.nome}</p>

                      {/* Shortcut buttons */}
                      <div style={{ display: "flex", gap: 8, width: "100%", borderTop: "1px solid #F1F5F9", paddingTop: 12, justifyContent: "center" }}>
                        <Link 
                          href={`/admin/alunos?edit=${aluno.id}`}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            textDecoration: "none",
                            cursor: "pointer"
                          }}
                          title="Ficha Cadastral"
                        >
                          👤
                        </Link>
                        <Link 
                          href={`/admin/financeiro?search=${encodeURIComponent(aluno.nome)}`}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            textDecoration: "none",
                            cursor: "pointer"
                          }}
                          title="Cobranças"
                        >
                          💰
                        </Link>
                        <Link 
                          href={`/admin/aprovacoes?turma=${encodeURIComponent(selectedTurma)}&alunoId=${aluno.id}`}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            textDecoration: "none",
                            cursor: "pointer"
                          }}
                          title="Relatórios Pedagógicos"
                        >
                          📝
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba 2: Remanejamento (Código Anterior) */}
      {activeTab === "remanejamento" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          {/* LADO ESQUERDO: SELEÇÃO E LISTA */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase" }}>
                1. Turma de Origem
              </label>
              <select 
                className="text-input" 
                value={origem} 
                onChange={(e) => {
                  setOrigem(e.target.value);
                  setSelectedIds(new Set());
                }}
              >
                <option value="">Selecione uma turma...</option>
                {turmasAtuais.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {origem && (
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ background: "#F8FAFC", padding: "12px 16px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 12 }}>
                  <input 
                    type="checkbox" 
                    checked={alunosNaOrigem.length > 0 && selectedIds.size === alunosNaOrigem.length}
                    onChange={(e) => handleSelectAll(e, alunosNaOrigem)}
                    style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>Selecionar Todos ({alunosNaOrigem.length})</span>
                </div>
                
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {alunosNaOrigem.length === 0 ? (
                    <p style={{ padding: 24, textAlign: "center", color: "#64748B", margin: 0 }}>Nenhum aluno nesta turma.</p>
                  ) : (
                    alunosNaOrigem.map(aluno => (
                      <label key={aluno.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #F1F5F9", cursor: "pointer", background: selectedIds.has(aluno.id) ? "#F0F9FF" : "white" }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(aluno.id)}
                          onChange={() => handleToggleStudent(aluno.id)}
                          style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
                        />
                        <span style={{ fontWeight: 500, color: "#1E293B" }}>{aluno.nome}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* LADO DIREITO: DESTINO E AÇÃO */}
          <div className="card" style={{ padding: 24, background: "#F8FAFC", border: "2px dashed #CBD5E1", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase" }}>
                2. Turma de Destino
              </label>
              <div style={{ display: "flex", gap: 12 }}>
                <select 
                  className="text-input" 
                  value={destino} 
                  onChange={(e) => setDestino(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Nível...</option>
                  {TURMAS_SUGERIDAS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ padding: 16, background: "white", borderRadius: 12, border: "1px solid #E2E8F0" }}>
              <p style={{ margin: "0 0 12px 0", fontSize: 14, color: "#64748B" }}>
                <strong>{selectedIds.size}</strong> alunos selecionados serão movidos para:
              </p>
              <h3 style={{ margin: 0, fontSize: 20, color: "var(--primary)", fontWeight: 800 }}>
                {destino ? destino : "---"}
              </h3>
            </div>

            <button 
              className="btn btn--primary" 
              onClick={handlePromote}
              disabled={saving || selectedIds.size === 0 || !destino}
              style={{ padding: "16px", fontSize: 16 }}
            >
              {saving ? "Movendo Alunos..." : "Confirmar Remanejamento 🚀"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
