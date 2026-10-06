export function safeString(value, maxLen = 300) {
  if (value == null) return "";
  let s;
  if (typeof value === "string") s = value;
  else if (typeof value === "number" || typeof value === "boolean")
    s = String(value);
  else {
    try { s = JSON.stringify(value); }
    catch { s = "[unserializable]"; }
  }
  if (typeof s !== "string") s = String(s);
  return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
}

export function safeErrorMessage(err) {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err.message != null) return safeString(err.message);
  if (err.error != null) return safeString(err.error);
  return safeString(err);
}
