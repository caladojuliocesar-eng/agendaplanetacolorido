"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getAvisos, saveAviso, deleteAviso, getEventos, saveEvento, deleteEvento } from "@/lib/firestore";
import { Aviso, Evento } from "@/types";
import { v4 as uuidv4 } from "uuid";

export default function EscolaAdminPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"mural" | "calendario">("mural");
  const [loading, setLoading] = useState(true);

  // Mural State
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [avisoTitulo, setAvisoTitulo] = useState("");
  const [avisoTexto, setAvisoTexto] = useState("");
  const [avisoImportante, setAvisoImportante] = useState(false);
  const [savingAviso, setSavingAviso] = useState(false);

  // Calendar State
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoTitulo, setEventoTitulo] = useState("");
  const [eventoData, setEventoData] = useState("");
  const [savingEvento, setSavingEvento] = useState(false);

  useEffect(() => {
    if (!profile?.escolaId) return;
    loadData();
  }, [profile]);

  async function loadData() {
    try {
      const [avs, evs] = await Promise.all([
        getAvisos(profile!.escolaId),
        getEventos(profile!.escolaId),
      ]);
      setAvisos(avs);
      setEventos(evs);
    } catch (error) {
      console.error("Failed to load school info:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- Handlers ---

  async function handleAddAviso(e: React.FormEvent) {
    e.preventDefault();
    if (!avisoTitulo.trim() || !avisoTexto.trim() || !profile?.escolaId) return;

    setSavingAviso(true);
    try {
      const newAviso: Aviso = {
        id: uuidv4(),
        escolaId: profile.escolaId,
        titulo: avisoTitulo.trim(),
        mensagem: avisoTexto.trim(),
        tipo: avisoImportante ? "urgente" : "info",
        ativo: true,
        criadoEm: new Date().toISOString(),
      };
      await saveAviso(newAviso);
      setAvisoTitulo("");
      setAvisoTexto("");
      setAvisoImportante(false);
      await loadData();
    } catch (err) {
      alert("Erro ao salvar aviso.");
    } finally {
      setSavingAviso(false);
    }
  }

  async function handleDeleteAviso(id: string) {
    if (!confirm("Tem certeza que deseja apagar este aviso?")) return;
    try {
      await deleteAviso(id);
      await loadData();
    } catch (err) {
      alert("Erro ao deletar aviso.");
    }
  }

  async function handleAddEvento(e: React.FormEvent) {
    e.preventDefault();
    if (!eventoTitulo.trim() || !eventoData || !profile?.escolaId) return;

    setSavingEvento(true);
    try {
      const newEvento: Evento = {
        id: uuidv4(),
        escolaId: profile.escolaId,
        titulo: eventoTitulo.trim(),
        data: eventoData,
        criadoEm: new Date().toISOString(),
      };
      await saveEvento(newEvento);
      setEventoTitulo("");
      setEventoData("");
      await loadData();
    } catch (err) {
      alert("Erro ao salvar evento.");
    } finally {
      setSavingEvento(false);
    }
  }

  async function handleDeleteEvento(id: string) {
    if (!confirm("Tem certeza que deseja apagar este evento?")) return;
    try {
      await deleteEvento(id);
      await loadData();
    } catch (err) {
      alert("Erro ao deletar evento.");
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ padding: 0 }}>
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 60,
          zIndex: 40,
        }}
      >
        <button
          onClick={() => setActiveTab("mural")}
          style={{
            flex: 1,
            padding: "16px 8px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "mural" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "mural" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: activeTab === "mural" ? 700 : 500,
            fontSize: "14px",
            fontFamily: "Quicksand",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {/* Label curta para mobile, longa para desktop se necessário, mas aqui vamos simplificar */}
          📢 Mural
        </button>
        <button
          onClick={() => setActiveTab("calendario")}
          style={{
            flex: 1,
            padding: "16px 8px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "calendario" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "calendario" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: activeTab === "calendario" ? 700 : 500,
            fontSize: "14px",
            fontFamily: "Quicksand",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          🗓️ Calendário
        </button>
      </div>

      <div style={{ padding: "20px 16px 120px" }}>
        {activeTab === "mural" && (
          <div>
            <form onSubmit={handleAddAviso} className="card" style={{ padding: 20, marginBottom: 32, display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 className="section-title" style={{ margin: 0, padding: 0, color: "var(--primary)" }}>Novo Comunicado</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Título</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Ex: Reunião de Pais"
                  value={avisoTitulo}
                  onChange={(e) => setAvisoTitulo(e.target.value)}
                  required
                />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Mensagem</label>
                <textarea
                  className="text-input"
                  placeholder="Escreva os detalhes aqui..."
                  value={avisoTexto}
                  onChange={(e) => setAvisoTexto(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <label style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 10, 
                color: "var(--text-primary)", 
                fontSize: 14,
                padding: "8px 12px",
                background: avisoImportante ? "var(--danger-light)" : "var(--bg-app)",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${avisoImportante ? "var(--danger)" : "var(--border)"}`,
                transition: "all 0.2s"
              }}>
                <input
                  type="checkbox"
                  checked={avisoImportante}
                  onChange={(e) => setAvisoImportante(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: "var(--danger)" }}
                />
                <span>Marcar como <strong>Urgente / Importante</strong></span>
              </label>

              <button type="submit" className="btn btn--primary btn--block" disabled={savingAviso} style={{ marginTop: 8 }}>
                {savingAviso ? "Publicando..." : "🚀 Publicar no Mural"}
              </button>
            </form>

            <h2 className="section-title">Histórico de Avisos</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {avisos.length === 0 && <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>Nenhum aviso publicado.</p>}
              {avisos.map((aviso) => (
                <div key={aviso.id} className="card" style={{ padding: 0, borderLeft: aviso.tipo === "urgente" ? "6px solid var(--danger)" : "1px solid var(--border)" }}>
                  <div style={{ padding: 16, display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {new Date(aviso.criadoEm).toLocaleDateString("pt-BR")}
                        </span>
                        {aviso.tipo === "urgente" && (
                          <span style={{ 
                            fontSize: 9, 
                            background: "var(--danger)", 
                            color: "white", 
                            padding: "2px 6px", 
                            borderRadius: 4, 
                            fontWeight: 800,
                            textTransform: "uppercase" 
                          }}>Importante</span>
                        )}
                      </div>
                      <h3 style={{ margin: "0 0 6px 0", fontSize: 16, color: "var(--text-primary)", lineHeight: 1.2 }}>{aviso.titulo}</h3>
                      <p style={{ 
                        margin: 0, 
                        fontSize: 13, 
                        color: "var(--text-secondary)", 
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap"
                      }}>
                        {aviso.mensagem}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteAviso(aviso.id)}
                      style={{ 
                        background: "var(--danger-light)", 
                        border: "none", 
                        color: "var(--danger)", 
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18, 
                        cursor: "pointer",
                        flexShrink: 0
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "calendario" && (
          <div>
            <form onSubmit={handleAddEvento} className="card" style={{ padding: 20, marginBottom: 32, display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 className="section-title" style={{ margin: 0, padding: 0, color: "var(--primary)" }}>Agendar Evento</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>O que vai acontecer?</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Ex: Festa Junina"
                  value={eventoTitulo}
                  onChange={(e) => setEventoTitulo(e.target.value)}
                  required
                />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Data</label>
                <input
                  type="date"
                  className="text-input"
                  value={eventoData}
                  onChange={(e) => setEventoData(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn--primary btn--block" disabled={savingEvento} style={{ marginTop: 8 }}>
                {savingEvento ? "Salvando..." : "📅 Adicionar ao Calendário"}
              </button>
            </form>

            <h2 className="section-title">Próximas Datas</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {eventos.length === 0 && <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>Nenhum evento agendado.</p>}
              {eventos.map((evento) => (
                <div key={evento.id} className="card" style={{ display: "flex", alignItems: "center", padding: 0 }}>
                   <div style={{ 
                     background: "var(--primary-light)", 
                     padding: "12px", 
                     minWidth: 65, 
                     textAlign: "center", 
                     borderRight: "1px solid var(--border)",
                     display: "flex",
                     flexDirection: "column"
                   }}>
                     <span style={{ fontSize: 20, fontWeight: 800, color: "var(--primary-dark)", lineHeight: 1 }}>
                       {evento.data.split("-")[2]}
                     </span>
                     <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary-dark)", textTransform: "uppercase" }}>
                       {new Date(evento.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                     </span>
                   </div>
                   <div style={{ flex: 1, padding: "0 16px" }}>
                     <h4 style={{ margin: 0, fontSize: 15, color: "var(--text-primary)", fontWeight: 600 }}>{evento.titulo}</h4>
                   </div>
                   <button 
                      onClick={() => handleDeleteEvento(evento.id)}
                      style={{ 
                        background: "none", 
                        border: "none", 
                        color: "var(--danger)", 
                        fontSize: 22, 
                        cursor: "pointer", 
                        padding: "12px 16px",
                        opacity: 0.7
                      }}
                    >
                      🗑️
                    </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
