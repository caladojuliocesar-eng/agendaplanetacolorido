"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { profile, loading, unauthorized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!profile && !unauthorized) {
      router.replace("/login");
      return;
    }

    if (unauthorized) {
      return; // Show unauthorized screen
    }

    // Redirect based on role
    switch (profile?.role) {
      case "professor":
        router.replace("/professor/dashboard");
        break;
      case "pai":
        router.replace("/pais/agenda");
        break;
      case "admin":
        router.replace("/professor/dashboard");
        break;
      default:
        router.replace("/login");
    }
  }, [profile, loading, unauthorized, router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div className="spinner" />
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Carregando...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          flexDirection: "column",
          gap: "20px",
          padding: "32px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 64 }}>🔒</div>
        <h1 style={{ fontSize: 24, margin: 0 }}>Acesso Não Autorizado</h1>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Seu email não está cadastrado no sistema.
          <br />
          Procure a secretaria da escola para solicitar acesso.
        </p>
        <button
          className="btn btn--secondary btn--block"
          onClick={() => {
            const { logout } = useAuth();
            logout();
            router.replace("/login");
          }}
        >
          Voltar ao Login
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
      }}
    >
      <div className="spinner" />
    </div>
  );
}
