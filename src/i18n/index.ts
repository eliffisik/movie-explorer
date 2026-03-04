import { getLocales } from "expo-localization";

const deviceLang = getLocales()[0]?.languageCode ?? "en";
export const lang: "tr" | "en" = deviceLang === "tr" ? "tr" : "en";

const translations = {
  en: {
    // Tabs
    search: "Search",
    favorites: "Favorites",
    explore: "Explore",

    // Search screen
    searchPlaceholder: "Search movies & TV shows...",
    searchEmpty: "Search for a movie or TV show above.",

    // Favorites screen
    favoritesTitle: "Favorites",
    favoritesSubtitle: "Your saved movies & TV shows",
    favoritesEmpty: "No favorites yet",
    favoritesEmptyDesc: "Movies and TV shows you save will appear here.",
    favoritesBrowse: "Browse Movies",

    // Explore screen
    exploreTitle: "What do you want to watch?",
    exploreSubtitle: "Pick a genre → set your mood → get 5 picks.",
    exploreGenre: "Genre",
    exploreSelectGenre: "Select genre",
    exploreMood: "Mood (optional)",
    exploreMoodSelected: (n: number) => `Mood (${n} selected)`,
    exploreButton: "Get Recommendations",
    exploreEmpty: "Select a genre and tap Get Recommendations.",

    // Moods
    moodHappy: "😄 Happy",
    moodEmotional: "😢 Emotional",
    moodTense: "😰 Tense",
    moodThought: "🧠 Thought-provoking",
    moodCozy: "😌 Cozy",
    moodExciting: "⚡ Exciting",
    moodDark: "🌙 Dark",
    moodFunny: "😂 Funny",

    // Onboarding
    onboardingNext: "Next",
    onboardingSkip: "Skip",
    onboardingStart: "Get Started",
    onboarding1Title: "Discover",
    onboarding1Desc: "Find movies & TV shows you'll love — search by title, browse by genre.",
    onboarding2Title: "AI Picks",
    onboarding2Desc: "Get personalized recommendations powered by AI, tailored to your mood.",
    onboarding3Title: "Save Favorites",
    onboarding3Desc: "Keep track of everything you want to watch or have loved.",

    // Detail
    detailOverview: "Overview",
    detailFavorite: "Add to Favorites",
    detailFavoriteRemove: "Remove from Favorites",

    // Errors
    errorTryAgain: "Try Again",
    detailWhere: "Where to watch",
detailRegion: "Region",
detailSubscription: "Subscription",
detailRent: "Rent",
detailBuy: "Buy",
detailNoProviders: "No providers found for this region.",
detailShowingFor: (r: string) => `Showing providers for ${r}`,
detailOpenTmdb: "Open on TMDB",
  },
  tr: {
    // Tabs
    search: "Ara",
    favorites: "Favoriler",
    explore: "Keşfet",

    // Search screen
    searchPlaceholder: "Film veya dizi ara...",
    searchEmpty: "Yukarıdan film veya dizi arayabilirsin.",

    // Favorites screen
    favoritesTitle: "Favoriler",
    favoritesSubtitle: "Kaydettiğin film ve diziler",
    favoritesEmpty: "Henüz favori yok",
    favoritesEmptyDesc: "Kaydettiğin film ve diziler burada görünecek.",
    favoritesBrowse: "Filmlere Göz At",

    // Explore screen
    exploreTitle: "Ne izlemek istersin?",
    exploreSubtitle: "Tür seç → mood ekle → 5 öneri al.",
    exploreGenre: "Tür",
    exploreSelectGenre: "Tür seç",
    exploreMood: "Mood (opsiyonel)",
    exploreMoodSelected: (n: number) => `Mood (${n} seçili)`,
    exploreButton: "Öneri Getir",
    exploreEmpty: "Bir tür seçip \"Öneri Getir\"e bas.",

    // Moods
    moodHappy: "😄 Neşeli",
    moodEmotional: "😢 Hüzünlü",
    moodTense: "😰 Gerilimli",
    moodThought: "🧠 Düşündürücü",
    moodCozy: "😌 Rahatlatıcı",
    moodExciting: "⚡ Heyecanlı",
    moodDark: "🌙 Karanlık",
    moodFunny: "😂 Komik",

    // Onboarding
    onboardingNext: "İleri",
    onboardingSkip: "Geç",
    onboardingStart: "Başla",
    onboarding1Title: "Keşfet",
    onboarding1Desc: "Seveceğin film ve dizileri bul — başlıkla ara, türe göre keşfet.",
    onboarding2Title: "AI Önerileri",
    onboarding2Desc: "Ruh haline göre kişiselleştirilmiş AI destekli öneriler al.",
    onboarding3Title: "Favorilere Ekle",
    onboarding3Desc: "İzlemek istediklerini ve sevdiklerini kaydet.",

    // Detail
    detailOverview: "Özet",
    detailFavorite: "Favorilere Ekle",
    detailFavoriteRemove: "Favorilerden Çıkar",

    // Errors
    errorTryAgain: "Tekrar Dene",
    detailWhere: "Nerede izlenir",
detailRegion: "Bölge",
detailSubscription: "Abonelik",
detailRent: "Kirala",
detailBuy: "Satın Al",
detailNoProviders: "Bu bölge için platform bulunamadı.",
detailShowingFor: (r: string) => `${r} için platformlar gösteriliyor`,
detailOpenTmdb: "TMDB'de Aç",
  },
};

export const t = translations[lang];