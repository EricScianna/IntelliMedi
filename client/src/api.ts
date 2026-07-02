import { API_URL } from "./constants";

export function get(percorso: string) {
  return request(percorso);
}

export function post(percorso: string, body: unknown) {
  return request(percorso, { method: "POST", body: JSON.stringify(body) });
}

export function put(percorso: string, body: unknown) {
  return request(percorso, { method: "PUT", body: JSON.stringify(body) });
}
export function del(percorso: string) {
  return request(percorso, { method: "DELETE" });
}

async function request(percorso: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.body ? { "Content-Type": "application/json" } : {}),
  };

  const risposta = await fetch(`${API_URL}/api/${percorso}`, { ...options, headers });

  if (!risposta.ok) throw new Error(await risposta.text()); // il client segnala l'errore lanciando

  if (risposta.status === 204) return null; // PUT/DELETE non hanno body
  const testo = await risposta.text();
  return testo ? JSON.parse(testo) : null; // body vuoto → niente .json() che esplode
}
