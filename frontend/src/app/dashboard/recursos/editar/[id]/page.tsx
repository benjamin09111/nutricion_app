"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import { ResourceEditor } from "../../ResourceEditor";
import { fetchApi } from "@/lib/api-base";

export default function EditarRecursoPage() {
  const { id } = useParams();
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchResource();
  }, [id]);

  async function fetchResource() {
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const res = await fetchApi(`/resources/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResource(data);
    } catch (error) {
      console.error("Error fetching resource:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
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
