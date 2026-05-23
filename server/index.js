import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json());

const TMDB = (process.env.TMDB_API_KEY || process.env.EXPO_PUBLIC_TMDB_API_KEY || "")
  .trim()
  .replace(/^"|"$/g, "");
const OPENAI = (process.env.OPENAI_API_KEY || "").trim().replace(/^"|"$/g, "");

const GENRE_MAP = {
  comedy: 35,
  drama: 18,
  action: 28,
  fantasy: 14,
  romance: 10749,
  thriller: 53,
  horror: 27,
  crime: 80,
  animation: 16,
  scifi: 878,
  "sci-fi": 878,
};

// Horror ve thriller için daha düşük rating eşiği
const GENRE_MIN_RATING = {
  horror: "5.5",
  thriller: "5.8",
  crime: "5.8",
};

function normalizeItem(x, type) {
  return {
    id: x.id,
    type,
    title: x.title || x.name || "",
    overview: x.overview || "",
    rating: x.vote_average ?? 0,
    year: (x.release_date || x.first_air_date || "").slice(0, 4),
    poster_path: x.poster_path ?? null,
  };
}

async function tmdbGet(path, params = {}) {
  if (!TMDB) throw new Error("Missing TMDB_API_KEY");

  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("language", "en-US");
  const isBearerToken = TMDB.startsWith("eyJ") || TMDB.startsWith("Bearer ");
  if (!isBearerToken) url.searchParams.set("api_key", TMDB);

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).length > 0) {
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    headers: isBearerToken
      ? { Authorization: TMDB.startsWith("Bearer ") ? TMDB : `Bearer ${TMDB}` }
      : undefined,
  });
  const data = await res.json();

  if (!res.ok) {
    console.log("TMDB error:", path, res.status, data);
    throw new Error(data?.status_message || `TMDB failed (${res.status})`);
  }
  return data;
}

async function discoverByGenre({ type, genre, page = 1 }) {
  const gid = GENRE_MAP[String(genre).toLowerCase()];
  if (!gid) return [];

  const minRating = GENRE_MIN_RATING[genre] ?? "6.0";

  const data = await tmdbGet(`/discover/${type}`, {
    with_genres: gid,
    sort_by: "popularity.desc",
    "vote_average.gte": minRating,
    "vote_count.gte": "100", // az oy almış filmleri çıkar
    include_adult: "false",
    page: String(page),
  });

  return (data.results || [])
    .slice(0, 18)
    .map((x) => normalizeItem(x, type))
    .filter((x) => x.title.length > 0); // başlıksız öğeleri at
}

async function askAI({ candidates, genre, mood, type }) {
  if (!OPENAI) throw new Error("Missing OPENAI_API_KEY");

  const compact = candidates.map((c) => ({
    id: c.id,
    title: c.title,
    rating: c.rating,
    year: c.year,
    overview: c.overview.slice(0, 220),
    type: c.type,
  }));

  const instructions = `You are a passionate film critic with 20+ years of experience. Your job is to pick EXACTLY 5 items from the provided candidates list and explain WHY each one matches the user's mood.

RULES:
- Pick ONLY from the candidates list. NEVER invent or suggest titles not in the list.
- You MUST use the exact numeric ID from the candidates list. Do not change or guess IDs.
- Each "reason" must be 2-3 sentences. Describe the emotional experience of watching it: the atmosphere, pacing, themes. NOT plot summary.
- Match the mood closely. If the user says "cozy", pick comfort films. If "dark", lean into tension and moral complexity.
- Vary your picks: don't pick 5 similar films. Give range.
- Return ONLY valid JSON, no extra text: {"recommendations":[{"id":number,"reason":string}]}

GOOD reason example:
"A slow-burn thriller that wraps you in paranoia from the first frame. The kind of film you watch with the lights off: unsettling, elegant, and impossible to shake."

BAD reason example:
"This movie matches your thriller and dark preferences."`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.2",
      instructions,
      input: `Return JSON for this request only:\n${JSON.stringify({
        request: { type, genre, mood },
        candidates: compact,
      })}`,
      text: { format: { type: "json_object" } },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.log("OpenAI error:", res.status, data);
    throw new Error(data?.error?.message || "OpenAI request failed");
  }

  const content =
    data?.output_text ||
    data?.output
      ?.flatMap((item) => item?.content ?? [])
      ?.map((part) => part?.text)
      ?.filter(Boolean)
      ?.join("");
  if (!content) throw new Error("OpenAI returned empty content");
  return JSON.parse(content);
}
app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/recommend", async (req, res) => {
  try {
    const { type = "movie", genre = "comedy", mood = "" } = req.body || {};

    if (!TMDB) throw new Error("Missing TMDB_API_KEY");
    if (!OPENAI) throw new Error("Missing OPENAI_API_KEY");
    if (!GENRE_MAP[String(genre).toLowerCase()]) throw new Error("Invalid genre");

    const [c1, c2, c3] = await Promise.all([
      discoverByGenre({ type, genre, page: 1 }),
      discoverByGenre({ type, genre, page: 2 }),
      discoverByGenre({ type, genre, page: 3 }), // 3. sayfa eklendi — çeşitlilik artar
    ]);

    // ID bazlı Map — eşleşmeyi garantiler
    const candidateMap = new Map();
    [...c1, ...c2, ...c3].forEach((c) => {
      if (!candidateMap.has(c.id)) {
        candidateMap.set(c.id, c);
      }
    });

    const candidates = Array.from(candidateMap.values()).slice(0, 36);

    const ai = await askAI({ candidates, genre, mood, type });

    const recs = (ai.recommendations || [])
      .filter((r) => typeof r?.id === "number" && candidateMap.has(r.id)) // sadece gerçek ID'ler
      .slice(0, 5)
      .map((r) => {
        const c = candidateMap.get(r.id);
        return {
          id: r.id,
          title: c.title,
          type: c.type,
          year: c.year,
          rating: c.rating,
          poster_path: c.poster_path,
          reason: r.reason || "Matched your preferences.",
        };
      });

    // Yeterli öneri gelmezse log at
    if (recs.length < 3) {
      console.log("Warning: only", recs.length, "valid recs returned");
    }

    res.json({ recommendations: recs });
  } catch (e) {
    console.log("RECOMMEND ERROR:", e);
    res.status(500).json({ error: e?.message || "recommend failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 Cinefy AI server running on http://localhost:${PORT}`));
