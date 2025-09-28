import { toast } from "react-toastify";
import { storage } from "./storage";

// API base URL lấy từ .env (vite)
const API_BASE: string = import.meta.env.VITE_API_URL;

/**
 * Options cho http request
 */
interface HttpOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Hàm gọi API với fetch wrapper
 * @param path - endpoint (vd: "/auth/login")
 * @param options - method, body, headers
 */
export async function http<T = any>(path: string, options: HttpOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
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
    // Bắt lỗi mạng
    toast.error(err.message || "Network error");
    throw err;
  }
}
