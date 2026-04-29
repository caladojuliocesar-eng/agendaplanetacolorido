"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getAvisos, getEventos } from "@/lib/firestore";
import { Aviso, Evento } from "@/types";

export default function EscolaPage() {
  const { profile } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mural" | "calendario">("mural");

  useEffect(() => {
    if (!profile?.escolaId) return;

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

    loadData();
  }, [profile]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ padding: 0 }}>
      {/* Custom Tabs inside the page */}
      <div
        style={{
          display: "flex",
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 60, // below header
          zIndex: 40,
        }}
      >
        <button
          onClick={() => setActiveTab("mural")}
          style={{
            flex: 1,
            padding: "16px 0",
            background: "none",
            border: "none",
            borderBottom: activeTab === "mural" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "mural" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: activeTab === "mural" ? 700 : 500,
            fontSize: "15px",
            fontFamily: "Quicksand",
            cursor: "pointer",
          }}
        >
          Mural de Avisos
        </button>
        <button
          onClick={() => setActiveTab("calendario")}
          style={{
            flex: 1,
            padding: "16px 0",
            background: "none",
            border: "none",
            borderBottom: activeTab === "calendario" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "calendario" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: activeTab === "calendario" ? 700 : 500,
            fontSize: "15px",
            fontFamily: "Quicksand",
            cursor: "pointer",
          }}
        >
          Calendário Escolar
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {activeTab === "mural" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {avisos.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
                Nenhum aviso no momento.
              </p>
            ) : (
              avisos.map((aviso) => (
                <div
                  key={aviso.id}
                  className="card"
                  style={{
                    borderLeft: `4px solid ${aviso.tipo === "urgente" ? "var(--danger)" : aviso.tipo === "alerta" ? "var(--warning)" : "var(--primary)"}`,
                  }}
                >
                  {aviso.tipo === "urgente" && (
                    <div
                      style={{
                        background: "var(--danger-light)",
                        color: "var(--danger)",
                        padding: "4px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      Urgente
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: 4 }}>
                      {new Date(aviso.criadoEm).toLocaleDateString("pt-BR")}
                    </div>
                    <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)" }}>{aviso.titulo}</h3>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px", whiteSpace: "pre-wrap" }}>
                      {aviso.mensagem}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "calendario" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {eventos.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
                Nenhum evento agendado.
              </p>
            ) : (
              eventos.map((evento) => {
                const dateObj = new Date(evento.data + "T12:00:00");
                const day = dateObj.getDate().toString().padStart(2, "0");
                const month = dateObj.toLocaleDateString("pt-BR", { month: "short" }).toUpperCase();
                
                return (
                  <div
                    key={evento.id}
                    className="card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        background: "var(--primary-light)",
                        color: "var(--primary-dark)",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 70,
                        borderRight: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ fontSize: 24, fontWeight: 700 }}>{day}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{month}</span>
                    </div>
                    <div style={{ padding: "16px", flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: 15, color: "var(--text-primary)" }}>
                        {evento.titulo}
                      </h4>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
