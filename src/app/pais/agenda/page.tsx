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

  const today = getTodayDateString();

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

      // Pre-fill existing recado
      if (record?.recadoPais) {
        setRecado(record.recadoPais);
      } else {
        setRecado("");
      }
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
    if (!todayRecord || !recado.trim() || sendingRecado) return;
    setSendingRecado(true);
    try {
      await saveParentMessage(todayRecord.id, recado.trim());
      setRecadoSent(true);
    } catch (err) {
      console.error("Error sending message:", err);
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
            Agenda ainda não preenchida
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            A professora ainda não preencheu a agenda de hoje. Volte mais tarde!
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

          {/* Parent message */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <p className="section-title">💬 Recado para a Escola</p>
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
              className={`btn btn--block ${
                recadoSent ? "btn--secondary" : "btn--primary"
              }`}
              style={{
                marginTop: 10,
                fontSize: 14,
                ...(recadoSent
                  ? {
                      background: "var(--success-light)",
                      color: "var(--success)",
                    }
                  : {}),
              }}
              onClick={handleSendRecado}
              disabled={sendingRecado || !recado.trim()}
            >
              {sendingRecado
                ? "Enviando..."
                : recadoSent
                ? "✓ Recado Enviado!"
                : "Enviar Recado"}
            </button>
          </div>

          {/* Read indicator */}
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            <span className="read-indicator">
              👁️ Agenda visualizada em{" "}
              {new Date().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </>
      )}

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
