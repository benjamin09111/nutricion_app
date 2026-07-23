import { InternalServerErrorException } from '@nestjs/common';

export const normalizeUrl = (value: string) => value.replace(/\/$/, '');

export const resolveRequiredUrl = (
  ...candidates: Array<string | undefined>
) => {
  const value = candidates.find((candidate): candidate is string =>
    Boolean(candidate?.trim()),
  );

  if (!value) {
    throw new InternalServerErrorException(
      'Configuración de URL del servidor requerida no disponible en las variables de entorno',
    );
  }

  return normalizeUrl(value.trim());
};
