import { sql } from "@vercel/postgres";

let schemaReady = false;

// Cria as tabelas se ainda não existirem. É chamado no início de cada rota
// de API, então funciona como uma "migração" simples sem ferramenta externa.
export async function ensureSchema() {
  if (schemaReady) return;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ebooks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT,
      subtitle TEXT,
      language TEXT,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS ebooks_user_id_idx ON ebooks (user_id, created_at DESC);`;

  schemaReady = true;
}

export { sql };
