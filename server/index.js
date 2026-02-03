import express from "express";
import cors from "cors";

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
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are a movie recommendation assistant. Only recommend from the provided list. Return JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({ mood, candidates }),
        },
      ],
    }),
  });

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

app.post("/recommend", async (req, res) => {
  try {
    const { mood = "surprise me", type = "tv" } = req.body;

    const tmdb = await tmdbDiscover(type);
    const candidates = tmdb.results.slice(0, 10).map((x) => ({
      id: x.id,
      title: x.title || x.name,
      overview: x.overview,
      rating: x.vote_average,
    }));

    const ai = await askAI(candidates, mood);

    res.json({ recommendations: ai.recommendations });
  } catch (e) {
    res.status(500).json({ error: "AI recommendation failed" });
  }
});

app.listen(5050, () =>
  console.log("🤖 AI server running on http://localhost:5050")
);
