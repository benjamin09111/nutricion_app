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
