"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";

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
  description,
  onDescriptionChange,
  title = "Guardar creación",
  subtitle = "Añade una breve descripción para reconocer esta creación más tarde.",
  isSaving = false,
}: SaveCreationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">{subtitle}</p>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Ej: Plan inicial para paciente con foco en ordenar horarios y mejorar adherencia."
            className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:bg-white"
            maxLength={240}
          />
          <div className="flex justify-end">
            <span className="text-xs font-medium text-slate-400">
              {description.trim().length}/240
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-600"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
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
