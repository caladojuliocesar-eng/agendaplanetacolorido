"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Feeding, Activities, FeedingStatus, FEEDING_ITEMS, FEEDING_LABELS, ACTIVITY_ITEMS, DEFAULT_FEEDING, DEFAULT_ACTIVITIES } from "@/types";

// Tipos para o Pedagógico
interface LogPedagogico {
  id: string;
  data: string;
  pilar: string;
  pilarLabel: string;
  nota: string;
  sentimento: "positivo" | "neutro" | "atencao";
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

export default function ShowroomProfessora() {
  const [mounted, setMounted] = useState(false);
  
  // Estados da Agenda Normal
  const [feeding, setFeeding] = useState<Feeding>({ ...DEFAULT_FEEDING });
  const [activities, setActivities] = useState<Activities>({ ...DEFAULT_ACTIVITIES });
  const [atividadeTexto, setAtividadeTexto] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [soninho, setSoninho] = useState(false);
  const [xixi, setXixi] = useState(false);
  const [coco, setCoco] = useState(false);
  const [ausente, setAusente] = useState(false);
  
  // Estados do Novo Módulo Pedagógico (IA)
  const [iaText, setIaText] = useState("");
  const [iaState, setIaState] = useState<"idle" | "analyzing" | "result" | "saving">("idle");
  const [iaResult, setIaResult] = useState<any>(null);
  const [pedagogicoLogs, setPedagogicoLogs] = useState<LogPedagogico[]>([]);
  const [isPedagogicoOpen, setIsPedagogicoOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simula carregar logs pedagógicos anteriores do Otto
    fetch(`/api/pedagogico?alunoId=${ALUNO_ID}`)
      .then(res => res.json())
      .then(data => setPedagogicoLogs(data.logs || []))
      .catch(console.error);
  }, []);

  const cycleFeedingStatus = (key: keyof Feeding) => {
    setFeeding((prev) => ({
      ...prev,
      [key]: ((prev[key] + 1) % 4) as FeedingStatus,
    }));
  };

  const toggleActivity = (key: keyof Activities) => {
    setActivities((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Funções da IA
  async function handleAnalyze() {
    if (!iaText.trim()) return;
    setIaState("analyzing");
    try {
      const res = await fetch("/api/pedagogico/classificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: iaText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIaResult(data);
      setIaState("result");
    } catch (err) {
      console.error(err);
      alert("Erro ao analisar texto.");
      setIaState("idle");
    }
  }

  async function handleSavePedagogico() {
    if (!iaResult) return;
    setIaState("saving");
    try {
      const res = await fetch("/api/pedagogico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota: iaText,
          pilar: iaResult.pilarId,
          pilarLabel: iaResult.pilarLabel,
          sentimento: iaResult.sentimento,
          data: new Date().toISOString().split("T")[0],
        }),
      });
      const newLog = await res.json();
      if (newLog.error) throw new Error(newLog.error);
      
      setPedagogicoLogs(prev => [newLog, ...prev]);
      setIaText("");
      setIaResult(null);
      setIaState("idle");
      setIsPedagogicoOpen(false); // Fecha ao salvar
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar.");
      setIaState("result");
    }
  }

  // Função Simples de Voz (Usa a Web Speech API do navegador)
  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Seu navegador não suporta digitação por voz. Tente usar o botão de microfone do seu teclado no celular.");
      return;
    }
    
    if (isListening) return; // Parar a gravação não é manual na api simples, ela para ao silêncio.

    setIsListening(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIaText(prev => prev ? prev + " " + transcript : transcript);
    };

    recognition.onerror = (e: any) => console.error("Erro de voz", e);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  if (!mounted) return null;

