import Cookies from "js-cookie";

export type CurrentUser = {
  [key: string]: any;
  id?: string;
  email?: string;
  role?: string;
  googleAvatarUrl?: string | null;
  createdAt?: string | null;
  nutritionist?: {
    id?: string;
    fullName?: string;
    settings?: Record<string, any>;
  } | null;
  plan?: string;
  planName?: string;
  currentPlan?: Record<string, any> | null;
  subscription?: Record<string, any> | null;
  usage?: Record<string, any> | null;
  billing?: Record<string, any> | null;
  membershipSelected?: boolean;
  requiresPlanSelection?: boolean;
};

export const getCurrentUser = (): CurrentUser | null => {
  const raw = Cookies.get("user");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: CurrentUser) => {
  Cookies.set("user", JSON.stringify(user), {
    expires: 30,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

export const clearCurrentUser = () => {
  Cookies.remove("user");
};
