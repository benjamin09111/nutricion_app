import { api } from "@/lib/api";
import type { PersonalNoteTab } from "./types";

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      typeof data?.message === "string"
        ? data.message
        : Array.isArray(data?.message)
          ? data.message.join(" ")
          : "No se pudo completar la operación.",
    );
    Object.assign(error, { status: response.status });
    throw error;
  }
  return data as T;
}

export const personalNotesService = {
  async list() {
    return readResponse<PersonalNoteTab[]>(await api.get("/personal-notes/tabs"));
  },

  async create(title: string) {
    return readResponse<PersonalNoteTab>(
      await api.post("/personal-notes/tabs", { title }),
    );
  },

  async update(
    tab: Pick<PersonalNoteTab, "id" | "version">,
    changes: { title?: string; content?: string },
  ) {
    return readResponse<PersonalNoteTab>(
      await api.patch(`/personal-notes/tabs/${tab.id}`, {
        ...changes,
        expectedVersion: tab.version,
      }),
    );
  },

  async remove(id: string) {
    return readResponse<{ success: true }>(await api.delete(`/personal-notes/tabs/${id}`));
  },
};
