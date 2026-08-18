import { sql, ensureSchema } from "../../../lib/db";
import { getSessionFromReq } from "../../../lib/session";

function mapRow(row) {
  return { id: row.id, savedAt: new Date(row.created_at).getTime(), ...row.data };
}

export default async function handler(req, res) {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: "Não autenticado." });
  }

  try {
    await ensureSchema();

    if (req.method === "GET") {
      const result = await sql`
        SELECT id, data, created_at FROM ebooks
        WHERE user_id = ${session.uid}
        ORDER BY created_at DESC
        LIMIT 50
      `;
      return res.status(200).json({ ebooks: result.rows.map(mapRow) });
    }

    if (req.method === "POST") {
      const { title, subtitle, language, chapters } = req.body || {};
      if (!chapters || !Array.isArray(chapters)) {
        return res.status(400).json({ error: "E-book inválido: faltam os capítulos." });
      }
      const data = { title: title || "", subtitle: subtitle || "", language: language || "pt", chapters };

      await sql`
        INSERT INTO ebooks (user_id, title, subtitle, language, data)
        VALUES (${session.uid}, ${data.title}, ${data.subtitle}, ${data.language}, ${JSON.stringify(data)})
      `;

      const result = await sql`
        SELECT id, data, created_at FROM ebooks
        WHERE user_id = ${session.uid}
        ORDER BY created_at DESC
        LIMIT 50
      `;
      return res.status(200).json({ ebooks: result.rows.map(mapRow) });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método não permitido." });
  } catch (err) {
    return res.status(500).json({
      error: "Erro ao acessar o banco de dados.",
      details: String(err.message || err),
    });
  }
}
