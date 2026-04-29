"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getAllStudents, getAllUsers } from "@/lib/firestore";
import { Student, UserProfile } from "@/types";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, parents: 0, teachers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.escolaId) {
      setLoading(false);
      return;
    }

    async function loadStats() {
      try {
        const [students, users] = await Promise.all([
          getAllStudents(profile!.escolaId),
          getAllUsers(profile!.escolaId),
        ]);

        setStats({
          students: students.length,
          parents: users.filter(u => u.role === "pai").length,
          teachers: users.filter(u => u.role === "professor").length,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [profile]);

  if (loading) return <div className="spinner" />;

  const statCards = [
    { label: "Total de Alunos", value: stats.students, icon: "👶", color: "#3B82F6" },
    { label: "Pais Cadastrados", value: stats.parents, icon: "👪", color: "#10B981" },
    { label: "Professores", value: stats.teachers, icon: "👩‍🏫", color: "#F59E0B" },
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

      <div className="card" style={{ padding: 32, background: "linear-gradient(135deg, #F97316, #EA580C)", color: "white" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: 20, fontWeight: 700 }}>Dica de Gestão</h2>
        <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.6, maxWidth: 600 }}>
          Você pode gerenciar as turmas e alunos usando os links na barra lateral. 
          Lembre-se que bebes nascem o ano todo, então mantenha o cadastro de alunos sempre atualizado! 😉
        </p>
      </div>
    </div>
  );
}
