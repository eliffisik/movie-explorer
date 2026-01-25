import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { tmdbGet } from "../src/api/tmdbClient";
import { posterUrl } from "../src/utils/image";
import { theme } from "../src/ui/theme";

type MediaType = "movie" | "tv" | "person";

type SearchItem = {
  id: number;
  media_type: MediaType;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average?: number;
  first_air_date?: string;
  release_date?: string;
};

type SearchResponse = {
  page: number;
  results: SearchItem[];
};

function useDebouncedValue<T>(value: T, delayMs = 450) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function SearchScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim(), 450);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchItem[]>([]);

  const canSearch = debounced.length >= 2;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!canSearch) {
        setResults([]);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await tmdbGet<SearchResponse>("/search/multi", {
          query: debounced,
          include_adult: false,
          language: "en-US",
        });

        if (cancelled) return;

        const filtered = (data.results || []).filter(
          (x) => x.media_type === "movie" || x.media_type === "tv"
        );
        setResults(filtered);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Search error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debounced, canSearch]);

  const header = useMemo(() => {
    return (
      <View style={{ padding: 16, paddingBottom: 10, backgroundColor: theme.bg }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: theme.text }}>
          Discover
        </Text>
        <Text style={{ marginTop: 6, color: theme.muted }}>
          Search movies & TV shows and see where to watch.
        </Text>

        <View
          style={{
            marginTop: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.card,
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: Platform.OS === "web" ? 10 : 12,
            }}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search (e.g., Game of Thrones)"
              placeholderTextColor={theme.muted}
              autoCorrect={false}
              autoCapitalize="none"
              style={{ color: theme.text, fontSize: 16 }}
            />
          </View>

          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery("")}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.card,
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "800" }}>Clear</Text>
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
            <ActivityIndicator />
            <Text style={{ color: theme.muted }}>Searching…</Text>
          </View>
        ) : null}

        {error ? (
          <Text style={{ color: theme.danger, marginTop: 10 }}>{error}</Text>
        ) : null}

        {!canSearch && query.length > 0 ? (
          <Text style={{ color: theme.muted, marginTop: 10 }}>
            Type at least 2 characters.
          </Text>
        ) : null}
      </View>
    );
  }, [query, loading, error, canSearch]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <FlatList
        data={results}
        keyExtractor={(x) => `${x.media_type}-${x.id}`}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const title = item.title ?? item.name ?? "Untitled";
          const img = posterUrl(item.poster_path);
          const year = (item.release_date || item.first_air_date || "").slice(0, 4);

          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/detail",
                  params: { id: String(item.id), type: item.media_type },
                })
              }
              style={{
                marginHorizontal: 16,
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
              <View
                style={{
                  width: 62,
                  height: 92,
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
              >
                {img ? (
                  <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} />
                ) : null}
              </View>

              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text }} numberOfLines={2}>
                  {title}
                </Text>

                <Text style={{ color: theme.muted }}>
                  {item.media_type.toUpperCase()} {year ? `• ${year}` : ""}
                </Text>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: "rgba(124,92,252,0.18)",
                      borderWidth: 1,
                      borderColor: "rgba(124,92,252,0.35)",
                    }}
                  >
                    <Text style={{ color: theme.text, fontWeight: "800", fontSize: 12 }}>
                      ⭐ {(item.vote_average ?? 0).toFixed(1)}
                    </Text>
                  </View>

                  <Text style={{ color: theme.muted, fontSize: 12 }}>
                    Tap to see where to watch
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
