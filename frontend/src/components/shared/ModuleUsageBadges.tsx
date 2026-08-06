"use client";

import { useEffect } from "react";
import { useSubscription } from "@/context/SubscriptionContext";
import { UsageLimitBadge } from "./UsageLimitBadge";

export function ModuleUsageBadges() {
  const { usage, currentPlan, plan, isDeveloper, refreshSubscription } = useSubscription();
  const currentPrice = Number(currentPlan?.price || 0);
  const isFreemium =
    !isDeveloper &&
    (plan === "free" ||
      currentPrice === 0 ||
      (currentPlan?.slug || "").toLowerCase().includes("free") ||
      (currentPlan?.slug || "").toLowerCase().includes("freemium"));

  useEffect(() => {
    const refreshUsage = () => {
      void refreshSubscription({ silent: true });
    };

    window.addEventListener("membership-usage-updated", refreshUsage);
    return () => window.removeEventListener("membership-usage-updated", refreshUsage);
  }, [refreshSubscription]);

  if (!isFreemium) return null;

  const entitlements = currentPlan?.entitlements;
  const pdfLimit = entitlements?.["pdf.exports.total.limit"] ?? entitlements?.["pdf.monthly.limit"] ?? 6;
  const aiLimit = entitlements?.["ai.operations.total.limit"] ?? entitlements?.["ai.calls.limit"];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <UsageLimitBadge
        label="PDFs generados"
        usage={usage?.pdfUsed ?? 0}
        limit={typeof pdfLimit === "number" ? pdfLimit : undefined}
      />
      <UsageLimitBadge
        label="IA consumida"
        usage={usage?.aiUsed ?? 0}
        limit={typeof aiLimit === "number" ? aiLimit : undefined}
      />
    </div>
  );
}
