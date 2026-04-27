"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!profile || profile.role !== "pai")) {
      router.replace("/");
    }
  }, [profile, loading, router]);

  if (loading || !profile) {
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

  return (
    <div>
      {/* Header */}
      <header
        className="app-header"
        style={{
          background: "linear-gradient(135deg, #F97316, #EA580C)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1 style={{ fontSize: 20, margin: 0, fontWeight: 700 }}>
              📓 Agenda Ottomatic
            </h1>
            <p
              style={{
                fontSize: 13,
                margin: 0,
                opacity: 0.8,
                marginTop: 2,
              }}
            >
              Olá, {profile.nome.split(" ")[0]}! 👋
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "white",
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: "16px 16px 100px" }}>{children}</main>
    </div>
  );
}
