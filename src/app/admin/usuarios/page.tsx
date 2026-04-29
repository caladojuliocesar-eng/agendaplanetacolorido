"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getAllUsers, addUser, updateUser } from "@/lib/firestore";
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addUser({
        ...formData,
        escolaId: profile!.escolaId!,
        criadoEm: new Date().toISOString()
      });
      setIsModalOpen(false);
      setFormData({ nome: "", email: "", role: "professor", turma: "" });
      await loadUsers();
    } catch (error) {
      alert("Erro ao adicionar usuário.");
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
              <th style={{ padding: 16, textAlign: "left" }}>E-mail</th>
              <th style={{ padding: 16, textAlign: "left" }}>Cargo</th>
              <th style={{ padding: 16, textAlign: "left" }}>Turma</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.uid} style={{ borderTop: "1px solid #F1F5F9" }}>
                <td style={{ padding: 16, fontWeight: 600 }}>{u.nome}</td>
                <td style={{ padding: 16 }}>{u.email}</td>
                <td style={{ padding: 16 }}>
                  <span style={{ 
                    padding: "4px 8px", 
                    borderRadius: 6, 
                    fontSize: 12, 
                    fontWeight: 700,
                    background: u.role === "admin" ? "#FEF3C7" : "#DBEAFE",
                    color: u.role === "admin" ? "#92400E" : "#1E40AF"
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: 16 }}>{u.turma || "---"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
            <h2 style={{ marginBottom: 24 }}>Novo Integrante</h2>
            <form onSubmit={handleAddUser} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>NOME</label>
                <input required className="text-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Ana Silva" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>E-MAIL</label>
                <input required type="email" className="text-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@escola.com" />
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
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none" }}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn btn--primary" style={{ flex: 1 }}>{saving ? "Salvando..." : "Cadastrar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
