import { isAxiosError } from "axios";
import { api } from "./api";

export async function checkPreferencesExist(): Promise<boolean> {
  try {
    await api.get("/onboarding/me");
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return false;
    }

    throw error;
  }
}
