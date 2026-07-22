import { Injectable } from '@nestjs/common';
import {
  MINSAL_BMI_LMS,
  MinsalSex,
  MinsalBmiLmsRow,
} from './minsal-bmi-lms-data';

export type Gender = 'Masculino' | 'Femenino' | 'Otro';
export type ActivityLevel =
  | 'sedentario'
  | 'ligero'
  | 'moderado'
  | 'activo'
  | 'muy_activo';
export type TmbFormula = 'mifflin-st-jeor' | 'harris-benedict' | 'oms-fao';

export interface CalculationInputs {
  gender?: Gender | string | null;
  weight?: number | null;
  height?: number | null;
  birthDate?: string | Date | null;
  ageYears?: number | null;
  activityLevel?: ActivityLevel | string | null;
  tmbFormula?: TmbFormula | string | null;
  kneeHeight?: number | null;
  calfCircumference?: number | null;
  armCircumference?: number | null;
  subescapularFold?: number | null;
  tricipitalFold?: number | null;
  bicipitalFold?: number | null;
  suprailiacoFold?: number | null;
  waistCircumference?: number | null;
  hipCircumference?: number | null;
  carbPct?: number | null;
  proteinPct?: number | null;
  fatPct?: number | null;
  targetBmi?: number | null;
  usualWeight?: number | null;
  weightLossPeriodWeeks?: number | null;
  proteinProfile?: string | null;
  edemaPercent?: number | null;
  useUsualWeightForRequirements?: boolean | null;
}

export interface BmiResult {
  bmi: number;
  classification: string;
  color: string;
  isPediatric: boolean;
  percentile?: number;
  percentileCategory?: string;
  reference?: string;
  note?: string;
}

export interface IdealWeightResult {
  min: number;
  max: number;
  reference: string;
  percentile?: number;
  note?: string;
  supported: boolean;
}

export interface GetResult {
  tmb: number;
  formula: string;
  get: number;
  activityFactor: number;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    proteinPercent: number;
    carbsPercent: number;
    fatsPercent: number;
  };
}

const EXCHANGE_PROFILES = {
  cereales_tuberculos: {
    label: 'Cereales, panes y tubérculos',
    portion: '1/2 taza cocida, 1 rebanada de pan o 1 papa pequeña',
    cho: 30,
    protein: 3,
    fat: 1,
    kcal: 140,
  },
  legumbres_secas: {
    label: 'Legumbres',
    portion: '3/4 taza cocida',
    cho: 30,
    protein: 12,
    fat: 1,
    kcal: 180,
  },
  frutas: {
    label: 'Frutas',
    portion: '1 unidad mediana o 1 taza picada',
    cho: 15,
    protein: 0,
    fat: 0,
    kcal: 60,
  },
  verduras_bajas: {
    label: 'Verduras de bajo aporte',
    portion: '2 tazas crudas o 1 taza cocida',
    cho: 5,
    protein: 2,
    fat: 0,
    kcal: 25,
  },
  proteina_magra: {
    label: 'Proteína magra',
    portion: '50 g cocidos o 1/2 pechuga pequeña',
    cho: 0,
    protein: 11,
    fat: 2,
    kcal: 65,
  },
  lacteos_descremados: {
    label: 'Lácteos descremados',
    portion: '1 taza de leche o yogurt descremado',
    cho: 12,
    protein: 8,
    fat: 0,
    kcal: 80,
  },
  grasas_saludables: {
    label: 'Grasas y aceites',
    portion: '1 cucharada de aceite o 1/4 de palta',
    cho: 0,
    protein: 0,
    fat: 20,
    kcal: 180,
  },
  azucares_extras: {
    label: 'Azúcares y extras',
    portion: '1 cucharadita a 1 cucharada',
    cho: 5,
    protein: 0,
    fat: 0,
    kcal: 20,
  },
};

@Injectable()
export class CalculationsService {
  /**
   * Helper to normalize values and avoid typescript errors
   */
  private round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Helper to validate inputs within biological limits
   */
  validateInput(
    val: number | null | undefined,
    min: number,
    max: number,
  ): number | null {
    if (val === undefined || val === null) return null;
    const num = Number(val);
    if (Number.isFinite(num) && num >= min && num <= max) {
      return num;
    }
    return null;
  }

