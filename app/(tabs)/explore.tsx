import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { theme } from "../../src/ui/theme";

// ✅ GERÇEK TELEFON (Expo Go) kullanıyorsan: PC IP'ni yaz
// Metro'da gördüğün IP ile aynı olur (ör: 192.168.1.202)
const API_BASE = "http://192.168.1.202:5050";

// Android emulator:  http://10.0.2.2:5050
// iOS simulator:    http://localhost:5050

type AiRec = {
  id: number;
  title: string;
  reason?: string;
};

export default function ExploreAI() {
  const [mood, setMood] = useState("dark fantasy like Game of Thrones");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AiRec[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function recommend() {
    try {
      setLoading(true);
      setError(null);
      setItems([]);

      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          type: "tv",      // "movie" da yapabilirsin
          region: "TR",    // backend bunu kullanıyorsa
        }),
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
    <View style={{ flex: 1, backgroundColor: theme.bg, padding: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: "900", color: theme.text }}>
        AI Explore
      </Text>
      <Text style={{ color: theme.muted, marginTop: 6 }}>
        Describe your mood and get recommendations.
      </Text>

      <View
        style={{
          marginTop: 14,
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
          placeholder="e.g. cozy comedy, dark thriller..."
          placeholderTextColor={theme.muted}
          style={{ color: theme.text, fontSize: 16 }}
        />
      </View>

      <Pressable
        onPress={recommend}
        style={{
          marginTop: 12,
          paddingVertical: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(124,92,252,0.7)",
          backgroundColor: "rgba(124,92,252,0.22)",
          alignItems: "center",
        }}
      >
        <Text style={{ color: theme.text, fontWeight: "900" }}>
          Get recommendations
        </Text>
      </Pressable>

      {loading ? (
        <View style={{ marginTop: 14 }}>
          <ActivityIndicator />
        </View>
      ) : null}

      {error ? (
        <Text style={{ marginTop: 12, color: theme.danger }}>{error}</Text>
      ) : null}

      <View style={{ marginTop: 16, gap: 10 }}>
        {items.map((x) => (
          <View
            key={x.id}
            style={{
              padding: 12,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.card,
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }}>
              {x.title}
            </Text>
            {x.reason ? (
              <Text style={{ color: theme.muted, marginTop: 6 }}>
                {x.reason}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
