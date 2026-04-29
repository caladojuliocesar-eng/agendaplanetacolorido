"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getEventos, saveEvento, deleteEvento } from "@/lib/firestore";
import { Evento } from "@/types";

export default function AdminEventosPage() {
  const { profile } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.escolaId) {
      setLoading(false);
      return;
    }
    loadEventos();
  }, [profile]);

  async function loadEventos() {
    setLoading(true);
    try {
      const data = await getEventos(profile!.escolaId!);
      // Filter out past events, maybe? Or just sort them
      setEventos(data);
    } catch (error) {
      console.error("Error loading eventos:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.escolaId || !titulo.trim() || !data.trim()) return;

    setSaving(true);
    try {
      const novoEvento: Evento = {
        id: Math.random().toString(36).substring(2, 9),
        escolaId: profile.escolaId,
        titulo: titulo.trim(),
        data,
        descricao: descricao.trim() || undefined,
        criadoEm: new Date().toISOString(),
      };

      await saveEvento(novoEvento);
      await loadEventos();
      
      // Reset form
      setTitulo("");
      setData("");
      setDescricao("");
      setShowForm(false);
    } catch (error) {
      console.error("Error saving evento:", error);
      alert("Erro ao salvar evento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este evento?")) return;
    
    try {
      await deleteEvento(id);
      await loadEventos();
    } catch (error) {
      console.error("Error deleting evento:", error);
      alert("Erro ao excluir evento.");
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <header style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>Agenda Geral</h1>
          <p style={{ color: "#64748B", margin: 0 }}>Gerencie os eventos e datas importantes da escola.</p>
        </div>
        <button 
          className="btn btn--primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "+ Novo Evento"}
        </button>
      </header>

      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 32 }}>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Título</label>
                <input 
                  type="text" 
                  className="text-input" 
                  value={titulo} 
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Festa Junina"
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Data</label>
                <input 
                  type="date" 
                  className="text-input" 
                  value={data} 
                  onChange={e => setData(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Descrição (Opcional)</label>
              <textarea 
                className="text-input" 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)}
                placeholder="Detalhes adicionais..."
                rows={2}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn--primary" 
              disabled={saving || !titulo.trim() || !data.trim()}
              style={{ alignSelf: "flex-start", marginTop: 8 }}
            >
              {saving ? "Salvando..." : "Adicionar Evento"}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {eventos.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "#64748B", gridColumn: "1 / -1" }}>
            <p style={{ fontSize: 40, margin: "0 0 16px 0" }}>📅</p>
            <p style={{ margin: 0, fontWeight: 600 }}>Nenhum evento agendado.</p>
            <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>Clique em "+ Novo Evento" para criar um.</p>
          </div>
        ) : (
          eventos.map(evento => {
            const dateObj = new Date(evento.data + "T12:00:00"); // Avoid timezone shift
            return (
              <div key={evento.id} className="card" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ 
                      background: "var(--primary-light)", 
                      color: "var(--primary-dark)", 
                      padding: "8px 12px", 
                      borderRadius: 12, 
                      textAlign: "center",
                      minWidth: 60
                    }}>
                      <span style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                        {dateObj.toLocaleDateString("pt-BR", { month: "short" })}
                      </span>
                      <span style={{ display: "block", fontSize: 24, fontWeight: 800 }}>
                        {dateObj.getDate()}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDelete(evento.id!)}
                      style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 4 }}
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "#1E293B" }}>{evento.titulo}</h3>
                  {evento.descricao && (
                    <p style={{ margin: 0, color: "#64748B", fontSize: 14, lineHeight: 1.5 }}>
                      {evento.descricao}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
