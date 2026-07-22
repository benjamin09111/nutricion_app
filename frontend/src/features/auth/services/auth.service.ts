import { supabase } from "@/lib/supabase";
import { LoginFormData, RegisterFormData } from "@/lib/schemas/auth";
import { fetchApi } from "@/lib/api-base";
import {
  clearCurrentUser,
  setCurrentUser,
  type CurrentUser,
} from "@/lib/current-user";
import Cookies from "js-cookie";

export function persistAuthSession(
  accessToken: string,
  user?: CurrentUser,
  rememberMe = true,
) {
  const cookieOptions = {
    expires: rememberMe ? 30 : 1,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
  };

  Cookies.set("auth_token", accessToken, cookieOptions);
  localStorage.removeItem("auth_token");
  if (user) setCurrentUser(user);
}

export const authService = {
  async signIn(credentials: LoginFormData) {
    const response = await fetchApi(`/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };

    if (!response.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(" ")
        : data.message || data.error || "Error al iniciar sesión";
      throw new Error(message);
    }

    if (data.access_token) {
      persistAuthSession(
        data.access_token,
        data.user,
        credentials.rememberMe,
      );
    }

    return data;
  },

  async signUp(registration: RegisterFormData) {
    const response = await fetchApi(`/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: registration.fullName.trim(),
        email: registration.email.trim().toLowerCase(),
        password: registration.password,
      }),
    });

    const data = await readAuthResponse(response);
    if (!response.ok) throw new Error(getAuthErrorMessage(data, "No se pudo crear la cuenta"));
    return data;
  },

  async resendVerification(email: string) {
    const response = await fetchApi(`/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    const data = await readAuthResponse(response);
    if (!response.ok) throw new Error(getAuthErrorMessage(data, "No se pudo reenviar el correo"));
    return data;
  },

  async signOut() {
    // Clear Supabase session if any (for future features like calendar integration)
    await supabase.auth.signOut();
    await fetchApi(`/auth/logout`, { method: "POST" }).catch(() => undefined);
    // Clear cookies
    Cookies.remove("auth_token");
    Cookies.remove("auth_token_http");
    localStorage.removeItem("auth_token");
    clearCurrentUser();
  },
};

async function readAuthResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json")
    ? response.json()
    : { message: await response.text() };
}

function getAuthErrorMessage(data: any, fallback: string) {
  if (Array.isArray(data?.message)) return data.message.join(" ");
  return data?.message || data?.error || fallback;
}
