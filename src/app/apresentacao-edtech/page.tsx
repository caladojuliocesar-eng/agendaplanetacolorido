import type { Metadata } from "next";
import ApresentacaoPublicaPage from "../apresentacao/page";

export const metadata: Metadata = {
  title: "OttoMatic Tech Labs — Proposta Executiva & Plataforma Digital",
  description: "Apresentação executiva da solução de comunicação escolar, diário de classe oficial, gestão e inteligência pedagógica.",
  openGraph: {
    title: "OttoMatic Tech Labs — Proposta Executiva 2027",
    description: "Solução completa de comunicação escolar, diário de classe oficial, gestão e inteligência pedagógica.",
    url: "https://agenda-ottomatic.vercel.app/apresentacao-edtech",
    siteName: "OttoMatic Tech Labs — Smart Tech Solutions",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OttoMatic Tech Labs — Proposta Executiva 2027",
    description: "Solução completa de comunicação escolar, diário de classe oficial, gestão e inteligência pedagógica.",
  },
};

export default ApresentacaoPublicaPage;
