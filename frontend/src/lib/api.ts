import { fetchApi } from "./api-base";
import { getAuthToken } from "./auth-token";

export const api = {
  async get(path: string, options?: RequestInit) {
    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const response = await fetchApi(path, {
      ...options,
      cache: options?.cache ?? "no-store",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    return response;
  },

  async post(path: string, body?: any, options?: RequestInit) {
    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const response = await fetchApi(path, {
      ...options,
      cache: options?.cache ?? "no-store",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return response;
  },

  async put(path: string, body?: any, options?: RequestInit) {
    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const response = await fetchApi(path, {
      ...options,
      cache: options?.cache ?? "no-store",
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return response;
  },

  async delete(path: string, options?: RequestInit) {
    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const response = await fetchApi(path, {
      ...options,
      cache: options?.cache ?? "no-store",
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    return response;
  },
};
