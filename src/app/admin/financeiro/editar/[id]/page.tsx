"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getCobrancasByEscola, updateCobranca, deleteCobranca } from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { Cobranca } from "@/types";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditChargePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);

  const [formData, setFormData] = useState({
    titulo: "",
    valor: "",
    dataVencimento: "",
    linkBoleto: "",
    status: "" as any,
  });
  const [file, setFile] = useState<File | null>(null);

  const [unlocked, setUnlocked] = useState(false);
  const isPaid = cobranca?.status === "pago";
  const isReadOnly = isPaid && !unlocked;

  useEffect(() => {
    if (profile?.escolaId && id) {
      loadCobranca();
    }
  }, [profile, id]);

  async function loadCobranca() {
    try {
      const data = await getCobrancasByEscola(profile!.escolaId);
      const item = data.find(c => c.id === id);
      if (item) {
        setCobranca(item);
        setFormData({
          titulo: item.titulo,
          valor: item.valor.toString().replace('.', ','),
          dataVencimento: item.dataVencimento,
          linkBoleto: item.linkBoleto || "",
          status: item.status,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar cobrança:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let urlDemonstrativo = cobranca?.urlDemonstrativo;
      
      if (file) {
        const fileRef = ref(storage(), `financeiro/${profile!.escolaId}/${cobranca!.alunoId}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        urlDemonstrativo = await getDownloadURL(fileRef);
      }

      const valorLimpo = formData.valor.replace(/\./g, '').replace(',', '.');
      const valorNum = parseFloat(valorLimpo);

      const payload: Partial<Cobranca> = {
        titulo: formData.titulo,
        valor: valorNum,
        dataVencimento: formData.dataVencimento,
        linkBoleto: formData.linkBoleto.trim() || "",
        urlDemonstrativo: urlDemonstrativo || "",
        status: formData.status,
      };

      if (formData.status === 'pago' && !cobranca?.dataPagamento) {
        payload.dataPagamento = new Date().toISOString();
      }

      await updateCobranca(id, payload);

      router.push("/admin/financeiro");
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="spinner" style={{ margin: "40px auto" }} />;
  if (!cobranca) return <div>Cobrança não encontrada.</div>;

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", margin: 0 }}>Editar Cobrança</h2>
        <p style={{ color: "#64748B", margin: "4px 0 0 0" }}>
          Alterando cobrança de <strong>{cobranca.alunoNome}</strong>
        </p>
      </div>

      {isPaid && (
        <div style={{ 
          background: isReadOnly ? "#F0FDF4" : "#FEF2F2", 
          border: `1px solid ${isReadOnly ? "#BBF7D0" : "#FECACA"}`, 
          borderRadius: 12, 
          padding: 16, 
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 800, color: isReadOnly ? "#166534" : "#991B1B" }}>
              {isReadOnly ? "🔒 Cobrança Quitada & Trava de Segurança Ativa" : "🔓 Modo de Edição Desbloqueado"}
            </span>
            <p style={{ margin: "4px 0 0 0", fontSize: 12, color: isReadOnly ? "#15803D" : "#B91C1C" }}>
              {isReadOnly 
                ? `Paga em ${cobranca.dataPagamento ? new Date(cobranca.dataPagamento).toLocaleDateString('pt-BR') : 'data confirmada'}. Os campos principais estão protegidos.`
                : "Atenção: alterações no valor ou vencimento afetarão o histórico."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUnlocked(!unlocked)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              background: "white",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            {isReadOnly ? "🔓 Desbloquear" : "🔒 Travar"}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: "white", padding: 32, borderRadius: 16, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Título da Cobrança *</label>
          <input 
            required
            disabled={isReadOnly}
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData({...formData, titulo: e.target.value})}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14, background: isReadOnly ? "#F8FAFC" : "white" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Valor (R$) *</label>
            <input 
              required
              disabled={isReadOnly}
              type="text"
              value={formData.valor}
              onChange={(e) => setFormData({...formData, valor: e.target.value})}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14, background: isReadOnly ? "#F8FAFC" : "white" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Vencimento *</label>
            <input 
              required
              disabled={isReadOnly}
              type="date"
              value={formData.dataVencimento}
              onChange={(e) => setFormData({...formData, dataVencimento: e.target.value})}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14, background: isReadOnly ? "#F8FAFC" : "white" }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Status</label>
          <select 
            disabled={isReadOnly}
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14, background: isReadOnly ? "#F8FAFC" : "white" }}
          >
            <option value="pendente">Pendente</option>
            <option value="pago">Pago 🔒</option>
            <option value="atrasado">Atrasado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 20 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Link do Boleto / PIX</label>
          <input 
            type="url"
            value={formData.linkBoleto}
            onChange={(e) => setFormData({...formData, linkBoleto: e.target.value})}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Substituir Demonstrativo (Opcional)</label>
          <div style={{ position: "relative" }}>
            <input 
              type="file"
              id="file-edit"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            <label 
              htmlFor="file-edit"
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
                fontWeight: 600
              }}
            >
              {file ? `✅ ${file.name}` : "📁 Alterar imagem do demonstrativo"}
            </label>
          </div>
          {cobranca.urlDemonstrativo && !file && (
            <p style={{ fontSize: 12, color: "#22C55E", marginTop: 8 }}>Mantenha em branco para conservar a imagem atual.</p>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button 
            type="button" 
            onClick={() => router.back()}
            style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1px solid #E2E8F0", background: "white", fontWeight: 700, cursor: "pointer" }}
          >
            Voltar
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
              cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
