"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getAllUsers, addUser, updateUser, deleteUser } from "@/lib/firestore";
import { UserProfile, UserRole } from "@/types";

export default function UsuariosAdminPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    role: "professor" as UserRole,
    turma: ""
  });

  useEffect(() => {
    if (profile?.escolaId) {
      loadUsers();
    }
  }, [profile]);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getAllUsers(profile!.escolaId!);
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const formatCPF = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanCpf = formData.cpf.replace(/\D/g, "");
      if (cleanCpf.length !== 11) {
        alert("Por favor, preencha um CPF válido com 11 dígitos.");
        setSaving(false);
        return;
      }
      await addUser({
        nome: formData.nome,
        email: formData.email,
        cpf: cleanCpf,
        role: formData.role,
        turma: formData.turma,
        escolaId: profile!.escolaId!,
      } as any);
      setIsModalOpen(false);
      setFormData({ nome: "", email: "", cpf: "", role: "professor", turma: "" });
      await loadUsers();
    } catch (error) {
      alert("Erro ao adicionar usuário.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userNome: string) => {
    if (userId === profile?.uid) {
      alert("Operação negada: Você não pode excluir o seu próprio usuário de login atual.");
      return;
    }

    const confirmDelete = window.confirm(`ATENÇÃO: Tem certeza absoluta de que deseja excluir o integrante "${userNome}"?\n\nEsta ação removerá o perfil do banco de dados e ele perderá imediatamente o acesso ao aplicativo escolar.`);
    if (!confirmDelete) return;

    setSaving(true);
    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Erro ao deletar usuário do banco.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B" }}>Equipe e Usuários</h1>
          <p style={{ color: "#64748B" }}>Gerencie quem tem acesso ao painel da escola.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setIsModalOpen(true)}>+ Novo Integrante</button>
      </header>

      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#F8FAFC" }}>
            <tr>
              <th style={{ padding: 16, textAlign: "left" }}>Nome</th>
              <th style={{ padding: 16, textAlign: "left" }}>CPF (Login)</th>
              <th style={{ padding: 16, textAlign: "left" }}>E-mail</th>
              <th style={{ padding: 16, textAlign: "left" }}>Cargo</th>
              <th style={{ padding: 16, textAlign: "left" }}>Turma</th>
              <th style={{ padding: 16, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.uid} style={{ borderTop: "1px solid #F1F5F9" }}>
                <td style={{ padding: 16, fontWeight: 600 }}>{u.nome}</td>
                <td style={{ padding: 16 }}>{u.cpf ? formatCPF(u.cpf) : "---"}</td>
                <td style={{ padding: 16 }}>{u.email || "---"}</td>
                <td style={{ padding: 16 }}>
                  {(() => {
                    let label = u.role.toUpperCase();
                    let bgColor = "#DBEAFE";
                    let textColor = "#1E40AF";

                    if (u.role === "admin") {
                      label = "ADMIN";
                      bgColor = "#FEF3C7";
                      textColor = "#92400E";
                    } else if (u.role === "professor") {
                      label = "PROFESSOR";
                      bgColor = "#EEF2FF";
                      textColor = "#4338CA";
                    } else {
                      label = "RESPONSÁVEL";
                      bgColor = "#F1F5F9";
                      textColor = "#475569";
                    }

                    return (
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: 6, 
                        fontSize: 12, 
                        fontWeight: 700,
                        background: bgColor,
                        color: textColor
                      }}>
                        {label}
                      </span>
                    );
                  })()}
                </td>
                <td style={{ padding: 16 }}>{u.turma || "---"}</td>
                <td style={{ padding: 16, textAlign: "right" }}>
                  {u.uid !== profile?.uid ? (
                    <button
                      onClick={() => handleDeleteUser(u.uid, u.nome)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: 13,
                        padding: "4px 8px",
                      }}
                      title="Excluir Integrante"
                    >
                      🗑️ Excluir
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600, paddingRight: 8 }}>Você</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: "100%", maxWidth: 400, padding: 32, margin: "auto" }}>
            <h2 style={{ marginBottom: 24 }}>Novo Integrante</h2>
            <form onSubmit={handleAddUser} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>NOME</label>
                <input required className="text-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Ana Silva" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>CPF (LOGIN) *</label>
                <input required className="text-input" maxLength={14} value={formData.cpf} onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})} placeholder="000.000.000-00" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>E-MAIL</label>
                <input type="email" className="text-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@escola.com" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>CARGO</label>
                <select className="text-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value="admin">Administrador</option>
                  <option value="professor">Professor</option>
                </select>
              </div>
              {formData.role === "professor" && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>TURMA</label>
                  <input className="text-input" value={formData.turma} onChange={e => setFormData({...formData, turma: e.target.value})} placeholder="Ex: Infantil I" />
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", cursor: "pointer" }}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn btn--primary" style={{ flex: 1 }}>{saving ? "Salvando..." : "Cadastrar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
