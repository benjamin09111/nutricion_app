import * as crypto from 'crypto';

/**
 * Standard RFC 6238 TOTP (Time-based One-Time Password) implementation
 * Zero external dependencies, pure Node.js crypto module.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(base32Str: string): Buffer {
  const cleanStr = base32Str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanStr.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleanStr[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

export function generateTotpToken(
  secretBase32: string,
  timeStepMs = Date.now(),
  timeWindowSeconds = 30,
): string {
  const key = base32Decode(secretBase32);
  const counter = Math.floor(timeStepMs / 1000 / timeWindowSeconds);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const token = (code % 1000000).toString().padStart(6, '0');
  return token;
}

export function verifyTotpToken(
  secretBase32: string,
  tokenToVerify: string,
  windowSteps = 1,
): boolean {
  if (!secretBase32 || !tokenToVerify || tokenToVerify.length !== 6) {
    return false;
  }

  const nowMs = Date.now();
  const timeWindowMs = 30 * 1000;

  for (let step = -windowSteps; step <= windowSteps; step++) {
    const testTimeMs = nowMs + step * timeWindowMs;
    const generated = generateTotpToken(secretBase32, testTimeMs);
    if (crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(tokenToVerify))) {
      return true;
    }
  }

  return false;
}

export function generateTotpUri(
  accountEmail: string,
  secretBase32: string,
  issuer = 'NutriNet',
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountEmail);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
