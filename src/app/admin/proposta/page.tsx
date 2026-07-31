"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function AdminPropostaPage() {
  const { profile } = useAuth();

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 64 }}>
      {/* Header Banner */}
      <header style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        borderRadius: 24,
        padding: "36px 32px",
        color: "white",
        marginBottom: 32,
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "rgba(249, 115, 22, 0.18)",
          filter: "blur(50px)"
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(249, 115, 22, 0.15)", color: "#FB923C", border: "1px solid rgba(249, 115, 22, 0.3)", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 16 }}>
            <span>🚀 PROPOSTA COMERCIAL & MODERNIZAÇÃO 2027</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 8px 0", letterSpacing: "-0.02em", color: "#F8FAFC" }}>
            Plataforma Digital — Escola Planeta Colorido
          </h1>
          <p style={{ color: "#94A3B8", margin: 0, fontSize: 15, maxWidth: 680, lineHeight: 1.6 }}>
            Apresentação executiva da solução completa de comunicação, diário de classe oficial, gestão escolar e inteligência pedagógica.
          </p>
        </div>
      </header>

      {/* SEÇÃO 1: OS 3 PERFIS DE USO E ACESSO */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#EA580C", textTransform: "uppercase", letterSpacing: "0.08em" }}>ARQUITETURA DO SISTEMA</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "4px 0 0" }}>Experiência Dedicada para Cada Integrante da Escola</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {/* Card 1: Pais */}
          <div style={{ background: "white", borderRadius: 20, padding: 24, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>
              👨‍👩‍👧
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: "#1E293B" }}>1. Espaço das Famílias (Pais)</h3>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Aplicativo leve no celular (PWA) para acompanhamento diário da rotina em tempo real, visualização de fotos, canal de atendimento direto, avisos e relatórios de desenvolvimento.
            </p>
          </div>

          {/* Card 2: Professoras */}
          <div style={{ background: "white", borderRadius: 20, padding: 24, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>
              👩‍🏫
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: "#1E293B" }}>2. Espaço das Professoras (Salas)</h3>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Interface otimizada para toque em <strong>Celular ou Tablet</strong> com registro instantâneo de rotinas (alimentação, fralda, sono e notas pedagógicas). Fricção zero para o corpo docente.
            </p>
          </div>

          {/* Card 3: Diretoria & Coordenação */}
          <div style={{ background: "white", borderRadius: 20, padding: 24, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>
              🏛️
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: "#1E293B" }}>3. Painel de Gestão (Diretoria & Coordenação)</h3>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Visão centralizada da escola no computador, com controle por turmas, diário de classe oficial, homologação pedagógica, controle de estoque e módulo financeiro.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: RECURSOS DO SISTEMA (SEQUÊNCIA ESTRATÉGICA) */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#EA580C", textTransform: "uppercase", letterSpacing: "0.08em" }}>ECOSSISTEMA INTEGRADO</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "4px 0 0" }}>Pilares de Valor Entregues na Plataforma</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Pilar 1: Comunicação */}
          <div style={{ background: "white", borderRadius: 20, padding: 24, border: "1px solid #E2E8F0", display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EA580C", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
              1
            </div>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#1E293B" }}>Comunicação & Atendimento Escola ↔ Família</h3>
              <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 12px", lineHeight: 1.5 }}>
                Agenda digital em tempo real, Mural de Avisos com confirmação de leitura, Calendário Escolar de Eventos e Canal Direto de Atendimento com a Coordenação.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ background: "#FFF7ED", color: "#C2410C", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>📱 Agenda Digital</span>
                <span style={{ background: "#FFF7ED", color: "#C2410C", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>📌 Mural de Avisos</span>
                <span style={{ background: "#FFF7ED", color: "#C2410C", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>💬 Canal de Atendimento</span>
                <span style={{ background: "#FFF7ED", color: "#C2410C", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>📅 Calendário de Eventos</span>
              </div>
            </div>
          </div>

          {/* Pilar 2: Gestão Escolar & Diário Oficial */}
          <div style={{ background: "white", borderRadius: 20, padding: 24, border: "1px solid #E2E8F0", display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#2563EB", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
              2
            </div>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#1E293B" }}>Gestão Escolar & Diário de Classe Oficial</h3>
              <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 12px", lineHeight: 1.5 }}>
                Diário de classe oficial impresso/PDF formatado nos padrões da Educação Infantil Particular (LDB / BNCC), Mural de Alunos por Turma, Alertas Médicos/Saúde e Gestão de Estoque Escolar.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>📖 Diário de Classe Oficial</span>
                <span style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>👥 Mural de Alunos por Turma</span>
                <span style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>🩺 Alertas Médicos & Alergias</span>
                <span style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>👕 Controle de Estoque</span>
              </div>
            </div>
          </div>

          {/* Pilar 3: Financeiro Lite */}
          <div style={{ background: "white", borderRadius: 20, padding: 24, border: "1px solid #E2E8F0", display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#059669", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
              3
            </div>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#1E293B" }}>Módulo Financeiro Lite</h3>
              <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 12px", lineHeight: 1.5 }}>
                Gestão simplificada de mensalidades e cobranças de eventos/extras, envio de comprovantes pelo app do banco e controle centralizado para a secretaria.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ background: "#ECFDF5", color: "#047857", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>💰 Cobranças & Mensalidades</span>
                <span style={{ background: "#ECFDF5", color: "#047857", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>🧾 Envio de Comprovantes</span>
                <span style={{ background: "#ECFDF5", color: "#047857", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>📊 Controle do Caixa</span>
              </div>
            </div>
          </div>

          {/* Pilar 4: GRAND FINALE - Inteligência Pedagógica (Estrelinha) */}
          <div style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FEF3C7 100%)", borderRadius: 20, padding: 24, border: "2px solid #FDBA74", display: "flex", gap: 20, alignItems: "flex-start", boxShadow: "0 4px 20px rgba(249, 115, 22, 0.12)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #EA580C, #D97706)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
              ⭐
            </div>
            <div>
              <div style={{ display: "inline-block", background: "#7C2D12", color: "#FFEDD5", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6, marginBottom: 4, textTransform: "uppercase" }}>
                DESTAQUE & INOVAÇÃO
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: "#7C2D12" }}>
                Inteligência Pedagógica — Assistente Estrelinha ⭐
              </h3>
              <p style={{ color: "#9A3412", fontSize: 14, margin: "0 0 12px", lineHeight: 1.6, fontWeight: 500 }}>
                Transformação automática das dezenas de observações coletadas no dia a dia pela professora em rascunhos completos de relatórios trimestrais de evolução por pilar da BNCC.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ background: "white", color: "#9A3412", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, border: "1px solid #FED7AA" }}>⭐ Assistente de Redação</span>
                <span style={{ background: "white", color: "#9A3412", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, border: "1px solid #FED7AA" }}>⏱️ Economia de centenas de horas</span>
                <span style={{ background: "white", color: "#9A3412", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, border: "1px solid #FED7AA" }}>✅ Homologação pela Coordenação</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: ESTRUTURA DO INVESTIMENTO E VIABILIDADE FINANCEIRA */}
      <section>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#EA580C", textTransform: "uppercase", letterSpacing: "0.08em" }}>PLANEJAMENTO FINANCEIRO 2027</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "4px 0 0" }}>Investimento da Plataforma & Estruturação do Parque de Hardware</h2>
        </div>

        {/* Card Destaque de Preço */}
        <div style={{ background: "white", borderRadius: 20, padding: 28, border: "1px solid #E2E8F0", marginBottom: 24, boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>MODELO DE COMERCIALIZAÇÃO</span>
              <h3 style={{ margin: "4px 0 8px", fontSize: 24, fontWeight: 900, color: "#0F172A" }}>
                R$ 120,00 <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>/ aluno / ano</span>
              </h3>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Financiado pela taxa anual de material/agenda que a escola já cobra na matrícula/rematrícula dos alunos.
              </p>
            </div>
            <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>INVESTIMENTO MÍNIMO DA PLATAFORMA</span>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#EA580C", margin: "4px 0" }}>
                R$ 6.000,00 <span style={{ fontSize: 13, fontWeight: 700, color: "#9A3412" }}>/ ano</span>
              </div>
              <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>
                Garantia mínima contratual cobrindo até 70 alunos (infraestrutura, servidores, IA Estrelinha ⭐ e suporte).
              </p>
            </div>
          </div>
        </div>

        {/* Quadro Comparativo de Etapas */}
        <div style={{ background: "white", borderRadius: 20, padding: 28, border: "1px solid #E2E8F0", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#1E293B" }}>
            📊 Estudo de Reorganização de Recursos (Escola Planeta Colorido)
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {/* Etapa 1: Atual */}
            <div style={{ background: "#F8FAFC", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>1. ESTRUTURA DE CUSTOS ATUAL</span>
              <div style={{ margin: "12px 0", fontSize: 13, color: "#334155", display: "flex", flexDirection: "column", gap: 6 }}>
                <div>• App atual de mercado: <strong>R$ 4.560/ano</strong> (R$ 380/mês)</div>
                <div>• Gráfica (agenda papel): <strong>R$ 4.500/ano</strong> (50 x R$ 90)</div>
                <div style={{ borderTop: "1px solid #CBD5E1", paddingTop: 8, marginTop: 4, color: "#0F172A", fontWeight: 800 }}>
                  Gasto Total Atual: R$ 9.060,00 / ano
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                A taxa de R$ 120 cobria a gráfica e a escola complementava R$ 3.060/ano para manter a operação.
              </p>
            </div>

            {/* Etapa 2: Ano 1 (2027) */}
            <div style={{ background: "#FFF7ED", borderRadius: 16, padding: 20, border: "1px solid #FFEDD5" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#C2410C", textTransform: "uppercase" }}>2. ANO 1 / 2027 (MODERNIZAÇÃO & TABLETS)</span>
              <div style={{ margin: "12px 0", fontSize: 13, color: "#9A3412", display: "flex", flexDirection: "column", gap: 6 }}>
                <div>• Licença Plataforma: <strong>R$ 6.000/ano</strong> (taxa dos pais)</div>
                <div>• Economia App Atual: <strong>R$ 4.560/ano liberados</strong></div>
                <div>📱 <strong>Compra de 5 a 6 Tablets:</strong> ~R$ 3.800 a R$ 4.500</div>
                <div style={{ borderTop: "1px solid #FED7AA", paddingTop: 8, marginTop: 4, color: "#7C2D12", fontWeight: 900 }}>
                  A própria economia paga 100% dos Tablets!
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#9A3412", margin: 0, lineHeight: 1.4 }}>
                A escola equipa 100% das salas com tablets corporativos próprios com investimento mínimo ou nulo da mantenedora.
              </p>
            </div>

            {/* Etapa 3: Ano 2 em diante (2028+) */}
            <div style={{ background: "#ECFDF5", borderRadius: 16, padding: 20, border: "1px solid #A7F3D0" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#047857", textTransform: "uppercase" }}>3. ANO 2 EM DIANTE / 2028+ (RECORRÊNCIA)</span>
              <div style={{ margin: "12px 0", fontSize: 13, color: "#065F46", display: "flex", flexDirection: "column", gap: 6 }}>
                <div>• Licença Plataforma: <strong>R$ 6.000/ano</strong> (100% coberta pelos pais)</div>
                <div>• Custo do App Atual: <strong>R$ 0,00 (Eliminado)</strong></div>
                <div>• Custo de Tablets: <strong>R$ 0,00 (Já Quitados)</strong></div>
                <div style={{ borderTop: "1px solid #A7F3D0", paddingTop: 8, marginTop: 4, color: "#064E3B", fontWeight: 900 }}>
                  Economia Líquida no Caixa: R$ 3.060,00 / ano
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#047857", margin: 0, lineHeight: 1.4 }}>
                Economia real e permanente no caixa da mantenedora, pois o custo da nova plataforma é 100% coberto pela taxa anual já cobrada das famílias.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
