const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY?.trim().replace(/^"|"$/g, "");

type Params = Record<string, string | number | boolean | undefined>;

function getApiKey() {
  if (!API_KEY) {
    throw new Error(
      "TMDB API key is missing. Add EXPO_PUBLIC_TMDB_API_KEY to your .env file and restart Expo."
    );
  }
  return API_KEY;
}

function toQuery(params: Params = {}, apiKey: string) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  if (!isBearerToken(apiKey)) sp.append("api_key", apiKey);
  return sp.toString();
}

function isBearerToken(value: string) {
  return value.startsWith("eyJ") || value.startsWith("Bearer ");
}

export async function tmdbGet<T>(path: string, params?: Params): Promise<T> {
  const apiKey = getApiKey();
  const url = `${TMDB_BASE}${path}?${toQuery(params, apiKey)}`;
  const headers = isBearerToken(apiKey)
    ? { Authorization: apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}` }
    : undefined;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TMDB ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}
