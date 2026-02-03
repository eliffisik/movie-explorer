import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const TMDB = process.env.TMDB_API_KEY;


async function tmdbSearchMulti(query) {
  const url = new URL("https://api.themoviedb.org/3/search/multi");
  url.searchParams.set("api_key", TMDB);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("query", query);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (!res.ok) {
    console.log("TMDB search error:", res.status, data);
    throw new Error(data?.status_message || `TMDB search failed (${res.status})`);
  }

  return data;
}

async function askAI(candidates, mood) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      response_format: { type: "json_object" },

      messages: [
        {
          role: "system",
          content:
            'You are a strict recommendation engine. You MUST only choose from candidates. Pick exactly 5 items. Prefer higher rating when unsure. Each recommendation must include a short specific reason that references mood keywords or the candidate overview. Return ONLY JSON: {"recommendations":[{"id":number,"title":string,"reason":string}]}.',
        },
        {
          role: "user",
          content: JSON.stringify({
            mood,
            candidates,
          }),
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.log("Groq error status:", res.status);
    console.log("Groq error body:", data);
    throw new Error(data?.error?.message || "Groq request failed");
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");

  try {
    return JSON.parse(content);
  } catch {
    console.log("Groq raw content:", content);
    throw new Error("Groq returned non-JSON content");
  }
}

app.post("/recommend", async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
    if (!TMDB) throw new Error("Missing TMDB_API_KEY");

    const { mood = "surprise me", type = "tv" } = req.body;

   
    const q = String(mood).trim().slice(0, 60) || "popular";
    const s = await tmdbSearchMulti(q);

    const candidates = (s.results || [])
      .filter((x) => x.media_type === "movie" || x.media_type === "tv")
      .slice(0, 14)
      .map((x) => ({
        id: x.id,
        type: x.media_type,
        title: x.title || x.name,
        overview: x.overview,
        rating: x.vote_average,
        year: (x.release_date || x.first_air_date || "").slice(0, 4),
      }));

    if (candidates.length === 0) {
      return res.json({ recommendations: [] });
    }

    const ai = await askAI(candidates, mood);

    
    const recs = (ai?.recommendations || [])
      .filter((r) => typeof r?.id === "number")
      .slice(0, 5)
      .map((r) => {
        const c = candidates.find((x) => x.id === r.id);
        return {
          id: r.id,
          title: c?.title || r.title || "Untitled",
          reason: r.reason || "Matched your mood.",
          type: c?.type,
          year: c?.year,
        };
      });

    res.json({ recommendations: recs });
  } catch (e) {
    console.log("RECOMMEND ERROR:", e);
    res.status(500).json({ error: e?.message || "AI recommendation failed" });
  }
});

app.listen(5050, () =>
  console.log("🤖 AI server running on http://localhost:5050")
);
