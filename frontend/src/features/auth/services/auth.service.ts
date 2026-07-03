import { supabase } from "@/lib/supabase";
import { LoginFormData } from "@/lib/schemas/auth";
import { fetchApi } from "@/lib/api-base";
import { clearCurrentUser, setCurrentUser } from "@/lib/current-user";
import Cookies from "js-cookie";

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
      const cookieOptions = {
        expires: credentials.rememberMe ? 30 : 1,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
      };

      Cookies.set("auth_token", data.access_token, cookieOptions);
      localStorage.setItem("auth_token", data.access_token);

      if (data.user) {
        setCurrentUser(data.user);
      }
    }

    return data;
  },

  async signOut() {
    // Clear Supabase session if any (for future features like calendar integration)
    await supabase.auth.signOut();
    await fetchApi(`/auth/logout`, { method: "POST" }).catch(() => undefined);
    // Clear cookies
    Cookies.remove("auth_token");
    Cookies.remove("auth_token_http");
    clearCurrentUser();
  },
};
