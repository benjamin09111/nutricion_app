/**
 * Utility for inspecting real binary headers (Magic Bytes) of uploaded files
 * to prevent malicious file uploads disguised with valid extensions.
 */

export function verifyFileSignature(buffer: Buffer): {
  valid: boolean;
  detectedType: string | null;
} {
  if (!buffer || buffer.length < 12) {
    return { valid: false, detectedType: null };
  }

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { valid: true, detectedType: 'application/pdf' };
  }

  // PNG: 0x89 0x50 0x4E 0x47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, detectedType: 'image/png' };
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedType: 'image/jpeg' };
  }

  // GIF: GIF87a or GIF89a (0x47 0x49 0x46 0x38)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { valid: true, detectedType: 'image/gif' };
  }

  // WEBP: RIFF....WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50 at offset 8)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedType: 'image/webp' };
  }

  return { valid: false, detectedType: null };
}
