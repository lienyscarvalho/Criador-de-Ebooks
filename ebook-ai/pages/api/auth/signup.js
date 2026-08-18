import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "../../../lib/db";
import { createSessionCookie } from "../../../lib/session";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    await ensureSchema();

    const { username, password } = req.body || {};
    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return res.status(400).json({ error: "O usuário precisa ter ao menos 3 caracteres." });
    }
    if (!password || typeof password !== "string" || password.length < 4) {
      return res.status(400).json({ error: "A senha precisa ter ao menos 4 caracteres." });
    }

    const uname = username.trim().toLowerCase();
    const existing = await sql`SELECT id FROM users WHERE username = ${uname}`;
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Esse usuário já existe. Toque em "Entrar".' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (username, password_hash) VALUES (${uname}, ${hash})
      RETURNING id, username
    `;
    const user = result.rows[0];

    res.setHeader("Set-Cookie", createSessionCookie(user));
    return res.status(200).json({ username: user.username });
  } catch (err) {
    return res.status(500).json({
      error: "Erro ao criar conta. Verifique se o banco de dados está configurado (POSTGRES_URL e JWT_SECRET).",
      details: String(err.message || err),
    });
  }
}
