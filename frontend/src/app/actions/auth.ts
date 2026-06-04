"use server";

import { RegisterFormData, registerSchema } from "@/lib/schemas/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:3001";

export async function sendRegistrationRequest(data: RegisterFormData) {
  const result = registerSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: "Datos inválidos" };
  }

  const { name, email, description } = result.data;

  try {
    const response = await fetch(`${BACKEND_URL}/auth/request-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message: description }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Error ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Request access error:", error);
    return { success: false, error: "Error al enviar solicitud" };
  }
}
