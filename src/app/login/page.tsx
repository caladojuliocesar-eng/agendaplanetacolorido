"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  signInWithGoogle,
  signInWithIdentifier,
  getVirtualEmailForCPF,
  resolveUserProfile,
} from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

function LoginContent() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { user } = useAuth();

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get("error") === "no_profile") {
      setError("Seu cadastro não foi encontrado ou o Firebase bloqueou a busca. O login falhou.");
    }
  }, [searchParams]);

  // If already logged in, go to home
  if (user) {
    router.push("/");
    return null;
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await signInWithGoogle();
      if (!profile) {
        setError("Email do Google não pré-cadastrado na escola. Entre em contato com a administração.");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(`Erro do Google: ${err.message || "Falha ao conectar"}`);
      console.error("Google Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanId = identifier.trim();

    try {
      if (isRegistering) {
        // Primeiro acesso: exige CPF com 11 dígitos
        const cleanCpf = cleanId.replace(/\D/g, "");
        if (cleanCpf.length !== 11) {
          setError("Para o primeiro acesso, digite o CPF com 11 dígitos.");
          setLoading(false);
          return;
        }

        const virtualEmail = getVirtualEmailForCPF(cleanCpf);
        const userCredential = await createUserWithEmailAndPassword(auth(), virtualEmail, password);
        const profile = await resolveUserProfile(userCredential.user);

        if (!profile) {
          setError("Sua conta foi criada, mas seu CPF não foi encontrado no pré-cadastro da escola.");
        } else {
          router.push("/");
        }
      } else {
        // Login direto unificado (Nome da Criança, CPF ou E-mail)
        const profile = await signInWithIdentifier(cleanId, password);
        if (!profile) {
          setError("Usuário não cadastrado ou senha incorreta.");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        try {
          const profile = await signInWithIdentifier(cleanId, password);
          if (!profile) {
            setError("Este cadastro já possui senha. A senha digitada está incorreta.");
          } else {
            router.push("/");
          }
        } catch (loginErr: any) {
          setError("Este usuário já possui cadastro, mas a senha está incorreta. Verifique sua senha.");
        }
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Senha incorreta. Verifique se digitou certinho.");
      } else if (err.code === "auth/user-not-found") {
        setError("Cadastro não encontrado. Verifique se o nome ou CPF foi digitado corretamente.");
      } else {
        setError(err.message || "Erro ao conectar. Tente novamente.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF7ED] p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-[#FED7AA]">
        <div className="flex items-center justify-between mb-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-1 text-xs text-[#9A3412] hover:text-[#EA580C] font-semibold transition-colors"
          >
            ← Boas-vindas e instruções
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="https://agenda-ottomatic.vercel.app/images/logo.png" 
              className="h-20 w-auto object-contain" 
              alt="Logo Creche do Papai" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-[#431407]">Agenda Creche do Papai</h1>
          <p className="text-[#9A3412]">Tudo o que acontece no dia do seu filho</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleLoginAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#431407] mb-1">
              {isRegistering ? "CPF (11 dígitos)" : "Nome do Filho(a) ou CPF"}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-[#FED7AA] focus:border-[#F97316] focus:outline-none bg-[#FFF7ED]/30 text-lg font-medium text-[#431407]"
              placeholder={isRegistering ? "000.000.000-00" : "Ex: Otto ou seu CPF"}
              autoCapitalize="words"
              autoCorrect="off"
            />
            {!isRegistering && (
              <span className="text-[11px] text-[#D97706] mt-1 block">
                💡 Mães no teste: basta digitar o primeiro nome do seu filho(a)
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#431407] mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-[#FED7AA] focus:border-[#F97316] focus:outline-none bg-[#FFF7ED]/30 text-lg"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F97316] text-white font-bold py-4 px-6 rounded-2xl hover:bg-[#EA580C] transition-all shadow-lg shadow-orange-200 disabled:opacity-50 text-lg cursor-pointer"
          >
            {loading ? "Acessando..." : isRegistering ? "Cadastrar Senha" : "Entrar na Agenda"}
          </button>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-xs text-[#F97316] hover:underline text-center"
            >
              {isRegistering ? "Já tem cadastro? Entrar com nome ou CPF" : "Primeiro acesso oficial com CPF? Cadastre sua senha"}
            </button>
          </div>
        </form>

        <div className="relative py-4 my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#FED7AA]"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-[#D97706] font-medium">ou</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#FED7AA] text-[#431407] font-semibold py-3 px-6 rounded-2xl hover:bg-[#FFF7ED] transition-all disabled:opacity-50 text-sm shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          {loading ? "Entrando..." : "Entrar com Google"}
        </button>

        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-center text-xs text-[#D97706]">
            Acesso exclusivo para famílias e equipe da Creche do Papai.
          </p>
          <a 
            href="/apresentacao-edtech" 
            className="text-[10px] text-gray-400 hover:text-[#F97316] transition-colors"
          >
            Apresentação Institucional EdTech
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7ED]">
        <div className="spinner"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
