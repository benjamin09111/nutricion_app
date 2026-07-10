import rateLimit from 'express-rate-limit';

const createAuthLimiter = (input: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}) =>
  rateLimit({
    windowMs: input.windowMs,
    max: input.max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: input.skipSuccessfulRequests || false,
    message: {
      statusCode: 429,
      message: input.message,
    },
  });

export const credentialLoginLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de acceso. Espera unos minutos.',
});

export const registrationLimiter = createAuthLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Demasiados registros desde esta conexión. Intenta más tarde.',
});

export const verificationLimiter = createAuthLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Solicitaste demasiados correos. Intenta más tarde.',
});

export const googleLoginLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Demasiados intentos con Google. Espera unos minutos.',
});
