import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes standard for AES-GCM
const PREFIX = 'enc:v1:';

function getEncryptionKey(): Buffer {
  const secret =
    process.env.DATA_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'nutrinet-default-data-protection-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a sensitive string (e.g. clinical observations, private patient notes)
 * using AES-256-GCM authenticated encryption.
 */
export function encryptSensitiveText(plainText?: string | null): string {
  if (!plainText) return '';
  if (plainText.startsWith(PREFIX)) {
    return plainText; // Already encrypted
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag().toString('base64');
  const ivBase64 = iv.toString('base64');

  return `${PREFIX}${ivBase64}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted payload.
 * Gracefully returns original text if not encrypted (backwards compatibility).
 */
export function decryptSensitiveText(cipherText?: string | null): string {
  if (!cipherText) return '';
  if (!cipherText.startsWith(PREFIX)) {
    return cipherText; // Plain text backwards compatibility
  }

  try {
    const parts = cipherText.slice(PREFIX.length).split(':');
    if (parts.length !== 3) {
      return cipherText;
    }

    const [ivBase64, authTagBase64, encryptedBase64] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // If decryption fails (e.g. wrong key), do not throw uncaught exceptions
    console.error('[CryptoUtil] Decryption failed for payload:', error);
    return cipherText;
  }
}
