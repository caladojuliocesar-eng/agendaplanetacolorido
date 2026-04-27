"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();
  const isOnline = useOnlineStatus();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!profile || profile.role === "pai")) {
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
      <header className="app-header">
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
              {profile.turma || "Todas as turmas"} · {profile.nome}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 12,
                opacity: 0.9,
              }}
            >
              <span
                className={`sync-dot ${
                  isOnline ? "sync-dot--online" : "sync-dot--offline"
                }`}
              />
              {isOnline ? "Sincronizado" : "Offline"}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: "16px 16px 100px" }}>{children}</main>
    </div>
  );
}
