"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { saveCreation } from "@/lib/workflow";

type CreationType =
  | "DIET"
  | "RECIPE"
  | "RECETARIO"
  | "SHOPPING_LIST"
  | "DELIVERABLE"
  | "FAST_DELIVERABLE"
  | "PAUTAS";

interface SavePayload {
  name: string;
  type: CreationType;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  tags?: string[];
  description?: string;
}

export function usePlanSave() {
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(
    async (payload: SavePayload): Promise<boolean> => {
      setIsSaving(true);
      try {
        await saveCreation({
          name: payload.name,
          type: payload.type,
          content: payload.content,
          metadata: {
            ...(payload.description?.trim()
              ? { description: payload.description.trim() }
              : {}),
            ...payload.metadata,
          },
          tags: payload.tags,
        });
        toast.success("Creaci\u00f3n guardada correctamente.");
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error al guardar.",
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  return { save, isSaving };
}

export function usePlanReset(storageKey?: string) {
  const reset = useCallback(
    (onReset: () => void) => {
      onReset();
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
      toast.success("Contenido reiniciado.");
    },
    [storageKey],
  );

  return { reset };
}
