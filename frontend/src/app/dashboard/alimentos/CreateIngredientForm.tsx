"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TagInput } from "@/components/ui/TagInput";
import { Ingredient } from "@/features/foods";
import { fetchApi, getApiUrl } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";

const ingredientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  brand: z.string().min(1, "La marca es obligatoria"),
  category: z.string().min(1, "La categoría es obligatoria"),
  unit: z.string().min(1, "La unidad es obligatoria"),
  amount: z.preprocess(
    (val) =>
      val === "" || (typeof val === "number" && Number.isNaN(val))
        ? undefined
        : Number(val),
    z.number({ message: "La cantidad base es obligatoria" }),
  ),
  calories: z.preprocess(
    (val) =>
      val === "" || (typeof val === "number" && Number.isNaN(val))
        ? undefined
        : Number(val),
    z.number({ message: "Las calorías son obligatorias" }),
  ),
  proteins: z.preprocess(
    (val) =>
      val === "" || (typeof val === "number" && Number.isNaN(val))
        ? undefined
        : Number(val),
    z.number({ message: "Las proteínas son obligatorias" }),
  ),
  lipids: z.preprocess(
    (val) =>
      val === "" || (typeof val === "number" && Number.isNaN(val))
        ? undefined
        : Number(val),
    z.number({ message: "Los lípidos son obligatorios" }),
  ),
  carbs: z.preprocess(
    (val) =>
      val === "" || (typeof val === "number" && Number.isNaN(val))
        ? undefined
        : Number(val),
    z.number({ message: "Los carbohidratos son obligatorios" }),
  ),
  sugars: z.preprocess(
    (val) =>
      val === "" || (typeof val === "number" && Number.isNaN(val))
        ? undefined
        : Number(val),
    z.number({ message: "Los azúcares son obligatorios" }),
  ),
  fiber: z.preprocess(
    (val) =>
      val === "" || (typeof val === "number" && Number.isNaN(val))
        ? undefined
        : Number(val),
    z.number({ message: "La fibra es obligatoria" }),
  ),
  sodium: z.preprocess(
    (val) =>
      val === "" || (typeof val === "number" && Number.isNaN(val))
        ? undefined
        : Number(val),
    z.number({ message: "El sodio es obligatorio" }),
  ),
  tags: z.array(z.string()).optional(),
});

type IngredientFormInput = z.input<typeof ingredientSchema>;
type IngredientFormValues = z.output<typeof ingredientSchema>;

type IngredientAssignmentDraft =
  | { mode: "none" }
  | { mode: "existing"; groupId: string }
  | { mode: "new"; groupName: string };

const CATEGORIES = [
  "Lácteos y derivados",
  "Carnes y derivados",
  "Pescados y mariscos",
  "Huevos",
  "Legumbres",
  "Verduras y hortalizas",
  "Frutas",
  "Cereales y derivados",
  "Aceites y grasas",
  "Azúcares y dulces",
  "Bebidas",
  "Salsas y condimentos",
  "Platos preparados",
  "Suplementos",
  "Otros",
];

interface CreateIngredientFormProps {
  onCancel: () => void;
  onSuccess: (ingredient?: Ingredient, assignment?: IngredientAssignmentDraft) => void;
  availableTags?: string[];
  availableGroups?: { id: string; name: string }[];
  enableGroupAssignment?: boolean;
}

