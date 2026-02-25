import { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getFavorites, toggleFavorite, FavItem } from "../../src/storage/favorites";
import { posterUrl } from "../../src/utils/image";
import { theme } from "../../src/ui/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function FavoritesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<FavItem[]>([]);

  const load = async () => {
    const favs = await getFavorites();
    setItems(favs);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <FlatList
        data={items}
        keyExtractor={(x) => `${x.type}-${x.id}`}
        contentContainerStyle={{ padding: 16, paddingBottom: 28, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: theme.text }}>
              Favorites
            </Text>
            <Text style={{ color: theme.muted, marginTop: 6 }}>
              Your saved movies & TV shows
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 16 }}>
            <Text style={{ fontSize: 64 }}>⭐</Text>
            <Text style={{ color: theme.text, fontWeight: "900", fontSize: 20, textAlign: "center" }}>
              No favorites yet
            </Text>
            <Text style={{ color: theme.muted, fontSize: 15, textAlign: "center", maxWidth: 260, lineHeight: 22 }}>
              Movies and TV shows you save will appear here.
            </Text>
            <Pressable
              onPress={() => router.push("/")}
              style={{
                marginTop: 8,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(124,92,252,0.7)",
                backgroundColor: "rgba(124,92,252,0.22)",
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "900" }}>Browse Movies</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => {
          const img = posterUrl(item.poster_path);
          return (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/detail",
                    params: { id: String(item.id), type: item.type },
                  })
                }
                style={{
                  position: "relative",
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
                {/* Poster */}
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

                {/* Info */}
                <View style={{ flex: 1, gap: 6 }}>
                  <Text
                    style={{ fontSize: 16, fontWeight: "900", color: theme.text }}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text style={{ color: theme.muted }}>
                    {item.type.toUpperCase()} {item.year ? `• ${item.year}` : ""}
                  </Text>
                  <Text style={{ color: theme.muted }}>
                    ⭐ {(item.vote_average ?? 0).toFixed(1)}
                  </Text>
                </View>

                {/* Remove star */}
                <Pressable
                  onPress={async (e) => {
                    e.stopPropagation();
                    const next = await toggleFavorite(item);
                    setItems(next);
                  }}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: "rgba(0,0,0,0.35)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 18, color: theme.accent }}>★</Text>
                </Pressable>
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}