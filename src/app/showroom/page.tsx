"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ShowroomLanding() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] selection:bg-[#F97316] selection:text-white overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#FFF7ED] rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-[#FFF7ED] rounded-full blur-3xl opacity-60"></div>
      </div>

      {/* Navbar */}
      <nav className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🤖</span>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-[#F97316] leading-none">OTTOMATIC</span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Showroom Planeta Colorido</span>
          </div>
        </div>
        <Link 
          href="/login" 
          target="_blank"
          className="px-6 py-2.5 rounded-full border-2 border-[#F97316] text-[#F97316] font-bold hover:bg-[#F97316] hover:text-white transition-all duration-300"
        >
          Entrar no Sistema
        </Link>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-[#FFF7ED] text-[#F97316] text-sm font-bold mb-6 animate-bounce">
          ✨ Oi, Fabiana! Dá uma olhada no que preparei.
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight max-w-4xl">
          Nossa agenda de papel <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] to-[#EA580C]">
            agora é 100% digital.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          O foco total foi transformar a experiência da agenda física em algo moderno e simples. 
          E para deixar tudo ainda melhor, aproveitei e inseri uma visão financeira e ADM completa.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="#acesso" 
            className="w-full sm:w-auto px-10 py-5 bg-[#F97316] text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-200 hover:scale-105 active:scale-95 transition-all"
          >
            Ver a Nova Agenda
          </Link>
          <Link 
            href="#evolucao" 
            className="w-full sm:w-auto px-10 py-5 bg-white text-gray-700 border-2 border-gray-100 rounded-2xl font-bold text-lg hover:border-[#F97316] transition-all"
          >
            A Beleza do Digital
          </Link>
        </div>
      </header>

      {/* Evolution Section */}
      <section id="evolucao" className="max-w-6xl mx-auto px-6 py-24 border-t border-gray-50">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-100 to-rose-100 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src="/images/agenda-evolution.png" 
                alt="A Agenda Digital"
                className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black mb-6 leading-tight">
              A beleza de uma <br />
              <span className="text-orange-500 text-3xl">agenda que se preenche "sozinha".</span>
            </h2>
            <div className="space-y-6 text-gray-600 leading-relaxed">
              <p>
                O coração do app é a <b>Agenda Digital</b>. Aquela papelada toda que as professoras tinham que escrever 
                na mão, agora é feita com poucos toques, mantendo todo o carinho e cuidado.
              </p>
              <div className="p-6 bg-orange-50 rounded-2xl border-l-4 border-orange-500">
                <p className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                  <span>📶</span> Sempre Disponível
                </p>
                <p className="text-orange-800/80 text-sm">
                  Mesmo que o Wi-Fi da escola oscile, a professora continua preenchendo a agenda normalmente. 
                  O sistema sincroniza tudo assim que o sinal estabiliza. Confiável como o papel, mas rápido como o digital.
                </p>
              </div>
              <p>
                Com a agenda digitalizada, ganhamos super-poderes: avisos imediatos para os pais, 
                histórico organizado e mais tempo para o que importa: as crianças.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Extra Features Grid */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6 text-center mb-16">
          <h2 className="text-3xl font-black mb-4">E para completar a experiência...</h2>
          <p className="text-gray-500">Aproveitei a inteligência da agenda para automatizar o resto da escola.</p>
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">💰</div>
              <h3 className="text-xl font-bold mb-4 text-[#F97316]">Gestão Financeira</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                As mensalidades e taxas agora conversam com a agenda. Controle total de recebimentos sem esforço.
              </p>
            </div>
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">📊</div>
              <h3 className="text-xl font-bold mb-4 text-[#F97316]">Painel Administrativo</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                Uma visão panorâmica de todas as salas, frequências e avisos. A escola inteira na palma da sua mão.
              </p>
            </div>
            <Link href="/showroom/pedagogico" className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group block no-underline" style={{ textDecoration: "none" }}>
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">🧠</div>
              <h3 className="text-xl font-bold mb-4 text-[#F97316]">Inteligência Pedagógica</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                Relatórios trimestrais gerados a partir das observações diárias. A evolução do aluno, pilar por pilar. Clique para ver o demo ao vivo.
              </p>
              <span className="inline-block mt-4 text-xs font-bold text-orange-500 uppercase tracking-wider">Ver Dashboard →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Showroom Access Section */}
      <section id="acesso" className="max-w-5xl mx-auto px-6 py-32 text-center">
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-8">Explore por Dentro</h2>
            <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
              Cada perfil mostra uma visão diferente do sistema. 
              Clique e navegue livremente — sem login, sem fricção.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Link href="/showroom/diretora" className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl group hover:bg-white/10 transition-all hover:scale-[1.03] hover:border-orange-500/30 block" style={{ textDecoration: "none" }}>
                <span className="block text-3xl mb-4 group-hover:animate-bounce">👩‍💼</span>
                <span className="block text-xs uppercase tracking-widest text-orange-400 font-bold mb-2">Visão da Diretora</span>
                <p className="text-sm text-slate-300 mb-3">Dashboard pedagógico, geração de relatórios com IA e aprovação</p>
                <span className="inline-block text-xs font-bold text-orange-500 uppercase tracking-wider">Acessar →</span>
              </Link>
              <Link href="/showroom/professora" className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl group hover:bg-white/10 transition-all hover:scale-[1.03] hover:border-emerald-500/30 block" style={{ textDecoration: "none" }}>
                <span className="block text-3xl mb-4 group-hover:animate-bounce">👩‍🏫</span>
                <span className="block text-xs uppercase tracking-widest text-emerald-400 font-bold mb-2">Visão da Professora</span>
                <p className="text-sm text-slate-300 mb-3">Registro de observações com classificação automática por IA</p>
                <span className="inline-block text-xs font-bold text-emerald-500 uppercase tracking-wider">Acessar →</span>
              </Link>
              <Link href="/showroom/pedagogico" className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl group hover:bg-white/10 transition-all hover:scale-[1.03] hover:border-violet-500/30 block" style={{ textDecoration: "none" }}>
                <span className="block text-3xl mb-4 group-hover:animate-bounce">🧠</span>
                <span className="block text-xs uppercase tracking-widest text-violet-400 font-bold mb-2">Inteligência Pedagógica</span>
                <p className="text-sm text-slate-300 mb-3">Visão completa: dados, timeline, simulador e relatório — tudo junto</p>
                <span className="inline-block text-xs font-bold text-violet-500 uppercase tracking-wider">Acessar →</span>
              </Link>
            </div>
          </div>
          
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]"></div>
        </div>
      </section>

      {/* Collaborative Evolution Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-gray-100">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-black mb-4 flex items-center gap-2 text-slate-800">
              <span>🌱</span> Projeto Sustentável
            </h3>
            <p className="text-gray-600 leading-relaxed">
              O sistema foi construído com tecnologia de ponta para ser leve, seguro e escalável. 
              Isso garante uma infraestrutura de baixo custo, permitindo que a Planeta Colorido 
              tenha uma gestão profissional de alta performance sem os altos custos de licenciamento de softwares genéricos do mercado.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-black mb-4 flex items-center gap-2 text-slate-800">
              <span>🚀</span> Evolução Colaborativa
            </h3>
            <p className="text-gray-600 leading-relaxed">
              O app não é estático. Nosso próximo passo é estudar junto com a escola como os 
              registros diários podem ajudar a pré-estruturar os <b>Relatórios de Performance</b>. 
              O objetivo é reduzir o trabalho braçal de redação das professoras, mantendo 
              totalmente o olhar pedagógico e humano sobre o desenvolvimento de cada criança.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Ottomatic AI • Projeto Planeta Colorido</p>
      </footer>
    </div>
  );
}
