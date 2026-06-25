export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES = [
  {
    key: 'length',
    label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (value: string) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    key: 'uppercase',
    label: 'Una mayúscula',
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    key: 'lowercase',
    label: 'Una minúscula',
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    key: 'number',
    label: 'Un número',
    test: (value: string) => /\d/.test(value),
  },
  {
    key: 'special',
    label: 'Un carácter especial',
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
  {
    key: 'noSpaces',
    label: 'Sin espacios',
    test: (value: string) => /^\S+$/.test(value),
  },
] as const;

export function getPasswordStrength(value: string) {
  const score = PASSWORD_RULES.filter((rule) => rule.test(value)).length;

  if (score >= PASSWORD_RULES.length) {
    return { label: 'Muy segura', tone: 'emerald', score };
  }

  if (score >= 4) {
    return { label: 'Segura', tone: 'indigo', score };
  }

  if (score >= 2) {
    return { label: 'Intermedia', tone: 'amber', score };
  }

  return { label: 'Débil', tone: 'rose', score };
}

export function getPasswordRequirements(value: string) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    met: rule.test(value),
  }));
}
