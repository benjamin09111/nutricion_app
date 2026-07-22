export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_REGEX = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /\d/,
  special: /[^A-Za-z0-9]/,
  noSpaces: /^\S+$/,
};

type PasswordRule = {
  key: string;
  label: string;
  met: boolean;
};

type PasswordStrength = {
  score: number;
  label: string;
  tone: "rose" | "amber" | "indigo" | "emerald";
};

export function getPasswordRequirements(password: string): PasswordRule[] {
  return [
    {
      key: "length",
      label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      key: "uppercase",
      label: "Una letra mayúscula",
      met: PASSWORD_REGEX.uppercase.test(password),
    },
    {
      key: "lowercase",
      label: "Una letra minúscula",
      met: PASSWORD_REGEX.lowercase.test(password),
    },
    {
      key: "number",
      label: "Un número",
      met: PASSWORD_REGEX.number.test(password),
    },
    {
      key: "special",
      label: "Un carácter especial",
      met: PASSWORD_REGEX.special.test(password),
    },
    {
      key: "noSpaces",
      label: "Sin espacios",
      met: PASSWORD_REGEX.noSpaces.test(password),
    },
  ];
}

export function getPasswordStrength(password: string): PasswordStrength {
  const requirements = getPasswordRequirements(password);
  const score = requirements.reduce((total, rule) => total + (rule.met ? 1 : 0), 0);

  if (password.length === 0) {
    return { score: 0, label: "Sin contraseña", tone: "rose" };
  }

  if (score <= 2) {
    return { score, label: "Débil", tone: "rose" };
  }

  if (score <= 4) {
    return { score, label: "Aceptable", tone: "amber" };
  }

  if (score === 5) {
    return { score, label: "Fuerte", tone: "indigo" };
  }

  return { score, label: "Muy fuerte", tone: "emerald" };
}
