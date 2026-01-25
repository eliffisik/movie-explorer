import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "settings.region";

export async function getRegion() {
  const val = await AsyncStorage.getItem(KEY);
  return val || "US";
}

export async function setRegion(region: string) {
  await AsyncStorage.setItem(KEY, region.toUpperCase());
}
