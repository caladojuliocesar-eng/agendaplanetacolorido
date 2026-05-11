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
  const [selectedAluno, setSelectedAluno] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogPedagogico[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"visao" | "timeline">("visao");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportApproved, setReportApproved] = useState(false);

  useEffect(() => {
    if (selectedAluno === ALUNO_ID) {
      setLoading(true);
      fetch(`/api/pedagogico?alunoId=${ALUNO_ID}`)
        .then(res => res.json())
        .then(data => setLogs(data.logs || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [selectedAluno]);

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

  if (!selectedAluno) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAFBFC" }}>
        <header style={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          padding: "32px 24px 80px", color: "white", position: "relative", overflow: "hidden",
        }}>
          <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <Link href="/showroom" style={{ color: "#94A3B8", fontSize: 13, textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
              ← Voltar ao Showroom
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ background: "rgba(249,115,22,0.2)", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, color: "#FB923C", letterSpacing: "0.05em" }}>
                👩‍🏫 VISÃO PROFESSORA (FECHAMENTO)
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: "12px 0 8px", letterSpacing: "-0.02em" }}>
              Meus Alunos — Fechamento
            </h1>
            <p style={{ color: "#94A3B8", margin: 0, fontSize: 15 }}>Selecione um aluno para gerar o relatório do trimestre.</p>
          </div>
        </header>

        <div style={{ maxWidth: 900, margin: "-48px auto 0", padding: "0 24px 64px", position: "relative", zIndex: 2 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 24, border: "1px solid #F1F5F9", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => setSelectedAluno(ALUNO_ID)} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "all 0.2s" }} className="hover:border-indigo-400 hover:bg-indigo-50">
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 32 }}>👦🏼</span>
                <div style={{ textAlign: "left" }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1E293B" }}>Otto</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>Berçário II</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ background: "#FEF2F2", color: "#991B1B", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Pendente de Geração</span>
                <span style={{ color: "#94A3B8" }}>→</span>
              </div>
            </button>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: 0.6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 32 }}>👧🏽</span>
                <div style={{ textAlign: "left" }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1E293B" }}>Helena</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>Berçário II</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ background: "#F0FDF4", color: "#166534", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✅ Enviado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation (Mock) */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-around", padding: "12px 0", paddingBottom: "max(12px, env(safe-area-inset-bottom))", zIndex: 50 }}>
        <Link href="/showroom/professora" style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none", color: "#94A3B8" }}>
          <span style={{ fontSize: 24, marginBottom: 4 }}>📋</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>Agenda Diária</span>
        </Link>
        <Link href="/showroom/pedagogico" style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none", color: "#6366F1" }}>
          <span style={{ fontSize: 24, marginBottom: 4 }}>🧠</span>
          <span style={{ fontSize: 11, fontWeight: 700 }}>Relatórios</span>
        </Link>
      </div>
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
            }}>👩‍🏫 VISÃO PROFESSORA (FECHAMENTO)</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: "12px 0 8px", letterSpacing: "-0.02em" }}>
            Fechamento Trimestral — Otto
          </h1>
          <p style={{ color: "#94A3B8", margin: 0, fontSize: 15 }}>
            Evolução baseada em {logs.length} observações coletadas no dia a dia • {periodoStr}
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
              Gerar Rascunho com IA
            </h3>
            <p style={{ color: "#94A3B8", margin: "0 auto 24px", maxWidth: 500, lineHeight: 1.6, fontSize: 14 }}>
              A IA vai transformar suas {logs.length} observações diárias em um relatório contínuo. Você fará a leitura inicial e depois enviará para a Coordenação revisar e aprovar.
            </p>
            <button onClick={handleGenerateReport} disabled={generatingReport} style={{
              padding: "14px 32px", borderRadius: 14, border: "none",
              background: generatingReport ? "rgba(249,115,22,0.5)" : "#F97316", color: "white",
              fontWeight: 800, fontSize: 15, cursor: generatingReport ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: generatingReport ? "none" : "0 4px 12px rgba(249,115,22,0.3)"
            }}>
              {generatingReport ? "✨ Escrevendo rascunho..." : "✨ Gerar Rascunho com IA"}
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
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Rascunho Pronto</h3>
                <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Leia para ver se está de acordo com a realidade. Se estiver tudo certo, envie para a Coordenação.</p>
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
                📤 Enviar para Coordenação
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
          <div style={{ marginTop: 40, textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 24, border: "1px solid #E2E8F0" }}>
             <span style={{ fontSize: 60, display: "block", marginBottom: 16 }}>🚀</span>
             <h3 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 800, color: "#1E293B" }}>Rascunho Enviado!</h3>
             <p style={{ color: "#64748B", margin: "0 auto", maxWidth: 400, lineHeight: 1.5 }}>
               A coordenação já recebeu o seu relatório e fará a revisão final. Excelente trabalho com o Otto neste trimestre!
             </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation (Mock) */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-around", padding: "12px 0", paddingBottom: "max(12px, env(safe-area-inset-bottom))", zIndex: 50 }}>
        <Link href="/showroom/professora" style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none", color: "#94A3B8" }}>
          <span style={{ fontSize: 24, marginBottom: 4 }}>📋</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>Agenda Diária</span>
        </Link>
        <Link href="/showroom/pedagogico" style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none", color: "#6366F1" }}>
          <span style={{ fontSize: 24, marginBottom: 4 }}>🧠</span>
          <span style={{ fontSize: 11, fontWeight: 700 }}>Relatórios</span>
        </Link>
      </div>
    </div>
  );
}
