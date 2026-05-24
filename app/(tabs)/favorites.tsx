import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getFavorites, toggleFavorite, FavItem } from "../../src/storage/favorites";
import { getWatchItems, removeWatchStatus, WatchItem } from "../../src/storage/watchlist";
import { posterUrl } from "../../src/utils/image";
import { theme } from "../../src/ui/theme";
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

export default function FavoritesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<FavItem[]>([]);
  const [watchItems, setWatchItems] = useState<WatchItem[]>([]);
  const [section, setSection] = useState<"favorites" | "watchlist" | "watched">("favorites");
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");

  const baseItems =
    section === "favorites"
      ? items
      : watchItems.filter((item) => item.status === section);
  const filteredItems = filter === "all" ? baseItems : baseItems.filter((item) => item.type === filter);

  const load = async () => {
    const [favs, savedWatchItems] = await Promise.all([getFavorites(), getWatchItems()]);
    setItems(favs);
    setWatchItems(savedWatchItems);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <FlatList
        data={filteredItems}
        keyExtractor={(x) => `${x.type}-${x.id}`}
        contentContainerStyle={{ padding: 16, paddingBottom: 28, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 16, borderRadius: 24, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 16, overflow: "hidden", ...cardShadow }}>
            <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, backgroundColor: theme.gold }} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: theme.text }}>
                  {t.libraryTitle}
                </Text>
                <Text style={{ color: theme.muted, marginTop: 6 }}>
                  {t.librarySubtitle}
                </Text>
              </View>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(250,204,21,0.14)", borderWidth: 1, borderColor: "rgba(250,204,21,0.35)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="star" size={24} color={theme.gold} />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              {([
                { value: "favorites", label: t.libraryFavorites, icon: "star" },
                { value: "watchlist", label: t.libraryWatchlist, icon: "bookmark" },
                { value: "watched", label: t.libraryWatched, icon: "checkmark-circle" },
              ] as const).map((v) => {
                const active = section === v.value;
                return (
                  <Pressable
                    key={v.value}
                    onPress={() => setSection(v.value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? "rgba(139,92,246,0.7)" : theme.border,
                      backgroundColor: active ? "rgba(139,92,246,0.2)" : theme.card,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Ionicons name={v.icon} size={14} color={active ? theme.text : theme.muted} />
                    <Text style={{ color: active ? theme.text : theme.muted, fontWeight: "900" }}>{v.label}</Text>
                  </Pressable>
                );
              })}
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
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? "rgba(250,204,21,0.55)" : theme.border,
                      backgroundColor: active ? "rgba(250,204,21,0.14)" : theme.card,
                    }}
                  >
                    <Text style={{ color: active ? theme.text : theme.muted, fontWeight: "900" }}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 16 }}>
            <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: "rgba(250,204,21,0.13)", borderWidth: 1, borderColor: "rgba(250,204,21,0.3)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="star-outline" size={34} color={theme.gold} />
            </View>
            <Text style={{ color: theme.text, fontWeight: "900", fontSize: 20, textAlign: "center" }}>
              {section === "favorites" ? t.favoritesEmpty : section === "watchlist" ? t.libraryWatchlistEmpty : t.libraryWatchedEmpty}
            </Text>
            <Text style={{ color: theme.muted, fontSize: 15, textAlign: "center", maxWidth: 260, lineHeight: 22 }}>
              {section === "favorites" ? t.favoritesEmptyDesc : t.libraryWatchEmptyDesc}
            </Text>
            <Pressable
              onPress={() => router.push("/")}
              style={{
                marginTop: 8,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(139,92,246,0.7)",
                backgroundColor: "rgba(139,92,246,0.22)",
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "900" }}>{t.favoritesBrowse}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => {
          const img = posterUrl(item.poster_path);
          return (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()}>
              <Pressable
                onPress={() => router.push({ pathname: "/detail", params: { id: String(item.id), type: item.type } })}
                style={{
                  position: "relative",
                  padding: 12,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                  flexDirection: "row",
                  gap: 12,
                  alignItems: "center",
                  ...cardShadow,
                }}
              >
                <View style={{ width: 62, height: 92, borderRadius: 12, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)" }}>
                  {img ? <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} /> : null}
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: theme.text }} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={{ color: theme.muted }}>
                    {item.type.toUpperCase()} {item.year ? `• ${item.year}` : ""}
                  </Text>
                  <Text style={{ color: theme.muted }}>
                    ⭐ {(item.vote_average ?? 0).toFixed(1)}
                  </Text>
                  {section !== "favorites" ? (
                    <Text style={{ color: section === "watchlist" ? theme.accent2 : "#60A5FA", fontWeight: "900" }}>
                      {section === "watchlist" ? t.libraryInWatchlist : t.libraryWatched}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={async (e) => {
                    e.stopPropagation();
                    if (section === "favorites") {
                      const next = await toggleFavorite(item);
                      setItems(next);
                    } else {
                      const next = await removeWatchStatus(item.id, item.type);
                      setWatchItems(next);
                    }
                  }}
                  style={{
                    width: 38, height: 38, borderRadius: 12, borderWidth: 1,
                    borderColor: theme.border, backgroundColor: "rgba(8,11,18,0.78)",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Ionicons name={section === "favorites" ? "star" : "close"} size={18} color={section === "favorites" ? theme.gold : theme.text} />
                </Pressable>
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}
