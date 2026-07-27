import { FeedbackForm } from "./FeedbackForm";

export default function FeedbackPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 mb-6 sm:mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Centro de Feedback
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
            En esta sección puedes enviar tus sugerencias, comentarios o reportes. Esto nos ayuda a crear un mejor servicio para ustedes, los nutricionistas, y crecer, añadiendo y mejorando funcionalidades. Puedes dejar <b>tu testimonio</b> para aparecer en nuestra página principal. Todo comentario se agradece y es bienvenido.
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <FeedbackForm />
      </div>
    </div>
  );
}
