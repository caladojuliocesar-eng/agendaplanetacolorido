"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { 
  getUniformItems, 
  saveUniformItem, 
  sellUniformItem,
  getAllStudents
} from "@/lib/firestore";
import { UniformItem, Student } from "@/types";

export default function AdminEstoquePage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<UniformItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Action States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UniformItem | null>(null);
  const [processing, setProcessing] = useState(false);

  // Forms State
  const [itemForm, setItemForm] = useState({
    nome: "",
    tamanho: "T2",
    quantidade: 10,
    estoqueMinimo: 3,
    precoUnitario: 45.00
  });

  const [saleForm, setSaleForm] = useState({
    alunoId: "",
    quantidade: 1
  });

  const [entryQty, setEntryQty] = useState(5);

  useEffect(() => {
    if (profile?.escolaId) {
      loadData();
    }
  }, [profile]);

  async function loadData() {
    setLoading(true);
    try {
      const [stockData, studentsData] = await Promise.all([
        getUniformItems(profile!.escolaId!),
        getAllStudents(profile!.escolaId!)
      ]);
      setItems(stockData.sort((a, b) => a.nome.localeCompare(b.nome)));
      setStudents(studentsData.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (err) {
      console.error("Error loading stock data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.nome.trim()) return;
    
    setProcessing(true);
    try {
      const id = `${itemForm.nome.toLowerCase().replace(/\s+/g, "-")}_${itemForm.tamanho.toLowerCase()}`;
      await saveUniformItem({
        id,
        nome: itemForm.nome,
        tamanho: itemForm.tamanho,
        quantidade: Number(itemForm.quantidade),
        estoqueMinimo: Number(itemForm.estoqueMinimo),
        precoUnitario: Number(itemForm.precoUnitario),
        escolaId: profile!.escolaId!
      });
      setIsItemModalOpen(false);
      setItemForm({ nome: "", tamanho: "T2", quantidade: 10, estoqueMinimo: 3, precoUnitario: 45.00 });
      await loadData();
      alert("Item de uniforme cadastrado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar item.");
    } finally {
      setProcessing(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setProcessing(true);
    try {
      await saveUniformItem({
        ...selectedItem,
        quantidade: selectedItem.quantidade + Number(entryQty)
      });
      setIsEntryModalOpen(false);
      setSelectedItem(null);
      await loadData();
      alert("Estoque reabastecido com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao reabastecer estoque.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !saleForm.alunoId) return;

    if (selectedItem.quantidade < Number(saleForm.quantidade)) {
      alert(`Quantidade vendida excede o estoque disponível (${selectedItem.quantidade} unidades).`);
      return;
    }

    setProcessing(true);
    try {
      const student = students.find(s => s.id === saleForm.alunoId);
      if (!student) throw new Error("Aluno não encontrado.");

      await sellUniformItem(
        student.id,
        student.nome,
        student.turma,
        selectedItem.id,
        Number(saleForm.quantidade),
        profile!.escolaId!
      );

      setIsSaleModalOpen(false);
      setSelectedItem(null);
      setSaleForm({ alunoId: "", quantidade: 1 });
      await loadData();
      alert("Venda registrada! O estoque foi reduzido e a cobrança lançada no financeiro do aluno.");
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar venda.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading && items.length === 0) return <div className="spinner" />;

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px 0" }}>Estoque de Uniformes</h1>
          <p style={{ color: "#64748B", margin: 0 }}>Gerencie o inventário físico de peças e realize vendas diretas integradas ao Financeiro.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setIsItemModalOpen(true)}>
          + Cadastrar Peça
        </button>
      </header>

      {/* Inventory Table */}
      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
            <tr>
              <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B" }}>Peça</th>
              <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textAlign: "center" }}>Tamanho</th>
              <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textAlign: "center" }}>Preço Unitário</th>
              <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textAlign: "center" }}>Quantidade</th>
              <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748B", textAlign: "center" }}>Status</th>
              <th style={{ padding: "16px 24px" }}></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: "center", color: "#94A3B8" }}>
                  Nenhuma peça de uniforme cadastrada. Clique em "+ Cadastrar Peça" para começar.
                </td>
              </tr>
            ) : (
              items.map(item => {
                const isOutOfStock = item.quantidade === 0;
                const isLowStock = item.quantidade <= item.estoqueMinimo && !isOutOfStock;

                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "16px 24px", fontWeight: 700, color: "#1E293B" }}>
                      👕 {item.nome}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "center", fontWeight: 600 }}>
                      <span style={{ background: "#F1F5F9", padding: "4px 8px", borderRadius: 6, fontSize: 12 }}>
                        {item.tamanho}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "center", fontWeight: 700, color: "#0F172A" }}>
                      R$ {item.precoUnitario.toFixed(2).replace(".", ",")}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "center", fontWeight: 700 }}>
                      {item.quantidade}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "center" }}>
                      {isOutOfStock ? (
                        <span style={{ background: "#FEE2E2", color: "#EF4444", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 12 }}>
                          ESGOTADO
                        </span>
                      ) : isLowStock ? (
                        <span style={{ background: "#FEF3C7", color: "#D97706", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 12 }}>
                          ESTOQUE CRÍTICO
                        </span>
                      ) : (
                        <span style={{ background: "#D1FAE5", color: "#10B981", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 12 }}>
                          EM ESTOQUE
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button 
                          onClick={() => { setSelectedItem(item); setIsEntryModalOpen(true); }}
                          className="btn btn--secondary" 
                          style={{ fontSize: 11, padding: "6px 12px" }}
                        >
                          ➕ Repor
                        </button>
                        <button 
                          onClick={() => { setSelectedItem(item); setIsSaleModalOpen(true); }}
                          disabled={isOutOfStock}
                          className="btn btn--primary" 
                          style={{ fontSize: 11, padding: "6px 12px" }}
                        >
                          🤝 Vender
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

      {/* Modal 1: Cadastrar Peça */}
      {isItemModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <form onSubmit={handleCreateItem} className="card" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
            <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 800, color: "#1E293B" }}>Nova Peça de Uniforme</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>NOME DA PEÇA</label>
                <input 
                  type="text" 
                  className="text-input" 
                  required 
                  placeholder="Ex: Camiseta Manga Curta" 
                  value={itemForm.nome} 
                  onChange={e => setItemForm(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>TAMANHO</label>
                  <select 
                    className="text-input" 
                    value={itemForm.tamanho} 
                    onChange={e => setItemForm(prev => ({ ...prev, tamanho: e.target.value }))}
                  >
                    {["T2", "T4", "T6", "T8", "T10", "P", "M", "G"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>PREÇO UNITÁRIO (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="text-input" 
                    required 
                    value={itemForm.precoUnitario} 
                    onChange={e => setItemForm(prev => ({ ...prev, precoUnitario: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>QTD. INICIAL</label>
                  <input 
                    type="number" 
                    className="text-input" 
                    required 
                    value={itemForm.quantidade} 
                    onChange={e => setItemForm(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>ESTOQUE MÍNIMO</label>
                  <input 
                    type="number" 
                    className="text-input" 
                    required 
                    value={itemForm.estoqueMinimo} 
                    onChange={e => setItemForm(prev => ({ ...prev, estoqueMinimo: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
              <button 
                type="button" 
                onClick={() => setIsItemModalOpen(false)} 
                className="btn btn--secondary" 
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={processing} 
                className="btn btn--primary" 
                style={{ flex: 1 }}
              >
                {processing ? "Cadastrando..." : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Repor Estoque */}
      {isEntryModalOpen && selectedItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <form onSubmit={handleAddStock} className="card" style={{ width: "100%", maxWidth: 350, padding: 32 }}>
            <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 800, color: "#1E293B" }}>Repor Estoque</h3>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20 }}>
              Adicionar quantidade para: <br /><strong>{selectedItem.nome} (Tamanho: {selectedItem.tamanho})</strong>.
            </p>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>QUANTIDADE A ADICIONAR</label>
              <input 
                type="number" 
                className="text-input" 
                required 
                value={entryQty} 
                onChange={e => setEntryQty(Number(e.target.value))}
              />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
              <button 
                type="button" 
                onClick={() => { setIsEntryModalOpen(false); setSelectedItem(null); }} 
                className="btn btn--secondary" 
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={processing} 
                className="btn btn--primary" 
                style={{ flex: 1 }}
              >
                {processing ? "Processando..." : "Confirmar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Vender Uniforme */}
      {isSaleModalOpen && selectedItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <form onSubmit={handleRegisterSale} className="card" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
            <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 800, color: "#1E293B" }}>Registrar Venda</h3>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20 }}>
              Peça selecionada: <br /><strong>{selectedItem.nome} - Tam: {selectedItem.tamanho}</strong> (R$ {selectedItem.precoUnitario.toFixed(2).replace(".", ",")}).
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>SELECIONE O ALUNO *</label>
                <select 
                  className="text-input" 
                  required
                  value={saleForm.alunoId} 
                  onChange={e => setSaleForm(prev => ({ ...prev, alunoId: e.target.value }))}
                >
                  <option value="" disabled>Selecione o aluno...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.nome} ({s.turma})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>QUANTIDADE VENDIDA</label>
                <input 
                  type="number" 
                  min={1}
                  max={selectedItem.quantidade}
                  className="text-input" 
                  required 
                  value={saleForm.quantidade} 
                  onChange={e => setSaleForm(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                />
              </div>

              <div style={{ padding: 12, background: "#FFF7ED", border: "1px dashed var(--primary)", borderRadius: 8, fontSize: 12, color: "var(--primary-dark)", textAlign: "center" }}>
                💰 <strong>Total da venda:</strong> R$ {(selectedItem.precoUnitario * saleForm.quantidade).toFixed(2).replace(".", ",")} <br />
                <span style={{ fontSize: 10, color: "#7C2D12" }}>Uma cobrança de mesmo valor será lançada na aba financeira dos pais.</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
              <button 
                type="button" 
                onClick={() => { setIsSaleModalOpen(false); setSelectedItem(null); setSaleForm({ alunoId: "", quantidade: 1 }); }} 
                className="btn btn--secondary" 
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={processing || !saleForm.alunoId} 
                className="btn btn--primary" 
                style={{ flex: 1 }}
              >
                {processing ? "Registrando..." : "Registrar e Cobrar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
