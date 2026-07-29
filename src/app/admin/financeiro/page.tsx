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
  const [activeTab, setActiveTab] = useState<"ativas" | "pagas">("ativas");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "pagas") {
        setActiveTab("pagas");
      } else {
        setActiveTab("ativas");
      }
      const searchParam = params.get("search");
      if (searchParam) {
        setSearchTerm(searchParam);
      }
    }
  }, []);

  useEffect(() => {
    if (profile?.escolaId) {
      loadCobrancas();
    }
  }, [profile]);

  async function loadCobrancas() {
    try {
      const data = await getCobrancasByEscola(profile!.escolaId);
      const todayStr = new Date().toISOString().split("T")[0];

      // Atualizar automaticamente o status de cobranças pendentes que venceram
      const updatedData = await Promise.all(data.map(async (c) => {
        if (c.status === "pendente" && c.dataVencimento < todayStr) {
          try {
            await updateCobrancaStatus(c.id, "atrasado");
            return { ...c, status: "atrasado" as CobrancaStatus };
          } catch (err) {
            console.error("Erro ao atualizar status de cobrança vencida:", err);
          }
        }
        return c;
      }));

      setCobrancas(updatedData);
    } catch (error) {
      console.error("Erro ao carregar cobranças:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCobrancas = cobrancas.filter(c => {
    const matchesTab = activeTab === "ativas" 
      ? c.status !== "pago" && c.status !== "cancelado"
      : c.status === "pago" || c.status === "cancelado";
    const matchesSearch = !searchTerm || 
      c.alunoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.alunoTurma && c.alunoTurma.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });



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

      {/* Tabs para Filtrar Cobranças */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, borderBottom: "1px solid #E2E8F0", paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab("ativas")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "ativas" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "ativas" ? "var(--primary-dark)" : "#64748B",
            fontWeight: 700,
            padding: "8px 16px",
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.2s"
          }}
        >
          📂 Cobranças em Aberto
          {cobrancas.filter(c => c.status !== 'pago' && c.status !== 'cancelado').length > 0 && (
            <span style={{
              background: "#64748B",
              color: "white",
              fontSize: 11,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 20
            }}>
              {cobrancas.filter(c => c.status !== 'pago' && c.status !== 'cancelado').length}
            </span>
          )}
          {cobrancas.filter(c => c.urlComprovante && c.status !== 'pago').length > 0 && (
            <span style={{
              background: "#F59E0B",
              color: "#1E293B",
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 20
            }} title="Comprovantes anexados aguardando validação">
              {cobrancas.filter(c => c.urlComprovante && c.status !== 'pago').length} com comprovante
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("pagas")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "pagas" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "pagas" ? "var(--primary-dark)" : "#64748B",
            fontWeight: 700,
            padding: "8px 16px",
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          ✅ Histórico de Recebidas
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input 
            type="text" 
            placeholder="🔍 Buscar por aluno, turma ou título da cobrança..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-input"
            style={{ width: "100%", paddingLeft: 12, margin: 0 }}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")} 
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontWeight: 700 }}
            >
              ✕
            </button>
          )}
        </div>
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
            {filteredCobrancas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#64748B" }}>
                  {activeTab === "ativas" 
                    ? "Tudo limpo! Nenhuma cobrança em aberto no momento." 
                    : "Nenhuma cobrança recebida no histórico."}
                </td>
              </tr>
            ) : (
              filteredCobrancas.map((c) => {
                const isOverdue = c.status === 'atrasado';
                const hasVoucherToValidate = c.urlComprovante && c.status !== 'pago';

                return (
                  <tr 
                    key={c.id} 
                    style={{ 
                      borderBottom: "1px solid #F1F5F9",
                      background: isOverdue ? "#FFF1F2" : hasVoucherToValidate ? "#EFF6FF" : "transparent"
                    }}
                  >
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
                        color: getStatusColor(c.status),
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}>
                        {isOverdue && "⚠️ "}
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      {c.urlComprovante ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                          <a 
                            href={c.urlComprovante}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              display: "inline-block",
                              background: "#F0FDF4", 
                              border: "1px solid #BBF7D0", 
                              color: "#166534", 
                              padding: "4px 8px", 
                              borderRadius: 8, 
                              fontSize: 12, 
                              fontWeight: 700, 
                              textDecoration: "none"
                            }}
                          >
                            📄 Ver Anexo
                          </a>
                          {hasVoucherToValidate && (
                            <span style={{ fontSize: 10, color: "#2563EB", fontWeight: 700 }}>
                              📥 Aguardando Validação
                            </span>
                          )}
                        </div>
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
