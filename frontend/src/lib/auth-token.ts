import Cookies from "js-cookie";

export const getAuthToken = () =>
  Cookies.get("auth_token") ||
  (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null) ||
  "";
