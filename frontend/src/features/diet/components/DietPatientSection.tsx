import React from "react";
import { User } from "lucide-react";
import { DietPatient } from "../utils/diet-helpers";

interface DietPatientSectionProps {
  selectedPatient: DietPatient | null;
  handleUnlinkPatient: () => void;
}

export const DietPatientSection: React.FC<DietPatientSectionProps> = ({
  selectedPatient,
  handleUnlinkPatient,
}) => {
  if (!selectedPatient) return null;

  return (
    <div className="mb-6 animate-in slide-in-from-top duration-300">
      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center border border-emerald-200">
            <User className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">
              Paciente Vinculado
            </p>
            <h3 className="text-xl font-black text-slate-900 italic leading-none">
              {selectedPatient.fullName}
            </h3>
          </div>
        </div>
        <button
          onClick={handleUnlinkPatient}
          className="bg-white/50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200/50 hover:border-rose-200 transition-all cursor-pointer"
        >
          Cambiar o Desvincular
        </button>
      </div>
    </div>
  );
};
