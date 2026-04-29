"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getAllStudents, updateStudentTurma } from "@/lib/firestore";
import { Student } from "@/types";

const TURMAS_SUGERIDAS = [
  "Berçário I", "Berçário II",
  "Infantil I", "Infantil II", "Infantil III", "Infantil IV", "Infantil V"
];

export default function TurmasAdminPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

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

  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>Remanejamento de Turmas</h1>
        <p style={{ color: "#64748B", margin: 0 }}>Mova alunos de uma sala para outra de forma rápida.</p>
      </header>

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
    </div>
  );
}
