"use client";

import { useSubscription } from "@/context/SubscriptionContext";

type FeatureGateProps = {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function FeatureGate({
  featureKey,
  children,
  fallback = null,
}: FeatureGateProps) {
  const { can } = useSubscription();

  if (!can(featureKey)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
