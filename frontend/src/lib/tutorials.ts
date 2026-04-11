import tutorialRegistryData from "@/content/tutorial-registry.json";

export type TutorialStatus = "planned" | "ready" | "disabled";

export interface TutorialRegistryEntry {
  id: string;
  moduleKey: string;
  label: string;
  routePatterns: string[];
  status: TutorialStatus;
}

export interface TutorialLaunchState {
  tutorialId: string;
  moduleKey: string;
  label: string;
  pathname: string;
  activatedAt: string;
  active: boolean;
}

export const TUTORIAL_STATE_STORAGE_KEY = "nutri_active_tutorial";

export const tutorialRegistry =
  tutorialRegistryData as TutorialRegistryEntry[];

const normalizePath = (pathname: string) => {
  if (!pathname) return "/";
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
};

const matchesPattern = (pathname: string, pattern: string) => {
  const normalizedPath = normalizePath(pathname);
  const normalizedPattern = normalizePath(pattern);

  if (normalizedPattern.endsWith("/*")) {
    const prefix = normalizedPattern.slice(0, -2);
    return (
      normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
    );
  }

  return normalizedPath === normalizedPattern;
};

export const getTutorialForPath = (pathname: string) =>
  tutorialRegistry.find((entry) =>
    entry.routePatterns.some((pattern) => matchesPattern(pathname, pattern)),
  );

export const buildTutorialLaunchState = (
  pathname: string,
  tutorial: TutorialRegistryEntry,
  active: boolean,
): TutorialLaunchState => ({
  tutorialId: tutorial.id,
  moduleKey: tutorial.moduleKey,
  label: tutorial.label,
  pathname: normalizePath(pathname),
  activatedAt: new Date().toISOString(),
  active,
});
