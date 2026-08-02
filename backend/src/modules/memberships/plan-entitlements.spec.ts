import {
  MEMBERSHIP_PLAN_ENTITLEMENTS,
  PLAN_ENTITLEMENT_KEYS,
} from './plan-entitlements';

describe('Freemium entitlements', () => {
  it('exposes the fixed product limits', () => {
    const free = MEMBERSHIP_PLAN_ENTITLEMENTS.free;

    expect(free[PLAN_ENTITLEMENT_KEYS.PATIENTS_TOTAL_LIMIT]).toBe(4);
    expect(free[PLAN_ENTITLEMENT_KEYS.CONSULTATIONS_SAVED_LIMIT]).toBe(3);
    expect(free[PLAN_ENTITLEMENT_KEYS.PDF_EXPORTS_TOTAL_LIMIT]).toBe(3);
    expect(free[PLAN_ENTITLEMENT_KEYS.FOOD_GROUPS_TOTAL_LIMIT]).toBe(1);
    expect(free[PLAN_ENTITLEMENT_KEYS.AI_OPERATIONS_TOTAL_LIMIT]).toBe(4);
    expect(free[PLAN_ENTITLEMENT_KEYS.CREATIONS_SAVE_LIMIT]).toBe(3);
    expect(free[PLAN_ENTITLEMENT_KEYS.SCREENING_TESTS_SAVED_LIMIT]).toBe(2);
    expect(free[PLAN_ENTITLEMENT_KEYS.SCREENING_TESTS_ACCESS]).toBe(true);
  });

  it('blocks restricted Freemium capabilities', () => {
    const free = MEMBERSHIP_PLAN_ENTITLEMENTS.free;

    expect(free[PLAN_ENTITLEMENT_KEYS.CREATIONS_EDIT_ACCESS]).toBe(false);
    expect(free[PLAN_ENTITLEMENT_KEYS.CREATIONS_IMPORT_ACCESS]).toBe(false);
    expect(free[PLAN_ENTITLEMENT_KEYS.CLINICAL_RESTRICTIONS_CREATE_ACCESS]).toBe(false);
    expect(free[PLAN_ENTITLEMENT_KEYS.METRICS_CREATE_ACCESS]).toBe(false);
    expect(free[PLAN_ENTITLEMENT_KEYS.CLINICAL_CALCULATOR_USE_ACCESS]).toBe(false);
    expect(free[PLAN_ENTITLEMENT_KEYS.SCREENING_TESTS_DELETE_ACCESS]).toBe(false);
  });
});
