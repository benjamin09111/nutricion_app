export const normalizeUrl = (value: string) => value.replace(/\/$/, "");

export const resolveRequiredUrl = (
  ...candidates: Array<string | undefined>
) => {
  const value = candidates.find((candidate): candidate is string =>
    Boolean(candidate?.trim()),
  );

  if (!value) {
    throw new Error("Missing required URL configuration");
  }

  return normalizeUrl(value.trim());
};
