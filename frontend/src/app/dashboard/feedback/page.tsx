"use client";

import { Star } from "lucide-react";
import { FeedbackForm } from "./FeedbackForm";

export default function FeedbackPage() {
  const handleOpenRating = () => {
    window.dispatchEvent(new CustomEvent("open-app-rating"));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-2 mb-6 sm:mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Centro de Feedback & Valoración
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
            En esta sección puedes enviar tus sugerencias, comentarios o reportes. Esto nos ayuda a crear un mejor servicio para ustedes, los nutricionistas, y crecer, añadiendo y mejorando funcionalidades. Puedes dejar <b>tu testimonio</b> para aparecer en nuestra página principal.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenRating}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-xs font-black text-white shadow-lg transition-transform active:scale-95 hover:from-amber-600 hover:to-amber-700 shrink-0 cursor-pointer"
        >
          <Star className="h-4 w-4 fill-white" />
          <span>Valorar NutriNet (⭐ 1-5)</span>
        </button>
      </div>

      <div className="flex justify-center">
        <FeedbackForm />
      </div>
    </div>
  );
}
