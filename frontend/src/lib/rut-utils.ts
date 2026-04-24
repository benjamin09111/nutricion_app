
/**
 * Valida un RUT chileno (formato XX.XXX.XXX-X o XXXXXXXX-X)
 */
export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== 'string') return false;

  // Limpiar puntos y guion
  const cleanRut = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  
  if (cleanRut.length < 2) return false;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  if (!body.match(/^[0-9]+$/)) return false;

  return calculateDV(body) === dv;
}

/**
 * Calcula el dígito verificador de un cuerpo de RUT
 */
function calculateDV(body: string): string {
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += multiplier * parseInt(body[i]);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
   body[i];
  }

  const res = 11 - (sum % 11);
  if (res === 11) return "0";
  if (res === 10) return "K";
  return res.toString();
}

/**
 * Formatea un RUT a XX.XXX.XXX-X
 */
export function formatRut(rut: string): string {
  if (!rut) return "";
  const clean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  if (clean.length < 2) return clean;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  let result = "";
  let count = 0;

  for (let i = body.length - 1; i >= 0; i--) {
    result = body[i] + result;
    count++;
    if (count === 3 && i > 0) {
      result = "." + result;
      count = 0;
    }
  }

  return result + "-" + dv;
}
