import React, { type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
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
  setPendingTagCreation?: (creation: { name: string; type: "classification" | "constraint" } | null) => void;
  saveDraft: (overrides?: any) => void;
  deliveryDate: string;
  dateIcon: ReactNode;
  description: string;
  setDescription: (description: string) => void;
  planObjective: string;
  setPlanObjective: (objective: string) => void;
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
  dateIcon,
  description,
  setDescription,
  planObjective,
  setPlanObjective,
  showGeneralInfo = true,
  showClinicalRestriction = true,
}) => {
  return (
    <div className="space-y-6">
      {showGeneralInfo && <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#20212B]">Título <span className="text-rose-500">*</span></p>
          <Input
            placeholder="Nombre de la creación"
            value={dietName}
            onChange={(e) => {
              setDietName(e.target.value);
              saveDraft({ dietName: e.target.value });
            }}
            className="h-10 rounded-xl border-[#E9E5E7] bg-white text-sm font-normal text-[#20212B]"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#20212B]">Hashtags</p>
          <TagInput
            value={dietTags}
            onChange={(newTags) => {
              setDietTags(newTags);
              saveDraft({ dietTags: newTags });
            }}
            placeholder="Ej: keto, hipertrofia"
            suggestions={availableClassificationTags}
            includeSystemSuggestions={false}
            helperText=""
            className="h-10 rounded-xl border-[#E9E5E7] bg-white text-xs font-normal text-[#20212B]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#20212B]">Descripción</p>
        <Textarea
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            saveDraft({ creationDescription: event.target.value });
          }}
          placeholder="Notas internas sobre este plan..."
          className="min-h-[72px] rounded-xl border-[#E9E5E7] bg-white text-xs font-normal text-[#20212B] placeholder:text-[#848792]"
        />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#20212B]">Objetivo del plan <span className="normal-case font-normal text-[#626573]">(opcional)</span></p>
        <Textarea
          value={planObjective}
          onChange={(event) => {
            setPlanObjective(event.target.value);
            saveDraft({ planObjective: event.target.value });
          }}
          placeholder="Ej: Pérdida de grasa enfocada en alimentos simples"
          className="min-h-[72px] rounded-xl border-[#E9E5E7] bg-white text-xs font-normal text-[#20212B] placeholder:text-[#848792]"
        />
      </div>
      </>}

      {showClinicalRestriction && <div className="space-y-4 border-t border-[#F0ECEE] pt-5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#20212B] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            Restricción clínica
          </label>
        </div>

        <div className="space-y-4">
          <TagInput
            value={activeConstraints}
            onChange={(newTags) => {
              const normalizedTags = normalizeConstraintList(newTags);
              setActiveConstraints(normalizedTags);
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
