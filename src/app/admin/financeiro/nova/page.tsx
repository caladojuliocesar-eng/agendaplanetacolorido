"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getAllStudents, createCobranca } from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { Student, CobrancaItem } from "@/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function NewChargePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    alunoId: "",
    titulo: "",
    valor: "0,00",
    dataVencimento: "",
    linkBoleto: "",
  });

  // Dynamic Item List for Breakdown
  const [cobrancaItens, setCobrancaItens] = useState<{ descricao: string; valor: string }[]>([
    { descricao: "Mensalidade Escolar", valor: "0,00" }
  ]);

  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (profile?.escolaId) {
      loadStudents();
    }
  }, [profile]);

  async function loadStudents() {
    try {
      const data = await getAllStudents(profile!.escolaId);
      setStudents(data);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
    } finally {
      setLoading(false);
    }
  }

  // Handle item adjustments and recalculate total
  const handleItemChange = (index: number, field: "descricao" | "valor", val: string) => {
    const updated = [...cobrancaItens];
    updated[index][field] = val;
    setCobrancaItens(updated);

    // Calculate sum of item values
    let total = 0;
    updated.forEach(item => {
      const cleanVal = item.valor.replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleanVal);
      if (!isNaN(parsed)) {
        total += parsed;
      }
    });

    setFormData(prev => ({
      ...prev,
      valor: total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }));
  };

  const handleAddItem = () => {
    setCobrancaItens(prev => [...prev, { descricao: "", valor: "0,00" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (cobrancaItens.length === 1) return;
    const updated = cobrancaItens.filter((_, i) => i !== index);
    setCobrancaItens(updated);

    let total = 0;
    updated.forEach(item => {
      const cleanVal = item.valor.replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleanVal);
      if (!isNaN(parsed)) {
        total += parsed;
      }
    });

    setFormData(prev => ({
      ...prev,
      valor: total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.alunoId || !formData.titulo || !formData.dataVencimento) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    setSaving(true);
    
    try {
      let urlDemonstrativo = "";
      
      // 1. Upload image if exists
      if (file) {
        try {
          const fileRef = ref(storage(), `financeiro/${profile!.escolaId}/${formData.alunoId}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          urlDemonstrativo = await getDownloadURL(fileRef);
        } catch (uploadError: any) {
          console.error("Erro no upload:", uploadError);
          throw new Error(`Falha no Storage: ${uploadError.message}.`);
        }
      }

      // 2. Format final items list
      const formattedItens: CobrancaItem[] = [];
      let totalSum = 0;

      cobrancaItens.forEach(item => {
        if (item.descricao.trim()) {
          const cleanVal = item.valor.replace(/\./g, "").replace(",", ".");
          const valueNum = parseFloat(cleanVal);
          if (!isNaN(valueNum) && valueNum > 0) {
            formattedItens.push({
              descricao: item.descricao,
              valor: valueNum
            });
            totalSum += valueNum;
          }
        }
      });

      // If no items were entered correctly, use the main amount
      const finalValor = totalSum > 0 ? totalSum : parseFloat(formData.valor.replace(/\./g, "").replace(",", "."));

      if (isNaN(finalValor) || finalValor <= 0) {
        throw new Error("O valor da cobrança deve ser maior que zero.");
      }

      const selectedStudent = students.find(s => s.id === formData.alunoId);

      await createCobranca({
        alunoId: formData.alunoId,
        alunoNome: selectedStudent?.nome || "Aluno",
        alunoTurma: selectedStudent?.turma || "",
        escolaId: profile!.escolaId,
        titulo: formData.titulo,
        valor: finalValor,
        dataVencimento: formData.dataVencimento,
        status: "pendente",
        linkBoleto: formData.linkBoleto.trim() || "",
        urlDemonstrativo: urlDemonstrativo || "",
        itens: formattedItens.length > 0 ? formattedItens : undefined
      });

      router.push("/admin/financeiro");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao salvar cobrança.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="spinner" style={{ margin: "40px auto" }} />;

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", margin: 0 }}>Nova Cobrança</h2>
        <p style={{ color: "#64748B", margin: "4px 0 0 0" }}>Crie cobranças detalhadas por item de despesa.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: "white", padding: 32, borderRadius: 16, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 20 }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Selecionar Aluno *</label>
            <select 
              required
              value={formData.alunoId}
              onChange={(e) => setFormData({...formData, alunoId: e.target.value})}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14, background: "#F8FAFC" }}
            >
              <option value="">Selecione um aluno...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.nome} ({s.turma})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Título Geral *</label>
            <input 
              required
              type="text"
              placeholder="Ex: Mensalidade de Maio"
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }}
            />
          </div>
        </div>

        {/* Itemized breakdown section */}
        <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 18, background: "#F8FAFC" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#475569" }}>DEMONSTRATIVO DE ITENS</h4>
            <button 
              type="button" 
              onClick={handleAddItem}
              className="btn btn--secondary" 
              style={{ padding: "4px 10px", fontSize: 12 }}
            >
              + Adicionar Item
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cobrancaItens.map((item, index) => (
              <div key={index} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input 
                  type="text" 
                  className="text-input" 
                  placeholder="Descrição da despesa (ex: Jantar Extra)" 
                  value={item.descricao} 
                  required
                  onChange={e => handleItemChange(index, "descricao", e.target.value)}
                  style={{ flex: 3, background: "white" }}
                />
                <input 
                  type="text" 
                  className="text-input" 
                  placeholder="Valor" 
                  value={item.valor} 
                  required
                  onChange={e => handleItemChange(index, "valor", e.target.value)}
                  style={{ flex: 1, textAlign: "right", background: "white" }}
                />
                {cobrancaItens.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index)}
                    style={{ background: "none", border: "none", color: "#EF4444", fontSize: 18, cursor: "pointer", padding: "0 4px" }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Valor Total Calculado (R$)</label>
            <input 
              disabled
              type="text"
              value={formData.valor}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, background: "#F1F5F9", fontWeight: 700, color: "#1E293B" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Vencimento *</label>
            <input 
              required
              type="date"
              value={formData.dataVencimento}
              onChange={(e) => setFormData({...formData, dataVencimento: e.target.value})}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }}
            />
          </div>
        </div>

        <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Link do Boleto / PIX (Opcional)</label>
          <input 
            type="url"
            placeholder="https://nubank.com.br/cobranca/..."
            value={formData.linkBoleto}
            onChange={(e) => setFormData({...formData, linkBoleto: e.target.value})}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Foto do Demonstrativo (Opcional)</label>
          <div style={{ position: "relative" }}>
            <input 
              type="file"
              id="file-upload"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            <label 
              htmlFor="file-upload"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "16px",
                borderRadius: 12,
                border: "2px dashed #E2E8F0",
                background: file ? "#F0FDF4" : "#F8FAFC",
                color: file ? "#166534" : "#64748B",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.2s"
              }}
            >
              {file ? `✅ ${file.name}` : "📁 Clique para anexar o print/foto"}
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button 
            type="button" 
            onClick={() => router.back()}
            style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1px solid #E2E8F0", background: "white", fontWeight: 700, cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={saving}
            style={{ 
              flex: 2, 
              padding: "14px", 
              borderRadius: 12, 
              border: "none", 
              background: saving ? "#CBD5E1" : "var(--primary)", 
              color: "white", 
              fontWeight: 700, 
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(249, 115, 22, 0.2)"
            }}
          >
            {saving ? "Salvando..." : "Criar e Enviar Cobrança"}
          </button>
        </div>
      </form>
    </div>
  );
}
