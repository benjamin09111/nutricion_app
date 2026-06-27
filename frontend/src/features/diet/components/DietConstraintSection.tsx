import React from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { TagInput } from "@/components/ui/TagInput";
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
}) => {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
            Nombre de la Dieta <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="Ej: Protocolo Hipertrofia Avanzado"
            value={dietName}
            onChange={(e) => setDietName(e.target.value)}
            className="h-14 text-lg font-bold rounded-2xl border-slate-200 focus:border-emerald-500 bg-slate-50/80 shadow-sm"
          />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
            Etiquetas de Clasificación
          </label>
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
            placeholder="Añadir tags (Keto, Vegano...)"
            suggestions={availableClassificationTags}
            includeSystemSuggestions={false}
            className="min-h-[56px] rounded-2xl border-slate-200 bg-slate-50/80 shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-6 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            Restricciones Clínicas del Plan
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
            placeholder="Buscar o añadir restricción..."
            suggestions={availableConstraintTags}
            disableDelete={true}
          />

          <div className="flex flex-wrap gap-2">
            {DEFAULT_CONSTRAINTS.filter(
              (constraint) =>
                !selectedDefaultConstraintIds.has(constraint.id),
            ).map((constraint) => (
              <button
                key={constraint.id}
                onClick={() => toggleConstraint(constraint.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2",
                  "bg-white border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm",
                )}
              >
                {constraint.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
