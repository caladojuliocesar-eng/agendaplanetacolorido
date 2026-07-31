"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getStudentsByParent, getCobrancasByAluno, markCobrancaAsViewed, updateCobranca } from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Student, Cobranca } from "@/types";
import { useEffect, useState } from "react";

export default function ParentFinanceiroPage() {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [cobrancas, setCobrancas] = useState<Record<string, Cobranca[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCobranca, setSelectedCobranca] = useState<Cobranca | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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
    setSelectedCobranca(c);
    if (!c.visualizado) {
      try {
        await markCobrancaAsViewed(c.id);
        // Update local state
        setCobrancas(prev => {
          const studentCharges = prev[c.alunoId].map(item => 
            item.id === c.id ? { ...item, visualizado: true } : item
          );
          return { ...prev, [c.alunoId]: studentCharges };
        });
        setSelectedCobranca(prev => prev ? { ...prev, visualizado: true } : null);
      } catch (err) {
        console.error("Erro ao marcar como visualizado:", err);
      }
    }
  }

  async function handleUploadComprovante(c: Cobranca, file: File) {
    setUploadingId(c.id);
    try {
      const fileRef = ref(storage(), `comprovantes/${profile!.escolaId}/${c.alunoId}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      const now = new Date().toISOString();
      await updateCobranca(c.id, { urlComprovante: url, dataEnvioComprovante: now });
      
      // Update local state
      setCobrancas(prev => {
        const studentCharges = prev[c.alunoId].map(item => 
          item.id === c.id ? { ...item, urlComprovante: url, dataEnvioComprovante: now } : item
        );
        return { ...prev, [c.alunoId]: studentCharges };
      });
      setSelectedCobranca(prev => prev && prev.id === c.id ? { ...prev, urlComprovante: url, dataEnvioComprovante: now } : prev);
      alert("Comprovante enviado com sucesso! A escola irá conferir o pagamento.");
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao enviar comprovante. Verifique sua conexão.");
    } finally {
      setUploadingId(null);
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
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", margin: 0 }}>Financeiro</h2>
        <p style={{ fontSize: 14, color: "#64748B", margin: "4px 0 0 0" }}>Boletos e comprovantes de pagamento</p>
      </div>

      {children.map(child => (
        <div key={child.id} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: "50%", 
              background: "rgba(249, 115, 22, 0.1)", 
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
                const isPaid = c.status === 'pago';
                const hasComprovante = !!c.urlComprovante;

                return (
                  <div 
                    key={c.id} 
                    onClick={() => handleOpenCobranca(c)}
                    style={{ 
                      background: "white", 
                      borderRadius: 16, 
                      padding: 16, 
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", margin: "8px 0 4px 0" }}>{c.titulo}</h4>
                        <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                          Vencimento: {new Date(c.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", margin: 0 }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.valor)}
                        </p>
                      </div>
                    </div>

                    <div style={{ 
                      marginTop: 12, 
                      paddingTop: 12, 
                      borderTop: "1px solid #F1F5F9", 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      fontSize: 12, 
                      color: "#64748B", 
                      fontWeight: 600 
                    }}>
                      <span>{hasComprovante ? "✅ Comprovante enviado" : "👉 Detalhes e Opções de Pagamento"}</span>
                      <span style={{ color: "var(--primary)" }}>Ver ➔</span>
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
            alt="Anexo" 
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, boxShadow: "0 0 20px rgba(0,0,0,0.5)" }} 
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            style={{ position: "absolute", top: 20, right: 20, background: "white", border: "none", borderRadius: "50%", width: 40, height: 40, fontWeight: "bold", fontSize: 20, cursor: "pointer" }}
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal 2: Detalhes da Cobrança */}
      {selectedCobranca && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 900, padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 450, padding: 24, position: "relative", maxHeight: "90vh", overflowY: "auto", background: "white", borderRadius: 20 }}>
            <button 
              onClick={() => setSelectedCobranca(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "#F1F5F9", border: "none", borderRadius: "50%", width: 32, height: 32, fontWeight: "bold", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}
            >
              ✕
            </button>

            <div style={{ marginBottom: 20 }}>
              <span style={{ 
                fontSize: 10, 
                fontWeight: 800, 
                color: getStatusLabel(selectedCobranca.status).color, 
                background: getStatusLabel(selectedCobranca.status).color + '15',
                padding: "4px 10px",
                borderRadius: 20,
                letterSpacing: "0.05em"
              }}>
                {getStatusLabel(selectedCobranca.status).label}
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: "12px 0 6px 0" }}>{selectedCobranca.titulo}</h3>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                Vencimento: {new Date(selectedCobranca.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div style={{ background: "#F8FAFC", borderRadius: 16, padding: 16, border: "1px solid #E2E8F0", marginBottom: 20, textAlign: "center" }}>
              <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Valor Total</span>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCobranca.valor)}
              </div>
            </div>

            {/* Items detail list */}
            {((selectedCobranca.itens && selectedCobranca.itens.length > 0) || selectedCobranca.linkBoleto) && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Demonstrativo de Lançamentos</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#F8FAFC", padding: 12, borderRadius: 12, border: "1px solid #F1F5F9" }}>
                  {selectedCobranca.itens && selectedCobranca.itens.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569" }}>
                      <span>{item.descricao}</span>
                      <span style={{ fontWeight: 700, color: "#1E293B" }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                      </span>
                    </div>
                  ))}
                  
                  {selectedCobranca.linkBoleto && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#64748B", letterSpacing: "0.05em" }}>LINK DO BOLETO / CHAVE PIX</span>
                      {selectedCobranca.linkBoleto.startsWith("http") ? (
                        <a 
                          href={selectedCobranca.linkBoleto} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: 13, color: "#EA580C", fontWeight: 700, textDecoration: "underline", wordBreak: "break-all" }}
                        >
                          {selectedCobranca.linkBoleto}
                        </a>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#334155", wordBreak: "break-all", flex: 1 }}>{selectedCobranca.linkBoleto}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(selectedCobranca.linkBoleto!);
                              alert("Código de pagamento copiado para a área de transferência!");
                            }}
                            style={{ padding: "4px 8px", background: "#E0F2FE", border: "none", color: "#0369A1", fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: "pointer", flexShrink: 0 }}
                          >
                            Copiar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Section (Boleto or PIX) */}
            {selectedCobranca.status !== 'pago' && selectedCobranca.linkBoleto && (
              <div style={{ marginBottom: 20, borderTop: "1px dashed #E2E8F0", paddingTop: 20 }}>
                <h4 style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Opções de Pagamento</h4>
                
                {selectedCobranca.linkBoleto.startsWith("http") ? (
                  <a 
                    href={selectedCobranca.linkBoleto} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: "block", 
                      textAlign: "center", 
                      background: "var(--primary)", 
                      color: "white", 
                      textDecoration: "none", 
                      padding: "12px", 
                      borderRadius: 12, 
                      fontSize: 14, 
                      fontWeight: 700,
                      boxShadow: "0 4px 12px rgba(249, 115, 22, 0.2)"
                    }}
                  >
                    🔗 Abrir Boleto / Link de Pagamento
                  </a>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ 
                      background: "#F1F5F9", 
                      padding: 12, 
                      borderRadius: 10, 
                      fontSize: 11, 
                      fontFamily: "monospace", 
                      wordBreak: "break-all", 
                      maxHeight: 100, 
                      overflowY: "auto",
                      border: "1px solid #CBD5E1",
                      color: "#334155"
                    }}>
                      {selectedCobranca.linkBoleto}
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCobranca.linkBoleto!);
                        alert("Código de pagamento copiado para a área de transferência!");
                      }}
                      style={{ 
                        background: "#E0F2FE", 
                        color: "#0369A1", 
                        border: "none", 
                        padding: "12px", 
                        borderRadius: 12, 
                        fontSize: 14, 
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8
                      }}
                    >
                      📋 Copiar Código PIX / Barras
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Receipt Section */}
            <div style={{ borderTop: "1px dashed #E2E8F0", paddingTop: 20 }}>
              <h4 style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Comprovante</h4>
              {selectedCobranca.status === 'pago' ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#22C55E", fontSize: 14, fontWeight: 700 }}>
                    ✅ Pago e validado pela escola
                  </div>
                  {selectedCobranca.dataPagamento && (
                    <span style={{ fontSize: 12, color: "#64748B" }}>
                      Data da quitação: {new Date(selectedCobranca.dataPagamento).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              ) : selectedCobranca.urlComprovante ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#2563EB", fontSize: 13, fontWeight: 600 }}>
                    <span>📥 Comprovante enviado para análise</span>
                    <button 
                      onClick={() => setSelectedImage(selectedCobranca.urlComprovante!)}
                      style={{ background: "none", border: "none", color: "#2563EB", fontSize: 12, textDecoration: "underline", cursor: "pointer", fontWeight: 700 }}
                    >
                      Ver Anexo
                    </button>
                  </div>
                  {selectedCobranca.dataEnvioComprovante && (
                    <span style={{ fontSize: 11, color: "#64748B" }}>
                      Enviado em: {new Date(selectedCobranca.dataEnvioComprovante).toLocaleDateString('pt-BR')} às {new Date(selectedCobranca.dataEnvioComprovante).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <input 
                    type="file" 
                    id={`modal-upload-${selectedCobranca.id}`}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await handleUploadComprovante(selectedCobranca, file);
                      }
                    }}
                  />
                  <label 
                    htmlFor={`modal-upload-${selectedCobranca.id}`}
                    style={{ 
                      display: "block",
                      textAlign: "center",
                      padding: "12px",
                      borderRadius: 12,
                      background: uploadingId === selectedCobranca.id ? "#F1F5F9" : "white",
                      border: "2px dashed #CBD5E1",
                      color: "#475569",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {uploadingId === selectedCobranca.id ? "Enviando..." : "📤 Enviar Comprovante de Pagamento"}
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
