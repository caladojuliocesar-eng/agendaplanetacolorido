import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { texto } = await request.json();

    if (!texto) {
      return NextResponse.json({ error: "Texto da observação é obrigatório." }, { status: 400 });
    }

    const prompt = `Você é um assistente de IA especialista em educação infantil.
O seu trabalho é ler uma observação livre feita por uma professora e classificá-la automaticamente de acordo com um conjunto de pilares e sentimentos.

**Pilares disponíveis (use exatamente um destes IDs):**
- socioemocional (Desenvolvimento Socioemocional)
- autonomia (Autonomia e Rotina)
- linguagem (Linguagem e Comunicação)
- motora (Coordenação Motora)
- logico (Raciocínio Lógico)
- curiosidade (Interesse e Curiosidade)
- leitura (Leitura e Escrita)
- comportamento (Comportamento)
- alimentacao_sono (Alimentação e Sono)
- destaques (Destaques e Recomendações)

**Sentimentos disponíveis (use exatamente um destes IDs):**
- positivo (Para conquistas, bom desempenho, atitudes positivas, superações)
- neutro (Para registros rotineiros, informativos sem muito juízo de valor)
- atencao (Para dificuldades, comportamentos inadequados, necessidade de acompanhamento, recusa)

Responda APENAS com um objeto JSON válido, sem formatação markdown (\`\`\`json), contendo as seguintes chaves:
- pilarId (O ID exato do pilar em letras minúsculas)
- pilarLabel (Nome legível do pilar correspondente, ex: "Socioemocional")
- sentimento (O ID exato do sentimento)
- justificativa (Uma breve frase explicando a escolha baseada na ação da criança, escrita de forma amigável)

**Observação da professora:**
"${texto}"`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Removendo formatação markdown caso a IA decida incluir
    if (text.startsWith("\`\`\`json")) {
        text = text.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (text.startsWith("\`\`\`")) {
        text = text.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    const classification = JSON.parse(text);

    return NextResponse.json(classification);
  } catch (error: any) {
    console.error("Erro ao classificar observação:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
