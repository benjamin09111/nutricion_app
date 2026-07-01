export const normalizePath = (pathname: string) => {
  if (!pathname) return "/";
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
};

export const matchesPattern = (pathname: string, pattern: string) => {
  const normalizedPath = normalizePath(pathname);
  const normalizedPattern = normalizePath(pattern);

  if (normalizedPattern.endsWith("/*")) {
    const prefix = normalizedPattern.slice(0, -2);
    return (
      normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
    );
  }

  if (normalizedPattern.includes(":")) {
    const pathSegments = normalizedPath.split("/").filter(Boolean);
    const patternSegments = normalizedPattern.split("/").filter(Boolean);

    if (pathSegments.length !== patternSegments.length) {
      return false;
    }

    return patternSegments.every((segment, index) => {
      if (segment.startsWith(":")) {
        return pathSegments[index]?.length > 0;
      }

      return pathSegments[index] === segment;
    });
  }

  return normalizedPath === normalizedPattern;
};
