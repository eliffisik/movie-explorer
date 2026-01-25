const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

type Params = Record<string, string | number | boolean | undefined>;

function toQuery(params: Params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  if (!API_KEY) throw new Error("Missing EXPO_PUBLIC_TMDB_API_KEY");
  sp.append("api_key", API_KEY);
  return sp.toString();
}

export async function tmdbGet<T>(path: string, params?: Params): Promise<T> {
  const url = `${TMDB_BASE}${path}?${toQuery(params)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TMDB ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}
