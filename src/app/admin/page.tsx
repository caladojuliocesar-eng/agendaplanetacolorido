"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { 
  getAllStudents, 
  getAllUsers, 
  getAvisos, 
  getEventos,
  getMatriculaSolicitudes,
  getCoordinationChatsByEscola,
  getCobrancasByEscola,
  getUniformItems,
  getEscolaRecordsForDate,
  getTodayDateString
} from "@/lib/firestore";
import { Student, UserProfile, Aviso, Evento, DailyRecord } from "@/types";
import Link from "next/link";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, parents: 0, teachers: 0 });
  const [recentAvisos, setRecentAvisos] = useState<Aviso[]>([]);
  const [upcomingEventos, setUpcomingEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  // Operational metrics states
  const [pendingMatriculas, setPendingMatriculas] = useState(0);
  const [pendingComprovantes, setPendingComprovantes] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [criticalStock, setCriticalStock] = useState(0);
  const [attendance, setAttendance] = useState({ presentes: 0, ausentes: 0, naoInformados: 0 });
  const [healthAlerts, setHealthAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.escolaId) {
      setLoading(false);
      return;
    }

    async function loadDashboardData() {
      try {
        const todayStr = getTodayDateString();
        const [
          studentsData, 
          usersData, 
          avisosData, 
          eventosData,
          solicitudesData,
          chatsData,
          cobrancasData,
          uniformsData,
          recordsData
        ] = await Promise.all([
          getAllStudents(profile!.escolaId!),
          getAllUsers(profile!.escolaId!),
          getAvisos(profile!.escolaId!),
          getEventos(profile!.escolaId!),
          getMatriculaSolicitudes(profile!.escolaId!),
          getCoordinationChatsByEscola(profile!.escolaId!),
          getCobrancasByEscola(profile!.escolaId!),
          getUniformItems(profile!.escolaId!),
          getEscolaRecordsForDate(profile!.escolaId!, todayStr)
        ]);

        // Basic Stats
        setStats({
          students: studentsData.length,
          parents: usersData.filter(u => u.role === "pai").length,
          teachers: usersData.filter(u => u.role === "professor").length,
        });

        // Recent Avisos & Eventos
        setRecentAvisos(avisosData.slice(0, 3));
        const futureEventos = eventosData
          .filter(e => new Date(e.data) >= new Date(new Date().setHours(0,0,0,0)))
          .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
        setUpcomingEventos(futureEventos.slice(0, 3));

        // Pending Actions Counts
        setPendingMatriculas(solicitudesData.filter(s => s.status === "pendente").length);
        setPendingComprovantes(cobrancasData.filter(c => c.urlComprovante && c.status !== 'pago').length);
        setUnreadChats(chatsData.filter(c => !c.lidaCoordenacao).length);
        setCriticalStock(uniformsData.filter(item => item.quantidade <= item.estoqueMinimo).length);

        // Today's Attendance Calculations
        const activeStudents = studentsData;
        const recordsMap = new Map(recordsData.map(r => [r.alunoId, r]));

        let presentes = 0;
        let ausentes = 0;
        let naoInformados = 0;

        const alerts: any[] = [];

        activeStudents.forEach(student => {
          const rec = recordsMap.get(student.id);
          if (rec) {
            if (rec.ausente) {
              ausentes++;
            } else {
              presentes++;
              // If present, check for health alerts
              if (student.alergias?.trim() || student.restricoesAlimentares?.trim() || student.medicamentosContinuos?.trim()) {
                alerts.push({
                  student,
                  alergias: student.alergias,
                  restricoes: student.restricoesAlimentares,
                  medicamentos: student.medicamentosContinuos
                });
              }
            }
          } else {
            naoInformados++;
          }
        });

        setAttendance({ presentes, ausentes, naoInformados });
        setHealthAlerts(alerts);

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [profile]);

  if (loading) return <div className="spinner" />;

  const statCards = [
    { label: "Total de Alunos", value: stats.students, icon: "👶", color: "#3B82F6" },
    { label: "Famílias (Responsáveis)", value: stats.parents, icon: "👪", color: "#10B981" },
    { label: "Equipe Pedagógica", value: stats.teachers, icon: "👩‍🏫", color: "#F59E0B" },
  ];

  const totalActionCount = pendingMatriculas + pendingComprovantes + unreadChats + criticalStock;

  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 8px 0" }}>Olá, {profile?.nome}! 👋</h1>
        <p style={{ color: "#64748B", margin: 0 }}>Bem-vindo ao centro de comando operacional da sua escola.</p>
      </header>

      {/* 1. SEÇÃO DE ALERTA DE AÇÕES PENDENTES */}
      <div className="card" style={{ padding: 24, marginBottom: 32, background: "white", border: totalActionCount > 0 ? "1px solid #FFE4E6" : "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            ⚡ Centro de Ações Urgentes
          </h2>
          {totalActionCount > 0 ? (
            <span style={{ padding: "4px 10px", background: "#FEE2E2", color: "#EF4444", borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
              {totalActionCount} Pendência(s)
            </span>
          ) : (
            <span style={{ padding: "4px 10px", background: "#D1FAE5", color: "#065F46", borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
              ✓ Tudo em Dia
            </span>
          )}
        </div>

        {totalActionCount === 0 ? (
          <p style={{ color: "#64748B", margin: 0, fontSize: 14 }}>Parabéns! Nenhuma pendência ou ação operacional requer atenção imediata no momento.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {pendingMatriculas > 0 && (
              <div style={{ padding: 16, background: "#FFFBEB", border: "1px solid #FEF3C7", borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#D97706", display: "block", marginBottom: 4 }}>📝 MATRÍCULAS PENDENTES</span>
                  <strong style={{ fontSize: 20, color: "#78350F" }}>{pendingMatriculas} ficha(s)</strong>
                </div>
                <Link href="/admin/alunos" style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Revisar em Alunos ➔
                </Link>
              </div>
            )}

            {pendingComprovantes > 0 && (
              <div style={{ padding: 16, background: "#EFF6FF", border: "1px solid #DBEAFE", borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#2563EB", display: "block", marginBottom: 4 }}>💰 PAGAMENTOS A VALIDAR</span>
                  <strong style={{ fontSize: 20, color: "#1E3A8A" }}>{pendingComprovantes} comprovante(s)</strong>
                </div>
                <Link href="/admin/financeiro" style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Ver Financeiro ➔
                </Link>
              </div>
            )}

            {unreadChats > 0 && (
              <div style={{ padding: 16, background: "#ECFDF5", border: "1px solid #D1FAE5", borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#059669", display: "block", marginBottom: 4 }}>💬 CHATS DA COORDENAÇÃO</span>
                  <strong style={{ fontSize: 20, color: "#064E3B" }}>{unreadChats} sem resposta</strong>
                </div>
                <Link href="/admin/atendimento" style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Responder Pais ➔
                </Link>
              </div>
            )}

            {criticalStock > 0 && (
              <div style={{ padding: 16, background: "#FFF1F2", border: "1px solid #FFE4E6", borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#E11D48", display: "block", marginBottom: 4 }}>👕 ESTOQUE CRÍTICO</span>
                  <strong style={{ fontSize: 20, color: "#881337" }}>{criticalStock} item(ns) baixo</strong>
                </div>
                <Link href="/admin/estoque" style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Ver Estoque ➔
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. LINHA DE OPERAÇÃO: FREQUÊNCIA DO DIA & ALERTA DE SAÚDE */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32, flexWrap: "wrap" }}>
        
        {/* Frequência do Dia */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: 0 }}>📊 Chamada / Presença Hoje</h2>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 13, color: "#64748B", display: "block" }}>Presentes Hoje</span>
              <strong style={{ fontSize: 28, color: "#1E293B" }}>
                {attendance.presentes} <span style={{ fontSize: 14, fontWeight: 500, color: "#64748B" }}>/ {stats.students} alunos</span>
              </strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 13, color: "#64748B", display: "block" }}>Taxa de Presença</span>
              <strong style={{ fontSize: 28, color: "#10B981" }}>
                {stats.students > 0 ? Math.round((attendance.presentes / stats.students) * 100) : 0}%
              </strong>
            </div>
          </div>

          <div style={{ display: "flex", height: 16, background: "#E2E8F0", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ width: `${stats.students > 0 ? (attendance.presentes / stats.students) * 100 : 0}%`, background: "#10B981" }} title="Presentes" />
            <div style={{ width: `${stats.students > 0 ? (attendance.ausentes / stats.students) * 100 : 0}%`, background: "#EF4444" }} title="Ausentes" />
            <div style={{ width: `${stats.students > 0 ? (attendance.naoInformados / stats.students) * 100 : 0}%`, background: "#94A3B8" }} title="Não informados" />
          </div>

          <div style={{ display: "flex", gap: 16, fontSize: 12, fontWeight: 700 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#059669" }}>
              <span style={{ width: 8, height: 8, background: "#10B981", borderRadius: "50%" }} /> {attendance.presentes} Presentes
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#DC2626" }}>
              <span style={{ width: 8, height: 8, background: "#EF4444", borderRadius: "50%" }} /> {attendance.ausentes} Ausentes
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569" }}>
              <span style={{ width: 8, height: 8, background: "#94A3B8", borderRadius: "50%" }} /> {attendance.naoInformados} Não Informados
            </span>
          </div>
        </div>

        {/* Alertas de Alergia/Saúde do Dia */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            🍏 Segurança & Saúde (Presentes Hoje)
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 180, overflowY: "auto" }}>
            {healthAlerts.length === 0 ? (
              <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Nenhum aluno com alergias ou restrições alimentares registrado como presente hoje.</p>
            ) : (
              healthAlerts.map(({ student, alergias, restricoes, medicamentos }) => (
                <div key={student.id} style={{ padding: 12, background: "#FFF7ED", border: "1px solid #FFEDD5", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <strong style={{ fontSize: 13, color: "#431407" }}>{student.nome}</strong>
                    <span style={{ fontSize: 11, background: "#FFEDD5", padding: "2px 6px", borderRadius: 6, fontWeight: 700, color: "#B45309" }}>
                      {student.turma}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#7C2D12" }}>
                    {alergias?.trim() && <div>• <strong>Alergia:</strong> {alergias}</div>}
                    {restricoes?.trim() && <div>• <strong>Restrição:</strong> {restricoes}</div>}
                    {medicamentos?.trim() && <div>• <strong>Med. Contínuo:</strong> {medicamentos}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. CARD DE CONTADORES GERAIS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 32 }}>
        {statCards.map((card) => (
          <div key={card.label} className="card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{
              width: 56,
              height: 56,
              background: `${card.color}15`,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28
            }}>
              {card.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, color: "#64748B", fontWeight: 600 }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#1E293B" }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. MURAL RECENTE E PRÓXIMOS EVENTOS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 48 }}>
        {/* Recent Notices */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1E293B", margin: 0 }}>Mural Recente</h2>
            <span style={{ fontSize: 12, color: "#F97316", fontWeight: 700 }}>VER TUDO</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {recentAvisos.length === 0 ? (
              <p style={{ color: "#64748B", fontSize: 14 }}>Nenhum aviso postado.</p>
            ) : (
              recentAvisos.map(aviso => (
                <div key={aviso.id} style={{ padding: "12px", background: "#F8FAFC", borderRadius: 12, borderLeft: `4px solid ${aviso.tipo === 'urgente' ? '#EF4444' : '#F97316'}` }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{aviso.titulo}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{aviso.mensagem}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1E293B", margin: 0 }}>Próximos Eventos</h2>
            <span style={{ fontSize: 12, color: "#F97316", fontWeight: 700 }}>CALENDÁRIO</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {upcomingEventos.length === 0 ? (
              <p style={{ color: "#64748B", fontSize: 14 }}>Nenhum evento agendado.</p>
            ) : (
              upcomingEventos.map(evento => {
                const data = new Date(evento.data + 'T12:00:00');
                const dia = data.getDate();
                const mes = data.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
                
                return (
                  <div key={evento.id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 48, height: 48, background: "#FFF7ED", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #FFEDD5" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#F97316" }}>{mes}</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#431407" }}>{dia}</span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{evento.titulo}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>Hoje</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