  /**
   * Calculates age from birthdate
   */
  calculateAge(birthDate?: string | Date | null): number | null {
    if (!birthDate) return null;
    const date = new Date(birthDate);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      age -= 1;
    }
    return age >= 0 ? age : null;
  }

  /**
   * Chumlea stature (height) estimation in cm
   */
  estimateStatureChumlea(
    gender: Gender,
    ageYears: number,
    kneeHeight: number,
  ): number | null {
    const age = this.validateInput(ageYears, 0, 120);
    const kh = this.validateInput(kneeHeight, 20, 85);
    if (age === null || kh === null) return null;

    if (gender === 'Masculino') {
      return this.round(64.19 - 0.04 * age + 2.02 * kh, 1);
    } else if (gender === 'Femenino') {
      return this.round(84.88 - 0.24 * age + 1.83 * kh, 1);
    } else {
      // Fallback mean
      const mVal = 64.19 - 0.04 * age + 2.02 * kh;
      const fVal = 84.88 - 0.24 * age + 1.83 * kh;
      return this.round((mVal + fVal) / 2, 1);
    }
  }

  /**
   * Chumlea body weight estimation in kg
   */
  estimateWeightChumlea(
    gender: Gender,
    kneeHeight: number,
    armCircumference: number,
    calfCircumference: number,
    subescapularFold: number,
  ): number | null {
    const kh = this.validateInput(kneeHeight, 20, 85);
    const cb = this.validateInput(armCircumference, 10, 60);
    const cp = this.validateInput(calfCircumference, 10, 60);
    const pse = this.validateInput(subescapularFold, 2, 60);

    if (kh === null || cb === null || cp === null || pse === null) return null;

    if (gender === 'Masculino') {
      return this.round(
        1.73 * cb + 0.98 * cp + 0.37 * pse + 1.16 * kh - 81.69,
        2,
      );
    } else if (gender === 'Femenino') {
      return this.round(
        0.98 * cb + 1.27 * cp + 0.4 * pse + 0.87 * kh - 62.35,
        2,
      );
    } else {
      // Fallback mean
      const mVal = 1.73 * cb + 0.98 * cp + 0.37 * pse + 1.16 * kh - 81.69;
      const fVal = 0.98 * cb + 1.27 * cp + 0.4 * pse + 0.87 * kh - 62.35;
      return this.round((mVal + fVal) / 2, 2);
    }
  }

  /**
   * Z-score to percentile helper
   */
  private normalCdf(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
    const prob =
      d *
      (((((1.330274429 * t - 1.821255978) * t + 1.781477937) * t -
        0.356563782) *
        t +
        0.31938153) *
        t);
    return z > 0 ? 1 - prob : prob;
  }

  private getPercentileFromZ(z: number): number {
    return Math.min(99.9, Math.max(0.1, this.normalCdf(z) * 100));
  }

  /**
   * Retrieves getMinsalBmiLms equivalent row
   */
  private getMinsalBmiLms(
    sex: MinsalSex,
    ageMonths: number,
  ): MinsalBmiLmsRow | null {
    const rows = MINSAL_BMI_LMS[sex];
    if (!rows || rows.length === 0) return null;
    const clampedMonths = Math.min(
      Math.max(Math.round(ageMonths), rows[0].ageMonths),
      rows[rows.length - 1].ageMonths,
    );
    const exact = rows.find((row) => row.ageMonths === clampedMonths);
    if (exact) return exact;
    let previous = rows[0];
    for (const row of rows) {
      if (row.ageMonths > clampedMonths) {
        const ratio =
          (clampedMonths - previous.ageMonths) /
          (row.ageMonths - previous.ageMonths);
        return {
          ageMonths: clampedMonths,
          L: previous.L + (row.L - previous.L) * ratio,
          M: previous.M + (row.M - previous.M) * ratio,
          S: previous.S + (row.S - previous.S) * ratio,
        };
      }
      previous = row;
    }
    return rows[rows.length - 1];
  }

  /**
   * Pediatric growth curves BMI assessment
   */
  getPediatricBmiAssessment(
    bmi: number,
    gender: Gender,
    ageYears: number,
  ): BmiResult | null {
    const sex: MinsalSex | null =
      gender === 'Femenino' ? 'female' : gender === 'Masculino' ? 'male' : null;

    if (ageYears < 5) {
      return {
        bmi: this.round(bmi, 1),
        classification: 'Requiere curva peso/talla MINSAL',
        color: '#f59e0b',
        isPediatric: true,
        note: 'Menores de 5 años deben evaluarse con peso/talla y referencias pediátricas específicas.',
        reference: 'Peso/talla MINSAL 0-4 años',
      };
    }

    if (!sex) return null;

    const ageMonths = Math.round(ageYears * 12);
    const lms = this.getMinsalBmiLms(sex, ageMonths);
    if (!lms) return null;

    const z =
      lms.L === 0
        ? Math.log(bmi / lms.M) / lms.S
        : (Math.pow(bmi / lms.M, lms.L) - 1) / (lms.L * lms.S);
    const percentile = this.getPercentileFromZ(z);

    let classification = 'Normopeso';
    let color = '#22c55e';
    if (percentile < 10) {
      classification = 'Bajo peso';
      color = '#3b82f6';
    } else if (percentile < 85) {
      classification = 'Normopeso';
      color = '#22c55e';
    } else if (percentile < 95) {
      classification = 'Sobrepeso';
      color = '#eab308';
    } else {
      classification = 'Obesidad';
      color = '#f97316';
    }

    return {
      bmi: this.round(bmi, 1),
      classification,
      color,
      percentile: this.round(percentile, 1),
      percentileCategory:
        percentile < 10
          ? '<p10'
          : percentile < 85
            ? 'p10-p85'
            : percentile < 95
              ? 'p85-p95'
              : '>p95',
      reference: 'MINSAL IMC/E 5-19 años',
      isPediatric: true,
    };
  }

  /**
   * Calculates BMI and classifies it accordingly
   */
  calculateBMI(
    weightKg: number,
    heightCm: number,
    gender: Gender,
    ageYears: number | null,
  ): BmiResult {
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);

    if (ageYears !== null && ageYears < 18) {
      const ped = this.getPediatricBmiAssessment(bmi, gender, ageYears);
      if (ped) return ped;
    }

    if (ageYears !== null && ageYears >= 65) {
      // Lipschitz Geriátrico
      let classification = 'Normopeso (Eutrófico)';
      let color = '#22c55e';
      if (bmi < 23.0) {
        classification = 'Bajo peso (Enflaquecido)';
        color = '#3b82f6';
      } else if (bmi < 28.0) {
        classification = 'Normopeso (Eutrófico)';
        color = '#22c55e';
      } else if (bmi < 32.0) {
        classification = 'Sobrepeso';
        color = '#eab308';
      } else {
        classification = 'Obesidad';
        color = '#ef4444';
      }
      return {
        bmi: this.round(bmi, 1),
        classification,
        color,
        isPediatric: false,
        reference: 'Criterio Lipschitz / OPS',
        note: 'Umbrales ajustados para proteger al adulto mayor de sarcopenia.',
      };
    }

    // Adult criteria
    let classification = 'Normopeso';
    let color = '#22c55e';
    if (bmi < 18.5) {
      classification = 'Bajo peso';
      color = '#3b82f6';
    } else if (bmi < 25) {
      classification = 'Normopeso';
      color = '#22c55e';
    } else if (bmi < 30) {
      classification = 'Sobrepeso';
      color = '#eab308';
    } else if (bmi < 35) {
      classification = 'Obesidad I';
      color = '#f97316';
    } else if (bmi < 40) {
      classification = 'Obesidad II';
      color = '#ef4444';
    } else {
      classification = 'Obesidad III';
      color = '#b91c1c';
    }

    return {
      bmi: this.round(bmi, 1),
      classification,
      color,
      isPediatric: false,
      reference: 'Criterio OMS',
    };
  }

  /**
   * Estimates Ideal Weight Range based on validations
   */
  getIdealWeightRange(
    heightCm: number,
    gender: Gender,
    ageYears: number | null,
    customTargetBmi?: number | null,
  ): IdealWeightResult {
    const heightM = heightCm / 100;

    if (ageYears !== null && ageYears < 5) {
      return {
        min: 0,
        max: 0,
        reference: 'Peso/talla MINSAL 0-4 años',
        note: 'En menores de 5 años se evalúa con curvas peso/talla, no con IMC/edad.',
        supported: false,
      };
    }

    if (ageYears !== null && ageYears < 18) {
      const sex: MinsalSex | null =
        gender === 'Femenino'
          ? 'female'
          : gender === 'Masculino'
            ? 'male'
            : null;
      if (!sex) {
        return {
          min: 0,
          max: 0,
          reference: 'IMC p50 MINSAL',
          note: 'Ingresa sexo biológico para estimar peso ideal pediátrico.',
          supported: false,
        };
      }

      const ageMonths = Math.round(ageYears * 12);
      const lms = this.getMinsalBmiLms(sex, ageMonths);
      if (!lms) {
        return {
          min: 0,
          max: 0,
          reference: 'IMC p50 MINSAL',
          note: 'Curva pediátrica disponible solo para 5 a 19 años.',
          supported: false,
        };
      }

      const ideal = lms.M * heightM * heightM;
      return {
        min: this.round(ideal * 0.95, 1),
        max: this.round(ideal * 1.05, 1),
        reference:
          sex === 'female'
            ? 'IMC p50 MINSAL (niñas)'
            : 'IMC p50 MINSAL (niños)',
        percentile: 50,
        note: 'Referencia IMC/Edad MINSAL para 5 a 19 años.',
        supported: true,
      };
    }

    if (ageYears !== null && ageYears >= 65) {
      return {
        min: this.round(23.0 * heightM * heightM, 1),
        max: this.round(28.0 * heightM * heightM, 1),
        reference: 'IMC 23.0 - 28.0 (Lipschitz)',
        note: 'Adulto mayor (objetivo central IMC 25.5).',
        supported: true,
      };
    }

    // Adult criteria — Configurable target BMI (default 22.0, standard OMS midpoint 21.7 - 22.0)
    const targetBmi =
      customTargetBmi && customTargetBmi >= 15 && customTargetBmi <= 40
        ? customTargetBmi
        : 22.0;
    const idealWeight = targetBmi * heightM * heightM;

    return {
      min: this.round(18.5 * heightM * heightM, 1),
      max: this.round(24.9 * heightM * heightM, 1),
      reference: `Objetivo IMC ${targetBmi} (configurable)`,
      note: `Peso óptimo central estimado: ${this.round(idealWeight, 1)} kg.`,
      supported: true,
    };
  }

  /**
   * Arm circumference and muscle/fat compositions (Frisancho, 1990)
   */
  calculateArmComposition(
    gender: Gender,
    armCircumferenceCm: number,
    tricipitalFoldMm: number,
  ) {
    const cb = this.validateInput(armCircumferenceCm, 10, 60);
    const pt = this.validateInput(tricipitalFoldMm, 2, 60);

    if (cb === null || pt === null) return null;

    const cb_mm = cb * 10;
    const cmb_mm = cb_mm - Math.PI * pt;
    const atb_mm2 = Math.pow(cb_mm, 2) / (4 * Math.PI);

    let amb_mm2 = 0;
    if (gender === 'Masculino') {
      amb_mm2 = Math.pow(cb_mm - Math.PI * pt, 2) / (4 * Math.PI) - 10;
    } else {
      // Femenino / Otro
      amb_mm2 = Math.pow(cb_mm - Math.PI * pt, 2) / (4 * Math.PI) - 6.5;
    }

    const agb_mm2 = atb_mm2 - amb_mm2;

    return {
      cmbMm: this.round(cmb_mm, 1),
      atbMm2: this.round(atb_mm2, 1),
      ambMm2: this.round(amb_mm2, 1),
      agbMm2: this.round(agb_mm2, 1),
      fatPercentage: this.round((agb_mm2 / atb_mm2) * 100, 1),
    };
  }

  /**
   * Waist to Hip ratio (ICC) and risk
   */
  calculateCardiovascularRisk(
    gender: Gender,
    waistCircumferenceCm?: number | null,
    hipCircumferenceCm?: number | null,
  ) {
    const cc = this.validateInput(waistCircumferenceCm, 30, 200);
    const cca = this.validateInput(hipCircumferenceCm, 30, 200);

    if (cc === null) return null;

    let waistRiskNcep = 'Bajo';
    let waistRiskIdf = 'Bajo';
    if (gender === 'Masculino') {
      if (cc >= 102) waistRiskNcep = 'Aumentado';
      if (cc >= 90) waistRiskIdf = 'Aumentado';
    } else {
      // Femenino / Otro
      if (cc >= 88) waistRiskNcep = 'Aumentado';
      if (cc >= 80) waistRiskIdf = 'Aumentado';
    }

    let icc = null;
    let iccRisk = 'No evaluable';
    if (cca !== null) {
      icc = this.round(cc / cca, 2);
      if (gender === 'Masculino') {
        iccRisk = icc > 0.95 ? 'Elevado' : 'Bajo';
      } else {
        iccRisk = icc > 0.85 ? 'Elevado' : 'Bajo';
      }
    }

    return {
      waistCircumference: cc,
      hipCircumference: cca,
      icc,
      iccRisk,
      waistRiskNcep,
      waistRiskIdf,
    };
  }

  /**
   * Blackburn criteria for involuntary weight loss
   */
  calculateWeightLoss(
    usualWeight?: number | null,
    currentWeight?: number | null,
    periodWeeks?: number | null,
  ) {
    const wUsual = this.validateInput(usualWeight, 1, 300);
    const wCurrent = this.validateInput(currentWeight, 1, 300);
    const weeks = this.validateInput(periodWeeks, 0.1, 104) ?? 4; // default 4 weeks (1 month)

    if (wUsual === null || wCurrent === null) return null;

    const lossKg = wUsual - wCurrent;
    const percentLoss = this.round(((wUsual - wCurrent) / wUsual) * 100, 1);

    let thresholdSignificant = 5;
    let thresholdSevere = 5.001;
    let periodLabel = '1 mes';

    if (weeks <= 1.5) {
      thresholdSignificant = 1;
      thresholdSevere = 2.001;
      periodLabel = '1 semana';
    } else if (weeks <= 6) {
      thresholdSignificant = 5;
      thresholdSevere = 5.001;
      periodLabel = '1 mes';
    } else if (weeks <= 14) {
      thresholdSignificant = 7.5;
      thresholdSevere = 7.501;
      periodLabel = '3 meses';
    } else {
      thresholdSignificant = 10;
      thresholdSevere = 10.001;
      periodLabel = '6 meses+';
    }

    let severity: 'normal' | 'significativa' | 'grave' = 'normal';
    if (percentLoss >= thresholdSevere) {
      severity = 'grave';
    } else if (percentLoss >= thresholdSignificant) {
      severity = 'significativa';
    }

    return {
      usualWeight: wUsual,
      currentWeight: wCurrent,
      periodWeeks: weeks,
      periodLabel,
      lossKg: this.round(lossKg, 1),
      percentLoss,
      severity,
      isAlert: severity === 'grave',
    };
  }

  /**
   * Protein requirement based on clinical profile
   */
  calculateProteinRequirement(
    weightKg: number,
    profileKey: string = 'adulto_sano',
    getKcal: number = 0,
  ) {
    const profiles: Record<string, { label: string; min: number; max: number }> = {
      adulto_sano: { label: 'Adulto sano, mantención', min: 0.8, max: 1.0 },
      adulto_mayor: { label: 'Adulto mayor (prevención sarcopenia)', min: 1.2, max: 1.5 },
      deportista: { label: 'Deportista / hipertrofia', min: 1.6, max: 2.2 },
      renal_sin_dialisis: { label: 'Enfermedad renal crónica sin diálisis', min: 0.6, max: 0.8 },
      renal_dialisis: { label: 'Enfermedad renal en diálisis', min: 1.0, max: 1.2 },
      oncologico: { label: 'Paciente oncológico / desnutrido', min: 1.2, max: 1.5 },
    };

    const sel = profiles[profileKey] || profiles['adulto_sano'];
    const minGrams = this.round(weightKg * sel.min, 1);
    const maxGrams = this.round(weightKg * sel.max, 1);
    const minKcal = this.round(minGrams * 4, 0);
    const maxKcal = this.round(maxGrams * 4, 0);
    const minPercentGet = getKcal > 0 ? this.round((minKcal / getKcal) * 100, 1) : 0;
    const maxPercentGet = getKcal > 0 ? this.round((maxKcal / getKcal) * 100, 1) : 0;

    return {
      profileKey,
      profileLabel: sel.label,
      minPerKg: sel.min,
      maxPerKg: sel.max,
      minGrams,
      maxGrams,
      minPercentGet,
      maxPercentGet,
    };
  }

  /**
   * Fluid requirement calculation (Holliday-Segar or Adult 30-35 ml/kg)
   */
  calculateHydration(weightKg: number, ageYears: number | null) {
    if (!weightKg || weightKg <= 0) return null;

    if (ageYears !== null && ageYears < 18) {
      let ml = 0;
      if (weightKg <= 10) {
        ml = weightKg * 100;
      } else if (weightKg <= 20) {
        ml = 1000 + (weightKg - 10) * 50;
      } else {
        ml = 1500 + (weightKg - 20) * 20;
      }
      return {
        method: 'Holliday-Segar (Pediatría)',
        minMl: this.round(ml, 0),
        maxMl: this.round(ml, 0),
        minL: this.round(ml / 1000, 2),
        maxL: this.round(ml / 1000, 2),
        note: 'Norma Holliday-Segar para requerimiento hídrico basal pediátrico.',
      };
    }

    const minMl = this.round(weightKg * 30, 0);
    const maxMl = this.round(weightKg * 35, 0);
    return {
      method: 'Adulto (30-35 ml/kg/día)',
      minMl,
      maxMl,
      minL: this.round(minMl / 1000, 2),
      maxL: this.round(maxMl / 1000, 2),
      note: 'Ajustar a la baja en patología renal o cardíaca; al alza con fiebre o pérdidas digestivas.',
    };
  }

  /**
   * Basal Metabolic Rate (TMB)
   */
  calculateTMB(
    gender: Gender,
    weightKg: number,
    heightCm: number,
    ageYears: number,
    formula: TmbFormula = 'mifflin-st-jeor',
  ): number | null {
    if (weightKg <= 0 || heightCm <= 0 || ageYears < 0) return null;

    switch (formula) {
      case 'harris-benedict':
        return gender === 'Masculino'
          ? 66.5 + 13.75 * weightKg + 5.003 * heightCm - 6.775 * ageYears
          : 655.1 + 9.563 * weightKg + 1.85 * heightCm - 4.676 * ageYears;
      case 'mifflin-st-jeor':
        return gender === 'Masculino'
          ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
          : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
      case 'oms-fao': {
        const weight = weightKg;
        if (gender === 'Masculino') {
          if (ageYears < 3) return 60.9 * weight - 54;
          if (ageYears < 10) return 22.7 * weight + 495;
          if (ageYears < 18) return 17.5 * weight + 651;
          if (ageYears < 30) return 15.3 * weight + 679;
          if (ageYears < 60) return 11.6 * weight + 879;
          return 13.5 * weight + 487;
        }
        if (ageYears < 3) return 61 * weight - 51;
        if (ageYears < 10) return 22.5 * weight + 499;
        if (ageYears < 18) return 12.2 * weight + 746;
        if (ageYears < 30) return 14.7 * weight + 496;
        if (ageYears < 60) return 8.7 * weight + 829;
        return 10.5 * weight + 596;
      }
      default:
        return null;
    }
  }

  /**
   * Exchange food portions suggestions
   */
  buildSuggestedExchangeRows(
    calories: number,
    carbs: number,
    protein: number,
    fats: number,
  ) {
    const roundToSingle = (value: number) =>
      Math.round(Math.max(0, value) * 10) / 10;

    const rows: Array<{ profileId: string; portions: number }> = [
      {
        profileId: 'cereales_tuberculos',
        portions: roundToSingle((Math.max(carbs - 45, 0) * 0.55) / 30),
      },
      {
        profileId: 'legumbres_secas',
        portions: calories >= 1600 ? 1 : 0,
      },
      {
        profileId: 'frutas',
        portions: Math.max(2, Math.round(Math.max(carbs, 120) / 45)),
      },
      {
        profileId: 'verduras_bajas',
        portions: 4,
      },
      {
        profileId: 'proteina_magra',
        portions: roundToSingle((protein * 0.7) / 11),
      },
      {
        profileId: 'lacteos_descremados',
        portions: Math.max(1, Math.round((protein * 0.15) / 8)),
      },
      {
        profileId: 'grasas_saludables',
        portions: roundToSingle(fats / 20),
      },
      {
        profileId: 'azucares_extras',
        portions: calories >= 2200 ? 1 : 0,
      },
    ];

    return rows
      .filter((row) => row.portions > 0)
      .map((row) => {
        const profile = (EXCHANGE_PROFILES as any)[row.profileId];
        return {
          category: profile.label,
          amount: profile.portion,
          portions: row.portions,
          cho: Math.round(profile.cho * row.portions),
          protein: Math.round(profile.protein * row.portions),
          fat: Math.round(profile.fat * row.portions),
          kcal: Math.round(profile.kcal * row.portions),
          profileId: row.profileId,
        };
      });
  }

  /**
   * Master function consolidating all metrics
   */
  calculateAll(inputs: CalculationInputs) {
    const gender: Gender =
      inputs.gender === 'Masculino' || inputs.gender === 'Femenino'
        ? (inputs.gender as Gender)
        : 'Femenino';

    const birthDate = inputs.birthDate || null;
    const resolvedAge =
      typeof inputs.ageYears === 'number'
        ? inputs.ageYears
        : this.calculateAge(birthDate);

    // Folds
    const tricipital = this.validateInput(inputs.tricipitalFold, 2, 60);
    const subescapular = this.validateInput(inputs.subescapularFold, 2, 60);
    const bicipital = this.validateInput(inputs.bicipitalFold, 2, 60);
    const suprailiaco = this.validateInput(inputs.suprailiacoFold, 2, 60);

    // Stature & Weight Estimation (Chumlea)
    let estimatedHeight = null;
    if (inputs.kneeHeight && resolvedAge !== null) {
      estimatedHeight = this.estimateStatureChumlea(
        gender,
        resolvedAge,
        inputs.kneeHeight,
      );
    }

    let estimatedWeight = null;
    if (
      inputs.kneeHeight &&
      inputs.armCircumference &&
      inputs.calfCircumference &&
      subescapular
    ) {
      estimatedWeight = this.estimateWeightChumlea(
        gender,
        inputs.kneeHeight,
        inputs.armCircumference,
        inputs.calfCircumference,
        subescapular,
      );
    }

    // Weight & height final parameters
    const rawWeight = inputs.weight || estimatedWeight || null;
    const height = inputs.height || estimatedHeight || null;

    // Edema / Dry weight calculation
    const edemaPercent = this.validateInput(inputs.edemaPercent, 0, 50) || 0;
    const dryWeight = rawWeight && edemaPercent > 0
      ? this.round(rawWeight * (1 - edemaPercent / 100), 1)
      : null;
    const weight = dryWeight || rawWeight;

    // BMI/IMC
    let bmi: BmiResult | null = null;
    let idealWeight: IdealWeightResult | null = null;
    let adjustedWeight: number | null = null;

    if (weight && height) {
      bmi = this.calculateBMI(weight, height, gender, resolvedAge);
      idealWeight = this.getIdealWeightRange(height, gender, resolvedAge, inputs.targetBmi);

      if (idealWeight.supported) {
        const targetBmi = inputs.targetBmi || (
          resolvedAge !== null && resolvedAge >= 65
            ? 25.5
            : 22.0
        );
        const targetIdealWeight = targetBmi * Math.pow(height / 100, 2);

        adjustedWeight = this.round(
          targetIdealWeight + 0.25 * (weight - targetIdealWeight),
          1,
        );
      }
    }

    // Weight loss (Blackburn)
    const weightLoss = this.calculateWeightLoss(
      inputs.usualWeight,
      rawWeight,
      inputs.weightLossPeriodWeeks,
    );

    // Composición Brazo (Frisancho)
    let armComposition = null;
    if (inputs.armCircumference && tricipital) {
      armComposition = this.calculateArmComposition(
        gender,
        inputs.armCircumference,
        tricipital,
      );
    }

    // Cardiovascular Risk
    let cardiovascularRisk = null;
    if (inputs.waistCircumference) {
      cardiovascularRisk = this.calculateCardiovascularRisk(
        gender,
        inputs.waistCircumference,
        inputs.hipCircumference,
      );
    }

    // If Blackburn is grave AND useUsualWeightForRequirements is not explicitly set to false, auto-override to true!
    const shouldForceUsual = weightLoss && weightLoss.severity === 'grave' && inputs.useUsualWeightForRequirements !== false;
    const isUsingUsual = inputs.useUsualWeightForRequirements === true || shouldForceUsual;

    // TMB & GET & Macros calculated over current weight OR habitual weight (to avoid underfeeding on acute loss)
    const rawUsualWeight = this.validateInput(inputs.usualWeight, 1, 300);
    const reqWeight = isUsingUsual && rawUsualWeight
      ? rawUsualWeight
      : weight;

    let energy: GetResult | null = null;
    let exchangePortions: any[] = [];
    if (reqWeight && height && resolvedAge !== null) {
      const activityLevel = inputs.activityLevel || 'sedentario';
      const formula = (inputs.tmbFormula as TmbFormula) || 'mifflin-st-jeor';
      const tmb = this.calculateTMB(
        gender,
        reqWeight,
        height,
        resolvedAge,
        formula,
      );

      if (tmb !== null) {
        const baseFactors: Record<string, number> = {
          sedentario: 1.2,
          ligero: 1.375,
          moderado: 1.55,
          activo: 1.725,
          muy_activo: 1.9,
        };
        const factor = baseFactors[activityLevel] || 1.2;
        const getVal = Math.round(tmb * factor);

        // Macros percentages (defaults: C 55%, P 20%, F 25%)
        const carbPercent = inputs.carbPct || 55;
        const proteinPercent = inputs.proteinPct || 20;
        const fatPercent = inputs.fatPct || 25;

        const carbsGrams = Math.round((getVal * (carbPercent / 100)) / 4);
        const proteinGrams = Math.round((getVal * (proteinPercent / 100)) / 4);
        const fatsGrams = Math.round((getVal * (fatPercent / 100)) / 9);

        energy = {
          tmb: Math.round(tmb),
          formula:
            formula === 'mifflin-st-jeor'
              ? 'Mifflin-St Jeor (1990)'
              : formula === 'harris-benedict'
                ? 'Harris-Benedict (rev. Roza-Shizgal, 1984)'
                : 'OMS/FAO (2004)',
          get: getVal,
          activityFactor: factor,
          macros: {
            calories: getVal,
            protein: proteinGrams,
            carbs: carbsGrams,
            fats: fatsGrams,
            proteinPercent,
            carbsPercent: carbPercent,
            fatsPercent: fatPercent,
          },
        };

        exchangePortions = this.buildSuggestedExchangeRows(
          getVal,
          carbsGrams,
          proteinGrams,
          fatsGrams,
        );
      }
    }

    // Protein Requirement using reqWeight
    const proteinRequirement = reqWeight
      ? this.calculateProteinRequirement(
          reqWeight,
          inputs.proteinProfile || 'adulto_sano',
          energy?.get || 0,
        )
      : null;

    // Hydration Requirement using reqWeight
    const hydration = reqWeight ? this.calculateHydration(reqWeight, resolvedAge) : null;

    return {
      version: '2026-07-21-v3',
      calculatedAt: new Date().toISOString(),
      inputs: {
        gender,
        age: resolvedAge,
        weight: rawWeight,
        dryWeight,
        edemaPercent,
        height,
        targetBmi: inputs.targetBmi || 22.0,
        activityLevel: inputs.activityLevel || 'sedentario',
        kneeHeight: inputs.kneeHeight || null,
        calfCircumference: inputs.calfCircumference || null,
        armCircumference: inputs.armCircumference || null,
        waistCircumference: inputs.waistCircumference || null,
        hipCircumference: inputs.hipCircumference || null,
        usualWeight: inputs.usualWeight || null,
        weightLossPeriodWeeks: inputs.weightLossPeriodWeeks || null,
        proteinProfile: inputs.proteinProfile || 'adulto_sano',
        useUsualWeightForRequirements: isUsingUsual,
        folds: {
          tricipital,
          subescapular,
          bicipital,
          suprailiaco,
        },
      },
      estimatedHeight,
      estimatedWeight,
      dryWeight,
      edemaPercent,
      bmi,
      idealWeight,
      adjustedWeight,
      weightLoss,
      armComposition,
      cardiovascularRisk,
      energy,
      proteinRequirement,
      hydration,
      exchangePortions,
    };
  }
}
