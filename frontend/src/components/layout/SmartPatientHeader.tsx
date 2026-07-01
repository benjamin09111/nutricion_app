"use client";

import { useEffect, useState } from "react";
import { User, AlertCircle, ChevronRight, CheckCircle2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface PatientData {
  name: string;
  age: number;
  weight: number;
  height: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  targetCalories: number;
  fitnessGoals?: string[];
}

export const PATIENT_STORAGE_KEY = "nutri_patient";

export default function SmartPatientHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [patient, setPatient] = useState<PatientData | null>(null);

  useEffect(() => {
    // Load on mount and listen to storage events
    const loadPatient = () => {
      const stored = localStorage.getItem(PATIENT_STORAGE_KEY);
      if (stored) {
        try {
          setPatient(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse patient data", e);
        }
      } else {
        setPatient(null);
      }
    };

    loadPatient();

    // Custom event for same-tab updates
    window.addEventListener("patient-updated", loadPatient);
    return () => window.removeEventListener("patient-updated", loadPatient);
  }, []);

  if (pathname.includes("/carrito")) return null; // Don't show in Cart itself potentially, or show differently? User said "en cada etapa".

  return (
    <div
      onClick={() => !patient && router.push("/dashboard/carrito")}
      className={cn(
        "w-full py-2 px-6 flex items-center justify-between transition-all cursor-pointer",
        patient
          ? "bg-emerald-50 border-b border-emerald-100"
          : "bg-red-50 border-b border-red-100 hover:bg-red-100",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-1.5 rounded-full",
            patient ? "bg-emerald-200" : "bg-red-200",
          )}
        >
          {patient ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-800" />
          ) : (
            <AlertCircle className="h-3 w-3 text-red-800" />
          )}
        </div>
        {patient ? (
          <p className="text-xs font-bold text-emerald-900">
            Paciente Seleccionado:{" "}
            <span className="font-black">{patient.name}</span>
            <span className="ml-2 text-emerald-600 font-medium text-[10px] hidden md:inline-block">
              • {patient.targetCalories} kcal • {patient.targetProtein}g Prot
            </span>
          </p>
        ) : (
          <p className="text-xs font-bold text-red-800 uppercase tracking-wide flex items-center gap-2">
            El paciente no ha sido seleccionado
            <span className="text-[10px] font-normal normal-case text-red-600 hidden md:inline-block">
              (Haz clic para ir al Carrito y seleccionarlo)
            </span>
          </p>
        )}
      </div>
      {!patient && <ChevronRight className="h-4 w-4 text-red-400" />}
    </div>
  );
}
