"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getCobrancasByEscola } from "@/lib/firestore";
import { Cobranca } from "@/types";
import Link from "next/link";

interface CategoryStat {
  categoria: string;
  emoji: string;
  pago: number;
  pendente: number;
  atrasado: number;
  total: number;
}

interface TurmaStat {
  turma: string;
  cobrancasTotal: number;
  pago: number;
  atrasado: number;
  taxaInadimplencia: number;
}

export default function AdminRelatorioFinanceiroPage() {
  const { profile } = useAuth();
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.escolaId) {
      loadData();
    }
  }, [profile]);

  async function loadData() {
    try {
      const data = await getCobrancasByEscola(profile!.escolaId);
      setCobrancas(data);
    } catch (err) {
      console.error("Erro ao carregar cobranças para relatório:", err);
    } finally {
      setLoading(false);
    }
  }

  // Auto-categorize charge based on title and items
  const categorize = (c: Cobranca): string => {
    const title = (c.titulo || "").toLowerCase();
    if (title.includes("uniforme")) return "Uniformes";
    if (title.includes("lanche") || title.includes("cantina") || title.includes("aliment") || title.includes("refeic")) return "Alimentação / Lanches";
    if (title.includes("hora") || title.includes("extra") || title.includes("banho") || title.includes("diaria")) return "Horas Extra / Banho / Diárias";
    if (title.includes("mensalid") || title.includes("matricul") || title.includes("tuition") || title.includes("parcela")) return "Mensalidades & Matrícula";
    return "Outros & Avulsos";
  };

  // Compute Global KPIs
  const totalPago = cobrancas.filter(c => c.status === "pago").reduce((sum, c) => sum + (c.valor || 0), 0);
  const totalPendente = cobrancas.filter(c => c.status === "pendente").reduce((sum, c) => sum + (c.valor || 0), 0);
  const totalAtrasado = cobrancas.filter(c => c.status === "atrasado").reduce((sum, c) => sum + (c.valor || 0), 0);
  const totalGeral = totalPago + totalPendente + totalAtrasado;
  const taxaInadimplenciaGeral = totalGeral > 0 ? (totalAtrasado / totalGeral) * 100 : 0;

  // Compute Categories Stats
  const categoriesMap: Record<string, { pago: number; pendente: number; atrasado: number; emoji: string }> = {
    "Mensalidades & Matrícula": { pago: 0, pendente: 0, atrasado: 0, emoji: "📚" },
    "Uniformes": { pago: 0, pendente: 0, atrasado: 0, emoji: "👕" },
    "Alimentação / Lanches": { pago: 0, pendente: 0, atrasado: 0, emoji: "🍎" },
    "Horas Extra / Banho / Diárias": { pago: 0, pendente: 0, atrasado: 0, emoji: "⏰" },
    "Outros & Avulsos": { pago: 0, pendente: 0, atrasado: 0, emoji: "📦" },
  };

  cobrancas.forEach(c => {
    const cat = categorize(c);
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = { pago: 0, pendente: 0, atrasado: 0, emoji: "🏷️" };
    }
    const val = c.valor || 0;
    if (c.status === "pago") categoriesMap[cat].pago += val;
    else if (c.status === "pendente") categoriesMap[cat].pendente += val;
    else if (c.status === "atrasado") categoriesMap[cat].atrasado += val;
  });

  const categoryStats: CategoryStat[] = Object.entries(categoriesMap).map(([cat, stats]) => ({
    categoria: cat,
    emoji: stats.emoji,
    pago: stats.pago,
    pendente: stats.pendente,
    atrasado: stats.atrasado,
    total: stats.pago + stats.pendente + stats.atrasado,
  }));

  // Compute Turmas Stats
  const turmasMap: Record<string, { pago: number; atrasado: number; total: number; count: number }> = {};

  cobrancas.forEach(c => {
    const turma = c.alunoTurma || "Sem Turma";
    if (!turmasMap[turma]) {
      turmasMap[turma] = { pago: 0, atrasado: 0, total: 0, count: 0 };
    }
    const val = c.valor || 0;
    turmasMap[turma].count += 1;
    turmasMap[turma].total += val;
    if (c.status === "pago") turmasMap[turma].pago += val;
    if (c.status === "atrasado") turmasMap[turma].atrasado += val;
  });

  const turmaStats: TurmaStat[] = Object.entries(turmasMap).map(([turma, stats]) => ({
    turma,
    cobrancasTotal: stats.count,
    pago: stats.pago,
    atrasado: stats.atrasado,
    taxaInadimplencia: stats.total > 0 ? (stats.atrasado / stats.total) * 100 : 0
  })).sort((a, b) => b.taxaInadimplencia - a.taxaInadimplencia);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ background: "#F8FAFC", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Printable styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print {
            display: none !important;
          }
          .app-shell {
            background: white !important;
            padding: 0 !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #CBD5E1 !important;
          }
        }
      `}} />

      {/* Header Bar */}
      <div className="no-print" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Link href="/admin/financeiro" style={{ fontSize: 13, color: "#0284C7", fontWeight: 700, textDecoration: "none" }}>
              ← Voltar ao Financeiro
            </Link>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1E293B", margin: 0 }}>📊 Relatório Financeiro Executivo</h1>
          <p style={{ color: "#64748B", margin: "2px 0 0", fontSize: 13 }}>Análise consolidada de receitas por categoria e índice de inadimplência por turma.</p>
        </div>

        <button
          onClick={handlePrint}
          className="btn btn--primary"
          style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}
        >
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      {/* Report Header for Print */}
      <div style={{ padding: 20, background: "white", borderRadius: 16, border: "1px solid #E2E8F0", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", paddingBottom: 16, marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1E293B" }}>DEMONSTRATIVO FINANCEIRO ESCOLAR</h2>
            <span style={{ fontSize: 12, color: "#64748B" }}>Posição consolidada em {new Date().toLocaleDateString("pt-BR")}</span>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: "#64748B" }}>
            <strong>Agenda Ottomatic</strong>
            <div>Relatório de Gestão</div>
          </div>
        </div>

        {/* Global KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={{ padding: 16, background: "#ECFDF5", borderRadius: 12, border: "1px solid #A7F3D0" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#047857", textTransform: "uppercase" }}>RECEITA REALIZADA (PAGA)</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#065F46", marginTop: 4 }}>
              {formatCurrency(totalPago)}
            </div>
            <span style={{ fontSize: 11, color: "#059669" }}>
              {cobrancas.filter(c => c.status === "pago").length} cobranças quitadas
            </span>
          </div>

          <div style={{ padding: 16, background: "#FEF3C7", borderRadius: 12, border: "1px solid #FDE68A" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#B45309", textTransform: "uppercase" }}>A RECEBER (DENTRO DO PRAZO)</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#92400E", marginTop: 4 }}>
              {formatCurrency(totalPendente)}
            </div>
            <span style={{ fontSize: 11, color: "#B45309" }}>
              {cobrancas.filter(c => c.status === "pendente").length} cobranças a vencer
            </span>
          </div>

          <div style={{ padding: 16, background: "#FEE2E2", borderRadius: 12, border: "1px solid #FCA5A5" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#B91C1C", textTransform: "uppercase" }}>EM ATRASO (INADIMPLÊNCIA)</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#991B1B", marginTop: 4 }}>
              {formatCurrency(totalAtrasado)}
            </div>
            <span style={{ fontSize: 11, color: "#DC2626" }}>
              {cobrancas.filter(c => c.status === "atrasado").length} cobranças vencidas
            </span>
          </div>

          <div style={{ padding: 16, background: "#F1F5F9", borderRadius: 12, border: "1px solid #CBD5E1" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>TAXA DE INADIMPLÊNCIA GERAL</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: taxaInadimplenciaGeral > 10 ? "#DC2626" : "#0284C7", marginTop: 4 }}>
              {taxaInadimplenciaGeral.toFixed(1)}%
            </div>
            <span style={{ fontSize: 11, color: "#64748B" }}>
              do volume total faturado
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Revenue by Category */}
      <div className="card" style={{ padding: 24, background: "white", marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 800, color: "#1E293B" }}>
          🏷️ Detalhamento da Receita por Categoria
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                <th style={{ padding: 12, color: "#475569", fontWeight: 700 }}>CATEGORIA</th>
                <th style={{ padding: 12, color: "#047857", fontWeight: 700, textAlign: "right" }}>QUITADO (R$)</th>
                <th style={{ padding: 12, color: "#B45309", fontWeight: 700, textAlign: "right" }}>A VENCER (R$)</th>
                <th style={{ padding: 12, color: "#B91C1C", fontWeight: 700, textAlign: "right" }}>EM ATRASO (R$)</th>
                <th style={{ padding: 12, color: "#1E293B", fontWeight: 800, textAlign: "right" }}>TOTAL FATURADO</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map((cat, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: 12, fontWeight: 700, color: "#1E293B" }}>
                    {cat.emoji} {cat.categoria}
                  </td>
                  <td style={{ padding: 12, textAlign: "right", color: "#047857", fontWeight: 600 }}>
                    {formatCurrency(cat.pago)}
                  </td>
                  <td style={{ padding: 12, textAlign: "right", color: "#B45309" }}>
                    {formatCurrency(cat.pendente)}
                  </td>
                  <td style={{ padding: 12, textAlign: "right", color: cat.atrasado > 0 ? "#DC2626" : "#64748B", fontWeight: cat.atrasado > 0 ? 700 : 400 }}>
                    {formatCurrency(cat.atrasado)}
                  </td>
                  <td style={{ padding: 12, textAlign: "right", fontWeight: 800, color: "#1E293B" }}>
                    {formatCurrency(cat.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Inadimplência por Turma */}
      <div className="card" style={{ padding: 24, background: "white" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 800, color: "#1E293B" }}>
          🏫 Índice de Inadimplência por Turma
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                <th style={{ padding: 12, color: "#475569", fontWeight: 700 }}>TURMA</th>
                <th style={{ padding: 12, color: "#475569", fontWeight: 700, textAlign: "center" }}>Nº COBRANÇAS</th>
                <th style={{ padding: 12, color: "#047857", fontWeight: 700, textAlign: "right" }}>RECEITO PAGA (R$)</th>
                <th style={{ padding: 12, color: "#B91C1C", fontWeight: 700, textAlign: "right" }}>EM ATRASO (R$)</th>
                <th style={{ padding: 12, color: "#1E293B", fontWeight: 800, textAlign: "right" }}>% INADIMPLÊNCIA</th>
              </tr>
            </thead>
            <tbody>
              {turmaStats.map((t, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: 12, fontWeight: 700, color: "#1E293B" }}>
                    {t.turma}
                  </td>
                  <td style={{ padding: 12, textAlign: "center", color: "#64748B" }}>
                    {t.cobrancasTotal}
                  </td>
                  <td style={{ padding: 12, textAlign: "right", color: "#047857", fontWeight: 600 }}>
                    {formatCurrency(t.pago)}
                  </td>
                  <td style={{ padding: 12, textAlign: "right", color: t.atrasado > 0 ? "#DC2626" : "#64748B", fontWeight: t.atrasado > 0 ? 700 : 400 }}>
                    {formatCurrency(t.atrasado)}
                  </td>
                  <td style={{ padding: 12, textAlign: "right", fontWeight: 800 }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 8,
                      background: t.taxaInadimplencia > 15 ? "#FEE2E2" : t.taxaInadimplencia > 0 ? "#FEF3C7" : "#DCFCE7",
                      color: t.taxaInadimplencia > 15 ? "#991B1B" : t.taxaInadimplencia > 0 ? "#92400E" : "#166534"
                    }}>
                      {t.taxaInadimplencia.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
