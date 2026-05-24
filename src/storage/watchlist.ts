import AsyncStorage from "@react-native-async-storage/async-storage";

export type WatchStatus = "watchlist" | "watched";

export type WatchItem = {
  id: number;
  type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  vote_average?: number;
  year?: string;
  status: WatchStatus;
  updatedAt: string;
};

const KEY = "watchlist.v1";

export async function getWatchItems(): Promise<WatchItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WatchItem[];
  } catch {
    return [];
  }
}

export async function getWatchStatus(id: number, type: "movie" | "tv") {
  const items = await getWatchItems();
  return items.find((item) => item.id === id && item.type === type)?.status ?? null;
}

export async function setWatchStatus(
  item: Omit<WatchItem, "status" | "updatedAt">,
  status: WatchStatus
) {
  const items = await getWatchItems();
  const nextItem: WatchItem = {
    ...item,
    status,
    updatedAt: new Date().toISOString(),
  };
  const next = [
    nextItem,
    ...items.filter((x) => !(x.id === item.id && x.type === item.type)),
  ];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function removeWatchStatus(id: number, type: "movie" | "tv") {
  const items = await getWatchItems();
  const next = items.filter((item) => !(item.id === id && item.type === type));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
