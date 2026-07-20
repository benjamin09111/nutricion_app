import { api } from "@/lib/api";

async function readJsonResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({} as { message?: string }));
    throw new Error(errorData?.message || "Error al procesar la solicitud");
  }

  return res.json() as Promise<T>;
}

export const normalizeMembershipPlansResponse = (value: unknown): MembershipPlan[] => {
  if (Array.isArray(value)) return value as MembershipPlan[];
  if (value && typeof value === "object") {
    const payload = value as { data?: unknown; plans?: unknown; items?: unknown };
    if (Array.isArray(payload.data)) return payload.data as MembershipPlan[];
    if (Array.isArray(payload.plans)) return payload.plans as MembershipPlan[];
    if (Array.isArray(payload.items)) return payload.items as MembershipPlan[];
  }
  return [];
};

export interface MembershipStatus {
  requiresPlanSelection: boolean;
  accountPlan: string;
  hasPendingTransfer?: boolean;
  entitlements: Record<string, boolean | number>;
  usage?: {
    patientsActive: number;
    consultationsUsed: number;
    followupsPrivateActive: number;
    pdfUsed: number;
    aiUsed: number;
    calculatorUsed: number;
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
  status?: "ACTIVE" | "SHARED" | "EXPIRED";
  discountPercent: number;
  isUsed: boolean;
  usedByAccountId: string | null;
  usedAt: string | null;
  archivedAt?: string | null;
  archivedByAdminId?: string | null;
  createdAt: string;
  createdBy: { email: string };
  usedBy?: { email: string } | null;
  archivedBy?: { email: string } | null;
}

export const membershipService = {
  async getStatus(): Promise<MembershipStatus> {
    const res = await api.get("/payments/membership-status");
    return res.json();
  },

  async getActivePlans(): Promise<MembershipPlan[]> {
    const res = await api.get("/memberships/active");
    const data = await res.json();
    return normalizeMembershipPlansResponse(data);
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

  async createFlowCheckout(planId: string, returnPath?: string): Promise<FlowCheckoutResult> {
    const res = await api.post("/payments/flow/checkout", { planId, returnPath });
    return res.json();
  },

  async validateDiscount(planId: string, code: string): Promise<DiscountValidationResult> {
    const res = await api.post("/payments/validate-discount", { planId, code });
    return res.json();
  },

  async createFlowDiscountCheckout(planId: string, discountCode: string, returnPath?: string): Promise<FlowCheckoutResult> {
    const res = await api.post("/payments/flow/discount-checkout", { planId, discountCode, returnPath });
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
    return readJsonResponse<DiscountCodeAdmin[]>(res);
  },

  async listDiscountCodes(params?: {
    type?: string;
    isUsed?: boolean;
    status?: string;
    start?: number;
    limit?: number;
    includeArchived?: boolean;
  }): Promise<{ total: number; data: DiscountCodeAdmin[] }> {
    const query = new URLSearchParams();
    if (params?.type) query.set("type", params.type);
    if (params?.isUsed !== undefined) query.set("isUsed", String(params.isUsed));
    if (params?.status) query.set("status", params.status);
    if (params?.start !== undefined) query.set("start", String(params.start));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.includeArchived !== undefined) query.set("includeArchived", String(params.includeArchived));
    const res = await api.get(`/discount-codes?${query}`);
    return readJsonResponse<{ total: number; data: DiscountCodeAdmin[] }>(res);
  },

  async archiveUsedDiscountCodes(): Promise<{ archivedCount: number; archivedAt: string }> {
    const res = await api.post("/discount-codes/archive-used");
    return readJsonResponse<{ archivedCount: number; archivedAt: string }>(res);
  },

  async setDiscountCodeStatus(codeId: string, status: "SHARED" | "EXPIRED"): Promise<DiscountCodeAdmin> {
    const res = await api.post(`/discount-codes/${codeId}/status`, { status });
    return readJsonResponse<DiscountCodeAdmin>(res);
  },
};
