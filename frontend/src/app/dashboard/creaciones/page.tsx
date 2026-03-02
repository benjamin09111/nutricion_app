import CreationsClient from "./CreationsClient";
import { Creation, CreationType } from "@/features/creations/types";

export default function CreationsPage() {
  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between px-2">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Mis Creaciones
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Gestiona y descarga todos los recursos generados para tus pacientes.
          </p>
        </div>
      </div>
      <CreationsClient initialData={[]} />
    </div>
  );
}
