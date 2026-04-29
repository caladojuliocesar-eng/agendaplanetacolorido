"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  role: "pai" | "professor";
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();

  const links =
    role === "pai"
      ? [
          { href: "/pais/agenda", label: "Agenda", icon: "📅" },
          { href: "/pais/financeiro", label: "Financeiro", icon: "💰" },
          { href: "/pais/escola", label: "Escola", icon: "🏫" },
        ]
      : [
          { href: "/professor/dashboard", label: "Turma", icon: "👥" },
          { href: "/professor/escola", label: "Escola", icon: "🏫" },
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
            >
              <span className="bottom-nav__icon">{link.icon}</span>
              <span className="bottom-nav__label">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
