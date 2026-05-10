"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LogPedagogico {
  id: string;
  alunoId: string;
  data: string;
  pilar: string;
  pilarLabel: string;
  nota: string;
  sentimento: "positivo" | "neutro" | "atencao";
  criadoEm: string;
}

const PILAR_CONFIG: Record<string, { icon: string; color: string }> = {
  socioemocional:   { icon: "🤝", color: "#8B5CF6" },
  autonomia:        { icon: "🧒", color: "#06B6D4" },
  linguagem:        { icon: "💬", color: "#3B82F6" },
  motora:           { icon: "🏃", color: "#10B981" },
  logico:           { icon: "🧩", color: "#F59E0B" },
  curiosidade:      { icon: "🔍", color: "#EC4899" },
  leitura:          { icon: "📖", color: "#6366F1" },
  comportamento:    { icon: "🎯", color: "#14B8A6" },
  alimentacao_sono: { icon: "🍎", color: "#F97316" },
  destaques:        { icon: "⭐", color: "#EAB308" },
};

const ALUNO_ID = "aluno_otto";

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short",
  });
}

export default function ShowroomProfessora() {
  const [logs, setLogs] = useState<LogPedagogico[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "analyzing" | "result" | "saving">("idle");
  const [result, setResult] = useState<any>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    fetch(`/api/pedagogico?alunoId=${ALUNO_ID}`)
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleAnalyze() {
    if (!text.trim()) return;
    setState("analyzing");
    try {
      const res = await fetch("/api/pedagogico/classificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: text }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setState("result");
    } catch (err) {
      console.error(err);
      alert("Erro ao analisar texto.");
      setState("idle");
    }
  }

  async function handleSave() {
    if (!result) return;
    setState("saving");
    try {
      const res = await fetch("/api/pedagogico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota: text,
          pilar: result.pilarId,
          pilarLabel: result.pilarLabel,
          sentimento: result.sentimento,
          data: new Date().toISOString().split("T")[0],
        }),
      });
      const newLog = await res.json();
      if (newLog.error) throw new Error(newLog.error);
      
      setLogs(prev => [newLog, ...prev]);
      setText("");
      setResult(null);
      setSavedCount(c => c + 1);
      setState("idle");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar.");
      setState("result");
    }
  }

  const recentLogs = logs.slice(0, 10);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFBFC" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFBFC" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #065F46 0%, #064E3B 100%)",
        padding: "32px 24px 80px",
        color: "white", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -60, right: -40,
          width: 250, height: 250, borderRadius: "50%",
          background: "rgba(16,185,129,0.2)", filter: "blur(60px)",
        }} />
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Link href="/showroom" style={{
            color: "#6EE7B7", fontSize: 13, textDecoration: "none", fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24,
          }}>
            ← Voltar ao Showroom
          </Link>

          {/* Role Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(16,185,129,0.2)", padding: "8px 16px", borderRadius: 12,
            marginBottom: 16, border: "1px solid rgba(16,185,129,0.3)",
          }}>
            <span style={{ fontSize: 20 }}>👩‍🏫</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#6EE7B7", letterSpacing: "0.05em" }}>
              VISÃO PROFESSORA — MODO DEMONSTRAÇÃO
            </span>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 800, margin: "12px 0 8px", letterSpacing: "-0.02em" }}>
            Registro de Observações
          </h1>
          <p style={{ color: "#A7F3D0", margin: 0, fontSize: 15 }}>
            Professora Ana • Turma: Berçário II • Aluno: Otto
          </p>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "-48px auto 0", padding: "0 24px 64px", position: "relative", zIndex: 2 }}>
        
        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 32 }}>
          <div style={{
            background: "white", borderRadius: 16, padding: "20px 24px",
            border: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: 28 }}>📝</span>
            <div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E293B" }}>{logs.length}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>Registros totais</p>
            </div>
          </div>
          <div style={{
            background: "white", borderRadius: 16, padding: "20px 24px",
            border: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: 28 }}>✅</span>
            <div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E293B" }}>
                {savedCount > 0 ? `+${savedCount}` : "0"}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>Registros de hoje</p>
            </div>
          </div>
          <div style={{
            background: "white", borderRadius: 16, padding: "20px 24px",
            border: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: 28 }}>🤖</span>
            <div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#10B981" }}>Auto</p>
              <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>Classificação por IA</p>
            </div>
          </div>
        </div>

        {/* Main Input Area */}
        <div style={{
          background: "white", borderRadius: 24, padding: 32, marginBottom: 32,
          border: "2px solid #D1FAE5", boxShadow: "0 4px 20px rgba(16,185,129,0.08)",
        }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#065F46" }}>
            📝 Nova Observação
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "#059669", lineHeight: 1.5 }}>
            Escreva sua observação de forma livre. A IA identifica automaticamente o pilar pedagógico e o sentimento.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex: Hoje o Otto dividiu o lanche com o amigo que estava chorando. Demonstrou muita empatia e carinho..."
            disabled={state === "analyzing" || state === "saving"}
            rows={4}
            style={{
              width: "100%", padding: 20, borderRadius: 16, border: "1px solid #D1FAE5",
              resize: "vertical", fontSize: 15, outline: "none", color: "#1E293B",
              background: "#F0FDF4", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
              lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            {(state === "idle" || state === "analyzing") && (
              <button
                onClick={handleAnalyze}
                disabled={state === "analyzing" || !text.trim()}
                style={{
                  padding: "14px 28px", borderRadius: 14, border: "none",
                  background: state === "analyzing" || !text.trim() ? "#A7F3D0" : "#10B981",
                  color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer",
                  transition: "all 0.2s", boxShadow: "0 4px 12px rgba(16,185,129,0.2)",
                }}
              >
                {state === "analyzing" ? "🔄 Analisando..." : "🤖 Classificar com IA"}
              </button>
            )}
          </div>

          {/* Result Card */}
          {state === "result" && result && (
            <div style={{
              marginTop: 20, background: "#F0FDF4", borderRadius: 16, padding: 24,
              border: "1px solid #BBF7D0",
            }}>
              <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 800, color: "#065F46", letterSpacing: "0.1em" }}>
                CLASSIFICAÇÃO AUTOMÁTICA
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                  background: "white", color: "#334155", border: "1px solid #E2E8F0",
                }}>
                  {PILAR_CONFIG[result.pilarId]?.icon || "📌"} {result.pilarLabel}
                </span>
                <span style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                  background: result.sentimento === "positivo" ? "#DCFCE7" : result.sentimento === "atencao" ? "#FEE2E2" : "#F1F5F9",
                  color: result.sentimento === "positivo" ? "#166534" : result.sentimento === "atencao" ? "#991B1B" : "#475569",
                  border: `1px solid ${result.sentimento === "positivo" ? "#BBF7D0" : result.sentimento === "atencao" ? "#FECACA" : "#E2E8F0"}`,
                }}>
                  {result.sentimento === "positivo" ? "✅ Positivo" : result.sentimento === "atencao" ? "⚠️ Atenção" : "➖ Neutro"}
                </span>
              </div>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#334155", lineHeight: 1.5, fontStyle: "italic" }}>
                &ldquo;{result.justificativa}&rdquo;
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={handleSave} style={{
                  padding: "12px 24px", borderRadius: 12, border: "none",
                  background: "#065F46", color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer",
                }}>
                  ✅ Salvar Registro
                </button>
                <button onClick={() => { setState("idle"); setResult(null); }} style={{
                  padding: "12px 24px", borderRadius: 12, border: "1px solid #D1FAE5",
                  background: "white", color: "#065F46", fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}>
                  Descartar
                </button>
              </div>
            </div>
          )}

          {state === "saving" && (
            <div style={{ marginTop: 20, padding: 20, textAlign: "center", color: "#065F46", fontWeight: 700, fontSize: 15 }}>
              ✅ Salvo com sucesso!
            </div>
          )}
        </div>

        {/* Recent Observations */}
        <div style={{
          background: "white", borderRadius: 20, padding: 28,
          border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "#1E293B" }}>
            📋 Últimas Observações Registradas
          </h3>
          {recentLogs.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 14 }}>Nenhuma observação registrada ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {recentLogs.map((log) => {
                const cfg = PILAR_CONFIG[log.pilar] || { icon: "📌", color: "#64748B" };
                const sentColors = {
                  positivo: { bg: "#F0FDF4", text: "#166534", label: "✅" },
                  neutro:   { bg: "#F8FAFC", text: "#475569", label: "➖" },
                  atencao:  { bg: "#FEF2F2", text: "#991B1B", label: "⚠️" },
                };
                const s = sentColors[log.sentimento];
                return (
                  <div key={log.id} style={{
                    display: "flex", gap: 14, padding: "14px 0",
                    borderBottom: "1px solid #F8FAFC",
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: `${cfg.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>{cfg.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{log.pilarLabel}</span>
                        <span style={{ fontSize: 11 }}>{s.label}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}>{formatDate(log.data)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.4 }}>{log.nota}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
