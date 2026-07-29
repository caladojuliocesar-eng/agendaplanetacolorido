"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  getAllStudents, 
  addStudent, 
  updateStudent, 
  getAllUsers, 
  addUser, 
  linkParentToStudent, 
  unlinkParentFromStudent, 
  updateUser,
  getMatriculaSolicitudes,
  approveMatriculaSolicitude,
  rejectMatriculaSolicitude,
  updateMatriculaSolicitude
} from "@/lib/firestore";
import { Student, UserProfile } from "@/types";

const TURMAS_SUGERIDAS = [
  "Berçário I", "Berçário II",
  "Infantil I", "Infantil II", "Infantil III", "Infantil IV", "Infantil V"
];

export default function AlunosAdminPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUserProfile] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempFotoUrl, setTempFotoUrl] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const compressAndUploadImage = async (file: File, schoolId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 250;
          const MAX_HEIGHT = 250;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error("Erro na compressão"));
              return;
            }
            try {
              const fileRef = ref(storage(), `student_profiles/${schoolId}/${Date.now()}_photo.webp`);
              await uploadBytes(fileRef, blob);
              const url = await getDownloadURL(fileRef);
              resolve(url);
            } catch (err) {
              reject(err);
            }
          }, "image/webp", 0.7);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<"geral" | "saude" | "responsaveis">("geral");
  
  const [formData, setFormData] = useState({ 
    nome: "", 
    turma: "",
    dataNascimento: "",
    genero: "",
    endereco: "",
    alergias: "",
    medicamentosContinuos: "",
    restricoesAlimentares: "",
    tipoSanguineo: "",
    convenioMedico: "",
    contatoPediatra: "",
  });
  const [saving, setSaving] = useState(false);

  // Parent Linking State
  const [parentSearchEmail, setParentSearchEmail] = useState("");
  const [parentNewName, setParentNewName] = useState("");

  // Fichas de Matrícula Externa (Simplificação Ponto 3)
  const [pendingSolicitudes, setPendingSolicitudes] = useState<any[]>([]);
  const [selectedSolicitude, setSelectedSolicitude] = useState<any | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    if (!profile?.escolaId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [profile]);

  async function loadData() {
    setLoading(true);
    try {
      const [studentsData, usersData, solicitudesData] = await Promise.all([
        getAllStudents(profile!.escolaId!),
        getAllUsers(profile!.escolaId!),
        getMatriculaSolicitudes(profile!.escolaId!)
      ]);
      setStudents(studentsData);
      setUserProfile(usersData);
      setPendingSolicitudes(solicitudesData.filter(s => s.status === "pendente"));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleEditSolicitudeField = (section: string, field: string, value: any) => {
    setSelectedSolicitude((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleApproveSolicitude = async () => {
    if (!selectedSolicitude) return;
    if (!selectedSolicitude.aluno?.nome?.trim()) {
      alert("Por favor, preencha o nome do aluno.");
      return;
    }
    setSaving(true);
    try {
      await updateMatriculaSolicitude(selectedSolicitude.id, selectedSolicitude);
      await approveMatriculaSolicitude(selectedSolicitude.id, profile!.escolaId!);
      alert(`Matrícula de ${selectedSolicitude.aluno.nome} aprovada com sucesso! Aluno cadastrado.`);
      setIsReviewModalOpen(false);
      setSelectedSolicitude(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erro ao aprovar matrícula.");
    } finally {
      setSaving(false);
    }
  };

  const handleRejectSolicitude = async () => {
    if (!selectedSolicitude) return;
    const confirm = window.confirm(`Deseja recusar a matrícula de ${selectedSolicitude.aluno.nome}?`);
    if (!confirm) return;

    setSaving(true);
    try {
      await rejectMatriculaSolicitude(selectedSolicitude.id);
      alert("Ficha recusada.");
      setIsReviewModalOpen(false);
      setSelectedSolicitude(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erro ao recusar matrícula.");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.turma.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getParentsForStudent = (studentId: string) => {
    return users.filter(u => u.role === "pai" && u.filhos && u.filhos.includes(studentId));
  };

  const handleOpenModal = (student?: Student) => {
    console.log("Abrindo modal para:", student?.nome || "Novo Aluno");
    if (student) {
      setEditingStudent(student);
      setTempFotoUrl(student.fotoUrl || null);
      setFormData({ 
        nome: student.nome, 
        turma: student.turma,
        dataNascimento: student.dataNascimento || "",
        genero: student.genero || "",
        endereco: student.endereco || "",
        alergias: student.alergias || "",
        medicamentosContinuos: student.medicamentosContinuos || "",
        restricoesAlimentares: student.restricoesAlimentares || "",
        tipoSanguineo: student.tipoSanguineo || "",
        convenioMedico: student.convenioMedico || "",
        contatoPediatra: student.contatoPediatra || "",
      });
      setActiveTab("geral");
    } else {
      setEditingStudent(null);
      setTempFotoUrl(null);
      setFormData({ 
        nome: "", 
        turma: "",
        dataNascimento: "",
        genero: "",
        endereco: "",
        alergias: "",
        medicamentosContinuos: "",
        restricoesAlimentares: "",
        tipoSanguineo: "",
        convenioMedico: "",
        contatoPediatra: "",
      });
      setActiveTab("geral");
    }
    setParentSearchEmail("");
    setParentNewName("");
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (students.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");
      if (editId) {
        const studentToEdit = students.find(s => s.id === editId);
        if (studentToEdit) {
          handleOpenModal(studentToEdit);
        }
      }
    }
  }, [students]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          ...formData,
          fotoUrl: tempFotoUrl,
          atualizadoEm: new Date().toISOString()
        });
      } else {
        await addStudent({
          ...formData,
          escolaId: profile!.escolaId!,
          paiIds: [],
          fotoUrl: tempFotoUrl,
          criadoEm: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao salvar aluno.");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkParent = async () => {
    if (!editingStudent) return;
    if (!parentSearchEmail) return;

    setSaving(true);
    try {
      const emailLower = parentSearchEmail.toLowerCase().trim();
      const existingUser = users.find(u => u.email === emailLower && u.role === "pai");

      if (existingUser) {
        if (!existingUser.filhos?.includes(editingStudent.id)) {
          await linkParentToStudent(existingUser.uid, editingStudent.id);
        }
      } else {
        if (!parentNewName) {
          alert("Por favor, preencha o nome do novo responsável.");
          setSaving(false);
          return;
        }
        await addUser({
          nome: parentNewName,
          email: emailLower,
          role: "pai",
          escolaId: profile!.escolaId!,
          filhos: [editingStudent.id],
          criadoEm: new Date().toISOString()
        } as Omit<UserProfile, "uid">);
      }
      
      setParentSearchEmail("");
      setParentNewName("");
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erro ao vincular responsável.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkParent = async (userId: string) => {
    if (!editingStudent) return;
    if (window.confirm("Tem certeza que deseja desvincular este responsável?")) {
      setSaving(true);
      try {
        await unlinkParentFromStudent(userId, editingStudent.id);
        await loadData();
      } catch (err) {
        console.error(err);
        alert("Erro ao desvincular.");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleUpdateParentFlags = async (parentUid: string, parentesco: string, flags: string[]) => {
    setSaving(true);
    try {
      const parent = users.find(u => u.uid === parentUid);
      if (!parent || !editingStudent) return;

      const currentVinculos = parent.vinculoFilhos || {};
      const updatedVinculos = {
        ...currentVinculos,
        [editingStudent.id]: {
          parentesco,
          flags
        }
      };

      await updateUser(parentUid, {
        vinculoFilhos: updatedVinculos
      });

      await loadData();
    } catch (err) {
      console.error("Erro ao atualizar responsabilidades:", err);
      alert("Erro ao atualizar responsabilidades.");
    } finally {
      setSaving(false);
    }
  };

  const isEmailExisting = parentSearchEmail.trim().length > 3 && users.some(u => u.email === parentSearchEmail.toLowerCase().trim() && u.role === "pai");
  const linkedParents = editingStudent ? getParentsForStudent(editingStudent.id) : [];

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>Gestão de Alunos</h1>
          <p style={{ color: "#64748B", margin: 0 }}>Visualize e organize todos os alunos da escola.</p>
        </div>
        <button className="btn btn--primary" onClick={() => handleOpenModal()}>
          + Novo Aluno
        </button>
      </header>

      {pendingSolicitudes.length > 0 && (
        <div style={{
          background: "var(--primary-light)",
          border: "1px dashed var(--primary)",
          borderRadius: 16,
          padding: "16px 24px",
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--primary-dark)" }}>
            📝 {pendingSolicitudes.length} ficha(s) de matrícula externa pendente(s)
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingSolicitudes.map(solic => (
              <div key={solic.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "12px 16px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div>
                  <strong style={{ fontSize: 13, color: "#1E293B" }}>{solic.aluno?.nome}</strong>
                  <span style={{ fontSize: 11, color: "#64748B", marginLeft: 8 }}>
                    Turma Recomendada: {solic.aluno?.turma} | Preenchido em: {new Date(solic.criadoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <button 
                  onClick={() => { setSelectedSolicitude(solic); setIsReviewModalOpen(true); }}
                  className="btn btn--primary" 
                  style={{ fontSize: 11, padding: "6px 12px" }}
                >
                  🔍 Revisar & Efetivar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", background: "white" }}>
          <input
            type="text"
            className="text-input"
            placeholder="🔍 Buscar por nome ou turma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 600 }}>
            <thead style={{ background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
              <tr>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Aluno</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Turma</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Responsáveis</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Data Cadastro</th>
                <th style={{ padding: "16px 24px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 48, textAlign: "center", color: "#64748B" }}>
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const parents = getParentsForStudent(student.id);
                  return (
                    <tr key={student.id} style={{ borderBottom: "1px solid #F1F5F9", background: "white" }}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, background: "#E2E8F0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                            {student.fotoUrl ? <img src={student.fotoUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: 10, objectFit: "cover" }} /> : "👶"}
                          </div>
                          <span style={{ fontWeight: 600, color: "#1E293B" }}>{student.nome}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ padding: "4px 10px", background: "#E0F2FE", color: "#0369A1", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>{student.turma}</span>
                      </td>
                      <td style={{ padding: "16px 24px", color: "#64748B", fontSize: 14 }}>
                        {parents.length === 0 ? (
                          <span style={{ color: "#94A3B8" }}>Sem responsáveis</span>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {parents.map(p => {
                              const vinculo = p.vinculoFilhos?.[student.id];
                              const parentesco = vinculo?.parentesco || "Responsável";
                              const flags = vinculo?.flags || [];
                              return (
                                <div key={p.uid} style={{ fontSize: 13 }}>
                                  <span style={{ fontWeight: 600, color: "#334155" }}>
                                    {p.nome} ({parentesco})
                                  </span>
                                  {flags.length > 0 && (
                                    <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                                      {flags.map(f => {
                                        let label = f;
                                        let bg = "#F1F5F9";
                                        let text = "#475569";
                                        if (f === "financeiro") {
                                          label = "Financeiro";
                                          bg = "#DCFCE7";
                                          text = "#15803D";
                                        } else if (f === "academico") {
                                          label = "Acadêmico";
                                          bg = "#DBEAFE";
                                          text = "#1D4ED8";
                                        } else if (f === "guarda_compartilhada") {
                                          label = "Guarda Comp.";
                                          bg = "#FFEDD5";
                                          text = "#C2410C";
                                        } else if (f === "emergencia") {
                                          label = "Emergência";
                                          bg = "#FEE2E2";
                                          text = "#B91C1C";
                                        }
                                        return (
                                          <span key={f} style={{
                                            fontSize: 9,
                                            fontWeight: 700,
                                            padding: "1px 4px",
                                            borderRadius: 4,
                                            background: bg,
                                            color: text,
                                            textTransform: "uppercase"
                                          }}>
                                            {label}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px", color: "#64748B", fontSize: 14 }}>{student.criadoEm ? new Date(student.criadoEm).toLocaleDateString("pt-BR") : "---"}</td>
                      <td style={{ padding: "16px 24px", textAlign: "right" }}>
                        <button onClick={() => handleOpenModal(student)} style={{ background: "none", border: "none", color: "#F97316", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Ver Perfil / Editar</button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, padding: 16, overflowY: "auto" }}>
          <div className="card" style={{ width: "100%", maxWidth: 650, padding: 0, margin: "auto", marginTop: 40, marginBottom: 40, overflow: "hidden" }}>
            <div style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", padding: "20px 32px 0 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h2 style={{ margin: "0 0 16px 0", fontSize: 20, color: "#1E293B" }}>{editingStudent ? `Perfil: ${editingStudent.nome}` : "Cadastrar Novo Aluno"}</h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: 24, color: "#94A3B8", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                <button onClick={() => setActiveTab("geral")} style={{ padding: "12px 0", border: "none", background: "none", fontSize: 13, fontWeight: 700, color: activeTab === "geral" ? "var(--primary)" : "#64748B", borderBottom: activeTab === "geral" ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer" }}>DADOS GERAIS</button>
                <button onClick={() => setActiveTab("saude")} style={{ padding: "12px 0", border: "none", background: "none", fontSize: 13, fontWeight: 700, color: activeTab === "saude" ? "var(--primary)" : "#64748B", borderBottom: activeTab === "saude" ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer" }}>FICHA MÉDICA</button>
                <button disabled={!editingStudent} onClick={() => setActiveTab("responsaveis")} style={{ padding: "12px 0", border: "none", background: "none", fontSize: 13, fontWeight: 700, color: !editingStudent ? "#CBD5E1" : (activeTab === "responsaveis" ? "var(--primary)" : "#64748B"), borderBottom: activeTab === "responsaveis" ? "2px solid var(--primary)" : "2px solid transparent", cursor: !editingStudent ? "not-allowed" : "pointer" }}>RESPONSÁVEIS</button>
              </div>
            </div>

            <div style={{ padding: 32 }}>
              {activeTab === "geral" && (
                <form onSubmit={handleSaveStudent} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Campo de Upload de Foto de Perfil */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16, borderBottom: "1px dashed #E2E8F0", paddingBottom: 16 }}>
                    <div style={{ position: "relative", width: 80, height: 80, borderRadius: "50%", background: "#F1F5F9", border: "2px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: 32, flexShrink: 0 }}>
                      {tempFotoUrl ? (
                        <img src={tempFotoUrl} alt="Foto do aluno" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        "👶"
                      )}
                      {uploadingFoto && (
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>
                          Envio...
                        </div>
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        id="student-photo-file" 
                        accept="image/*" 
                        style={{ display: "none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingFoto(true);
                            try {
                              const url = await compressAndUploadImage(file, profile!.escolaId!);
                              setTempFotoUrl(url);
                            } catch (err) {
                              console.error(err);
                              alert("Erro ao processar/enviar foto.");
                            } finally {
                              setUploadingFoto(false);
                            }
                          }
                        }}
                      />
                      <label 
                        htmlFor="student-photo-file"
                        style={{ display: "inline-block", padding: "8px 16px", background: "white", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#475569", cursor: "pointer", marginRight: 8 }}
                      >
                        {tempFotoUrl ? "Alterar Foto" : "Selecionar Foto"}
                      </label>
                      {tempFotoUrl && (
                        <button 
                          type="button" 
                          onClick={() => setTempFotoUrl(null)}
                          style={{ padding: "8px 16px", background: "#FEE2E2", border: "none", color: "#EF4444", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                        >
                          Remover
                        </button>
                      )}
                      <p style={{ margin: "6px 0 0 0", fontSize: 11, color: "#94A3B8" }}>As fotos serão redimensionadas e comprimidas no próprio celular/PC para economizar espaço.</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>NOME COMPLETO *</label>
                      <input required type="text" className="text-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Benjamin da Silva" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>TURMA *</label>
                      <select required className="text-input" value={formData.turma} onChange={e => setFormData({...formData, turma: e.target.value})}>
                        <option value="" disabled>Selecione...</option>
                        {TURMAS_SUGERIDAS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>DATA DE NASCIMENTO</label>
                      <input type="date" className="text-input" value={formData.dataNascimento} onChange={e => setFormData({...formData, dataNascimento: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>GÊNERO</label>
                      <select className="text-input" value={formData.genero} onChange={e => setFormData({...formData, genero: e.target.value})}>
                        <option value="">Selecione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>ENDEREÇO RESIDENCIAL</label>
                    <input type="text" className="text-input" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} placeholder="Rua, número, bairro..." />
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 12, background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                    <button type="submit" disabled={saving} className="btn btn--primary" style={{ flex: 1 }}>{saving ? "Salvando..." : "Salvar Dados Gerais"}</button>
                  </div>
                </form>
              )}

              {activeTab === "saude" && (
                <form onSubmit={handleSaveStudent} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>ALERGIAS</label>
                    <textarea className="text-input" style={{ minHeight: 60 }} value={formData.alergias} onChange={e => setFormData({...formData, alergias: e.target.value})} placeholder="Descreva alergias..." />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>TIPO SANGUÍNEO</label>
                      <input type="text" className="text-input" value={formData.tipoSanguineo} onChange={e => setFormData({...formData, tipoSanguineo: e.target.value})} placeholder="A+, O-, etc." />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>RESTRIÇÕES ALIMENTARES</label>
                      <input type="text" className="text-input" value={formData.restricoesAlimentares} onChange={e => setFormData({...formData, restricoesAlimentares: e.target.value})} placeholder="Glúten, lactose, etc." />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>MEDICAMENTOS CONTÍNUOS</label>
                    <input type="text" className="text-input" value={formData.medicamentosContinuos} onChange={e => setFormData({...formData, medicamentosContinuos: e.target.value})} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>CONVÊNIO MÉDICO</label>
                      <input type="text" className="text-input" value={formData.convenioMedico} onChange={e => setFormData({...formData, convenioMedico: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>CONTATO PEDIATRA</label>
                      <input type="text" className="text-input" value={formData.contatoPediatra} onChange={e => setFormData({...formData, contatoPediatra: e.target.value})} placeholder="Nome e telefone" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 12, background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                    <button type="submit" disabled={saving} className="btn btn--primary" style={{ flex: 1 }}>{saving ? "Salvando..." : "Salvar Ficha Médica"}</button>
                  </div>
                </form>
              )}

              {activeTab === "responsaveis" && editingStudent && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 800, color: "#1E293B" }}>Responsáveis Vinculados</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {linkedParents.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 13, color: "#94A3B8" }}>Nenhum responsável vinculado.</p>
                      ) : (
                        linkedParents.map(parent => {
                          const vinculo = parent.vinculoFilhos?.[editingStudent.id] || { parentesco: "Pai", flags: [] };
                          const currentParentesco = vinculo.parentesco || "Pai";
                          const currentFlags = vinculo.flags || [];

                          const toggleFlag = (flag: string) => {
                            let newFlags = [...currentFlags];
                            if (newFlags.includes(flag)) {
                              newFlags = newFlags.filter(f => f !== flag);
                            } else {
                              newFlags.push(flag);
                            }
                            handleUpdateParentFlags(parent.uid, currentParentesco, newFlags);
                          };

                          return (
                            <div key={parent.uid} style={{ 
                              background: "#F8FAFC", 
                              padding: "16px", 
                              borderRadius: 12, 
                              border: "1px solid #E2E8F0",
                              display: "flex",
                              flexDirection: "column",
                              gap: 12
                            }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                  <span style={{ fontWeight: 700, color: "#1E293B", display: "block", fontSize: 14 }}>{parent.nome}</span>
                                  <span style={{ color: "#64748B", fontSize: 12 }}>{parent.email || `CPF: ${parent.cpf}`}</span>
                                </div>
                                <button 
                                  onClick={() => handleUnlinkParent(parent.uid)} 
                                  disabled={saving} 
                                  style={{ 
                                    background: "none", 
                                    color: "#DC2626", 
                                    border: "none", 
                                    fontSize: 12, 
                                    fontWeight: 700, 
                                    cursor: "pointer", 
                                    textDecoration: "underline" 
                                  }}
                                >
                                  Remover Vínculo
                                </button>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, borderTop: "1px solid #E2E8F0", paddingTop: 12 }}>
                                <div>
                                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>PARENTESCO</label>
                                  <select 
                                    className="text-input" 
                                    value={currentParentesco} 
                                    onChange={e => handleUpdateParentFlags(parent.uid, e.target.value, currentFlags)}
                                    style={{ fontSize: 12, padding: "6px 10px", height: "auto", background: "white" }}
                                  >
                                    <option value="Mãe">Mãe</option>
                                    <option value="Pai">Pai</option>
                                    <option value="Avó">Avó</option>
                                    <option value="Avô">Avô</option>
                                    <option value="Tio">Tio</option>
                                    <option value="Tia">Tia</option>
                                    <option value="Responsável Legal">Responsável Legal</option>
                                    <option value="Outro">Outro</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>RESPONSABILIDADES</label>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                    {[
                                      { key: "financeiro", label: "Financeiro" },
                                      { key: "academico", label: "Pedagógico/Acadêmico" },
                                      { key: "guarda_compartilhada", label: "Guarda Comp." },
                                      { key: "emergencia", label: "Cont. Emergência" }
                                    ].map(item => {
                                      const isChecked = currentFlags.includes(item.key);
                                      return (
                                        <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", fontWeight: 600, color: isChecked ? "var(--primary-dark)" : "#475569" }}>
                                          <input 
                                            type="checkbox" 
                                            checked={isChecked} 
                                            onChange={() => toggleFlag(item.key)} 
                                            style={{ accentColor: "var(--primary)" }}
                                          />
                                          {item.label}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: 13, fontWeight: 700, color: "#475569" }}>ADICIONAR RESPONSÁVEL</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <input type="email" className="text-input" value={parentSearchEmail} onChange={e => setParentSearchEmail(e.target.value)} placeholder="E-mail" style={{ background: "white" }} />
                      {parentSearchEmail.trim().length > 3 && !isEmailExisting && (
                        <div><input type="text" className="text-input" value={parentNewName} onChange={e => setParentNewName(e.target.value)} placeholder="Nome Completo" style={{ background: "white" }} /><p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#F59E0B" }}>Novo responsável será cadastrado.</p></div>
                      )}
                      <button type="button" onClick={handleLinkParent} disabled={saving || !parentSearchEmail || (!isEmailExisting && !parentNewName)} style={{ padding: "10px", background: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>{saving ? "..." : (isEmailExisting ? "Vincular Existente" : "Cadastrar e Vincular")}</button>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ width: "100%", padding: 12, background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Fechar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Revisão de Matrícula Externa */}
      {isReviewModalOpen && selectedSolicitude && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, padding: 16, overflowY: "auto" }}>
          <div className="card" style={{ width: "100%", maxWidth: 650, padding: 0, margin: "auto", marginTop: 40, marginBottom: 40, overflow: "hidden", background: "white" }}>
            <div style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", padding: "20px 32px 20px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, color: "#1E293B" }}>Revisar Ficha Cadastral</h2>
                  <span style={{ fontSize: 11, color: "var(--primary-dark)", fontWeight: 700 }}>
                    Preenchida externamente pelos pais em {new Date(selectedSolicitude.criadoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <button onClick={() => { setIsReviewModalOpen(false); setSelectedSolicitude(null); }} style={{ background: "none", border: "none", fontSize: 24, color: "#94A3B8", cursor: "pointer" }}>✕</button>
              </div>
            </div>

            <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20, maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
              
              {/* Seção 1: Aluno */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 13, fontWeight: 800, color: "var(--primary-dark)", borderBottom: "1px solid #E2E8F0", paddingBottom: 6 }}>1. DADOS DO ALUNO</h4>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>NOME COMPLETO</label>
                    <input type="text" className="text-input" value={selectedSolicitude.aluno?.nome || ""} onChange={e => handleEditSolicitudeField('aluno', 'nome', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>TURMA RECOMENDADA</label>
                    <select className="text-input" value={selectedSolicitude.aluno?.turma || ""} onChange={e => handleEditSolicitudeField('aluno', 'turma', e.target.value)}>
                      {TURMAS_SUGERIDAS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>NASCIMENTO</label>
                    <input type="date" className="text-input" value={selectedSolicitude.aluno?.dataNascimento || ""} onChange={e => handleEditSolicitudeField('aluno', 'dataNascimento', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>GÊNERO</label>
                    <select className="text-input" value={selectedSolicitude.aluno?.genero || ""} onChange={e => handleEditSolicitudeField('aluno', 'genero', e.target.value)}>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção 2: Pais */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 13, fontWeight: 800, color: "var(--primary-dark)", borderBottom: "1px solid #E2E8F0", paddingBottom: 6 }}>2. DADOS DOS RESPONSÁVEIS</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Mãe */}
                  <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 8 }}>
                    <strong style={{ fontSize: 12, color: "#475569", display: "block", marginBottom: 8 }}>MÃE</strong>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input type="text" className="text-input" placeholder="Nome" value={selectedSolicitude.mae?.nome || ""} onChange={e => handleEditSolicitudeField('mae', 'nome', e.target.value)} style={{ background: "white", fontSize: 12, padding: "8px 10px" }} />
                      <input type="text" className="text-input" placeholder="CPF (apenas números)" value={selectedSolicitude.mae?.cpf || ""} onChange={e => handleEditSolicitudeField('mae', 'cpf', e.target.value)} style={{ background: "white", fontSize: 12, padding: "8px 10px" }} />
                      <input type="email" className="text-input" placeholder="E-mail" value={selectedSolicitude.mae?.email || ""} onChange={e => handleEditSolicitudeField('mae', 'email', e.target.value)} style={{ background: "white", fontSize: 12, padding: "8px 10px" }} />
                      <input type="text" className="text-input" placeholder="Celular" value={selectedSolicitude.mae?.telCelular || ""} onChange={e => handleEditSolicitudeField('mae', 'telCelular', e.target.value)} style={{ background: "white", fontSize: 12, padding: "8px 10px" }} />
                    </div>
                  </div>
                  {/* Pai */}
                  <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 8 }}>
                    <strong style={{ fontSize: 12, color: "#475569", display: "block", marginBottom: 8 }}>PAI</strong>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input type="text" className="text-input" placeholder="Nome" value={selectedSolicitude.pai?.nome || ""} onChange={e => handleEditSolicitudeField('pai', 'nome', e.target.value)} style={{ background: "white", fontSize: 12, padding: "8px 10px" }} />
                      <input type="text" className="text-input" placeholder="CPF (apenas números)" value={selectedSolicitude.pai?.cpf || ""} onChange={e => handleEditSolicitudeField('pai', 'cpf', e.target.value)} style={{ background: "white", fontSize: 12, padding: "8px 10px" }} />
                      <input type="email" className="text-input" placeholder="E-mail" value={selectedSolicitude.pai?.email || ""} onChange={e => handleEditSolicitudeField('pai', 'email', e.target.value)} style={{ background: "white", fontSize: 12, padding: "8px 10px" }} />
                      <input type="text" className="text-input" placeholder="Celular" value={selectedSolicitude.pai?.telCelular || ""} onChange={e => handleEditSolicitudeField('pai', 'telCelular', e.target.value)} style={{ background: "white", fontSize: 12, padding: "8px 10px" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 3: Endereço & Saúde */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 13, fontWeight: 800, color: "var(--primary-dark)", borderBottom: "1px solid #E2E8F0", paddingBottom: 6 }}>3. ENDEREÇO & SAÚDE</h4>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>RUA, Nº, COMPL.</label>
                    <input type="text" className="text-input" value={selectedSolicitude.endereco?.rua || ""} onChange={e => handleEditSolicitudeField('endereco', 'rua', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>CEP</label>
                    <input type="text" className="text-input" value={selectedSolicitude.endereco?.cep || ""} onChange={e => handleEditSolicitudeField('endereco', 'cep', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>ALERGIAS / RESTRIÇÕES</label>
                  <input type="text" className="text-input" value={selectedSolicitude.saude?.alergias || ""} onChange={e => handleEditSolicitudeField('saude', 'alergias', e.target.value)} />
                </div>
              </div>

            </div>

            {/* Ações do Rodapé */}
            <div style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button 
                type="button" 
                onClick={handleRejectSolicitude} 
                disabled={saving}
                className="btn" 
                style={{ background: "#FEE2E2", color: "#EF4444", border: "none" }}
              >
                Recusar Ficha
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button 
                  type="button" 
                  onClick={() => { setIsReviewModalOpen(false); setSelectedSolicitude(null); }} 
                  className="btn btn--secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={handleApproveSolicitude} 
                  disabled={saving}
                  className="btn btn--primary"
                >
                  {saving ? "Salvando..." : "✓ Aprovar e Efetivar"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
