import { api } from "./api";
import type {
  DashboardData,
  FeedbackTarget,
  FeedbackValue,
} from "../types/dashboard";

export async function getDashboard(): Promise<DashboardData> {
  const response = await api.get<DashboardData>("/dashboard");
  return response.data;
}

export async function sendDashboardFeedback(
  target: FeedbackTarget,
  value: FeedbackValue,
  itemId?: string
): Promise<void> {
  await api.post("/feedback", {
    section: target,
    value,
    itemId,
  });
}