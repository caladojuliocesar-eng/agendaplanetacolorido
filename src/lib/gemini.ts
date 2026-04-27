import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  DailyRecord,
  FEEDING_LABELS,
  ACTIVITY_ITEMS,
  FeedingStatus,
} from "@/types";

const SYSTEM_PROMPT = `Você é um assistente carinhoso de uma escola infantil. Receba os dados do dia de um aluno e gere UMA frase curta (máximo 2 linhas) e acolhedora resumindo o dia. Use um tom alegre e positivo. Se a alimentação foi "Recusou", não dramatize, apenas mencione de forma leve. Use emojis com moderação (máx 2). Responda APENAS com a frase, sem aspas, sem prefixo.`;

function buildPrompt(record: DailyRecord, nomeAluno: string): string {
  const alimentacao = Object.entries(record.alimentacao)
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
    (a) => record.atividades[a.key]
  )
    .map((a) => a.label)
    .join(", ");

  let prompt = `Nome do aluno: ${nomeAluno}\n`;
  if (alimentacao) prompt += `Alimentação: ${alimentacao}\n`;
  if (atividades) prompt += `Atividades: ${atividades}\n`;
  if (record.atividadeTexto)
    prompt += `Atividade especial: ${record.atividadeTexto}\n`;
  if (record.observacoes)
    prompt += `Observações da professora: ${record.observacoes}\n`;

  return prompt;
}

export async function generateDailySummary(
  record: DailyRecord,
  nomeAluno: string
): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Gemini] API key not configured. Skipping summary.");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = buildPrompt(record, nomeAluno);

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }] },
      ],
    });

    const text = result.response.text().trim();
    return text || null;
  } catch (error) {
    console.error("[Gemini] Failed to generate summary:", error);
    return null;
  }
}
