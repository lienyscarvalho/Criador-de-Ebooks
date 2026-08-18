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
    if (!username || !password) {
      return res.status(400).json({ error: "Preencha usuário e senha." });
    }

    const uname = username.trim().toLowerCase();
    const result = await sql`SELECT id, username, password_hash FROM users WHERE username = ${uname}`;
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado. Toque em "Criar conta".' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Senha incorreta." });
    }

    res.setHeader("Set-Cookie", createSessionCookie(user));
    return res.status(200).json({ username: user.username });
  } catch (err) {
    return res.status(500).json({
      error: "Erro ao entrar. Verifique se o banco de dados está configurado (POSTGRES_URL e JWT_SECRET).",
      details: String(err.message || err),
    });
  }
}
