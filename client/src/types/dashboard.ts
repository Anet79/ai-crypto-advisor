export type PriceData = {
  usd: number;
  usd_24h_change: number;
};

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
};

export type MemeItem = {
  id: string;
  title: string;
  imageUrl: string;
  caption: string;
};

export type MemeData = string | MemeItem;

export type DashboardPreferences = {
  coins: string[];
  investorType: string;
  contentTypes: string[];
};

export type DashboardData = {
  preferences: DashboardPreferences;
  prices: Record<string, PriceData>;
  news: NewsItem[];
  insight: string;
  meme: MemeData;
};

export type FeedbackTarget = "prices" | "insight" | "news" | "meme";

export type FeedbackValue = "like" | "dislike";
