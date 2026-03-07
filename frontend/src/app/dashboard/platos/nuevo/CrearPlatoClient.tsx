"use client";

import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagInput } from "@/components/ui/TagInput";

const MEAL_SECTIONS = [
  { value: "", label: "Sin sección" },
  { value: "desayuno", label: "Desayuno" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "once", label: "Once" },
  { value: "cena", label: "Cena" },
  { value: "merienda", label: "Merienda" },
] as const;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export default function CrearPlatoClient() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    isPublic: false,
    tags: [] as string[],
    mealSection: "",
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
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const token = Cookies.get("auth_token") || "";

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
      const res = await fetch(`${apiUrl}/recipes/estimate-macros`, {
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
    const validCustom = customIngredients.filter((i) => i.name.trim());
    if (validCustom.length === 0) {
      toast.error("Agrega al menos un ingrediente.");
      return;
    }
    const validSteps = preparationSteps.filter((s) => s.trim());
    if (validSteps.length === 0) {
      toast.error("Agrega al menos un paso en la forma de preparación.");
      return;
    }

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
        portions: 1,
        isPublic: form.isPublic,
        tags: form.tags.length ? form.tags : undefined,
        mealSection: form.mealSection || undefined,
        customIngredients: validCustom.map((i) => ({
          name: i.name.trim(),
          amount: i.amount || 0,
          unit: i.unit.trim() || "g",
        })),
        ingredients: [] as { ingredientId: string; amount: number; unit: string }[],
        calories: customAporte.calories,
        proteins: customAporte.proteins,
        carbs: customAporte.carbs,
        lipids: customAporte.lipids,
      };

      console.log("[CrearPlato] Payload:", JSON.stringify(payload, null, 2));
      const response = await fetch(`${apiUrl}/recipes`, {
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
            Hora de comida <span className="text-slate-400 font-normal normal-case">(opcional)</span>
          </label>
          <select
            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 font-medium"
            value={form.mealSection}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, mealSection: e.target.value }))
            }
          >
            {MEAL_SECTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Ingredientes (personalizados) <span className="text-rose-500">*</span>
          </label>
          {customIngredients.map((ing, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                className="flex-1 min-w-0 text-slate-900 font-medium"
                placeholder="Nombre del ingrediente"
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
                value={ing.amount || ""}
                onChange={(e) => {
                  const next = [...customIngredients];
                  next[index] = { ...next[index], amount: Number(e.target.value) || 0 };
                  setCustomIngredients(next);
                }}
                className="w-20 text-slate-900 font-medium"
              />
              <Input
                placeholder="g"
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
              setCustomIngredients((prev) => [...prev, { name: "", amount: 100, unit: "g" }])
            }
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar ingrediente
          </Button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Aporte estimado por porción <span className="text-rose-500">*</span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isAiLoading}
              onClick={handleRellenarConIA}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              {isAiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Rellenar con IA
            </Button>
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
            Forma de preparación (pasos) <span className="text-rose-500">*</span>
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

        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50/50">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600 inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Compartir en comunidad
          </span>
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, isPublic: e.target.checked }))
            }
          />
        </label>

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
