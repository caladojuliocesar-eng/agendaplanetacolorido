"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getAllStudents, addStudent, updateStudent, getAllUsers, addUser, linkParentToStudent, unlinkParentFromStudent } from "@/lib/firestore";
import { Student, UserProfile } from "@/types";

const TURMAS_SUGERIDAS = [
  "Berçário I", "Berçário II",
  "Infantil I", "Infantil II", "Infantil III", "Infantil IV", "Infantil V"
];

export default function AlunosAdminPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ nome: "", turma: "" });
  const [saving, setSaving] = useState(false);

  // Parent Linking State
  const [parentSearchEmail, setParentSearchEmail] = useState("");
  const [parentNewName, setParentNewName] = useState("");

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
      const [studentsData, usersData] = await Promise.all([
        getAllStudents(profile!.escolaId!),
        getAllUsers(profile!.escolaId!)
      ]);
      setStudents(studentsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.turma.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to find parents for a specific student
  const getParentsForStudent = (studentId: string) => {
    return users.filter(u => u.role === "pai" && u.filhos && u.filhos.includes(studentId));
  };

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({ nome: student.nome, turma: student.turma });
    } else {
      setEditingStudent(null);
      setFormData({ nome: "", turma: "" });
    }
    setParentSearchEmail("");
    setParentNewName("");
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
      } else {
        await addStudent({
          ...formData,
          escolaId: profile!.escolaId!,
          paiIds: [],
          fotoUrl: null,
          criadoEm: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao salvar aluno.");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkParent = async () => {
    if (!editingStudent) return;
    if (!parentSearchEmail) return;

    setSaving(true);
    try {
      const emailLower = parentSearchEmail.toLowerCase().trim();
      const existingUser = users.find(u => u.email === emailLower && u.role === "pai");

      if (existingUser) {
        // Link existing
        if (!existingUser.filhos?.includes(editingStudent.id)) {
          await linkParentToStudent(existingUser.uid, editingStudent.id);
        }
      } else {
        // Create new parent and link
        if (!parentNewName) {
          alert("Por favor, preencha o nome do novo responsável.");
          setSaving(false);
          return;
        }
        await addUser({
          nome: parentNewName,
          email: emailLower,
          role: "pai",
          escolaId: profile!.escolaId!,
          filhos: [editingStudent.id],
          criadoEm: new Date().toISOString()
        } as Omit<UserProfile, "uid">);
      }
      
      setParentSearchEmail("");
      setParentNewName("");
      await loadData(); // Reload users to show updated links
    } catch (error) {
      console.error(error);
      alert("Erro ao vincular responsável.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkParent = async (userId: string) => {
    if (!editingStudent) return;
    if (window.confirm("Tem certeza que deseja desvincular este responsável?")) {
      setSaving(true);
      try {
        await unlinkParentFromStudent(userId, editingStudent.id);
        await loadData();
      } catch (err) {
        console.error(err);
        alert("Erro ao desvincular.");
      } finally {
        setSaving(false);
      }
    }
  };

  const isEmailExisting = parentSearchEmail.trim().length > 3 && users.some(u => u.email === parentSearchEmail.toLowerCase().trim() && u.role === "pai");
  const linkedParents = editingStudent ? getParentsForStudent(editingStudent.id) : [];

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>Gestão de Alunos</h1>
          <p style={{ color: "#64748B", margin: 0 }}>Visualize e organize todos os alunos da escola.</p>
        </div>
        <button className="btn btn--primary" onClick={() => handleOpenModal()}>
          + Novo Aluno
        </button>
      </header>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", background: "white" }}>
          <input
            type="text"
            className="text-input"
            placeholder="🔍 Buscar por nome ou turma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 600 }}>
            <thead style={{ background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
              <tr>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Aluno</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Turma</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Responsáveis</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Data Cadastro</th>
                <th style={{ padding: "16px 24px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 48, textAlign: "center", color: "#64748B" }}>
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const parents = getParentsForStudent(student.id);
                  return (
                    <tr key={student.id} style={{ borderBottom: "1px solid #F1F5F9", background: "white" }}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ 
                            width: 40, 
                            height: 40, 
                            background: "#E2E8F0", 
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18
                          }}>
                            {student.fotoUrl ? <img src={student.fotoUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: 10, objectFit: "cover" }} /> : "👶"}
                          </div>
                          <span style={{ fontWeight: 600, color: "#1E293B" }}>{student.nome}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ 
                          padding: "4px 10px", 
                          background: "#E0F2FE", 
                          color: "#0369A1", 
                          borderRadius: 6, 
                          fontSize: 13, 
                          fontWeight: 600 
                        }}>
                          {student.turma}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", color: "#64748B", fontSize: 14 }}>
                        {parents.length} vinculado(s)
                      </td>
                      <td style={{ padding: "16px 24px", color: "#64748B", fontSize: 14 }}>
                        {student.criadoEm ? new Date(student.criadoEm).toLocaleDateString("pt-BR") : "---"}
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "right" }}>
                        <button 
                          onClick={() => handleOpenModal(student)}
                          style={{ background: "none", border: "none", color: "#F97316", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                        >
                          Editar / Responsáveis
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, padding: 16, overflowY: "auto" }}>
          <div className="card" style={{ width: "100%", maxWidth: 600, padding: 32, margin: "auto", marginTop: 40, marginBottom: 40 }}>
            <h2 style={{ margin: "0 0 24px 0", fontSize: 20, color: "#1E293B" }}>
              {editingStudent ? "Editar Aluno" : "Novo Aluno"}
            </h2>
            
            <form onSubmit={handleSaveStudent} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>NOME COMPLETO</label>
                <input required type="text" className="text-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Benjamin da Silva" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>TURMA</label>
                <select required className="text-input" value={formData.turma} onChange={e => setFormData({...formData, turma: e.target.value})}>
                  <option value="" disabled>Selecione uma turma...</option>
                  {TURMAS_SUGERIDAS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              
              {!editingStudent && (
                <div style={{ padding: "16px", background: "#FEF2F2", borderRadius: 8, marginTop: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#991B1B" }}>⚠️ Você poderá vincular os responsáveis após salvar o aluno pela primeira vez.</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 12, background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Voltar</button>
                <button type="submit" disabled={saving} className="btn btn--primary" style={{ flex: 1 }}>{saving ? "Salvando..." : "Salvar Dados do Aluno"}</button>
              </div>
            </form>

            {/* SESSÃO RESPONSÁVEIS (Só aparece se o aluno já estiver criado) */}
            {editingStudent && (
              <div style={{ marginTop: 32, borderTop: "2px dashed #E2E8F0", paddingTop: 32 }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 800, color: "#1E293B" }}>Responsáveis Familiares</h3>
                
                {/* Lista de Responsáveis Atuais */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                  {linkedParents.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 14, color: "#64748B", fontStyle: "italic" }}>Nenhum responsável vinculado a este aluno.</p>
                  ) : (
                    linkedParents.map(parent => (
                      <div key={parent.uid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0FDF4", padding: "12px 16px", borderRadius: 12, border: "1px solid #BBF7D0" }}>
                        <div>
                          <span style={{ fontWeight: 700, color: "#166534", display: "block" }}>{parent.nome}</span>
                          <span style={{ fontSize: 13, color: "#15803D" }}>{parent.email}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleUnlinkParent(parent.uid)}
                          disabled={saving}
                          style={{ background: "#FEE2E2", color: "#DC2626", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Desvincular
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Cadastrar ou Vincular Novo Responsável */}
                <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                  <h4 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 700, color: "#475569" }}>ADICIONAR RESPONSÁVEL</h4>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>E-MAIL DO RESPONSÁVEL</label>
                      <input 
                        type="email" 
                        className="text-input" 
                        value={parentSearchEmail} 
                        onChange={e => setParentSearchEmail(e.target.value)} 
                        placeholder="Ex: maria@email.com" 
                        style={{ background: "white" }}
                      />
                    </div>

                    {/* Mostrar campo NOME apenas se for um email novo */}
                    {parentSearchEmail.trim().length > 3 && !isEmailExisting && (
                      <div className="animate-fade-in">
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>NOME COMPLETO</label>
                        <input 
                          type="text" 
                          className="text-input" 
                          value={parentNewName} 
                          onChange={e => setParentNewName(e.target.value)} 
                          placeholder="Ex: Maria da Silva" 
                          style={{ background: "white" }}
                        />
                        <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>Este e-mail é novo. Uma conta será criada automaticamente.</p>
                      </div>
                    )}

                    {parentSearchEmail.trim().length > 3 && isEmailExisting && (
                      <p style={{ margin: 0, fontSize: 12, color: "#059669", fontWeight: 600 }}>Usuário encontrado no sistema. Será vinculado ao aluno.</p>
                    )}

                    <button 
                      type="button" 
                      onClick={handleLinkParent}
                      disabled={saving || !parentSearchEmail || (!isEmailExisting && !parentNewName)}
                      style={{ 
                        padding: "12px", 
                        background: isEmailExisting ? "#059669" : "var(--primary)", 
                        color: "white", 
                        border: "none", 
                        borderRadius: 8, 
                        fontWeight: 700, 
                        cursor: "pointer",
                        marginTop: 4
                      }}
                    >
                      {saving ? "Processando..." : (isEmailExisting ? "Vincular Responsável Existente" : "Cadastrar Novo Responsável")}
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
