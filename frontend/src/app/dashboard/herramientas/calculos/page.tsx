import { Suspense } from "react";
import CalculosClient from "./CalculosClient";

export default function CalculosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Cargando...</div>}>
      <CalculosClient />
    </Suspense>
  );
}
