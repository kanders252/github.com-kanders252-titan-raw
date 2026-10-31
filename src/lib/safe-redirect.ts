/** Only same-origin relative paths; rejects //host, /\\host and absolute URLs. */
export function safeCallback(url: string | undefined): string {
  if (!url || !url.startsWith("/") || url.includes("\\")) return "/";
  try {
    const parsed = new URL(url, "http://local.invalid");
    if (parsed.origin !== "http://local.invalid") return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}
