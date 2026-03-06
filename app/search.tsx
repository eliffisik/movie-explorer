import { useEffect, useMemo, useState } from "react";
import {
  FlatList, Image, Pressable, Text, TextInput,
  View, ActivityIndicator, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { tmdbGet } from "../src/api/tmdbClient";
import { posterUrl } from "../src/utils/image";
import { theme } from "../src/ui/theme";
import { toggleFavorite, getFavorites } from "../src/storage/favorites";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../src/i18n";

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
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
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
  const [trending, setTrending] = useState<SearchItem[]>([]);
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");

  const canSearch = debounced.length >= 2;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const favs = await getFavorites();
      if (cancelled) return;
      setFavSet(new Set(favs.map((f) => `${f.type}-${f.id}`)));
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadTrending() {
      try {
        const data = await tmdbGet<{ results: SearchItem[] }>("/trending/all/day", { language: "en-US" });
        if (cancelled) return;
        setTrending((data.results || []).filter((x) => x.media_type === "movie" || x.media_type === "tv"));
      } catch {}
    }
    loadTrending();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!canSearch) { setResults([]); setError(null); return; }
      try {
        setLoading(true);
        setError(null);
        const data = await tmdbGet<SearchResponse>("/search/multi", { query: debounced, include_adult: false, language: "en-US" });
        if (cancelled) return;
        setResults((data.results || []).filter((x) => x.media_type === "movie" || x.media_type === "tv"));
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Search error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [debounced, canSearch]);

  const header = useMemo(() => (
    <SafeAreaView style={{ padding: 16, paddingBottom: 10, backgroundColor: theme.bg }}>
      <Text style={{ fontSize: 28, fontWeight: "900", color: theme.text }}>
        {t.search}
      </Text>
      <Text style={{ marginTop: 6, color: theme.muted }}>
        {t.searchPlaceholder2}
      </Text>

      <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{
          flex: 1, borderWidth: 1, borderColor: theme.border,
          backgroundColor: theme.card, borderRadius: 16,
          paddingHorizontal: 12, paddingVertical: Platform.OS === "web" ? 10 : 12,
        }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={theme.muted}
            autoCorrect={false}
            autoCapitalize="none"
            style={{ color: theme.text, fontSize: 16 }}
          />
        </View>
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery("")}
            style={{ paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card }}
          >
            <Text style={{ color: theme.text, fontWeight: "800" }}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {(["all", "movie", "tv"] as const).map((v) => {
          const active = filter === v;
          const label = v === "all" ? "All" : v === "movie" ? "Movies" : "TV";
          return (
            <Pressable
              key={v}
              onPress={() => setFilter(v)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
                borderColor: active ? "rgba(124,92,252,0.7)" : theme.border,
                backgroundColor: active ? "rgba(124,92,252,0.22)" : theme.card,
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "900" }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {query.trim().length === 0 ? (
        <Text style={{ color: theme.muted, marginTop: 10 }}>Trending today</Text>
      ) : null}

      {loading ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
          <ActivityIndicator />
          <Text style={{ color: theme.muted }}>Searching…</Text>
        </View>
      ) : null}

      {error ? <Text style={{ color: theme.danger, marginTop: 10 }}>{error}</Text> : null}

      {!canSearch && query.length > 0 ? (
        <Text style={{ color: theme.muted, marginTop: 10 }}>Type at least 2 characters.</Text>
      ) : null}
    </SafeAreaView>
  ), [query, loading, error, canSearch, filter]);

  const baseData = query.trim().length === 0 ? trending : results;
  const listData = filter === "all" ? baseData : baseData.filter((x) => x.media_type === filter);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <FlatList
        data={listData}
        keyExtractor={(x) => `${x.media_type}-${x.id}`}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.muted, padding: 16 }}>{t.searchEmpty}</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const title = item.title ?? item.name ?? "Untitled";
          const img = posterUrl(item.poster_path);
          const year = (item.release_date || item.first_air_date || "").slice(0, 4);
          const type = item.media_type as "movie" | "tv";
          const favKey = `${type}-${item.id}`;
          const isFav = favSet.has(favKey);

          return (
            <Pressable
              onPress={() => router.push({ pathname: "/detail", params: { id: String(item.id), type } })}
              style={{
                position: "relative", marginHorizontal: 16, padding: 12,
                borderRadius: 18, borderWidth: 1, borderColor: theme.border,
                backgroundColor: theme.card, flexDirection: "row", gap: 12, alignItems: "center",
              }}
            >
              <Pressable
                onPress={async (e) => {
                  e.stopPropagation();
                  const next = await toggleFavorite({ id: item.id, type, title, poster_path: item.poster_path, vote_average: item.vote_average, year });
                  setFavSet(new Set(next.map((f) => `${f.type}-${f.id}`)));
                }}
                style={{
                  position: "absolute", top: 10, right: 10, width: 38, height: 38,
                  borderRadius: 12, borderWidth: 1, borderColor: theme.border,
                  backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", zIndex: 10,
                }}
              >
                <Text style={{ fontSize: 18, color: isFav ? theme.accent : theme.text }}>
                  {isFav ? "★" : "☆"}
                </Text>
              </Pressable>

              <View style={{ width: 62, height: 92, borderRadius: 12, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                {img ? (
                  <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }}>
                    <Text style={{ color: theme.muted, fontWeight: "900", fontSize: 12 }}>🎬</Text>
                    <Text style={{ color: theme.muted, fontWeight: "800", fontSize: 10, marginTop: 2 }} numberOfLines={2}>No Image</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text }} numberOfLines={2}>{title}</Text>
                <Text style={{ color: theme.muted }}>{type.toUpperCase()} {year ? `• ${year}` : ""}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(124,92,252,0.18)", borderWidth: 1, borderColor: "rgba(124,92,252,0.35)" }}>
                    <Text style={{ color: theme.text, fontWeight: "800", fontSize: 12 }}>⭐ {(item.vote_average ?? 0).toFixed(1)}</Text>
                  </View>
               
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}