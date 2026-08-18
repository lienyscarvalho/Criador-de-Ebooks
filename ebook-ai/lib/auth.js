async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Algo deu errado. Tente novamente.");
  }
  return data;
}

export async function signup(username, password) {
  const data = await postJSON("/api/auth/signup", { username, password });
  return data.username;
}

export async function login(username, password) {
  const data = await postJSON("/api/auth/login", { username, password });
  return data.username;
}

export async function logout() {
  await postJSON("/api/auth/logout");
}

export async function me() {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.username || null;
}
