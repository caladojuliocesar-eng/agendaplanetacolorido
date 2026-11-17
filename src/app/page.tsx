"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function RootPage() {
  const { user, loading, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === "admin") {
        router.push("/admin");
      } else if (profile.role === "professor") {
        router.push("/professor/dashboard");
      } else {
        router.push("/pais/agenda");
      }
    }
  }, [user, loading, profile, router]);

  if (loading || (user && profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7ED]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]"></div>
          <p className="text-[#9A3412] font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF7ED] text-[#431407] py-8 px-4 flex flex-col items-center justify-center selection:bg-orange-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-[#FED7AA] p-6 sm:p-10 my-4">
        
        {/* Header com Logo e Apresentação */}
        <div className="text-center mb-8">
          <div className="inline-block p-2 bg-gradient-to-br from-orange-100 to-amber-50 rounded-3xl shadow-md border border-orange-200 mb-4">
            <img 
              src="/icons/icon-192x192.png" 
              alt="Logo Creche do Papai" 
              className="w-20 h-20 rounded-2xl object-contain shadow-sm"
            />
          </div>
          
          <div className="inline-block px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold tracking-wide uppercase mb-3">
            ✨ Protótipo Experimental • Demonstração
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#431407] tracking-tight">
            Creche do Papai
          </h1>
          <p className="text-[#9A3412] font-medium text-base sm:text-lg mt-2">
            Um novo olhar para a comunicação e a rotina do seu filho
          </p>
        </div>

        {/* Mensagem de Boas-Vindas */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100 mb-6 text-sm text-[#7C2D12] leading-relaxed">
          <p className="font-semibold text-base text-[#9A3412] mb-1">
            Olá, família! Que alegria ter você aqui com a gente. 💛
          </p>
          <p>
            Você foi convidada para experimentar em primeira mão um aplicativo desenhado para trazer mais carinho, clareza e tranquilidade ao dia a dia da creche.
          </p>
        </div>

        {/* 4 Cards de Instrução e Alinhamento */}
        <div className="space-y-3 mb-8">
          <h2 className="text-sm font-bold text-[#9A3412] uppercase tracking-wider mb-2">
            📌 O que você precisa saber sobre este teste:
          </h2>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FFFBF7] border border-[#FED7AA]/60 hover:border-orange-300 transition-all">
            <span className="text-2xl shrink-0">📖</span>
            <div>
              <h3 className="font-bold text-sm text-[#431407]">Como a agenda de papel, só que inteligente</h3>
              <p className="text-xs text-[#7C2D12] mt-0.5 leading-relaxed">
                A proposta é substituir o antigo caderninho de recados por uma experiência digital: acompanhe alimentação, soninho, trocas de fralda e recados com rapidez e afeto.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FFFBF7] border border-[#FED7AA]/60 hover:border-orange-300 transition-all">
            <span className="text-2xl shrink-0">🧪</span>
            <div>
              <h3 className="font-bold text-sm text-[#431407]">Dados simulados para demonstração</h3>
              <p className="text-xs text-[#7C2D12] mt-0.5 leading-relaxed">
                Os registros diários, horários e anotações apresentados nesta fase são fictícios, criados exclusivamente para você vivenciar a experiência completa do sistema.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FFFBF7] border border-[#FED7AA]/60 hover:border-orange-300 transition-all">
            <span className="text-2xl shrink-0">🎈</span>
            <div>
              <h3 className="font-bold text-sm text-[#431407]">Fique à vontade para explorar tudo</h3>
              <p className="text-xs text-[#7C2D12] mt-0.5 leading-relaxed">
                Navegue pelas abas, veja o histórico de dias anteriores, explore os momentos e fotos, e teste o envio de recados para a professora.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80">
            <span className="text-2xl shrink-0">🛡️</span>
            <div>
              <h3 className="font-bold text-sm text-[#92400E]">Projeto independente de inovação</h3>
              <p className="text-xs text-[#B45309] mt-0.5 leading-relaxed">
                Este é um laboratório de tecnologia educacional desenvolvido de forma independente para avaliação de usabilidade com famílias parceiras, sem qualquer vínculo institucional ou oficial com a escola.
              </p>
            </div>
          </div>
        </div>

        {/* Guia Rápido de Instalação (PWA) */}
        <div className="bg-[#FFF7ED] rounded-2xl p-5 border border-[#FED7AA] mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📲</span>
            <h3 className="font-bold text-sm text-[#431407]">Instale como aplicativo no seu celular</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#7C2D12]">
            <div className="p-3 bg-white rounded-xl border border-orange-100 shadow-2xs">
              <span className="font-bold text-[#EA580C] block mb-1">🍏 No iPhone (Safari):</span>
              Toque no botão de compartilhar <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-[11px] font-mono">⎋</span> na barra inferior e selecione <strong>&ldquo;Adicionar à Tela de Início&rdquo;</strong>.
            </div>
            <div className="p-3 bg-white rounded-xl border border-orange-100 shadow-2xs">
              <span className="font-bold text-[#EA580C] block mb-1">🤖 No Android (Chrome):</span>
              Toque nos três pontinhos <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-[11px] font-mono">⋮</span> no topo e selecione <strong>&ldquo;Instalar aplicativo&rdquo;</strong> ou <strong>&ldquo;Adicionar à tela inicial&rdquo;</strong>.
            </div>
          </div>
        </div>

        {/* Botão Principal de Ação */}
        <div className="space-y-3 text-center">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#F97316] text-white font-bold py-4 px-8 rounded-2xl hover:bg-[#EA580C] transition-all shadow-lg shadow-orange-200 text-lg cursor-pointer transform active:scale-98"
          >
            <span>Entrar na Agenda do meu Filho(a)</span>
            <span className="text-xl">➔</span>
          </Link>
          <p className="text-xs text-[#9A3412]">
            🔑 Basta digitar o primeiro nome da criança e a senha <strong>teste123</strong>
          </p>
        </div>

      </div>

      <p className="text-[11px] text-[#C2410C]/70 text-center mt-2">
        Creche do Papai • Laboratório de Inovação Educacional
      </p>
    </div>
  );
}
