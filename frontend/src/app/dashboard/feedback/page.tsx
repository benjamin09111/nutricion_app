import { FeedbackForm } from "./FeedbackForm";

export default function FeedbackPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="md:flex md:items-center md:justify-between px-2 mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Centro de Feedback
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Ayúdanos a construir la mejor plataforma para nutricionistas.
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <FeedbackForm />
      </div>
    </div>
  );
}
