"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { 
  getMatriculaSolicitudes, 
  approveMatriculaSolicitude, 
  rejectMatriculaSolicitude 
} from "@/lib/firestore";

export default function AdminMatriculasPage() {
  const { profile } = useAuth();
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [selectedSolic, setSelectedSolic] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pendente" | "aprovada" | "recusada">("pendente");

  useEffect(() => {
    if (profile?.escolaId) {
      loadSolicitudes();
    }
  }, [profile]);

  async function loadSolicitudes() {
    setLoading(true);
    try {
      const data = await getMatriculaSolicitudes(profile!.escolaId!);
      setSolicitudes(data);
      // Keep selected solicitude updated
      if (selectedSolic) {
        const updated = data.find(s => s.id === selectedSolic.id);
        setSelectedSolic(updated || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (id: string, name: string) => {
    const confirm = window.confirm(`Deseja aprovar a matrícula de ${name}?\n\nIsso criará o registro do aluno e pré-cadastrará os CPFs dos responsáveis.`);
    if (!confirm) return;

    setProcessing(true);
    try {
      await approveMatriculaSolicitude(id, profile!.escolaId!);
      alert(`Matrícula de ${name} aprovada com sucesso! Aluno cadastrado na escola.`);
      await loadSolicitudes();
    } catch (err) {
      console.error(err);
      alert("Erro ao aprovar matrícula.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string, name: string) => {
    const confirm = window.confirm(`Deseja recusar a matrícula de ${name}?`);
    if (!confirm) return;

    setProcessing(true);
    try {
      await rejectMatriculaSolicitude(id);
      alert("Matrícula recusada.");
      await loadSolicitudes();
    } catch (err) {
      console.error(err);
      alert("Erro ao recusar matrícula.");
    } finally {
      setProcessing(false);
    }
  };

  const filtered = solicitudes.filter(s => s.status === activeTab);

  const formatCPF = (value: string) => {
    if (!value) return "---";
    const clean = value.replace(/\D/g, "");
    if (clean.length !== 11) return value;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  if (loading && solicitudes.length === 0) return <div className="spinner" />;

  return (
    <div>
      <header style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>Matrículas & Fichas Cadastrais</h1>
          <p style={{ color: "#64748B", margin: 0 }}>Valide e aprove fichas individuais preenchidas externamente pelos pais.</p>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 16, borderBottom: "1px solid #E2E8F0", marginBottom: 24 }}>
        {(["pendente", "aprovada", "recusada"] as const).map(tab => {
          const count = solicitudes.filter(s => s.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedSolic(null); }}
              style={{
                padding: "12px 16px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab ? "3px solid var(--primary)" : "3px solid transparent",
                color: activeTab === tab ? "var(--primary-dark)" : "#64748B",
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                textTransform: "capitalize",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {tab === "pendente" ? "Pendentes ⏳" : tab === "aprovada" ? "Aprovadas ✅" : "Recusadas ❌"}
              <span style={{ 
                background: activeTab === tab ? "var(--primary-light)" : "#F1F5F9",
                color: activeTab === tab ? "var(--primary-dark)" : "#64748B",
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 10
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
        {/* Left List */}
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#475569" }}>SOLICITAÇÕES</h3>
          </div>
          
          <div style={{ overflowY: "auto", maxHeight: 450 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                Nenhuma ficha cadastrada {activeTab === "pendente" ? "pendente" : activeTab === "aprovada" ? "aprovada" : "recusada"}.
              </div>
            ) : (
              filtered.map(solic => {
                const isSelected = selectedSolic?.id === solic.id;
                const createdDate = new Date(solic.criadoEm).toLocaleDateString("pt-BR");

                return (
                  <div 
                    key={solic.id}
                    onClick={() => setSelectedSolic(solic)}
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #F1F5F9",
                      cursor: "pointer",
                      background: isSelected ? "var(--primary-light)" : "white",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ fontWeight: 700, color: isSelected ? "var(--primary-dark)" : "#1E293B", fontSize: 14 }}>
                      {solic.aluno?.nome}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginTop: 4 }}>
                      <span>Recomendada: {solic.aluno?.turma}</span>
                      <span>{createdDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="card" style={{ padding: 24, background: "white" }}>
          {selectedSolic ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Header Details */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #E2E8F0", paddingBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1E293B" }}>
                    Ficha de {selectedSolic.aluno?.nome}
                  </h2>
                  <span style={{ fontSize: 11, background: "#E0F2FE", color: "#0369A1", fontWeight: 700, padding: "2px 8px", borderRadius: 6, display: "inline-block", marginTop: 6 }}>
                    Turma Recomendada: {selectedSolic.aluno?.turma}
                  </span>
                </div>
                
                {selectedSolic.status === "pendente" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button 
                      onClick={() => handleReject(selectedSolic.id, selectedSolic.aluno.nome)}
                      disabled={processing}
                      className="btn"
                      style={{ background: "#FEE2E2", color: "#EF4444", border: "none", fontSize: 13, padding: "8px 16px" }}
                    >
                      Recusar
                    </button>
                    <button 
                      onClick={() => handleApprove(selectedSolic.id, selectedSolic.aluno.nome)}
                      disabled={processing}
                      className="btn btn--primary"
                      style={{ fontSize: 13, padding: "8px 16px" }}
                    >
                      {processing ? "Processando..." : "✓ Aprovar Matrícula"}
                    </button>
                  </div>
                )}

                {selectedSolic.status === "aprovada" && (
                  <div style={{ background: "#D1FAE5", color: "#065F46", fontSize: 13, fontWeight: 700, padding: "6px 12px", borderRadius: 8 }}>
                    Aprovada e Cadastrada ✅
                  </div>
                )}

                {selectedSolic.status === "recusada" && (
                  <div style={{ background: "#FEE2E2", color: "#991B1B", fontSize: 13, fontWeight: 700, padding: "6px 12px", borderRadius: 8 }}>
                    Matrícula Recusada ❌
                  </div>
                )}
              </div>

              {/* Sections details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, fontSize: 13, color: "#334155" }}>
                {/* Col 1 */}
                <div>
                  <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--primary-dark)", fontWeight: 800 }}>DADOS DO ALUNO</h4>
                  <p><strong>Nascimento:</strong> {selectedSolic.aluno?.dataNascimento ? new Date(selectedSolic.aluno.dataNascimento + "T12:00:00").toLocaleDateString("pt-BR") : "---"}</p>
                  <p><strong>Gênero:</strong> {selectedSolic.aluno?.genero === "M" ? "Masculino" : "Feminino"}</p>
                  <p><strong>Etnia / Raça:</strong> {selectedSolic.aluno?.etnia || "Não informado"}</p>
                  <p><strong>Período:</strong> {selectedSolic.aluno?.periodo} ({selectedSolic.aluno?.horarioEntrada} às {selectedSolic.aluno?.horarioSaida})</p>
                  <p><strong>Refeições:</strong> {selectedSolic.aluno?.refeicoes?.join(", ") || "Nenhuma"}</p>
                  <p><strong>Banho na Escola:</strong> {selectedSolic.aluno?.banho ? "Sim" : "Não"}</p>
                  
                  <h4 style={{ margin: "20px 0 10px", fontSize: 14, color: "var(--primary-dark)", fontWeight: 800 }}>MÃE</h4>
                  <p><strong>Nome:</strong> {selectedSolic.mae?.nome || "---"}</p>
                  <p><strong>CPF:</strong> {formatCPF(selectedSolic.mae?.cpf)}</p>
                  <p><strong>RG:</strong> {selectedSolic.mae?.rg || "---"}</p>
                  <p><strong>E-mail:</strong> {selectedSolic.mae?.email || "---"}</p>
                  <p><strong>Celular:</strong> {selectedSolic.mae?.telCelular || "---"}</p>
                  <p><strong>Trabalho:</strong> {selectedSolic.mae?.empresa || "---"} {selectedSolic.mae?.telComercial ? `(Comercial: ${selectedSolic.mae.telComercial})` : ""}</p>
                </div>

                {/* Col 2 */}
                <div>
                  <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--primary-dark)", fontWeight: 800 }}>ENDEREÇO</h4>
                  <p><strong>Rua/Nº:</strong> {selectedSolic.endereco?.rua || "---"}</p>
                  <p><strong>CEP:</strong> {selectedSolic.endereco?.cep || "---"}</p>
                  <p><strong>Tel. Residencial:</strong> {selectedSolic.endereco?.telResidencial || "---"}</p>

                  <h4 style={{ margin: "20px 0 10px", fontSize: 14, color: "var(--primary-dark)", fontWeight: 800 }}>PAI</h4>
                  <p><strong>Nome:</strong> {selectedSolic.pai?.nome || "---"}</p>
                  <p><strong>CPF:</strong> {formatCPF(selectedSolic.pai?.cpf)}</p>
                  <p><strong>RG:</strong> {selectedSolic.pai?.rg || "---"}</p>
                  <p><strong>E-mail:</strong> {selectedSolic.pai?.email || "---"}</p>
                  <p><strong>Celular:</strong> {selectedSolic.pai?.telCelular || "---"}</p>
                  <p><strong>Trabalho:</strong> {selectedSolic.pai?.empresa || "---"} {selectedSolic.pai?.telComercial ? `(Comercial: ${selectedSolic.pai.telComercial})` : ""}</p>
                </div>
              </div>

              {/* Ficha Medica & Pessoas Autorizadas */}
              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, fontSize: 13, color: "#334155" }}>
                <div>
                  <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--primary-dark)", fontWeight: 800 }}>FICHA MÉDICA</h4>
                  <p><strong>Alergias/Restrições:</strong> {selectedSolic.saude?.alergias || "Nenhuma informada"}</p>
                  <p><strong>Remédio Febre:</strong> {selectedSolic.saude?.medicamentoFebre || "Não cadastrado"}</p>
                  <p><strong>Dosagem:</strong> {selectedSolic.saude?.dosagemFebre || "---"}</p>

                  <h4 style={{ margin: "20px 0 10px", fontSize: 14, color: "var(--primary-dark)", fontWeight: 800 }}>CONTATOS DE EMERGÊNCIA</h4>
                  {selectedSolic.contatosEmergencia?.some((c: any) => c.nome) ? (
                    selectedSolic.contatosEmergencia.map((c: any, idx: number) => c.nome && (
                      <p key={idx}>{idx + 1}. {c.nome} ({c.parentesco}) ➔ <strong>{c.telefone}</strong></p>
                    ))
                  ) : (
                    <p style={{ color: "#94A3B8" }}>Nenhum cadastrado</p>
                  )}
                </div>

                <div>
                  <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--primary-dark)", fontWeight: 800 }}>AUTORIZADOS A RETIRAR A CRIANÇA</h4>
                  {selectedSolic.autorizados?.some((c: any) => c.nome) ? (
                    selectedSolic.autorizados.map((c: any, idx: number) => c.nome && (
                      <p key={idx}>{idx + 1}. {c.nome} (RG: {c.rg || "---"}) ➔ <strong>{c.telefone}</strong></p>
                    ))
                  ) : (
                    <p style={{ color: "#94A3B8" }}>Nenhum cadastrado</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#94A3B8", padding: 48, minHeight: 300 }}>
              <span style={{ fontSize: 48, marginBottom: 12 }}>📝</span>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Nenhuma ficha selecionada</p>
              <p style={{ fontSize: 13, margin: "4px 0 0 0", textAlign: "center" }}>Escolha uma solicitação de matrícula na lista lateral para visualizar todos os detalhes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