export default function CreateIngredientForm({
  onCancel,
  onSuccess,
  availableTags = [],
  availableGroups = [],
  enableGroupAssignment = false,
}: CreateIngredientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareWithCommunity, setShareWithCommunity] = useState(true);
  const [assignmentMode, setAssignmentMode] = useState<IngredientAssignmentDraft["mode"]>("none");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IngredientFormInput, unknown, IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      amount: 100,
      unit: "g",
      proteins: 0,
      lipids: 0,
      carbs: 0,
      sugars: 0,
      fiber: 0,
      sodium: 0,
      tags: [],
    },
  });

  const onSubmit = async (data: IngredientFormValues) => {
    if (enableGroupAssignment) {
      if (assignmentMode === "existing" && !selectedGroupId) {
        toast.error("Elige un grupo o cambia a Nuevo grupo");
        return;
      }
      if (assignmentMode === "new" && !newGroupName.trim()) {
        toast.error("Escribe un nombre para el nuevo grupo");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Sesión no válida");
      }
      const response = await fetchApi("/foods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          price: 0,
          isPublic: shareWithCommunity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear alimento");
      }

      const newIngredient = await response.json();

      toast.success("Alimento creado correctamente");
      const assignment: IngredientAssignmentDraft =
        !enableGroupAssignment || assignmentMode === "none"
          ? { mode: "none" }
          : assignmentMode === "existing"
            ? { mode: "existing", groupId: selectedGroupId }
            : { mode: "new", groupName: newGroupName.trim() };

      reset();
      setShareWithCommunity(true);
      setAssignmentMode("none");
      setSelectedGroupId("");
      setNewGroupName("");
      onSuccess(newIngredient, assignment);
    } catch (error) {
      console.error("Error creating ingredient:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al conectar con el servidor",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    reset();
    setShareWithCommunity(true);
    setAssignmentMode("none");
    setSelectedGroupId("");
    setNewGroupName("");
    onCancel();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Nuevo alimento</h3>
            <p className="text-sm text-slate-500">
              Completa la información base y nutricional para guardarlo en tus alimentos.
            </p>
          </div>
        </div>
      </div>

      <form
        id="create-ingredient-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Nombre del Producto *
            </label>
            <input
              {...register("name")}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Ej: Pan Integral"
            />
            {errors.name && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" /> {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Marca *
            </label>
            <input
              {...register("brand")}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Ej: Ideal"
            />
            {errors.brand && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" /> {errors.brand.message}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Categoría *
            </label>
            <select
              {...register("category")}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Seleccionar...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" /> {errors.category.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Porción Base
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">
                Cantidad Base *
              </label>
              <input
                type="number"
                {...register("amount", { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                placeholder="100"
              />
              {errors.amount && (
                <p className="text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">
                Unidad *
              </label>
              <select
                {...register("unit")}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="g">Gramos (g)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="unidad">Unidad (u)</option>
              </select>
            </div>
          </div>
          <p className="text-xs italic text-slate-400">
            * Todos los valores nutricionales deben ser ingresados en base a
            esta cantidad (ej: por cada 100g).
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Información Nutricional
          </h4>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Calorías (kcal) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("calories", { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500/20"
                placeholder="0"
              />
              {errors.calories && (
                <p className="text-xs text-red-500">{errors.calories.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Proteínas (g) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("proteins", { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Carbohidratos (g) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("carbs", { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-yellow-500 focus:ring-yellow-500/20"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Grasas Totales (g) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("lipids", { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:ring-red-500/20"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Azúcares (g) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("sugars", { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400"
                placeholder="Obligatorio"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Fibra (g) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("fiber", { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400"
                placeholder="Obligatorio"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Sodio (mg) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register("sodium", { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400"
                placeholder="Obligatorio"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={shareWithCommunity}
              onChange={(e) => setShareWithCommunity(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Compartir con la comunidad Nutri
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                Activo por defecto. Desactívalo si este alimento es solo para tu consulta.
              </p>
            </div>
          </label>
        </div>

        {enableGroupAssignment && (
          <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Añadir a un grupo</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Opcional. Puedes dejarlo sin grupo, usar uno existente o crear uno nuevo al guardar.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { key: "none", label: "Sin grupo" },
                { key: "existing", label: "Grupo existente" },
                { key: "new", label: "Nuevo grupo" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setAssignmentMode(option.key as IngredientAssignmentDraft["mode"])}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                    assignmentMode === option.key
                      ? "border-indigo-200 bg-white text-indigo-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {assignmentMode === "existing" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Selecciona un grupo</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Elegir grupo...</option>
                  {availableGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {assignmentMode === "new" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nombre del nuevo grupo</label>
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Ej: Proteínas suaves"
                />
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Etiquetas (Tags)
          </label>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <TagInput
                placeholder="Escribe y presiona enter (ej: VEGANO, KETO)"
                value={field.value || []}
                onChange={(newTags) => field.onChange(newTags)}
                suggestions={availableTags}
                fetchSuggestionsUrl={`${getApiUrl()}/tags`}
                openDirection="up"
              />
            )}
          />
          <p className="text-xs text-slate-400">
            Ayuda a filtrar alimentos rápidamente.
          </p>
        </div>
      </form>

      <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="create-ingredient-form"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Alimento
            </>
          )}
        </button>
      </div>
    </div>
  );
}
