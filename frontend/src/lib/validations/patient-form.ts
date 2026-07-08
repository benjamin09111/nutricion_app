import * as z from "zod";
import { validateRut } from "@/lib/rut-utils";

const DECIMAL_REGEX = /^\d*\.?\d*$/;
const KILOS_REGEX = /^\d+(\.\d{1,2})?$/;

export const patientFormSchema = z
  .object({
    fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().min(1, "El email es requerido").email("Email no válido"),
    phone: z.string().optional(),
    documentId: z.string().optional(),
    birthDate: z.string().min(1, "La fecha de nacimiento es requerida"),
    gender: z.enum(["Masculino", "Femenino", "Otro"], {
      message: "El sexo biológico es requerido",
    }),

    pregnant: z.boolean().optional(),
    pregnancyWeeks: z.string().optional(),
    pregestationalWeight: z.string().optional(),
    pregnancyType: z.string().optional(),

    weight: z.string().min(1, "El peso es requerido"),
    height: z.string().min(1, "La altura es requerida"),

    pliegueTricipital: z.string().optional(),
    pliegueBicipital: z.string().optional(),
    pliegueSubescapular: z.string().optional(),
    pliegueSuprailiaco: z.string().optional(),
    alturaRodilla: z.string().optional(),
    circunferenciaPantorrilla: z.string().optional(),
    circunferenciaBraquial: z.string().optional(),
    circunferenciaCintura: z.string().optional(),
    circunferenciaCadera: z.string().optional(),

    nutritionalFocus: z.string().optional(),
    fitnessGoals: z.string().optional(),
    activityLevel: z.enum(["sedentario", "ligero", "moderado", "activo", "muy_activo"]),
    dietRestrictions: z
      .preprocess((val) => {
        if (val === null || val === undefined || val === "") return [];
        if (typeof val === "string") return [val];
        return val;
      }, z.array(z.string()))
      .optional(),

    pesoHabitual: z.string().optional(),
    pesoObjetivoProf: z.string().optional(),
    manualCaloriesAdjustment: z.string().optional(),
    motivoConsulta: z.string().optional(),
    diagnosticoNutricional: z.string().optional(),

    occupation: z.string().optional(),
    workSchedule: z.string().optional(),
    medications: z.string().optional(),
    drugsSupplements: z.string().optional(),
    diagnosedPathologies: z.string().optional(),

    likes: z.string().optional(),
    rejectedFoods: z.string().optional(),
    clinicalSummary: z.string().optional(),
    familyHistory: z.string().optional(),
    sleepQuality: z.string().optional(),
    perceivedStress: z.string().optional(),
    weeklyExercise: z.string().optional(),
    gestationalSymptoms: z
      .preprocess((val) => {
        if (val === null || val === undefined || val === "") return [];
        if (typeof val === "string") return [val];
        return val;
      }, z.array(z.string()))
      .optional(),
    gestationalSupplementation: z
      .preprocess((val) => {
        if (val === null || val === undefined || val === "") return [];
        if (typeof val === "string") return [val];
        return val;
      }, z.array(z.string()))
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.pregnant) {
      const weeks = data.pregnancyWeeks || "";
      if (!weeks.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Las semanas de gestación son requeridas",
          path: ["pregnancyWeeks"],
        });
      } else if (!/^\d+$/.test(weeks)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debe ser un número entero",
          path: ["pregnancyWeeks"],
        });
      } else {
        const n = parseInt(weeks, 10);
        if (n < 1 || n > 42) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debe estar entre 1 y 42 semanas",
            path: ["pregnancyWeeks"],
          });
        }
      }
    }

    if (data.weight) {
      const raw = data.weight.replace(",", ".");
      if (!KILOS_REGEX.test(raw)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debe ser un número con hasta 2 decimales",
          path: ["weight"],
        });
      } else {
        const n = parseFloat(raw);
        if (n < 20 || n > 500) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debe estar entre 20 y 500 kg",
            path: ["weight"],
          });
        }
      }
    }

    if (data.height) {
      const raw = data.height.replace(",", ".");
      const cleaned = raw.replace(/[^\d.]/g, "");
      if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debe ser un número con hasta 2 decimales",
          path: ["height"],
        });
      } else {
        const n = parseFloat(cleaned);
        if (n < 50 || n > 260) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debe estar entre 50 y 260 cm",
            path: ["height"],
          });
        }
      }
    }

    if (data.documentId && data.documentId.length > 1) {
      if (!validateRut(data.documentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "RUT no válido (dígito verificador incorrecto)",
          path: ["documentId"],
        });
      }
    }

    if (data.phone && data.phone.trim().length > 0) {
      const digits = data.phone.replace(/\D/g, "");
      if (digits.length < 9) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El teléfono debe tener al menos 9 dígitos",
          path: ["phone"],
        });
      }
    }

    const numericFields = [
      { key: "pregestationalWeight", label: "Peso pre-gestacional", max: 300 },
      { key: "pliegueTricipital", label: "Pliegue tricipital", max: 100 },
      { key: "pliegueBicipital", label: "Pliegue bicipital", max: 100 },
      { key: "pliegueSubescapular", label: "Pliegue subescapular", max: 100 },
      { key: "pliegueSuprailiaco", label: "Pliegue suprailiaco", max: 100 },
      { key: "alturaRodilla", label: "Altura de rodilla", max: 200 },
      { key: "circunferenciaPantorrilla", label: "Circ. pantorrilla", max: 200 },
      { key: "circunferenciaBraquial", label: "Circ. braquial", max: 200 },
      { key: "circunferenciaCintura", label: "Circ. cintura", max: 300 },
      { key: "circunferenciaCadera", label: "Circ. cadera", max: 300 },
      { key: "pesoHabitual", label: "Peso habitual", max: 500 },
      { key: "pesoObjetivoProf", label: "Peso objetivo profesional", max: 500 },
      { key: "manualCaloriesAdjustment", label: "Ajuste calórico manual", max: 5000 },
    ] as const;

    for (const field of numericFields) {
      const value = data[field.key as keyof typeof data] as string | undefined;
      if (!value || !value.trim()) continue;
      const raw = value.replace(",", ".");
      const path = [field.key] as [string, ...string[]];
      if (!DECIMAL_REGEX.test(raw)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debe ser un número válido",
          path,
        });
      } else {
        const n = parseFloat(raw);
        if (n < 0 || n > field.max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Debe estar entre 0 y ${field.max}`,
            path,
          });
        }
      }
    }

    if (data.birthDate) {
      const date = new Date(data.birthDate);
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fecha no válida",
          path: ["birthDate"],
        });
      } else if (date > new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La fecha no puede ser futura",
          path: ["birthDate"],
        });
      } else {
        const ageMs = Date.now() - date.getTime();
        const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
        if (ageYears > 150) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La edad no puede superar los 150 años",
            path: ["birthDate"],
          });
        }
      }
    }
  });

export type PatientFormData = z.infer<typeof patientFormSchema>;

export const STEP_FIELDS: Record<number, (keyof PatientFormData)[]> = {
  0: [
    "fullName",
    "email",
    "phone",
    "birthDate",
    "gender",
    "documentId",
    "pregnant",
    "pregnancyWeeks",
    "pregestationalWeight",
    "pregnancyType",
  ],
  1: [
    "nutritionalFocus",
    "fitnessGoals",
    "activityLevel",
    "dietRestrictions",
    "motivoConsulta",
    "manualCaloriesAdjustment",
    "pesoObjetivoProf",
  ],
  2: [
    "weight",
    "height",
    "pesoHabitual",
    "pliegueTricipital",
    "pliegueBicipital",
    "pliegueSubescapular",
    "pliegueSuprailiaco",
    "alturaRodilla",
    "circunferenciaPantorrilla",
    "circunferenciaBraquial",
    "circunferenciaCintura",
    "circunferenciaCadera",
  ],
  3: [
    "occupation",
    "workSchedule",
    "medications",
    "drugsSupplements",
    "diagnosedPathologies",
    "familyHistory",
    "sleepQuality",
    "perceivedStress",
    "weeklyExercise",
  ],
  4: [
    "likes",
    "rejectedFoods",
    "clinicalSummary",
    "gestationalSymptoms",
    "gestationalSupplementation",
  ],
  5: ["diagnosticoNutricional"],
};

export const quickPatientSchema = z
  .object({
    fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().min(1, "El email es requerido").email("Email no válido"),
    gender: z.enum(["Masculino", "Femenino", "Otro"], {
      message: "El sexo biológico es requerido",
    }),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
    motivoConsulta: z.string().optional(),
    weight: z.string().optional(),
    height: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.phone && data.phone.trim().length > 0) {
      const digits = data.phone.replace(/\D/g, "");
      if (digits.length < 9) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El teléfono debe tener al menos 9 dígitos",
          path: ["phone"],
        });
      }
    }
  });

export type QuickPatientFormData = z.infer<typeof quickPatientSchema>;
