export type MembershipFeatureDisplay = {
  label: string;
  isExcluded: boolean;
};

export const getMembershipFeatureDisplay = (
  feature: string,
): MembershipFeatureDisplay => {
  const normalized = feature.trim();
  const match = normalized.match(/^(✓|X)\s+(.*)$/);

  if (!match) {
    return {
      label: normalized,
      isExcluded: false,
    };
  }

  return {
    label: match[2].trim(),
    isExcluded: match[1] === "X",
  };
};
