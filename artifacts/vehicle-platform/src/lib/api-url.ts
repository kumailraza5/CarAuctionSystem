import { getBaseUrl } from "@workspace/api-client-react";

/** Resolves `/api/...` for fetch: uses configured API origin, else current browser origin (Vite proxy in dev). */
export function resolveApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const configured = getBaseUrl();
  if (configured) {
    return `${configured}${p}`;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${p}`;
  }
  return p;
}

/**
 * Stored vehicle images may be `/uploads/vehicles/...` (API-relative). Browsers request that against the
 * page origin, which breaks when the UI is on another host than the API. Use this for `<img src>`.
 */
export function resolveMediaUrl(pathOrUrl: string): string {
  const s = pathOrUrl.trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  const configured = getBaseUrl();
  if (configured) {
    return `${configured}${path}`;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}
