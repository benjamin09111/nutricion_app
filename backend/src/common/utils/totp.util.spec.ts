import {
  generateTotpSecret,
  generateTotpToken,
  verifyTotpToken,
  generateTotpUri,
  base32Encode,
  base32Decode,
} from './totp.util';

describe('totp.util', () => {
  it('should encode and decode base32 correctly', () => {
    const original = Buffer.from('hello-world-12345');
    const encoded = base32Encode(original);
    const decoded = base32Decode(encoded);
    expect(decoded.toString()).toBe(original.toString());
  });

  it('should generate a valid TOTP secret', () => {
    const secret = generateTotpSecret();
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThanOrEqual(16);
  });

  it('should generate and verify valid TOTP token', () => {
    const secret = generateTotpSecret();
    const token = generateTotpToken(secret);
    expect(token.length).toBe(6);
    expect(verifyTotpToken(secret, token)).toBe(true);
  });

  it('should reject invalid or wrong TOTP tokens', () => {
    const secret = generateTotpSecret();
    expect(verifyTotpToken(secret, '000000')).toBe(false);
  });

  it('should generate valid otpauth URI', () => {
    const secret = generateTotpSecret();
    const uri = generateTotpUri('admin@nutrinet.cl', secret);
    expect(uri).toContain('otpauth://totp/NutriNet:admin%40nutrinet.cl');
    expect(uri).toContain(`secret=${secret}`);
  });
});
