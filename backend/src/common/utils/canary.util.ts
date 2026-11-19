import * as crypto from 'crypto';

const CANARY_SECRET =
  process.env.CANARY_WATERMARK_SECRET ||
  process.env.JWT_SECRET ||
  'nutrinet-ip-protection-canary-secret-2026';

export const CANARY_SIGNATURE_PREFIX = 'ntr-wmark:';

/**
 * Generates an HMAC-based forensic watermark for catalog entries (foods and recipes).
 * If a third party scrapes or clones the catalog, this signature proves mathematical
 * authorship under Chilean and international IP law (Ley 17.336).
 */
export function generateCanaryWatermark(
  entityId: string,
  secret = CANARY_SECRET,
): string {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(`nutrinet-catalog-seed:${entityId}`)
    .digest('hex');

  // Compact 12-character token sufficient for non-intrusive watermarking
  return `${CANARY_SIGNATURE_PREFIX}${hash.slice(0, 12)}`;
}

/**
 * Verifies whether a given tag, metadata string, or text contains a legitimate
 * NutriNet forensic watermark for the specified entityId.
 */
export function verifyCanaryWatermark(
  watermarkedString: string,
  entityId: string,
  secret = CANARY_SECRET,
): boolean {
  if (!watermarkedString || !watermarkedString.includes(CANARY_SIGNATURE_PREFIX)) {
    return false;
  }

  const expected = generateCanaryWatermark(entityId, secret);
  return watermarkedString.includes(expected);
}

/**
 * Embeds a forensic watermark into an array of tags non-destructively.
 */
export function injectCanaryTag(tags: string[] = [], entityId: string): string[] {
  const watermark = generateCanaryWatermark(entityId);
  if (tags.includes(watermark)) {
    return tags;
  }
  return [...tags, watermark];
}
