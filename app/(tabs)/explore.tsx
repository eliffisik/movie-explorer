import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View, Image, Modal } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../src/ui/theme";
import { posterUrl } from "../../src/utils/image";
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE = "https://movie-explorer-production-735c.up.railway.app";

type Rec = {
  id: number;
  title: string;
  reason?: string;
  type?: "movie" | "tv";
  year?: string;
  rating?: number;
  poster_path?: string | null;
};

const GENRES = [
  { label: "Comedy", value: "comedy" },
  { label: "Drama", value: "drama" },
  { label: "Action", value: "action" },
  { label: "Fantasy", value: "fantasy" },
  { label: "Romance", value: "romance" },
  { label: "Thriller", value: "thriller" },
  { label: "Horror", value: "horror" },
  { label: "Crime", value: "crime" },
  { label: "Animation", value: "animation" },
  { label: "Sci-Fi", value: "sci-fi" },
];

const MOODS = [
  { label: "😄 Happy", value: "cheerful, fun, uplifting" },
  { label: "😢 Emotional", value: "emotional, sad, touching" },
  { label: "😰 Tense", value: "tense, suspenseful, edge of seat" },
  { label: "🧠 Thought-provoking", value: "thought-provoking, deep, philosophical" },
  { label: "😌 Cozy", value: "cozy, calm, easy to watch" },
  { label: "⚡ Exciting", value: "action-packed, fast-paced, thrilling" },
  { label: "🌙 Dark", value: "dark, gritty, morally complex" },
  { label: "😂 Funny", value: "funny, witty, laugh out loud" },
];

export default function ExploreAI() {
  const router = useRouter();

  const [type, setType] = useState<"movie" | "tv">("movie");
  const [genre, setGenre] = useState("comedy");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Rec[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showGenres, setShowGenres] = useState(false);

  const selectedGenreLabel = GENRES.find((g) => g.value === genre)?.label ?? "Select genre";

  function toggleMood(value: string) {
    setSelectedMoods((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );
  }

  const moodString = selectedMoods.join(", ");

  async function recommend() {
    try {
      setLoading(true);
      setError(null);
      setItems([]);

      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, genre, mood: moodString }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");

      setItems(data.recommendations || []);
    } catch (e: any) {
      setError(e?.message ?? "AI error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: theme.text }}>
          What do you want to watch?
        </Text>
        <Text style={{ color: theme.muted, marginTop: 6 }}>
          Pick a genre → set your mood → get 5 picks.
        </Text>

        {/* Type toggle */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          {(["movie", "tv"] as const).map((t) => {
            const active = t === type;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? "rgba(124,92,252,0.8)" : theme.border,
                  backgroundColor: active ? "rgba(124,92,252,0.22)" : theme.card,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "900" }}>{t.toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Genre */}
        <Text style={{ color: theme.text, fontWeight: "900", marginTop: 16 }}>Genre</Text>
        <Pressable
          onPress={() => setShowGenres(true)}
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }}>
            {selectedGenreLabel}
          </Text>
          <Text style={{ color: theme.muted, fontSize: 16 }}>▾</Text>
        </Pressable>

        <Modal visible={showGenres} transparent animationType="fade">
          <Pressable
            onPress={() => setShowGenres(false)}
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 20 }}
          >
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: theme.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 14,
                gap: 8,
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }}>Select a genre</Text>
              {GENRES.map((g) => {
                const active = g.value === genre;
                return (
                  <Pressable
                    key={g.value}
                    onPress={() => { setGenre(g.value); setShowGenres(false); }}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: active ? "rgba(124,92,252,0.8)" : "transparent",
                      backgroundColor: active ? "rgba(124,92,252,0.18)" : "rgba(255,255,255,0.04)",
                    }}
                  >
                    <Text style={{ color: theme.text, fontWeight: "800", fontSize: 15 }}>{g.label}</Text>
                  </Pressable>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Mood Chips */}
        <Text style={{ color: theme.text, fontWeight: "900", marginTop: 16 }}>
          Mood {selectedMoods.length > 0 ? `(${selectedMoods.length} selected)` : "(optional)"}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {MOODS.map((m) => {
            const active = selectedMoods.includes(m.value);
            return (
              <Pressable
                key={m.value}
                onPress={() => toggleMood(m.value)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? "rgba(124,92,252,0.8)" : theme.border,
                  backgroundColor: active ? "rgba(124,92,252,0.22)" : theme.card,
                }}
              >
                <Text style={{ color: active ? "#fff" : theme.muted, fontWeight: "700", fontSize: 14 }}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Button */}
        <Pressable
          onPress={recommend}
          style={{
            marginTop: 16,
            paddingVertical: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(124,92,252,0.7)",
            backgroundColor: "rgba(124,92,252,0.22)",
            alignItems: "center",
          }}
        >
          <Text style={{ color: theme.text, fontWeight: "900" }}>Get Recommendations</Text>
        </Pressable>

        {loading ? <View style={{ marginTop: 14 }}><ActivityIndicator /></View> : null}
        {error ? <Text style={{ marginTop: 12, color: theme.danger }}>{error}</Text> : null}

        {/* Results */}
        <View style={{ marginTop: 16, gap: 10 }}>
          {items.map((x) => {
            const img = x.poster_path ? posterUrl(x.poster_path) : null;
            return (
              <Pressable
                key={x.id}
                onPress={() => {
                  if (!x.type) return;
                  router.push({ pathname: "/detail", params: { id: String(x.id), type: x.type } });
                }}
                style={{
                  padding: 12,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                  flexDirection: "row",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <View style={{ width: 62, height: 92, borderRadius: 12, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)" }}>
                  {img ? <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }} numberOfLines={2}>
                    {x.title} {x.year ? `(${x.year})` : ""}
                  </Text>
                  <Text style={{ color: theme.muted, marginTop: 4 }}>
                    {x.type?.toUpperCase()} {typeof x.rating === "number" ? `• ⭐ ${x.rating.toFixed(1)}` : ""}
                  </Text>
                  {x.reason ? (
                    <Text style={{ color: theme.muted, marginTop: 8 }} numberOfLines={3}>{x.reason}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}

          {!loading && !error && items.length === 0 ? (
            <Text style={{ color: theme.muted, marginTop: 10 }}>
              Select a genre and tap Get Recommendations.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}