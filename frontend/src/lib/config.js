export const API_URL = import.meta.env.VITE_API_URL || "";

export const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (typeof window !== "undefined"
    ? window.location.origin.replace(/^http/, "ws")
    : "");
