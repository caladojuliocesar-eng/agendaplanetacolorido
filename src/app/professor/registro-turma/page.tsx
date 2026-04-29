"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { saveBatchRecords, getTodayDateString } from "@/lib/firestore";
import {
  Student,
  Activities,
  ACTIVITY_ITEMS,
  DEFAULT_ACTIVITIES,
} from "@/types";

function RegistroTurmaContent() {
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const router = useRouter();

  const ids = searchParams.get("ids")?.split(",") || [];
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activities>({ ...DEFAULT_ACTIVITIES });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [today, setToday] = useState(getTodayDateString());

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setToday(getTodayDateString());
      }
    };
    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => window.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      const loaded: Student[] = [];
      for (const id of ids) {
        const snap = await getDoc(doc(db(), "alunos", id));
        if (snap.exists()) {
          loaded.push({ id: snap.id, ...snap.data() } as Student);
        }
      }
      setStudents(loaded.sort((a, b) => a.nome.localeCompare(b.nome)));
      setLoading(false);
    }
    loadStudents();
  }, []);

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
      await saveBatchRecords(
        ids,
        today,
        { atividades: activities },
        profile.uid,
        profile.escolaId,
        profile.turma || ""
      );
      setSaved(true);
    } catch (err) {
      console.error("Error saving batch:", err);
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
          <h2 style={{ fontSize: 22, margin: 0 }}>Registro em Lote</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            {students.length} aluno{students.length > 1 ? "s" : ""} selecionado
            {students.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Selected students preview */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {students.map((s) => (
          <span
            key={s.id}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              background: "var(--primary-light)",
              color: "var(--primary-dark)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {s.nome}
          </span>
        ))}
      </div>

      {/* Activities */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <p className="section-title">🎯 Atividades (para todos)</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
      </div>

      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        As atividades serão aplicadas a todos os alunos selecionados.
        <br />
        Alimentação e observações individuais devem ser preenchidas separadamente.
      </p>

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
        {saving
          ? "Salvando..."
          : saved
          ? `✓ Salvo para ${students.length} alunos!`
          : `Salvar para ${students.length} alunos`}
      </button>
    </div>
  );
}

export default function RegistroTurmaPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="spinner" />
        </div>
      }
    >
      <RegistroTurmaContent />
    </Suspense>
  );
}
