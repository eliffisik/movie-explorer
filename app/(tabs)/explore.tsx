import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, Image ,Modal} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../src/ui/theme";
import { posterUrl } from "../../src/utils/image";
import { SafeAreaView } from 'react-native-safe-area-context';
// ✅ 1) TELEFON (Expo Go) => PC IP
const API_BASE = "http://192.168.1.100:5050";
// ✅ 2) ANDROID EMULATOR => "http://10.0.2.2:5050"
// ✅ 3) IOS SIM => "http://localhost:5050"

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

export default function ExploreAI() {
  const router = useRouter();

  const [type, setType] = useState<"movie" | "tv">("movie");
  const [genre, setGenre] = useState("comedy");
  const [mood, setMood] = useState("funny, light, easy to watch");

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Rec[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showGenres, setShowGenres] = useState(false);

  const canRun = useMemo(() => genre.length > 0, [genre]);
  const selectedGenreLabel =
  GENRES.find((g) => g.value === genre)?.label ?? "Select genre";
  async function recommend() {
    try {
      if (!canRun) return;

      setLoading(true);
      setError(null);
      setItems([]);

      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, genre, mood }),
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
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
      <Text style={{ fontSize: 28, fontWeight: "900", color: theme.text }}>
        Ne izlemek istersin?
      </Text>
      <Text style={{ color: theme.muted, marginTop: 6 }}>
        Tür seç → mood ekle → 5 öneri al.
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

      {/* Genre (Dropdown) */}
<Text style={{ color: theme.text, fontWeight: "900", marginTop: 16 }}>
  Hangi tür?
</Text>

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
  {/* dışarı tıklayınca kapanması için overlay */}
  <Pressable
    onPress={() => setShowGenres(false)}
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      padding: 20,
    }}
  >
    {/* içerik kartı */}
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
      <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }}>
        Tür seç
      </Text>

      {GENRES.map((g) => {
        const active = g.value === genre;

        return (
          <Pressable
            key={g.value}
            onPress={() => {
              setGenre(g.value);
              setShowGenres(false);
            }}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: active ? "rgba(124,92,252,0.8)" : "transparent",
              backgroundColor: active
                ? "rgba(124,92,252,0.18)"
                : "rgba(255,255,255,0.04)",
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "800", fontSize: 15 }}>
              {g.label}
            </Text>
          </Pressable>
        );
      })}
    </Pressable>
  </Pressable>
</Modal>
      {/* Mood */}
      <Text style={{ color: theme.text, fontWeight: "900", marginTop: 14 }}>
        Mood (opsiyonel)
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
          placeholder="ör: dark, cozy, smart dialogue, fast paced..."
          placeholderTextColor={theme.muted}
          style={{ color: theme.text, fontSize: 16 }}
          autoCorrect={false}
        />
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
        <Text style={{ color: theme.text, fontWeight: "900" }}>Öneri Getir</Text>
      </Pressable>

      {loading ? (
        <View style={{ marginTop: 14 }}>
          <ActivityIndicator />
        </View>
      ) : null}

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
                  <Text style={{ color: theme.muted, marginTop: 8 }} numberOfLines={3}>
                    {x.reason}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}

        {!loading && !error && items.length === 0 ? (
          <Text style={{ color: theme.muted, marginTop: 10 }}>
            Bir tür seçip “Öneri Getir”e bas.
          </Text>
        ) : null}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
