"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BottomNav from "@/components/BottomNav";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading, logout } = useAuth();
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
    <div className="app-shell" style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: "#F8FAFC" }}>
      {/* Header */}
      <header className="app-header" style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", padding: "12px 16px" }}>
        <div
          className="container"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img 
                src="/images/logo.png" 
                alt="" 
                style={{ height: 32, width: "auto", background: "white", borderRadius: 6, padding: 2 }}
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <h1 style={{ fontSize: 16, color: "white", margin: 0, fontWeight: 700 }}>
                Planeta Colorido
              </h1>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
               <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "white", opacity: 0.9 }}>
                  <span className={`sync-dot ${isOnline ? "sync-dot--online" : "sync-dot--offline"}`} />
                  {isOnline ? "ON" : "OFF"}
               </div>
               <button 
                  onClick={() => logout().then(() => router.push("/"))}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Sair
                </button>
            </div>
          </div>
          
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 4 }}>
            <p style={{ fontSize: 12, color: "white", margin: 0, opacity: 0.9 }}>
              {profile.turma} · Prof. {profile.nome.split(" ")[0]} 👩‍🏫
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: "16px 16px 100px" }}>{children}</main>

      <BottomNav role="professor" />
    </div>
  );
}
