"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithEmail } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function ShowroomIndex() {
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  const router = useRouter();

  const handleQuickLogin = async (email: string, redirectUrl: string) => {
    setLoggingIn(email);
    try {
      const profile = await signInWithEmail(email, "demo123");
      if (profile) {
        router.push(redirectUrl);
      } else {
        alert("Erro: Perfil não encontrado.");
        setLoggingIn(null);
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro ao entrar: " + err.message);
      setLoggingIn(null);
    }
  };

  return (
    <div style={{ padding: 50, fontFamily: "sans-serif", background: "#f0f0f0", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: 40, color: "#1E293B" }}>Ambiente de Desenvolvimento (UX)</h1>
      
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, color: "#64748B", marginBottom: 16 }}>🧪 Protótipos de IA (Módulos Novos)</h2>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/showroom/professora" style={{ padding: "20px 40px", background: "#6366F1", color: "white", textDecoration: "none", borderRadius: 8, fontSize: 16, fontWeight: "bold" }}>
            👉 UX da Professora (Rotina + Relatórios)
          </Link>
          <Link href="/showroom/diretora" style={{ padding: "20px 40px", background: "#8B5CF6", color: "white", textDecoration: "none", borderRadius: 8, fontSize: 16, fontWeight: "bold" }}>
            👉 UX da Diretoria (Aprovações)
          </Link>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 18, color: "#64748B", marginBottom: 16 }}>📱 App Real (Produção / Banco de Dados)</h2>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <button 
            onClick={() => handleQuickLogin("diretora@demo.com", "/admin")} 
            disabled={loggingIn !== null}
            style={{ padding: "20px 40px", background: "#F97316", color: "white", border: "none", cursor: "pointer", borderRadius: 8, fontSize: 16, fontWeight: "bold" }}
          >
            {loggingIn === "diretora@demo.com" ? "Entrando..." : "👉 UX da Diretoria (Dashboard ADM)"}
          </button>

          <button 
            onClick={() => handleQuickLogin("pai@demo.com", "/pais/agenda")} 
            disabled={loggingIn !== null}
            style={{ padding: "20px 40px", background: "#10B981", color: "white", border: "none", cursor: "pointer", borderRadius: 8, fontSize: 16, fontWeight: "bold" }}
          >
            {loggingIn === "pai@demo.com" ? "Entrando..." : "👉 UX dos Pais (Agenda Diária)"}
          </button>
        </div>
      </div>
      
      <p style={{ marginTop: 40, color: "#64748B", fontSize: 14 }}>
        <strong>Nota:</strong> Os botões do App Real fazem o login em segundo plano (senha bypass) e redirecionam para o painel oficial.
      </p>
    </div>
  );
}
