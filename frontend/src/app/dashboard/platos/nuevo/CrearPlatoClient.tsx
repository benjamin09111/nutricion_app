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
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MEAL_SECTIONS = [
  { value: "", label: "Sin sección" },
  ...mealSectionsData,
] as const;

export default function CrearPlatoClient() {
  const router = useRouter();
  const token = Cookies.get("auth_token") || "";

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
  >([{ name: "", amount: 100, unit: "g" }]);
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
          // API returns an array or { items: [] } depending on version. 
          // Based on service it returns an array directly after mapping.
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

  const [imageSearch, setImageSearch] = useState("");

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
        const err = await res.json().catch(() => ({}));
        const msg =
          err?.message ||
          "Configura tu API key de OpenAI para usar esta función.";
        toast.error(msg);
        return;
      }
      const data = (await res.json()) as {
        calories?: number;
        proteins?: number;
        carbs?: number;
        lipids?: number;
      };
      setCustomAporte((prev) => ({
        calories: data.calories ?? prev.calories,
        proteins: data.proteins ?? prev.proteins,
        carbs: data.carbs ?? prev.carbs,
        lipids: data.lipids ?? prev.lipids,
      }));
      toast.success("Aporte estimado con IA aplicado.");
    } catch {
      toast.error("Configura tu API key de OpenAI para usar esta función.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const saveDish = async () => {
    if (!form.name.trim()) {
      toast.error("Nombre del plato es obligatorio.");
      return;
    }
    if (!form.mealSection) {
      toast.error("Debes seleccionar una hora de comida.");
      return;
    }
    const validCustom = customIngredients.filter((i) => i.name.trim());
    const validMain = mainIngredients.filter((i) => i.name.trim());

    if (validCustom.length === 0 && validMain.length === 0) {
      toast.error("Agrega al menos un ingrediente (principal u opcional).");
      return;
    }
    const validSteps = preparationSteps.filter((s) => s.trim());

    setIsSaving(true);
    try {
      const preparationText =
        preparationSteps.filter((s) => s.trim()).length > 0
          ? preparationSteps
            .filter((s) => s.trim())
            .map((s, i) => `${i + 1}. ${s.trim()}`)
            .join("\n")
          : undefined;

      const payload = {
        name: form.name,
        preparation: preparationText,
        imageUrl: form.imageUrl || undefined,
        portions: 1,
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

      console.log("[CrearPlato] Payload:", JSON.stringify(payload, null, 2));
      const response = await fetchApi("/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json().catch(() => ({}));
      console.log("[CrearPlato] Response status:", response.status, "body:", responseData);
      if (!response.ok) {
        console.error("[CrearPlato] Error:", responseData);
        const errMsg = Array.isArray(responseData?.message)
          ? responseData.message.join(", ")
          : responseData?.message || "No se pudo crear el plato.";
        throw new Error(errMsg);
      }
      toast.success("Plato creado correctamente.");
      router.push("/dashboard/platos");
    } catch (err: any) {
      console.error("[CrearPlato] Caught error:", err);
      const msg = err?.message || (typeof err === "string" ? err : "Error al guardar el plato.");
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

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
          <h1 className="text-xl font-bold text-slate-900">Crear Plato</h1>
        </div>

        {/* Tutorial / Description */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="bg-white p-2 rounded-xl border border-emerald-100 h-fit text-emerald-600 shadow-sm shrink-0">
            <Info size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Consejo para crear platos efectivos
            </p>
            <p className="text-[11px] leading-relaxed text-emerald-700/80 font-medium italic">
              "Recuerda que al crear un plato, priorizamos que tenga la menor cantidad de ingredientes, sea simple y fácil de preparar. Para una buena organización de la página, los principales ingredientes debes indicarlos, todo plato se puede reducir a, por ejemplo, Arroz y Pollo."
            </p>
          </div>
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
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                * Si no agregas una imagen, se usará una por defecto que se verá profesional en el plan.
              </p>
            </div>

            <div className="relative w-full h-44 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center group shadow-inner">
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt="Vista previa"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop";
                  }}
                />
              ) : (
                <div className="text-center space-y-2">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 inline-block">
                    <ImageIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sin imagen personalizada</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Tags <span className="text-slate-400 font-normal normal-case">(opcional)</span>
          </label>
          <TagInput
            value={form.tags}
            onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
            placeholder="Agregar tag..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Hora de comida <span className="text-rose-500">*</span>
          </label>
          <select
            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
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

        {/* Alimentos Principales (Database) */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
              Alimentos Principales (Base de datos) <span className="text-rose-500">*</span>
            </label>
            <div className="text-xs text-black font-normal normal-case">
              Si no encuentras el alimento, inclúyelo en Alimentos opcionales. Si es un alimento importante, ve a Ingredientes y ¡crealo por ti mismo para ayudar a la comunidad!
            </div>
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar alimentos (pasta, arroz, pollo...)"
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  className="pl-9 h-11"
                />
                {isSearchingFoods && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-emerald-500" />
                )}
              </div>

              {foodSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                  {foodSuggestions.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => addMainIngredient(food)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">{food.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{food.category?.name || "General"}</span>
                      </div>
                      <Plus className="h-4 w-4 text-slate-300 group-hover:text-emerald-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {mainIngredients.map((ing, index) => (
              <div key={ing.id} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-300">
                <div className="flex-1 h-11 border border-emerald-100 bg-emerald-50/30 rounded-xl px-4 flex items-center">
                  <span className="text-sm font-bold text-slate-700">{ing.name}</span>
                </div>
                <Input
                  type="number"
                  placeholder="Cant."
                  value={ing.amount || ""}
                  onChange={(e) => {
                    const next = [...mainIngredients];
                    next[index] = { ...next[index], amount: Number(e.target.value) || 0 };
                    setMainIngredients(next);
                  }}
                  className="w-20 h-11 text-slate-900 font-medium"
                />
                <Input
                  placeholder="g"
                  value={ing.unit}
                  onChange={(e) => {
                    const next = [...mainIngredients];
                    next[index] = { ...next[index], unit: e.target.value };
                    setMainIngredients(next);
                  }}
                  className="w-16 h-11 text-slate-900 font-medium"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 p-2 h-10 w-10 shrink-0"
                  onClick={() =>
                    setMainIngredients((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Alimentos Opcionales (Manual) */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Alimentos Opcionales / Condimentos (Manual) <span className="text-slate-400 font-normal normal-case">(opcional)</span>
          </label>
          <p className="text-[10px] text-slate-400 -mt-1 pb-2">Agrega especias, salsas o toques adicionales que no son la base del plato.</p>
          {customIngredients.map((ing, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                className="flex-1 min-w-0 text-slate-900 font-medium"
                placeholder="Ej. Sal, pimienta, orégano..."
                value={ing.name}
                onChange={(e) => {
                  const next = [...customIngredients];
                  next[index] = { ...next[index], name: e.target.value };
                  setCustomIngredients(next);
                }}
              />
              <Input
                type="number"
                placeholder="Cant."
                disabled={ing.unit === "a gusto"}
                value={ing.unit === "a gusto" ? "" : (ing.amount || "")}
                onChange={(e) => {
                  const next = [...customIngredients];
                  next[index] = { ...next[index], amount: Number(e.target.value) || 0 };
                  setCustomIngredients(next);
                }}
                className="w-20 text-slate-900 font-medium"
              />
              <Input
                placeholder="g"
                disabled={ing.unit === "a gusto"}
                value={ing.unit}
                onChange={(e) => {
                  const next = [...customIngredients];
                  next[index] = { ...next[index], unit: e.target.value };
                  setCustomIngredients(next);
                }}
                className="w-16 text-slate-900 font-medium"
              />
              <Button
                type="button"
                variant="ghost"
                title="Marcar como 'A gusto'"
                className={cn(
                  "p-2 h-10 w-10 shrink-0 transition-colors",
                  ing.unit === "a gusto" ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:bg-slate-50"
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
                type="button"
                variant="ghost"
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 p-2 h-10 w-10 shrink-0"
                onClick={() =>
                  setCustomIngredients((prev) => prev.filter((_, i) => i !== index))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setCustomIngredients((prev) => [...prev, { name: "", amount: 1, unit: "pizca" }])
            }
            className="w-full border-dashed border-slate-300 text-slate-500 hover:text-slate-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar alimento opcional
          </Button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Aporte estimado por porción <span className="text-rose-500">*</span>
            </label>
            <div title="Función bloqueada temporalmente">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={true}
                onClick={handleRellenarConIA}
                className="text-slate-400 border-slate-200 cursor-not-allowed bg-slate-50"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Rellenar con IA (Próximamente)
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="kcal"
              value={customAporte.calories || ""}
              onChange={(e) =>
                setCustomAporte((prev) => ({
                  ...prev,
                  calories: Number(e.target.value) || 0,
                }))
              }
              className="text-slate-900 font-medium"
            />
            <Input
              type="number"
              placeholder="Proteínas (g)"
              value={customAporte.proteins || ""}
              onChange={(e) =>
                setCustomAporte((prev) => ({
                  ...prev,
                  proteins: Number(e.target.value) || 0,
                }))
              }
              className="text-slate-900 font-medium"
            />
            <Input
              type="number"
              placeholder="Carbos (g)"
              value={customAporte.carbs || ""}
              onChange={(e) =>
                setCustomAporte((prev) => ({
                  ...prev,
                  carbs: Number(e.target.value) || 0,
                }))
              }
              className="text-slate-900 font-medium"
            />
            <Input
              type="number"
              placeholder="Grasas (g)"
              value={customAporte.lipids || ""}
              onChange={(e) =>
                setCustomAporte((prev) => ({
                  ...prev,
                  lipids: Number(e.target.value) || 0,
                }))
              }
              className="text-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Forma de preparación (pasos) <span className="text-slate-400 font-normal normal-case">(opcional)</span>
          </label>
          {preparationSteps.map((step, index) => (
            <div key={index} className="flex gap-2 items-center">
              <span className="text-slate-500 font-bold w-6">{index + 1}.</span>
              <Input
                className="flex-1 text-slate-900 font-medium"
                placeholder={`Paso ${index + 1}`}
                value={step}
                onChange={(e) => {
                  const next = [...preparationSteps];
                  next[index] = e.target.value;
                  setPreparationSteps(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 p-2 h-10 w-10 shrink-0"
                onClick={() =>
                  setPreparationSteps((prev) => prev.filter((_, i) => i !== index))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreparationSteps((prev) => [...prev, ""])}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar paso
          </Button>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50/50 transition-colors shadow-sm">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Compartir en comunidad (Público)
            </span>
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              checked={form.isPublic}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isPublic: e.target.checked }))
              }
            />
          </label>
          {!form.isPublic && (
            <p className="text-[11px] font-medium text-amber-600 italic px-2 animate-in fade-in slide-in-from-top-1 duration-300">
              * Entendemos que prefieras mantenerlo en privado, pero ¡agradeceríamos mucho tu aporte a la comunidad de la aplicación! Al compartirlo, otros nutris también podrán usarlo.
            </p>
          )}
        </div>

        <Button
          onClick={saveDish}
          disabled={isSaving}
          variant="default"
          className="w-full h-12"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Plato
        </Button>
      </div>
    </div>
  );
}
