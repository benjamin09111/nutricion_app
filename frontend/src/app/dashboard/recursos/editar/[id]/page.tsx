"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import { ResourceEditor } from "../../ResourceEditor";
import { fetchApi } from "@/lib/api-base";
import { useSubscription } from "@/context/SubscriptionContext";

export default function EditarRecursoPage() {
  const { id } = useParams();
  const router = useRouter();
  const { can, isLoading: isSubscriptionLoading } = useSubscription();
  const canEditResources = can("resources.edit.access");
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && !isSubscriptionLoading && canEditResources) fetchResource();
  }, [id, isSubscriptionLoading, canEditResources]);

  useEffect(() => {
    if (isSubscriptionLoading || canEditResources) return;

    window.dispatchEvent(
      new CustomEvent("show-freemium-upgrade", {
        detail: {
          description: "Editar recursos propios está disponible en los planes de pago.",
        },
      }),
    );
    router.replace("/dashboard/recursos");
  }, [canEditResources, isSubscriptionLoading, router]);

  async function fetchResource() {
    try {
      const res = await fetchApi(`/resources/${id}`, {
      });
      const data = await res.json();
      setResource(data);
    } catch (error) {
      console.error("Error fetching resource:", error);
    } finally {
      setLoading(false);
    }
  }

  if (isSubscriptionLoading || loading || !canEditResources) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h2 className="text-2xl font-black text-slate-900">Recurso no encontrado</h2>
        <p className="text-slate-500">El recurso que intentas editar no existe o no tienes acceso.</p>
      </div>
    );
  }

  return <ResourceEditor initialData={resource} editingId={id as string} />;
}
