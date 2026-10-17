import {
  generateTotpSecret,
  generateTotpToken,
  verifyTotpToken,
  generateOtpAuthUrl,
  generateRecoveryCodes,
  base32Decode,
} from './totp.util';

describe('TOTP Utilities', () => {
  it('generates a valid Base32 secret', () => {
    const secret = generateTotpSecret();
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThanOrEqual(16);
    expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
  });

  it('correctly decodes Base32 to buffer', () => {
    const secret = generateTotpSecret();
    const buffer = base32Decode(secret);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('generates and verifies matching 6-digit TOTP token', () => {
    const secret = generateTotpSecret();
    const token = generateTotpToken(secret);
    expect(token).toHaveLength(6);
    expect(/^\d{6}$/.test(token)).toBe(true);

    const isValid = verifyTotpToken(secret, token);
    expect(isValid).toBe(true);
  });

  it('rejects an invalid TOTP token', () => {
    const secret = generateTotpSecret();
    const invalidToken = '000000';
    // Generate valid token to check if '000000' accidentally matches
    const valid = generateTotpToken(secret);
    const fakeToken = valid === '000000' ? '999999' : '000000';

    expect(verifyTotpToken(secret, fakeToken)).toBe(false);
  });

  it('generates valid otpauth URL', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const url = generateOtpAuthUrl('test@example.com', secret);
    expect(url).toContain('otpauth://totp/NutriNet:test%40example.com');
    expect(url).toContain(`secret=${secret}`);
  });

  it('generates 8 recovery codes formatted XXXX-XXXX', () => {
    const codes = generateRecoveryCodes(8);
    expect(codes).toHaveLength(8);
    for (const code of codes) {
      expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
    }
  });
});
