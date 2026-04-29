"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getAvisos, saveAviso, deleteAviso } from "@/lib/firestore";
import { Aviso } from "@/types";

export default function AdminMuralPage() {
  const { profile } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState<"info" | "alerta" | "urgente">("info");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.escolaId) {
      setLoading(false);
      return;
    }
    loadAvisos();
  }, [profile]);

  async function loadAvisos() {
    setLoading(true);
    try {
      const data = await getAvisos(profile!.escolaId!);
      setAvisos(data);
    } catch (error) {
      console.error("Error loading avisos:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.escolaId || !titulo.trim() || !mensagem.trim()) return;

    setSaving(true);
    try {
      const novoAviso: Aviso = {
        id: Math.random().toString(36).substring(2, 9),
        escolaId: profile.escolaId,
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        tipo,
        criadoEm: new Date().toISOString(),
        ativo: true,
      };

      await saveAviso(novoAviso);
      await loadAvisos();
      
      // Reset form
      setTitulo("");
      setMensagem("");
      setTipo("info");
      setShowForm(false);
    } catch (error) {
      console.error("Error saving aviso:", error);
      alert("Erro ao salvar aviso.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este aviso?")) return;
    
    try {
      await deleteAviso(id);
      await loadAvisos();
    } catch (error) {
      console.error("Error deleting aviso:", error);
      alert("Erro ao excluir aviso.");
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <header style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>Mural de Avisos</h1>
          <p style={{ color: "#64748B", margin: 0 }}>Gerencie os avisos que aparecem para todos os pais.</p>
        </div>
        <button 
          className="btn btn--primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "+ Novo Aviso"}
        </button>
      </header>

      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 32 }}>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Título</label>
              <input 
                type="text" 
                className="text-input" 
                value={titulo} 
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Reunião de Pais"
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Mensagem</label>
              <textarea 
                className="text-input" 
                value={mensagem} 
                onChange={e => setMensagem(e.target.value)}
                placeholder="Detalhes do aviso..."
                rows={4}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Tipo de Aviso</label>
              <select className="text-input" value={tipo} onChange={e => setTipo(e.target.value as any)}>
                <option value="info">Informação (Azul)</option>
                <option value="alerta">Alerta (Amarelo)</option>
                <option value="urgente">Urgente (Vermelho)</option>
              </select>
            </div>
            <button 
              type="submit" 
              className="btn btn--primary" 
              disabled={saving || !titulo.trim() || !mensagem.trim()}
              style={{ alignSelf: "flex-start", marginTop: 8 }}
            >
              {saving ? "Salvando..." : "Publicar Aviso"}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {avisos.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "#64748B" }}>
            <p style={{ fontSize: 40, margin: "0 0 16px 0" }}>📭</p>
            <p style={{ margin: 0, fontWeight: 600 }}>Nenhum aviso ativo.</p>
            <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>Clique em "+ Novo Aviso" para criar um.</p>
          </div>
        ) : (
          avisos.map(aviso => (
            <div key={aviso.id} className="card" style={{ 
              padding: 24, 
              borderLeft: `4px solid ${aviso.tipo === "urgente" ? "#EF4444" : aviso.tipo === "alerta" ? "#F59E0B" : "#3B82F6"}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 18, color: "#1E293B" }}>{aviso.titulo}</h3>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      padding: "2px 8px", 
                      borderRadius: 12,
                      background: aviso.tipo === "urgente" ? "#FEE2E2" : aviso.tipo === "alerta" ? "#FEF3C7" : "#DBEAFE",
                      color: aviso.tipo === "urgente" ? "#EF4444" : aviso.tipo === "alerta" ? "#D97706" : "#2563EB",
                      textTransform: "uppercase"
                    }}>
                      {aviso.tipo}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>
                    Publicado em: {new Date(aviso.criadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(aviso.id!)}
                  style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 8, borderRadius: 8 }}
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {aviso.mensagem}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
