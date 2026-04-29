"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAvisos, getCobrancasByAluno, getTurmaRecords, getTodayDateString } from "@/lib/firestore";

interface BottomNavProps {
  role: "pai" | "professor";
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState({
    agenda: false,
    financeiro: false,
    escola: false
  });

  useEffect(() => {
    if (role !== "pai" || !profile?.filhos || profile.filhos.length === 0) return;

    async function checkNotifications() {
      try {
        const today = getTodayDateString();
        
        // 1. Check Agenda (Unread teacher messages)
        let hasUnreadAgenda = false;
        for (const filhoId of profile!.filhos!) {
          // Check last 2 days to be sure
          const date = new Date();
          for (let i = 0; i < 2; i++) {
            const dateStr = new Date(date.getTime() - i * 86400000).toISOString().split('T')[0];
            const records = await getTurmaRecords(profile!.escolaId!, "", dateStr); // This is inefficient, but we'll optimize later
            const myRecord = records.find(r => r.alunoId === filhoId);
            if (myRecord?.mensagensProfessor?.some(m => !m.lida)) {
              hasUnreadAgenda = true;
              break;
            }
          }
          if (hasUnreadAgenda) break;
        }

        // 2. Check Financeiro (Pending/Overdue)
        let hasPendingFinanceiro = false;
        for (const filhoId of profile!.filhos!) {
          const cobrancas = await getCobrancasByAluno(filhoId);
          if (cobrancas.some(c => c.status === 'pendente' || c.status === 'atrasado')) {
            hasPendingFinanceiro = true;
            break;
          }
        }

        // 3. Check Mural (New notices today)
        const avisos = await getAvisos(profile!.escolaId!);
        const hasNewAvisos = avisos.some(a => {
          const criado = new Date(a.criadoEm);
          const hoje = new Date();
          return criado.getDate() === hoje.getDate() && criado.getMonth() === hoje.getMonth();
        });

        setNotifications({
          agenda: hasUnreadAgenda,
          financeiro: hasPendingFinanceiro,
          escola: hasNewAvisos
        });
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [role, profile]);

  const links =
    role === "pai"
      ? [
          { href: "/pais/agenda", label: "Agenda", icon: "📅", badge: notifications.agenda },
          { href: "/pais/financeiro", label: "Financeiro", icon: "💰", badge: notifications.financeiro },
          { href: "/pais/escola", label: "Escola", icon: "🏫", badge: notifications.escola },
        ]
      : [
          { href: "/professor/dashboard", label: "Turma", icon: "👥", badge: false },
          { href: "/professor/escola", label: "Escola", icon: "🏫", badge: false },
        ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__container">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`bottom-nav__item ${
                isActive ? "bottom-nav__item--active" : ""
              }`}
              style={{ position: "relative" }}
            >
              <span className="bottom-nav__icon">
                {link.icon}
                {link.badge && (
                  <span style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    background: "#EF4444",
                    borderRadius: "50%",
                    border: "2px solid white",
                    boxShadow: "0 0 0 1px rgba(239, 68, 68, 0.2)"
                  }} />
                )}
              </span>
              <span className="bottom-nav__label">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
