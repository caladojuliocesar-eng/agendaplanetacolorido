"use client";

import { useState } from "react";
import { signInWithGoogle, signInWithEmail } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"select" | "email">("select");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const profile = await signInWithGoogle();
      if (profile) {
        router.replace("/");
      } else {
        setError(
          "Seu email não está cadastrado. Procure a secretaria da escola."
        );
      }
    } catch (err: any) {
      setError("Erro ao fazer login. Tente novamente.");
      console.error(err);
    }
    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const profile = await signInWithEmail(email, password);
      if (profile) {
        router.replace("/");
      } else {
        setError(
          "Seu email não está cadastrado. Procure a secretaria da escola."
        );
      }
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        setError("Email ou senha incorretos.");
      } else if (err.code === "auth/user-not-found") {
        setError("Nenhuma conta encontrada com este email.");
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "32px 24px",
        gap: "32px",
      }}
    >
      {/* Logo Area */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "var(--radius-xl)",
            background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 36,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          📓
        </div>
        <h1
          style={{
            fontSize: 28,
            margin: "0 0 4px",
            background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Agenda Ottomatic
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
          Escola Planeta Colorido
        </p>
      </div>

      {/* Login Card */}
      <div
        className="card"
        style={{ width: "100%", maxWidth: 400, padding: "32px 24px" }}
      >
        {mode === "select" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <button
              className="btn btn--google btn--block btn--lg"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading ? "Entrando..." : "Entrar com Google"}
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span>ou</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <button
              className="btn btn--secondary btn--block"
              onClick={() => setMode("email")}
            >
              Entrar com Email
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleEmailLogin}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <button
              type="button"
              onClick={() => setMode("select")}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 14,
                alignSelf: "flex-start",
                padding: 0,
              }}
            >
              ← Voltar
            </button>

            <input
              type="email"
              className="text-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <input
              type="password"
              className="text-input"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <button
              type="submit"
              className="btn btn--primary btn--block btn--lg"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--danger-light)",
              color: "var(--danger)",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center" }}>
        Acesso restrito a professores e responsáveis cadastrados.
      </p>
    </div>
  );
}
