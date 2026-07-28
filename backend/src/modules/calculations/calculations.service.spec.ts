import 'reflect-metadata';
import { validate } from 'class-validator';
import { CalculateDto } from './dto/calculate.dto';
import { CalculationsService } from './calculations.service';

describe('CalculationsService', () => {
  const service = new CalculationsService();

  it('applies Frisancho corrections in mm²', () => {
    const result = service.calculateArmComposition('Masculino', 30, 10);
    const cbMm = 300;
    const expected = ((cbMm - Math.PI * 10) ** 2) / (4 * Math.PI) - 1000;

    expect(result?.ambMm2).toBe(Math.round(expected * 10) / 10);
  });

  it('uses Chilean geriatric boundary IMC <= 23 as enflaquecido', () => {
    const result = service.calculateBMI(23, 100, 'Femenino', 65);

    expect(result.classification).toContain('Enflaquecido');
  });

  it('does not produce a broken LMS result at 118 months', () => {
    const result = service.getPediatricBmiAssessment(16.37, 'Masculino', 118 / 12);

    expect(result?.percentile).toEqual(expect.any(Number));
    expect(Number.isFinite(result?.percentile ?? Number.NaN)).toBe(true);
  });

  it('adds pregnancy energy adjustment to GET', () => {
    const base = service.calculateAll({
      gender: 'Femenino',
      weight: 70,
      height: 165,
      ageYears: 30,
      activityLevel: 'sedentario',
    }).energy;
    const pregnancy = service.calculateAll({
      gender: 'Femenino',
      weight: 70,
      height: 165,
      ageYears: 30,
      activityLevel: 'sedentario',
      isPregnant: true,
      pregnancyWeek: 24,
    }).energy;

    expect(pregnancy?.get).toBe((base?.get ?? 0) + 340);
    expect(pregnancy?.physiologicalAdjustmentKcal).toBe(340);
  });

  it('rejects macro percentages that do not sum 100', async () => {
    const dto = Object.assign(new CalculateDto(), {
      carbPct: 50,
      proteinPct: 20,
      fatPct: 20,
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'carbPct')).toBe(true);
  });

  it('builds exchange suggestions from target macros', () => {
    const rows = service.buildSuggestedExchangeRows(2000, 275, 100, 56);
    const totals = rows.reduce(
      (acc, row) => ({
        carbs: acc.carbs + row.cho,
        protein: acc.protein + row.protein,
        fat: acc.fat + row.fat,
      }),
      { carbs: 0, protein: 0, fat: 0 },
    );

    expect(totals.carbs).toBeGreaterThanOrEqual(270);
    expect(totals.carbs).toBeLessThanOrEqual(280);
    expect(totals.protein).toBeGreaterThanOrEqual(95);
    expect(totals.protein).toBeLessThanOrEqual(105);
    expect(totals.fat).toBeGreaterThanOrEqual(50);
    expect(totals.fat).toBeLessThanOrEqual(62);
  });
});
