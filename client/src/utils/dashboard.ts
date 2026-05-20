import type { DashboardData, MemeData, MemeItem } from "../types/dashboard";

export function getPreferredCoins(dashboard: DashboardData): string[] {
  if (dashboard.preferences.coins.length > 0) {
    return dashboard.preferences.coins;
  }

  return Object.keys(dashboard.prices);
}

export function normalizeMeme(meme: MemeData): MemeItem {
  if (typeof meme === "string") {
    return {
      id: "meme-fallback",
      title: "Crypto Meme",
      imageUrl: "",
      caption: meme,
    };
  }

  return {
    id: meme.id,
    title: meme.title,
    imageUrl: meme.imageUrl,
    caption: meme.caption || "No meme available right now.",
  };
}

export function getMemeText(meme: MemeData): string {
  return normalizeMeme(meme).caption;
}
