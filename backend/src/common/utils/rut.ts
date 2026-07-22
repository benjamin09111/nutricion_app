const RUT_CLEAN_REGEX = /[^0-9kK]/g;

export function normalizeRut(rut: string) {
  return rut.replace(RUT_CLEAN_REGEX, '').toUpperCase();
}

export function isValidRut(rut: string) {
  if (!rut || typeof rut !== 'string') {
    return false;
  }

  const cleanRut = normalizeRut(rut);
  if (cleanRut.length < 2) {
    return false;
  }

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  if (!/^[0-9]+$/.test(body)) {
    return false;
  }

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += multiplier * Number(body[i]);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expectedDv =
    remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);

  return expectedDv === dv;
}
