import { ICONS, LANGS } from "../../lib/icons";

const EXCLUDED_ICONS = ["warn", "check", "sparkle", "arrow", "info", "lock", "wand"];

function buildSystemPrompt(pages, language, tone) {
  const langName = LANGS[language] || "Português";
  const iconList = Object.keys(ICONS)
    .filter((k) => !EXCLUDED_ICONS.includes(k))
    .join(", ");

  return `Você é um gerador de e-books didáticos e visuais, com um estilo de "apostila visual" colorida e profissional. Sua tarefa é transformar uma ideia curta em um e-book estruturado no formato JSON abaixo, escrito no idioma: ${langName}. Tom de escrita: ${tone}.

Gere EXATAMENTE ${pages} capítulos (cada capítulo vira uma página do e-book, além da capa). Cada capítulo deve ter entre 2 e 4 blocos de conteúdo, curtos e escaneáveis (nada de parágrafos longos).

Responda APENAS com um JSON válido, sem markdown, sem texto antes ou depois, seguindo este schema exato:

{
  "title": "string - título geral do e-book, impactante, curto",
  "subtitle": "string - subtítulo curto explicando a proposta do e-book",
  "chapters": [
    {
      "title": "string - título do capítulo/página",
      "colorTheme": "uma destas: pink, teal, gold, green, blue, violet (varie entre capítulos)",
      "icon": "uma destas palavras: ${iconList}",
      "sections": [
        {
          "type": "uma destas: intro, list, tip, warning, example, summary",
          "heading": "string curta - título do bloco (ex: 'Dica de ouro', 'Exemplo prático', vazio se type=intro)",
          "text": "string curta (use quando type NÃO for list)",
          "items": ["array de strings curtas - use SOMENTE quando type=list"]
        }
      ]
    }
  ]
}

Regras importantes:
- Cada bloco de texto deve ter no máximo ~180 caracteres.
- Listas (type=list) devem ter entre 3 e 5 itens curtos.
- Sempre inclua ao menos um bloco tip ou warning por e-book, para dar dinamismo.
- O último capítulo deve ser um resumo/conclusão (pode usar type=summary).
- Não inclua texto fora do JSON. Não use markdown (sem \`\`\`).`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "ANTHROPIC_API_KEY não configurada no servidor. Adicione essa variável de ambiente no projeto da Vercel.",
    });
  }

  const { idea, pages, language, tone } = req.body || {};

  if (!idea || typeof idea !== "string" || idea.trim().length < 2) {
    return res.status(400).json({ error: "Envie uma ideia, palavra ou frase válida." });
  }

  const safePages = Math.max(4, Math.min(20, parseInt(pages, 10) || 8));
  const safeLanguage = LANGS[language] ? language : "pt";
  const safeTone = ["didatico", "formal", "criativo"].includes(tone) ? tone : "didatico";

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system: buildSystemPrompt(safePages, safeLanguage, safeTone),
        messages: [
          {
            role: "user",
            content: `Ideia/palavra/frase fornecida pelo usuário: "${idea.trim()}"`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Erro na API da Anthropic.", details: errText });
    }

    const data = await response.json();
    const textBlocks = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const clean = textBlocks
      .trim()
      .replace(/^```json/, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      return res.status(502).json({ error: "A IA respondeu em um formato inesperado. Tente novamente." });
    }

    parsed.language = safeLanguage;
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Falha ao gerar o e-book.", details: String(err) });
  }
}
