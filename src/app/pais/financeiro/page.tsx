"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getStudentsByParent, getCobrancasByAluno, markCobrancaAsViewed } from "@/lib/firestore";
import { Student, Cobranca } from "@/types";
import { useEffect, useState } from "react";

export default function ParentFinanceiroPage() {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [cobrancas, setCobrancas] = useState<Record<string, Cobranca[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.filhos) {
      loadData();
    }
  }, [profile]);

  async function loadData() {
    try {
      const childrenData = await getStudentsByParent(profile!.filhos!);
      setChildren(childrenData);

      const allCobrancas: Record<string, Cobranca[]> = {};
      for (const child of childrenData) {
        const data = await getCobrancasByAluno(child.id);
        allCobrancas[child.id] = data;
      }
      setCobrancas(allCobrancas);
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenCobranca(c: Cobranca) {
    if (!c.visualizado) {
      await markCobrancaAsViewed(c.id);
      // Update local state
      setCobrancas(prev => {
        const studentCharges = prev[c.alunoId].map(item => 
          item.id === c.id ? { ...item, visualizado: true } : item
        );
        return { ...prev, [c.alunoId]: studentCharges };
      });
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago': return { label: 'PAGO', color: '#22C55E' };
      case 'atrasado': return { label: 'ATRASADO', color: '#EF4444' };
      default: return { label: 'PENDENTE', color: '#F97316' };
    }
  };

  if (loading) return <div className="spinner" style={{ margin: "40px auto" }} />;

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", margin: 0 }}>Financeiro</h2>
        <p style={{ fontSize: 14, color: "#64748B", margin: "4px 0 0 0" }}>Boletos e demonstrativos de despesas</p>
      </div>

      {children.map(child => (
        <div key={child.id} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: "50%", 
              background: "var(--primary-light)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              fontSize: 14
            }}>
              👶
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", margin: 0 }}>{child.nome}</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(!cobrancas[child.id] || cobrancas[child.id].length === 0) ? (
              <p style={{ fontSize: 14, color: "#94A3B8", textAlign: "center", padding: "20px", background: "white", borderRadius: 12, border: "1px dashed #E2E8F0" }}>
                Nenhuma cobrança encontrada para este aluno.
              </p>
            ) : (
              cobrancas[child.id].map(c => {
                const status = getStatusLabel(c.status);
                return (
                  <div 
                    key={c.id} 
                    onClick={() => handleOpenCobranca(c)}
                    style={{ 
                      background: "white", 
                      borderRadius: 16, 
                      padding: 16, 
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <span style={{ 
                          fontSize: 10, 
                          fontWeight: 800, 
                          color: status.color, 
                          background: status.color + '15',
                          padding: "2px 8px",
                          borderRadius: 4,
                          letterSpacing: "0.05em"
                        }}>
                          {status.label}
                        </span>
                        <h4 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", margin: "8px 0 4px 0" }}>{c.titulo}</h4>
                        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                          Vencimento: {new Date(c.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: 0 }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.valor)}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                      {c.linkBoleto && (
                        <a 
                          href={c.linkBoleto} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            flex: 1, 
                            textAlign: "center", 
                            background: "var(--primary)", 
                            color: "white", 
                            textDecoration: "none", 
                            padding: "10px", 
                            borderRadius: 10, 
                            fontSize: 13, 
                            fontWeight: 700 
                          }}
                        >
                          Copiar Link / Pagar
                        </a>
                      )}
                      {c.urlDemonstrativo && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(c.urlDemonstrativo!);
                          }}
                          style={{ 
                            flex: 1, 
                            textAlign: "center", 
                            background: "#F1F5F9", 
                            color: "#475569", 
                            border: "none",
                            padding: "10px", 
                            borderRadius: 10, 
                            fontSize: 13, 
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Ver Detalhes
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}

      {/* Modal for image viewing */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{ 
            position: "fixed", 
            top: 0, left: 0, right: 0, bottom: 0, 
            background: "rgba(0,0,0,0.8)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1000,
            padding: 20
          }}
        >
          <img 
            src={selectedImage} 
            alt="Demonstrativo" 
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} 
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            style={{ position: "absolute", top: 20, right: 20, background: "white", border: "none", borderRadius: "50%", width: 32, height: 32, fontWeight: "bold" }}
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
