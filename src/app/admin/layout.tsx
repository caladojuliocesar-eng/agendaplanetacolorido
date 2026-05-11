"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!profile || profile.role !== "admin")) {
      router.replace("/");
    }
  }, [profile, loading, router]);

  if (loading || !profile) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
        <div className="spinner" />
      </div>
    );
  }

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/monitor", label: "Monitor", icon: "🖥️" },
    { href: "/admin/aprovacoes", label: "Aprovações", icon: "✅" },
    { href: "/admin/mural", label: "Mural", icon: "📌" },
    { href: "/admin/eventos", label: "Eventos", icon: "📅" },
    { href: "/admin/financeiro", label: "Financeiro", icon: "💰" },
    { href: "/admin/alunos", label: "Alunos", icon: "👶" },
    { href: "/admin/usuarios", label: "Usuários", icon: "👥" },
    { href: "/admin/turmas", label: "Turmas", icon: "🏫" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#F8FAFC" }}>
      {/* Sidebar - Desktop focus */}
      <aside style={{
        width: 260,
        background: "white",
        borderRight: "1px solid #E2E8F0",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "100dvh",
        zIndex: 50
      }}>
        <div style={{ padding: "24px", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "var(--primary)", borderRadius: 8 }}></div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: 0 }}>Painel Admin</h1>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    textDecoration: "none",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    color: isActive ? "var(--primary)" : "#64748B",
                    background: isActive ? "var(--primary-light)" : "transparent",
                    transition: "all 0.2s"
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div style={{ padding: "16px", borderTop: "1px solid #F1F5F9" }}>
          <div style={{ marginBottom: 12, padding: "0 8px" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{profile.nome}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#64748B" }}>{profile.email}</p>
          </div>
          <button
            onClick={() => logout().then(() => router.push("/"))}
            style={{
              width: "100%",
              padding: "10px",
              background: "#F1F5F9",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#EF4444",
              cursor: "pointer"
            }}
          >
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 260, padding: "32px", overflowX: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
