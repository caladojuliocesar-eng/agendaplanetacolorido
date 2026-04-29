"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getAllStudents, createCobranca } from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { Student } from "@/types";
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
    valor: "",
    dataVencimento: "",
    linkBoleto: "",
  });
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.alunoId || !formData.titulo || !formData.valor || !formData.dataVencimento) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      let urlDemonstrativo = "";
      
      // 1. Upload image if exists
      if (file) {
        const fileRef = ref(storage(), `financeiro/${profile!.escolaId}/${formData.alunoId}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        urlDemonstrativo = await getDownloadURL(fileRef);
      }

      // 2. Create charge in Firestore
      await createCobranca({
        alunoId: formData.alunoId,
        escolaId: profile!.escolaId,
        titulo: formData.titulo,
        valor: parseFloat(formData.valor.replace(',', '.')),
        dataVencimento: formData.dataVencimento,
        status: 'pendente',
        linkBoleto: formData.linkBoleto || undefined,
        urlDemonstrativo: urlDemonstrativo || undefined,
      });

      router.push("/admin/financeiro");
    } catch (error) {
      console.error("Erro ao criar cobrança:", error);
      alert("Erro ao salvar cobrança.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="spinner" style={{ margin: "40px auto" }} />;

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", margin: 0 }}>Nova Cobrança</h2>
        <p style={{ color: "#64748B", margin: "4px 0 0 0" }}>Envie uma nova mensalidade ou aviso de pagamento</p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: "white", padding: 32, borderRadius: 16, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Selecionar Aluno *</label>
          <select 
            required
            value={formData.alunoId}
            onChange={(e) => setFormData({...formData, alunoId: e.target.value})}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }}
          >
            <option value="">Selecione um aluno...</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.nome} ({s.turma})</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Título da Cobrança *</label>
          <input 
            required
            type="text"
            placeholder="Ex: Mensalidade Abril"
            value={formData.titulo}
            onChange={(e) => setFormData({...formData, titulo: e.target.value})}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Valor (R$) *</label>
            <input 
              required
              type="text"
              placeholder="0,00"
              value={formData.valor}
              onChange={(e) => setFormData({...formData, valor: e.target.value})}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Vencimento *</label>
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
          <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Link do Boleto / PIX (Opcional)</label>
          <input 
            type="url"
            placeholder="https://nubank.com.br/cobranca/..."
            value={formData.linkBoleto}
            onChange={(e) => setFormData({...formData, linkBoleto: e.target.value})}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }}
          />
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Cole aqui o link gerado pelo seu banco</p>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Foto do Demonstrativo (Opcional)</label>
          <input 
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ fontSize: 14 }}
          />
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Anexe um print ou foto do detalhamento das despesas</p>
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
