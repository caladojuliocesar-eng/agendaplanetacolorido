"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        flexDirection: "column",
        gap: 16,
        padding: 32,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 64 }}>📶</div>
      <h1 style={{ fontSize: 24, margin: 0 }}>Sem Conexão</h1>
      <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
        Parece que você está sem internet.
        <br />
        Seus dados salvos estão seguros e serão sincronizados automaticamente
        quando a conexão voltar.
      </p>
      <button
        className="btn btn--primary"
        onClick={() => window.location.reload()}
      >
        Tentar Novamente
      </button>
    </div>
  );
}
