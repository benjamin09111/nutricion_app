export type MembershipFeatureDisplay = {
  label: string;
  isExcluded: boolean;
};

export const getMembershipFeatureDisplay = (
  feature: string,
): MembershipFeatureDisplay => {
  const normalized = feature.trim();
  const match = normalized.match(/^([✓✔Xx])\s*(.*)$/);

  if (!match) {
    const excludedMatch = normalized.match(/^sin\s+(.*)$/i);

    if (excludedMatch) {
      return {
        label: excludedMatch[1].trim(),
        isExcluded: true,
      };
    }

    return {
      label: normalized,
      isExcluded: false,
    };
  }

  return {
    label: match[2].trim(),
    isExcluded: match[1].toUpperCase() === "X",
  };
};
