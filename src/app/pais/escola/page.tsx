"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { 
  getAvisos, 
  getEventos, 
  getStudentsByParent, 
  getCoordinationChat, 
  saveCoordinationMessage, 
  markCoordinationChatRead,
  getTodayDateString,
  getRelatoriosByAluno,
  updateStudentFamilyProfile
} from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Aviso, Evento, Student, RelatorioPedagogico, AutorizadoRetirada } from "@/types";

export default function EscolaPage() {
  const { profile } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mural" | "calendario" | "coordenacao" | "relatorios" | "perfil">("mural");

  // Coordination Chat States
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  // Parent dismissed notices list
  const [dismissedAvisos, setDismissedAvisos] = useState<string[]>([]);

  // Pedagogical reports states
  const [reports, setReports] = useState<RelatorioPedagogico[]>([]);
  const [viewingReport, setViewingReport] = useState<RelatorioPedagogico | null>(null);

  // Profile editing states
  const [profileAddress, setProfileAddress] = useState("");
  const [profileAutorizados, setProfileAutorizados] = useState<AutorizadoRetirada[]>([]);
  const [profileFotoUrl, setProfileFotoUrl] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [newAutorizado, setNewAutorizado] = useState({ nome: "", parentesco: "", documento: "" });

  useEffect(() => {
    if (!selectedStudent) return;
    getRelatoriosByAluno(selectedStudent.id)
      .then(setReports)
      .catch(console.error);

    setProfileAddress(selectedStudent.endereco || "");
    setProfileAutorizados(selectedStudent.autorizadosRetirada || []);
    setProfileFotoUrl(selectedStudent.fotoUrl || null);
  }, [selectedStudent]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dismissed_avisos");
      if (stored) {
        try {
          setDismissedAvisos(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  const handleDismissAviso = (avisoId: string) => {
    const updated = [...dismissedAvisos, avisoId];
    setDismissedAvisos(updated);
    localStorage.setItem("dismissed_avisos", JSON.stringify(updated));
  };

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

  const handleStudentPhotoUpload = async (file: File) => {
    if (!selectedStudent || !profile?.escolaId) return;
    setUploadingFoto(true);
    try {
      const fileRef = ref(storage(), `alunos/${profile.escolaId}/${selectedStudent.id}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setProfileFotoUrl(url);
    } catch (err) {
      console.error("Erro no upload da foto do aluno:", err);
      alert("Erro ao enviar foto do aluno.");
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleAddAutorizado = () => {
    if (!newAutorizado.nome.trim()) {
      alert("Preencha o nome da pessoa autorizada.");
      return;
    }
    setProfileAutorizados(prev => [
      ...prev,
      {
        nome: newAutorizado.nome.trim(),
        parentesco: newAutorizado.parentesco.trim() || "Autorizado",
        documento: newAutorizado.documento.trim() || ""
      }
    ]);
    setNewAutorizado({ nome: "", parentesco: "", documento: "" });
  };

  const handleRemoveAutorizado = (index: number) => {
    setProfileAutorizados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveFamilyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !profile?.escolaId) return;
    setSavingProfile(true);

    try {
      // Build summary text for audit notification
      const changes: string[] = [];
      if (profileFotoUrl !== selectedStudent.fotoUrl) changes.push("Nova Foto de Perfil");
      if (profileAddress !== (selectedStudent.endereco || "")) changes.push("Endereço Atualizado");
      if (JSON.stringify(profileAutorizados) !== JSON.stringify(selectedStudent.autorizadosRetirada || [])) {
        changes.push(`Lista de Autorizados (${profileAutorizados.length} autorizados)`);
      }

      const summaryText = changes.length > 0 ? changes.join(", ") : "Dados Cadastrais";

      await updateStudentFamilyProfile(
        selectedStudent.id,
        {
          fotoUrl: profileFotoUrl,
          endereco: profileAddress,
          autorizadosRetirada: profileAutorizados
        },
        profile.nome || "Família",
        selectedStudent.nome,
        profile.escolaId,
        summaryText
      );

      // Update local state
      setSelectedStudent(prev => prev ? {
        ...prev,
        fotoUrl: profileFotoUrl,
        endereco: profileAddress,
        autorizadosRetirada: profileAutorizados
      } : null);

      alert("Perfil cadastral atualizado com sucesso! A coordenação foi notificada.");
    } catch (err) {
      console.error("Erro ao salvar perfil da família:", err);
      alert("Erro ao salvar alterações no perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const todayStr = getTodayDateString();
  const visibleEventos = eventos.filter(evento => evento.data >= todayStr);

  const visibleAvisos = avisos.filter(aviso => {
    if (dismissedAvisos.includes(aviso.id)) return false;
    if (!aviso.turma || aviso.turma === "geral") return true;
    if (selectedStudent && aviso.turma === selectedStudent.turma) return true;
    return false;
  });

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ padding: 0 }}>
      {/* CSS customizado para esconder barra de rolagem */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />

      {/* Custom Tabs inside the page */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 60, // below header
          zIndex: 40,
          padding: "0 4px",
        }}
      >
        <button
          onClick={() => setActiveTab("mural")}
          style={{
            padding: "12px 4px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "mural" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "mural" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: activeTab === "mural" ? 700 : 500,
            fontSize: "11px",
            fontFamily: "Quicksand",
            cursor: "pointer",
            textAlign: "center",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden"
          }}
        >
          Mural
        </button>
        <button
          onClick={() => setActiveTab("calendario")}
          style={{
            padding: "12px 4px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "calendario" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "calendario" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: activeTab === "calendario" ? 700 : 500,
            fontSize: "11px",
            fontFamily: "Quicksand",
            cursor: "pointer",
            textAlign: "center",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden"
          }}
        >
          Calendário
        </button>
        <button
          onClick={() => setActiveTab("coordenacao")}
          style={{
            padding: "12px 4px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "coordenacao" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "coordenacao" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: activeTab === "coordenacao" ? 700 : 500,
            fontSize: "11px",
            fontFamily: "Quicksand",
            cursor: "pointer",
            textAlign: "center",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden"
          }}
        >
          Coordenação
        </button>
        <button
          onClick={() => {
            setActiveTab("relatorios");
            setViewingReport(null);
          }}
          style={{
            padding: "12px 4px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "relatorios" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "relatorios" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: activeTab === "relatorios" ? 700 : 500,
            fontSize: "11px",
            fontFamily: "Quicksand",
            cursor: "pointer",
            textAlign: "center",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden"
          }}
        >
          📊 Relatórios
        </button>
        <button
          onClick={() => setActiveTab("perfil")}
          style={{
            padding: "12px 4px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "perfil" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "perfil" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: activeTab === "perfil" ? 700 : 500,
            fontSize: "11px",
            fontFamily: "Quicksand",
            cursor: "pointer",
            textAlign: "center",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden"
          }}
        >
          👤 Perfil
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {activeTab === "mural" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {visibleAvisos.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
                Nenhum aviso no momento.
              </p>
            ) : (
              visibleAvisos.map((aviso) => (
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
                  <div style={{ padding: 16, position: "relative" }}>
                    <button
                      onClick={() => handleDismissAviso(aviso.id)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 12,
                        background: "none",
                        border: "none",
                        fontSize: 11,
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      ✕ Ocultar
                    </button>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: 4 }}>
                      {new Date(aviso.criadoEm).toLocaleDateString("pt-BR")}
                    </div>
                    <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", paddingRight: 60 }}>{aviso.titulo}</h3>
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
            {visibleEventos.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
                Nenhum evento agendado.
              </p>
            ) : (
              visibleEventos.map((evento) => {
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

        {activeTab === "relatorios" && selectedStudent && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {viewingReport ? (
              <div style={{ background: "white", padding: "32px 24px", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <button 
                  onClick={() => setViewingReport(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 20,
                    padding: 0
                  }}
                >
                  ← Voltar aos Relatórios
                </button>
                <div style={{ textAlign: "center", borderBottom: "2px solid #F1F5F9", paddingBottom: 16, marginBottom: 24 }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#0F172A" }}>Escola Planeta Colorido</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                    Relatório Pedagógico Trimestral — {viewingReport.periodo.replace("-T", "º Trimestre ")}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
                    Aluno(a): <strong>{selectedStudent.nome}</strong>
                  </p>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#334155" }}>
                  {viewingReport.conteudo.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 18, color: "#1E293B", marginTop: 20, fontWeight: 800 }}>{line.replace('## ', '')}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 16, color: "#1E293B", marginTop: 16, fontWeight: 700 }}>{line.replace('### ', '')}</h3>;
                    if (line.startsWith('# ')) return <h2 key={i} style={{ fontSize: 20, color: "#1E293B", marginTop: 24, fontWeight: 800 }}>{line.replace('# ', '')}</h2>;
                    
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={i} style={{ margin: "0 0 10px 0", minHeight: line.trim() === "" ? 10 : "auto" }}>
                        {parts.map((part, j) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j}>{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Selector of multiple kids if exists */}
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

                {/* List of Periods */}
                {["2026-T1", "2026-T2", "2026-T3", "2026-Anual"].map(period => {
                  const rep = reports.find(r => r.periodo === period);
                  const isApproved = rep && rep.status === "aprovado";
                  const isReleased = rep && rep.liberado;

                  let labelPeriod = period === "2026-Anual" ? "Consolidado Anual de Evolução" : `${period.split("-")[1].replace("T", "")}º Trimestre de ${period.split("-")[0]}`;

                  if (isApproved && isReleased) {
                    return (
                      <div key={period} className="card" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid var(--success)" }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 15, color: "#1E293B", fontWeight: 700 }}>{labelPeriod}</h4>
                          <span style={{ fontSize: 11, color: "#059669", fontWeight: 600, display: "inline-block", marginTop: 4 }}>🔓 Disponível para Visualização</span>
                        </div>
                        <button 
                          onClick={() => setViewingReport(rep)}
                          className="btn btn--primary" 
                          style={{ padding: "8px 16px", fontSize: 12 }}
                        >
                          📄 Abrir Relatório
                        </button>
                      </div>
                    );
                  } else if (rep && !isReleased) {
                    return (
                      <div key={period} className="card" style={{ padding: 20, borderLeft: "4px solid var(--danger)", background: "#FFFBFB" }}>
                        <h4 style={{ margin: 0, fontSize: 15, color: "#9F1239", fontWeight: 700 }}>🔒 {labelPeriod}</h4>
                        <p style={{ margin: "8px 0 0 0", fontSize: 13, lineHeight: 1.5, color: "#9F1239" }}>
                          Relatório Indisponível. Documento liberado mediante presença na Reunião de Pais presencial de alinhamento pedagógico. Para orientações, entre em contato com a secretaria.
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div key={period} className="card" style={{ padding: 20, borderLeft: "4px solid var(--border)", opacity: 0.7 }}>
                        <h4 style={{ margin: 0, fontSize: 15, color: "var(--text-muted)", fontWeight: 700 }}>⏳ {labelPeriod}</h4>
                        <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                          Relatório em processamento ou aguardando preenchimento pela equipe pedagógica.
                        </p>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "perfil" && selectedStudent && (
          <form onSubmit={handleSaveFamilyProfile} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Student selector if multiple children */}
            {students.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 8, overflowX: "auto" }}>
                {students.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`btn ${selectedStudent?.id === s.id ? "btn--primary" : "btn--secondary"}`}
                    style={{ fontSize: 13, padding: "8px 16px", whiteSpace: "nowrap" }}
                    onClick={() => setSelectedStudent(s)}
                  >
                    {s.nome}
                  </button>
                ))}
              </div>
            )}

            {/* Photo Section */}
            <div className="card" style={{ padding: 20, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 88, height: 88, borderRadius: "50%", background: "#F1F5F9", border: "3px solid var(--primary)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 12 }}>
                {profileFotoUrl ? (
                  <img src={profileFotoUrl} alt={selectedStudent.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  "👶"
                )}
              </div>
              <input
                type="file"
                id="parent-student-photo"
                accept="image/*"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await handleStudentPhotoUpload(file);
                }}
              />
              <label
                htmlFor="parent-student-photo"
                style={{
                  background: "#FFF7ED",
                  color: "#C2410C",
                  border: "1px solid #FFEDD5",
                  padding: "8px 16px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {uploadingFoto ? "Enviando Foto..." : "📷 Alterar Foto do Aluno"}
              </label>
            </div>

            {/* Read-Only Administrative Info */}
            <div className="card" style={{ padding: 20, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🔒 Informações Escolares (Apenas Secretaria)
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, fontSize: 13 }}>
                <div>
                  <span style={{ color: "#64748B", fontSize: 11, display: "block" }}>TURMA</span>
                  <strong style={{ color: "#1E293B" }}>{selectedStudent.turma}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: 11, display: "block" }}>MATRÍCULA / ID</span>
                  <strong style={{ color: "#1E293B", fontFamily: "monospace" }}>{selectedStudent.id.substring(0, 8)}</strong>
                </div>
              </div>
            </div>

            {/* Address Editable */}
            <div className="card" style={{ padding: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#1E293B", marginBottom: 8 }}>
                🏠 Endereço Residencial
              </label>
              <input
                type="text"
                className="text-input"
                placeholder="Rua, número, bairro, CEP..."
                value={profileAddress}
                onChange={e => setProfileAddress(e.target.value)}
                style={{ fontSize: 13 }}
              />
            </div>

            {/* Authorized Pickup List */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1E293B" }}>
                    🚗 Pessoas Autorizadas a Retirar o Aluno
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748B" }}>
                    A escola exige autorização formal para entregar a criança.
                  </p>
                </div>
              </div>

              {profileAutorizados.length === 0 ? (
                <div style={{ padding: 16, background: "#F8FAFC", borderRadius: 12, textAlign: "center", color: "#94A3B8", fontSize: 12, marginBottom: 16 }}>
                  Nenhum autorizado cadastrado além dos pais.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {profileAutorizados.map((aut, idx) => (
                    <div key={idx} style={{ padding: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: 13, color: "#1E293B" }}>{aut.nome}</strong>
                        <div style={{ fontSize: 11, color: "#64748B" }}>
                          {aut.parentesco} {aut.documento ? `• Doc: ${aut.documento}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAutorizado(idx)}
                        style={{ background: "#FEE2E2", color: "#EF4444", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Form to add authorized person */}
              <div style={{ background: "#F1F5F9", padding: 14, borderRadius: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>+ Adicionar Nova Pessoa Autorizada</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Nome Completo *"
                    className="text-input"
                    style={{ fontSize: 12 }}
                    value={newAutorizado.nome}
                    onChange={e => setNewAutorizado({...newAutorizado, nome: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Parentesco (ex: Tio, Avó, Perua)"
                    className="text-input"
                    style={{ fontSize: 12 }}
                    value={newAutorizado.parentesco}
                    onChange={e => setNewAutorizado({...newAutorizado, parentesco: e.target.value})}
                  />
                </div>
                <input
                  type="text"
                  placeholder="CPF ou RG para identificação na portaria"
                  className="text-input"
                  style={{ fontSize: 12 }}
                  value={newAutorizado.documento}
                  onChange={e => setNewAutorizado({...newAutorizado, documento: e.target.value})}
                />
                <button
                  type="button"
                  onClick={handleAddAutorizado}
                  style={{ background: "#0284C7", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", alignSelf: "flex-end" }}
                >
                  + Incluir Autorizado
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={savingProfile}
              className="btn btn--primary btn--lg btn--block"
              style={{ padding: "14px", fontSize: 14, fontWeight: 700 }}
            >
              {savingProfile ? "Salvação em andamento..." : "💾 Salvar Alterações e Notificar Secretaria"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
