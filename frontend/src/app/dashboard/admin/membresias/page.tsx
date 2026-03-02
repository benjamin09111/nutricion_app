"use client";

import { useState, useEffect } from "react";
import { Crown, Plus, Edit2, Trash2, Check, X, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import Cookies from "js-cookie";

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

export default function MembershipsPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MembershipPlan>>({});
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/memberships`, {
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
    setEditForm({ ...plan });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/memberships/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error("Error al actualizar");

      toast.success("Plan actualizado correctamente");
      setEditingId(null);
      setEditForm({});
      fetchPlans();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar cambios");
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este plan?")) return;

    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/memberships/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al eliminar");

      toast.success("Plan eliminado");
      fetchPlans();
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar plan");
    }
  };

  const addFeature = () => {
    setEditForm({
      ...editForm,
      features: [...(editForm.features || []), "Nueva característica"],
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...(editForm.features || [])];
    newFeatures[index] = value;
    setEditForm({ ...editForm, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = (editForm.features || []).filter((_, i) => i !== index);
    setEditForm({ ...editForm, features: newFeatures });
  };

  const createNewPlan = async () => {
    const newPlan = {
      name: "Nuevo Plan",
      slug: "nuevo-plan-" + Date.now(),
      description: "Descripción del plan",
      price: 0,
      currency: "CLP",
      billingPeriod: "monthly",
      features: ["Característica 1", "Característica 2"],
      maxPatients: null,
      maxStorage: null,
      isPopular: false,
      isActive: true,
      displayOrder: plans.length,
    };

    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/memberships`, {
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
                className={`rounded-xl border-2 bg-white shadow-sm overflow-hidden transition-all ${
                  plan.isPopular
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
                        {(currentData.features || []).map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 group"
                          >
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) =>
                                updateFeature(index, e.target.value)
                              }
                              className="flex-1 text-sm text-slate-700 border-b border-transparent hover:border-slate-300 focus:border-indigo-600 outline-none bg-transparent"
                              placeholder="Característica"
                            />
                            <button
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
                      plan.features.slice(0, 5).map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-slate-700">
                            {feature}
                          </span>
                        </div>
                      ))
                    )}
                    {!isEditing && plan.features.length > 5 && (
                      <p className="text-xs text-slate-400 pl-6">
                        +{plan.features.length - 5} más...
                      </p>
                    )}
                  </div>

                  {/* Popular Toggle (Only in Edit Mode) */}
                  {isEditing && (
                    <div className="pt-3 border-t border-slate-100">
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
                          Marcar como "Más Popular"
                        </span>
                        <Star className="h-4 w-4 text-amber-500" />
                      </label>
                      <p className="text-xs text-slate-500 ml-6 mt-1">
                        Se mostrará con un badge destacado en la landing page
                      </p>
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
                        onClick={() => deletePlan(plan.id)}
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
    </div>
  );
}
