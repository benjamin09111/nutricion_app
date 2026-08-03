import React from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Textarea } from "@/components/ui/Textarea";
import { TagInput } from "@/components/ui/TagInput";
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";

interface DietConstraintSectionProps {
  dietName: string;
  setDietName: (name: string) => void;
  dietTags: string[];
  setDietTags: (tags: string[]) => void;
  activeConstraints: string[];
  setActiveConstraints: (constraints: string[]) => void;
  availableClassificationTags: string[];
  availableConstraintTags: string[];
  selectedDefaultConstraintIds: Set<string>;
  toggleConstraint: (id: string) => void;
  findNewlyAddedTag: (previousTags: string[], nextTags: string[]) => string | undefined;
  hasTagInList: (list: string[], tagName: string) => boolean;
  normalizeConstraintList: (constraints: string[]) => string[];
  setPendingTagCreation: (creation: { name: string; type: "classification" | "constraint" } | null) => void;
  saveDraft: (overrides?: any) => void;
  deliveryDate: string;
  setDeliveryDate: (date: string) => void;
  description: string;
  setDescription: (description: string) => void;
  planObjective: string;
  setPlanObjective: (objective: string) => void;
  showPlanObjectiveInPdf: boolean;
  setShowPlanObjectiveInPdf: (show: boolean) => void;
  showGeneralInfo?: boolean;
  showClinicalRestriction?: boolean;
}

export const DietConstraintSection: React.FC<DietConstraintSectionProps> = ({
  dietName,
  setDietName,
  dietTags,
  setDietTags,
  activeConstraints,
  setActiveConstraints,
  availableClassificationTags,
  availableConstraintTags,
  selectedDefaultConstraintIds,
  toggleConstraint,
  findNewlyAddedTag,
  hasTagInList,
  normalizeConstraintList,
  setPendingTagCreation,
  saveDraft,
  deliveryDate,
  setDeliveryDate,
  description,
  setDescription,
  planObjective,
  setPlanObjective,
  showPlanObjectiveInPdf,
  setShowPlanObjectiveInPdf,
  showGeneralInfo = true,
  showClinicalRestriction = true,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {showGeneralInfo && <>
      <div className="grid gap-4 md:grid-cols-[1fr_9rem_1fr]">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Título <span className="text-rose-500">*</span></p>
          <Input
            placeholder="Nombre de la creación"
            value={dietName}
            onChange={(e) => setDietName(e.target.value)}
            className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold"
          />
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fecha</p>
          <DatePicker
            value={deliveryDate}
            onChange={(val) => setDeliveryDate(val)}
            placeholder="Fecha..."
          />
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hashtags</p>
          <TagInput
            value={dietTags}
            onChange={(newTags) => {
              setDietTags(newTags);
              const latest = findNewlyAddedTag(dietTags, newTags);
              if (
                latest &&
                !hasTagInList(availableClassificationTags, latest)
              ) {
                setPendingTagCreation({
                  name: latest,
                  type: "classification",
                });
              }
              saveDraft({ dietTags: newTags });
            }}
            placeholder="Ej: keto, hipertrofia"
            suggestions={availableClassificationTags}
            includeSystemSuggestions={false}
            helperText="Selecciona una sugerencia o presiona Enter para usar uno personalizado."
            className="min-h-[44px] rounded-xl border-slate-200 bg-slate-50 shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descripción</p>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Notas internas sobre este plan..."
          className="min-h-[72px] rounded-xl border-slate-200 bg-slate-50 text-sm"
        />
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Objetivo del plan <span className="normal-case font-medium text-slate-400">(opcional)</span></p>
        <Textarea
          value={planObjective}
          onChange={(event) => setPlanObjective(event.target.value)}
          placeholder="Ej: Pérdida de grasa enfocada en alimentos simples"
          className="min-h-[72px] rounded-xl border-slate-200 bg-slate-50 text-sm"
        />
        <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={showPlanObjectiveInPdf}
            onChange={(event) => setShowPlanObjectiveInPdf(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Mostrar objetivo al inicio del PDF
        </label>
      </div>
      </>}

      {showClinicalRestriction && <div className="space-y-6 border-t border-slate-100 pt-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            Restricción clínica
          </label>
        </div>

        <div className="space-y-4">
          <TagInput
            value={activeConstraints}
            onChange={(newTags) => {
              const normalizedTags = normalizeConstraintList(newTags);
              setActiveConstraints(normalizedTags);
              const latest = findNewlyAddedTag(
                activeConstraints,
                normalizedTags,
              );
              if (
                latest &&
                !hasTagInList(availableConstraintTags, latest) &&
                !DEFAULT_CONSTRAINTS.some((constraint) => constraint.id === latest)
              ) {
                setPendingTagCreation({
                  name: latest,
                  type: "constraint",
                });
              }
              saveDraft({ activeConstraints: normalizedTags });
            }}
            placeholder="Buscar o escribir una restricción"
             suggestions={availableConstraintTags}
             disableDelete={true}
             openDirection="up"
             helperText="Selecciona una sugerencia o presiona Enter para usar una restricción personalizada."
           />

        </div>
      </div>}
    </div>
  );
};
