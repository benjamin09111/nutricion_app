export function getPdfQuotaKey(
  type: string,
  data: unknown,
  explicitKey?: string,
): string {
  if (explicitKey?.trim()) return `${type}:${explicitKey.trim()}`;

  if (data && typeof data === "object") {
    const record = data as { id?: unknown; creationId?: unknown };
    const identity = record.creationId || record.id;
    if (typeof identity === "string" && identity.trim()) {
      return `${type}:${identity.trim()}`;
    }
  }

  const source = JSON.stringify(
    data && typeof data === "object"
      ? Object.fromEntries(
          Object.entries(data).filter(([key]) => key !== "generatedAt"),
        )
      : data,
  ) ?? String(data);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `${type}:content-${(hash >>> 0).toString(16)}`;
}
