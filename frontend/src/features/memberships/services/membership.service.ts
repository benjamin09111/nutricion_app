import { api } from "@/lib/api";

export interface MembershipStatus {
  requiresPlanSelection: boolean;
  accountPlan: string;
  currentPlan: {
    id: string;
    name: string;
    slug: string;
    price: number;
    features: string[];
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
  isPopular: boolean;
  isActive: boolean;
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

  async selectFreePlan(planId: string): Promise<any> {
    const res = await api.post("/payments/select-free-plan", { planId });
    return res.json();
  },

  async checkout(planId: string): Promise<CheckoutResult> {
    const res = await api.post("/payments/membership-checkout", { planId });
    return res.json();
  },

  async createPreference(planId: string): Promise<{ init_point: string; sandbox_init_point?: string }> {
    const res = await api.post("/payments/create-preference", { planId });
    return res.json();
  },

  async cancelSubscription(): Promise<any> {
    const res = await api.post("/payments/membership/cancel");
    return res.json();
  },

  async resumeSubscription(): Promise<any> {
    const res = await api.post("/payments/membership/resume");
    return res.json();
  },
};
