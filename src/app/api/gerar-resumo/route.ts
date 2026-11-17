import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import {
  FEEDING_LABELS,
  ACTIVITY_ITEMS,
  FeedingStatus,
} from "@/types";

const SYSTEM_PROMPT = `Você é a Estrelinha ⭐, a assistente pedagógica carinhosa da Creche do Papai. 
Receba os dados do dia de um aluno da educação infantil e gere UMA ou DUAS frases curtas, doces e acolhedoras resumindo o dia para a família. 
Use um tom alegre, afetuoso e positivo. Destaque com carinho as atividades, a comidinha e o soninho. 
Se a alimentação teve "Recusou", não dramatize, mencione com leveza. 
Use 1 ou 2 emojis fofos. 
Responda APENAS com a mensagem pronta, sem aspas e sem prefixo.`;

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

  prompt += `Dormiu o soninho? ${record.soninho ? "Sim" : "Não"}\n`;
  prompt += `Usou o banheiro (Xixi)? ${record.xixi ? "Sim" : "Não"}\n`;
  prompt += `Usou o banheiro (Cocô)? ${record.coco ? "Sim" : "Não"}\n`;

  if (record.atividadeTexto)
    prompt += `Atividade especial: ${record.atividadeTexto}\n`;
  if (record.observacoes)
    prompt += `Observações da professora: ${record.observacoes}\n`;

  return prompt;
}

export function generateFallbackSummary(record: any, nomeAluno: string): string {
  const parts: string[] = [];

  // 1. Abertura afetuosa personalizada
  const alim = record.alimentacao || {};
  const comeuMuitoBem = [alim.almoco, alim.frutas, alim.lancheTarde, alim.jantar].filter(v => v === 1).length >= 2;
  const recusouAlgo = [alim.almoco, alim.frutas, alim.lancheTarde, alim.jantar].some(v => v === 3);

  if (record.observacoes && record.observacoes.toLowerCase().includes("óculos")) {
    parts.push(`Hoje o ${nomeAluno} arrasou com muito estilo e charme na turminha!`);
  } else if (record.atividadeTexto && record.atividadeTexto.toLowerCase().includes("ensaio")) {
    parts.push(`Que dia animado, ${nomeAluno}! Os ensaios e brincadeiras foram um verdadeiro show!`);
  } else {
    parts.push(`Hoje o dia de ${nomeAluno} foi repleto de descobertas e carinho na creche!`);
  }

  // 2. Atividade
  if (record.atividadeTexto) {
    const cleanAtiv = record.atividadeTexto.replace(/\n+/g, " ").trim();
    parts.push(`Dedicou-se com muita alegria: ${cleanAtiv}.`);
  }

  // 3. Alimentação
  if (comeuMuitoBem) {
    parts.push("Alimentou-se super bem nas refeições.");
  } else if (alim.almoco === 1) {
    parts.push("Almoçou muito bem.");
  } else if (recusouAlgo) {
    parts.push("Ficou um pouquinho mais seletivo na comidinha, mas curtiu o dia.");
  }

  // 4. Soninho
  if (record.soninho) {
    parts.push("Descansou tranquilo no soninho da tarde.");
  }

  // 5. Observação extra
  if (record.observacoes && !record.observacoes.toLowerCase().includes("óculos")) {
    parts.push(record.observacoes);
  }

  return parts.join(" ") + " 😊✨";
}

export async function POST(req: Request) {
  let bodyData: any = {};
  try {
    bodyData = await req.json();
    const { record, nomeAluno } = bodyData;
    const name = nomeAluno || "Aluno";

    const apiKey = process.env.GEMINI_API_KEY;

    // Se houver chave, tenta modelos do Gemini
    if (apiKey && apiKey !== "SUA_CHAVE_AQUI") {
      const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
      const genAI = new GoogleGenerativeAI(apiKey);
      const prompt = buildPrompt(record, name);

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent({
            contents: [
              { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }] },
            ],
          });
          const text = result.response.text().trim();
          if (text) {
            console.log(`[IA] Resumo gerado com sucesso pelo modelo ${modelName} para ${name}`);
            return NextResponse.json({ summary: text });
          }
        } catch (modelErr: any) {
          console.warn(`[IA] Falha no modelo ${modelName}:`, modelErr?.message || modelErr);
        }
      }
    }

    // Fallback inteligente garantido caso o Gemini esteja sem chave válida ou fora do ar
    console.log(`[IA] Gerando resumo assistido inteligente (fallback) para ${name}...`);
    const fallback = generateFallbackSummary(record, name);
    return NextResponse.json({ summary: fallback });
  } catch (error: any) {
    console.error("Erro na API de IA:", error);
    // Mesmo em caso de exceção de parsing, devolve fallback
    const fallback = generateFallbackSummary(bodyData?.record || {}, bodyData?.nomeAluno || "Aluno");
    return NextResponse.json({ summary: fallback });
  }
}
