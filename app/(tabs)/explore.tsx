import React, { useState } from "react";
import { Pressable, ScrollView, Text, View, Image, Modal, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/ui/theme";
import { posterUrl } from "../../src/utils/image";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { t } from "../../src/i18n";

const cardShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 9 },
  elevation: 4,
};

const API_BASES = [
  process.env.EXPO_PUBLIC_AI_API_BASE,
  Platform.OS === "web" ? "http://localhost:3000" : undefined,
  Platform.OS === "web" ? "http://127.0.0.1:3000" : undefined,
].filter(Boolean).map((url) => url!.replace(/\/$/, ""));

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
  const [type, setType] = useState<"all" | "movie" | "tv">("all");
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
      let response: Response | null = null;
      let lastError: unknown = null;

      for (const baseUrl of API_BASES) {
        try {
          response = await fetch(`${baseUrl}/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, genre, mood: selectedMoods.join(", ") }),
          });
          break;
        } catch (e) {
          lastError = e;
        }
      }

      if (!response) throw lastError ?? new Error("AI server is not reachable");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Request failed");
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
        <View style={{ borderRadius: 24, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 16, overflow: "hidden", ...cardShadow }}>
          <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, backgroundColor: theme.accent2 }} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.accent2, fontSize: 12, fontWeight: "900", letterSpacing: 0 }}>AI PICKS</Text>
              <Text style={{ fontSize: 30, fontWeight: "900", color: theme.text, marginTop: 4 }}>{t.exploreTitle}</Text>
              <Text style={{ color: theme.muted, marginTop: 6, lineHeight: 20 }}>{t.exploreSubtitle}</Text>
            </View>
            <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: "rgba(34,197,94,0.14)", borderWidth: 1, borderColor: "rgba(34,197,94,0.35)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="sparkles" size={25} color={theme.accent2} />
            </View>
          </View>

          {/* Type toggle */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            {(["all", "movie", "tv"] as const).map((tp) => {
              const active = tp === type;
              const label = tp === "all" ? "ALL" : tp.toUpperCase();
              return (
                <Pressable
                  key={tp}
                  onPress={() => setType(tp)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1,
                    borderColor: active ? "rgba(34,197,94,0.65)" : theme.border,
                    backgroundColor: active ? "rgba(34,197,94,0.16)" : theme.card,
                  }}
                >
                  <Text style={{ color: active ? theme.text : theme.muted, fontWeight: "900" }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Genre */}
        <Text style={{ color: theme.text, fontWeight: "900", marginTop: 16 }}>{t.exploreGenre}</Text>
        <Pressable
          onPress={() => setShowGenres(true)}
          style={{
            marginTop: 8, borderWidth: 1, borderColor: theme.border,
            backgroundColor: theme.card, borderRadius: 18,
            paddingHorizontal: 14, paddingVertical: 14,
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            ...cardShadow,
          }}
        >
          <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }}>{selectedGenreLabel}</Text>
          <Ionicons name="chevron-down" size={18} color={theme.muted} />
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
                      borderColor: active ? "rgba(34,197,94,0.65)" : "transparent",
                      backgroundColor: active ? "rgba(34,197,94,0.16)" : "rgba(255,255,255,0.04)",
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
                  borderColor: active ? "rgba(34,197,94,0.65)" : theme.border,
                  backgroundColor: active ? "rgba(34,197,94,0.16)" : theme.card,
                }}
              >
                <Text style={{ color: active ? theme.text : theme.muted, fontWeight: "700", fontSize: 14 }}>
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
            marginTop: 16, paddingVertical: 14, borderRadius: 18, borderWidth: 1,
            borderColor: "rgba(34,197,94,0.55)", backgroundColor: "rgba(34,197,94,0.18)",
            alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
            ...cardShadow,
          }}
        >
          <Ionicons name="sparkles" size={18} color={theme.text} />
          <Text style={{ color: theme.text, fontWeight: "900" }}>{t.exploreButton}</Text>
        </Pressable>

        {/* Skeleton */}
        {loading ? (
          <View style={{ marginTop: 14, gap: 10 }}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={{ padding: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, flexDirection: "row", gap: 12, alignItems: "center", opacity: 1 - i * 0.15 }}>
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
                  style={{ padding: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, flexDirection: "row", gap: 12, alignItems: "center", ...cardShadow }}
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
