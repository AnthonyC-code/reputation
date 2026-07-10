// Typed client for the Go API (passportd). All server-side data fetching in
// the app goes through this module — components never call fetch directly
// (AGENTS.md §5).

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface Health {
  status: string;
  db: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export function getHealth(): Promise<Health> {
  return get<Health>("/healthz");
}
