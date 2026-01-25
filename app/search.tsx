import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, Text, TextInput, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { tmdbGet } from "@/src/api/tmdbClient";
import { posterUrl } from "../src/utils/image";

type MediaType = "movie" | "tv" | "person";

type SearchItem = {
  id: number;
  media_type: MediaType;
  title?: string; // movie
  name?: string;  // tv/person
  poster_path: string | null;
  profile_path?: string | null;
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

  const [query, setQuery] = useState("game of thrones");
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

        // person sonuçlarını şimdilik at (MVP)
        const filtered = (data.results || []).filter((x) => x.media_type === "movie" || x.media_type === "tv");
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
      <View style={{ padding: 16, gap: 10 }}>
        <Text style={{ fontSize: 26, fontWeight: "800" }}>Search</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search movie or TV (e.g., Game of Thrones)"
          autoCorrect={false}
          autoCapitalize="none"
          style={{
            height: 46,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 12,
            paddingHorizontal: 12,
          }}
        />

        {loading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator />
            <Text style={{ opacity: 0.7 }}>Searching…</Text>
          </View>
        ) : null}

        {error ? <Text style={{ color: "crimson" }}>{error}</Text> : null}

        {!canSearch ? <Text style={{ opacity: 0.6 }}>Type at least 2 characters.</Text> : null}
      </View>
    );
  }, [query, loading, error, canSearch]);

  return (
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
                params: { id: String(item.id), type: item.media_type }, // movie | tv
              })
            }
            style={{
              marginHorizontal: 16,
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            <View style={{ width: 60, height: 90, borderRadius: 10, overflow: "hidden", backgroundColor: "#f3f4f6" }}>
              {img ? <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} /> : null}
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: "700" }} numberOfLines={2}>
                {title}
              </Text>
              <Text style={{ opacity: 0.7 }}>
                {item.media_type.toUpperCase()} {year ? `• ${year}` : ""}
              </Text>
              <Text style={{ opacity: 0.7 }}>
                ⭐ {(item.vote_average ?? 0).toFixed(1)}
              </Text>
              <Text style={{ fontSize: 12, opacity: 0.55 }}>Tap to see where to watch</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}
