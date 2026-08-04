# 🚀 OttoMatic EdTech — Agenda & Gestão Escolar Inteligente

> **Desenvolvido por**: **OttoMatic Tech Labs** (*Smart Tech Solutions*)  
> **Status**: Produção / Showcase SaaS Ativo  
> **Apresentação Executiva Pública**: [`/apresentacao-edtech`](https://agenda-ottomatic.vercel.app/apresentacao-edtech)

---

## 📌 Visão Geral do Sistema

O **OttoMatic EdTech** é uma plataforma SaaS completa de comunicação escolar, diário de classe oficial e inteligência pedagógica desenvolvida para instituições de Educação Infantil e Ensino Fundamental.

O sistema foi desenhado sob o conceito **"Boutique Digital" (Fricção Zero)**, dividindo o ecossistema em três perfis dedicados de uso:

1. 👨‍👩‍👧 **Espaço das Famílias (Pais)**: Aplicativo leve (PWA) para acompanhamento diário da rotina dos filhos em tempo real, mural de avisos, fotos HD com reações, canal direto de atendimento e histórico financeiro.
2. 👩‍🏫 **Espaço das Professoras (Salas)**: Interface otimizada para toque em **Tablets ou Celulares**, permitindo registros instantâneos de rotina (alimentação, fralda, sono, medicamentos e notas pedagógicas) com input por voz.
3. 🏛️ **Painel de Gestão (Diretoria & Coordenação)**: Painel completo via navegador para controle de turmas, homologação pedagógica, controle de estoque de uniformes/materiais, diário de classe oficial em PDF (LDB/BNCC) e relatórios financeiros.

---

## ⭐ Assistente Pedagógica Estrelinha (IA)

O grande diferencial inovador da plataforma é o assistente pedagógico **Estrelinha ⭐**:
* **Transformação Automática**: Converte as dezenas de pequenas observações registradas no dia a dia da sala de aula em rascunhos completos de relatórios trimestrais de evolução por pilar da BNCC.
* **Economia de Tempo**: Reduz centenas de horas de redação manual do corpo docente.
* **Segurança & Homologação**: Os rascunhos passam pela revisão afetuosa da professora e aprovação formal da Coordenação antes de irem para as famílias.

---

## 🛠️ Stack Tecnológica

* **Core & Framework**: Next.js 16 (App Router) + React
* **Estilização & UI**: Vanilla CSS + Tailwind / Design Tokens responsivos
* **PWA & Offline**: Serwist (Service Worker & Cache PWA)
* **Banco de Dados & Autenticação**: Firebase Firestore & Firebase Auth
* **Hospedagem & Infraestrutura**: Vercel (Edge Network & Serverless)

---

## 📚 Documentos de Referência do Projeto

* 📄 **[`STRATEGY.md`](./STRATEGY.md)**: Modelo de comercialização, viabilidade financeira, estratégia de hardware (tablets) e posicionamento comercial da marca **OttoMatic Tech Labs**.
* 📋 **[`ROADMAP.md`](./ROADMAP.md)**: Histórico de funcionalidades entregues e registro de intenções futuras (landing page genérica, subdomínio na Hostinger e expansão multi-tenant).

---

## 🔑 Acessos para Demonstração (Showroom Local)

* **Diretoria (Admin)**: `diretora@planeta.com` (Senha: `planeta123`)
* **Corpo Docente (Professora)**: `profe@planeta.com` (Turma Berçário II)
* **Famílias (Pais)**: `paiotto@planeta.com` / `pailuna@planeta.com`

---

## 💻 Executando Localmente

```bash
# Instalar dependências
npm install

# Rodar em modo de desenvolvimento
npm run dev

# Compilar para produção
node ".\node_modules\next\dist\bin\next" build
```

© {new Date().getFullYear()} **OttoMatic Tech Labs** — *Smart Tech Solutions*. Todos os direitos reservados.
