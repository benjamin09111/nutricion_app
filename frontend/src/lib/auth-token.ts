import Cookies from "js-cookie";

export const getAuthToken = () =>
  Cookies.get("auth_token") || "";
