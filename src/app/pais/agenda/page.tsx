"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import {
  getStudentsByParent,
  getDailyRecord,
  getStudentHistory,
  getTodayDateString,
  markAsReadByParent,
  saveParentMessage,
} from "@/lib/firestore";
import {
  Student,
  DailyRecord,
  FEEDING_ITEMS,
  FEEDING_LABELS,
  FEEDING_EMOJI,
  FEEDING_COLORS,
  ACTIVITY_ITEMS,
  FeedingStatus,
} from "@/types";

export default function ParentAgenda() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null);
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [recado, setRecado] = useState("");
  const [sendingRecado, setSendingRecado] = useState(false);
  const [recadoSent, setRecadoSent] = useState(false);
  const [loading, setLoading] = useState(true);

  const [today, setToday] = useState(getTodayDateString());

  // Refresh today's date when app becomes visible or at intervals
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const currentToday = getTodayDateString();
        if (currentToday !== today) {
          setToday(currentToday);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Also check every minute just in case
    const interval = setInterval(() => {
      const currentToday = getTodayDateString();
      if (currentToday !== today) {
        setToday(currentToday);
      }
    }, 60000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [today]);

  // Load students
  useEffect(() => {
    if (!profile?.filhos?.length) return;

    async function load() {
      setLoading(true);
      const kids = await getStudentsByParent(profile!.filhos!);
      setStudents(kids);
      if (kids.length > 0) {
        setSelectedStudent(kids[0]);
      }
      setLoading(false);
    }
    load();
  }, [profile]);

  // Load today's record when student changes
  useEffect(() => {
    if (!selectedStudent) return;

    async function loadRecord() {
      const record = await getDailyRecord(selectedStudent!.id, today);
      setTodayRecord(record);

      // Auto mark as read
      if (record && !record.lido) {
        markAsReadByParent(record.id);
      }

      setRecado("");
      setRecadoSent(false);
    }
    loadRecord();
  }, [selectedStudent, today]);

  const loadHistory = async () => {
    if (!selectedStudent) return;
    setShowHistory(true);
    const records = await getStudentHistory(selectedStudent.id, 7);
    setHistory(records.filter((r) => r.data !== today));
  };

  const handleSendRecado = async () => {
    if (!selectedStudent || !recado.trim() || sendingRecado) return;

    // Check if there is an unread message
    const hasUnread = todayRecord && !todayRecord.recadoLidoProfessor && todayRecord.mensagensPais && todayRecord.mensagensPais.length > 0;
    
    if (hasUnread) {
      const confirm = window.confirm(
        "A professora ainda não leu seu recado anterior.\n\nPara evitar sobrecarga na sala, envie novas mensagens apenas se for uma informação essencial.\n\nDeseja enviar mesmo assim?"
      );
      if (!confirm) return;
    }

    setSendingRecado(true);
    try {
      const recordId = todayRecord?.id || `${selectedStudent.id}_${today}`;
      await saveParentMessage(recordId, recado.trim());
      setRecadoSent(true);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Erro ao enviar recado. Tente novamente.");
    }
    setSendingRecado(false);
  };

  const feedingColorMap: Record<string, string> = {
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    neutral: "#94A3B8",
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div className="spinner" />
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Carregando...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <p style={{ fontSize: 48, margin: "0 0 12px" }}>🎒</p>
        <p style={{ color: "var(--text-secondary)" }}>
          Nenhum aluno vinculado à sua conta.
          <br />
          Procure a secretaria da escola.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Student selector (if multiple children) */}
      {students.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {students.map((s) => (
            <button
              key={s.id}
              className={`btn ${
                selectedStudent?.id === s.id ? "btn--primary" : "btn--secondary"
              }`}
              style={{ fontSize: 14, padding: "10px 20px", whiteSpace: "nowrap" }}
              onClick={() => setSelectedStudent(s)}
            >
              {s.nome}
            </button>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, margin: 0 }}>
          {selectedStudent?.nome || ""}
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>


      {!todayRecord ? (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <p style={{ fontSize: 48, margin: "0 0 12px" }}>📝</p>
          <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>
            Relatório do Dia
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            A professora ainda não preencheu o relatório de atividades de hoje.
          </p>
        </div>
      ) : (
        <>
          {/* AI Summary Banner */}
          {todayRecord.resumoIA && (
            <div className="ai-banner" style={{ marginBottom: 16 }}>
              {todayRecord.resumoIA}
            </div>
          )}

          {/* Feeding Card */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <p className="section-title">🍽️ Como eu comi</p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {FEEDING_ITEMS.map((item) => {
                const status = todayRecord.alimentacao[item.key] as FeedingStatus;
                if (status === 0) return null;
                const colorKey = FEEDING_COLORS[status];
                return (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      background:
                        colorKey === "success"
                          ? "var(--success-light)"
                          : colorKey === "warning"
                          ? "var(--warning-light)"
                          : "var(--danger-light)",
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 500 }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: feedingColorMap[colorKey] || "inherit",
                      }}
                    >
                      {FEEDING_EMOJI[status]} {FEEDING_LABELS[status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Novos campos de rotina para os pais */}
          <div className="card" style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr 1fr", 
            gap: 8, 
            marginBottom: 16,
            padding: "16px 12px",
          }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>😴</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Soninho</span>
              <span style={{ fontSize: 12, display: "block", fontWeight: 700, color: todayRecord.soninho ? "var(--success)" : "var(--text-muted)" }}>
                {todayRecord.soninho ? "Dormiu" : "Não dormiu"}
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>💧</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Xixi</span>
              <span style={{ fontSize: 12, display: "block", fontWeight: 700, color: todayRecord.xixi ? "var(--success)" : "var(--text-muted)" }}>
                {todayRecord.xixi ? "Fez Xixi" : "Não fez"}
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>💩</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Cocô</span>
              <span style={{ fontSize: 12, display: "block", fontWeight: 700, color: todayRecord.coco ? "var(--success)" : "var(--text-muted)" }}>
                {todayRecord.coco ? "Fez Cocô" : "Não fez"}
              </span>
            </div>
          </div>

          {/* Activities Card */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <p className="section-title">🎯 O que eu fiz</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ACTIVITY_ITEMS.filter(
                (item) => todayRecord.atividades[item.key]
              ).map((item) => (
                <span
                  key={item.key}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--primary-light)",
                    color: "var(--primary-dark)",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {item.emoji} {item.label}
                </span>
              ))}
            </div>

            {todayRecord.atividadeTexto && (
              <p
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  fontStyle: "italic",
                }}
              >
                📚 {todayRecord.atividadeTexto}
              </p>
            )}
          </div>

          {/* Observations */}
          {todayRecord.observacoes && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <p className="section-title">📝 Recadinho da Prô</p>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                {todayRecord.observacoes}
              </p>
            </div>
          )}
        </>
      )}

      {/* Parent message (Always available at the bottom of today's section) */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <p className="section-title">💬 Recado para a Escola</p>
        
        {/* Show messages already sent today */}
        {((todayRecord?.mensagensPais && todayRecord.mensagensPais.length > 0) || (todayRecord?.mensagensProfessor && todayRecord.mensagensProfessor.length > 0)) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {(() => {
              const combined = [
                ...(todayRecord?.mensagensPais || []).map(m => ({ ...m, role: 'pai' })),
                ...(todayRecord?.mensagensProfessor || []).map(m => ({ ...m, role: 'professor' }))
              ].sort((a, b) => a.horario.localeCompare(b.horario));

              return combined.map((msg, idx) => (
                <div 
                  key={msg.id || idx} 
                  style={{ 
                    background: msg.role === 'pai' ? 'var(--bg-app)' : 'var(--primary-light)', 
                    padding: 12, 
                    borderRadius: 8, 
                    border: `1px solid ${msg.role === 'pai' ? 'var(--border)' : 'var(--primary)'}`,
                    marginLeft: msg.role === 'pai' ? 0 : 20 
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: msg.role === 'pai' ? 'var(--text-muted)' : 'var(--primary-dark)' }}>
                      {msg.role === 'pai' ? 'Você' : 'Escola'} • {msg.horario}
                    </span>
                    {msg.role === 'pai' && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: msg.lida ? "var(--success)" : "var(--warning)" }}>
                        {msg.lida ? "✓ LIDO" : "PENDENTE"}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--text-primary)" }}>{msg.texto}</p>
                </div>
              ));
            })()}
          </div>
        )}

        <textarea
          className="text-input"
          rows={2}
          placeholder="Escreva um recado para a professora..."
          value={recado}
          onChange={(e) => {
            setRecado(e.target.value);
            setRecadoSent(false);
          }}
        />
        <button
          className="btn btn--primary btn--block"
          style={{
            marginTop: 10,
            fontSize: 14,
          }}
          onClick={async () => {
            await handleSendRecado();
            setRecado(""); // Clear input after send
            // Refresh local state to show the new message
            const updated = await getDailyRecord(selectedStudent!.id, today);
            setTodayRecord(updated);
          }}
          disabled={sendingRecado || !recado.trim()}
        >
          {sendingRecado ? "Enviando..." : "Enviar Recado"}
        </button>
      </div>

      {/* History toggle */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <button
          className="btn btn--secondary"
          style={{ fontSize: 13 }}
          onClick={showHistory ? () => setShowHistory(false) : loadHistory}
        >
          {showHistory ? "Ocultar Histórico" : "Ver dias anteriores"}
        </button>
      </div>

      {/* History */}
      {showHistory && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3
            style={{
              fontSize: 16,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Últimos 7 dias
          </h3>
          {history.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Nenhum registro anterior encontrado.
            </p>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                className="card"
                style={{ padding: 16 }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    margin: "0 0 8px",
                    color: "var(--text-primary)",
                  }}
                >
                  {new Date(record.data + "T12:00:00").toLocaleDateString(
                    "pt-BR",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }
                  )}
                </p>

                {record.resumoIA && (
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--text-secondary)",
                      margin: "0 0 8px",
                      fontStyle: "italic",
                    }}
                  >
                    ✨ {record.resumoIA}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {FEEDING_ITEMS.map((item) => {
                    const status = record.alimentacao[item.key] as FeedingStatus;
                    if (status === 0) return null;
                    return (
                      <span
                        key={item.key}
                        style={{
                          fontSize: 12,
                          padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                          background:
                            FEEDING_COLORS[status] === "success"
                              ? "var(--success-light)"
                              : FEEDING_COLORS[status] === "warning"
                              ? "var(--warning-light)"
                              : "var(--danger-light)",
                        }}
                      >
                        {item.label}: {FEEDING_EMOJI[status]}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
