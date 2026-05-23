import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Image, Pressable,
  ScrollView, Text, View, Linking,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { tmdbGet } from "../src/api/tmdbClient";
import { posterUrl } from "../src/utils/image";
import { getRegion, setRegion } from "../src/storage/settings";
import { theme } from "../src/ui/theme";
import { t } from "../src/i18n";
import { toggleFavorite, getFavorites } from "../src/storage/favorites";

type Params = { id?: string; type?: "movie" | "tv" };

type Detail = {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres?: { id: number; name: string }[];
};

type Provider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
};

type WatchProvidersResponse = {
  results: Record<string, {
    link?: string;
    flatrate?: Provider[];
    rent?: Provider[];
    buy?: Provider[];
  }>;
};

type CastMember = {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
};

type CreditsResponse = {
  cast: CastMember[];
};

type Video = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
};

type VideosResponse = {
  results: Video[];
};

function providerLogo(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w92${path}` : null;
}

function backdropUrl(path: string | null | undefined) {
  return path ? `https://image.tmdb.org/t/p/w780${path}` : null;
}

function profileUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w185${path}` : null;
}

function youtubeUrl(video: Video | null) {
  return video ? `https://www.youtube.com/watch?v=${video.key}` : null;
}

function ProviderRow({ title, items }: { title: string; items: Provider[] }) {
  if (!items?.length) return null;
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{title}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
        {items.map((p) => {
          const logo = providerLogo(p.logo_path);
          return (
            <View key={p.provider_id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card }}>
              <View style={{ width: 26, height: 26, borderRadius: 8, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)" }}>
                {logo ? <Image source={{ uri: logo }} style={{ width: "100%", height: "100%" }} /> : null}
              </View>
              <Text style={{ color: theme.text, fontWeight: "800" }}>{p.provider_name}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function DetailScreen() {
  const { id, type } = useLocalSearchParams<Params>();
  const [region, setRegionState] = useState("US");
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<Detail | null>(null);
  const [flatrateProviders, setFlatrateProviders] = useState<Provider[]>([]);
  const [rentProviders, setRentProviders] = useState<Provider[]>([]);
  const [buyProviders, setBuyProviders] = useState<Provider[]>([]);
  const [providerLink, setProviderLink] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [trailer, setTrailer] = useState<Video | null>(null);

  useEffect(() => {
    getRegion().then(setRegionState).catch(() => setRegionState("US"));
  }, []);

  // Favori durumunu kontrol et
  useEffect(() => {
    if (!id || !type) return;
    getFavorites().then((favs) => {
      setIsFav(favs.some((f) => f.id === Number(id) && f.type === type));
    });
  }, [id, type]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (!id || !type) throw new Error("Missing params");
        const [detail, wp, credits, videos] = await Promise.all([
          tmdbGet<Detail>(`/${type}/${id}`, { language: "en-US" }),
          tmdbGet<WatchProvidersResponse>(`/${type}/${id}/watch/providers`),
          tmdbGet<CreditsResponse>(`/${type}/${id}/credits`, { language: "en-US" }),
          tmdbGet<VideosResponse>(`/${type}/${id}/videos`, { language: "en-US" }),
        ]);
        if (cancelled) return;
        setItem(detail);
        setCast((credits.cast || []).slice(0, 10));
        setTrailer(
          (videos.results || []).find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
          (videos.results || []).find((v) => v.site === "YouTube" && v.type === "Trailer") ||
          null
        );
        const byRegion = wp.results?.[region];
        setProviderLink(byRegion?.link);
        setFlatrateProviders(byRegion?.flatrate ?? []);
        setRentProviders(byRegion?.rent ?? []);
        setBuyProviders(byRegion?.buy ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Detail error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, type, region]);

  const title = item?.title ?? item?.name ?? "Detail";

  const regionPicker = useMemo(() => {
    const options = ["US", "TR", "DE", "GB"];
    return (
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {options.map((r) => (
          <Pressable
            key={r}
            onPress={async () => { setRegionState(r); await setRegion(r); }}
            style={{
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
              borderColor: r === region ? "rgba(124,92,252,0.7)" : theme.border,
              backgroundColor: r === region ? "rgba(124,92,252,0.22)" : theme.card,
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "900" }}>{r}</Text>
          </Pressable>
        ))}
      </View>
    );
  }, [region]);

  const noProviders = flatrateProviders.length === 0 && rentProviders.length === 0 && buyProviders.length === 0;
  const hero = backdropUrl(item?.backdrop_path) || posterUrl(item?.poster_path ?? null, "w500");
  const trailerLink = youtubeUrl(trailer);
  const runtimeLabel = item?.runtime ? `${item.runtime} min` : null;
  const seasonLabel = item?.number_of_seasons ? `${item.number_of_seasons} season${item.number_of_seasons === 1 ? "" : "s"}` : null;
  const episodeLabel = item?.number_of_episodes ? `${item.number_of_episodes} episodes` : null;

  return (
    <>
      <Stack.Screen options={{
        title,
        headerRight: () => item ? (
          <Pressable
            onPress={async () => {
              const year = (item.release_date ?? item.first_air_date ?? "").slice(0, 4);
              const next = await toggleFavorite({
                id: item.id,
                type: type as "movie" | "tv",
                title,
                poster_path: item.poster_path,
                vote_average: item.vote_average,
                year,
              });
              setIsFav(next.some((f) => f.id === item.id && f.type === type));
            }}
            style={{ marginRight: 8, padding: 6 }}
          >
            <Text style={{ fontSize: 24, color: isFav ? theme.accent : theme.text }}>
              {isFav ? "★" : "☆"}
            </Text>
          </Pressable>
        ) : null,
      }} />

      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: theme.text }}>Error</Text>
            <Text style={{ marginTop: 8, color: theme.muted }}>{error}</Text>
          </View>
        ) : !item ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: theme.muted }}>Not found</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
            {/* Hero */}
            <View style={{ height: 280, backgroundColor: theme.card }}>
              {hero ? (
                <Image source={{ uri: hero }} style={{ width: "100%", height: "100%", opacity: 0.85 }} />
              ) : null}
              <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 140, backgroundColor: "rgba(11,15,25,0.85)" }} />
            </View>

            {/* Body */}
            <View style={{ padding: 16, marginTop: -40 }}>
              <View style={{ borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, padding: 14 }}>
                <Text style={{ fontSize: 22, fontWeight: "900", color: theme.text }}>{title}</Text>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(124,92,252,0.18)", borderWidth: 1, borderColor: "rgba(124,92,252,0.35)" }}>
                    <Text style={{ color: theme.text, fontWeight: "900" }}>⭐ {item.vote_average?.toFixed(1)}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ color: theme.text, fontWeight: "800" }}>
                      {(item.release_date ?? item.first_air_date ?? "").slice(0, 4)}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ color: theme.text, fontWeight: "800" }}>{type?.toUpperCase()}</Text>
                  </View>
                  {type === "movie" && runtimeLabel ? (
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ color: theme.text, fontWeight: "800" }}>{runtimeLabel}</Text>
                    </View>
                  ) : null}
                  {type === "tv" && seasonLabel ? (
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ color: theme.text, fontWeight: "800" }}>{seasonLabel}</Text>
                    </View>
                  ) : null}
                  {type === "tv" && episodeLabel ? (
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ color: theme.text, fontWeight: "800" }}>{episodeLabel}</Text>
                    </View>
                  ) : null}
                </View>

                {item.genres?.length ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    {item.genres.map((genre) => (
                      <View key={genre.id} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(124,92,252,0.14)", borderWidth: 1, borderColor: "rgba(124,92,252,0.28)" }}>
                        <Text style={{ color: theme.text, fontWeight: "800", fontSize: 12 }}>{genre.name}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <Text style={{ marginTop: 12, color: theme.muted, lineHeight: 21 }}>
                  {item.overview || "No overview."}
                </Text>

                {trailerLink ? (
                  <Pressable
                    onPress={async () => {
                      const can = await Linking.canOpenURL(trailerLink);
                      if (can) await Linking.openURL(trailerLink);
                    }}
                    style={{
                      marginTop: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1,
                      borderColor: "rgba(124,92,252,0.7)", backgroundColor: "rgba(124,92,252,0.22)",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: theme.text, fontWeight: "900" }}>Watch Trailer</Text>
                  </Pressable>
                ) : null}

                {/* Favori butonu */}
                <Pressable
                  onPress={async () => {
                    const year = (item.release_date ?? item.first_air_date ?? "").slice(0, 4);
                    const next = await toggleFavorite({
                      id: item.id,
                      type: type as "movie" | "tv",
                      title,
                      poster_path: item.poster_path,
                      vote_average: item.vote_average,
                      year,
                    });
                    setIsFav(next.some((f) => f.id === item.id && f.type === type));
                  }}
                  style={{
                    marginTop: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1,
                    borderColor: isFav ? "rgba(252,92,124,0.6)" : "rgba(124,92,252,0.7)",
                    backgroundColor: isFav ? "rgba(252,92,124,0.15)" : "rgba(124,92,252,0.22)",
                    alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 18, color: isFav ? "#fc5c7c" : theme.text }}>
                    {isFav ? "★" : "☆"}
                  </Text>
                  <Text style={{ color: isFav ? "#fc5c7c" : theme.text, fontWeight: "900" }}>
                    {isFav ? t.detailFavoriteRemove : t.detailFavorite}
                  </Text>
                </Pressable>

                <Text style={{ marginTop: 14, color: theme.text, fontWeight: "900" }}>
                  {t.detailRegion}
                </Text>
                {regionPicker}
              </View>

              {cast.length > 0 ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: theme.text }}>Cast</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 10 }}>
                    {cast.map((person) => {
                      const img = profileUrl(person.profile_path);
                      return (
                        <View key={person.id} style={{ width: 112, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, overflow: "hidden" }}>
                          <View style={{ height: 150, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                            {img ? <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} /> : <Text style={{ color: theme.muted }}>No Image</Text>}
                          </View>
                          <View style={{ padding: 10 }}>
                            <Text style={{ color: theme.text, fontWeight: "900", fontSize: 13 }} numberOfLines={2}>{person.name}</Text>
                            {person.character ? (
                              <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4 }} numberOfLines={2}>{person.character}</Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: theme.text }}>{t.detailWhere}</Text>
                <Text style={{ color: theme.muted, marginTop: 4 }}>{t.detailShowingFor(region)}</Text>

                <ProviderRow title={t.detailSubscription} items={flatrateProviders} />
                <ProviderRow title={t.detailRent} items={rentProviders} />
                <ProviderRow title={t.detailBuy} items={buyProviders} />

                {noProviders ? (
                  <Text style={{ marginTop: 10, color: theme.muted }}>{t.detailNoProviders}</Text>
                ) : null}

                {providerLink ? (
                  <Pressable
                    onPress={async () => {
                      const can = await Linking.canOpenURL(providerLink);
                      if (can) await Linking.openURL(providerLink);
                    }}
                    style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: "rgba(124,92,252,0.7)", backgroundColor: "rgba(124,92,252,0.22)", alignSelf: "flex-start" }}
                  >
                    <Text style={{ color: theme.text, fontWeight: "900" }}>{t.detailOpenTmdb}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}
