import { supabase } from "@/lib/supabase";
import { LoginFormData } from "@/lib/schemas/auth";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const authService = {
  async signIn(credentials: LoginFormData) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al iniciar sesión");
    }

    if (data.access_token) {
      const cookieOptions = {
        expires: credentials.rememberMe ? 30 : 1, // 30 days or 1 day
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
      };

      Cookies.set("auth_token", data.access_token, cookieOptions);
      Cookies.set("user", JSON.stringify(data.user), cookieOptions);

      // Also keep in localStorage for client-side easy access if needed
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  },

  async signOut() {
    // Clear Supabase session if any (for future features like calendar integration)
    await supabase.auth.signOut();
    // Clear cookies
    Cookies.remove("auth_token");
    Cookies.remove("user");
    // Clear local storage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  },

  async updatePassword(data: { currentPassword: string; newPassword: string }) {
    const token =
      Cookies.get("auth_token") || localStorage.getItem("auth_token");

    const response = await fetch(`${API_URL}/auth/update-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Error al actualizar la contraseña");
    }

    return result;
  },
};
