"use client";

import Link from "next/link";

export default function ShowroomIndex() {
  return (
    <div style={{ padding: 50, fontFamily: "sans-serif", background: "#f0f0f0", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: 40 }}>Ambiente de Desenvolvimento (UX)</h1>
      
      <div style={{ display: "flex", gap: 20 }}>
        <Link href="/showroom/professora" style={{ padding: "20px 40px", background: "#6366F1", color: "white", textDecoration: "none", borderRadius: 8, fontSize: 18, fontWeight: "bold" }}>
          👉 UX da Professora
        </Link>

        <Link href="/showroom/diretora" style={{ padding: "20px 40px", background: "#F97316", color: "white", textDecoration: "none", borderRadius: 8, fontSize: 18, fontWeight: "bold" }}>
          👉 UX da Diretoria
        </Link>
      </div>
      
      <p style={{ marginTop: 40, color: "#666" }}>
        Estes links levam diretamente para o código das interfaces limpas, sem catracas de login ou regras do banco.
      </p>
    </div>
  );
}