  return (
    <div className="app-shell" style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: "#F8FAFC" }}>
      {/* Fake Header da Professora */}
      <header className="app-header" style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", padding: "12px 16px" }}>
        <div className="container" style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link href="/showroom" style={{ color: "white", textDecoration: "none", fontSize: 24, lineHeight: 1 }}>←</Link>
              <h1 style={{ fontSize: 16, color: "white", margin: 0, fontWeight: 700 }}>
                Planeta Colorido
              </h1>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
               <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "white", opacity: 0.9 }}>
                  <span className="sync-dot sync-dot--online" />
                  ON
               </div>
               <span style={{
                  background: "rgba(255,255,255,0.2)", color: "white",
                  padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                }}>
                  Modo Demo
                </span>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 4 }}>
            <p style={{ fontSize: 12, color: "white", margin: 0, opacity: 0.9 }}>
              Berçário II · Prof. Ana 👩‍🏫
            </p>
          </div>
        </div>
      </header>

      {/* Conteúdo da Agenda */}
      <main style={{ padding: "16px 16px 100px", maxWidth: 600, margin: "0 auto", width: "100%" }}>
        
        {/* Cabeçalho do Aluno */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FFEDD5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👦🏼</div>
          <div>
            <h2 style={{ fontSize: 22, margin: 0, color: "#1E293B", fontWeight: 800 }}>Otto</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        {/* Status de Presença */}
        <div className="card" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", border: ausente ? "1px solid var(--text-muted)" : "1px solid var(--success-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{ausente ? "🏠" : "🎒"}</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: ausente ? "var(--text-muted)" : "var(--success)" }}>
                {ausente ? "Aluno Ausente" : "Aluno Presente"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAusente(!ausente)}
            className={`btn ${ausente ? "btn--secondary" : "btn--outline"}`}
            style={{ fontSize: 11, padding: "6px 12px" }}
          >
            {ausente ? "Marcar Presente" : "Marcar Falta"}
          </button>
        </div>

        <div style={{ opacity: ausente ? 0.4 : 1, pointerEvents: ausente ? "none" : "auto", transition: "opacity 0.2s" }}>



          {/* Agenda Tradicional: Alimentação */}
          <div className="card" style={{ padding: "16px 20px", marginBottom: 12 }}>
            <p className="section-title" style={{ marginBottom: 12, fontSize: 13 }}>🍽️ Alimentação (Agenda Normal)</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
              {FEEDING_ITEMS.map((item) => (
                <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{item.label}</span>
                  <button
                    className="feeding-btn"
                    style={{ padding: "4px 10px", fontSize: 12, minWidth: 70 }}
                    data-status={feeding[item.key]}
                    onClick={() => cycleFeedingStatus(item.key)}
                  >
                    {feeding[item.key] === 0 ? "—" : FEEDING_LABELS[feeding[item.key]]}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Agenda Tradicional: Rotina */}
          <div className="card" style={{ padding: "16px 20px", marginBottom: 16 }}>
            <p className="section-title" style={{ marginBottom: 12, fontSize: 13 }}>💤 Rotina (Agenda Normal)</p>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              {[
                { label: "Soninho", emoji: "😴", state: soninho, set: setSoninho },
                { label: "Xixi", emoji: "💧", state: xixi, set: setXixi },
                { label: "Cocô", emoji: "💩", state: coco, set: setCoco },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.set(!item.state)}
                  style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "10px", borderRadius: "16px", border: "2px solid",
                    borderColor: item.state ? "var(--primary)" : "var(--border)",
                    background: item.state ? "var(--primary-light)" : "white", cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{item.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: item.state ? "var(--primary)" : "var(--text-muted)" }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Agenda Tradicional: Observações Gerais */}
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <p className="section-title">📝 Recado para os Pais (Agenda Normal)</p>
            <textarea
              className="text-input"
              rows={2}
              placeholder="Ex: Trazer fraldas tamanho G amanhã..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

        </div>

        <button className="btn btn--block btn--lg btn--primary" onClick={() => alert("Demonstração: No app real, isso salvaria a agenda do dia.")}>
          Salvar Agenda de Hoje
        </button>

        {/* ====== MÓDULO NOVO: INPUT PEDAGÓGICO IA ====== */}
        <div style={{ marginTop: 32, paddingTop: 32, borderTop: "2px dashed #CBD5E1" }}>
          {!isPedagogicoOpen ? (
            <button
              onClick={() => setIsPedagogicoOpen(true)}
              className="btn btn--block"
              style={{
                background: "#EEF2FF",
                color: "#4F46E5",
                border: "2px dashed #A5B4FC",
                padding: "16px",
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
            >
              <span style={{ fontSize: 18 }}>📝</span> Adicionar Observação Pedagógica
            </button>
          ) : (
            <div className="card" style={{ padding: 20, border: "2px solid #818CF8", background: "#EEF2FF" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🧠</span>
                  <p className="section-title" style={{ margin: 0, color: "#4F46E5" }}>Nova Observação</p>
                </div>
                <button 
                  onClick={() => setIsPedagogicoOpen(false)}
                  style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#6366F1", padding: 4 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <textarea
                  className="text-input"
                  rows={3}
                  placeholder="Ex: Hoje ele dividiu o brinquedo, brincou bastante no tanque de areia..."
                  value={iaText}
                  onChange={(e) => setIaText(e.target.value)}
                  disabled={iaState === "analyzing" || iaState === "saving"}
                  style={{ background: "white", border: "1px solid #C7D2FE", marginBottom: 12, paddingRight: 40 }}
                />
                {/* Botão de Gravação por Voz */}
                <button
                  onClick={toggleVoice}
                  disabled={iaState === "analyzing" || iaState === "saving"}
                  style={{
                    position: "absolute", right: 8, top: 8,
                    background: isListening ? "#EF4444" : "#EEF2FF",
                    color: isListening ? "white" : "#4F46E5",
                    border: "none", borderRadius: "50%",
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 16, transition: "background 0.2s"
                  }}
                  title="Falar"
                >
                  {isListening ? "🔴" : "🎤"}
                </button>
              </div>

              {(iaState === "idle" || iaState === "analyzing") && (
                <button
                  onClick={handleAnalyze}
                  disabled={iaState === "analyzing" || !iaText.trim()}
                  className="btn btn--primary btn--block"
                  style={{
                    background: iaState === "analyzing" || !iaText.trim() ? "#A5B4FC" : "#6366F1",
                    border: "none", fontSize: 14
                  }}
                >
                  {iaState === "analyzing" ? "🔄 A IA está lendo..." : "✨ Salvar Observação"}
                </button>
              )}

              {iaState === "result" && iaResult && (
                <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #C7D2FE" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 800, color: "#4F46E5", textTransform: "uppercase" }}>
                    Classificado como:
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#F1F5F9", color: "#334155" }}>
                      {PILAR_CONFIG[iaResult.pilarId]?.icon} {iaResult.pilarLabel}
                    </span>
                    <span style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: iaResult.sentimento === "positivo" ? "#DCFCE7" : iaResult.sentimento === "atencao" ? "#FEE2E2" : "#F1F5F9",
                      color: iaResult.sentimento === "positivo" ? "#166534" : iaResult.sentimento === "atencao" ? "#991B1B" : "#475569",
                    }}>
                      {iaResult.sentimento === "positivo" ? "✅ Positivo" : iaResult.sentimento === "atencao" ? "⚠️ Atenção" : "➖ Neutro"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleSavePedagogico} className="btn btn--primary" style={{ flex: 1, background: "#4F46E5", border: "none", fontSize: 13 }}>
                      Confirmar
                    </button>
                    <button onClick={() => { setIaState("idle"); setIaResult(null); }} className="btn btn--secondary" style={{ flex: 1, fontSize: 13 }}>
                      Refazer
                    </button>
                  </div>
                </div>
              )}

              {iaState === "saving" && (
                <p style={{ margin: 0, textAlign: "center", color: "#4F46E5", fontSize: 14, fontWeight: 600 }}>✓ Salvo!</p>
              )}
            </div>
          )}
          
          {/* Lista dos últimos 2 registros hoje (Visível apenas se houver registros) */}
          {!isPedagogicoOpen && pedagogicoLogs.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {pedagogicoLogs.slice(0, 2).map((log) => (
                <div key={log.id} style={{ background: "white", padding: 10, borderRadius: 8, fontSize: 12, color: "#475569", border: "1px solid #E2E8F0", marginBottom: 6 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                    <strong>{PILAR_CONFIG[log.pilar]?.icon} {log.pilarLabel}</strong>
                  </div>
                  <p style={{ margin: 0, fontStyle: "italic" }}>"{log.nota}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* ================================================= */}

      </main>

      {/* Bottom Navigation (Mock) */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-around", padding: "12px 0", paddingBottom: "max(12px, env(safe-area-inset-bottom))", zIndex: 50 }}>
        <Link href="/showroom/professora" style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none", color: "#6366F1" }}>
          <span style={{ fontSize: 24, marginBottom: 4 }}>📋</span>
          <span style={{ fontSize: 11, fontWeight: 700 }}>Agenda Diária</span>
        </Link>
        <Link href="/showroom/pedagogico" style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none", color: "#94A3B8" }}>
          <span style={{ fontSize: 24, marginBottom: 4 }}>🧠</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>Relatórios</span>
        </Link>
      </div>
    </div>
  );
}
