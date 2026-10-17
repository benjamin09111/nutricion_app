import { ExchangePortionsService } from './exchange-portions.service';

describe('ExchangePortionsService', () => {
  let service: ExchangePortionsService;

  beforeEach(() => {
    service = new ExchangePortionsService();
  });

  it('should be defined and return profiles', () => {
    const profiles = service.getProfiles();
    expect(profiles.length).toBeGreaterThan(10);
    const cereals = service.getProfileById('cereales_tuberculos');
    expect(cereals.cho).toBe(30);
    expect(cereals.protein).toBe(3);
  });

  it('should detect profile by keyword correctly', () => {
    const result = service.detectProfile({
      name: 'Arroz blanco cocido',
      category: 'Cereales y Derivados',
      carbs: 28,
      protein: 2.5,
      fat: 0.3,
    });

    expect(result.profile.id).toBe('cereales_tuberculos');
    expect(result.confidence).toBe('high');
  });

  it('should detect legume profile and calculate exchange portions correctly', () => {
    const calc = service.calculateExchange({
      grams: 150,
      carbsPer100g: 20,
      proteinPer100g: 8,
      fatPer100g: 0.5,
      category: 'Legumbres y Cereales',
      name: 'Lentejas cocidas',
    });

    expect(calc.profile.id).toBe('legumbres_secas');
    expect(calc.portions).toBeGreaterThan(0);
    expect(calc.displayPortions).toBeDefined();
    expect(calc.isClinicalExchange).toBe(true);
  });

  it('should calculate inverse grams from target portions', () => {
    const result = service.calculateGrams({
      targetPortions: 2,
      profileId: 'cereales_tuberculos',
      carbsPer100g: 30,
    });

    // 2 * 30 * 100 / 30 = 200g
    expect(result.grams).toBe(200);
  });

  it('should build suggested exchange rows based on macro targets', () => {
    const rows = service.buildSuggestedExchangeRows({
      calories: 2000,
      carbs: 250,
      protein: 100,
      fats: 60,
    });

    expect(rows.length).toBeGreaterThan(0);
    const cerealRow = rows.find((r) => r.profileId === 'cereales_tuberculos');
    expect(cerealRow).toBeDefined();
    expect(cerealRow?.portions).toBeGreaterThan(0);
  });
});
