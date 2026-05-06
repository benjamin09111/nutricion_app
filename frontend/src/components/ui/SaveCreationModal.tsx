"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface SaveCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  description: string;
  onDescriptionChange: (value: string) => void;
  title?: string;
  subtitle?: string;
  isSaving?: boolean;
}

export function SaveCreationModal({
  isOpen,
  onClose,
  onConfirm,
  description = "",
  onDescriptionChange,
  title = "Guardar creación",
  subtitle = "Añade una breve descripción para reconocer esta creación más tarde.",
  isSaving = false,
}: SaveCreationModalProps) {
  const { isDarkMode } = useTheme();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="space-y-2">
          <p className={cn("text-sm font-medium", isDarkMode ? "text-emerald-100/70" : "text-slate-600")}>{subtitle}</p>
          <Textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Ej: Plan inicial para paciente con foco en ordenar horarios y mejorar adherencia."
            className={cn(
              "min-h-[120px] rounded-xl border-slate-200 px-4 py-3",
              isDarkMode ? "bg-slate-950/70 focus:bg-slate-950" : "bg-slate-50 focus:bg-white",
            )}
            maxLength={240}
          />
          <div className="flex justify-end">
            <span className={cn("text-xs font-medium", isDarkMode ? "text-emerald-100/45" : "text-slate-400")}>
              {description?.trim().length ?? 0}/240
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            className={cn("rounded-xl", isDarkMode ? "border-emerald-400/12 text-emerald-50" : "border-slate-200 text-slate-600")}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            className={cn("rounded-xl", isDarkMode ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-slate-900 text-white hover:bg-slate-800")}
            onClick={onConfirm}
            disabled={isSaving}
          >
            {isSaving ? "Guardando..." : "Guardar creación"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
