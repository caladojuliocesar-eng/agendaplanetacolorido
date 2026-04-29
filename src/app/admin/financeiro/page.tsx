"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getCobrancasByEscola, updateCobrancaStatus, updateCobranca } from "@/lib/firestore";
import { Cobranca, CobrancaStatus } from "@/types";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminFinanceiroPage() {
  const { profile } = useAuth();
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.escolaId) {
      loadCobrancas();
    }
  }, [profile]);

  async function loadCobrancas() {
    try {
      const data = await getCobrancasByEscola(profile!.escolaId);
      setCobrancas(data);
    } catch (error) {
      console.error("Erro ao carregar cobranças:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPayment(id: string) {
    if (confirm("Confirmar que o pagamento foi recebido? O status passará para PAGO.")) {
      try {
        await updateCobranca(id, { 
          status: 'pago',
          dataPagamento: new Date().toISOString()
        });
        setCobrancas(prev => prev.map(c => c.id === id ? { ...c, status: 'pago' as CobrancaStatus } : c));
      } catch (error) {
        alert("Erro ao confirmar");
      }
    }
  }

  async function handleStatusChange(id: string, newStatus: CobrancaStatus) {
    try {
      await updateCobrancaStatus(id, newStatus);
      setCobrancas(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (error) {
      alert("Erro ao atualizar status");
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir esta cobrança?")) {
      try {
        await (await import("@/lib/firestore")).deleteCobranca(id);
        setCobrancas(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        alert("Erro ao excluir");
      }
    }
  }

  const getStatusColor = (status: CobrancaStatus) => {
    switch (status) {
      case 'pago': return '#22C55E';
      case 'pendente': return '#F97316';
      case 'atrasado': return '#EF4444';
      default: return '#64748B';
    }
  };

  if (loading) return <div className="spinner" style={{ margin: "40px auto" }} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", margin: 0 }}>Financeiro</h2>
          <p style={{ color: "#64748B", margin: "4px 0 0 0" }}>Gerencie as cobranças e mensalidades da escola</p>
        </div>
        <Link 
          href="/admin/financeiro/nova"
          style={{
            background: "var(--primary)",
            color: "white",
            padding: "12px 24px",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
            boxShadow: "0 4px 12px rgba(249, 115, 22, 0.2)"
          }}
        >
          + Nova Cobrança
        </Link>
      </div>

      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <th style={{ padding: "16px", fontSize: 13, fontWeight: 700, color: "#64748B" }}>Aluno</th>
              <th style={{ padding: "16px", fontSize: 13, fontWeight: 700, color: "#64748B" }}>Título</th>
              <th style={{ padding: "16px", fontSize: 13, fontWeight: 700, color: "#64748B" }}>Valor</th>
              <th style={{ padding: "16px", fontSize: 13, fontWeight: 700, color: "#64748B" }}>Status</th>
              <th style={{ padding: "16px", fontSize: 13, fontWeight: 700, color: "#64748B" }}>Comprovante</th>
              <th style={{ padding: "16px", fontSize: 13, fontWeight: 700, color: "#64748B" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {cobrancas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#64748B" }}>
                  Nenhuma cobrança encontrada.
                </td>
              </tr>
            ) : (
              cobrancas.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: 700, color: "#1E293B", fontSize: 14 }}>{c.alunoNome}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{c.alunoTurma}</div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: 600, color: "#1E293B", fontSize: 13 }}>{c.titulo}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Venc: {new Date(c.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                  </td>
                  <td style={{ padding: "16px", fontWeight: 700, color: "#1E293B" }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.valor)}
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span style={{ 
                      padding: "4px 12px", 
                      borderRadius: 20, 
                      fontSize: 11, 
                      fontWeight: 700, 
                      background: getStatusColor(c.status) + '15',
                      color: getStatusColor(c.status)
                    }}>
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "16px" }}>
                    {c.urlComprovante ? (
                      <button 
                        onClick={() => setSelectedImage(c.urlComprovante!)}
                        style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        📄 Ver Anexo
                      </button>
                    ) : (
                      <span style={{ color: "#94A3B8", fontSize: 12 }}>Nenhum</span>
                    )}
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {c.urlComprovante && c.status !== 'pago' && (
                        <button 
                          onClick={() => handleConfirmPayment(c.id)}
                          style={{ padding: "6px 12px", background: "#22C55E", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Confirmar
                        </button>
                      )}
                      <select 
                        value={c.status} 
                        onChange={(e) => handleStatusChange(c.id, e.target.value as CobrancaStatus)}
                        style={{ padding: "6px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="pago">Pago</option>
                        <option value="atrasado">Atrasado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                      <Link 
                        href={`/admin/financeiro/editar/${c.id}`}
                        style={{ padding: "6px 12px", background: "#F1F5F9", borderRadius: 8, color: "#475569", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                      >
                        ✏️
                      </Link>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        style={{ padding: "6px", background: "#FEE2E2", borderRadius: 8, color: "#EF4444", border: "none", cursor: "pointer" }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for image viewing */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{ 
            position: "fixed", 
            top: 0, left: 0, right: 0, bottom: 0, 
            background: "rgba(0,0,0,0.9)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1000,
            padding: 20
          }}
        >
          <img 
            src={selectedImage} 
            alt="Comprovante" 
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, boxShadow: "0 0 20px rgba(0,0,0,0.5)" }} 
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            style={{ position: "absolute", top: 20, right: 20, background: "white", border: "none", borderRadius: "50%", width: 40, height: 40, fontWeight: "bold", cursor: "pointer" }}
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
