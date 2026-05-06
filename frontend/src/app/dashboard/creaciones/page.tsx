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
            Aquí encontrarás todo lo que has creado para tus pacientes, puedes filtrar, buscar y volver a descargar tus creaciones que hayas guardado, ya sea en el módulo de entregable personalizable o en entregables rápidos.
          </p>
        </div>
      </div>
      <CreationsClient initialData={[]} />
    </div>
  );
}
