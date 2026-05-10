"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

// Type matching the API response
interface LogPedagogico {
  id: string;
  alunoId: string;
  escolaId: string;
  turma: string;
  professorId: string;
  data: string;
  pilar: string;
  pilarLabel: string;
  nota: string;
  sentimento: "positivo" | "neutro" | "atencao";
  criadoEm: string;
}

// ── Pilar Config ─────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────
function groupByPilar(logs: LogPedagogico[]) {
  const map: Record<string, LogPedagogico[]> = {};
  for (const log of logs) {
    if (!map[log.pilar]) map[log.pilar] = [];
    map[log.pilar].push(log);
  }
  return map;
}

function calcScore(logs: LogPedagogico[]): number {
  if (!logs.length) return 0;
  let score = 0;
  for (const l of logs) {
    if (l.sentimento === "positivo") score += 3;
    else if (l.sentimento === "neutro") score += 2;
    else score += 1;
  }
  return Math.round((score / (logs.length * 3)) * 100);
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short",
  });
}

// ── Components ───────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: "white", borderRadius: 20, padding: "24px 28px",
      border: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 16,
        background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26,
      }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 13, color: "#64748B", fontWeight: 600 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#1E293B" }}>{value}</p>
        {sub && <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>{sub}</p>}
      </div>
    </div>
  );
}

function PilarBar({ pilar, label, logs }: { pilar: string; label: string; logs: LogPedagogico[] }) {
  const cfg = PILAR_CONFIG[pilar] || { icon: "📌", color: "#64748B" };
  const score = calcScore(logs);
  const pos = logs.filter(l => l.sentimento === "positivo").length;
  const att = logs.filter(l => l.sentimento === "atencao").length;

  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "20px 24px",
      border: "1px solid #F1F5F9",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{cfg.icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{label}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
            {logs.length} registro{logs.length !== 1 ? "s" : ""} • {pos} ✅ {att > 0 ? `${att} ⚠️` : ""}
          </p>
        </div>
        <span style={{
          fontSize: 18, fontWeight: 800,
          color: score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444",
        }}>{score}%</span>
      </div>
      {/* Bar */}
      <div style={{
        height: 8, borderRadius: 8, background: "#F1F5F9", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 8, width: `${score}%`,
          background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}CC)`,
          transition: "width 1s ease-out",
        }} />
      </div>
    </div>
  );
}

function TimelineItem({ log }: { log: LogPedagogico }) {
  const cfg = PILAR_CONFIG[log.pilar] || { icon: "📌", color: "#64748B" };
  const sentColors = {
    positivo: { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", label: "✅ Positivo" },
    neutro:   { bg: "#F8FAFC", border: "#E2E8F0", text: "#475569", label: "➖ Neutro" },
    atencao:  { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", label: "⚠️ Atenção" },
  };
  const s = sentColors[log.sentimento];

  return (
    <div style={{
      display: "flex", gap: 16, padding: "16px 0",
      borderBottom: "1px solid #F8FAFC",
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: `${cfg.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, flexShrink: 0,
      }}>{cfg.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{log.pilarLabel}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: s.bg, color: s.text, border: `1px solid ${s.border}`,
          }}>{s.label}</span>
          <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}>{formatDate(log.data)}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{log.nota}</p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────
