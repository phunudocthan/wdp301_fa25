import { toast } from "react-toastify";
import { storage } from "./storage";

const envApi = import.meta.env.VITE_API_URL as string | undefined;
const currentOrigin = window.location.origin.replace(/\/$/, "");
const defaultApiBase = window.location.port === "3000"
  ? "http://localhost:5000/api"
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
      const msg = (data as any)?.message || "Request failed";
      toast.error(msg);
      throw new Error(msg);
    }

    return data;
  } catch (err: any) {
    toast.error(err?.message || "Network error");
    throw err;
  }
}
