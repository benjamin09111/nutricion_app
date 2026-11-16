import { api } from "@/lib/api";
import { isGuestMode } from "@/lib/demo-local-api";
import type { PersonalNoteTab } from "./types";

const LOCAL_STORAGE_KEY = "nutrinet_guest_personal_notes_v1";

function getLocalNotes(): PersonalNoteTab[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  const defaultNotes: PersonalNoteTab[] = [
    {
      id: "demo-note-1",
      title: "Notas clínicas",
      content:
        "• Recordar enviar pauta a paciente de las 15:00 hrs.\n• Revisar valores de laboratorio de perfil lipídico.\n• Control de seguimiento agendado para la próxima semana.",
      position: 0,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editable: true,
    },
  ];
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultNotes));
  } catch {}
  return defaultNotes;
}

function saveLocalNotes(notes: PersonalNoteTab[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

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
  async list(): Promise<PersonalNoteTab[]> {
    if (isGuestMode()) {
      return getLocalNotes();
    }
    try {
      return await readResponse<PersonalNoteTab[]>(await api.get("/personal-notes/tabs"));
    } catch (error) {
      if (isGuestMode()) {
        return getLocalNotes();
      }
      throw error;
    }
  },

  async create(title: string): Promise<PersonalNoteTab> {
    if (isGuestMode()) {
      const notes = getLocalNotes();
      const newTab: PersonalNoteTab = {
        id: `guest-note-${Date.now()}`,
        title: title.trim() || "Nueva nota",
        content: "",
        position: notes.length,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        editable: true,
      };
      notes.push(newTab);
      saveLocalNotes(notes);
      return newTab;
    }
    return readResponse<PersonalNoteTab>(
      await api.post("/personal-notes/tabs", { title }),
    );
  },

  async update(
    tab: Pick<PersonalNoteTab, "id" | "version">,
    changes: { title?: string; content?: string },
  ): Promise<PersonalNoteTab> {
    if (isGuestMode()) {
      const notes = getLocalNotes();
      const index = notes.findIndex((n) => n.id === tab.id);
      if (index === -1) {
        throw new Error("Nota no encontrada");
      }
      const existing = notes[index];
      const updated: PersonalNoteTab = {
        ...existing,
        title: changes.title !== undefined ? changes.title : existing.title,
        content: changes.content !== undefined ? changes.content : existing.content,
        version: existing.version + 1,
        updatedAt: new Date().toISOString(),
      };
      notes[index] = updated;
      saveLocalNotes(notes);
      return updated;
    }
    return readResponse<PersonalNoteTab>(
      await api.patch(`/personal-notes/tabs/${tab.id}`, {
        ...changes,
        expectedVersion: tab.version,
      }),
    );
  },

  async remove(id: string): Promise<{ success: true }> {
    if (isGuestMode()) {
      const notes = getLocalNotes().filter((n) => n.id !== id);
      saveLocalNotes(notes);
      return { success: true };
    }
    return readResponse<{ success: true }>(await api.delete(`/personal-notes/tabs/${id}`));
  },
};
