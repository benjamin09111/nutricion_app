export type FeatureType = "included" | "excluded" | "new";

export type MembershipFeatureDisplay = {
  label: string;
  isExcluded: boolean;
  isNew: boolean;
  type: FeatureType;
};

export const getMembershipFeatureDisplay = (
  feature: string,
): MembershipFeatureDisplay => {
  const normalized = feature.trim();
  const match = normalized.match(/^([✓✔Xx★✨🔥])\s*(.*)$/);

  if (!match) {
    const excludedMatch = normalized.match(/^sin\s+(.*)$/i);

    if (excludedMatch) {
      return {
        label: excludedMatch[1].trim(),
        isExcluded: true,
        isNew: false,
        type: "excluded",
      };
    }

    const newMatch = normalized.match(/^(?:novedad|nuevo|new)\s+(.*)$/i);

    if (newMatch) {
      return {
        label: newMatch[1].trim(),
        isExcluded: false,
        isNew: true,
        type: "new",
      };
    }

    return {
      label: normalized,
      isExcluded: false,
      isNew: false,
      type: "included",
    };
  }

  const prefix = match[1];
  const isExcluded = prefix.toUpperCase() === "X";
  const isNew = ["★", "✨", "🔥"].includes(prefix);

  return {
    label: match[2].trim(),
    isExcluded,
    isNew,
    type: isExcluded ? "excluded" : isNew ? "new" : "included",
  };
};
