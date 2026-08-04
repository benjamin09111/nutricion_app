"use client";

import { useEffect } from "react";
import { useSubscription } from "@/context/SubscriptionContext";
import { UsageLimitBadge } from "./UsageLimitBadge";

export function ModuleUsageBadges() {
  const { usage, currentPlan, refreshSubscription } = useSubscription();
  const entitlements = currentPlan?.entitlements;
  const pdfLimit = entitlements?.["pdf.exports.total.limit"] ?? entitlements?.["pdf.monthly.limit"];
  const aiLimit = entitlements?.["ai.operations.total.limit"] ?? entitlements?.["ai.calls.limit"];

  useEffect(() => {
    const refreshUsage = () => {
      void refreshSubscription();
    };

    window.addEventListener("membership-usage-updated", refreshUsage);
    return () => window.removeEventListener("membership-usage-updated", refreshUsage);
  }, [refreshSubscription]);

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
