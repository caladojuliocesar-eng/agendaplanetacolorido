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
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);

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

  const handleAddAutorizado = async () => {
    if (!newAutorizado.nome.trim()) {
      alert("Preencha o nome da pessoa autorizada.");
      return;
    }
    if (!selectedStudent || !profile?.escolaId) return;

    const person: AutorizadoRetirada = {
      nome: newAutorizado.nome.trim(),
      parentesco: newAutorizado.parentesco.trim() || "Autorizado",
      documento: newAutorizado.documento.trim() || ""
    };

    const updatedList = [...profileAutorizados, person];
    setProfileAutorizados(updatedList);
    setNewAutorizado({ nome: "", parentesco: "", documento: "" });

    try {
      await updateStudentFamilyProfile(
        selectedStudent.id,
        { autorizadosRetirada: updatedList },
        profile.nome || "Família",
        selectedStudent.nome,
        profile.escolaId,
        `Nova pessoa autorizada: ${person.nome} (${person.parentesco})`
      );
      setSelectedStudent(prev => prev ? { ...prev, autorizadosRetirada: updatedList } : null);
      alert("✅ Pessoa autorizada adicionada com sucesso ao cadastro!");
    } catch (err) {
      console.error("Erro ao salvar autorizado:", err);
      alert("Erro ao salvar pessoa autorizada.");
    }
  };

  const handleRemoveAutorizado = async (index: number) => {
    if (!confirm("Deseja remover esta pessoa da lista de autorizados?")) return;
    if (!selectedStudent || !profile?.escolaId) return;

    const removedPerson = profileAutorizados[index];
    const updatedList = profileAutorizados.filter((_, i) => i !== index);
    setProfileAutorizados(updatedList);

    try {
      await updateStudentFamilyProfile(
        selectedStudent.id,
        { autorizadosRetirada: updatedList },
        profile.nome || "Família",
        selectedStudent.nome,
        profile.escolaId,
        `Pessoa autorizada removida: ${removedPerson?.nome || 'Cadastro'}`
      );
      setSelectedStudent(prev => prev ? { ...prev, autorizadosRetirada: updatedList } : null);
    } catch (err) {
      console.error("Erro ao remover autorizado:", err);
      alert("Erro ao remover autorizado.");
    }
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

  const handlePrintReport = (report: RelatorioPedagogico, studentName: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    const periodLabel = report.periodo === "2026-Anual" 
      ? "Consolidado Anual de Evolução" 
      : `${report.periodo.split("-")[1].replace("T", "")}º Trimestre de ${report.periodo.split("-")[0]}`;

    const formattedContent = report.conteudo
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/### (.*?)\n/g, '<h3 style="color:#1E293B;margin-top:16px;font-size:16px;">$1</h3>')
      .replace(/## (.*?)\n/g, '<h2 style="color:#0F172A;margin-top:20px;font-size:18px;">$1</h2>')
      .replace(/# (.*?)\n/g, '<h1 style="color:#0F172A;margin-top:24px;font-size:20px;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Pedagógico - ${studentName} (${periodLabel})</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1E293B; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 24px; }
            .logo-title { font-size: 26px; font-weight: 800; color: #EA580C; margin: 0; }
            .subtitle { font-size: 13px; text-transform: uppercase; color: #64748B; font-weight: 700; margin-top: 6px; letter-spacing: 0.05em; }
            .student-badge { display: inline-block; background: #FFF7ED; color: #C2410C; border: 1px solid #FFEDD5; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 700; margin-top: 10px; }
            .content { font-size: 14px; color: #334155; margin-top: 20px; text-align: justify; }
            .footer { margin-top: 50px; border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center; }
            @media print {
              body { padding: 15px; }
              @page { margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="logo-title">Creche do Papai</h1>
            <div class="subtitle">Relatório Pedagógico — ${periodLabel}</div>
            <div class="student-badge">Aluno(a): ${studentName}</div>
          </div>
          <div class="content">${formattedContent}</div>
          <div class="footer">Documento Oficial de Registro Pedagógico — Creche do Papai</div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Modern Pill Tabs Navigation */}
      <div
        className="hide-scrollbar"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          background: "white",
          borderBottom: "1px solid #E2E8F0",
          position: "sticky",
          top: 60, // below header
          zIndex: 40,
          padding: "10px 16px",
          scrollbarWidth: "none"
        }}
      >
        {[
          { id: "mural", label: "Mural", icon: "📢", badge: visibleAvisos.length > 0 ? visibleAvisos.length : null },
          { id: "calendario", label: "Calendário", icon: "📅", badge: null },
          { id: "coordenacao", label: "Coordenação", icon: "💬", badge: null },
          { id: "relatorios", label: "Relatórios", icon: "📊", badge: null },
          { id: "perfil", label: "Meu Filho(a)", icon: "👶", badge: null }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === "relatorios") setViewingReport(null);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 24,
                border: "none",
                background: isActive ? "linear-gradient(135deg, #F97316, #EA580C)" : "#F1F5F9",
                color: isActive ? "white" : "#475569",
                fontWeight: isActive ? 700 : 600,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                boxShadow: isActive ? "0 2px 8px rgba(234, 88, 12, 0.25)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  background: isActive ? "white" : "#EA580C",
                  color: isActive ? "#EA580C" : "white",
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 2
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 16 }}>
        {/* ================= ABA: MURAL ================= */}
        {activeTab === "mural" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {visibleAvisos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 800, color: "#1E293B" }}>
                  Tudo tranquilo por aqui!
                </h3>
                <p style={{ margin: 0, color: "#64748B", fontSize: 13, lineHeight: 1.5 }}>
                  Nenhum novo aviso no mural no momento. Quando a direção publicar recados, eles aparecerão aqui.
                </p>
              </div>
            ) : (
              visibleAvisos.map((aviso) => (
                <div
                  key={aviso.id}
                  style={{
                    background: "white",
                    borderRadius: 16,
                    border: "1px solid #E2E8F0",
                    borderLeft: `5px solid ${aviso.tipo === "urgente" ? "var(--danger)" : aviso.tipo === "alerta" ? "var(--warning)" : "var(--primary)"}`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ padding: "16px 20px", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingRight: 50 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8" }}>
                        {new Date(aviso.criadoEm).toLocaleDateString("pt-BR")}
                      </span>
                      {aviso.tipo === "urgente" && (
                        <span style={{ background: "#FEE2E2", color: "#B91C1C", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                          🚨 Urgente
                        </span>
                      )}
                      {aviso.tipo === "alerta" && (
                        <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                          ⚠️ Alerta
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDismissAviso(aviso.id)}
                      style={{
                        position: "absolute",
                        right: 14,
                        top: 14,
                        background: "#F1F5F9",
                        border: "none",
                        borderRadius: 12,
                        padding: "4px 8px",
                        fontSize: 11,
                        color: "#64748B",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      ✕ Ocultar
                    </button>

                    <h3 style={{ margin: "0 0 8px 0", color: "#1E293B", fontSize: 15, fontWeight: 800, paddingRight: 40 }}>
                      {aviso.titulo}
                    </h3>
                    <p style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {aviso.mensagem}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= ABA: CALENDÁRIO ================= */}
        {activeTab === "calendario" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visibleEventos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 800, color: "#1E293B" }}>
                  Nenhum evento próximo
                </h3>
                <p style={{ margin: 0, color: "#64748B", fontSize: 13, lineHeight: 1.5 }}>
                  O calendário escolar está em dia. Novas reuniões, festividades e datas comemorativas serão listadas aqui.
                </p>
              </div>
            ) : (
              visibleEventos.map((evento) => {
                const dateObj = new Date(evento.data + "T12:00:00");
                const day = dateObj.getDate().toString().padStart(2, "0");
                const month = dateObj.toLocaleDateString("pt-BR", { month: "short" }).toUpperCase().replace(".", "");
                const weekday = dateObj.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase().replace(".", "");
                
                return (
                  <div
                    key={evento.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "white",
                      borderRadius: 16,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
                        color: "#C2410C",
                        padding: "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 70,
                        borderRight: "1px dashed #FDBA74",
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>{weekday}</span>
                      <span style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.1 }}>{day}</span>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{month}</span>
                    </div>
                    <div style={{ padding: "14px 18px", flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1E293B" }}>
                        {evento.titulo}
                      </h4>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ================= ABA: COORDENAÇÃO ================= */}
        {activeTab === "coordenacao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Child Selector if more than 1 child */}
            {students.length > 1 && (
              <div style={{ display: "flex", gap: 8, paddingBottom: 4, overflowX: "auto" }} className="hide-scrollbar">
                {students.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`btn ${selectedStudent?.id === s.id ? "btn--primary" : "btn--secondary"}`}
                    style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap" }}
                    onClick={() => setSelectedStudent(s)}
                  >
                    {s.nome}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Container */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 460, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#EA580C", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>
                  🏫
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1E293B" }}>
                    Atendimento com a Coordenação
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#16A34A", fontWeight: 600 }}>
                    ● Canal direto com a direção da Creche do Papai
                  </p>
                </div>
              </div>

              {/* Message thread */}
              <div style={{ padding: 18, flex: 1, overflowY: "auto", background: "#FAF7F2", display: "flex", flexDirection: "column", gap: 10, minHeight: 320, maxHeight: 460 }}>
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 16px", color: "#94A3B8" }}>
                    <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>💬</span>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#64748B" }}>Nenhuma mensagem enviada ainda.</p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94A3B8" }}>Tire dúvidas com a direção ou envie comunicados administrativos abaixo.</p>
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
                          borderRadius: isPai ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                          background: isPai ? "linear-gradient(135deg, #F97316, #EA580C)" : "white",
                          color: isPai ? "white" : "#1E293B",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                          border: isPai ? "none" : "1px solid #E2E8F0",
                          fontSize: 13,
                          lineHeight: 1.45,
                          wordBreak: "break-word"
                        }}>
                          {msg.texto}
                        </div>
                        <span style={{ fontSize: 10, color: "#94A3B8", marginTop: 3, padding: "0 4px" }}>
                          {msg.horario} {isPai && (msg.lida ? "• ✓✓ Lida" : "• ✓ Enviada")}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Footer */}
              <div style={{ padding: 12, background: "white", borderTop: "1px solid #E2E8F0", display: "flex", gap: 8 }}>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Escreva sua mensagem para a coordenação..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      handleSendChat();
                    }
                  }}
                  style={{ flex: 1, padding: "10px 16px", fontSize: 13, borderRadius: 20, height: "auto" }}
                />
                <button
                  onClick={handleSendChat}
                  disabled={sendingChat || !newMessage.trim() || !selectedStudent}
                  style={{
                    background: "linear-gradient(135deg, #F97316, #EA580C)",
                    color: "white",
                    border: "none",
                    borderRadius: 20,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  {sendingChat ? "..." : "Enviar ➤"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA: RELATÓRIOS ================= */}
        {activeTab === "relatorios" && selectedStudent && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {viewingReport ? (
              <div style={{ background: "white", padding: "28px 20px", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                  <button 
                    onClick={() => setViewingReport(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#EA580C",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 13,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: 0
                    }}
                  >
                    ← Voltar aos Relatórios
                  </button>

                  <button
                    onClick={() => handlePrintReport(viewingReport, selectedStudent.nome)}
                    style={{
                      background: "linear-gradient(135deg, #F97316, #EA580C)",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 2px 6px rgba(234, 88, 12, 0.25)"
                    }}
                  >
                    📥 Baixar / Imprimir PDF
                  </button>
                </div>

                <div style={{ textAlign: "center", borderBottom: "2px solid #F1F5F9", paddingBottom: 16, marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0F172A" }}>Creche do Papai</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                    Relatório Pedagógico — {viewingReport.periodo.replace("-T", "º Trimestre ")}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#334155" }}>
                    Aluno(a): <strong>{selectedStudent.nome}</strong>
                  </p>
                </div>

                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#334155" }}>
                  {viewingReport.conteudo.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 16, color: "#1E293B", marginTop: 20, fontWeight: 800 }}>{line.replace('## ', '')}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 14, color: "#1E293B", marginTop: 14, fontWeight: 700 }}>{line.replace('### ', '')}</h3>;
                    if (line.startsWith('# ')) return <h2 key={i} style={{ fontSize: 18, color: "#1E293B", marginTop: 22, fontWeight: 800 }}>{line.replace('# ', '')}</h2>;
                    
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
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Selector of multiple kids if exists */}
                {students.length > 1 && (
                  <div style={{ display: "flex", gap: 8, paddingBottom: 4, overflowX: "auto" }} className="hide-scrollbar">
                    {students.map((s) => (
                      <button
                        key={s.id}
                        className={`btn ${selectedStudent?.id === s.id ? "btn--primary" : "btn--secondary"}`}
                        style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap" }}
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
                      <div key={period} style={{ background: "white", padding: 18, borderRadius: 16, border: "1px solid #E2E8F0", borderLeft: "5px solid #16A34A", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 14, color: "#1E293B", fontWeight: 800 }}>{labelPeriod}</h4>
                          <span style={{ fontSize: 11, color: "#15803D", fontWeight: 700, display: "inline-block", marginTop: 4 }}>🔓 Disponível para Visualização</span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button 
                            onClick={() => setViewingReport(rep)}
                            className="btn btn--primary" 
                            style={{ padding: "8px 12px", fontSize: 12, borderRadius: 8 }}
                          >
                            📄 Abrir
                          </button>
                          <button
                            onClick={() => handlePrintReport(rep, selectedStudent.nome)}
                            style={{
                              background: "#FFF7ED",
                              color: "#C2410C",
                              border: "1px solid #FFEDD5",
                              borderRadius: 8,
                              padding: "8px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            📥 PDF
                          </button>
                        </div>
                      </div>
                    );
                  } else if (rep && !isReleased) {
                    return (
                      <div key={period} style={{ background: "#FFFBFB", padding: 18, borderRadius: 16, border: "1px solid #FECACA", borderLeft: "5px solid #DC2626" }}>
                        <h4 style={{ margin: 0, fontSize: 14, color: "#9F1239", fontWeight: 800 }}>🔒 {labelPeriod}</h4>
                        <p style={{ margin: "6px 0 0 0", fontSize: 12, lineHeight: 1.5, color: "#9F1239" }}>
                          Relatório Indisponível. Documento liberado mediante presença na Reunião de Pais presencial de alinhamento pedagógico.
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div key={period} style={{ background: "white", padding: 18, borderRadius: 16, border: "1px solid #E2E8F0", borderLeft: "5px solid #CBD5E1", opacity: 0.8 }}>
                        <h4 style={{ margin: 0, fontSize: 14, color: "#64748B", fontWeight: 700 }}>⏳ {labelPeriod}</h4>
                        <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#94A3B8" }}>
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

        {/* ================= ABA: MEU FILHO(A) / PERFIL ================= */}
        {activeTab === "perfil" && selectedStudent && (
          <form onSubmit={handleSaveFamilyProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Student selector if multiple children */}
            {students.length > 1 && (
              <div style={{ display: "flex", gap: 8, paddingBottom: 4, overflowX: "auto" }} className="hide-scrollbar">
                {students.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`btn ${selectedStudent?.id === s.id ? "btn--primary" : "btn--secondary"}`}
                    style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap" }}
                    onClick={() => setSelectedStudent(s)}
                  >
                    {s.nome}
                  </button>
                ))}
              </div>
            )}

            {/* Child Profile Presentation Card */}
            <div style={{ background: "white", padding: "18px 20px", borderRadius: 16, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FFF7ED", border: "2px solid #FDBA74", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                {profileFotoUrl ? (
                  <img src={profileFotoUrl} alt={selectedStudent.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  "👶"
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1E293B" }}>
                  {selectedStudent.nome}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0369A1", background: "#E0F2FE", padding: "2px 8px", borderRadius: 6 }}>
                    🎒 {selectedStudent.turma}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748B" }}>
                    Creche do Papai
                  </span>
                </div>
              </div>
            </div>

            {/* Authorized Pickup List (Primary Focus) */}
            <div style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
                  🚗 Pessoas Autorizadas a Retirar
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748B", lineHeight: 1.4 }}>
                  Familiares ou pessoas de confiança com autorização permanente. Exceções eventuais devem ser tratadas direto por telefone com a coordenação.
                </p>
              </div>

              {profileAutorizados.length === 0 ? (
                <div style={{ padding: 14, background: "#F8FAFC", borderRadius: 12, textAlign: "center", color: "#94A3B8", fontSize: 12, border: "1px dashed #CBD5E1", marginBottom: 14 }}>
                  Nenhum terceiro cadastrado. Somente os pais vinculados podem retirar.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {profileAutorizados.map((aut, idx) => (
                    <div key={idx} style={{ padding: "10px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: 13, color: "#1E293B" }}>{aut.nome}</strong>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                          <span style={{ fontWeight: 600, color: "#0369A1" }}>{aut.parentesco}</span>
                          {aut.documento && ` • Doc: ${aut.documento}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAutorizado(idx)}
                        style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Form to add authorized person */}
              <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px dashed #CBD5E1", display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>+ Incluir Nova Pessoa Autorizada</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Nome Completo *"
                    className="text-input"
                    style={{ fontSize: 12, background: "white", padding: "8px 10px", height: "auto" }}
                    value={newAutorizado.nome}
                    onChange={e => setNewAutorizado({...newAutorizado, nome: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Parentesco (ex: Vovó, Tio)"
                    className="text-input"
                    style={{ fontSize: 12, background: "white", padding: "8px 10px", height: "auto" }}
                    value={newAutorizado.parentesco}
                    onChange={e => setNewAutorizado({...newAutorizado, parentesco: e.target.value})}
                  />
                </div>
                <input
                  type="text"
                  placeholder="CPF ou RG para identificação na portaria (opcional)"
                  className="text-input"
                  style={{ fontSize: 12, background: "white", padding: "8px 10px", height: "auto" }}
                  value={newAutorizado.documento}
                  onChange={e => setNewAutorizado({...newAutorizado, documento: e.target.value})}
                />
                <button
                  type="button"
                  onClick={handleAddAutorizado}
                  style={{ background: "#16A34A", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", alignSelf: "flex-end" }}
                >
                  + Incluir Autorizado
                </button>
              </div>
            </div>

            {/* Collapsible Discreet Data (Address & Administrative info) */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <button
                type="button"
                onClick={() => setShowDetailedInfo(!showDetailedInfo)}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🔒</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1E293B" }}>
                      Dados Cadastrais & Endereço
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748B" }}>
                      Endereço residencial, matrícula e foto
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, background: "#F1F5F9", padding: "4px 10px", borderRadius: 12 }}>
                  {showDetailedInfo ? "Ocultar ▲" : "Ver / Editar ▼"}
                </span>
              </button>

              {showDetailedInfo && (
                <div style={{ padding: "0 20px 20px", borderTop: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Photo update */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", display: "block" }}>Foto do Aluno</span>
                      <span style={{ fontSize: 11, color: "#64748B" }}>Utilizada na identificação escolar</span>
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
                        padding: "6px 12px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {uploadingFoto ? "Enviando..." : "📷 Alterar Foto"}
                    </label>
                  </div>

                  {/* Read-Only Administrative info */}
                  <div style={{ padding: 12, background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Identificação na Secretaria
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8, fontSize: 12 }}>
                      <div>
                        <span style={{ color: "#64748B", fontSize: 11, display: "block" }}>TURMA</span>
                        <strong style={{ color: "#1E293B" }}>{selectedStudent.turma}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748B", fontSize: 11, display: "block" }}>MATRÍCULA / ID</span>
                        <strong style={{ color: "#1E293B", fontFamily: "monospace" }}>{selectedStudent.id.substring(0, 10)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Address input */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                      🏠 Endereço Residencial
                    </label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="Rua, número, complemento, bairro, CEP..."
                      value={profileAddress}
                      onChange={e => setProfileAddress(e.target.value)}
                      style={{ fontSize: 12, padding: "8px 12px" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn btn--primary"
                    style={{ padding: "10px", fontSize: 13, fontWeight: 700, borderRadius: 10 }}
                  >
                    {savingProfile ? "Salvando..." : "💾 Salvar Endereço / Dados"}
                  </button>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
