import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const TMDB = process.env.TMDB_API_KEY;
const OPENAI = process.env.OPENAI_API_KEY;

async function tmdbDiscover(type = "movie") {
  const res = await fetch(
    `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB}&language=en-US&sort_by=popularity.desc`
  );
  return res.json();
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
      temperature: 0.6,

      // ✅ Groq, OpenAI uyumlu API’de JSON mode destekler (docs)
      response_format: { type: "json_object" },

      messages: [
        {
          role: "system",
          content:
            'Return ONLY valid JSON in this shape: {"recommendations":[{"id":number,"title":string,"reason":string}]} . Only pick from candidates.',
        },
        {
          role: "user",
          content: JSON.stringify({ mood, candidates }),
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

    const tmdb = await tmdbDiscover(type);
    const candidates = (tmdb.results || []).slice(0, 10).map((x) => ({
      id: x.id,
      title: x.title || x.name,
      overview: x.overview,
      rating: x.vote_average,
    }));

    const ai = await askAI(candidates, mood);
    res.json({ recommendations: ai.recommendations || [] });
  } catch (e) {
    console.log("RECOMMEND ERROR:", e);
    res.status(500).json({ error: e?.message || "AI recommendation failed" });
  }
});


app.listen(5050, () =>
  console.log("🤖 AI server running on http://localhost:5050")
);
