import { toast } from "react-toastify";
import { storage } from "./storage";

const envApi = import.meta.env.VITE_API_URL as string | undefined;
const currentOrigin = window.location.origin.replace(/\/$/, "");
const defaultApiBase = window.location.port === "3000"
  ? "http://localhost:5001/api"
  : `${currentOrigin}/api`;
const API_BASE = (envApi && envApi.trim().length > 0 ? envApi : defaultApiBase).replace(/\/$/, "");

interface HttpOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function http<T = unknown>(path: string, options: HttpOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const url = path.startsWith("/") ? `${API_BASE}${path}` : `${API_BASE}/${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(storage.getToken() ? { Authorization: `Bearer ${storage.getToken()}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data: T = await res.json().catch(() => ({} as T));

    if (!res.ok) {
      const raw = data as any;
      const msg = raw?.message || raw?.msg || "Request failed";
      throw new Error(msg);
    }

    return data;
  } catch (err: any) {
    const message = err?.message || "Network error";
    toast.error(message);
    if (err instanceof Error) {
      err.message = message;
      throw err;
    }
    throw new Error(message);
  }
}
