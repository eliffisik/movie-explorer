import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const TMDB = process.env.TMDB_API_KEY;
const GROQ = process.env.GROQ_API_KEY;

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

function normalizeItem(x, type) {
  return {
    id: x.id,
    type,
    title: x.title || x.name || "Untitled",
    overview: x.overview || "",
    rating: x.vote_average ?? 0,
    year: (x.release_date || x.first_air_date || "").slice(0, 4),
    poster_path: x.poster_path ?? null,
  };
}

async function tmdbGet(path, params = {}) {
  if (!TMDB) throw new Error("Missing TMDB_API_KEY");

  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", TMDB);
  url.searchParams.set("language", "en-US");

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).length > 0) {
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString());
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

  const data = await tmdbGet(`/discover/${type}`, {
    with_genres: gid,
    sort_by: "popularity.desc",
    "vote_average.gte": "6.2",
    include_adult: "false",
    page: String(page),
  });

  return (data.results || []).slice(0, 18).map((x) => normalizeItem(x, type));
}

async function askAI({ candidates, genre, mood, type }) {
  if (!GROQ) throw new Error("Missing GROQ_API_KEY");

  const compact = candidates.map((c) => ({
    id: c.id,
    title: c.title,
    rating: c.rating,
    year: c.year,
    overview: c.overview.slice(0, 220),
    type: c.type,
  }));

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a passionate film critic with 20+ years of experience — think a mix of Roger Ebert's warmth and a film school professor's depth. Your job is to pick EXACTLY 5 items from the provided candidates list and explain WHY each one matches the user's mood.

RULES:
- Pick ONLY from the candidates list. NEVER invent or suggest titles not in the list.
- Each "reason" must be 2-3 sentences. Describe the emotional experience of watching it — the atmosphere, pacing, themes. NOT plot summary.
- Match the mood closely. If the user says "cozy", pick comfort films. If "dark", lean into tension and moral complexity.
- Vary your picks: don't pick 5 similar films. Give range.
- Return ONLY valid JSON, no extra text: {"recommendations":[{"id":number,"reason":string}]}

GOOD reason example:
"A slow-burn thriller that wraps you in paranoia from the first frame. The kind of film you watch with the lights off — unsettling, elegant, and impossible to shake."

BAD reason example:
"This movie matches your thriller and dark preferences."`,
        },
        {
          role: "user",
          content: JSON.stringify({
            request: { type, genre, mood },
            candidates: compact,
          }),
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.log("Groq error:", res.status, data);
    throw new Error(data?.error?.message || "Groq request failed");
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");
  return JSON.parse(content);
}

app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/recommend", async (req, res) => {
  try {
    const { type = "movie", genre = "comedy", mood = "" } = req.body || {};

    if (!TMDB) throw new Error("Missing TMDB_API_KEY");
    if (!GROQ) throw new Error("Missing GROQ_API_KEY");
    if (!GENRE_MAP[String(genre).toLowerCase()]) throw new Error("Invalid genre");

    const [c1, c2] = await Promise.all([
      discoverByGenre({ type, genre, page: 1 }),
      discoverByGenre({ type, genre, page: 2 }),
    ]);

    const uniq = new Map();
    [...c1, ...c2].forEach((c) => uniq.set(`${c.type}-${c.id}`, c));
    const candidates = Array.from(uniq.values()).slice(0, 26);

    const ai = await askAI({ candidates, genre, mood, type });

    const recs = (ai.recommendations || [])
      .filter((r) => typeof r?.id === "number")
      .slice(0, 5)
      .map((r) => {
        const c = candidates.find((x) => x.id === r.id);
        return {
          id: r.id,
          title: c?.title || "Untitled",
          type: c?.type,
          year: c?.year,
          rating: c?.rating,
          poster_path: c?.poster_path,
          reason: r.reason || "Matched your preferences.",
        };
      });

    res.json({ recommendations: recs });
  } catch (e) {
    console.log("RECOMMEND ERROR:", e);
    res.status(500).json({ error: e?.message || "recommend failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 AI server running on http://localhost:${PORT}`));