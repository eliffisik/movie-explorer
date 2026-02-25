import { useRef, useState } from "react";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../src/ui/theme";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "🎬",
    title: "Discover",
    desc: "Find movies & TV shows you'll love — search by title, browse by genre.",
  },
  {
    emoji: "🤖",
    title: "AI Picks",
    desc: "Get personalized recommendations powered by AI, tailored to your mood.",
  },
  {
    emoji: "⭐",
    title: "Save Favorites",
    desc: "Keep track of everything you want to watch or have loved.",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);

  async function finish() {
    await AsyncStorage.setItem("onboarding_done", "true");
    router.replace("/(tabs)");
  }

  function next() {
    if (current < SLIDES.length - 1) {
      const nextIndex = current + 1;
      scrollRef.current?.scrollTo({ x: width * nextIndex, animated: true });
      setCurrent(nextIndex);
    } else {
      finish();
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View
            key={i}
            style={{
              width,
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              gap: 20,
            }}
          >
            <Text style={{ fontSize: 80 }}>{slide.emoji}</Text>
            <Text style={{ fontSize: 32, fontWeight: "900", color: theme.text, textAlign: "center" }}>
              {slide.title}
            </Text>
            <Text style={{ fontSize: 16, color: theme.muted, textAlign: "center", lineHeight: 26, maxWidth: 300 }}>
              {slide.desc}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 }}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: i === current ? "#7c5cfc" : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 12 }}>
        <Pressable
          onPress={next}
          style={{
            paddingVertical: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(124,92,252,0.7)",
            backgroundColor: "rgba(124,92,252,0.22)",
            alignItems: "center",
          }}
        >
          <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }}>
            {current === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </Pressable>

        {current < SLIDES.length - 1 ? (
          <Pressable onPress={finish} style={{ alignItems: "center", paddingVertical: 8 }}>
            <Text style={{ color: theme.muted, fontWeight: "700" }}>Skip</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}