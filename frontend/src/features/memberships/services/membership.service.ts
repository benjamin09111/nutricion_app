import { api } from "@/lib/api";

export interface MembershipStatus {
  requiresPlanSelection: boolean;
  accountPlan: string;
  entitlements: Record<string, boolean | number>;
  usage?: {
    patientsActive: number;
    consultationsMonthly: number;
    pdfMonthly: number;
    aiMonthly: number;
  };
  billing?: {
    nextPaymentAt: string | null;
    nextPaymentAmount: number;
    currency: string;
  };
  currentPlan: {
    id: string;
    name: string;
    slug: string;
    key?: string;
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
  paymentUrl?: string;
  proratedCredit?: number;
  chargedAmount?: number;
}

export interface FlowCheckoutResult {
  provider: "FLOW";
  paymentUrl: string;
  token: string;
  flowOrder: number;
  paymentId: string;
}

export interface MembershipActivationSnapshot {
  accountPlan: string;
  role: string;
  requiresPlanSelection: boolean;
  currentPlan: MembershipStatus["currentPlan"];
  entitlements: Record<string, boolean | number>;
  usage?: MembershipStatus["usage"];
  billing?: MembershipStatus["billing"];
  subscription: MembershipStatus["subscription"];
}

export interface FreePlanSelectionResult {
  payment: unknown;
  plan: { id: string; name: string; slug: string };
  membershipStatus: MembershipActivationSnapshot | null;
}

export interface DiscountValidationResult {
  valid: boolean;
  code: string;
  type: string;
  discountPercent: number;
  originalPrice: number;
  proratedCredit: number;
  basePrice: number;
  finalPrice: number;
  currency: string;
}

export interface DiscountCodeAdmin {
  id: string;
  code: string;
  type: string;
  discountPercent: number;
  isUsed: boolean;
  usedByAccountId: string | null;
  usedAt: string | null;
  createdAt: string;
  createdBy: { email: string };
  usedBy?: { email: string } | null;
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

  async selectFreePlan(planId: string): Promise<FreePlanSelectionResult> {
    const res = await api.post("/payments/select-free-plan", { planId });
    return res.json();
  },

  async checkout(planId: string): Promise<CheckoutResult> {
    const res = await api.post("/payments/membership-checkout", { planId });
    return res.json();
  },

  async devChangePlan(planId: string): Promise<{ success: boolean; plan: { id: string; name: string; slug: string }; membershipStatus?: MembershipActivationSnapshot | null }> {
    const res = await api.post("/payments/dev/change-plan", { planId });
    return res.json();
  },

  async createFlowCheckout(planId: string): Promise<FlowCheckoutResult> {
    const res = await api.post("/payments/flow/checkout", { planId });
    return res.json();
  },

  async validateDiscount(planId: string, code: string): Promise<DiscountValidationResult> {
    const res = await api.post("/payments/validate-discount", { planId, code });
    return res.json();
  },

  async createFlowDiscountCheckout(planId: string, discountCode: string): Promise<FlowCheckoutResult> {
    const res = await api.post("/payments/flow/discount-checkout", { planId, discountCode });
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

  async consumeQuota(featureKey: string, amount = 1): Promise<{ usageCount: number | null; limit: number }> {
    const res = await api.post("/permissions/consume", { featureKey, amount });
    return res.json();
  },

  // ─── Discount Codes (Admin) ────────────────────────────────────

  async generateDiscountCodes(type: string, count: number): Promise<DiscountCodeAdmin[]> {
    const res = await api.post("/discount-codes/generate", { type, count });
    return res.json();
  },

  async listDiscountCodes(params?: {
    type?: string;
    isUsed?: boolean;
    start?: number;
    limit?: number;
  }): Promise<{ total: number; data: DiscountCodeAdmin[] }> {
    const query = new URLSearchParams();
    if (params?.type) query.set("type", params.type);
    if (params?.isUsed !== undefined) query.set("isUsed", String(params.isUsed));
    if (params?.start !== undefined) query.set("start", String(params.start));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    const res = await api.get(`/discount-codes?${query}`);
    return res.json();
  },
};
