"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getDailyRecord,
  saveDailyRecord,
  getTodayDateString,
  markParentMessageRead,
  updateAISummary,
  saveTeacherMessage,
} from "@/lib/firestore";
import {
  Student,
  DailyRecord,
  Feeding,
  Activities,
  FeedingStatus,
  FEEDING_ITEMS,
  FEEDING_LABELS,
  ACTIVITY_ITEMS,
  DEFAULT_FEEDING,
  DEFAULT_ACTIVITIES,
} from "@/types";

export default function RegistroIndividual() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const { profile } = useAuth();
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [feeding, setFeeding] = useState<Feeding>({ ...DEFAULT_FEEDING });
  const [activities, setActivities] = useState<Activities>({ ...DEFAULT_ACTIVITIES });
  const [atividadeTexto, setAtividadeTexto] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [recadoPais, setRecadoPais] = useState("");
  const [mensagensPais, setMensagensPais] = useState<any[]>([]);
  const [mensagensProfessor, setMensagensProfessor] = useState<any[]>([]);
  const [newTeacherMessage, setNewTeacherMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [recadoLidoProfessor, setRecadoLidoProfessor] = useState(false);
  const [soninho, setSoninho] = useState(false);
  const [xixi, setXixi] = useState(false);
  const [coco, setCoco] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [today, setToday] = useState(getTodayDateString());

  // Refresh today's date when app becomes visible or at intervals
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const currentToday = getTodayDateString();
        if (currentToday !== today) {
          setToday(currentToday);
          setSaved(false); // Reset saved status if day changed
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    const interval = setInterval(() => {
      const currentToday = getTodayDateString();
      if (currentToday !== today) {
        setToday(currentToday);
        setSaved(false);
      }
    }, 60000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [today]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load student info
        const studentSnap = await getDoc(doc(db(), "alunos", alunoId));
        if (studentSnap.exists()) {
          setStudent({ id: studentSnap.id, ...studentSnap.data() } as Student);
        }

        // Load existing record for today
        const record = await getDailyRecord(alunoId, today);
        if (record) {
          setRecordId(record.id);
          setFeeding(record.alimentacao);
          setActivities(record.atividades);
          setAtividadeTexto(record.atividadeTexto || "");
          setObservacoes(record.observacoes || "");
          setRecadoPais(record.recadoPais || "");
          setMensagensPais(record.mensagensPais || []);
          setMensagensProfessor(record.mensagensProfessor || []);
          setRecadoLidoProfessor(record.recadoLidoProfessor || false);
          setSoninho(record.soninho || false);
          setXixi(record.xixi || false);
          setCoco(record.coco || false);
        } else {
          // Reset to defaults if no record exists for the new day
          setRecordId(null);
          setFeeding({ ...DEFAULT_FEEDING });
          setActivities({ ...DEFAULT_ACTIVITIES });
          setAtividadeTexto("");
          setObservacoes("");
          setRecadoPais("");
          setMensagensPais([]);
          setMensagensProfessor([]);
          setRecadoLidoProfessor(false);
          setSoninho(false);
          setXixi(false);
          setCoco(false);
        }
      } catch (err) {
        console.error("Error loading record:", err);
      }
      setLoading(false);
    }
    load();
  }, [alunoId, today]);

  const cycleFeedingStatus = (key: keyof Feeding) => {
    setFeeding((prev) => ({
      ...prev,
      [key]: ((prev[key] + 1) % 4) as FeedingStatus,
    }));
    setSaved(false);
  };

  const toggleActivity = (key: keyof Activities) => {
    setActivities((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaved(false);
  };

  const handleMarkAsRead = async () => {
    if (!recordId) return;
    try {
      await markParentMessageRead(recordId);
      setRecadoLidoProfessor(true);
      setMensagensPais(prev => prev.map(m => ({ ...m, lida: true })));
    } catch (err) {
      console.error(err);
      alert("Erro ao marcar como lido.");
    }
  };

  const handleSendTeacherMessage = async () => {
    if (!newTeacherMessage.trim() || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      // If no record exists for today yet, we need to create one first to get a recordId
      let currentRecordId = recordId;
      if (!currentRecordId) {
        currentRecordId = await saveDailyRecord({
          alunoId,
          escolaId: profile!.escolaId,
          turma: student?.turma || profile!.turma || "",
          data: today,
          alimentacao: feeding,
          atividades: activities,
          atividadeTexto,
          observacoes,
          recadoLidoProfessor,
          resumoIA: null,
          lido: false,
          dataLeitura: null,
          professorId: profile!.uid,
          soninho,
          xixi,
          coco,
        });
        setRecordId(currentRecordId);
      }

      await saveTeacherMessage(currentRecordId, newTeacherMessage.trim());
      
      // Auto-mark parent messages as read when replying
      if (!recadoLidoProfessor) {
        await markParentMessageRead(currentRecordId);
        setRecadoLidoProfessor(true);
        setMensagensPais(prev => prev.map(m => ({ ...m, lida: true })));
      }

      setNewTeacherMessage(""); // Clear field after send as requested
      
      // Refresh messages
      const updated = await getDailyRecord(alunoId, today);
      if (updated) {
        setMensagensProfessor(updated.mensagensProfessor || []);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Erro ao enviar mensagem.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSave = async () => {
    if (!profile || saving) return;
    setSaving(true);

    try {
      const savedRecordId = await saveDailyRecord({
        alunoId,
        escolaId: profile.escolaId,
        turma: student?.turma || profile.turma || "",
        data: today,
        alimentacao: feeding,
        atividades: activities,
        atividadeTexto,
        observacoes,
        // recadoPais: omit to avoid overwriting parent legacy message
        // mensagensPais: omit to avoid overwriting parent messages array
        recadoLidoProfessor,
        resumoIA: null,
        lido: false,
        dataLeitura: null,
        professorId: profile.uid,
        soninho,
        xixi,
        coco,
      });

      setRecordId(savedRecordId);
      setSaved(true);

      // Generate AI summary in background (fire and forget)
      const fullRecord: DailyRecord = {
        id: savedRecordId,
        alunoId,
        escolaId: profile.escolaId,
        turma: student?.turma || profile.turma || "",
        data: today,
        alimentacao: feeding,
        atividades: activities,
        atividadeTexto,
        observacoes,
        recadoPais,
        mensagensPais,
        recadoLidoProfessor,
        resumoIA: null,
        lido: false,
        dataLeitura: null,
        professorId: profile.uid,
        soninho,
        xixi,
        coco,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      console.log(`[IA] Solicitando resumo via API para ${student?.nome || "Aluno"}...`);
      
      fetch("/api/gerar-resumo", {
        method: "POST",
        body: JSON.stringify({ record: fullRecord, nomeAluno: student?.nome || "Aluno" })
      })
      .then(res => res.json())
      .then(data => {
        if (data.summary) {
          console.log("[IA] Resumo recebido:", data.summary);
          updateAISummary(savedRecordId, data.summary);
        } else {
          console.warn("[IA] API não retornou resumo:", data.error);
        }
      })
      .catch(e => {
        console.error("[IA] Erro na chamada da API:", e);
      });
    } catch (err) {
      console.error("Error saving record:", err);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Back button + Student Name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            padding: 4,
          }}
        >
          ←
        </button>
        <div>
          <h2 style={{ fontSize: 22, margin: 0 }}>{student?.nome || "Aluno"}</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>

      {/* Parent message alert */}
      {(recadoPais || (mensagensPais && mensagensPais.length > 0)) && (
        <div
          style={{
            padding: 16,
            background: "var(--accent-light)",
            borderRadius: 12,
            border: "1px solid var(--accent)",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent-dark)",
                textTransform: "uppercase",
              }}
            >
              Recados dos Pais
            </p>
            {!recadoLidoProfessor && (
              <button
                type="button"
                onClick={handleMarkAsRead}
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ✓ Marcar Recebidos
              </button>
            )}
            {recadoLidoProfessor && (
              <span style={{ fontSize: 10, color: "var(--success)", fontWeight: 700 }}>
                ✓ LIDO
              </span>
            )}
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Thread of messages (Interleaved chronologically) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(() => {
                const combined = [
                  ...(mensagensPais || []).map(m => ({ ...m, role: 'pai' })),
                  ...(mensagensProfessor || []).map(m => ({ ...m, role: 'professor' }))
                ].sort((a, b) => a.horario.localeCompare(b.horario));

                if (combined.length === 0 && recadoPais) {
                   return (
                    <div style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 12 }}>
                      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>{recadoPais}</p>
                    </div>
                   );
                }

                return combined.map((msg, idx) => (
                  <div 
                    key={msg.id || idx} 
                    style={{ 
                      borderLeft: `3px solid ${msg.role === 'pai' ? 'var(--accent)' : 'var(--primary)'}`, 
                      paddingLeft: 12,
                      marginLeft: msg.role === 'pai' ? 0 : 24 
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: msg.role === 'pai' ? 'var(--text-muted)' : 'var(--primary)', display: "block", marginBottom: 2 }}>
                      {msg.role === 'pai' ? 'Pai' : 'Você'} • {msg.horario}
                    </span>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--text-primary)" }}>
                      {msg.texto}
                    </p>
                  </div>
                ));
              })()}
            </div>

            {/* Input to reply/send message to parents */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-light)" }}>
              <textarea
                className="text-input"
                rows={2}
                placeholder="Responder ou enviar recado para os pais..."
                value={newTeacherMessage}
                onChange={(e) => setNewTeacherMessage(e.target.value)}
                style={{ fontSize: 14, background: "white" }}
              />
              <button
                type="button"
                onClick={handleSendTeacherMessage}
                disabled={sendingMessage || !newTeacherMessage.trim()}
                className="btn btn--primary"
                style={{ marginTop: 8, padding: "8px 16px", fontSize: 13 }}
              >
                {sendingMessage ? "Enviando..." : "Enviar Recado"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== ALIMENTAÇÃO (COMPACTA) ====== */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 12 }}>
        <p className="section-title" style={{ marginBottom: 12, fontSize: 13 }}>🍽️ Alimentação</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
          {FEEDING_ITEMS.map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 0",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                {item.label}
              </span>
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

      {/* ====== ROTINA (SONINHO, XIXI, COCO) ====== */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 16 }}>
        <p className="section-title" style={{ marginBottom: 12, fontSize: 13 }}>💤 Rotina</p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          {[
            { label: "Soninho", emoji: "😴", state: soninho, set: setSoninho },
            { label: "Xixi", emoji: "💧", state: xixi, set: setXixi },
            { label: "Cocô", emoji: "💩", state: coco, set: setCoco },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.set(!item.state);
                setSaved(false);
              }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "10px",
                borderRadius: "16px",
                border: "2px solid",
                borderColor: item.state ? "var(--primary)" : "var(--border)",
                background: item.state ? "var(--primary-light)" : "white",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: item.state ? "var(--primary)" : "var(--text-muted)" }}>
                {item.label}
              </span>
              <span style={{ 
                fontSize: 10, 
                fontWeight: 700, 
                color: item.state ? "var(--primary)" : "var(--text-muted)",
                textTransform: "uppercase"
              }}>
                {item.state ? "Sim" : "Não"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ====== ATIVIDADES ====== */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <p className="section-title">🎯 Atividades de Rotina</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {ACTIVITY_ITEMS.filter(i => i.category === "rotina").map((item) => (
            <button
              key={item.key}
              className="activity-chip"
              data-active={activities[item.key] ? "true" : "false"}
              onClick={() => toggleActivity(item.key)}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <p className="section-title">🗓️ Aulas Especiais</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ACTIVITY_ITEMS.filter(i => i.category === "especial").map((item) => (
            <button
              key={item.key}
              className="activity-chip"
              data-active={activities[item.key] ? "true" : "false"}
              onClick={() => toggleActivity(item.key)}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 8px" }}>
            Detalhes das atividades de hoje:
          </p>
          <textarea
            className="text-input"
            rows={2}
            placeholder="Ex: Apostila pg 54 - Prof Bel"
            value={atividadeTexto}
            onChange={(e) => {
              setAtividadeTexto(e.target.value);
              setSaved(false);
            }}
          />
        </div>
      </div>

      {/* ====== OBSERVAÇÕES ====== */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <p className="section-title">📝 Observações</p>
        <textarea
          className="text-input"
          rows={3}
          placeholder="Observações sobre o dia..."
          value={observacoes}
          onChange={(e) => {
            setObservacoes(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      {/* ====== SAVE BUTTON ====== */}
      <button
        className={`btn btn--block btn--lg ${
          saved ? "btn--secondary" : "btn--primary"
        }`}
        onClick={handleSave}
        disabled={saving}
        style={{
          marginBottom: 32,
          ...(saved
            ? {
                background: "var(--success-light)",
                color: "var(--success)",
                borderColor: "var(--success)",
              }
            : {}),
        }}
      >
        {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Agenda"}
      </button>
    </div>
  );
}
