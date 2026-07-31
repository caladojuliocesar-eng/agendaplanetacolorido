"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { saveMomento, getMomentosByTurma, deleteMomento } from "@/lib/firestore";
import { Momento } from "@/types";

const TURMAS_SUGERIDAS = [
  "Berçário I", "Berçário II",
  "Infantil I", "Infantil II", "Infantil III", "Infantil IV", "Infantil V"
];

export default function ProfessorMomentosPage() {
  const { profile } = useAuth();
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile?.turma) {
      setSelectedTurma(profile.turma);
    } else {
      setSelectedTurma("Berçário I");
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.escolaId || !selectedTurma) return;
    loadMomentos();
  }, [profile, selectedTurma]);

  async function loadMomentos() {
    if (!profile?.escolaId || !selectedTurma) return;
    setLoading(true);
    try {
      const data = await getMomentosByTurma(profile.escolaId, selectedTurma);
      setMomentos(data);
    } catch (err) {
      console.error("Erro ao carregar momentos da turma:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.escolaId || !selectedTurma || !titulo.trim()) {
      alert("Preencha o título da atividade.");
      return;
    }

    if (selectedFiles.length === 0) {
      alert("Selecione pelo menos 1 foto para publicar.");
      return;
    }

    setUploading(true);
    try {
      const photoUrls: string[] = [];

      for (const file of selectedFiles) {
        const fileRef = ref(storage(), `momentos/${profile.escolaId}/${selectedTurma}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        photoUrls.push(url);
      }

      await saveMomento({
        escolaId: profile.escolaId,
        turma: selectedTurma,
        professorId: profile.uid,
        professorNome: profile.nome || "Professora",
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        fotos: photoUrls,
      });

      alert("Momento publicado com sucesso!");
      setIsModalOpen(false);
      setTitulo("");
      setDescricao("");
      setSelectedFiles([]);
      await loadMomentos();
    } catch (err) {
      console.error("Erro ao publicar momento:", err);
      alert("Erro ao publicar foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta publicação?")) return;
    try {
      await deleteMomento(id);
      setMomentos(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Erro ao excluir momento:", err);
      alert("Erro ao excluir publicação.");
    }
  };

  return (
    <div className="app-shell">
      <header style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", margin: 0 }}>📸 Galeria de Momentos</h1>
          <p style={{ color: "#64748B", margin: "2px 0 0", fontSize: 13 }}>Registre fotos das atividades para os pais da turma acompanharem.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn--primary"
          style={{ padding: "10px 18px", fontSize: 13, fontWeight: 700 }}
        >
          + Publicar Novo Momento
        </button>
      </header>

      {/* Select Turma */}
      <div className="card" style={{ padding: 16, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>TURMA SELECIONADA:</label>
        <select
          value={selectedTurma}
          onChange={e => setSelectedTurma(e.target.value)}
          className="text-input"
          style={{ width: "auto", fontSize: 13, padding: "6px 12px" }}
        >
          {TURMAS_SUGERIDAS.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Momentos Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : momentos.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center", color: "#94A3B8" }}>
          <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>📷</span>
          <h3 style={{ fontSize: 16, color: "#475569", margin: "0 0 4px 0" }}>Nenhuma foto publicada ainda</h3>
          <p style={{ fontSize: 13, margin: 0 }}>Clique em "+ Publicar Novo Momento" para compartilhar o dia a dia da turma com os pais.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {momentos.map(momento => (
            <div key={momento.id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", background: "white" }}>
              {/* Photo Carousel or cover photo */}
              <div style={{ width: "100%", height: 220, background: "#F1F5F9", position: "relative" }}>
                {momento.fotos && momento.fotos.length > 0 ? (
                  <img
                    src={momento.fotos[0]}
                    alt={momento.titulo}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 32 }}>📸</div>
                )}
                {momento.fotos && momento.fotos.length > 1 && (
                  <span style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.7)", color: "white", padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                    +{momento.fotos.length - 1} fotos
                  </span>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1E293B" }}>{momento.titulo}</h3>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>
                      {new Date(momento.criadoEm).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {momento.descricao && (
                    <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#475569", lineHeight: 1.4 }}>
                      {momento.descricao}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F1F5F9", paddingTop: 12, marginTop: 12 }}>
                  <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                    ❤️ {momento.curtidas?.length || 0} reações de pais
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(momento.id)}
                    style={{ background: "#FEE2E2", color: "#EF4444", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Publish Form */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 500, padding: 24, background: "white", borderRadius: 16 }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 800, color: "#1E293B" }}>
              📸 Publicar Fotos da Turma ({selectedTurma})
            </h2>

            <form onSubmit={handlePublish} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>
                  TÍTULO / ATIVIDADE *
                </label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Ex: Oficina de Pintura com Guache 🎨"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>
                  LEGENDA / OBSERVAÇÕES
                </label>
                <textarea
                  className="text-input"
                  rows={3}
                  placeholder="Conte um pouco sobre como foi essa atividade com as crianças..."
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  style={{ height: "auto", padding: "10px 12px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>
                  SELECIONAR FOTOS *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="file-upload-momento"
                />
                <label
                  htmlFor="file-upload-momento"
                  style={{
                    display: "block",
                    padding: "12px",
                    background: "#F8FAFC",
                    border: "2px dashed #CBD5E1",
                    borderRadius: 12,
                    textAlign: "center",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0284C7"
                  }}
                >
                  📷 Clique para selecionar fotos do dispositivo
                </label>

                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedFiles.map((file, i) => (
                      <span key={i} style={{ background: "#E0F2FE", color: "#0369A1", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        {file.name.substring(0, 15)}...
                        <button type="button" onClick={() => handleRemoveFile(i)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontWeight: 800 }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: 12, background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn--primary"
                  style={{ flex: 1, padding: 12, fontWeight: 700 }}
                >
                  {uploading ? "Enviando..." : "Publicar Fotos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
