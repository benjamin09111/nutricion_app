import rateLimit from 'express-rate-limit';

const createLimiter = (max: number, message: string) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message },
  });

// Public and anonymous write endpoints. Keep this table centralized so policy changes
// do not require searching individual modules.
export const publicPatientIntakeLimiter = createLimiter(
  30,
  'Demasiados envíos. Intenta nuevamente más tarde.',
);
export const bookingRequestLimiter = createLimiter(
  20,
  'Demasiadas solicitudes de reserva. Intenta nuevamente más tarde.',
);
export const publicAppointmentLimiter = createLimiter(
  20,
  'Demasiadas solicitudes de agenda. Intenta nuevamente más tarde.',
);
export const publicInterestLimiter = createLimiter(
  10,
  'Demasiadas solicitudes. Intenta nuevamente más tarde.',
);
export const supportRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: 'Demasiadas solicitudes de soporte. Intenta nuevamente más tarde.',
  },
  skip: (req) => {
    // Only rate-limit unauthenticated POST requests (public landing contact form)
    if (req.method !== 'POST') return true;
    if (req.headers.authorization || req.headers['authorization']) return true;
    return false;
  },
});

// Authentication rate limiters to prevent brute-force and credential stuffing
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: 'Demasiados intentos de inicio de sesión. Por favor intenta de nuevo en 15 minutos.',
  },
  skip: (req) => req.method !== 'POST',
});

export const authRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: 'Demasiados registros desde esta dirección. Intenta nuevamente más tarde.',
  },
  skip: (req) => req.method !== 'POST',
});

// AI Copilot rate limiter to prevent token exhaustion and DoS
export const copilotChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: 'Has alcanzado el límite de mensajes por minuto para el asistente. Espera un momento.',
  },
  skip: (req) => req.method !== 'POST',
});

// Catalog rate limiter to mitigate mass automated scraping of foods and recipes
export const catalogAntiScrapingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: 'Límite de consultas al catálogo alcanzado. Intenta nuevamente en un minuto.',
  },
});

