export async function fetchHistory() {
  const res = await fetch("/api/ebooks", { credentials: "same-origin" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.ebooks || [];
}

export async function saveEbook(ebook) {
  const res = await fetch("/api/ebooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(ebook),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.ebooks || null;
}
