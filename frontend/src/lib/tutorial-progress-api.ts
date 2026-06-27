import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import {
  normalizeTutorialStore,
  type TutorialPersistedProgress,
  type TutorialStore,
} from "@/lib/tutorials";

type AuthMeResponse = {
  user?: {
    tutorialProgress?: TutorialStore | null;
  };
};

type UpdateTutorialProgressBody = {
  tutorialId: string;
  progress: TutorialPersistedProgress;
  hasSeenTutorialCoachmark?: boolean;
};

export async function loadTutorialStoreFromServer(): Promise<TutorialStore | null> {
  const token = getAuthToken();
  if (!token) return null;

  const response = await fetchApi("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as AuthMeResponse;
  return normalizeTutorialStore(data.user?.tutorialProgress ?? null);
}

export async function saveTutorialProgressToServer(
  body: UpdateTutorialProgressBody,
): Promise<TutorialStore | null> {
  const token = getAuthToken();
  if (!token) return null;

  const response = await fetchApi("/auth/me/tutorial-progress", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as TutorialStore;
  return normalizeTutorialStore(data);
}
