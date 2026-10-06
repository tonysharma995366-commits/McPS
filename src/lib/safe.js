export function toStr(v, fallback = "") {
  if (v == null) return fallback;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    const s = JSON.stringify(v);
    return typeof s === "string" ? s : fallback;
  } catch {
    return fallback;
  }
}

export function safeStr(v, maxLen = 300) {
  const s = toStr(v);
  return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
}

export function errorMsg(err) {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    if (typeof err.message === "string") return err.message;
    if (typeof err.error === "string") return err.error;
    if (typeof err.error === "object" && err.error !== null) {
      if (typeof err.error.message === "string") return err.error.message;
      return safeStr(err.error);
    }
    if (typeof err.detail === "string") return err.detail;
  }
  return safeStr(err);
}

export function safeStartsWith(v, prefix) {
  const s = toStr(v);
  return s.startsWith(toStr(prefix));
}

export function safeIncludes(v, needle) {
  const s = toStr(v);
  return s.includes(toStr(needle));
}

export function safeLower(v) {
  return toStr(v).toLowerCase();
}
