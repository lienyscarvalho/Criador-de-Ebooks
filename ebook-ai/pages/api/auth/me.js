import { getSessionFromReq } from "../../../lib/session";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }
  const session = getSessionFromReq(req);
  if (!session) return res.status(200).json({ username: null });
  return res.status(200).json({ username: session.username });
}
