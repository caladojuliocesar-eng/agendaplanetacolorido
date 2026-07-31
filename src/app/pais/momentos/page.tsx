"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getStudentsByParent, getMomentosByTurma, toggleCurtiMomento } from "@/lib/firestore";
import { Student, Momento } from "@/types";

export default function PaisMomentosPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.filhos?.length) {
      setLoading(false);
      return;
    }

    async function loadKids() {
      try {
        const kids = await getStudentsByParent(profile!.filhos!);
        setStudents(kids);
        if (kids.length > 0) {
          setSelectedStudent(kids[0]);
        }
      } catch (err) {
        console.error("Erro ao carregar filhos:", err);
      } finally {
        setLoading(false);
      }
    }

    loadKids();
  }, [profile]);

  useEffect(() => {
    if (!profile?.escolaId || !selectedStudent) return;
    loadMomentos();
  }, [profile, selectedStudent]);

  async function loadMomentos() {
    if (!profile?.escolaId || !selectedStudent) return;
    setLoading(true);
    try {
      const data = await getMomentosByTurma(profile.escolaId, selectedStudent.turma);
      setMomentos(data);
    } catch (err) {
      console.error("Erro ao carregar momentos da turma:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleLike = async (momentoId: string) => {
    if (!profile?.uid) return;
    try {
      await toggleCurtiMomento(momentoId, profile.uid);
      setMomentos(prev => prev.map(m => {
        if (m.id === momentoId) {
          const curtidas = m.curtidas || [];
          const isLiked = curtidas.includes(profile.uid);
          const updated = isLiked
            ? curtidas.filter(id => id !== profile.uid)
            : [...curtidas, profile.uid];
          return { ...m, curtidas: updated };
        }
        return m;
      }));
    } catch (err) {
      console.error("Erro ao curtir momento:", err);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ paddingBottom: 80 }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", margin: 0 }}>📸 Galeria de Momentos</h1>
        <p style={{ color: "#64748B", margin: "2px 0 0", fontSize: 13 }}>Acompanhe os momentos e atividades da turma no dia a dia escolar.</p>
      </header>

      {/* Student Selector */}
      {students.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
          {students.map((s) => (
            <button
              key={s.id}
              className={`btn ${selectedStudent?.id === s.id ? "btn--primary" : "btn--secondary"}`}
              style={{ fontSize: 13, padding: "8px 16px", whiteSpace: "nowrap" }}
              onClick={() => setSelectedStudent(s)}
            >
              {s.nome}
            </button>
          ))}
        </div>
      )}

      {selectedStudent && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--primary-light)", borderRadius: 12, border: "1px solid var(--primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>
            Turma: {selectedStudent.turma}
          </span>
          <span style={{ fontSize: 12, color: "#64748B" }}>
            {momentos.length} momentos publicados
          </span>
        </div>
      )}

      {/* Momentos Feed */}
      {momentos.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center", color: "#94A3B8" }}>
          <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>🖼️</span>
          <h3 style={{ fontSize: 16, color: "#475569", margin: "0 0 4px 0" }}>Nenhum registro postado recentemente</h3>
          <p style={{ fontSize: 13, margin: 0 }}>Assim que a professora publicar fotos das atividades da turma, elas aparecerão aqui!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {momentos.map((momento) => {
            const isLiked = profile?.uid ? (momento.curtidas || []).includes(profile.uid) : false;

            return (
              <div key={momento.id} className="card" style={{ padding: 0, overflow: "hidden", background: "white", borderRadius: 16, border: "1px solid #E2E8F0" }}>
                {/* Moment Header */}
                <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9" }}>
                  <div>
                    <strong style={{ fontSize: 14, color: "#1E293B", display: "block" }}>{momento.titulo}</strong>
                    <span style={{ fontSize: 11, color: "#64748B" }}>
                      {momento.professorNome ? `Por Profª ${momento.professorNome} • ` : ''}
                      {new Date(momento.criadoEm).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                {/* Photo Grid / Carousel */}
                <div style={{ background: "#0F172A", position: "relative" }}>
                  {momento.fotos && momento.fotos.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: momento.fotos.length > 1 ? "1fr 1fr" : "1fr", gap: 2 }}>
                      {momento.fotos.map((foto, idx) => (
                        <div key={idx} style={{ height: 260, position: "relative", cursor: "pointer" }} onClick={() => setSelectedPhoto(foto)}>
                          <img
                            src={foto}
                            alt={`${momento.titulo} ${idx + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Moment Footer Description and Likes */}
                <div style={{ padding: 16 }}>
                  {momento.descricao && (
                    <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                      {momento.descricao}
                    </p>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleLike(momento.id)}
                      style={{
                        background: isLiked ? "#FEE2E2" : "#F8FAFC",
                        color: isLiked ? "#EF4444" : "#64748B",
                        border: isLiked ? "1px solid #FCA5A5" : "1px solid #E2E8F0",
                        padding: "6px 14px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      {isLiked ? "❤️ Amei!" : "🤍 Curtir"} ({momento.curtidas?.length || 0})
                    </button>

                    {momento.fotos && momento.fotos.length > 0 && (
                      <a
                        href={momento.fotos[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "#0284C7", fontWeight: 700, textDecoration: "underline" }}
                      >
                        📥 Baixar Foto HD
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* High-res Image Modal */}
      {selectedPhoto && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setSelectedPhoto(null)}>
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }} onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Momento Ampliado" style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 12 }} />
            <div style={{ marginTop: 12, textAlign: "center", display: "flex", justifyContent: "center", gap: 16 }}>
              <a
                href={selectedPhoto}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: "#0284C7", color: "white", padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}
              >
                📥 Download Foto
              </a>
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{ background: "#64748B", color: "white", padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
