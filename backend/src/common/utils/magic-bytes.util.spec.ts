import { verifyFileSignature } from './magic-bytes.util';

describe('verifyFileSignature', () => {
  it('should detect valid PDF signature', () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 header contents...');
    const result = verifyFileSignature(pdfBuffer);
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('application/pdf');
  });

  it('should detect valid PNG signature', () => {
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    const result = verifyFileSignature(pngBuffer);
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/png');
  });

  it('should detect valid JPEG signature', () => {
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const result = verifyFileSignature(jpegBuffer);
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/jpeg');
  });

  it('should reject fake files or unknown signatures', () => {
    const fakeBuffer = Buffer.from('FAKECONTENT_EXECUTABLE_FILE_HERE');
    const result = verifyFileSignature(fakeBuffer);
    expect(result.valid).toBe(false);
    expect(result.detectedType).toBeNull();
  });
});
