import {
  generateCanaryWatermark,
  verifyCanaryWatermark,
  injectCanaryTag,
  CANARY_SIGNATURE_PREFIX,
} from './canary.util';

describe('Canary & Watermark Utilities (IP Protection)', () => {
  it('generates a deterministic watermark matching the signature prefix', () => {
    const watermark = generateCanaryWatermark('food-quinoa-123');
    expect(watermark.startsWith(CANARY_SIGNATURE_PREFIX)).toBe(true);

    const same = generateCanaryWatermark('food-quinoa-123');
    expect(same).toBe(watermark);
  });

  it('generates distinct watermarks for distinct entity ids', () => {
    const wm1 = generateCanaryWatermark('food-quinoa-123');
    const wm2 = generateCanaryWatermark('food-avena-456');

    expect(wm1).not.toBe(wm2);
  });

  it('verifies a valid watermark successfully', () => {
    const entityId = 'recipe-pastel-choclo-789';
    const watermark = generateCanaryWatermark(entityId);

    const verified = verifyCanaryWatermark(
      `Tags: almuerzo, chileno, ${watermark}, vegetariano`,
      entityId,
    );
    expect(verified).toBe(true);
  });

  it('rejects an invalid watermark or mismatched entity id', () => {
    const watermark = generateCanaryWatermark('recipe-a');
    const verified = verifyCanaryWatermark(watermark, 'recipe-b');

    expect(verified).toBe(false);
  });

  it('injects canary tag non-destructively and idempotently', () => {
    const originalTags = ['almuerzo', 'rapido'];
    const tagged = injectCanaryTag(originalTags, 'food-123');

    expect(tagged.length).toBe(3);
    expect(tagged[2].startsWith(CANARY_SIGNATURE_PREFIX)).toBe(true);

    // Idempotent
    const doubleTagged = injectCanaryTag(tagged, 'food-123');
    expect(doubleTagged.length).toBe(3);
  });
});
