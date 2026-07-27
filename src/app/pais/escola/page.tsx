"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { 
  getAvisos, 
  getEventos, 
  getStudentsByParent, 
  getCoordinationChat, 
  saveCoordinationMessage, 
  markCoordinationChatRead 
} from "@/lib/firestore";
import { Aviso, Evento, Student } from "@/types";

export default function EscolaPage() {
  const { profile } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mural" | "calendario" | "coordenacao">("mural");

  // Coordination Chat States
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

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

  // Load students (children) for the parent
  useEffect(() => {
    if (!profile?.filhos?.length) return;

    async function loadKids() {
      try {
        const kids = await getStudentsByParent(profile!.filhos!);
        setStudents(kids);
        if (kids.length > 0) {
          setSelectedStudent(kids[0]);
        }
      } catch (err) {
        console.error("Error loading kids:", err);
      }
    }
    loadKids();
  }, [profile]);

  const loadChat = async () => {
    if (!selectedStudent) return;
    try {
      const data = await getCoordinationChat(selectedStudent.id);
      if (data) {
        setChatMessages(data.mensagens || []);
        // Mark messages as read by parent
        await markCoordinationChatRead(selectedStudent.id, 'pai');
      } else {
        setChatMessages([]);
      }
    } catch (err) {
      console.error("Error loading coordination chat:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "coordenacao" && selectedStudent) {
      loadChat();
      
      const interval = setInterval(loadChat, 5000); // refresh every 5s
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedStudent]);

  const handleSendChat = async () => {
    if (!selectedStudent || !newMessage.trim() || sendingChat) return;
    setSendingChat(true);
    try {
      await saveCoordinationMessage(
        selectedStudent.id,
        newMessage.trim(),
        'pai',
        profile!.escolaId,
        selectedStudent.nome
      );
      setNewMessage("");
      await loadChat();
    } catch (err) {
      console.error("Error sending chat message:", err);
      alert("Erro ao enviar mensagem.");
    } finally {
      setSendingChat(false);
    }
  };

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
        <button
          onClick={() => setActiveTab("coordenacao")}
          style={{
            flex: 1,
            padding: "16px 0",
            background: "none",
            border: "none",
            borderBottom: activeTab === "coordenacao" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "coordenacao" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: activeTab === "coordenacao" ? 700 : 500,
            fontSize: "15px",
            fontFamily: "Quicksand",
            cursor: "pointer",
          }}
        >
          Coordenação
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

        {activeTab === "coordenacao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Child Selector if more than 1 child */}
            {students.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 8, overflowX: "auto" }}>
                {students.map((s) => (
                  <button
                    key={s.id}
                    className={`btn ${selectedStudent?.id === s.id ? "btn--primary" : "btn--secondary"}`}
                    style={{ fontSize: 13, padding: "8px 16px", whiteSpace: "nowrap" }}
                    onClick={() => setSelectedStudent(s)}
                  >
                    {s.nome}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Body */}
            <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 400 }}>
              <div style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", padding: "16px 20px" }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1E293B" }}>
                  Canal de Atendimento — Coordenação Planeta Colorido
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748B" }}>
                  Fale com a diretoria para assuntos administrativos, financeiros ou dúvidas gerais.
                </p>
              </div>

              {/* Message thread */}
              <div style={{ padding: 20, flex: 1, overflowY: "auto", background: "#FFFBF7", display: "flex", flexDirection: "column", gap: 12, minHeight: 300, maxHeight: 400 }}>
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>
                    Nenhuma mensagem enviada. Escreva abaixo para iniciar seu atendimento.
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isPai = msg.role === 'pai';
                    return (
                      <div 
                        key={msg.id || idx}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isPai ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                          alignSelf: isPai ? "flex-end" : "flex-start"
                        }}
                      >
                        <div style={{
                          padding: "10px 14px",
                          borderRadius: isPai ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          background: isPai ? "var(--primary-light)" : "white",
                          color: isPai ? "var(--primary-dark)" : "#334155",
                          border: isPai ? "1px solid var(--primary)" : "1px solid #E2E8F0",
                          fontSize: 13,
                          lineHeight: 1.4,
                          wordBreak: "break-word"
                        }}>
                          {msg.texto}
                        </div>
                        <span style={{ fontSize: 9, color: "#94A3B8", marginTop: 4, paddingLeft: 4, paddingRight: 4 }}>
                          {msg.horario} {isPai && (msg.lida ? "✓ Lida" : "✓ Enviada")}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Footer */}
              <div style={{ padding: 16, background: "white", borderTop: "1px solid #E2E8F0", display: "flex", gap: 8 }}>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Escreva sua mensagem..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      handleSendChat();
                    }
                  }}
                  style={{ flex: 1, padding: "10px 14px", fontSize: 13, height: "auto" }}
                />
                <button
                  onClick={handleSendChat}
                  disabled={sendingChat || !newMessage.trim() || !selectedStudent}
                  className="btn btn--primary"
                  style={{ fontSize: 13, padding: "8px 16px" }}
                >
                  {sendingChat ? "..." : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
