import Cookies from "js-cookie";

export type CurrentUser = {
  [key: string]: any;
  id?: string;
  email?: string;
  role?: string;
  rut?: string | null;
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

// SEGURIDAD: la cookie "user" es escribible desde el navegador, así que NUNCA
// puede contener datos de autorización. El rol se elimina al guardar y al leer;
// la única fuente válida del rol es el backend (`/auth/me`, `/auth/session-role`).
const stripAuthorizationFields = (user: CurrentUser): CurrentUser => {
  const { role, entitlements, ...safe } = user as CurrentUser & {
    entitlements?: unknown;
  };
  void role;
  void entitlements;
  return safe;
};

export const getCurrentUser = (): CurrentUser | null => {
  const raw = Cookies.get("user");

  if (!raw) {
    return null;
  }

  try {
    return stripAuthorizationFields(JSON.parse(raw) as CurrentUser);
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: CurrentUser) => {
  Cookies.set("user", JSON.stringify(stripAuthorizationFields(user)), {
    expires: 30,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

export const clearCurrentUser = () => {
  Cookies.remove("user");
};
