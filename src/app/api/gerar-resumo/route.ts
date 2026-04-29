import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import {
  FEEDING_LABELS,
  ACTIVITY_ITEMS,
  FeedingStatus,
} from "@/types";

const SYSTEM_PROMPT = `Você é um assistente carinhoso de uma escola infantil. Receba os dados do dia de um aluno e gere UMA frase curta (máximo 2 linhas) e acolhedora resumindo o dia. Use um tom alegre e positivo. Se a alimentação foi "Recusou", não dramatize, apenas mencione de forma leve. Use emojis com moderação (máx 2). Responda APENAS com a frase, sem aspas, sem prefixo.`;

function buildPrompt(record: any, nomeAluno: string): string {
  const alimentacao = Object.entries(record.alimentacao || {})
    .filter(([, v]) => (v as FeedingStatus) > 0)
    .map(([k, v]) => {
      const labels: Record<string, string> = {
        frutas: "Frutas",
        almoco: "Almoço",
        lancheTarde: "Lanche da Tarde",
        jantar: "Jantar",
        outros: "Outros",
      };
      return `${labels[k] || k}: ${FEEDING_LABELS[v as FeedingStatus]}`;
    })
    .join(", ");

  const atividades = ACTIVITY_ITEMS.filter(
    (a) => record.atividades?.[a.key]
  )
    .map((a) => a.label)
    .join(", ");

  let prompt = `Nome do aluno: ${nomeAluno}\n`;
  if (alimentacao) prompt += `Alimentação: ${alimentacao}\n`;
  if (atividades) prompt += `Atividades: ${atividades}\n`;

  // Campos de rotina
  prompt += `Dormiu o soninho? ${record.soninho ? "Sim" : "Não"}\n`;
  prompt += `Usou o banheiro (Xixi)? ${record.xixi ? "Sim" : "Não"}\n`;
  prompt += `Usou o banheiro (Cocô)? ${record.coco ? "Sim" : "Não"}\n`;

  if (record.atividadeTexto)
    prompt += `Atividade especial: ${record.atividadeTexto}\n`;
  if (record.observacoes)
    prompt += `Observações da professora: ${record.observacoes}\n`;

  return prompt;
}

export async function POST(req: Request) {
  try {
    const { record, nomeAluno } = await req.json();

    // Use server-only env var (not NEXT_PUBLIC_) to protect the key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("[IA] GEMINI_API_KEY not set in environment variables");
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = buildPrompt(record, nomeAluno);

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }] },
      ],
    });

    const text = result.response.text().trim();
    return NextResponse.json({ summary: text });
  } catch (error: any) {
    console.error("Erro na API de IA:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