export default function ShowroomPedagogico() {
  const [logs, setLogs] = useState<LogPedagogico[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"visao" | "timeline">("visao");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportApproved, setReportApproved] = useState(false);

  // States for Simulator
  const [simulatorText, setSimulatorText] = useState("");
  const [simulatorState, setSimulatorState] = useState<"idle" | "analyzing" | "result" | "saving">("idle");
  const [simulatorResult, setSimulatorResult] = useState<any>(null);

  async function handleAnalyze() {
    if (!simulatorText.trim()) return;
    setSimulatorState("analyzing");
    try {
      const res = await fetch("/api/pedagogico/classificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: simulatorText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSimulatorResult(data);
      setSimulatorState("result");
    } catch (err) {
      console.error(err);
      alert("Erro ao analisar texto.");
      setSimulatorState("idle");
    }
  }

  async function handleSaveLog() {
    if (!simulatorResult) return;
    setSimulatorState("saving");
    try {
      const res = await fetch("/api/pedagogico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota: simulatorText,
          pilar: simulatorResult.pilarId,
          pilarLabel: simulatorResult.pilarLabel,
          sentimento: simulatorResult.sentimento,
          data: new Date().toISOString().split("T")[0],
        }),
      });
      const newLog = await res.json();
      if (newLog.error) throw new Error(newLog.error);
      
      setLogs((prev) => [...prev, newLog]);
      setSimulatorText("");
      setSimulatorResult(null);
      setSimulatorState("idle");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar log.");
      setSimulatorState("result");
    }
  }

  async function handleGenerateReport() {
    if (generatingReport) return;
    setGeneratingReport(true);
    setReportContent(null);
    setReportApproved(false);
    try {
      const res = await fetch("/api/pedagogico/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alunoId: ALUNO_ID }),
      });
      const data = await res.json();
      if (data.report) {
        setReportContent(data.report);
      } else {
        alert("Erro ao gerar relatório: " + (data.error || "Desconhecido"));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar relatório.");
    } finally {
      setGeneratingReport(false);
    }
  }

  useEffect(() => {
    fetch(`/api/pedagogico?alunoId=${ALUNO_ID}`)
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => groupByPilar(logs), [logs]);
  const globalScore = useMemo(() => calcScore(logs), [logs]);
  const positivos = useMemo(() => logs.filter(l => l.sentimento === "positivo").length, [logs]);
  const atencoes = useMemo(() => logs.filter(l => l.sentimento === "atencao").length, [logs]);
  const periodoStr = useMemo(() => {
    if (!logs.length) return "";
    return `${formatDate(logs[0].data)} — ${formatDate(logs[logs.length - 1].data)}`;
  }, [logs]);

  // Sort pilares by label for display (excluding destaques — shown separately)
  const pilarEntries = useMemo(() => {
    return Object.entries(grouped)
      .filter(([k]) => k !== "destaques")
      .sort((a, b) => (PILAR_CONFIG[a[0]]?.icon || "").localeCompare(PILAR_CONFIG[b[0]]?.icon || ""));
  }, [grouped]);

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
        background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
        padding: "32px 24px 80px",
        color: "white", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -60, right: -40,
          width: 250, height: 250, borderRadius: "50%",
          background: "rgba(249,115,22,0.15)", filter: "blur(60px)",
        }} />
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Link href="/showroom" style={{
            color: "#94A3B8", fontSize: 13, textDecoration: "none", fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24,
          }}>
            ← Voltar ao Showroom
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{
              background: "rgba(249,115,22,0.2)", padding: "6px 14px", borderRadius: 20,
              fontSize: 12, fontWeight: 800, color: "#FB923C", letterSpacing: "0.05em",
            }}>🧠 INTELIGÊNCIA PEDAGÓGICA</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: "12px 0 8px", letterSpacing: "-0.02em" }}>
            Relatório Trimestral — Otto
          </h1>
          <p style={{ color: "#94A3B8", margin: 0, fontSize: 15 }}>
            Evolução baseada em {logs.length} observações da professora • {periodoStr}
          </p>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "-48px auto 0", padding: "0 24px 64px", position: "relative", zIndex: 2 }}>
        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <StatCard icon="📊" label="Score Global" value={`${globalScore}%`} sub="Performance geral" />
          <StatCard icon="📝" label="Observações" value={logs.length} sub={periodoStr} />
          <StatCard icon="✅" label="Positivos" value={positivos} sub={`${Math.round((positivos / logs.length) * 100)}% do total`} />
          <StatCard icon="⚠️" label="Pontos de Atenção" value={atencoes} sub={`${Math.round((atencoes / logs.length) * 100)}% do total`} />
        </div>

        {/* Simulator Area */}
        <div style={{
          background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
          borderRadius: 24, padding: 32, marginBottom: 32,
          border: "1px solid #BBF7D0", boxShadow: "0 4px 12px rgba(22,163,74,0.05)",
          position: "relative", overflow: "hidden"
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}>
            ✨ Simulador de Notas Rápidas (IA)
          </h3>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "#15803D", lineHeight: 1.5 }}>
            Na prática, a professora não precisa escolher nenhum "Pilar" ou "Sentimento". Basta digitar a observação de forma livre e a Inteligência Artificial categoriza tudo nos bastidores, eliminando a fricção!
          </p>
          
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <textarea
              value={simulatorText}
              onChange={(e) => setSimulatorText(e.target.value)}
              placeholder="Ex: Hoje o Otto dividiu o lanche com o amigo que estava chorando..."
              disabled={simulatorState !== "idle" && simulatorState !== "result"}
              style={{
                flex: "1 1 300px", padding: 16, borderRadius: 16, border: "1px solid #86EFAC",
                resize: "none", height: 100, fontSize: 14, outline: "none", color: "#1E293B",
                background: "white", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
              }}
            />
            {simulatorState === "idle" || simulatorState === "analyzing" ? (
              <button
                onClick={handleAnalyze}
                disabled={simulatorState === "analyzing" || !simulatorText.trim()}
                style={{
                  padding: "16px 24px", borderRadius: 16, border: "none",
                  background: simulatorState === "analyzing" || !simulatorText.trim() ? "#86EFAC" : "#22C55E",
                  color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer",
                  transition: "all 0.2s", height: 100, flexShrink: 0
                }}
              >
                {simulatorState === "analyzing" ? "Analisando..." : "Classificar com IA"}
              </button>
            ) : null}
          </div>

          {simulatorState === "result" && simulatorResult && (
            <div style={{
              marginTop: 20, background: "white", borderRadius: 16, padding: 20,
              border: "1px solid #86EFAC", display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 16
            }}>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#166534", letterSpacing: "0.05em" }}>CLASSIFICAÇÃO AUTOMÁTICA:</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <span style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: "#F1F5F9", color: "#334155"
                  }}>{PILAR_CONFIG[simulatorResult.pilarId]?.icon || "📌"} {simulatorResult.pilarLabel}</span>
                  <span style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: simulatorResult.sentimento === "positivo" ? "#DCFCE7" : simulatorResult.sentimento === "atencao" ? "#FEE2E2" : "#F1F5F9",
                    color: simulatorResult.sentimento === "positivo" ? "#166534" : simulatorResult.sentimento === "atencao" ? "#991B1B" : "#475569"
                  }}>
                    {simulatorResult.sentimento === "positivo" ? "✅ Positivo" : simulatorResult.sentimento === "atencao" ? "⚠️ Atenção" : "➖ Neutro"}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
                  <strong>Por que?</strong> <i>"{simulatorResult.justificativa}"</i>
                </p>
              </div>
              <button
                onClick={handleSaveLog}
                style={{
                  padding: "12px 24px", borderRadius: 12, border: "none",
                  background: "#166534", color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer",
                }}
              >
                Salvar Registro
              </button>
            </div>
          )}
          
          {simulatorState === "saving" && (
            <div style={{ marginTop: 20, padding: 16, textAlign: "center", color: "#166534", fontWeight: 700, fontSize: 14 }}>
              Salvo com sucesso! Atualizando dashboard...
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, background: "white", borderRadius: 14, padding: 4,
          border: "1px solid #F1F5F9", marginBottom: 24, width: "fit-content",
        }}>
          {([["visao", "📊 Visão por Pilar"], ["timeline", "📅 Linha do Tempo"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              background: tab === key ? "#F97316" : "transparent",
              color: tab === key ? "white" : "#64748B",
              transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>

        {/* Tab Content: Visão por Pilar */}
        {tab === "visao" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, marginBottom: 32 }}>
              {pilarEntries.map(([pilar, pilarLogs]) => (
                <PilarBar
                  key={pilar}
                  pilar={pilar}
                  label={pilarLogs[0]?.pilarLabel || pilar}
                  logs={pilarLogs}
                />
              ))}
            </div>

            {/* Destaques */}
            {grouped.destaques && grouped.destaques.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, #FFF7ED, #FFFBEB)",
                borderRadius: 20, padding: 28, border: "1px solid #FED7AA",
              }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#92400E", display: "flex", alignItems: "center", gap: 8 }}>
                  ⭐ Destaques e Recomendações
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {grouped.destaques.map((log) => {
                    const s = log.sentimento;
                    return (
                      <div key={log.id} style={{
                        background: "white", borderRadius: 12, padding: "14px 18px",
                        borderLeft: `4px solid ${s === "positivo" ? "#22C55E" : s === "neutro" ? "#94A3B8" : "#EF4444"}`,
                      }}>
                        <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{log.nota}</p>
                        <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94A3B8" }}>{formatDate(log.data)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Timeline */}
        {tab === "timeline" && (
          <div style={{
            background: "white", borderRadius: 20, padding: "8px 24px",
            border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            {[...logs].reverse().map((log) => (
              <TimelineItem key={log.id} log={log} />
            ))}
          </div>
        )}

        {/* CTA - Future AI Report */}
        <div style={{
          marginTop: 40,
          background: "linear-gradient(135deg, #1E293B, #0F172A)",
          borderRadius: 24, padding: "40px 32px", color: "white",
          textAlign: "center", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 180, height: 180, borderRadius: "50%",
            background: "rgba(249,115,22,0.15)", filter: "blur(50px)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{ fontSize: 40, display: "block", marginBottom: 16 }}>🤖</span>
            <h3 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800 }}>
              Relatório com Inteligência Artificial
            </h3>
            <p style={{ color: "#94A3B8", margin: "0 auto 24px", maxWidth: 500, lineHeight: 1.6, fontSize: 14 }}>
              A inteligência do Ottomatic lê todas essas observações e gera automaticamente 
              um relatório trimestral em prosa — pronto para revisão da professora e entrega aos pais.
            </p>
            <button onClick={handleGenerateReport} disabled={generatingReport} style={{
              padding: "14px 32px", borderRadius: 14, border: "none",
              background: generatingReport ? "rgba(249,115,22,0.5)" : "#F97316", color: "white",
              fontWeight: 800, fontSize: 15, cursor: generatingReport ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: generatingReport ? "none" : "0 4px 12px rgba(249,115,22,0.3)"
            }}>
              {generatingReport ? "✨ Gerando relatório (isso pode levar alguns segundos)..." : "✨ Gerar Relatório com IA"}
            </button>
          </div>
        </div>

        {/* Generated Report View - DRAFT */}
        {reportContent && !reportApproved && (
          <div style={{
            marginTop: 32, background: "white", borderRadius: 20, padding: 32,
            border: "1px solid #F1F5F9", boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, borderBottom: "1px solid #F1F5F9", paddingBottom: 16 }}>
              <span style={{ fontSize: 28 }}>✍️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Rascunho da IA (Revisão da Coordenação)</h3>
                <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Revise o texto gerado antes de liberar o documento final para a família.</p>
              </div>
            </div>
            <div style={{
              fontSize: 15, lineHeight: 1.8, color: "#334155",
              fontFamily: "system-ui, sans-serif",
              marginBottom: 32
            }}>
              {reportContent.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 20, color: "#1E293B", marginTop: 24 }}>{line.replace('## ', '')}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 18, color: "#1E293B", marginTop: 20 }}>{line.replace('### ', '')}</h3>;
                
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                  <p key={i} style={{ margin: "0 0 12px 0", minHeight: line.trim() === "" ? 12 : "auto" }}>
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

            <div style={{ display: "flex", gap: 16, borderTop: "1px solid #F1F5F9", paddingTop: 24, flexWrap: "wrap" }}>
              <button onClick={() => setReportApproved(true)} style={{
                padding: "14px 24px", borderRadius: 12, border: "none",
                background: "#0F172A", color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8
              }}>
                ✅ Aprovar e Gerar Documento Oficial
              </button>
              <button onClick={handleGenerateReport} style={{
                padding: "14px 24px", borderRadius: 12, border: "1px solid #E2E8F0",
                background: "white", color: "#64748B", fontWeight: 700, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8
              }}>
                🔄 Refazer com IA
              </button>
            </div>
          </div>
        )}

        {/* Official Document View (Printable) */}
        {reportContent && reportApproved && (
          <div style={{ marginTop: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1E293B" }}>Documento Pronto para os Pais</h3>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setReportApproved(false)} style={{
                  padding: "10px 20px", borderRadius: 10, border: "1px solid #CBD5E1",
                  background: "white", color: "#475569", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>
                  ← Voltar para Revisão
                </button>
                <button onClick={() => window.print()} style={{
                  padding: "10px 20px", borderRadius: 10, border: "none",
                  background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8
                }}>
                  🖨️ Imprimir / Salvar PDF
                </button>
              </div>
            </div>

            {/* A4 Printable Sheet */}
            <div className="printable-a4" style={{
              background: "white", padding: "60px 80px", borderRadius: 8,
              boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
              minHeight: 1123, // A4 approx height
              margin: "0 auto",
              maxWidth: 794, // A4 approx width
              fontFamily: "'Inter', system-ui, sans-serif"
            }}>
              {/* Header Escolar */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #F1F5F9", paddingBottom: 24, marginBottom: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🪐</div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.02em" }}>Escola Planeta Colorido</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  Relatório de Desenvolvimento Pedagógico
                </p>
              </div>

              {/* Info Aluno */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40, background: "#F8FAFC", padding: 24, borderRadius: 12, border: "1px solid #F1F5F9" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Aluno(a)</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1E293B" }}>Otto</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Turma</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1E293B" }}>Berçário II</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Período Avaliado</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1E293B" }}>1º Trimestre / 2026</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Professora / Coordenação</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1E293B" }}>Ana / Fabiana</p>
                </div>
              </div>

              {/* Report Body */}
              <div style={{
                fontSize: 15, lineHeight: 1.8, color: "#334155",
              }}>
                {reportContent.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 18, color: "#0F172A", marginTop: 32, borderBottom: "1px solid #F1F5F9", paddingBottom: 8 }}>{line.replace('## ', '')}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 16, color: "#0F172A", marginTop: 24 }}>{line.replace('### ', '')}</h3>;
                  
                  const parts = line.split(/(\*\*.*?\*\*)/g);
                  return (
                    <p key={i} style={{ margin: "0 0 16px 0", minHeight: line.trim() === "" ? 16 : "auto", textAlign: "justify" }}>
                      {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={j} style={{ color: "#0F172A" }}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      })}
                    </p>
                  );
                })}
              </div>
              
              {/* Assinaturas */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 80, paddingTop: 40, paddingBottom: 20 }}>
                <div style={{ textAlign: "center", width: "40%" }}>
                  <div style={{ borderTop: "1px solid #CBD5E1", paddingTop: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Assinatura da Professora</p>
                  </div>
                </div>
                <div style={{ textAlign: "center", width: "40%" }}>
                  <div style={{ borderTop: "1px solid #CBD5E1", paddingTop: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Assinatura da Coordenação</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Print styles */}
            <style jsx global>{`
              @media print {
                body {
                  background: white;
                }
                body * {
                  visibility: hidden;
                }
                .printable-a4, .printable-a4 * {
                  visibility: visible;
                }
                .printable-a4 {
                  position: absolute;
                  left: 0;
                  top: 0;
                  box-shadow: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}
