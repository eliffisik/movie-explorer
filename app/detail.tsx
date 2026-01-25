import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { tmdbGet } from "@/src/api/tmdbClient";
import { posterUrl } from "@/src/utils/image";
import { getRegion, setRegion } from "@/src/storage/settings";

type Params = { id?: string; type?: "movie" | "tv" };

type Detail = {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
};

type Provider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
};

type WatchProvidersResponse = {
  results: Record<
    string,
    {
      link?: string;
      flatrate?: Provider[];
      rent?: Provider[];
      buy?: Provider[];
    }
  >;
};

function providerLogo(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w92${path}` : null;
}

function ProviderGrid({
  title,
  items,
}: {
  title: string;
  items: Provider[];
}) {
  if (!items?.length) return null;

  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ fontSize: 16, fontWeight: "900" }}>{title}</Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 10,
        }}
      >
        {items.map((p) => {
          const logo = providerLogo(p.logo_path);

          return (
            <View
              key={p.provider_id}
              style={{
                width: 68,
                alignItems: "center",
                gap: 6,
                padding: 8,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  overflow: "hidden",
                  backgroundColor: "#f3f4f6",
                }}
              >
                {logo ? (
                  <Image
                    source={{ uri: logo }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : null}
              </View>

              <Text
                numberOfLines={2}
                style={{
                  fontSize: 11,
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                {p.provider_name}
              </Text>
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
  const [providerLink, setProviderLink] = useState<string | undefined>(
    undefined
  );

  const [error, setError] = useState<string | null>(null);

  // Load saved region once
  useEffect(() => {
    getRegion()
      .then(setRegionState)
      .catch(() => setRegionState("US"));
  }, []);

  // Fetch detail + watch providers whenever id/type/region changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        if (!id || !type) throw new Error("Missing params");

        const [detail, wp] = await Promise.all([
          tmdbGet<Detail>(`/${type}/${id}`, { language: "en-US" }),
          tmdbGet<WatchProvidersResponse>(`/${type}/${id}/watch/providers`),
        ]);

        if (cancelled) return;

        setItem(detail);

        const byRegion = wp.results?.[region];

        setProviderLink(byRegion?.link);

        // ✅ NEW: show all three categories
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
    return () => {
      cancelled = true;
    };
  }, [id, type, region]);

  const title = item?.title ?? item?.name ?? "Detail";

  const regionPicker = useMemo(() => {
    // MVP: simple region options
    const options = ["US", "TR", "DE", "GB"];
    return (
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {options.map((r) => (
          <Text
            key={r}
            onPress={async () => {
              setRegionState(r);
              await setRegion(r);
            }}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: r === region ? "#111827" : "#e5e7eb",
              backgroundColor: r === region ? "#111827" : "transparent",
              color: r === region ? "white" : "#111827",
              fontWeight: "700",
            }}
          >
            {r}
          </Text>
        ))}
      </View>
    );
  }, [region]);

  const noProviders =
    flatrateProviders.length === 0 &&
    rentProviders.length === 0 &&
    buyProviders.length === 0;

  return (
    <>
      <Stack.Screen options={{ title: "Detail" }} />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "800" }}>Error</Text>
          <Text style={{ marginTop: 8 }}>{error}</Text>
        </View>
      ) : !item ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={{
                width: 120,
                height: 180,
                borderRadius: 14,
                overflow: "hidden",
                backgroundColor: "#f3f4f6",
              }}
            >
              {posterUrl(item.poster_path, "w342") ? (
                <Image
                  source={{ uri: posterUrl(item.poster_path, "w342")! }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : null}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: "900" }}>{title}</Text>
              <Text style={{ opacity: 0.7, marginTop: 6 }}>
                ⭐ {item.vote_average?.toFixed(1)}
              </Text>
              <Text style={{ opacity: 0.7, marginTop: 6 }}>
                {(item.release_date ?? item.first_air_date ?? "").slice(0, 4)}
              </Text>

              <Text style={{ marginTop: 10, fontWeight: "800" }}>Region</Text>
              {regionPicker}
            </View>
          </View>

          <Text style={{ marginTop: 16, fontSize: 16, lineHeight: 22 }}>
            {item.overview || "No overview."}
          </Text>

          <Text style={{ marginTop: 20, fontSize: 18, fontWeight: "900" }}>
            Where to watch
          </Text>
          <Text style={{ opacity: 0.65, marginTop: 4 }}>
            Showing providers for {region}
          </Text>

          {/* ✅ NEW: show all categories */}
          <ProviderGrid title="Subscription" items={flatrateProviders} />
          <ProviderGrid title="Rent" items={rentProviders} />
          <ProviderGrid title="Buy" items={buyProviders} />

          {noProviders ? (
            <Text style={{ marginTop: 10, opacity: 0.75 }}>
              No providers found for this region.
            </Text>
          ) : null}

          {providerLink ? (
            <Text style={{ marginTop: 12, opacity: 0.6 }}>
              TMDB link available (we can add an “Open” button next).
            </Text>
          ) : null}
        </ScrollView>
      )}
    </>
  );
}
