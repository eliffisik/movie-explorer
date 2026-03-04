import { useState } from "react";
import { Pressable, ScrollView, Text, View, Image, Modal } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../src/ui/theme";
import { posterUrl } from "../../src/utils/image";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { t } from "../../src/i18n";

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
  { label: t.moodHappy, value: "cheerful, fun, uplifting" },
  { label: t.moodEmotional, value: "emotional, sad, touching" },
  { label: t.moodTense, value: "tense, suspenseful, edge of seat" },
  { label: t.moodThought, value: "thought-provoking, deep, philosophical" },
  { label: t.moodCozy, value: "cozy, calm, easy to watch" },
  { label: t.moodExciting, value: "action-packed, fast-paced, thrilling" },
  { label: t.moodDark, value: "dark, gritty, morally complex" },
  { label: t.moodFunny, value: "funny, witty, laugh out loud" },
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

  const selectedGenreLabel = GENRES.find((g) => g.value === genre)?.label ?? t.exploreSelectGenre;

  function toggleMood(value: string) {
    setSelectedMoods((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );
  }

  async function recommend() {
    try {
      setLoading(true);
      setError(null);
      setItems([]);
      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, genre, mood: selectedMoods.join(", ") }),
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
        <Text style={{ fontSize: 28, fontWeight: "900", color: theme.text }}>{t.exploreTitle}</Text>
        <Text style={{ color: theme.muted, marginTop: 6 }}>{t.exploreSubtitle}</Text>

        {/* Type toggle */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          {(["movie", "tv"] as const).map((tp) => {
            const active = tp === type;
            return (
              <Pressable
                key={tp}
                onPress={() => setType(tp)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1,
                  borderColor: active ? "rgba(124,92,252,0.8)" : theme.border,
                  backgroundColor: active ? "rgba(124,92,252,0.22)" : theme.card,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "900" }}>{tp.toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Genre */}
        <Text style={{ color: theme.text, fontWeight: "900", marginTop: 16 }}>{t.exploreGenre}</Text>
        <Pressable
          onPress={() => setShowGenres(true)}
          style={{
            marginTop: 8, borderWidth: 1, borderColor: theme.border,
            backgroundColor: theme.card, borderRadius: 16,
            paddingHorizontal: 14, paddingVertical: 14,
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }}>{selectedGenreLabel}</Text>
          <Text style={{ color: theme.muted, fontSize: 16 }}>▾</Text>
        </Pressable>

        <Modal visible={showGenres} transparent animationType="fade">
          <Pressable
            onPress={() => setShowGenres(false)}
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 20 }}
          >
            <Pressable onPress={() => {}} style={{ backgroundColor: theme.card, borderRadius: 18, borderWidth: 1, borderColor: theme.border, padding: 14, gap: 8 }}>
              <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }}>{t.exploreSelectGenre}</Text>
              {GENRES.map((g) => {
                const active = g.value === genre;
                return (
                  <Pressable
                    key={g.value}
                    onPress={() => { setGenre(g.value); setShowGenres(false); }}
                    style={{
                      paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1,
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

        {/* Mood */}
        <Text style={{ color: theme.text, fontWeight: "900", marginTop: 16 }}>
          {selectedMoods.length > 0 ? t.exploreMoodSelected(selectedMoods.length) : t.exploreMood}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {MOODS.map((m) => {
            const active = selectedMoods.includes(m.value);
            return (
              <Pressable
                key={m.value}
                onPress={() => toggleMood(m.value)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1,
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
            marginTop: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1,
            borderColor: "rgba(124,92,252,0.7)", backgroundColor: "rgba(124,92,252,0.22)", alignItems: "center",
          }}
        >
          <Text style={{ color: theme.text, fontWeight: "900" }}>{t.exploreButton}</Text>
        </Pressable>

        {/* Skeleton */}
        {loading ? (
          <View style={{ marginTop: 14, gap: 10 }}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={{ padding: 12, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, flexDirection: "row", gap: 12, alignItems: "center", opacity: 1 - i * 0.15 }}>
                <View style={{ width: 62, height: 92, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)" }} />
                <View style={{ flex: 1, gap: 8 }}>
                  <View style={{ height: 16, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)", width: "70%" }} />
                  <View style={{ height: 12, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)", width: "40%" }} />
                  <View style={{ height: 12, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)", width: "90%" }} />
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Error */}
        {error ? (
          <View style={{ marginTop: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(248,113,113,0.3)", backgroundColor: "rgba(248,113,113,0.08)", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 24 }}>⚠️</Text>
            <Text style={{ color: "#f87171", fontWeight: "700", textAlign: "center" }}>{error}</Text>
            <Pressable onPress={recommend} style={{ marginTop: 4, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "rgba(248,113,113,0.4)", backgroundColor: "rgba(248,113,113,0.12)" }}>
              <Text style={{ color: "#f87171", fontWeight: "700" }}>{t.errorTryAgain}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Results */}
        <View style={{ marginTop: 16, gap: 10 }}>
          {items.map((x, index) => {
            const img = x.poster_path ? posterUrl(x.poster_path) : null;
            return (
              <Animated.View key={x.id} entering={FadeInDown.delay(index * 80).duration(400).springify()}>
                <Pressable
                  onPress={() => { if (!x.type) return; router.push({ pathname: "/detail", params: { id: String(x.id), type: x.type } }); }}
                  style={{ padding: 12, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, flexDirection: "row", gap: 12, alignItems: "center" }}
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
                    {x.reason ? <Text style={{ color: theme.muted, marginTop: 8 }} numberOfLines={3}>{x.reason}</Text> : null}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
          {!loading && !error && items.length === 0 ? (
            <Text style={{ color: theme.muted, marginTop: 10 }}>{t.exploreEmpty}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}