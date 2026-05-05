import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TagInput } from "@/components/ui/TagInput";
import { fetchApi, getApiUrl } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { Modal } from "@/components/ui/Modal";

type GroupType = "INGREDIENT" | "RECIPE";

type CreateGroupForm = {
  name: string;
  description?: string;
};

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
  /** Defaults to INGREDIENT if not provided */
  type?: GroupType;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
  type = "INGREDIENT",
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
    const token = getAuthToken();
    if (!token) {
      toast.error("Sesión no válida");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetchApi("/ingredient-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          tags,
          type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el grupo");
      }

      const label = type === "RECIPE" ? "grupo de platos" : "grupo de ingredientes";
      toast.success(`Nuevo ${label} creado exitosamente`);
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

  const title = type === "RECIPE" ? "Nuevo Grupo de Platos" : "Nuevo Grupo de Ingredientes";
  const namePlaceholder =
    type === "RECIPE"
      ? "Ej: Platos para Dieta Alta en Proteínas"
      : "Ej: Desayunos Bajos en Carbos";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">
            Nombre del Grupo *
          </label>
          <Input
            {...register("name", { required: "El nombre es obligatorio" })}
            placeholder={namePlaceholder}
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
            fetchSuggestionsUrl={`${getApiUrl()}/tags`}
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
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
