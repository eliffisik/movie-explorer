import { useEffect, useMemo, useState } from "react";
import {
  FlatList, Image, Pressable, Text, TextInput,
  View, ActivityIndicator, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { tmdbGet } from "../src/api/tmdbClient";
import { posterUrl } from "../src/utils/image";
import { theme } from "../src/ui/theme";
import { toggleFavorite, getFavorites } from "../src/storage/favorites";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../src/i18n";

const cardShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.22,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 5,
};

type MediaType = "movie" | "tv" | "person";

type SearchItem = {
  id: number;
  media_type?: MediaType;
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
        setLoading(true);
        setError(null);
        const [movies, tvShows] = await Promise.all([
          tmdbGet<{ results: SearchItem[] }>("/trending/movie/day", { language: "en-US" }),
          tmdbGet<{ results: SearchItem[] }>("/trending/tv/day", { language: "en-US" }),
        ]);
        if (cancelled) return;
        const movieItems = (movies.results || []).map((x) => ({ ...x, media_type: "movie" as const }));
        const tvItems = (tvShows.results || []).map((x) => ({ ...x, media_type: "tv" as const }));
        const mixed: SearchItem[] = [];
        const maxLength = Math.max(movieItems.length, tvItems.length);
        for (let i = 0; i < maxLength; i += 1) {
          if (movieItems[i]) mixed.push(movieItems[i]);
          if (tvItems[i]) mixed.push(tvItems[i]);
        }
        setTrending(mixed);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Could not load movies");
      } finally {
        if (!cancelled) setLoading(false);
      }
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
    <SafeAreaView style={{ padding: 16, paddingBottom: 12, backgroundColor: theme.bg }}>
      <View style={{ borderRadius: 24, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 16, overflow: "hidden", ...cardShadow }}>
        <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, backgroundColor: theme.accent }} />
        <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "900", letterSpacing: 0 }}>
          MOVIE EXPLORER
        </Text>
        <Text style={{ fontSize: 32, fontWeight: "900", color: theme.text, marginTop: 4 }}>
          {t.search}
        </Text>
        <Text style={{ marginTop: 6, color: theme.muted, lineHeight: 20 }}>
          {t.searchPlaceholder2.trim()}
        </Text>

        <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{
            flex: 1, borderWidth: 1, borderColor: theme.borderStrong,
            backgroundColor: theme.card, borderRadius: 18,
            paddingHorizontal: 12, paddingVertical: Platform.OS === "web" ? 10 : 12,
            flexDirection: "row", alignItems: "center", gap: 10,
          }}>
            <Ionicons name="search" size={20} color={theme.faint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t.searchPlaceholder}
              placeholderTextColor={theme.faint}
              autoCorrect={false}
              autoCapitalize="none"
              style={{ color: theme.text, fontSize: 16, flex: 1 }}
            />
          </View>
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery("")}
              style={{ width: 46, height: 46, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardSoft, alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="close" size={20} color={theme.text} />
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
                  paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1,
                  borderColor: active ? "rgba(139,92,246,0.85)" : theme.border,
                  backgroundColor: active ? "rgba(139,92,246,0.24)" : theme.card,
                }}
              >
                <Text style={{ color: active ? theme.text : theme.muted, fontWeight: "900" }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {query.trim().length === 0 ? (
        <Text style={{ color: theme.muted, marginTop: 16, fontWeight: "800" }}>Trending today</Text>
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
  const emptyTitle =
    query.trim().length > 0
      ? "No matches found"
      : filter === "movie"
        ? "No trending movies right now"
        : filter === "tv"
          ? "No trending TV shows right now"
          : "No trending titles right now";
  const emptySubtitle =
    query.trim().length > 0
      ? "Try another title or switch the filter."
      : "Try refreshing in a moment or search for something specific.";

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
            <View style={{ padding: 24, alignItems: "center" }}>
              <View style={{ width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(139,92,246,0.16)", borderWidth: 1, borderColor: "rgba(139,92,246,0.28)" }}>
                <Ionicons name="film-outline" size={26} color={theme.accent} />
              </View>
              <Text style={{ color: theme.text, fontWeight: "900", fontSize: 18, marginTop: 14, textAlign: "center" }}>{emptyTitle}</Text>
              <Text style={{ color: theme.muted, marginTop: 6, textAlign: "center", lineHeight: 20 }}>{emptySubtitle}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const title = item.title ?? item.name ?? "Untitled";
          const img = posterUrl(item.poster_path);
          const year = (item.release_date || item.first_air_date || "").slice(0, 4);
          const type = (item.media_type ?? "movie") as "movie" | "tv";
          const favKey = `${type}-${item.id}`;
          const isFav = favSet.has(favKey);

          return (
            <Pressable
              onPress={() => router.push({ pathname: "/detail", params: { id: String(item.id), type } })}
              style={{
                position: "relative", marginHorizontal: 16, padding: 12,
                borderRadius: 20, borderWidth: 1, borderColor: theme.border,
                backgroundColor: theme.card, flexDirection: "row", gap: 14, alignItems: "center",
                ...cardShadow,
              }}
            >
              <Pressable
                onPress={async (e) => {
                  e.stopPropagation();
                  const next = await toggleFavorite({ id: item.id, type, title, poster_path: item.poster_path, vote_average: item.vote_average, year });
                  setFavSet(new Set(next.map((f) => `${f.type}-${f.id}`)));
                }}
                style={{
                  position: "absolute", top: 12, right: 12, width: 38, height: 38,
                  borderRadius: 12, borderWidth: 1, borderColor: theme.border,
                  backgroundColor: "rgba(8,11,18,0.78)", alignItems: "center", justifyContent: "center", zIndex: 10,
                }}
              >
                <Ionicons name={isFav ? "star" : "star-outline"} size={19} color={isFav ? theme.gold : theme.text} />
              </Pressable>

              <View style={{ width: 72, height: 108, borderRadius: 14, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                {img ? (
                  <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }}>
                    <Text style={{ color: theme.muted, fontWeight: "900", fontSize: 12 }}>🎬</Text>
                    <Text style={{ color: theme.muted, fontWeight: "800", fontSize: 10, marginTop: 2 }} numberOfLines={2}>No Image</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1, gap: 8, paddingRight: 44 }}>
                <Text style={{ fontSize: 17, fontWeight: "900", color: theme.text, lineHeight: 22 }} numberOfLines={2}>{title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: type === "tv" ? "rgba(34,197,94,0.14)" : "rgba(124,92,252,0.16)", borderWidth: 1, borderColor: type === "tv" ? "rgba(34,197,94,0.28)" : "rgba(124,92,252,0.3)" }}>
                    <Text style={{ color: theme.text, fontWeight: "900", fontSize: 11 }}>{type === "tv" ? "TV" : "MOVIE"}</Text>
                  </View>
                  {year ? (
                    <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ color: theme.muted, fontWeight: "800", fontSize: 11 }}>{year}</Text>
                    </View>
                  ) : null}
                  <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(250,204,21,0.12)", borderWidth: 1, borderColor: "rgba(250,204,21,0.26)" }}>
                    <Text style={{ color: theme.text, fontWeight: "900", fontSize: 11 }}>RATING {(item.vote_average ?? 0).toFixed(1)}</Text>
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
