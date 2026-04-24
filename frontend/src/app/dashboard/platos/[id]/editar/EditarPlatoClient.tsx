
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  ChefHat,
  Plus,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  Camera,
  Droplet,
  Image as ImageIcon,
  Search,
  Check,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagInput } from "@/components/ui/TagInput";
import mealSectionsData from "@/content/meal-sections.json";
import { fetchApi } from "@/lib/api-base";
import { cn } from "@/lib/utils";

const MEAL_SECTIONS = [
  { value: "", label: "Sin sección" },
  ...mealSectionsData,
] as const;

export default function EditarPlatoClient({ id }: { id: string }) {
  const router = useRouter();
  const token = Cookies.get("auth_token") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    isPublic: true,
    tags: [] as string[],
    mealSection: "",
    imageUrl: "",
  });
  const [preparationSteps, setPreparationSteps] = useState<string[]>([]);
  const [customIngredients, setCustomIngredients] = useState<
    { name: string; amount: number; unit: string }[]
  >([]);
  const [customAporte, setCustomAporte] = useState({
    calories: 0,
    proteins: 0,
    carbs: 0,
    lipids: 0,
  });
  const [mainIngredients, setMainIngredients] = useState<
    { id: string; name: string; amount: number; unit: string }[]
  >([]);
  
  const [foodSearch, setFoodSearch] = useState("");
  const [foodSuggestions, setFoodSuggestions] = useState<any[]>([]);
  const [isSearchingFoods, setIsSearchingFoods] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load existing data
  useEffect(() => {
    const fetchDish = async () => {
      setIsLoading(true);
      try {
        const res = await fetchApi(`/recipes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setForm({
            name: data.name || "",
            isPublic: data.isPublic ?? true,
            tags: data.metadata?.tags || [],
            mealSection: data.metadata?.mealSection || "",
            imageUrl: data.imageUrl || "",
          });
          
          if (data.preparation) {
            setPreparationSteps(data.preparation.split("\n").map((s: string) => s.replace(/^\d+\.\s*/, "")));
          }

          if (data.customIngredients) {
            setCustomIngredients(data.customIngredients);
          }

          if (data.ingredients) {
            setMainIngredients(data.ingredients.map((i: any) => ({
              id: i.ingredient.id,
              name: i.ingredient.name,
              amount: i.amount,
              unit: i.unit
            })));
          }

          setCustomAporte({
            calories: data.calories || 0,
            proteins: data.proteins || 0,
            carbs: data.carbs || 0,
            lipids: data.lipids || 0,
          });
        } else {
          toast.error("No se pudo cargar el plato.");
          router.push("/dashboard/platos");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error de conexión.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id && token) fetchDish();
  }, [id, token, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setFoodSuggestions([]);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFoodSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (foodSearch.trim().length < 2) {
      setFoodSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingFoods(true);
      try {
        const res = await fetchApi(`/foods?search=${encodeURIComponent(foodSearch)}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFoodSuggestions(Array.isArray(data) ? data : data.items || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingFoods(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [foodSearch, token]);

  const addMainIngredient = (food: any) => {
    if (mainIngredients.find(i => i.id === food.id)) {
      toast.error("Este alimento ya está agregado como principal.");
      return;
    }
    setMainIngredients(prev => [
      ...prev,
      { id: food.id, name: food.name, amount: 100, unit: food.unit || "g" }
    ]);
    setFoodSearch("");
    setFoodSuggestions([]);
  };

  const handleRellenarConIA = async () => {
    const validIngredients = customIngredients
      .filter((i) => i.name.trim())
      .map((i) => i.name.trim());
    if (validIngredients.length === 0) {
      toast.error("Agrega al menos un ingrediente para estimar con IA.");
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetchApi("/recipes/estimate-macros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ingredientNames: validIngredients }),
      });
      if (!res.ok) {
        toast.error("No se pudo estimar con IA.");
        return;
      }
      const data = await res.json();
      setCustomAporte((prev) => ({
        calories: data.calories ?? prev.calories,
        proteins: data.proteins ?? prev.proteins,
        carbs: data.carbs ?? prev.carbs,
        lipids: data.lipids ?? prev.lipids,
      }));
      toast.success("Aporte estimado con IA aplicado.");
    } catch {
      toast.error("Error al conectar con el servicio de IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const saveDish = async () => {
    if (!form.name.trim()) {
      toast.error("Nombre del plato es obligatorio.");
      return;
    }
    const validCustom = customIngredients.filter((i) => i.name.trim());
    const validMain = mainIngredients.filter((i) => i.name.trim());

    if (validCustom.length === 0 && validMain.length === 0) {
      toast.error("Agrega al menos un ingrediente.");
      return;
    }

    setIsSaving(true);
    try {
      const preparationText = preparationSteps
        .filter((s) => s.trim())
        .map((s, i) => `${i + 1}. ${s.trim()}`)
        .join("\n");

      const payload = {
        name: form.name,
        preparation: preparationText || undefined,
        imageUrl: form.imageUrl || undefined,
        isPublic: form.isPublic,
        tags: form.tags.length ? form.tags : undefined,
        mealSection: form.mealSection || undefined,
        customIngredients: validCustom.map((i) => ({
          name: i.name.trim(),
          amount: i.amount || 0,
          unit: i.unit.trim() || "g",
        })),
        ingredients: validMain.map((i) => ({
          ingredientId: i.id,
          amount: i.amount || 0,
          unit: i.unit.trim() || "g",
          isMain: true
        })),
        calories: customAporte.calories,
        proteins: customAporte.proteins,
        carbs: customAporte.carbs,
        lipids: customAporte.lipids,
      };

      const response = await fetchApi(`/recipes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al actualizar el plato.");
      }

      toast.success("Plato actualizado correctamente.");
      router.push("/dashboard/platos");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el plato.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/platos")}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <ChefHat className="h-5 w-5 text-emerald-600" />
          <h1 className="text-xl font-bold text-slate-900">Editar Plato</h1>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Nombre del plato <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="Nombre del plato"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="text-slate-900 font-medium"
          />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
            <Camera className="h-4 w-4 text-emerald-600" />
            Imagen del Plato
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium">Pega una URL de imagen para el plato</p>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9 h-11 text-sm border-slate-200 focus:border-emerald-500 transition-all"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="relative w-full h-44 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center shadow-inner">
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop";
                  }}
                />
              ) : (
                <div className="text-center space-y-2">
                  <ImageIcon className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Sin imagen</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Tags
          </label>
          <TagInput
            value={form.tags}
            onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
            placeholder="Agregar tag..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Hora de comida
          </label>
          <select
            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-emerald-500"
            value={form.mealSection}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, mealSection: e.target.value }))
            }
          >
            <option value="">Selecciona hora de comida...</option>
            {MEAL_SECTIONS.filter(s => s.value !== "").map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Alimentos Principales (Base de Datos)
            </label>
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar alimentos..."
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  className="pl-9 h-11"
                />
                {isSearchingFoods && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-emerald-500" />
                )}
              </div>

              {foodSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {foodSuggestions.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => addMainIngredient(food)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group"
                    >
                      <span className="text-sm font-semibold">{food.name}</span>
                      <Plus className="h-4 w-4 text-slate-300 group-hover:text-emerald-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {mainIngredients.map((ing, index) => (
              <div key={ing.id} className="flex gap-2 items-center">
                <div className="flex-1 h-11 border border-emerald-100 bg-emerald-50/30 rounded-xl px-4 flex items-center">
                  <span className="text-sm font-bold text-slate-700">{ing.name}</span>
                </div>
                <Input
                  type="number"
                  className="w-20"
                  value={ing.amount}
                  onChange={(e) => {
                    const next = [...mainIngredients];
                    next[index].amount = Number(e.target.value) || 0;
                    setMainIngredients(next);
                  }}
                />
                <Input
                  className="w-16"
                  value={ing.unit}
                  onChange={(e) => {
                    const next = [...mainIngredients];
                    next[index].unit = e.target.value;
                    setMainIngredients(next);
                  }}
                />
                <Button
                  variant="ghost"
                  className="text-rose-600"
                  onClick={() => setMainIngredients(prev => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Alimentos Opcionales / Condimentos
          </label>
          {customIngredients.map((ing, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                className="flex-1"
                placeholder="Nombre..."
                value={ing.name}
                onChange={(e) => {
                  const next = [...customIngredients];
                  next[index].name = e.target.value;
                  setCustomIngredients(next);
                }}
              />
              <Input
                type="number"
                className="w-20"
                disabled={ing.unit === "a gusto"}
                value={ing.unit === "a gusto" ? "" : ing.amount}
                onChange={(e) => {
                  const next = [...customIngredients];
                  next[index].amount = Number(e.target.value) || 0;
                  setCustomIngredients(next);
                }}
              />
              <Input
                className="w-16"
                disabled={ing.unit === "a gusto"}
                value={ing.unit}
                onChange={(e) => {
                  const next = [...customIngredients];
                  next[index].unit = e.target.value;
                  setCustomIngredients(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  "p-2 h-10 w-10 shrink-0",
                  ing.unit === "a gusto" ? "text-emerald-600 bg-emerald-50" : "text-slate-400"
                )}
                onClick={() => {
                  const next = [...customIngredients];
                  if (ing.unit === "a gusto") {
                    next[index] = { ...next[index], amount: 1, unit: "g" };
                  } else {
                    next[index] = { ...next[index], amount: 0, unit: "a gusto" };
                  }
                  setCustomIngredients(next);
                }}
              >
                <Droplet className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="text-rose-600"
                onClick={() => setCustomIngredients(prev => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setCustomIngredients(prev => [...prev, { name: "", amount: 1, unit: "g" }])}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar opcional
          </Button>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl space-y-3">
          <label className="text-xs font-bold uppercase text-slate-500">Aporte por Porción</label>
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="kcal" value={customAporte.calories} onChange={e => setCustomAporte(prev => ({ ...prev, calories: Number(e.target.value) }))} />
            <Input type="number" placeholder="Prot (g)" value={customAporte.proteins} onChange={e => setCustomAporte(prev => ({ ...prev, proteins: Number(e.target.value) }))} />
            <Input type="number" placeholder="Carb (g)" value={customAporte.carbs} onChange={e => setCustomAporte(prev => ({ ...prev, carbs: Number(e.target.value) }))} />
            <Input type="number" placeholder="Grasa (g)" value={customAporte.lipids} onChange={e => setCustomAporte(prev => ({ ...prev, lipids: Number(e.target.value) }))} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-500">Preparación</label>
          {preparationSteps.map((step, index) => (
            <div key={index} className="flex gap-2 items-center">
              <span className="text-slate-400 font-bold w-4 text-xs">{index + 1}</span>
              <Input
                className="flex-1"
                value={step}
                onChange={(e) => {
                  const next = [...preparationSteps];
                  next[index] = e.target.value;
                  setPreparationSteps(next);
                }}
              />
              <Button variant="ghost" className="text-rose-600" onClick={() => setPreparationSteps(prev => prev.filter((_, i) => i !== index))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={() => setPreparationSteps(prev => [...prev, ""])}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar paso
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-xl">
          <span className="text-xs font-bold uppercase text-slate-600">Público (Comunidad)</span>
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={e => setForm(prev => ({ ...prev, isPublic: e.target.checked }))}
            className="w-5 h-5 accent-emerald-600"
          />
        </div>

        <Button onClick={saveDish} disabled={isSaving} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
