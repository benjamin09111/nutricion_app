"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { Plus, Trash2, Search, ChefHat, Info, Flame, Image as ImageIcon, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Ingredient {
  id: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  lipids: number;
}

interface CreateRecipeForm {
  name: string;
  description?: string;
  imageUrl?: string;
  portions: number;
  ingredients: {
    ingredientId: string;
    name: string; // Helper for UI
    amount: number;
    unit: string;
    brandSuggestion?: string;
    imageUrl?: string;
    // Helper macros for live calc
    calories: number;
    proteins: number;
    carbs: number;
    lipids: number;
  }[];
}

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRecipeModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateRecipeModalProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRecipeForm>({
    defaultValues: {
      portions: 1,
      ingredients: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen es demasiado grande (máx 5MB)");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = Cookies.get("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
      const response = await fetch(`${apiUrl}/uploads/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Error al subir imagen");

      const data = await response.json();
      setValue("imageUrl", data.url);
      toast.success("Imagen subida con éxito");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  // Watch values for macro calc
  const watchedIngredients = watch("ingredients");
  const watchedPortions = watch("portions") || 1;

  // Search Ingredients
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const token = Cookies.get("auth_token");
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
        const response = await fetch(`${apiUrl}/foods?search=${searchTerm}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error("Error searching ingredients", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAddIngredient = (ing: Ingredient) => {
    append({
      ingredientId: ing.id,
      name: ing.name,
      amount: 100, // Default 100g
      unit: "g",
      brandSuggestion: "",
      calories: ing.calories,
      proteins: ing.proteins,
      carbs: ing.carbs,
      lipids: ing.lipids,
    });
    setSearchTerm(""); // Clear search
    setSearchResults([]);
  };

  // Calculate Macros
  const totals = watchedIngredients.reduce(
    (acc, curr) => {
      const factor = (curr.amount || 0) / 100; // Asuming stored per 100g/ml
      return {
        calories: acc.calories + curr.calories * factor,
        proteins: acc.proteins + curr.proteins * factor,
        carbs: acc.carbs + curr.carbs * factor,
        lipids: acc.lipids + curr.lipids * factor,
      };
    },
    { calories: 0, proteins: 0, carbs: 0, lipids: 0 },
  );

  const perPortion = {
    calories: totals.calories / watchedPortions,
    proteins: totals.proteins / watchedPortions,
    carbs: totals.carbs / watchedPortions,
    lipids: totals.lipids / watchedPortions,
  };

  const onSubmit = async (data: CreateRecipeForm) => {
    try {
      const token = Cookies.get("auth_token");
      const payload = {
        ...data,
        portions: Number(data.portions),
        ingredients: data.ingredients.map((i) => ({
          ingredientId: i.ingredientId,
          amount: Number(i.amount),
          unit: i.unit,
          brandSuggestion: i.brandSuggestion || undefined,
        })),
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
      const response = await fetch(`${apiUrl}/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el plato");
      }

      toast.success("Plato creado exitosamente");
      onSuccess();
      onClose();
      reset();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Plato"
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div className="mb-6 text-sm text-slate-500">
        Combina ingredientes para crear una receta personalizada.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Nombre del Plato
            </label>
            <Input
              {...register("name", { required: "El nombre es obligatorio" })}
              placeholder="Ej: Cazuela de Vacuno"
            />
            {errors.name && (
              <span className="text-xs text-red-500">
                {errors.name.message}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Porciones (Rendimiento)
            </label>
            <Input
              type="number"
              {...register("portions", { min: 1, valueAsNumber: true })}
              placeholder="1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Descripción / Preparación
          </label>
          <textarea
            {...register("description")}
            className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400"
            placeholder="Opcional: Instrucciones breves..."
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Camera className="h-4 w-4 text-emerald-600" />
            Imagen del Plato
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">Subir desde tu equipo o pegar una URL</p>
              <div className="flex gap-2">
                <input
                  type="file"
                  id="recipe-image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed border-2 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center gap-2 py-6"
                  onClick={() => document.getElementById('recipe-image-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  {isUploading ? "Subiendo..." : "Subir Imagen"}
                </Button>
              </div>
              <Input
                {...register("imageUrl")}
                placeholder="Pegar URL de imagen..."
                className="text-xs"
              />
            </div>

            <div className="relative w-full h-32 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
              {watch("imageUrl") ? (
                <img
                  src={watch("imageUrl")}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-center space-y-1">
                  <ImageIcon className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sin imagen</p>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                   <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ingredient Search */}
        <div className="space-y-2 relative">
          <label className="text-sm font-medium text-slate-700">
            Agregar Ingredientes
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar ingrediente (ej: arroz, pollo)..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Search Results Dropdown */}
          {searchTerm.length >= 2 && (
            <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-sm text-slate-500 text-center">
                  Buscando...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((ing) => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => handleAddIngredient(ing)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex justify-between items-center group"
                  >
                    <span className="font-medium text-slate-700">
                      {ing.name}
                    </span>
                    <span className="text-xs text-slate-400 group-hover:text-emerald-600">
                      {Math.round(ing.calories)} kcal
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-slate-500 text-center">
                  No se encontraron ingredientes
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Ingredients List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700 flex justify-between">
            Ingredientes Seleccionados
            <span className="text-xs font-normal text-slate-500">
              {fields.length} items
            </span>
          </h4>

          {fields.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-sm text-slate-400">
                Busca y agrega ingredientes arriba
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-slate-800">
                      {field.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-red-500"
                      onClick={() => remove(index)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500">
                        Cantidad
                      </label>
                      <Input
                        type="number"
                        className="h-8 text-xs bg-white"
                        {...register(`ingredients.${index}.amount` as const, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">
                        Unidad
                      </label>
                      <select
                        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs focus:ring-2 focus:ring-emerald-500/20"
                        {...register(`ingredients.${index}.unit` as const)}
                      >
                        <option value="g">gramos (g)</option>
                        <option value="ml">ml</option>
                        <option value="unidad">unidad</option>
                        <option value="taza">taza</option>
                        <option value="cda">cucharada</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">
                        Marca (Opcional)
                      </label>
                      <Input
                        className="h-8 text-xs bg-white"
                        placeholder="Ej: Lider..."
                        {...register(
                          `ingredients.${index}.brandSuggestion` as const,
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Macros Summary */}
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={16} className="text-orange-400" />
            <h4 className="font-semibold text-sm">
              Información Nutricional (por porción)
            </h4>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center mb-4">
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {Math.round(perPortion.calories)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Kcal
              </div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {Math.round(perPortion.proteins)}g
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Prot
              </div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {Math.round(perPortion.carbs)}g
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Carb
              </div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {Math.round(perPortion.lipids)}g
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Grasas
              </div>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-start gap-2">
            <Info className="text-orange-400 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-orange-200">
              <strong>Nota Importante:</strong> Sumar los ingredientes no es lo
              mismo que el resultado final, ¡ya que un plato tiene preparación
              (cocción, pérdida de agua, absorción de aceite)!
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Crear Plato"}
          </Button>
        </div>
      </form>
      {/* </DialogContent> */}
    </Modal>
  );
}
