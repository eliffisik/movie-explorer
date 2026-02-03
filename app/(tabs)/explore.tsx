import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { theme } from "../../src/ui/theme";

//  GERÇEK TELEFON (Expo Go) => PC IP
const API_BASE = "http://192.168.1.202:5050";

type AiRec = {
  id: number;
  title: string;
  reason?: string;
  type?: "movie" | "tv";
  year?: string;
};

const chips = [
  { label: "Dark Fantasy", value: "dark fantasy" },
  { label: "Comedy", value: "comedy" },
  { label: "Action", value: "action" },
  { label: "Thriller", value: "thriller" },
  { label: "Romance", value: "romance" },
  { label: "Sci-Fi", value: "sci-fi" },
];

export default function ExploreAI() {
  const [similarTo, setSimilarTo] = useState("Game of Thrones");
  const [mood, setMood] = useState("dark fantasy, politics, dragons");

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AiRec[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canRun = useMemo(() => {
    return similarTo.trim().length >= 2 || mood.trim().length >= 2;
  }, [similarTo, mood]);

  async function recommend() {
    try {
      if (!canRun) {
        setError("Please type something in Similar to or Mood.");
        return;
      }

      setLoading(true);
      setError(null);
      setItems([]);

      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          similarTo: similarTo.trim(),
          mood: mood.trim(),
          type: "tv", // istersen toggle ekleriz (tv/movie)
        }),
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
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
      <Text style={{ fontSize: 28, fontWeight: "900", color: theme.text }}>
        AI Explore
      </Text>
      <Text style={{ color: theme.muted, marginTop: 6 }}>
        Get smarter recommendations using Similar-to + Mood.
      </Text>

      {/* Similar to */}
      <Text style={{ color: theme.text, fontWeight: "900", marginTop: 16 }}>
        Similar to
      </Text>
      <View
        style={{
          marginTop: 8,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.card,
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      >
        <TextInput
          value={similarTo}
          onChangeText={setSimilarTo}
          placeholder='e.g. "Game of Thrones"'
          placeholderTextColor={theme.muted}
          style={{ color: theme.text, fontSize: 16 }}
          autoCorrect={false}
        />
      </View>

      {/* Mood / Genre */}
      <Text style={{ color: theme.text, fontWeight: "900", marginTop: 14 }}>
        Mood / Genre
      </Text>
      <View
        style={{
          marginTop: 8,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.card,
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      >
        <TextInput
          value={mood}
          onChangeText={setMood}
          placeholder="e.g. dark fantasy, comedy, political drama..."
          placeholderTextColor={theme.muted}
          style={{ color: theme.text, fontSize: 16 }}
          autoCorrect={false}
        />
      </View>

      {/* Chips */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {chips.map((c) => (
          <Pressable
            key={c.value}
            onPress={() => {
              // mood alanına chip'i ekleyelim (overwrite değil)
              const current = mood.trim();
              const next = current.length === 0 ? c.value : `${current}, ${c.value}`;
              setMood(next);
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(124,92,252,0.7)",
              backgroundColor: "rgba(124,92,252,0.18)",
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "900" }}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Button */}
      <Pressable
        onPress={recommend}
        style={{
          marginTop: 14,
          paddingVertical: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(124,92,252,0.7)",
          backgroundColor: "rgba(124,92,252,0.22)",
          alignItems: "center",
        }}
      >
        <Text style={{ color: theme.text, fontWeight: "900" }}>
          Get recommendations
        </Text>
      </Pressable>

      {loading ? (
        <View style={{ marginTop: 14 }}>
          <ActivityIndicator />
        </View>
      ) : null}

      {error ? (
        <Text style={{ marginTop: 12, color: theme.danger }}>{error}</Text>
      ) : null}

      {/* Results */}
      <View style={{ marginTop: 16, gap: 10 }}>
        {items.map((x) => (
          <View
            key={x.id}
            style={{
              padding: 12,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.card,
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }}>
              {x.title}
              {x.year ? ` (${x.year})` : ""}
            </Text>

            <Text style={{ color: theme.muted, marginTop: 4 }}>
              {x.type ? x.type.toUpperCase() : "TV/MOVIE"}
            </Text>

            {x.reason ? (
              <Text style={{ color: theme.muted, marginTop: 8 }}>
                {x.reason}
              </Text>
            ) : null}
          </View>
        ))}

        {!loading && !error && items.length === 0 ? (
          <Text style={{ color: theme.muted, marginTop: 10 }}>
            No recommendations yet. Try typing a title like “Game of Thrones” and a mood like “dark fantasy”.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
