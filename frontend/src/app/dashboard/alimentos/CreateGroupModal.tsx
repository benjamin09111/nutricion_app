import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X, Save, FolderPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { TagInput } from "@/components/ui/TagInput"; // Assuming TagInput is reusable and exported

type CreateGroupForm = {
  name: string;
  description?: string;
};

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

import { Modal } from "@/components/ui/Modal";

export default function CreateGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGroupForm>();

  const onSubmit = async (data: CreateGroupForm) => {
    setIsLoading(true);
    const token = Cookies.get("auth_token");
    if (!token) {
      toast.error("Sesión no válida");
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
      const response = await fetch(`${apiUrl}/ingredient-groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          tags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el grupo");
      }

      toast.success("Grupo creado exitosamente");
      reset();
      setTags([]);
      onGroupCreated();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo crear el grupo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Grupo"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">
            Nombre del Grupo *
          </label>
          <Input
            {...register("name", { required: "El nombre es obligatorio" })}
            placeholder="Ej: Desayunos Bajos en Carbos"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <span className="text-xs text-red-500 mt-1">
              {errors.name.message}
            </span>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">
            Descripción (Opcional)
          </label>
          <textarea
            {...register("description")}
            placeholder="Breve descripción del propósito de este grupo..."
            className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">
            Tags (Opcional)
          </label>
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder="Escribe y presiona Enter..."
            fetchSuggestionsUrl={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/tags`}
          />
          <p className="text-xs text-slate-400 mt-1">
            Ayudan a filtrar y organizar tus grupos.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Crear Grupo
          </Button>
        </div>
      </form>
    </Modal>
  );
}
