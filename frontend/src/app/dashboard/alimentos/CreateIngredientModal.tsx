"use client";

import { Modal } from "@/components/ui/Modal";
import { Ingredient } from "@/features/foods";
import CreateIngredientForm from "./CreateIngredientForm";

type IngredientAssignmentDraft =
  | { mode: "none" }
  | { mode: "existing"; groupId: string }
  | { mode: "new"; groupName: string };

interface CreateIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ingredient?: Ingredient, assignment?: IngredientAssignmentDraft) => void;
  availableTags?: string[];
  availableGroups?: { id: string; name: string }[];
  enableGroupAssignment?: boolean;
}

export default function CreateIngredientModal({
  isOpen,
  onClose,
  onSuccess,
  availableTags = [],
  availableGroups = [],
  enableGroupAssignment = false,
}: CreateIngredientModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Alimento"
      className="max-w-2xl"
    >
      <div className="flex flex-col max-h-[80vh]">
        <p className="text-sm text-slate-500 mb-6">
          Se creará dentro de tus alimentos. Si quieres, luego puedes compartirlo con la comunidad desde la misma sección.
        </p>

        <div className="overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <CreateIngredientForm
            onCancel={onClose}
            onSuccess={(ingredient, assignment) => {
              onSuccess(ingredient, assignment);
              onClose();
            }}
            availableTags={availableTags}
            availableGroups={availableGroups}
            enableGroupAssignment={enableGroupAssignment}
          />
        </div>
      </div>
    </Modal>
  );
}
