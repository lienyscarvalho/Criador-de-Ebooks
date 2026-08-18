import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";

const COOKIE_NAME = "nebula_session";
const SECRET = process.env.JWT_SECRET;

function getSecret() {
  if (!SECRET) {
    throw new Error(
      "JWT_SECRET não configurado no servidor. Defina uma string aleatória longa nas variáveis de ambiente."
    );
  }
  return SECRET;
}

export function createSessionCookie(user) {
  const token = jwt.sign({ uid: user.id, username: user.username }, getSecret(), { expiresIn: "30d" });
  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  return serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionFromReq(req) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, getSecret());
  } catch (e) {
    return null;
  }
}
