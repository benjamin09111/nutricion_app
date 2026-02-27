"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Globe,
  Tag,
  X,
  User as UserIcon,
  Activity,
  Ruler,
  Weight,
  Target,
  Zap,
  Dumbbell,
  Lock,
  Hash,
} from "lucide-react";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";

import { DEFAULT_CONSTRAINTS, DEFAULT_METRICS } from "@/lib/constants";

export default function DetailsClient() {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Metrics state
  const [metrics, setMetrics] = useState<any[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [isAddMetricModalOpen, setIsAddMetricModalOpen] = useState(false);
  const [newMetric, setNewMetric] = useState({
    name: "",
    unit: "",
    key: "",
    icon: "Activity",
    color: "#64748b",
  });
  const [metricToDelete, setMetricToDelete] = useState<any>(null);
  const [isDeleteMetricConfirmOpen, setIsDeleteMetricConfirmOpen] =
    useState(false);
  const [metricsSearchQuery, setMetricsSearchQuery] = useState("");
  const [serverTags, setServerTags] = useState<any[]>([]);

  const fetchTags = async (retries = 3) => {
    setIsLoading(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const response = await fetch(`${apiUrl}/tags`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setServerTags(data);
        setTags(data.map((t: any) => t.name));
      } else {
        setTags([]);
        setServerTags([]);
      }
    } catch (error) {
      if (retries > 0) {
        setTimeout(() => fetchTags(retries - 1), 2000);
      } else {
        console.error("Error fetching tags", error);
        toast.error("Error al cargar las restricciones");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const response = await fetch(`${apiUrl}/metrics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching metrics", error);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
    fetchMetrics();
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Separate tags by category
  const healthTags = serverTags.filter(t => !t.name.startsWith('#')).map(t => t.name);
  const hashTags = serverTags.filter(t => t.name.startsWith('#')).map(t => t.name);

  const allHealthTags = Array.from(
    new Set([...DEFAULT_CONSTRAINTS.map((c) => c.id), ...healthTags]),
  );

  const filteredHealthTags = allHealthTags.filter((tag) =>
    tag.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredHashTags = hashTags.filter((tag) =>
    tag.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddTag = async () => {
    if (!newTag.trim()) {
      toast.error("El nombre de la restricción está vacío");
      return;
    }

    if (allHealthTags.includes(newTag.trim()) || hashTags.includes(newTag.trim())) {
      toast.error("Esta restricción o etiqueta ya existe");
      return;
    }

    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const response = await fetch(`${apiUrl}/tags`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newTag.trim() }),
      });

      if (response.ok) {
        toast.success("Restricción creada exitosamente");
        setNewTag("");
        setIsAddModalOpen(false);
        fetchTags();
      } else {
        const res = await response.json();
        toast.error(res.message || "Error al crear la restricción");
      }
    } catch (error) {
      console.error("Error creating tag", error);
      toast.error("Error al conectar con el servidor");
    }
  };

  const openDeleteConfirm = (tagName: string) => {
    if (DEFAULT_CONSTRAINTS.some((c) => c.id === tagName)) {
      toast.error(
        "Las restricciones globales del sistema no se pueden eliminar.",
      );
      return;
    }
    setTagToDelete(tagName);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;
    const tagName = tagToDelete;

    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const backendTag = serverTags.find((t: any) => t.name === tagName);
      if (backendTag && backendTag.id) {
        const delReq = await fetch(`${apiUrl}/tags/${backendTag.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (delReq.ok) {
          toast.success("Restricción eliminada");
          fetchTags();
        } else {
          const err = await delReq.json();
          toast.error(err.message || "Error al eliminar");
        }
      } else {
        toast.error(
          "Esta restricción no se pudo encontrar en tu base de datos",
        );
      }
    } catch (e) {
      toast.error("Error de red");
    } finally {
      setIsDeleteConfirmOpen(false);
      setTagToDelete(null);
    }
  };

  const handleAddMetric = async () => {
    if (!newMetric.name || !newMetric.unit) {
      toast.error("Nombre y unidad son requeridos");
      return;
    }

    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const response = await fetch(`${apiUrl}/metrics`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMetric),
      });

      if (response.ok) {
        toast.success("Métrica creada");
        setIsAddMetricModalOpen(false);
        setNewMetric({
          name: "",
          unit: "",
          key: "",
          icon: "Activity",
          color: "#64748b",
        });
        fetchMetrics();
      } else {
        const res = await response.json();
        toast.error(res.message || "Error al crear la métrica");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDeleteMetric = async () => {
    if (!metricToDelete) return;

    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const response = await fetch(`${apiUrl}/metrics/${metricToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Métrica eliminada");
        fetchMetrics();
      } else {
        const err = await response.json();
        toast.error(err.message || "Error al eliminar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeleteMetricConfirmOpen(false);
      setMetricToDelete(null);
    }
  };

  const getMetricIcon = (iconName: string) => {
    const icons: any = { Activity, Ruler, Weight, Target, Zap, Dumbbell };
    return icons[iconName] || Activity;
  };

  return (
    <ModuleLayout
      title="Detalles Generales"
      description="Administra preferencias, restricciones y configuraciones globales para tus pacientes y dietas."
      className="pb-8"
    >
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteTag}
        title="¿Eliminar restricción?"
        description={`¿Estás seguro de que deseas eliminar la restricción '${tagToDelete}'? Esta acción no se puede deshacer y podría afectar a los pacientes o recursos que la tengan asignada.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />

      <div className="space-y-6 mt-6">
        <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 rounded-3xl overflow-hidden relative mb-8">
          <div className="p-8 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-slate-800 font-extrabold text-lg mb-2 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-500" />
                Restricciones Clínicas
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                Estas restricciones estarán disponibles globalmente en el
                creador de dietas y recursos.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Restricción
            </Button>
          </div>

          <div className="px-8 mb-4">
            <div className="relative w-full max-w-xs group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <Input
                placeholder="Buscar restricciones..."
                className="h-10 pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="h-10 w-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-8 pt-4">
              {filteredHealthTags.map((tag) => {
                const isSystem = DEFAULT_CONSTRAINTS.some((c) => c.id === tag);
                const backendTag = serverTags.find((t) => t.name === tag);
                const isOwner =
                  backendTag &&
                  currentUser?.nutritionist?.id === backendTag.nutritionistId;
                const isAdmin = currentUser?.role?.startsWith("ADMIN");

                return (
                  <div
                    key={tag}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          isSystem ? "bg-rose-100/50" : "bg-slate-100/50",
                        )}
                      >
                        {isSystem ? (
                          <Globe className="w-4 h-4 text-rose-500" />
                        ) : (
                          <Activity className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">{tag}</p>
                        <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                          {isSystem
                            ? "Sistema / Global"
                            : isOwner
                              ? "Creada por ti"
                              : "Creada por nutri"}
                        </p>
                      </div>
                    </div>
                    {(isOwner || isAdmin) && !isSystem && (
                      <button
                        onClick={() => openDeleteConfirm(tag)}
                        className="p-2 hover:bg-rose-100 text-slate-300 hover:text-rose-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Classification Tags Section */}
        <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 rounded-3xl overflow-hidden relative mb-8">
          <div className="p-8 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-slate-800 font-extrabold text-lg mb-2 flex items-center gap-2">
                <Hash className="w-5 h-5 text-emerald-500" />
                Etiquetas de Clasificación
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                Usa hashtags para organizar a tus pacientes (#Proteína, #Ayuno, #Folleto).
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl font-bold border-emerald-100 text-emerald-600 hover:bg-emerald-50"
              onClick={() => {
                setNewTag("#");
                setIsAddModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Tag
            </Button>
          </div>

          {!isLoading && filteredHashTags.length === 0 && searchQuery === "" ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30 m-8 rounded-2xl border border-dashed border-slate-200">
              <Hash className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">No hay etiquetas creadas</p>
              <p className="text-xs font-medium mt-1">Crea etiquetas con # para organizar tus pacientes</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-8 pt-4">
              {filteredHashTags.map((tag) => {
                const backendTag = serverTags.find((t) => t.name === tag);
                const isOwner =
                  backendTag &&
                  currentUser?.nutritionist?.id === backendTag.nutritionistId;
                const isAdmin = currentUser?.role?.startsWith("ADMIN");

                return (
                  <div
                    key={tag}
                    className="flex items-center justify-between p-4 rounded-xl border border-emerald-50 bg-emerald-50/10 hover:bg-emerald-50/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100/50 flex items-center justify-center">
                        <Hash className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">{tag}</p>
                        <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                          {isOwner ? "Tu etiqueta" : "Compartida"}
                        </p>
                      </div>
                    </div>
                    {(isOwner || isAdmin) && (
                      <button
                        onClick={() => openDeleteConfirm(tag)}
                        className="p-2 hover:bg-rose-100 text-slate-300 hover:text-rose-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 rounded-3xl overflow-hidden relative">
          <div className="p-8 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-slate-800 font-extrabold text-lg mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Métricas de Seguimiento
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                Define las métricas que verás por defecto en el progreso de tus
                pacientes.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
              onClick={() => setIsAddMetricModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Métrica
            </Button>
          </div>

          <div className="px-8 mb-4">
            <div className="relative w-full max-w-xs group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <Input
                placeholder="Buscar métricas..."
                className="h-10 pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-sm"
                value={metricsSearchQuery}
                onChange={(e) => setMetricsSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {metricsLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="h-10 w-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-8 pt-4">
              {(() => {
                // Combinar métricas por defecto con las del servidor
                const allMetrics: any[] = [
                  ...DEFAULT_METRICS.map((m) => ({
                    ...m,
                    id: m.key,
                    isSystem: true,
                    nutritionistId: null,
                  })),
                ];

                metrics.forEach((sm) => {
                  if (!allMetrics.find((am) => am.key === sm.key)) {
                    allMetrics.push({ ...sm, isSystem: false });
                  }
                });

                return allMetrics
                  .filter((m) =>
                    m.name
                      .toLowerCase()
                      .includes(metricsSearchQuery.toLowerCase()),
                  )
                  .map((metric) => {
                    const isSystem = metric.isSystem === true;
                    const isOwner = !isSystem;
                    const isAdmin = currentUser?.role?.startsWith("ADMIN");
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const Icon = getMetricIcon(metric.icon);

                    return (
                      <div
                        key={metric.id || metric.key}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center",
                              isSystem ? "bg-blue-100/50" : "bg-emerald-100/50",
                            )}
                          >
                            {isSystem ? (
                              <Globe className="w-4 h-4 text-blue-500" />
                            ) : (
                              <UserIcon className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">
                              {metric.name}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                              {isSystem
                                ? "Sistema / Global"
                                : isOwner
                                  ? "Creada por ti"
                                  : "Creada por nutri"}
                            </p>
                          </div>
                        </div>
                        {(isOwner || isAdmin) && !isSystem && (
                          <button
                            onClick={() => {
                              setMetricToDelete(metric);
                              setIsDeleteMetricConfirmOpen(true);
                            }}
                            className="p-2 hover:bg-rose-100 text-slate-300 hover:text-rose-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  });
              })()}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Crear Nueva Restricción"
      >
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Nombre de la Restricción
            </label>
            <Input
              placeholder="Ej: Pescetariano, Alergia al Maní..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="rounded-xl border-slate-200 h-11 text-slate-900"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTag();
              }}
            />
            <p className="text-xs text-slate-400 mt-2 font-medium">
              <Globe className="w-3 h-3 inline mr-1 text-emerald-500" />
              Esta restricción será{" "}
              <span className="text-emerald-600 font-bold">Global</span>. Otros
              nutricionistas podrán verla y reutilizarla para evitar duplicados.
              Solo tú podrás eliminarla.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="ghost"
              className="rounded-xl font-bold text-slate-400"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-slate-900 text-white rounded-xl font-black px-8 shadow-lg shadow-slate-200"
              onClick={handleAddTag}
            >
              Crear
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para Nueva Métrica */}
      <Modal
        isOpen={isAddMetricModalOpen}
        onClose={() => setIsAddMetricModalOpen(false)}
        title="Crear Nueva Métrica"
      >
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Nombre de la Métrica
              </label>
              <Input
                placeholder="Ej: Circunferencia de Brazo, Pliegue Cutáneo..."
                value={newMetric.name}
                onChange={(e) =>
                  setNewMetric({ ...newMetric, name: e.target.value })
                }
                className="rounded-xl border-slate-200 h-11 text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Unidad (Opcional)
              </label>
              <select
                value={newMetric.unit}
                onChange={(e) =>
                  setNewMetric({ ...newMetric, unit: e.target.value })
                }
                className="w-full rounded-xl border-slate-200 h-11 text-slate-900 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all font-medium"
              >
                <option value="" disabled>
                  Selecciona una unidad...
                </option>
                <option value="kg">kg (Kilogramos)</option>
                <option value="g">g (Gramos)</option>
                <option value="cm">cm (Centímetros)</option>
                <option value="mm">mm (Milímetros)</option>
                <option value="%">% (Porcentaje)</option>
                <option value="mg/dL">mg/dL</option>
                <option value="mmol/L">mmol/L</option>
                <option value="kcal">kcal</option>
                <option value="latidos/min">latidos/min</option>
                <option value="hrs">hrs</option>
                <option value="mins">mins</option>
                <option value="niveles">niveles (1-10)</option>
                <option value="unidades">unidades</option>
              </select>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              <Globe className="w-3 h-3 inline mr-1 text-emerald-500" />
              Esta métrica será{" "}
              <span className="text-emerald-600 font-bold">Global</span>. Otros
              nutricionistas podrán verla y reutilizarla. Solo tú podrás
              eliminarla.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="ghost"
              className="rounded-xl font-bold text-slate-400"
              onClick={() => setIsAddMetricModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-slate-900 text-white rounded-xl font-black px-8 shadow-lg shadow-slate-200"
              onClick={handleAddMetric}
            >
              Crear
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmación Eliminar Métrica */}
      <ConfirmationModal
        isOpen={isDeleteMetricConfirmOpen}
        onClose={() => setIsDeleteMetricConfirmOpen(false)}
        onConfirm={handleDeleteMetric}
        title="¿Eliminar métrica?"
        description={`¿Estás seguro de que deseas eliminar la métrica '${metricToDelete?.name}'? Esta acción no se puede deshacer y los datos históricos de los pacientes podrían verse afectados.`}
        confirmText="Sí, eliminar"
        variant="destructive"
      />
    </ModuleLayout>
  );
}
