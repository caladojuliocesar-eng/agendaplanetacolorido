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
  const [activeTab, setActiveTab] = useState<"geral" | "saude" | "responsaveis">("geral");
  
  const [formData, setFormData] = useState({ 
    nome: "", 
    turma: "",
    dataNascimento: "",
    genero: "",
    endereco: "",
    alergias: "",
    medicamentosContinuos: "",
    restricoesAlimentares: "",
    tipoSanguineo: "",
    convenioMedico: "",
    contatoPediatra: "",
  });
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
      setFormData({ 
        nome: student.nome, 
        turma: student.turma,
        dataNascimento: student.dataNascimento || "",
        genero: student.genero || "",
        endereco: student.endereco || "",
        alergias: student.alergias || "",
        medicamentosContinuos: student.medicamentosContinuos || "",
        restricoesAlimentares: student.restricoesAlimentares || "",
        tipoSanguineo: student.tipoSanguineo || "",
        convenioMedico: student.convenioMedico || "",
        contatoPediatra: student.contatoPediatra || "",
      });
      setActiveTab("geral");
    } else {
      setEditingStudent(null);
      setFormData({ 
        nome: "", 
        turma: "",
        dataNascimento: "",
        genero: "",
        endereco: "",
        alergias: "",
        medicamentosContinuos: "",
        restricoesAlimentares: "",
        tipoSanguineo: "",
        convenioMedico: "",
        contatoPediatra: "",
      });
      setActiveTab("geral");
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
        await updateStudent(editingStudent.id, {
          ...formData,
          atualizadoEm: new Date().toISOString()
        });
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
        if (!existingUser.filhos?.includes(editingStudent.id)) {
          await linkParentToStudent(existingUser.uid, editingStudent.id);
        }
      } else {
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
      await loadData();
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
                          Ver Perfil / Editar
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
          <div className="card" style={{ width: "100%", maxWidth: 650, padding: 0, margin: "auto", marginTop: 40, marginBottom: 40, overflow: "hidden" }}>
            
            {/* Header com Abas */}
            <div style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", padding: "20px 32px 0 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h2 style={{ margin: "0 0 16px 0", fontSize: 20, color: "#1E293B" }}>
                  {editingStudent ? `Perfil: ${editingStudent.nome}` : "Cadastrar Novo Aluno"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: 20, color: "#94A3B8", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                <button 
                  onClick={() => setActiveTab("geral")}
                  style={{ padding: "12px 0", border: "none", background: "none", fontSize: 13, fontWeight: 700, color: activeTab === "geral" ? "var(--primary)" : "#64748B", borderBottom: activeTab === "geral" ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer" }}
                >
                  DADOS GERAIS
                </button>
                <button 
                  onClick={() => setActiveTab("saude")}
                  style={{ padding: "12px 0", border: "none", background: "none", fontSize: 13, fontWeight: 700, color: activeTab === "saude" ? "var(--primary)" : "#64748B", borderBottom: activeTab === "saude" ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer" }}
                >
                  FICHA MÉDICA
                </button>
                <button 
                  disabled={!editingStudent}
                  onClick={() => setActiveTab("responsaveis")}
                  style={{ padding: "12px 0", border: "none", background: "none", fontSize: 13, fontWeight: 700, color: !editingStudent ? "#CBD5E1" : (activeTab === "responsaveis" ? "var(--primary)" : "#64748B"), borderBottom: activeTab === "responsaveis" ? "2px solid var(--primary)" : "2px solid transparent", cursor: !editingStudent ? "not-allowed" : "pointer" }}
                >
                  RESPONSÁVEIS
                </button>
              </div>
            </div>

            <div style={{ padding: 32 }}>
              {activeTab === "geral" && (
                <form onSubmit={handleSaveStudent} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>NOME COMPLETO *</label>
                      <input required type="text" className="text-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Benjamin da Silva" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>TURMA *</label>
                      <select required className="text-input" value={formData.turma} onChange={e => setFormData({...formData, turma: e.target.value})}>
                        <option value="" disabled>Selecione...</option>
                        {TURMAS_SUGERIDAS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>DATA DE NASCIMENTO</label>
                      <input type="date" className="text-input" value={formData.dataNascimento} onChange={e => setFormData({...formData, dataNascimento: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>GÊNERO</label>
                      <select className="text-input" value={formData.genero} onChange={e => setFormData({...formData, genero: e.target.value})}>
                        <option value="">Selecione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>ENDEREÇO RESIDENCIAL</label>
                    <input type="text" className="text-input" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} placeholder="Rua, número, bairro..." />
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 12, background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                    <button type="submit" disabled={saving} className="btn btn--primary" style={{ flex: 1 }}>{saving ? "Salvando..." : "Salvar Dados Gerais"}</button>
                  </div>
                </form>
              )}

              {activeTab === "saude" && (
                <form onSubmit={handleSaveStudent} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>ALERGIAS</label>
                    <textarea className="text-input" style={{ minHeight: 60 }} value={formData.alergias} onChange={e => setFormData({...formData, alergias: e.target.value})} placeholder="Descreva alergias a medicamentos ou alimentos..." />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>TIPO SANGUÍNEO</label>
                      <input type="text" className="text-input" value={formData.tipoSanguineo} onChange={e => setFormData({...formData, tipoSanguineo: e.target.value})} placeholder="A+, O-, etc." />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>RESTRIÇÕES ALIMENTARES</label>
                      <input type="text" className="text-input" value={formData.restricoesAlimentares} onChange={e => setFormData({...formData, restricoesAlimentares: e.target.value})} placeholder="Glúten, lactose, etc." />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>MEDICAMENTOS CONTÍNUOS</label>
                    <input type="text" className="text-input" value={formData.medicamentosContinuos} onChange={e => setFormData({...formData, medicamentosContinuos: e.target.value})} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>CONVÊNIO MÉDICO</label>
                      <input type="text" className="text-input" value={formData.convenioMedico} onChange={e => setFormData({...formData, convenioMedico: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>CONTATO PEDIATRA</label>
                      <input type="text" className="text-input" value={formData.contatoPediatra} onChange={e => setFormData({...formData, contatoPediatra: e.target.value})} placeholder="Nome e telefone" />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 12, background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                    <button type="submit" disabled={saving} className="btn btn--primary" style={{ flex: 1 }}>{saving ? "Salvando..." : "Salvar Ficha Médica"}</button>
                  </div>
                </form>
              )}

              {activeTab === "responsaveis" && editingStudent && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 800, color: "#1E293B" }}>Responsáveis Vinculados</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {linkedParents.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 13, color: "#94A3B8" }}>Nenhum responsável vinculado.</p>
                      ) : (
                        linkedParents.map(parent => (
                          <div key={parent.uid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0FDF4", padding: "10px 16px", borderRadius: 10, border: "1px solid #BBF7D0" }}>
                            <div style={{ fontSize: 13 }}>
                              <span style={{ fontWeight: 700, color: "#166534", display: "block" }}>{parent.nome}</span>
                              <span style={{ color: "#15803D" }}>{parent.email}</span>
                            </div>
                            <button onClick={() => handleUnlinkParent(parent.uid)} disabled={saving} style={{ background: "none", color: "#DC2626", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Remover</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: 13, fontWeight: 700, color: "#475569" }}>ADICIONAR RESPONSÁVEL</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <input type="email" className="text-input" value={parentSearchEmail} onChange={e => setParentSearchEmail(e.target.value)} placeholder="E-mail" style={{ background: "white" }} />
                      
                      {parentSearchEmail.trim().length > 3 && !isEmailExisting && (
                        <div>
                          <input type="text" className="text-input" value={parentNewName} onChange={e => setParentNewName(e.target.value)} placeholder="Nome Completo" style={{ background: "white" }} />
                          <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#F59E0B" }}>Novo responsável será cadastrado.</p>
                        </div>
                      )}

                      <button 
                        type="button" 
                        onClick={handleLinkParent}
                        disabled={saving || !parentSearchEmail || (!isEmailExisting && !parentNewName)}
                        style={{ padding: "10px", background: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                      >
                        {saving ? "..." : (isEmailExisting ? "Vincular Existente" : "Cadastrar e Vincular")}
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ width: "100%", padding: 12, background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Fechar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
