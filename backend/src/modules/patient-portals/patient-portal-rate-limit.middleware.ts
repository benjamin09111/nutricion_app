import rateLimit from 'express-rate-limit';

const createPortalLimiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message },
  });

export const portalLoginLimiter = createPortalLimiter(
  15 * 60 * 1000,
  10,
  'Demasiados intentos. Intenta nuevamente más tarde.',
);

export const portalInvitationVerifyLimiter = createPortalLimiter(
  15 * 60 * 1000,
  10,
  'Demasiados intentos. Intenta nuevamente más tarde.',
);

export const portalCodeRotationLimiter = createPortalLimiter(
  60 * 60 * 1000,
  20,
  'Demasiadas rotaciones. Intenta nuevamente más tarde.',
);
