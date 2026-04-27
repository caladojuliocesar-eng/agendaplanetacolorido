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
} from "@/lib/firestore";
import { generateDailySummary } from "@/lib/gemini";
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
  const [feeding, setFeeding] = useState<Feeding>({ ...DEFAULT_FEEDING });
  const [activities, setActivities] = useState<Activities>({ ...DEFAULT_ACTIVITIES });
  const [atividadeTexto, setAtividadeTexto] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [recadoPais, setRecadoPais] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = getTodayDateString();

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
          setFeeding(record.alimentacao);
          setActivities(record.atividades);
          setAtividadeTexto(record.atividadeTexto || "");
          setObservacoes(record.observacoes || "");
          setRecadoPais(record.recadoPais || "");
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

  const handleSave = async () => {
    if (!profile || saving) return;
    setSaving(true);

    try {
      const recordId = await saveDailyRecord({
        alunoId,
        escolaId: profile.escolaId,
        turma: student?.turma || profile.turma || "",
        data: today,
        alimentacao: feeding,
        atividades: activities,
        atividadeTexto,
        observacoes,
        recadoPais,
        recadoLidoProfessor: true,
        resumoIA: null,
        lido: false,
        dataLeitura: null,
        professorId: profile.uid,
      });

      setSaved(true);

      // Generate AI summary in background (fire and forget)
      const fullRecord: DailyRecord = {
        id: recordId,
        alunoId,
        escolaId: profile.escolaId,
        turma: student?.turma || profile.turma || "",
        data: today,
        alimentacao: feeding,
        atividades: activities,
        atividadeTexto,
        observacoes,
        recadoPais,
        recadoLidoProfessor: true,
        resumoIA: null,
        lido: false,
        dataLeitura: null,
        professorId: profile.uid,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      generateDailySummary(fullRecord, student?.nome || "Aluno").then(
        (summary) => {
          if (summary) {
            updateAISummary(recordId, summary);
          }
        }
      );
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
      {recadoPais && (
        <div
          className="card"
          style={{
            padding: 16,
            marginBottom: 16,
            borderLeft: "4px solid var(--accent)",
            background: "var(--warning-light)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-muted)",
              margin: "0 0 4px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            💬 Recado dos Pais
          </p>
          <p style={{ fontSize: 15, margin: 0, color: "var(--text-primary)" }}>
            {recadoPais}
          </p>
        </div>
      )}

      {/* ====== ALIMENTAÇÃO ====== */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <p className="section-title">🍽️ Alimentação</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FEEDING_ITEMS.map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                {item.label}
              </span>
              <button
                className="feeding-btn"
                data-status={feeding[item.key]}
                onClick={() => cycleFeedingStatus(item.key)}
              >
                {feeding[item.key] === 0
                  ? "—"
                  : FEEDING_LABELS[feeding[item.key]]}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ====== ATIVIDADES ====== */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <p className="section-title">🎯 Atividades Desenvolvidas</p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {ACTIVITY_ITEMS.map((item) => (
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

        <div style={{ marginTop: 16 }}>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              margin: "0 0 8px",
            }}
          >
            Hoje realizamos atividades sobre:
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
