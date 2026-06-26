"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Plus, Edit2, Trash2, Check, X, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { fetchApi } from "@/lib/api-base";
import { cn } from "@/lib/utils";
import { getMembershipFeatureDisplay } from "@/features/memberships/utils/feature-format";

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  billingPeriod: string;
  features: string[];
  maxPatients: number | null;
  maxStorage: number | null;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
}

type FeatureDraft = {
  id: string;
  text: string;
  isExcluded: boolean;
};

type MembershipPlanForm = Omit<Partial<MembershipPlan>, "features"> & {
  features?: FeatureDraft[];
};

const FEATURE_PREFIX_INCLUDED = "✓";
const FEATURE_PREFIX_EXCLUDED = "X";

const parseFeatureDraft = (value: string): FeatureDraft => {
  const featureDisplay = getMembershipFeatureDisplay(value);

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: featureDisplay.label,
    isExcluded: featureDisplay.isExcluded,
  };
};

const serializeFeatureDraft = (feature: FeatureDraft) => {
  const text = feature.text.trim();

  if (!text) {
    return null;
  }

  return `${feature.isExcluded ? FEATURE_PREFIX_EXCLUDED : FEATURE_PREFIX_INCLUDED} ${text}`;
};

const renderBoldText = (text: string) => {
  const parts: Array<string | ReactNode> = [];
  const pattern = /\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    parts.push(
      <strong key={`${match.index}-${match[1]}`} className="font-semibold text-slate-900">
        {match[1]}
      </strong>,
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

export default function MembershipsPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MembershipPlanForm>({});
  const [copyFromPlanId, setCopyFromPlanId] = useState<string>("");
  const [draggedFeatureIndex, setDraggedFeatureIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/memberships`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al cargar planes");
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los planes");
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (plan: MembershipPlan) => {
    setEditingId(plan.id);
    setCopyFromPlanId("");
    setDraggedFeatureIndex(null);
    setEditForm({
      ...plan,
      features: plan.features.map((feature) => parseFeatureDraft(feature)),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setCopyFromPlanId("");
    setDraggedFeatureIndex(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const payload = {
      ...editForm,
      features: (editForm.features || [])
        .map(serializeFeatureDraft)
        .filter((feature): feature is string => Boolean(feature)),
    };

    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/memberships/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error al actualizar");

      toast.success("Plan actualizado correctamente");
      setEditingId(null);
      setEditForm({});
      setCopyFromPlanId("");
      setDraggedFeatureIndex(null);
      fetchPlans();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar cambios");
    }
  };

  const deletePlan = async () => {
    if (!planToDelete) return;

    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/memberships/${planToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al eliminar");

      toast.success("Plan eliminado");
      fetchPlans();
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar plan");
    } finally {
      setIsDeleteConfirmOpen(false);
      setPlanToDelete(null);
    }
  };

  const addFeature = () => {
    setEditForm({
      ...editForm,
      features: [
        ...(editForm.features || []),
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          text: "",
          isExcluded: false,
        },
      ],
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...(editForm.features || [])];
    newFeatures[index] = {
      ...newFeatures[index],
      text: value,
    };
    setEditForm({ ...editForm, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = (editForm.features || []).filter((_, i) => i !== index);
    setEditForm({ ...editForm, features: newFeatures });
  };

  const toggleFeatureType = (index: number) => {
    const newFeatures = [...(editForm.features || [])];
    newFeatures[index] = {
      ...newFeatures[index],
      isExcluded: !newFeatures[index].isExcluded,
    };
    setEditForm({ ...editForm, features: newFeatures });
  };

  const moveFeature = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newFeatures = [...(editForm.features || [])];
    const [movedFeature] = newFeatures.splice(fromIndex, 1);
    if (!movedFeature) return;

    newFeatures.splice(toIndex, 0, movedFeature);
    setEditForm({ ...editForm, features: newFeatures });
  };

  const handleFeatureDrop = (fromIndex: number, toIndex: number) => {
    moveFeature(fromIndex, toIndex);
    setDraggedFeatureIndex(null);
  };

  const copyFeaturesFromPlan = () => {
    if ((editForm.features || []).length > 0) {
      toast.info("Vacía las características antes de copiar otro plan");
      return;
    }

    if (!copyFromPlanId) {
      toast.error("Selecciona un plan para copiar");
      return;
    }

    const sourcePlan = plans.find((plan) => plan.id === copyFromPlanId);

    if (!sourcePlan) {
      toast.error("No se encontró el plan base");
      return;
    }

    setEditForm({
      ...editForm,
      features: sourcePlan.features.map((feature) => parseFeatureDraft(feature)),
    });
  };

  const createNewPlan = async () => {
    const newPlan = {
      name: "Nuevo Plan",
      slug: "nuevo-plan-" + Date.now(),
      description: "Descripción del plan",
      price: 0,
      currency: "CLP",
      billingPeriod: "monthly",
      features: [],
      maxPatients: null,
      maxStorage: null,
      isPopular: false,
      isActive: true,
      displayOrder: plans.length,
    };

    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/memberships`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPlan),
      });

      if (!response.ok) throw new Error("Error al crear plan");

      toast.success("Plan creado. Haz clic en Editar para personalizarlo.");
      fetchPlans();
    } catch (error) {
      console.error(error);
      toast.error("Error al crear plan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-indigo-900">
            Gestión de Membresías
          </h1>
          <p className="text-slate-500">
            Administra los planes que se mostrarán en la landing page
          </p>
        </div>
        <Button
          onClick={createNewPlan}
          className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">
          Cargando planes...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isEditing = editingId === plan.id;
            const currentData = isEditing ? editForm : plan;

            return (
              <div
                key={plan.id}
                className={`rounded-xl border-2 bg-white shadow-sm overflow-hidden transition-all ${plan.isPopular
                    ? "border-indigo-500 ring-2 ring-indigo-200"
                    : "border-slate-200"
                  }`}
              >
{/* Popular Badge */}
                  {plan.isPopular && (
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-1.5 text-xs font-semibold">
                      ⭐ Más Popular
                    </div>
                  )}

                  {/* Active Badge */}
                  {!isEditing && (
                    <div className="flex items-center justify-center gap-1.5">
                      <div className={cn("w-2 h-2 rounded-full", plan.isActive ? "bg-green-500" : "bg-slate-300")} />
                      <span className={cn("text-xs font-medium", plan.isActive ? "text-green-600" : "text-slate-400")}>
                        {plan.isActive ? "Visible" : "Oculto"}
                      </span>
                    </div>
                  )}

                {/* Card Content */}
                <div className="p-4 space-y-3">
                  {/* Plan Name */}
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.name || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="text-xl font-bold text-slate-900 w-full border-b-2 border-indigo-300 focus:border-indigo-600 outline-none bg-transparent"
                        placeholder="Nombre del plan"
                      />
                    ) : (
                      <h3
                        className="text-xl font-bold text-slate-900"
                        onDoubleClick={() => isEditing && startEdit(plan)}
                      >
                        {plan.name}
                      </h3>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    {isEditing ? (
                      <>
                        <span className="text-3xl font-bold text-indigo-600">
                          $
                        </span>
                        <input
                          type="number"
                          value={currentData.price || 0}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="text-3xl font-bold text-indigo-600 w-28 border-b-2 border-indigo-300 focus:border-indigo-600 outline-none bg-transparent"
                        />
                        <span className="text-slate-500">/ mes</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-indigo-600">
                          ${plan.price.toLocaleString("es-CL")}
                        </span>
                        <span className="text-slate-500">/ mes</span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  {isEditing ? (
                    <textarea
                      value={currentData.description || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full text-sm text-slate-600 border rounded-md p-2 focus:border-indigo-600 outline-none"
                      rows={2}
                      placeholder="Descripción del plan"
                    />
                  ) : (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  {/* Features */}
                  <div className="space-y-1.5 pt-2">
                    {isEditing ? (
                      <>
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 space-y-3">
                          <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
                            <label className="space-y-1">
                              <span className="block text-xs font-medium text-slate-600">
                                Copiar características de
                              </span>
                              <select
                                value={copyFromPlanId}
                                onChange={(e) => setCopyFromPlanId(e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-600"
                              >
                                <option value="">Selecciona un plan</option>
                                {plans
                                  .filter((sourcePlan) => sourcePlan.id !== plan.id)
                                  .map((sourcePlan) => (
                                    <option key={sourcePlan.id} value={sourcePlan.id}>
                                      {sourcePlan.name}
                                    </option>
                                  ))}
                              </select>
                            </label>
                            <Button
                              type="button"
                              onClick={copyFeaturesFromPlan}
                              disabled={(editForm.features || []).length > 0}
                              className="cursor-pointer bg-slate-900 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              Copiar características
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500">
                            Solo se copiarán las características. Si ya llenaste líneas,
                            vacíalas primero para reemplazarlas.
                          </p>
                        </div>

                        {(editForm.features || []).map((feature, index) => (
                          <div
                            key={feature.id}
                            draggable
                            onDragStart={(e) => {
                              setDraggedFeatureIndex(index);
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", String(index));
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedFeatureIndex === null) return;
                              handleFeatureDrop(draggedFeatureIndex, index);
                            }}
                            onDragEnd={() => setDraggedFeatureIndex(null)}
                            className={`flex items-start gap-2 group rounded-md transition-colors cursor-grab active:cursor-grabbing ${
                              draggedFeatureIndex === index
                                ? "bg-indigo-50 opacity-70"
                                : "hover:bg-slate-100"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleFeatureType(index)}
                              className="mt-0.5 shrink-0 cursor-pointer"
                              aria-label={feature.isExcluded ? "Marcar como incluido" : "Marcar como excluido"}
                            >
                              {feature.isExcluded ? (
                                <X className="h-4 w-4 text-red-500" />
                              ) : (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </button>
                            <input
                              type="text"
                              value={feature.text}
                              onChange={(e) =>
                                updateFeature(index, e.target.value)
                              }
                              className="flex-1 text-sm text-slate-700 border-b border-transparent hover:border-slate-300 focus:border-indigo-600 outline-none bg-transparent"
                              placeholder="Característica X"
                            />
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={addFeature}
                          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-xs font-medium transition-colors cursor-pointer mt-2"
                        >
                          <Plus className="h-3 w-3" />
                          Agregar característica
                        </button>
                      </>
                    ) : (
                      plan.features.map((feature, index) => {
                        const featureDisplay = getMembershipFeatureDisplay(feature);

                        return (
                          <div key={index} className="flex items-start gap-2">
                            {featureDisplay.isExcluded ? (
                              <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            ) : (
                              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            )}
                            <span className="text-sm text-slate-700">
                              {renderBoldText(featureDisplay.label)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Popular Toggle (Only in Edit Mode) */}
                  {isEditing && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentData.isPopular || false}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              isPopular: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 font-medium">
                          Marcar como &quot;Más Popular&quot;
                        </span>
                        <Star className="h-4 w-4 text-amber-500" />
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentData.isActive ?? true}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              isActive: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 font-medium">
                          Visible en landing
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={saveEdit}
                          className="flex-1 bg-green-600 hover:bg-green-700 cursor-pointer text-sm py-2"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          variant="ghost"
                          className="flex-1 cursor-pointer text-sm py-2"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                      <Button
                        onClick={() => {
                          setPlanToDelete(plan.id);
                          setIsDeleteConfirmOpen(true);
                        }}
                        variant="ghost"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer text-sm py-2"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar Plan
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => startEdit(plan)}
                      className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2"
                    >
                      <Edit2 className="h-3 w-3 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setPlanToDelete(null);
        }}
        onConfirm={deletePlan}
        title="¿Eliminar plan?"
        description="¿Estás seguro de eliminar este plan de membresía? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        variant="destructive"
      />
    </div>
  );
}
