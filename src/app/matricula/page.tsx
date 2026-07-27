"use client";

import { useState } from "react";
import { createMatriculaSolicitude } from "@/lib/firestore";

export default function PublicMatriculaPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    escolaId: "planeta-colorido", // Default single-school scoping
    aluno: {
      nome: "",
      dataNascimento: "",
      genero: "M",
      etnia: "",
      turma: "Berçário II",
      periodo: "4h",
      horarioEntrada: "08:00",
      horarioSaida: "12:00",
      refeicoes: [] as string[],
      banho: false,
    },
    mae: {
      nome: "",
      email: "",
      rg: "",
      cpf: "",
      empresa: "",
      telComercial: "",
      telCelular: "",
    },
    pai: {
      nome: "",
      email: "",
      rg: "",
      cpf: "",
      empresa: "",
      telComercial: "",
      telCelular: "",
    },
    endereco: {
      rua: "",
      cep: "",
      telResidencial: "",
    },
    saude: {
      medicamentoFebre: "",
      dosagemFebre: "",
      alergias: "",
    },
    autorizados: [
      { nome: "", rg: "", telefone: "" },
      { nome: "", rg: "", telefone: "" },
    ],
    contatosEmergencia: [
      { nome: "", parentesco: "", telefone: "" },
      { nome: "", parentesco: "", telefone: "" },
    ],
  });

  const formatCPF = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  const handleCpfChange = (parent: "mae" | "pai", val: string) => {
    const formatted = formatCPF(val);
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], cpf: formatted }
    }));
  };

  const handleTextChange = (parent: "mae" | "pai", field: string, val: string) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: val }
    }));
  };

  const handleAlunoChange = (field: string, val: any) => {
    setFormData(prev => ({
      ...prev,
      aluno: { ...prev.aluno, [field]: val }
    }));
  };

  const handleMealToggle = (meal: string) => {
    const meals = formData.aluno.refeicoes;
    const updated = meals.includes(meal) 
      ? meals.filter(m => m !== meal)
      : [...meals, meal];
    handleAlunoChange("refeicoes", updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.aluno.nome.trim()) {
      alert("Por favor, preencha o nome do aluno.");
      setStep(1);
      return;
    }
    if (!formData.mae.nome.trim() && !formData.pai.nome.trim()) {
      alert("Por favor, preencha o nome de pelo menos um dos responsáveis.");
      setStep(2);
      return;
    }
    
    // Check CPF lengths
    const cleanMaeCpf = formData.mae.cpf.replace(/\D/g, "");
    const cleanPaiCpf = formData.pai.cpf.replace(/\D/g, "");
    if (formData.mae.nome.trim() && cleanMaeCpf.length !== 11) {
      alert("O CPF da Mãe deve conter 11 dígitos.");
      setStep(2);
      return;
    }
    if (formData.pai.nome.trim() && cleanPaiCpf.length !== 11) {
      alert("O CPF do Pai deve conter 11 dígitos.");
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      await createMatriculaSolicitude(formData);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar a solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#FFF7ED",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Quicksand, sans-serif"
      }}>
        <div className="card" style={{ maxWidth: 500, width: "100%", textAlign: "center", padding: 48, borderRadius: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--primary-dark)", margin: "0 0 12px" }}>Ficha Cadastrada!</h2>
          <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
            A ficha de matrícula de <strong>{formData.aluno.nome}</strong> foi enviada com sucesso para a administração da escola <strong>Planeta Colorido</strong>.
          </p>
          <div style={{ background: "#FFF7ED", border: "1px dashed var(--primary)", padding: 16, borderRadius: 12, fontSize: 13, color: "var(--primary-dark)", marginBottom: 24 }}>
            💡 <strong>Próximo Passo:</strong> A coordenação irá validar os dados e realizar a liberação do seu acesso. Você receberá um aviso e poderá acessar o app usando seu CPF e criando uma senha.
          </div>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>Qualquer dúvida, entre em contato: coloridoplanetacolorido@gmail.com</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FFF7ED",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "Quicksand, sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 650 }}>
        {/* School Logo & Title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--primary-dark)", margin: "0 0 4px" }}>Planeta Colorido</h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: 14 }}>Ficha Individual de Matrícula e Cadastro Externo</p>
        </div>

        {/* Stepper progress indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: s <= step ? "var(--primary)" : "#E2E8F0",
                transition: "background 0.3s"
              }}
            />
          ))}
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="card" style={{ padding: 32, borderRadius: 24, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
          
          {/* STEP 1: ALUNO */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", marginBottom: 20 }}>Passo 1: Dados do Aluno</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>NOME DO ALUNO(A) *</label>
                  <input 
                    type="text" 
                    className="text-input" 
                    required 
                    value={formData.aluno.nome} 
                    onChange={e => handleAlunoChange("nome", e.target.value)} 
                    placeholder="Nome completo da criança"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>DATA DE NASCIMENTO *</label>
                    <input 
                      type="date" 
                      className="text-input" 
                      required 
                      value={formData.aluno.dataNascimento} 
                      onChange={e => handleAlunoChange("dataNascimento", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>GÊNERO</label>
                    <select 
                      className="text-input" 
                      value={formData.aluno.genero} 
                      onChange={e => handleAlunoChange("genero", e.target.value)}
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>ETNIA / RAÇA</label>
                    <input 
                      type="text" 
                      className="text-input" 
                      value={formData.aluno.etnia} 
                      onChange={e => handleAlunoChange("etnia", e.target.value)} 
                      placeholder="Ex: Branco, Pardo, Negro, etc."
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>TURMA RECOMENDADA</label>
                    <select 
                      className="text-input" 
                      value={formData.aluno.turma} 
                      onChange={e => handleAlunoChange("turma", e.target.value)}
                    >
                      <option value="Berçário II">Berçário II</option>
                      <option value="Maternal I">Maternal I</option>
                      <option value="Maternal II">Maternal II</option>
                      <option value="Jardim I">Jardim I</option>
                      <option value="Jardim II">Jardim II</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>PERÍODO</label>
                    <select className="text-input" value={formData.aluno.periodo} onChange={e => handleAlunoChange("periodo", e.target.value)}>
                      <option value="4h">Parcial (4h)</option>
                      <option value="6h">Semi-Integral (6h)</option>
                      <option value="12h">Integral (12h)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>ENTRADA</label>
                    <input type="time" className="text-input" value={formData.aluno.horarioEntrada} onChange={e => handleAlunoChange("horarioEntrada", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>SAÍDA</label>
                    <input type="time" className="text-input" value={formData.aluno.horarioSaida} onChange={e => handleAlunoChange("horarioSaida", e.target.value)} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>REFEIÇÕES INCLUSAS</label>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "8px 0" }}>
                    {["Almoço", "Jantar", "Lanche de Tarde"].map((meal) => {
                      const isChecked = formData.aluno.refeicoes.includes(meal);
                      return (
                        <label key={meal} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                          <input type="checkbox" checked={isChecked} onChange={() => handleMealToggle(meal)} />
                          {meal}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", fontWeight: 700 }}>
                    <input 
                      type="checkbox" 
                      checked={formData.aluno.banho} 
                      onChange={e => handleAlunoChange("banho", e.target.checked)} 
                    />
                    Necessita de Banho na Escola
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                <button type="button" onClick={() => setStep(2)} className="btn btn--primary" style={{ padding: "10px 24px" }}>
                  Avançar ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: RESPONSÁVEIS */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", marginBottom: 20 }}>Passo 2: Dados dos Responsáveis</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* MÃE */}
                <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: 20 }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "var(--primary-dark)", fontSize: 15, fontWeight: 800 }}>DADOS DA MÃE (Principal ou Responsável 1)</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>NOME COMPLETO *</label>
                        <input type="text" className="text-input" value={formData.mae.nome} onChange={e => handleTextChange("mae", "nome", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>CPF (Apenas números) *</label>
                        <input type="text" className="text-input" maxLength={14} placeholder="000.000.000-00" value={formData.mae.cpf} onChange={e => handleCpfChange("mae", e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>RG</label>
                        <input type="text" className="text-input" value={formData.mae.rg} onChange={e => handleTextChange("mae", "rg", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>E-MAIL</label>
                        <input type="email" className="text-input" value={formData.mae.email} onChange={e => handleTextChange("mae", "email", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>CELULAR</label>
                        <input type="text" className="text-input" placeholder="(00) 00000-0000" value={formData.mae.telCelular} onChange={e => handleTextChange("mae", "telCelular", e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>EMPRESA / CARGO</label>
                        <input type="text" className="text-input" value={formData.mae.empresa} onChange={e => handleTextChange("mae", "empresa", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>TEL. COMERCIAL</label>
                        <input type="text" className="text-input" value={formData.mae.telComercial} onChange={e => handleTextChange("mae", "telComercial", e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PAI */}
                <div>
                  <h4 style={{ margin: "0 0 12px 0", color: "var(--primary-dark)", fontSize: 15, fontWeight: 800 }}>DADOS DO PAI (ou Responsável 2)</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>NOME COMPLETO</label>
                        <input type="text" className="text-input" value={formData.pai.nome} onChange={e => handleTextChange("pai", "nome", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>CPF (Apenas números)</label>
                        <input type="text" className="text-input" maxLength={14} placeholder="000.000.000-00" value={formData.pai.cpf} onChange={e => handleCpfChange("pai", e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>RG</label>
                        <input type="text" className="text-input" value={formData.pai.rg} onChange={e => handleTextChange("pai", "rg", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>E-MAIL</label>
                        <input type="email" className="text-input" value={formData.pai.email} onChange={e => handleTextChange("pai", "email", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>CELULAR</label>
                        <input type="text" className="text-input" placeholder="(00) 00000-0000" value={formData.pai.telCelular} onChange={e => handleTextChange("pai", "telCelular", e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>EMPRESA / CARGO</label>
                        <input type="text" className="text-input" value={formData.pai.empresa} onChange={e => handleTextChange("pai", "empresa", e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>TEL. COMERCIAL</label>
                        <input type="text" className="text-input" value={formData.pai.telComercial} onChange={e => handleTextChange("pai", "telComercial", e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn--secondary" style={{ padding: "10px 24px" }}>
                  ⬅ Voltar
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn btn--primary" style={{ padding: "10px 24px" }}>
                  Avançar ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ENDEREÇO, SAÚDE, AUTORIZADOS, EMERGÊNCIA */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", marginBottom: 20 }}>Passo 3: Ficha Médica e Contatos</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Endereço */}
                <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: 16 }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "var(--primary-dark)", fontSize: 14, fontWeight: 800 }}>ENDEREÇO RESIDENCIAL</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>RUA, Nº, COMPLEMENTO *</label>
                      <input type="text" className="text-input" required value={formData.endereco.rua} onChange={e => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, rua: e.target.value } }))} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>CEP *</label>
                      <input type="text" className="text-input" required placeholder="00000-000" value={formData.endereco.cep} onChange={e => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, cep: e.target.value } }))} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>TEL. RESIDENCIAL</label>
                      <input type="text" className="text-input" value={formData.endereco.telResidencial} onChange={e => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, telResidencial: e.target.value } }))} />
                    </div>
                  </div>
                </div>

                {/* Saúde */}
                <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: 16 }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "var(--primary-dark)", fontSize: 14, fontWeight: 800 }}>FICHA DE SAÚDE</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>EM CASO DE FEBRE, QUAL MEDICAMENTO UTILIZAR?</label>
                        <input type="text" className="text-input" placeholder="Ex: Paracetamol, Ibuprofeno..." value={formData.saude.medicamentoFebre} onChange={e => setFormData(prev => ({ ...prev, saude: { ...prev.saude, medicamentoFebre: e.target.value } }))} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>DOSAGEM (Gotas / ml)</label>
                        <input type="text" className="text-input" placeholder="Ex: 10 gotas" value={formData.saude.dosagemFebre} onChange={e => setFormData(prev => ({ ...prev, saude: { ...prev.saude, dosagemFebre: e.target.value } }))} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>ALERGIAS OU RESTRIÇÕES MÉDICAS</label>
                      <textarea className="text-input" rows={2} placeholder="Descreva se for alérgico a medicamentos, picadas, alimentos ou restrições gerais" value={formData.saude.alergias} onChange={e => setFormData(prev => ({ ...prev, saude: { ...prev.saude, alergias: e.target.value } }))} />
                    </div>
                  </div>
                </div>

                {/* Autorizados Retirada */}
                <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: 16 }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "var(--primary-dark)", fontSize: 14, fontWeight: 800 }}>PESSOAS AUTORIZADAS A RETIRAR A CRIANÇA</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {formData.autorizados.map((item, idx) => (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 12 }}>
                        <input 
                          type="text" 
                          className="text-input" 
                          placeholder={`Nome completo autorização ${idx + 1}`} 
                          value={item.nome} 
                          onChange={e => {
                            const updated = [...formData.autorizados];
                            updated[idx].nome = e.target.value;
                            setFormData(prev => ({ ...prev, autorizados: updated }));
                          }}
                        />
                        <input 
                          type="text" 
                          className="text-input" 
                          placeholder="RG" 
                          value={item.rg} 
                          onChange={e => {
                            const updated = [...formData.autorizados];
                            updated[idx].rg = e.target.value;
                            setFormData(prev => ({ ...prev, autorizados: updated }));
                          }}
                        />
                        <input 
                          type="text" 
                          className="text-input" 
                          placeholder="Telefone" 
                          value={item.telefone} 
                          onChange={e => {
                            const updated = [...formData.autorizados];
                            updated[idx].telefone = e.target.value;
                            setFormData(prev => ({ ...prev, autorizados: updated }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contatos Emergencia */}
                <div>
                  <h4 style={{ margin: "0 0 12px 0", color: "var(--primary-dark)", fontSize: 14, fontWeight: 800 }}>CONTATOS DE EMERGÊNCIA (Caso pais não respondam)</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {formData.contatosEmergencia.map((item, idx) => (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 12 }}>
                        <input 
                          type="text" 
                          className="text-input" 
                          placeholder={`Nome completo contato ${idx + 1}`} 
                          value={item.nome} 
                          onChange={e => {
                            const updated = [...formData.contatosEmergencia];
                            updated[idx].nome = e.target.value;
                            setFormData(prev => ({ ...prev, contatosEmergencia: updated }));
                          }}
                        />
                        <input 
                          type="text" 
                          className="text-input" 
                          placeholder="Parentesco" 
                          value={item.parentesco} 
                          onChange={e => {
                            const updated = [...formData.contatosEmergencia];
                            updated[idx].parentesco = e.target.value;
                            setFormData(prev => ({ ...prev, contatosEmergencia: updated }));
                          }}
                        />
                        <input 
                          type="text" 
                          className="text-input" 
                          placeholder="Telefone" 
                          value={item.telefone} 
                          onChange={e => {
                            const updated = [...formData.contatosEmergencia];
                            updated[idx].telefone = e.target.value;
                            setFormData(prev => ({ ...prev, contatosEmergencia: updated }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Declaration Legal footer */}
              <div style={{ marginTop: 24, padding: 12, background: "#FFF7ED", border: "1px dashed var(--primary)", borderRadius: 8, fontSize: 12, color: "var(--primary-dark)" }}>
                📄 Declaro para os devidos fins legais que todos os dados fornecidos nesta ficha cadastral são verdadeiros e de minha total responsabilidade.
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                <button type="button" onClick={() => setStep(2)} className="btn btn--secondary" style={{ padding: "10px 24px" }}>
                  ⬅ Voltar
                </button>
                <button type="submit" disabled={loading} className="btn btn--primary" style={{ padding: "10px 24px" }}>
                  {loading ? "Processando..." : "Confirmar e Enviar Matrícula ➔"}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
