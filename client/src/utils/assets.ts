import {
  getApiOriginURL,
  subscribeApiBaseURL,
} from "../api/axiosInstance";

let currentOrigin = getApiOriginURL();

subscribeApiBaseURL((base) => {
  currentOrigin = base.replace(/\/api$/, "");
});

const joinPaths = (origin: string, path: string) => {
  if (!origin.endsWith("/") && !path.startsWith("/")) {
    return `${origin}/${path}`;
  }
  if (origin.endsWith("/") && path.startsWith("/")) {
    return `${origin}${path.slice(1)}`;
  }
  return `${origin}${path}`;
};

const shouldRewriteOrigin = (url: URL, target: URL) => {
  if (url.origin === target.origin) return false;
  if (url.hostname === target.hostname) return true;
  const localhostHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  return localhostHosts.has(url.hostname) && localhostHosts.has(target.hostname);
};

export const resolveAssetUrl = (input?: string | null): string => {
  if (!input || typeof input !== "string") return "";

  const trimmed = input.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const target = new URL(currentOrigin);
      if (shouldRewriteOrigin(url, target)) {
        const path = url.pathname || "/";
        const combined = joinPaths(target.origin, path);
        return `${combined}${url.search || ""}${url.hash || ""}`;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  if (trimmed.startsWith("/")) {
    return joinPaths(currentOrigin, trimmed);
  }

  return joinPaths(currentOrigin, trimmed);
};
