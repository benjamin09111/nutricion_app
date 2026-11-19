import {
  encryptSensitiveText,
  decryptSensitiveText,
} from './crypto.util';

describe('Crypto Utilities (AES-256-GCM)', () => {
  it('encrypts sensitive text and decrypts back to original', () => {
    const originalText = 'Diagnóstico: Paciente con resistencia a la insulina y anemia leve.';
    const encrypted = encryptSensitiveText(originalText);

    expect(encrypted).not.toBe(originalText);
    expect(encrypted.startsWith('enc:v1:')).toBe(true);

    const decrypted = decryptSensitiveText(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('is idempotent when attempting to encrypt already encrypted payload', () => {
    const originalText = 'Observación clínica confidencial';
    const firstEncryption = encryptSensitiveText(originalText);
    const secondEncryption = encryptSensitiveText(firstEncryption);

    expect(secondEncryption).toBe(firstEncryption);
    expect(decryptSensitiveText(secondEncryption)).toBe(originalText);
  });

  it('handles backwards compatibility for existing plain text', () => {
    const plainText = 'Ficha creada antes de la implementación de cifrado';
    const result = decryptSensitiveText(plainText);

    expect(result).toBe(plainText);
  });

  it('handles null and undefined gracefully', () => {
    expect(encryptSensitiveText(null)).toBe('');
    expect(encryptSensitiveText(undefined)).toBe('');
    expect(decryptSensitiveText(null)).toBe('');
    expect(decryptSensitiveText(undefined)).toBe('');
  });
});
