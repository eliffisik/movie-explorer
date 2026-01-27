import AsyncStorage from "@react-native-async-storage/async-storage";

export type FavItem = {
  id: number;
  type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  vote_average?: number;
  year?: string;
};

const KEY = "favorites.v1";

export async function getFavorites(): Promise<FavItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FavItem[];
  } catch {
    return [];
  }
}

export async function isFavorite(id: number, type: "movie" | "tv") {
  const list = await getFavorites();
  return list.some((x) => x.id === id && x.type === type);
}

export async function toggleFavorite(item: FavItem): Promise<FavItem[]> {
  const list = await getFavorites();
  const exists = list.some((x) => x.id === item.id && x.type === item.type);

  const next = exists
    ? list.filter((x) => !(x.id === item.id && x.type === item.type))
    : [item, ...list];

  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
