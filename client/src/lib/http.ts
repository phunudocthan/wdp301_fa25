import { toast } from "react-toastify";
import { storage } from "./storage";
import {
  advanceApiBaseURL,
  getApiBaseURL,
  subscribeApiBaseURL,
} from "../api/axiosInstance";

interface HttpOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

let activeBaseURL = getApiBaseURL();

subscribeApiBaseURL((url) => {
  activeBaseURL = url;
});

const buildUrl = (base: string, path: string) =>
  path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;

const isNetworkError = (error: unknown): error is TypeError =>
  error instanceof TypeError;

export async function http<T = unknown>(
  path: string,
  options: HttpOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const attempted = new Set<string>();
  let baseToUse: string | null = activeBaseURL;
  let lastNetworkError: TypeError | null = null;

  while (baseToUse && !attempted.has(baseToUse)) {
    attempted.add(baseToUse);
    try {
      const res = await fetch(buildUrl(baseToUse, path), {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(storage.getToken()
            ? { Authorization: `Bearer ${storage.getToken()}` }
            : {}),
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
    } catch (error) {
      if (isNetworkError(error)) {
        lastNetworkError = error;
        const nextBase = advanceApiBaseURL(baseToUse);
        if (nextBase && !attempted.has(nextBase)) {
          baseToUse = nextBase;
          continue;
        }
        break;
      }

      const message =
        (error as any)?.message ||
        "Đã xảy ra lỗi, vui lòng thử lại sau";
      toast.error(message);
      if (error instanceof Error) {
        error.message = message;
        throw error;
      }
      throw new Error(message);
    }
  }

  const message =
    lastNetworkError?.message || "Không thể kết nối tới máy chủ";
  toast.error(message);
  if (lastNetworkError) {
    lastNetworkError.message = message;
    throw lastNetworkError;
  }
  throw new Error(message);
}
