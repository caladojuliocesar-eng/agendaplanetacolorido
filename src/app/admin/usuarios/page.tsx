"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getAllUsers, addUser, updateUser, getAllStudents } from "@/lib/firestore";
import { UserProfile, Student } from "@/types";

export default function UsuariosAdminPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  const [formData, setFormData] = useState<{
    nome: string;
    email: string;
    role: string;
    turma?: string;
    filhos: string[];
  }>({ nome: "", email: "", role: "pai", filhos: [] });
  
  const [saving, setSaving] = useState(false);
  
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  useEffect(() => {
    if (!profile?.escolaId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const [usersData, studentsData] = await Promise.all([
          getAllUsers(profile!.escolaId!),
          getAllStudents(profile!.escolaId!)
        ]);
        setUsers(usersData);
        setStudents(studentsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [profile]);

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const turmasAtuais = Array.from(new Set(students.map(s => s.turma))).sort();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <span style={{ padding: "4px 8px", background: "#FEE2E2", color: "#B91C1C", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Diretoria</span>;
      case "professor": return <span style={{ padding: "4px 8px", background: "#FEF3C7", color: "#B45309", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Professor</span>;
      case "pai": return <span style={{ padding: "4px 8px", background: "#D1FAE5", color: "#047857", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Responsável</span>;
      default: return <span>{role}</span>;
    }
  };

  const handleOpenModal = (user?: UserProfile) => {
    if (user) {
      setEditingUser(user);
      setFormData({ 
        nome: user.nome, 
        email: user.email, 
        role: user.role,
        turma: user.turma || "",
        filhos: user.filhos || []
      });
    } else {
      setEditingUser(null);
      setFormData({ nome: "", email: "", role: "pai", filhos: [], turma: "" });
    }
    setStudentSearchTerm("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<UserProfile> = {
        nome: formData.nome,
        email: formData.email,
        role: formData.role as "pai"|"professor"|"admin",
      };

      if (formData.role === "pai") {
        payload.filhos = formData.filhos;
        payload.turma = "";
      } else if (formData.role === "professor") {
        payload.turma = formData.turma;
        payload.filhos = [];
      } else {
        payload.turma = "";
        payload.filhos = [];
      }

      if (editingUser) {
        await updateUser(editingUser.uid, payload);
      } else {
        await addUser({
          ...payload,
          escolaId: profile!.escolaId!,
          criadoEm: new Date().toISOString()
        } as Omit<UserProfile, "uid">);
      }
      setIsModalOpen(false);
      
      const usersData = await getAllUsers(profile!.escolaId!);
      setUsers(usersData);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  };

  const addFilho = (studentId: string) => {
    if (!formData.filhos.includes(studentId)) {
      setFormData({ ...formData, filhos: [...formData.filhos, studentId] });
      setStudentSearchTerm("");
    }
  };

  const removeFilho = (studentId: string) => {
    if (window.confirm("Tem certeza que deseja desvincular este aluno?")) {
      setFormData({
        ...formData,
        filhos: formData.filhos.filter(id => id !== studentId)
      });
    }
  };

  const alunosEncontrados = studentSearchTerm.trim().length > 1
    ? students.filter(s => s.nome.toLowerCase().includes(studentSearchTerm.toLowerCase())).slice(0, 5)
    : [];

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>Gestão de Usuários</h1>
          <p style={{ color: "#64748B", margin: 0 }}>Controle o acesso de professores, pais e coordenadores.</p>
        </div>
        <button className="btn btn--primary" onClick={() => handleOpenModal()}>
          + Novo Usuário
        </button>
      </header>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", background: "white" }}>
          <input
            type="text"
            className="text-input"
            placeholder="🔍 Buscar por nome, email ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 600 }}>
            <thead style={{ background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
              <tr>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Usuário</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Email</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Acesso</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Vínculos</th>
                <th style={{ padding: "16px 24px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 48, textAlign: "center", color: "#64748B" }}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} style={{ borderBottom: "1px solid #F1F5F9", background: "white" }}>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ fontWeight: 600, color: "#1E293B" }}>{user.nome}</span>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#64748B" }}>
                      {user.email}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      {getRoleBadge(user.role)}
                    </td>
                    <td style={{ padding: "16px 24px", color: "#64748B", fontSize: 13 }}>
                      {user.role === "pai" && user.filhos ? `${user.filhos.length} filho(s)` : ""}
                      {user.role === "professor" && user.turma ? `Turma: ${user.turma}` : ""}
                      {user.role === "admin" ? "Escola toda" : ""}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <button 
                        onClick={() => handleOpenModal(user)}
                        style={{ background: "none", border: "none", color: "#F97316", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                      >
                        Editar / Vincular
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, padding: 16, overflowY: "auto" }}>
          <div className="card" style={{ width: "100%", maxWidth: 500, padding: 32, margin: "auto", marginTop: 40, marginBottom: 40 }}>
            <h2 style={{ margin: "0 0 24px 0", fontSize: 20, color: "#1E293B" }}>
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </h2>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>NOME COMPLETO</label>
                <input required type="text" className="text-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Maria Professora" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>E-MAIL</label>
                <input required type="email" className="text-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} placeholder="Ex: maria@escola.com" disabled={!!editingUser} />
                {!!editingUser && <span style={{ fontSize: 12, color: "#94A3B8" }}>O e-mail não pode ser alterado após criado.</span>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>TIPO DE ACESSO</label>
                <select className="text-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="pai">Responsável (Pai/Mãe)</option>
                  <option value="professor">Professor</option>
                  <option value="admin">Diretoria</option>
                </select>
              </div>

              {formData.role === "professor" && (
                <div style={{ background: "#FEF3C7", padding: 16, borderRadius: 12, border: "1px solid #FDE68A" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#B45309", marginBottom: 8 }}>VINCULAR À TURMA</label>
                  <select 
                    className="text-input" 
                    value={formData.turma || ""} 
                    onChange={e => setFormData({...formData, turma: e.target.value})}
                    style={{ background: "white", borderColor: "#FCD34D" }}
                  >
                    <option value="">Selecione a turma...</option>
                    {turmasAtuais.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#92400E" }}>O professor só verá os alunos desta turma.</p>
                </div>
              )}

              {formData.role === "pai" && (
                <div style={{ background: "#F0FDF4", padding: 16, borderRadius: 12, border: "1px solid #BBF7D0" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#166534" }}>Filhos Vinculados ({formData.filhos.length})</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {formData.filhos.length === 0 ? (
                      <p style={{ margin: 0, fontSize: 13, color: "#15803D" }}>Nenhum aluno vinculado ainda.</p>
                    ) : (
                      formData.filhos.map(filhoId => {
                        const aluno = students.find(s => s.id === filhoId);
                        return (
                          <div key={filhoId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "8px 12px", borderRadius: 8, border: "1px solid #BBF7D0" }}>
                            <div>
                              <span style={{ fontWeight: 600, color: "#166534", fontSize: 14 }}>{aluno ? aluno.nome : "Aluno não encontrado"}</span>
                              {aluno && <span style={{ display: "block", fontSize: 11, color: "#15803D" }}>Turma: {aluno.turma}</span>}
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeFilho(filhoId)}
                              style={{ background: "#FEE2E2", color: "#DC2626", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                            >
                              Remover
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div style={{ borderTop: "1px dashed #86EFAC", paddingTop: 16 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 8 }}>VINCULAR NOVO ALUNO</label>
                    <input 
                      type="text" 
                      className="text-input" 
                      placeholder="🔍 Digite o nome do aluno..." 
                      value={studentSearchTerm}
                      onChange={e => setStudentSearchTerm(e.target.value)}
                      style={{ background: "white", borderColor: "#86EFAC" }}
                    />
                    
                    {alunosEncontrados.length > 0 && (
                      <div style={{ background: "white", border: "1px solid #86EFAC", borderRadius: 8, marginTop: 4, overflow: "hidden" }}>
                        {alunosEncontrados.map(aluno => (
                          <div key={aluno.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #DCFCE7" }}>
                            <div>
                              <span style={{ fontWeight: 600, color: "#166534", fontSize: 13 }}>{aluno.nome}</span>
                              <span style={{ display: "block", fontSize: 11, color: "#15803D" }}>{aluno.turma}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => addFilho(aluno.id)}
                              disabled={formData.filhos.includes(aluno.id)}
                              style={{ 
                                background: formData.filhos.includes(aluno.id) ? "#F3F4F6" : "#059669", 
                                color: formData.filhos.includes(aluno.id) ? "#9CA3AF" : "white", 
                                border: "none", 
                                padding: "4px 12px", 
                                borderRadius: 6, 
                                fontSize: 12, 
                                fontWeight: 600, 
                                cursor: formData.filhos.includes(aluno.id) ? "default" : "pointer" 
                              }}
                            >
                              {formData.filhos.includes(aluno.id) ? "Vinculado" : "Adicionar"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 12, background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn btn--primary" style={{ flex: 1 }}>{saving ? "Salvando..." : "Salvar Usuário"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
