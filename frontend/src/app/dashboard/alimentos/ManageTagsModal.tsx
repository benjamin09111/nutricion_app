"use client";

import { Fragment, useState, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X, Save, Tag } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { TagInput } from "@/components/ui/TagInput";
import { Ingredient } from "@/features/foods";

interface ManageTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
  availableTags?: string[];
  onSuccess: (newTags: string[]) => void;
}

export default function ManageTagsModal({
  isOpen,
  onClose,
  ingredient,
  availableTags = [],
  onSuccess,
}: ManageTagsModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (ingredient) {
      // Combine global tags and personal tags for display
      const globalTags = ingredient.tags?.map((t) => t.name) || [];
      const personalTags =
        ingredient.preferences?.[0]?.tags?.map((t) => t.name) || [];
      // Use Set to remove duplicates
      setTags(Array.from(new Set([...globalTags, ...personalTags])));
    } else {
      setTags([]);
    }
  }, [ingredient]);

  const handleSave = async () => {
    if (!ingredient) return;
    setIsSubmitting(true);

    try {
      const token = Cookies.get("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

      const response = await fetch(
        `${apiUrl}/foods/${ingredient.id}/preferences`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tags: tags, // Send the full array of tag names
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar tags");
      }

      toast.success("Tags actualizados correctamente");
      onSuccess(tags);
      onClose();
    } catch (error: any) {
      console.error("Error updating tags:", error);
      toast.error(error.message || "No se pudieron guardar los tags");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-slate-100">
                <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                  <DialogTitle
                    as="h3"
                    className="text-lg font-bold text-slate-800 flex items-center gap-2"
                  >
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <Tag className="h-4 w-4" />
                    </div>
                    Gestionar Etiquetas
                  </DialogTitle>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">
                      Tags para {ingredient?.name}
                    </label>
                    <TagInput
                      value={tags}
                      onChange={setTags}
                      suggestions={availableTags}
                      placeholder="Escribe para buscar o crear..."
                      className="w-full"
                      fetchSuggestionsUrl={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/tags`}
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Estos tags te ayudarán a filtrar y encontrar este
                      ingrediente más tarde.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        "Guardando..."
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> Guardar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
