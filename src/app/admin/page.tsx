"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getAllStudents, getAllUsers, getAvisos, getEventos } from "@/lib/firestore";
import { Student, UserProfile, Aviso, Evento } from "@/types";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, parents: 0, teachers: 0 });
  const [recentAvisos, setRecentAvisos] = useState<Aviso[]>([]);
  const [upcomingEventos, setUpcomingEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.escolaId) {
      setLoading(false);
      return;
    }

    async function loadDashboardData() {
      try {
        const [students, users, avisos, eventos] = await Promise.all([
          getAllStudents(profile!.escolaId),
          getAllUsers(profile!.escolaId),
          getAvisos(profile!.escolaId),
          getEventos(profile!.escolaId),
        ]);

        setStats({
          students: students.length,
          parents: users.filter(u => u.role === "pai").length,
          teachers: users.filter(u => u.role === "professor").length,
        });

        setRecentAvisos(avisos.slice(0, 3));
        
        const futureEventos = eventos
          .filter(e => new Date(e.data) >= new Date(new Date().setHours(0,0,0,0)))
          .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
        setUpcomingEventos(futureEventos.slice(0, 3));

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

  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 8px 0" }}>Olá, {profile?.nome}! 👋</h1>
        <p style={{ color: "#64748B", margin: 0 }}>Bem-vindo ao centro de comando da sua escola.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 48 }}>
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

      <div className="card" style={{ padding: 32, background: "linear-gradient(135deg, #F97316, #EA580C)", color: "white" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: 20, fontWeight: 700 }}>Dica de Gestão</h2>
        <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.6, maxWidth: 600 }}>
          O Monitor de Salas está com as novas colunas de Lanche e Jantar ativas! 
          Acompanhe o preenchimento diário para garantir que todos os pais recebam as informações em tempo real. 😉
        </p>
      </div>
    </div>
  );
}
