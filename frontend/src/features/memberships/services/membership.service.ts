import { api } from "@/lib/api";

export interface MembershipStatus {
  requiresPlanSelection: boolean;
  accountPlan: string;
  entitlements: Record<string, boolean | number>;
  currentPlan: {
    id: string;
    name: string;
    slug: string;
    price: number;
    features: string[];
    entitlements?: Record<string, boolean | number>;
  } | null;
  subscription: {
    status: string | null;
    startDate: string | null;
    endDate: string | null;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
    daysRemaining: number | null;
  } | null;
}

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  billingPeriod: string;
  features: string[];
  entitlements?: Record<string, boolean | number>;
  isPopular: boolean;
  isActive: boolean;
  displayOrder?: number;
}

export interface CheckoutResult {
  mock: boolean;
  success: boolean;
  redirectUrl?: string;
  init_point?: string;
  proratedCredit?: number;
  chargedAmount?: number;
}

export const membershipService = {
  async getStatus(): Promise<MembershipStatus> {
    const res = await api.get("/payments/membership-status");
    return res.json();
  },

  async getActivePlans(): Promise<MembershipPlan[]> {
    const res = await api.get("/memberships/active");
    return res.json();
  },

  async selectFreePlan(planId: string): Promise<unknown> {
    const res = await api.post("/payments/select-free-plan", { planId });
    return res.json();
  },

  async checkout(planId: string): Promise<CheckoutResult> {
    const res = await api.post("/payments/membership-checkout", { planId });
    return res.json();
  },

  async devChangePlan(planId: string): Promise<{ success: boolean; plan: { id: string; name: string; slug: string } }> {
    const res = await api.post("/payments/dev/change-plan", { planId });
    return res.json();
  },

  async createPreference(planId: string): Promise<{ init_point: string; sandbox_init_point?: string }> {
    const res = await api.post("/payments/create-preference", { planId });
    return res.json();
  },

  async cancelSubscription(): Promise<unknown> {
    const res = await api.post("/payments/membership/cancel");
    return res.json();
  },

  async resumeSubscription(): Promise<unknown> {
    const res = await api.post("/payments/membership/resume");
    return res.json();
  },
};
