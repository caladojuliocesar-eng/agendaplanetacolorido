"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { 
  getCoordinationChatsByEscola, 
  saveCoordinationMessage, 
  markCoordinationChatRead 
} from "@/lib/firestore";

export default function AdminAtendimentoPage() {
  const { profile } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!profile?.escolaId) {
      setLoading(false);
      return;
    }

    loadChats();
    const interval = setInterval(loadChats, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [profile]);

  async function loadChats() {
    if (!profile?.escolaId) return;
    try {
      const data = await getCoordinationChatsByEscola(profile.escolaId);
      // Sort chats: unread first, then by last message time
      const sorted = data.sort((a, b) => {
        const aUnread = !a.lidaCoordenacao;
        const bUnread = !b.lidaCoordenacao;
        if (aUnread && !bUnread) return -1;
        if (!aUnread && bUnread) return 1;
        return (b.ultimaMensagemEm || "").localeCompare(a.ultimaMensagemEm || "");
      });
      setChats(sorted);

      // Keep selected chat data updated
      if (selectedChat) {
        const updatedSelected = sorted.find(c => c.id === selectedChat.id);
        if (updatedSelected) {
          setSelectedChat(updatedSelected);
        }
      }
    } catch (error) {
      console.error("Error loading coordination chats:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectChat = async (chat: any) => {
    setSelectedChat(chat);
    try {
      // Mark as read by coordination
      await markCoordinationChatRead(chat.id, 'coordenacao');
      // Refresh list to remove unread badge
      await loadChats();
    } catch (err) {
      console.error("Error marking chat as read:", err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedChat || !newMessage.trim() || sending) return;
    setSending(true);
    try {
      await saveCoordinationMessage(
        selectedChat.alunoId,
        newMessage.trim(),
        'coordenacao',
        profile!.escolaId,
        selectedChat.nomeAluno
      );
      setNewMessage("");
      // Force reload chats to see new message immediately
      await loadChats();
    } catch (err) {
      console.error("Error sending coordination reply:", err);
      alert("Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  if (loading && chats.length === 0) return <div className="spinner" />;

  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>Atendimento Coordenação</h1>
        <p style={{ color: "#64748B", margin: 0 }}>Fale diretamente com os pais de forma rápida e centralizada.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, minHeight: 500 }}>
        {/* Chats Sidebar List */}
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", background: "white" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#475569" }}>CONVERSAS ATIVAS</h3>
          </div>
          
          <div style={{ overflowY: "auto", flex: 1 }}>
            {chats.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                Nenhum atendimento em aberto.
              </div>
            ) : (
              chats.map(chat => {
                const isSelected = selectedChat?.id === chat.id;
                const hasUnread = !chat.lidaCoordenacao;
                const lastMsg = chat.mensagens?.[chat.mensagens.length - 1];

                return (
                  <div 
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #F1F5F9",
                      cursor: "pointer",
                      background: isSelected ? "var(--primary-light)" : "white",
                      position: "relative",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: isSelected ? "var(--primary-dark)" : "#1E293B", fontSize: 14 }}>
                        {chat.nomeAluno}
                      </span>
                      {hasUnread && (
                        <span style={{ 
                          background: "#EF4444", 
                          color: "white", 
                          fontSize: 9, 
                          fontWeight: 800, 
                          padding: "2px 6px", 
                          borderRadius: 10 
                        }}>
                          NOVO
                        </span>
                      )}
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontSize: 12, 
                      color: "#64748B", 
                      whiteSpace: "nowrap", 
                      overflow: "hidden", 
                      textOverflow: "ellipsis" 
                    }}>
                      {lastMsg ? lastMsg.texto : "Nenhuma mensagem"}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Chat Window */}
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", background: "white" }}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", padding: "16px 24px" }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1E293B" }}>
                  Responsáveis de {selectedChat.nomeAluno}
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>
                  Canal de comunicação direta escola ↔ família.
                </p>
              </div>

              {/* Chat Body Thread */}
              <div style={{ 
                padding: 24, 
                flex: 1, 
                overflowY: "auto", 
                background: "#FFFBF7", 
                display: "flex", 
                flexDirection: "column", 
                gap: 16,
                maxHeight: 400,
                minHeight: 300
              }}>
                {selectedChat.mensagens?.map((msg: any, idx: number) => {
                  const isCoord = msg.role === 'coordenacao';
                  return (
                    <div 
                      key={msg.id || idx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isCoord ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        alignSelf: isCoord ? "flex-end" : "flex-start"
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 4, paddingLeft: 4, paddingRight: 4 }}>
                        {isCoord ? "COORDENAÇÃO / ESCOLA" : "PAIS / RESPONSÁVEIS"}
                      </span>
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: isCoord ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isCoord ? "var(--primary-light)" : "white",
                        color: isCoord ? "var(--primary-dark)" : "#334155",
                        border: isCoord ? "1px solid var(--primary)" : "1px solid #E2E8F0",
                        fontSize: 13,
                        lineHeight: 1.4,
                        wordBreak: "break-word"
                      }}>
                        {msg.texto}
                      </div>
                      <span style={{ fontSize: 9, color: "#94A3B8", marginTop: 4, paddingLeft: 4, paddingRight: 4 }}>
                        {msg.horario} {isCoord && (msg.lida ? "✓ Lida" : "✓ Enviada")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Send Input Box */}
              <div style={{ padding: 16, background: "white", borderTop: "1px solid #E2E8F0", display: "flex", gap: 12 }}>
                <input 
                  type="text"
                  className="text-input"
                  placeholder="Digite sua resposta para os responsáveis..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      handleSendReply();
                    }
                  }}
                  style={{ flex: 1, padding: "12px 16px", fontSize: 13, height: "auto" }}
                />
                <button 
                  onClick={handleSendReply}
                  disabled={sending || !newMessage.trim()}
                  className="btn btn--primary"
                  style={{ padding: "8px 24px", fontSize: 13 }}
                >
                  {sending ? "Enviando..." : "Responder"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "#94A3B8", padding: 48 }}>
              <span style={{ fontSize: 48, marginBottom: 12 }}>💬</span>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Selecione um atendimento</p>
              <p style={{ fontSize: 13, margin: "4px 0 0 0" }}>Selecione uma conversa ativa na barra lateral para ver o histórico e responder.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
